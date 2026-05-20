import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import { formatPercent, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { CryptoQuoteItem } from "@/types/quote";

const PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

const CONTROL_INPUT = "w-full bg-secondary border border-haveres-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-haveres-blue";

type SortMode = "price_desc" | "name_asc";

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("price_desc");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["quotes", "crypto"],
    queryFn: () => quotesApi.getCryptoQuotes("BRL").then((r) => r.data),
    staleTime: 60_000,
  });

  const filteredAndSorted = useMemo(() => {
    if (!data?.length) return [];

    const normalizedSearch = normalizeText(searchTerm.trim());
    const filtered = normalizedSearch
      ? data.filter((item) => {
        const ticker = normalizeText(item.ticker ?? "");
        const coinName = normalizeText(item.coin_name ?? "");
        return ticker.includes(normalizedSearch) || coinName.includes(normalizedSearch);
      })
      : [...data];

    filtered.sort((a, b) => {
      if (sortMode === "name_asc") {
        return (a.coin_name || a.ticker).localeCompare(b.coin_name || b.ticker, "pt-BR", { sensitivity: "base" });
      }

      return Number(b.price ?? 0) - Number(a.price ?? 0);
    });

    return filtered;
  }, [data, searchTerm, sortMode]);

  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const visibleItems = filteredAndSorted.slice(start, end);

  if (!data?.length) return null;

  return (
    <div className="card-haveres p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Criptomoedas</p>
        <span className="text-xs text-muted-foreground">{totalItems} ativos</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome ou ticker"
          className={`${CONTROL_INPUT} sm:col-span-2`}
        />

        <select
          value={sortMode}
          onChange={(event) => {
            setSortMode(event.target.value as SortMode);
            setPage(1);
          }}
          className={CONTROL_INPUT}
        >
          <option value="price_desc">Ordenar por preco</option>
          <option value="name_asc">Ordenar por nome</option>
        </select>

        <div className="sm:col-span-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Itens por pagina</span>
          <select
            value={itemsPerPage}
            onChange={(event) => {
              setItemsPerPage(Number(event.target.value));
              setPage(1);
            }}
            className={`${CONTROL_INPUT} w-auto`}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {visibleItems.length ? (
        <div className="divide-y divide-haveres-border/50">
          {visibleItems.map((item) => (
            <CryptoRow key={item.ticker} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Nenhuma criptomoeda encontrada para o filtro informado.
        </p>
      )}

      {totalItems > 0 && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-haveres-border/50">
          <span className="text-xs text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs rounded border border-haveres-border text-muted-foreground hover:text-white hover:border-haveres-blue disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 text-xs rounded border border-haveres-border text-muted-foreground hover:text-white hover:border-haveres-blue disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Proxima
            </button>
          </div>
        </div>
      )}

      <div className="mt-2">
        <span className="text-[11px] text-muted-foreground">
          Exibindo {totalItems ? start + 1 : 0}-{Math.min(end, totalItems)} de {totalItems}
        </span>
      </div>
    </div>
  );
}
