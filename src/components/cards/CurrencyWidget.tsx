import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import { formatDateTime, formatPercent, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";

function CurrencyRow({ pair, bid, variation, updatedAt }: { pair: string; bid: number; variation: number | null; updatedAt?: string }) {
  const isPositive = (variation ?? 0) >= 0;
  const updateLabel = updatedAt ? formatDateTime(updatedAt) : null;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-white font-mono">{pair}</span>
        {updateLabel && (
          <span className="text-[11px] text-muted-foreground truncate">Atualizado em {updateLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-white font-semibold">
          {bid.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </span>
        {variation !== null && (
          <div className={cn("flex items-center gap-0.5 text-xs font-mono", plClass(variation))}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatPercent(Math.abs(variation))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CurrencyWidget() {
  const { data } = useQuery({
    queryKey: ["quotes", "currencies"],
    queryFn: () => quotesApi.getCurrencies().then((r) => r.data),
    staleTime: 60_000,
  });

  if (!data?.length) return null;

  return (
    <div className="card-haveres p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Câmbio</p>
      <div className="divide-y divide-haveres-border/50">
        {data.map((c) => (
          <CurrencyRow
            key={c.currency_pair}
            pair={c.currency_pair}
            bid={Number(c.bid)}
            variation={c.variation !== null ? Number(c.variation) : null}
            updatedAt={c.updated_at}
          />
        ))}
      </div>
    </div>
  );
}
