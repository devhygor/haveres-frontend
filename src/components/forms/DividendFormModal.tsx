import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/common/Modal";
import { dividendsApi } from "@/api/dividends";
import { assetsApi, ASSET_TYPES, type Asset } from "@/api/assets";
import { useAuthStore } from "@/stores/authStore";
import type { Dividend } from "@/types/dividend";

const DIVIDEND_TYPES = [
  { value: "DIVIDEND", label: "Dividendo" },
  { value: "JCP", label: "JCP" },
  { value: "FII_INCOME", label: "Rendimento FII" },
  { value: "AMORTIZATION", label: "Amortização" },
  { value: "SUBSCRIPTION_RIGHTS", label: "Direito de Subscrição" },
  { value: "OTHER", label: "Outro" },
];

interface FormState {
  asset_id: string;
  dividend_type: string;
  ex_date: string;
  payment_date: string;
  quantity_held: string;
  value_per_share: string;
  ir_withheld: string;
  notes: string;
}

interface NewAsset {
  ticker: string;
  name: string;
  asset_type: string;
}

const today = () => new Date().toISOString().split("T")[0];

const DEFAULT_FORM: FormState = {
  asset_id: "", dividend_type: "DIVIDEND", ex_date: today(),
  payment_date: "", quantity_held: "", value_per_share: "", ir_withheld: "0", notes: "",
};

const DEFAULT_NEW_ASSET: NewAsset = { ticker: "", name: "", asset_type: "FII" };

interface Props {
  open: boolean;
  onClose: () => void;
  dividend?: Dividend;
}

const INPUT = "w-full bg-secondary border border-haveres-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-haveres-blue";
const LABEL = "block text-xs text-muted-foreground mb-1";

function parseLocaleNumber(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return NaN;
  if (trimmed.includes(",")) {
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }
  return Number(trimmed);
}

function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  const unsigned = sign ? cleaned.slice(1) : cleaned;
  const withoutExtraSigns = unsigned.replace(/-/g, "");
  const parts = withoutExtraSigns.split(/[.,]/);
  if (parts.length <= 1) return sign + withoutExtraSigns;
  return `${sign}${parts[0]},${parts.slice(1).join("")}`;
}

function assetLabel(asset: Asset): string {
  return `${asset.ticker} - ${asset.name}`;
}

const ASSET_TYPE_KEYWORDS: Array<{ type: string; keywords: string[] }> = [
  { type: "STOCK", keywords: ["acao", "acoes", "stock", "stocks"] },
  { type: "FII", keywords: ["fii", "fundo imobiliario", "fundos imobiliarios"] },
  { type: "ETF", keywords: ["etf", "etfs"] },
  { type: "BDR", keywords: ["bdr", "bdrs"] },
  { type: "FIXED_INCOME", keywords: ["renda fixa", "fixed income", "fixed"] },
  { type: "TREASURY", keywords: ["tesouro", "tesouro direto", "treasury"] },
  { type: "CASH", keywords: ["caixa", "cash"] },
  { type: "CRYPTO", keywords: ["cripto", "criptomoeda", "crypto"] },
];

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function detectAssetTypeFilter(search: string): string | null {
  if (!search) return null;
  const match = ASSET_TYPE_KEYWORDS.find((entry) => entry.keywords.some((keyword) => search.includes(keyword)));
  return match?.type ?? null;
}

function formatDecimalForInput(value: number, precision = 8): string {
  const fixed = value.toFixed(precision).replace(/\.?0+$/, "");
  return fixed.replace(".", ",");
}

export function DividendFormModal({ open, onClose, dividend }: Props) {
  const qc = useQueryClient();
  const isEditing = !!dividend;
  const user = useAuthStore((s) => s.user);
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [newAsset, setNewAsset] = useState<NewAsset>(DEFAULT_NEW_ASSET);
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetMenuOpen, setAssetMenuOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        dividend
          ? {
              asset_id: dividend.asset_id,
              dividend_type: dividend.dividend_type,
              ex_date: dividend.ex_date,
              payment_date: dividend.payment_date ?? "",
              quantity_held: String(dividend.quantity_held),
              value_per_share: String(dividend.value_per_share),
              ir_withheld: String(dividend.ir_withheld),
              notes: dividend.notes,
            }
          : { ...DEFAULT_FORM, ex_date: today() }
      );
      setShowNewAsset(false);
      setAssetSearch(dividend ? `${dividend.asset_ticker} - ${dividend.asset_name}` : "");
      setAssetMenuOpen(false);
      setNewAsset(DEFAULT_NEW_ASSET);
      setError("");
    }
  }, [open, dividend]);

  const assets = useQuery({ queryKey: ["assets"], queryFn: () => assetsApi.list().then(r => r.data) });
  const assetsList = assets.data ?? [];

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setNA = (k: keyof NewAsset, v: string) => setNewAsset(f => ({ ...f, [k]: v }));

  const createAsset = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      set("asset_id", r.data.id);
      setAssetSearch(assetLabel(r.data));
      setShowNewAsset(false);
      setAssetMenuOpen(false);
      setNewAsset(DEFAULT_NEW_ASSET);
      setError("");
    },
    onError: () => setError("Erro ao cadastrar ativo."),
  });

  useEffect(() => {
    if (!form.asset_id) return;
    const selected = assetsList.find((a) => a.id === form.asset_id);
    if (!selected) return;
    setAssetSearch(assetLabel(selected));
  }, [form.asset_id, assetsList]);

  const save = useMutation({
    mutationFn: (payload: object) =>
      isEditing
        ? dividendsApi.update(dividend!.id, payload)
        : dividendsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },
    onError: () => setError("Erro ao salvar. Verifique os dados e tente novamente."),
  });

  const handleAddAsset = () => {
    if (!isAdmin) {
      setError("Apenas administradores podem cadastrar novos ativos.");
      return;
    }
    if (!newAsset.ticker.trim() || !newAsset.name.trim()) {
      setError("Preencha ticker e nome do ativo.");
      return;
    }
    setError("");
    createAsset.mutate({ ticker: newAsset.ticker.toUpperCase(), name: newAsset.name, asset_type: newAsset.asset_type });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.asset_id) { setError("Selecione um ativo."); return; }
    const quantityHeld = parseLocaleNumber(form.quantity_held);
    const valuePerShare = parseLocaleNumber(form.value_per_share);
    const irWithheld = parseLocaleNumber(form.ir_withheld || "0");

    if (!form.quantity_held || Number.isNaN(quantityHeld)) { setError("Informe uma quantidade válida."); return; }
    if (!form.value_per_share || Number.isNaN(valuePerShare)) { setError("Informe um valor por ação válido."); return; }
    if (Number.isNaN(irWithheld)) { setError("Informe um IR válido."); return; }

    save.mutate({
      asset_id: form.asset_id,
      dividend_type: form.dividend_type,
      ex_date: form.ex_date,
      payment_date: form.payment_date || null,
      quantity_held: quantityHeld,
      value_per_share: valuePerShare,
      ir_withheld: irWithheld,
      notes: form.notes,
    });
  };

  const adjustQuantity = (delta: number) => {
    const current = parseLocaleNumber(form.quantity_held || "0");
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    set("quantity_held", formatDecimalForInput(next));
  };

  const gross = (parseLocaleNumber(form.quantity_held || "0") || 0) * (parseLocaleNumber(form.value_per_share || "0") || 0);
  const net = gross - (parseLocaleNumber(form.ir_withheld || "0") || 0);
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const search = normalizeText(assetSearch.trim());
  const assetTypeFilter = detectAssetTypeFilter(search);
  const filteredAssets = assetsList
    .filter((asset) => {
      if (!search) return true;
      const searchable = normalizeText(`${asset.ticker} ${asset.name} ${asset.asset_type} ${asset.asset_type_display}`);
      if (assetTypeFilter && asset.asset_type === assetTypeFilter) return true;
      return searchable.includes(search);
    })
    .sort((a, b) => {
      if (!search) return a.ticker.localeCompare(b.ticker);
      const aTicker = normalizeText(a.ticker);
      const bTicker = normalizeText(b.ticker);
      const aName = normalizeText(a.name);
      const bName = normalizeText(b.name);
      const aStarts = aTicker.startsWith(search) || aName.startsWith(search);
      const bStarts = bTicker.startsWith(search) || bName.startsWith(search);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.ticker.localeCompare(b.ticker);
    });

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar Provento" : "Novo Provento"}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Ativo */}
        <div>
          <label className={LABEL}>Ativo *</label>
          <div className="relative">
            <input
              className={INPUT}
              placeholder="Digite o código ou nome do ativo..."
              value={assetSearch}
              onFocus={() => setAssetMenuOpen(true)}
              onBlur={() => window.setTimeout(() => setAssetMenuOpen(false), 120)}
              onChange={(e) => {
                setAssetSearch(e.target.value);
                setAssetMenuOpen(true);
                setShowNewAsset(false);
                if (form.asset_id) set("asset_id", "");
              }}
            />

            {assetMenuOpen && (
              <div className="absolute z-30 mt-1 w-full rounded-lg border border-haveres-border bg-haveres-card shadow-xl max-h-56 overflow-y-auto">
                {filteredAssets.slice(0, 30).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-secondary/70 transition-colors"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      set("asset_id", asset.id);
                      setAssetSearch(assetLabel(asset));
                      setAssetMenuOpen(false);
                      setShowNewAsset(false);
                    }}
                  >
                    <span className="font-mono font-medium">{asset.ticker}</span>
                    <span className="text-muted-foreground"> - {asset.name}</span>
                  </button>
                ))}

                {!filteredAssets.length && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum ativo encontrado.</p>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs text-haveres-blue border-t border-haveres-border hover:bg-secondary/70 transition-colors"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setShowNewAsset(true);
                      set("asset_id", "");
                      setAssetMenuOpen(false);
                    }}
                  >
                    + Cadastrar novo ativo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isAdmin && showNewAsset && (
          <div className="bg-secondary/40 border border-haveres-border rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-haveres-blue">Cadastrar ativo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Código *</label>
                <input
                  className={INPUT}
                  placeholder="Ex: KNRI11"
                  value={newAsset.ticker}
                  onChange={e => setNA("ticker", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className={LABEL}>Tipo *</label>
                <select className={INPUT} value={newAsset.asset_type} onChange={e => setNA("asset_type", e.target.value)}>
                  {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Nome completo *</label>
              <input
                className={INPUT}
                placeholder="Ex: Kinea Renda Imobiliária"
                value={newAsset.name}
                onChange={e => setNA("name", e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleAddAsset}
              disabled={createAsset.isPending}
              className="text-xs font-medium text-haveres-blue hover:underline disabled:opacity-50"
            >
              {createAsset.isPending ? "Salvando..." : "Salvar ativo"}
            </button>
          </div>
        )}

        {/* Tipo + Data com */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Tipo *</label>
            <select className={INPUT} value={form.dividend_type} onChange={e => set("dividend_type", e.target.value)}>
              {DIVIDEND_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Data com *</label>
            <input type="date" className={INPUT} value={form.ex_date} onChange={e => set("ex_date", e.target.value)} required />
          </div>
        </div>

        {/* Data de pagamento */}
        <div>
          <label className={LABEL}>Data de Pagamento</label>
          <input type="date" className={INPUT} value={form.payment_date} onChange={e => set("payment_date", e.target.value)} />
        </div>

        {/* Quantidade + Valor/ação */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Quantidade na data com *</label>
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
                className="px-3 rounded-lg border border-haveres-border bg-secondary text-white hover:border-white/30 transition-colors"
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <input
                type="text"
                inputMode="decimal"
                className={`${INPUT} text-center`}
                placeholder="Ex: 1 ou 1,001"
                value={form.quantity_held}
                onChange={e => set("quantity_held", sanitizeDecimalInput(e.target.value))}
                required
              />
              <button
                type="button"
                onClick={() => adjustQuantity(1)}
                className="px-3 rounded-lg border border-haveres-border bg-secondary text-white hover:border-white/30 transition-colors"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>Valor por ação (R$) *</label>
            <input
              type="number" step="0.000001" min="0"
              className={INPUT}
              placeholder="0,000000"
              value={form.value_per_share}
              onChange={e => set("value_per_share", e.target.value)}
              required
            />
          </div>
        </div>

        {/* IR */}
        <div>
          <label className={LABEL}>IR Retido na Fonte (R$)</label>
          <input
            type="number" step="0.01" min="0"
            className={INPUT}
            placeholder="0,00"
            value={form.ir_withheld}
            onChange={e => set("ir_withheld", e.target.value)}
          />
        </div>

        {/* Preview */}
        {form.quantity_held && form.value_per_share && (
          <div className="bg-secondary/40 rounded-lg px-4 py-3 flex justify-between text-xs">
            <span className="text-muted-foreground">
              Bruto: <span className="text-gain font-numeric font-medium">{fmt(gross)}</span>
            </span>
            <span className="text-muted-foreground">
              Líquido: <span className="text-white font-numeric font-medium">{fmt(net)}</span>
            </span>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className={LABEL}>Observações</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={2}
            placeholder="Opcional..."
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-loss">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-haveres-border text-sm text-muted-foreground hover:text-white hover:border-white/30 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="flex-1 py-2 rounded-lg bg-haveres-blue text-white text-sm font-medium hover:bg-haveres-blue-dark transition-colors disabled:opacity-50"
          >
            {save.isPending ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
