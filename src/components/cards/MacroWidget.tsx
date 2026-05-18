import { useQuery } from "@tanstack/react-query";
import { quotesApi } from "@/api/quotes";
import { TermTooltip } from "@/components/common/TermTooltip";

const LABEL: Record<string, string> = {
  CDI: "CDI",
  SELIC: "Selic",
  IPCA: "IPCA",
  IGPM: "IGP-M",
};

function MacroRow({ type, value, accumulated }: { type: string; value: number; accumulated: number | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <TermTooltip term={LABEL[type] ?? type} className="text-xs text-muted-foreground" />
      <div className="text-right">
        <span className="font-mono text-sm text-white font-medium">
          {value.toFixed(2)}% a.a.
        </span>
        {accumulated !== null && type === "IPCA" && (
          <p className="font-mono text-xs text-muted-foreground">{accumulated.toFixed(2)}% 12m</p>
        )}
      </div>
    </div>
  );
}

export function MacroWidget() {
  const { data } = useQuery({
    queryKey: ["quotes", "macro"],
    queryFn: () => quotesApi.getMacro().then((r) => r.data),
    staleTime: 300_000,
  });

  if (!data?.length) return null;

  const priority = ["CDI", "SELIC", "IPCA"];
  const sorted = [...data].sort(
    (a, b) => priority.indexOf(a.indicator_type) - priority.indexOf(b.indicator_type)
  );

  return (
    <div className="card-haveres p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Indicadores</p>
      <div className="divide-y divide-haveres-border/50">
        {sorted.map((m) => (
          <MacroRow
            key={m.indicator_type}
            type={m.indicator_type}
            value={Number(m.value)}
            accumulated={m.accumulated_12m !== null ? Number(m.accumulated_12m) : null}
          />
        ))}
      </div>
    </div>
  );
}
