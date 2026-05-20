import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { transactionsApi } from "@/api/transactions";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { TransactionFormModal } from "@/components/forms/TransactionFormModal";
import { formatCurrency, formatDate, formatQuantity } from "@/utils/format";
import { ArrowLeftRight, Plus, Pencil, Trash2, BarChart3 } from "lucide-react";
import { cn } from "@/utils/cn";
import { SourceBadge } from "@/components/common/SourceBadge";
import { AssetLogo } from "@/components/common/AssetLogo";
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

  const monthlyVolume = useMemo(() => {
    const map: Record<string, { month: string; compra: number; venda: number }> = {};
    (data ?? []).forEach(t => {
      if (!["BUY", "SELL"].includes(t.transaction_type)) return;
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { month: format(parseISO(m + "-01"), "MMM/yy", { locale: ptBR }), compra: 0, venda: 0 };
      if (t.transaction_type === "BUY") map[m].compra += Number(t.total_value);
      if (t.transaction_type === "SELL") map[m].venda += Number(t.total_value);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => v);
  }, [data]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <>
      {/* Volume mensal de compras/vendas */}
      {monthlyVolume.length > 0 && (
        <div className="card-haveres p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Volume Mensal (compras / vendas)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyVolume} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => formatCurrency(v, true)} width={65} />
              <Tooltip
                cursor={{ fill: "rgba(160, 174, 192, 0.12)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-1">
                      <p className="text-muted-foreground mb-1">{label}</p>
                      {payload.map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <span className="text-muted-foreground">{p.name}:</span>
                          <span className="font-mono text-white">{formatCurrency(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => <span style={{ color: "#a0aec0" }}>{v}</span>}
              />
              <Bar dataKey="compra" name="Compras" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="venda" name="Vendas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card-haveres">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-haveres-border">
          <ArrowLeftRight size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Movimentações</h2>
          <span className="text-xs text-muted-foreground">{data?.length ?? 0} registros</span>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto sm:ml-auto justify-center flex items-center gap-1.5 px-3 py-1.5 bg-haveres-blue text-white text-xs font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
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
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b border-haveres-border">
                  {["Data", "Ticker", "Tipo", "Qtd", "Preço", "Taxas", "Total", "Corretora", "Origem", ""].map((h, i) => (
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
                      <div className="flex items-center gap-2">
                        <AssetLogo logoUrl={t.asset_logo_url} ticker={t.asset_ticker} />
                        <div>
                          <span className="font-mono font-semibold text-white text-sm">{t.asset_ticker}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={t.asset_name}>
                            {t.asset_name}
                          </p>
                        </div>
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
                    <td className="py-3 px-4"><SourceBadge source={t.source} /></td>
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
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
