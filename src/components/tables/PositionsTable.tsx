import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState, type Row,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatPercent, formatQuantity, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Position } from "@/types/portfolio";
import { ASSET_TYPE_LABELS } from "@/types/asset";
import { AssetLogo } from "@/components/common/AssetLogo";
import { TermTooltip } from "@/components/common/TermTooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function numericSorting<TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string): number {
  const a = toNumber(rowA.getValue(columnId));
  const b = toNumber(rowB.getValue(columnId));
  return a - b;
}

const COLUMN_WIDTH_CLASS: Record<string, string> = {
  ticker: "w-[164px] max-w-[164px]",
  asset_type: "w-[88px] max-w-[88px]",
  target_gap_value: "w-[122px]",
};

interface Props {
  positions: Position[];
}

export function PositionsTable({ positions }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "current_value", desc: true },
  ]);

  const columns = useMemo<ColumnDef<Position>[]>(() => ([
    {
      accessorKey: "ticker",
      header: "Código",
      cell: ({ row }) => {
        const isTreasury = row.original.asset_type === "TREASURY";

        return (
          <div className="flex items-center gap-2 min-w-0">
            <AssetLogo logoUrl={row.original.logo_url} ticker={row.original.ticker} />
            <div className="min-w-0">
              <Link
                to={`/ativos/${row.original.ticker}`}
                className={cn(
                  "block truncate max-w-[118px] font-semibold text-haveres-blue hover:text-white text-sm transition-colors",
                  !isTreasury && "font-mono",
                )}
                title={isTreasury ? row.original.name : row.original.ticker}
              >
                {isTreasury ? row.original.name : row.original.ticker}
              </Link>
              <p className="text-xs text-muted-foreground truncate max-w-[118px]" title={isTreasury ? row.original.ticker : row.original.name}>
                {isTreasury ? row.original.ticker : row.original.name}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "asset_type",
      header: "Tipo",
      cell: ({ getValue }) => {
        const assetType = getValue() as string;
        const label = ASSET_TYPE_LABELS[assetType] ?? assetType;

        return (
          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Qtd",
      sortingFn: numericSorting,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-white">{formatQuantity(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: "average_price",
      header: () => <TermTooltip term="PM" />,
      sortingFn: numericSorting,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: "current_price",
      header: () => <TermTooltip term="Cotação" />,
      sortingFn: numericSorting,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-white">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: "total_invested",
      header: () => <TermTooltip term="Investido" />,
      sortingFn: numericSorting,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: "current_value",
      header: "Valor Atual",
      sortingFn: numericSorting,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-white font-medium">
          {formatCurrency(getValue() as number)}
        </span>
      ),
    },
    {
      accessorKey: "pl_total",
      header: () => <TermTooltip term="Retorno total" />,
      sortingFn: numericSorting,
      cell: ({ row }) => (
        <TooltipPrimitive.Root delayDuration={150}>
          <TooltipPrimitive.Trigger asChild>
            <div className="cursor-help">
              <p className={cn("font-mono text-sm font-medium", plClass(row.original.pl_total))}>
                {formatCurrency(row.original.pl_total)}
              </p>
              <p className={cn("font-mono text-xs", plClass(row.original.pl_total_percent))}>
                {formatPercent(row.original.pl_total_percent, true)}
              </p>
            </div>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              sideOffset={6}
              className="z-50 rounded-lg bg-haveres-card border border-haveres-border px-3 py-2 text-xs shadow-xl space-y-1"
            >
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Valorização</span>
                <span className={cn("font-mono", plClass(row.original.pl_absolute))}>{formatCurrency(row.original.pl_absolute)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Proventos</span>
                <span className="font-mono text-gain">+{formatCurrency(row.original.dividends_received)}</span>
              </div>
              <TooltipPrimitive.Arrow className="fill-haveres-border" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      ),
    },
    {
      accessorKey: "allocation",
      header: () => <TermTooltip term="Alocação" />,
      sortingFn: numericSorting,
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-haveres-blue rounded-full" style={{ width: `${Math.min(v, 100)}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground">{formatPercent(v)}</span>
          </div>
        );
      },
    },
    {
      id: "pvp",
      accessorFn: (row) => row.fii_detail?.pvp ?? row.price_to_book ?? null,
      header: () => <TermTooltip term="P/VP" />,
      sortingFn: numericSorting,
      cell: ({ getValue }) => {
        const raw = getValue();
        if (raw == null) return <span className="text-sm text-muted-foreground">—</span>;
        const v = Number(raw);
        const isCheap = v < 1;
        const isExpensive = v > 1;
        return (
          <span className={cn("font-mono text-sm font-medium", isCheap ? "text-gain" : isExpensive ? "text-loss" : "text-white")}>
            {v.toFixed(2).replace(".", ",")}x
          </span>
        );
      },
    },
  ]), []);

  const table = useReactTable({
    data: positions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.map((row) => {
          const p = row.original;
          const isTreasury = p.asset_type === "TREASURY";

          return (
            <div key={row.id} className="card-haveres p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AssetLogo logoUrl={p.logo_url} ticker={p.ticker} />
                  <div className="min-w-0">
                    <Link
                      to={`/ativos/${p.ticker}`}
                      className={cn(
                        "block truncate max-w-[150px] font-semibold text-haveres-blue hover:text-white text-sm transition-colors",
                        !isTreasury && "font-mono",
                      )}
                      title={isTreasury ? p.name : p.ticker}
                    >
                      {isTreasury ? p.name : p.ticker}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-[170px]" title={isTreasury ? p.ticker : p.name}>
                      {isTreasury ? p.ticker : p.name}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                  {ASSET_TYPE_LABELS[p.asset_type] ?? p.asset_type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Qtd</p>
                  <p className="font-mono text-sm text-white">{formatQuantity(toNumber(p.quantity))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground"><TermTooltip term="PM" /></p>
                  <p className="font-mono text-sm text-white">{formatCurrency(toNumber(p.average_price))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground"><TermTooltip term="Investido" /></p>
                  <p className="font-mono text-sm text-white">{formatCurrency(toNumber(p.total_invested))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground"><TermTooltip term="Cotação" /></p>
                  <p className="font-mono text-sm text-white">{formatCurrency(toNumber(p.current_price))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground"><TermTooltip term="P/VP" /></p>
                  {(() => {
                    const pvpRaw = p.fii_detail?.pvp ?? p.price_to_book ?? null;
                    if (pvpRaw == null) return <p className="text-sm text-muted-foreground">—</p>;
                    const pvp = Number(pvpRaw);
                    const isCheap = pvp < 1;
                    const isExpensive = pvp > 1;
                    return (
                      <p className={cn("font-mono text-sm font-medium", isCheap ? "text-gain" : isExpensive ? "text-loss" : "text-white")}>
                        {pvp.toFixed(2).replace(".", ",")}x
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Valor Atual</p>
                  <p className="font-mono text-sm text-white">{formatCurrency(toNumber(p.current_value))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground"><TermTooltip term="Retorno total" /></p>
                  <TooltipPrimitive.Root delayDuration={150}>
                    <TooltipPrimitive.Trigger asChild>
                      <div className="cursor-help">
                        <p className={cn("font-mono text-sm", plClass(toNumber(p.pl_total)))}>{formatCurrency(toNumber(p.pl_total))}</p>
                        <p className={cn("font-mono text-[11px]", plClass(toNumber(p.pl_total_percent)))}>{formatPercent(toNumber(p.pl_total_percent), true)}</p>
                      </div>
                    </TooltipPrimitive.Trigger>
                    <TooltipPrimitive.Portal>
                      <TooltipPrimitive.Content
                        sideOffset={6}
                        className="z-50 rounded-lg bg-haveres-card border border-haveres-border px-3 py-2 text-xs shadow-xl space-y-1"
                      >
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Valorização</span>
                          <span className={cn("font-mono", plClass(toNumber(p.pl_absolute)))}>{formatCurrency(toNumber(p.pl_absolute))}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Proventos</span>
                          <span className="font-mono text-gain">+{formatCurrency(toNumber(p.dividends_received))}</span>
                        </div>
                        <TooltipPrimitive.Arrow className="fill-haveres-border" />
                      </TooltipPrimitive.Content>
                    </TooltipPrimitive.Portal>
                  </TooltipPrimitive.Root>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground"><TermTooltip term="Alocação" /></p>
                  <p className="font-mono text-sm text-white">{formatPercent(toNumber(p.allocation))}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block relative max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-haveres-border">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "sticky top-0 z-20 bg-haveres-card text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors",
                      COLUMN_WIDTH_CLASS[header.column.id],
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? <ArrowUp size={12} /> :
                        header.column.getIsSorted() === "desc" ? <ArrowDown size={12} /> :
                          <ArrowUpDown size={12} className="opacity-40" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-haveres-border/50 hover:bg-secondary/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cn("py-3 px-3", COLUMN_WIDTH_CLASS[cell.column.id])}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
