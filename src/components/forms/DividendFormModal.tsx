import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/common/Modal";
import { dividendsApi } from "@/api/dividends";
import { assetsApi, ASSET_TYPES } from "@/api/assets";
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

export function DividendFormModal({ open, onClose, dividend }: Props) {
  const qc = useQueryClient();
  const isEditing = !!dividend;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [newAsset, setNewAsset] = useState<NewAsset>(DEFAULT_NEW_ASSET);
  const [showNewAsset, setShowNewAsset] = useState(false);
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
      setNewAsset(DEFAULT_NEW_ASSET);
      setError("");
    }
  }, [open, dividend]);

  const assets = useQuery({ queryKey: ["assets"], queryFn: () => assetsApi.list().then(r => r.data) });

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setNA = (k: keyof NewAsset, v: string) => setNewAsset(f => ({ ...f, [k]: v }));

  const createAsset = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      set("asset_id", r.data.id);
      setShowNewAsset(false);
      setNewAsset(DEFAULT_NEW_ASSET);
      setError("");
    },
    onError: () => setError("Erro ao cadastrar ativo."),
  });

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
    if (!form.quantity_held) { setError("Informe a quantidade."); return; }
    if (!form.value_per_share) { setError("Informe o valor por ação."); return; }

    save.mutate({
      asset_id: form.asset_id,
      dividend_type: form.dividend_type,
      ex_date: form.ex_date,
      payment_date: form.payment_date || null,
      quantity_held: parseFloat(form.quantity_held),
      value_per_share: parseFloat(form.value_per_share),
      ir_withheld: parseFloat(form.ir_withheld || "0"),
      notes: form.notes,
    });
  };

  const gross = parseFloat(form.quantity_held || "0") * parseFloat(form.value_per_share || "0");
  const net = gross - parseFloat(form.ir_withheld || "0");
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar Provento" : "Novo Provento"}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Ativo */}
        <div>
          <label className={LABEL}>Ativo *</label>
          <select
            className={INPUT}
            value={showNewAsset ? "__new__" : form.asset_id}
            onChange={e => {
              if (e.target.value === "__new__") {
                setShowNewAsset(true);
                set("asset_id", "");
              } else {
                setShowNewAsset(false);
                set("asset_id", e.target.value);
              }
            }}
          >
            <option value="">Selecione um ativo...</option>
            {assets.data?.map(a => (
              <option key={a.id} value={a.id}>{a.ticker} — {a.name}</option>
            ))}
            <option value="__new__">+ Cadastrar novo ativo</option>
          </select>
        </div>

        {showNewAsset && (
          <div className="bg-secondary/40 border border-haveres-border rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-haveres-blue">Cadastrar ativo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Ticker *</label>
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
            <input
              type="number" step="0.00000001" min="0"
              className={INPUT}
              placeholder="0"
              value={form.quantity_held}
              onChange={e => set("quantity_held", e.target.value)}
              required
            />
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
