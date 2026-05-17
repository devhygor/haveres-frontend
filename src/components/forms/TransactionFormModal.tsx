import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/common/Modal";
import { transactionsApi } from "@/api/transactions";
import { assetsApi, ASSET_TYPES } from "@/api/assets";
import type { Transaction } from "@/types/transaction";

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

export function TransactionFormModal({ open, onClose, transaction }: Props) {
  const qc = useQueryClient();
  const isEditing = !!transaction;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [newAsset, setNewAsset] = useState<NewAsset>(DEFAULT_NEW_ASSET);
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        transaction
          ? {
              asset_id: transaction.asset_id,
              transaction_type: transaction.transaction_type,
              date: transaction.date,
              quantity: String(transaction.quantity),
              price: String(transaction.price),
              fees: String(transaction.fees),
              factor: String(transaction.factor),
              broker_id: transaction.broker_id ?? "",
              notes: transaction.notes,
            }
          : { ...DEFAULT_FORM, date: today() }
      );
      setShowNewAsset(false);
      setNewAsset(DEFAULT_NEW_ASSET);
      setError("");
    }
  }, [open, transaction]);

  const assets = useQuery({ queryKey: ["assets"], queryFn: () => assetsApi.list().then(r => r.data) });
  const brokers = useQuery({ queryKey: ["brokers"], queryFn: () => transactionsApi.listBrokers().then(r => r.data) });

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
        ? transactionsApi.update(transaction!.id, payload as any)
        : transactionsApi.create(payload as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
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

    const { showQuantity, showFactor, showPrice, showFees } = getFields(form.transaction_type);
    if (showQuantity && !form.quantity) { setError("Informe a quantidade."); return; }
    if (showPrice && !form.price) { setError("Informe o preço."); return; }
    if (showFactor && !form.factor) { setError("Informe o fator."); return; }

    save.mutate({
      asset_id: form.asset_id,
      transaction_type: form.transaction_type,
      date: form.date,
      quantity: showQuantity ? parseFloat(form.quantity) : 0,
      price: showPrice ? parseFloat(form.price) : 0,
      fees: showFees ? parseFloat(form.fees || "0") : 0,
      factor: showFactor ? parseFloat(form.factor || "1") : 1,
      broker_id: form.broker_id || null,
      notes: form.notes,
    });
  };

  const fields = getFields(form.transaction_type);
  const isPending = save.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar Movimentação" : "Nova Movimentação"}>
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
                <input
                  type="number" step="0.00000001" min="0"
                  className={INPUT}
                  placeholder="0"
                  value={form.quantity}
                  onChange={e => set("quantity", e.target.value)}
                  required
                />
              </div>
            )}
            {fields.showPrice && (
              <div>
                <label className={LABEL}>Preço unitário (R$) *</label>
                <input
                  type="number" step="0.01" min="0"
                  className={INPUT}
                  placeholder="0,00"
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
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
                parseFloat(form.quantity || "0") * parseFloat(form.price || "0") + parseFloat(form.fees || "0")
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
