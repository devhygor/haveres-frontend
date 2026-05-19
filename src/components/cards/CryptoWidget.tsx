import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import { formatPercent, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { CryptoQuoteItem } from "@/types/quote";

function formatCryptoPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  }).format(price);
}

function CryptoRow({ item }: { item: CryptoQuoteItem }) {
  const isPositive = (item.change_percent ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {item.logo_url ? (
          <img src={item.logo_url} alt={item.ticker} className="w-5 h-5 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-haveres-border flex-shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-sm font-medium text-white font-mono block leading-none">{item.ticker}</span>
          <span className="text-xs text-muted-foreground truncate block">{item.coin_name}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="font-mono text-sm text-white font-semibold">
          {formatCryptoPrice(Number(item.price), item.currency)}
        </span>
        {item.change_percent !== null && (
          <div className={cn("flex items-center gap-0.5 text-xs font-mono", plClass(item.change_percent))}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatPercent(Math.abs(Number(item.change_percent)))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CryptoWidget() {
  const { data } = useQuery({
    queryKey: ["quotes", "crypto"],
    queryFn: () => quotesApi.getCryptoQuotes("BRL").then((r) => r.data),
    staleTime: 60_000,
  });

  if (!data?.length) return null;

  return (
    <div className="card-haveres p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Criptomoedas</p>
      <div className="divide-y divide-haveres-border/50">
        {data.map((item) => (
          <CryptoRow key={item.ticker} item={item} />
        ))}
      </div>
    </div>
  );
}
