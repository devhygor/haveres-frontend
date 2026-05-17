import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatPercent } from "@/utils/format";
import type { AllocationItem } from "@/types/portfolio";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16"];

interface Props { data: AllocationItem[]; labelKey?: "type_display" | "sector_display" }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs">
      <p className="text-white font-medium mb-1">{d.label}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
      <p className="text-haveres-blue font-mono">{formatPercent(d.allocation)}</p>
    </div>
  );
};

export function AllocationChart({ data, labelKey = "type_display" }: Props) {
  const chartData = data.map((d, i) => ({
    label: d[labelKey] || d.type_display || d.sector_display || "Outro",
    value: d.value,
    allocation: d.allocation,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" cx="50%" cy="50%"
          innerRadius={65} outerRadius={95} paddingAngle={2}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical" align="right" verticalAlign="middle"
          formatter={(_, entry: any) => (
            <span className="text-xs text-muted-foreground">
              {entry.payload.label}{" "}
              <span className="font-mono text-white">{formatPercent(entry.payload.allocation)}</span>
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
