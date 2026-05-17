import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dividendsApi } from "@/api/dividends";
import { portfolioApi } from "@/api/portfolio";
import { DividendsChart } from "@/components/charts/DividendsChart";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { DividendFormModal } from "@/components/forms/DividendFormModal";
import { formatCurrency, formatDate } from "@/utils/format";
import { TrendingUp, Plus, Pencil, Trash2, RefreshCw, PieChart, BarChart3 } from "lucide-react";
import { SourceBadge } from "@/components/common/SourceBadge";
import type { Dividend } from "@/types/dividend";
import type { AllocationItem } from "@/types/portfolio";

const TYPE_COLORS: Record<string, string> = {
  DIVIDEND: "text-gain",
  JCP: "text-haveres-blue",
  FII_INCOME: "text-gain",
  AMORTIZATION: "text-muted-foreground",
  SUBSCRIPTION_RIGHTS: "text-haveres-blue",
  OTHER: "text-muted-foreground",
};

export function DividendsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dividend | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dividends = useQuery({
    queryKey: ["dividends"],
    queryFn: () => dividendsApi.list().then(r => r.data),
  });
  const evolution = useQuery({
    queryKey: ["portfolio", "evolution", "dividends"],
    queryFn: () => portfolioApi.getDividendsEvolution(12).then(r => r.data),
  });

  const deleteDividend = useMutation({
    mutationFn: (id: string) => dividendsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setDeletingId(null);
    },
  });

  const syncDividends = useMutation({
    mutationFn: () => dividendsApi.sync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const openCreate = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (d: Dividend) => { setEditing(d); setModalOpen(true); };

  const byType: AllocationItem[] = useMemo(() => {
    const d = dividends.data ?? [];
    const totalNet = d.reduce((s, x) => s + Number(x.net_amount), 0);
    if (!d.length || totalNet === 0) return [];
    const map: Record<string, number> = {};
    d.forEach(x => { map[x.dividend_type_display] = (map[x.dividend_type_display] || 0) + Number(x.net_amount); });
    return Object.entries(map).map(([type_display, value]) => ({
      type_display,
      value,
      allocation: (value / totalNet) * 100,
    }));
  }, [dividends.data]);

  const byAsset = useMemo(() => {
    const d = dividends.data ?? [];
    const map: Record<string, { ticker: string; total: number }> = {};
    d.forEach(x => {
      if (!map[x.asset_ticker]) map[x.asset_ticker] = { ticker: x.asset_ticker, total: 0 };
      map[x.asset_ticker].total += Number(x.net_amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [dividends.data]);

  if (dividends.isLoading) return <LoadingState />;
  if (dividends.isError) return <ErrorState onRetry={() => dividends.refetch()} />;

  const data = dividends.data ?? [];
  const totalGross = data.reduce((s, d) => s + Number(d.gross_amount), 0);
  const totalNet = data.reduce((s, d) => s + Number(d.net_amount), 0);
  const totalIR = data.reduce((s, d) => s + Number(d.ir_withheld), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card-haveres p-5">
            <p className="text-xs text-muted-foreground mb-2">Total Bruto</p>
            <p className="text-xl font-bold font-numeric text-gain">{formatCurrency(totalGross)}</p>
          </div>
          <div className="card-haveres p-5">
            <p className="text-xs text-muted-foreground mb-2">Total Líquido</p>
            <p className="text-xl font-bold font-numeric text-white">{formatCurrency(totalNet)}</p>
          </div>
          <div className="card-haveres p-5">
            <p className="text-xs text-muted-foreground mb-2">IR Retido</p>
            <p className="text-xl font-bold font-numeric text-muted-foreground">{formatCurrency(totalIR)}</p>
          </div>
        </div>

        {/* Distribuição por tipo + por ativo */}
        {(byType.length > 0 || byAsset.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {byType.length > 0 && (
              <div className="card-haveres p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart size={18} className="text-haveres-blue" />
                  <h2 className="text-sm font-semibold text-white">Proventos por Tipo</h2>
                </div>
                <AllocationChart data={byType} labelKey="type_display" />
              </div>
            )}
            {byAsset.length > 0 && (
              <div className="card-haveres p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-gain" />
                  <h2 className="text-sm font-semibold text-white">Top Ativos (líquido)</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byAsset} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, true)} />
                    <YAxis type="category" dataKey="ticker" tick={{ fill: "#a0aec0", fontSize: 11 }}
                      axisLine={false} tickLine={false} width={52} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs">
                            <p className="text-white font-mono font-semibold mb-1">{payload[0].payload.ticker}</p>
                            <p className="text-gain font-mono">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="total" name="Líquido" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Gráfico mensal */}
        {evolution.data?.length ? (
          <div className="card-haveres p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-gain" />
              <h2 className="text-sm font-semibold text-white">Proventos por Mês</h2>
            </div>
            <DividendsChart data={evolution.data} />
          </div>
        ) : null}

        {/* Tabela */}
        <div className="card-haveres">
          <div className="flex items-center gap-2 p-5 border-b border-haveres-border">
            <h2 className="text-sm font-semibold text-white">Histórico de Proventos</h2>
            <span className="text-xs text-muted-foreground">{data.length} registros</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => syncDividends.mutate()}
                disabled={syncDividends.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-medium rounded-lg hover:text-white transition-colors disabled:opacity-50"
                title="Sincronizar proventos via Brapi"
              >
                <RefreshCw size={13} className={syncDividends.isPending ? "animate-spin" : ""} />
                Sincronizar Proventos
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-haveres-blue text-white text-xs font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
              >
                <Plus size={13} /> Novo Provento
              </button>
            </div>
          </div>

          {!data.length ? (
            <EmptyState
              title="Nenhum provento registrado"
              description="Registre dividendos, JCP e rendimentos de FII recebidos."
              action={
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-haveres-blue text-white text-sm font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
                >
                  <Plus size={14} /> Adicionar provento
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-haveres-border">
                    {["Data com", "Ticker", "Tipo", "Qtd", "Valor/ação", "Bruto", "IR", "Líquido", "Origem", ""].map((h, i) => (
                      <th key={i} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.id} className="border-b border-haveres-border/50 hover:bg-secondary/30 group">
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(d.ex_date)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-mono font-semibold text-white text-sm">{d.asset_ticker}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{d.asset_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${TYPE_COLORS[d.dividend_type] ?? "text-muted-foreground"}`}>
                          {d.dividend_type_display}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-numeric text-sm">{d.quantity_held}</td>
                      <td className="py-3 px-4 font-numeric text-sm">{formatCurrency(Number(d.value_per_share))}</td>
                      <td className="py-3 px-4 font-numeric text-sm text-gain">{formatCurrency(Number(d.gross_amount))}</td>
                      <td className="py-3 px-4 font-numeric text-xs text-muted-foreground">{formatCurrency(Number(d.ir_withheld))}</td>
                      <td className="py-3 px-4 font-numeric text-sm text-white font-medium">{formatCurrency(Number(d.net_amount))}</td>
                      <td className="py-3 px-4"><SourceBadge source={d.source} /></td>
                      <td className="py-3 px-4 w-20">
                        {deletingId === d.id ? (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => deleteDividend.mutate(d.id)}
                              disabled={deleteDividend.isPending}
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
                              onClick={() => openEdit(d)}
                              className="text-muted-foreground hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingId(d.id)}
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
      </div>

      <DividendFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dividend={editing}
      />
    </>
  );
}
