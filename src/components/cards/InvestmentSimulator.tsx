import { useState } from "react";
import type { IndexComparison } from "@/types/assetDetail";
import { formatCurrency } from "@/utils/format";

interface Props {
  ticker: string;
  data: IndexComparison | undefined;
}

const PERIOD_OPTIONS = [
  { label: "1 mês", months: 1 },
  { label: "3 meses", months: 3 },
  { label: "6 meses", months: 6 },
  { label: "1 ano", months: 12 },
  { label: "2 anos", months: 24 },
  { label: "5 anos", months: 60 },
];

export function InvestmentSimulator({ ticker, data }: Props) {
  const [amount, setAmount] = useState(1000);
  const [months, setMonths] = useState(24);

  if (!data) return null;

  // Filtra só períodos cobertos pelos dados disponíveis
  const availableMonths = data.months;
  const availableOptions = PERIOD_OPTIONS.filter((o) => o.months <= availableMonths);

  // Garante que o período selecionado é válido
  const effectiveMonths = Math.min(months, availableMonths);

  const results = data.series.map((series) => {
    if (series.points.length < 2) {
      return { key: series.key, label: series.label, finalValue: amount, returnPct: 0 };
    }

    // Encontra o ponto de início do período selecionado
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - effectiveMonths);
    // Busca o ponto mais próximo ANTES ou NA data de corte
    const startIdx = series.points.findIndex((p) => new Date(p.date) >= cutoff);
    const startPoint = startIdx >= 0 ? series.points[startIdx] : series.points[0];
    const endPoint = series.points[series.points.length - 1];

    if (startPoint.value <= 0) {
      return { key: series.key, label: series.label, finalValue: amount, returnPct: 0 };
    }

    const returnPct = endPoint.value / startPoint.value - 1;
    const finalValue = amount * (1 + returnPct);
    return { key: series.key, label: series.label, finalValue, returnPct };
  });

  // Ordena: maior retorno primeiro, ativo principal sempre primeiro
  const sorted = [...results].sort((a, b) => {
    if (a.key === ticker) return -1;
    if (b.key === ticker) return 1;
    return b.returnPct - a.returnPct;
  });

  const mainResult = results.find((r) => r.key === ticker);
  return (
    <div className="card-haveres p-4 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Simulador de Investimento
      </h3>

      {/* Linha principal: "Se você tivesse investido R$X há Y hoje você teria R$Z" */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Se você tivesse investido</span>
        <div className="flex items-center gap-1 bg-haveres-dark border border-haveres-border rounded-lg px-3 py-1.5">
          <span className="text-muted-foreground text-xs">R$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 1000))}
            className="bg-transparent text-white font-numeric text-sm w-20 outline-none"
          />
        </div>
        <span className="text-muted-foreground">há</span>
        <select
          value={effectiveMonths}
          onChange={(e) => setMonths(parseInt(e.target.value))}
          className="bg-haveres-dark border border-haveres-border rounded-lg px-3 py-1.5 text-white text-sm outline-none"
        >
          {availableOptions.map((opt) => (
            <option key={opt.months} value={opt.months}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">hoje você teria</span>
        {mainResult && (
          <span className="text-lg font-bold text-white font-numeric">
            {formatCurrency(mainResult.finalValue)}
          </span>
        )}
      </div>

      {/* Tabela comparativa */}
      <div className="space-y-1.5">
        {sorted.map((r) => {
          const isMain = r.key === ticker;
          const maxAbs = Math.max(...results.map((x) => Math.abs(x.returnPct)), 0.01);
          return (
            <div
              key={r.key}
              className={`flex items-center gap-3 py-2 border-b border-haveres-border/40 ${
                isMain ? "opacity-100" : "opacity-80"
              }`}
            >
              <div className={`w-16 text-xs font-medium font-numeric ${isMain ? "text-haveres-blue" : "text-muted-foreground"}`}>
                {r.label}
              </div>
              <div className="flex-1 bg-haveres-dark rounded h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded transition-all ${r.returnPct >= 0 ? "bg-gain" : "bg-loss"}`}
                  style={{ width: `${Math.min(100, (Math.abs(r.returnPct) / maxAbs) * 100)}%` }}
                />
              </div>
              <div className={`text-sm font-numeric font-medium w-20 text-right ${r.returnPct >= 0 ? "text-gain" : "text-loss"}`}>
                {r.returnPct >= 0 ? "+" : ""}{(r.returnPct * 100).toFixed(2)}%
              </div>
              <div className="text-sm font-numeric text-white w-28 text-right">
                {formatCurrency(r.finalValue)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
