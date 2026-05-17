import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
      <p className="text-muted-foreground">{formatCurrency(Number(d.value))}</p>
      <p className="text-haveres-blue font-mono">{formatPercent(Number(d.allocation))}</p>
    </div>
  );
};

export function AllocationChart({ data, labelKey = "type_display" }: Props) {
  const chartData = data.map((d, i) => ({
    label: d[labelKey] || d.type_display || d.sector_display || "Outro",
    value: Number(d.value),
    allocation: Number(d.allocation),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3">
        {chartData.map((entry) => (
          <div key={entry.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.label}</span>
            <span className="text-xs font-mono text-white font-medium">{formatPercent(entry.allocation)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
