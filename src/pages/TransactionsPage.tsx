import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/api/transactions";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { TransactionFormModal } from "@/components/forms/TransactionFormModal";
import { formatCurrency, formatDate, formatQuantity } from "@/utils/format";
import { ArrowLeftRight, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Transaction } from "@/types/transaction";

const TYPE_COLORS: Record<string, string> = {
  BUY: "text-gain bg-gain-bg",
  SELL: "text-loss bg-loss-bg",
  SPLIT: "text-haveres-blue bg-haveres-blue/10",
  REVERSE_SPLIT: "text-haveres-blue bg-haveres-blue/10",
  BONUS: "text-gain bg-gain-bg",
  SUBSCRIPTION: "text-haveres-blue bg-haveres-blue/10",
  FEE: "text-loss bg-loss-bg",
  AMORTIZATION: "text-muted-foreground bg-secondary",
  TRANSFER_IN: "text-gain bg-gain-bg",
  TRANSFER_OUT: "text-loss bg-loss-bg",
};

export function TransactionsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list().then(r => r.data),
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setDeletingId(null);
    },
  });

  const openCreate = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (t: Transaction) => { setEditing(t); setModalOpen(true); };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <div className="card-haveres">
        <div className="flex items-center gap-2 p-5 border-b border-haveres-border">
          <ArrowLeftRight size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Movimentações</h2>
          <span className="text-xs text-muted-foreground">{data?.length ?? 0} registros</span>
          <button
            onClick={openCreate}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-haveres-blue text-white text-xs font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
          >
            <Plus size={13} /> Nova Movimentação
          </button>
        </div>

        {!data?.length ? (
          <EmptyState
            title="Nenhuma movimentação registrada"
            description="Registre suas compras, vendas e eventos corporativos para acompanhar seu portfólio."
            action={
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-haveres-blue text-white text-sm font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
              >
                <Plus size={14} /> Adicionar movimentação
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-haveres-border">
                  {["Data", "Ticker", "Tipo", "Qtd", "Preço", "Taxas", "Total", "Corretora", ""].map((h, i) => (
                    <th
                      key={i}
                      className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(t => (
                  <tr key={t.id} className="border-b border-haveres-border/50 hover:bg-secondary/30 group">
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(t.date)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-mono font-semibold text-white text-sm">{t.asset_ticker}</span>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{t.asset_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("text-xs px-2 py-0.5 rounded font-medium", TYPE_COLORS[t.transaction_type] ?? "text-muted-foreground bg-secondary")}>
                        {t.transaction_type_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-numeric text-sm">{formatQuantity(Number(t.quantity))}</td>
                    <td className="py-3 px-4 font-numeric text-sm">{formatCurrency(Number(t.price))}</td>
                    <td className="py-3 px-4 font-numeric text-xs text-muted-foreground">{formatCurrency(Number(t.fees))}</td>
                    <td className="py-3 px-4 font-numeric text-sm text-white font-medium">{formatCurrency(Number(t.total_value))}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{t.broker_name ?? "—"}</td>
                    <td className="py-3 px-4 w-20">
                      {deletingId === t.id ? (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => deleteTransaction.mutate(t.id)}
                            disabled={deleteTransaction.isPending}
                            className="text-loss hover:underline disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <span className="text-muted-foreground">·</span>
                          <button onClick={() => setDeletingId(null)} className="text-muted-foreground hover:text-white">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(t)}
                            className="text-muted-foreground hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="text-muted-foreground hover:text-loss transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editing}
      />
    </>
  );
}
