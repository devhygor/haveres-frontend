import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { SourceBadge } from "@/components/common/SourceBadge";
import { transactionsApi, type CreateTransactionPayload } from "@/api/transactions";
import { assetsApi, ASSET_TYPES, type Asset } from "@/api/assets";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Transaction, DuplicateTransactionResponse } from "@/types/transaction";

const TRANSACTION_TYPES = [
  { value: "BUY", label: "Compra" },
  { value: "SELL", label: "Venda" },
  { value: "SPLIT", label: "Desdobramento" },
  { value: "REVERSE_SPLIT", label: "Grupamento" },
  { value: "BONUS", label: "Bonificação" },
  { value: "SUBSCRIPTION", label: "Subscrição" },
  { value: "AMORTIZATION", label: "Amortização" },
  { value: "TRANSFER_IN", label: "Transferência Entrada" },
  { value: "TRANSFER_OUT", label: "Transferência Saída" },
  { value: "FEE", label: "Taxa/Custo" },
];

function getFields(type: string) {
  return {
    showQuantity: !["FEE", "SPLIT", "REVERSE_SPLIT"].includes(type),
    showFactor: ["SPLIT", "REVERSE_SPLIT"].includes(type),
    showPrice: ["BUY", "SELL", "SUBSCRIPTION", "AMORTIZATION", "TRANSFER_IN", "TRANSFER_OUT"].includes(type),
    showFees: ["BUY", "SELL", "SUBSCRIPTION", "FEE"].includes(type),
    showBroker: ["BUY", "SELL", "SUBSCRIPTION"].includes(type),
  };
}

interface FormState {
  asset_id: string;
  transaction_type: string;
  date: string;
  quantity: string;
  price: string;
  fees: string;
  factor: string;
  broker_id: string;
  notes: string;
}

interface NewAsset {
  ticker: string;
  name: string;
  asset_type: string;
}

const today = () => new Date().toISOString().split("T")[0];

const DEFAULT_FORM: FormState = {
  asset_id: "", transaction_type: "BUY", date: today(),
  quantity: "", price: "", fees: "0", factor: "2", broker_id: "", notes: "",
};

const DEFAULT_NEW_ASSET: NewAsset = { ticker: "", name: "", asset_type: "STOCK" };

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
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

function formatMoneyFromNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function maskMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return formatMoneyFromNumber(amount);
}

export function TransactionFormModal({ open, onClose, transaction }: Props) {
  const qc = useQueryClient();
  const isEditing = !!transaction;
  const user = useAuthStore((s) => s.user);
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [newAsset, setNewAsset] = useState<NewAsset>(DEFAULT_NEW_ASSET);
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetMenuOpen, setAssetMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<DuplicateTransactionResponse | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateTransactionPayload | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        transaction
          ? {
              asset_id: transaction.asset_id,
              transaction_type: transaction.transaction_type,
              date: transaction.date,
              quantity: String(transaction.quantity),
              price: formatMoneyFromNumber(Number(transaction.price)),
              fees: String(transaction.fees),
              factor: String(transaction.factor),
              broker_id: transaction.broker_id ?? "",
              notes: transaction.notes,
            }
          : { ...DEFAULT_FORM, date: today() }
      );
      setShowNewAsset(false);
      setAssetSearch(transaction ? `${transaction.asset_ticker} - ${transaction.asset_name}` : "");
      setAssetMenuOpen(false);
      setNewAsset(DEFAULT_NEW_ASSET);
      setError("");
      setDuplicate(null);
      setPendingPayload(null);
    }
  }, [open, transaction]);

  const assets = useQuery({ queryKey: ["assets"], queryFn: () => assetsApi.list().then(r => r.data) });
  const brokers = useQuery({ queryKey: ["brokers"], queryFn: () => transactionsApi.listBrokers().then(r => r.data) });
  const portfolioSummary = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: () => portfolioApi.getSummary().then((r) => r.data),
    enabled: open,
  });
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
    mutationFn: (payload: CreateTransactionPayload | Partial<Transaction>) =>
      isEditing
        ? transactionsApi.update(transaction!.id, payload as Partial<Transaction>)
        : transactionsApi.create(payload as CreateTransactionPayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },
    onError: (err: any) => {
      if (!isEditing && err?.response?.status === 409) {
        const data: DuplicateTransactionResponse = err.response.data;
        setDuplicate(data);
        return;
      }
      setError("Erro ao salvar. Verifique os dados e tente novamente.");
    },
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
    setDuplicate(null);
    if (!form.asset_id) { setError("Selecione um ativo."); return; }

    const { showQuantity, showFactor, showPrice, showFees } = getFields(form.transaction_type);
    const quantity = showQuantity ? parseLocaleNumber(form.quantity) : 0;
    const price = showPrice ? parseLocaleNumber(form.price) : 0;
    const fees = showFees ? parseLocaleNumber(form.fees || "0") : 0;
    const factor = showFactor ? parseLocaleNumber(form.factor || "1") : 1;

    if (showQuantity && (!form.quantity || Number.isNaN(quantity))) { setError("Informe uma quantidade válida."); return; }
    if (showPrice && (!form.price || Number.isNaN(price))) { setError("Informe um preço válido."); return; }
    if (showFactor && (!form.factor || Number.isNaN(factor))) { setError("Informe um fator válido."); return; }
    if (showFees && Number.isNaN(fees)) { setError("Informe taxas válidas."); return; }

    const payload: CreateTransactionPayload = {
      asset_id: form.asset_id,
      transaction_type: form.transaction_type,
      date: form.date,
      quantity,
      price,
      fees,
      factor,
      broker_id: form.broker_id || null,
      notes: form.notes,
    };
    setPendingPayload(payload);
    save.mutate(payload);
  };

  const handleForceInsert = () => {
    if (!pendingPayload) return;
    setDuplicate(null);
    save.mutate({ ...pendingPayload, force: true });
  };

  const prefillPriceFromAsset = (assetId: string) => {
    const showPrice = getFields(form.transaction_type).showPrice;
    if (!showPrice) return;

    const selectedPosition = portfolioSummary.data?.positions.find((position) => position.asset_id === assetId);
    const currentPrice = Number(selectedPosition?.current_price);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return;

    set("price", formatMoneyFromNumber(currentPrice));
  };

  const adjustQuantity = (delta: number) => {
    const current = parseLocaleNumber(form.quantity || "0");
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    set("quantity", formatDecimalForInput(next));
  };

  const fields = getFields(form.transaction_type);
  const isPending = save.isPending;
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
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar Movimentação" : "Nova Movimentação"}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Ativo */}
        <div>
          <label className={LABEL}>Ativo *</label>
          <div className="relative">
            <input
              className={INPUT}
              placeholder="Digite ticker ou nome do ativo..."
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
                      prefillPriceFromAsset(asset.id);
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
                  placeholder="Ex: PETR4"
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
                placeholder="Ex: Petrobras PN"
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

        {/* Tipo + Data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Tipo *</label>
            <select className={INPUT} value={form.transaction_type} onChange={e => set("transaction_type", e.target.value)}>
              {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Data *</label>
            <input type="date" className={INPUT} value={form.date} onChange={e => set("date", e.target.value)} required />
          </div>
        </div>

        {/* Fator (splits) */}
        {fields.showFactor && (
          <div>
            <label className={LABEL}>Fator *</label>
            <input
              type="number" step="0.000001" min="0.000001"
              className={INPUT}
              placeholder={form.transaction_type === "SPLIT" ? "Ex: 2 (para 1:2)" : "Ex: 10 (para 10:1)"}
              value={form.factor}
              onChange={e => set("factor", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.transaction_type === "SPLIT"
                ? "Quantas ações por ação atual. Ex: 2 dobra a quantidade."
                : "Divisor do grupamento. Ex: 10 divide por 10."}
            </p>
          </div>
        )}

        {/* Quantidade + Preço */}
        {(fields.showQuantity || fields.showPrice) && (
          <div className="grid grid-cols-2 gap-4">
            {fields.showQuantity && (
              <div>
                <label className={LABEL}>Quantidade *</label>
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
                    value={form.quantity}
                    onChange={e => set("quantity", sanitizeDecimalInput(e.target.value))}
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
            )}
            {fields.showPrice && (
              <div>
                <label className={LABEL}>Preço unitário (R$) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={INPUT}
                  placeholder="0,00"
                  value={form.price}
                  onChange={e => set("price", maskMoneyInput(e.target.value))}
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Taxas */}
        {fields.showFees && (
          <div>
            <label className={LABEL}>Taxas / Custos (R$)</label>
            <input
              type="number" step="0.01" min="0"
              className={INPUT}
              placeholder="0,00"
              value={form.fees}
              onChange={e => set("fees", e.target.value)}
            />
          </div>
        )}

        {/* Preview do total */}
        {fields.showPrice && form.quantity && form.price && (
          <div className="bg-secondary/40 rounded-lg px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total estimado</span>
            <span className="font-numeric text-white font-medium">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                (parseLocaleNumber(form.quantity || "0") || 0) * (parseLocaleNumber(form.price || "0") || 0) + (parseLocaleNumber(form.fees || "0") || 0)
              )}
            </span>
          </div>
        )}

        {/* Corretora */}
        {fields.showBroker && (
          <div>
            <label className={LABEL}>Corretora</label>
            <select className={INPUT} value={form.broker_id} onChange={e => set("broker_id", e.target.value)}>
              <option value="">Nenhuma</option>
              {brokers.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
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

        {duplicate && (
          <div className="rounded-lg border border-yellow-400/40 bg-yellow-400/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle size={14} />
              <span className="text-xs font-semibold">Possível duplicata encontrada</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Já existe uma movimentação com os mesmos dados cadastrada:
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Ativo</span>
              <span className="font-mono text-white">{duplicate.existing.asset_ticker}</span>
              <span className="text-muted-foreground">Data</span>
              <span className="text-white">{formatDate(duplicate.existing.date)}</span>
              <span className="text-muted-foreground">Tipo</span>
              <span className="text-white">{duplicate.existing.transaction_type_display}</span>
              <span className="text-muted-foreground">Quantidade</span>
              <span className="font-numeric text-white">{duplicate.existing.quantity}</span>
              <span className="text-muted-foreground">Preço</span>
              <span className="font-numeric text-white">{formatCurrency(Number(duplicate.existing.price))}</span>
              <span className="text-muted-foreground">Origem</span>
              <span><SourceBadge source={duplicate.existing.source} /></span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDuplicate(null)}
                className="flex-1 py-1.5 rounded-lg border border-haveres-border text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleForceInsert}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-400/40 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
              >
                {isPending ? "Salvando..." : "Inserir mesmo assim"}
              </button>
            </div>
          </div>
        )}

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
            disabled={isPending}
            className="flex-1 py-2 rounded-lg bg-haveres-blue text-white text-sm font-medium hover:bg-haveres-blue-dark transition-colors disabled:opacity-50"
          >
            {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
