import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState, type Row,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatPercent, formatQuantity, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Position } from "@/types/portfolio";
import { ASSET_TYPE_LABELS } from "@/types/asset";
import { AssetLogo } from "@/components/common/AssetLogo";
import { TermTooltip } from "@/components/common/TermTooltip";

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

interface Props {
  positions: Position[];
  targetInputs: Record<string, string>;
  invalidTargetAssetIds: Set<string>;
  maxBuyInputs: Record<string, string>;
  invalidMaxBuyAssetIds: Set<string>;
  onTargetCommit: (assetId: string, rawValue: string) => void;
  onMaxBuyCommit: (assetId: string, rawValue: string) => void;
}

function maskPercentInput(value: string): string {
  const normalized = value
    .replace(/\./g, ",")
    .replace(/\s/g, "")
    .replace(/[^0-9,]/g, "");

  const [integerRaw, ...decimalParts] = normalized.split(",");
  let integerPart = integerRaw.slice(0, 3);
  const decimalPart = decimalParts.join("").slice(0, 2);

  if (normalized.startsWith(",")) {
    integerPart = "0";
  }

  if (!integerPart && !normalized.includes(",")) {
    return "";
  }

  if (!integerPart) {
    return `0,${decimalPart}`;
  }

  const valueAsNumber = Number(`${integerPart}.${decimalPart || "0"}`);
  if (Number.isFinite(valueAsNumber) && valueAsNumber > 100) {
    return "100";
  }

  if (normalized.includes(",")) {
    return `${integerPart},${decimalPart}`;
  }

  return integerPart;
}

function maskMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface TargetPercentInputProps {
  assetId: string;
  value: string;
  invalid: boolean;
  onCommit: (assetId: string, rawValue: string) => void;
}

function TargetPercentInput({ assetId, value, invalid, onCommit }: TargetPercentInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    onCommit(assetId, localValue);
  };

  const focusNextTargetInput = (current: HTMLInputElement) => {
    const allTargetInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[data-target-allocation-input="true"]'),
    );
    const currentIndex = allTargetInputs.indexOf(current);
    if (currentIndex < 0) return;

    const nextInput = allTargetInputs[currentIndex + 1];
    const nextAssetId = nextInput?.getAttribute("data-target-allocation-asset-id");

    if (nextAssetId) {
      requestAnimationFrame(() => {
        const nextRenderedInput = document.querySelector<HTMLInputElement>(
          `input[data-target-allocation-asset-id="${nextAssetId}"]`,
        );
        if (!nextRenderedInput) return;
        nextRenderedInput.focus();
        nextRenderedInput.select();
      });
      return;
    }

    current.blur();
  };

  return (
    <div className="w-[108px]">
      <div className="relative">
        <input
          type="text"
          value={localValue}
          data-target-allocation-input="true"
          data-target-allocation-asset-id={assetId}
          inputMode="decimal"
          onChange={(event) => setLocalValue(maskPercentInput(event.target.value))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
              focusNextTargetInput(event.currentTarget);
            }
          }}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "w-full bg-secondary border rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:ring-1",
            invalid
              ? "border-loss focus:ring-loss"
              : "border-haveres-border focus:ring-haveres-blue",
          )}
          placeholder="0"
        />
        <span className="absolute right-2 top-1.5 text-xs text-muted-foreground pointer-events-none">%</span>
      </div>
    </div>
  );
}

interface MaxBuyPriceInputProps {
  assetId: string;
  value: string;
  invalid: boolean;
  onCommit: (assetId: string, rawValue: string) => void;
}

function MaxBuyPriceInput({ assetId, value, invalid, onCommit }: MaxBuyPriceInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    onCommit(assetId, localValue);
  };

  const focusNextMaxBuyInput = (current: HTMLInputElement) => {
    const allMaxBuyInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[data-max-buy-price-input="true"]'),
    );
    const currentIndex = allMaxBuyInputs.indexOf(current);
    if (currentIndex < 0) return;

    const nextInput = allMaxBuyInputs[currentIndex + 1];
    const nextAssetId = nextInput?.getAttribute("data-max-buy-price-asset-id");

    if (nextAssetId) {
      requestAnimationFrame(() => {
        const nextRenderedInput = document.querySelector<HTMLInputElement>(
          `input[data-max-buy-price-asset-id="${nextAssetId}"]`,
        );
        if (!nextRenderedInput) return;
        nextRenderedInput.focus();
        nextRenderedInput.select();
      });
      return;
    }

    current.blur();
  };

  return (
    <div className="w-[120px]">
      <div className="relative">
        <span className="absolute left-2 top-1.5 text-xs text-muted-foreground pointer-events-none">R$</span>
        <input
          type="text"
          value={localValue}
          data-max-buy-price-input="true"
          data-max-buy-price-asset-id={assetId}
          inputMode="numeric"
          onChange={(event) => setLocalValue(maskMoneyInput(event.target.value))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
              focusNextMaxBuyInput(event.currentTarget);
            }
          }}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "w-full bg-secondary border rounded pl-8 pr-2 py-1 text-sm font-mono text-white focus:outline-none focus:ring-1",
            invalid
              ? "border-loss focus:ring-loss"
              : "border-haveres-border focus:ring-haveres-blue",
          )}
          placeholder=""
        />
      </div>
    </div>
  );
}

export function PositionsTable({
  positions,
  targetInputs,
  invalidTargetAssetIds,
  maxBuyInputs,
  invalidMaxBuyAssetIds,
  onTargetCommit,
  onMaxBuyCommit,
}: Props) {
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
          <div className="flex items-center gap-2">
            <AssetLogo logoUrl={row.original.logo_url} ticker={row.original.ticker} />
            <div>
              <Link
                to={`/ativos/${row.original.ticker}`}
                className={cn(
                  "font-semibold text-haveres-blue hover:text-white text-sm transition-colors",
                  !isTreasury && "font-mono",
                )}
                title={isTreasury ? row.original.name : row.original.ticker}
              >
                {isTreasury ? row.original.name : row.original.ticker}
              </Link>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]" title={isTreasury ? row.original.ticker : row.original.name}>
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
      id: "max_buy_price",
      accessorFn: (row) => row.max_buy_price ?? 0,
      header: () => <TermTooltip term="Preço Máximo de Compra" />,
      sortingFn: numericSorting,
      cell: ({ row }) => {
        const assetId = row.original.asset_id;
        const value = maxBuyInputs[assetId] ?? "";
        const invalid = invalidMaxBuyAssetIds.has(assetId);

        return (
          <MaxBuyPriceInput
            assetId={assetId}
            value={value}
            invalid={invalid}
            onCommit={onMaxBuyCommit}
          />
        );
      },
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
      accessorKey: "pl_absolute",
      header: () => <TermTooltip term="P&L" />,
      sortingFn: numericSorting,
      cell: ({ row }) => (
        <div>
          <p className={cn("font-mono text-sm font-medium", plClass(row.original.pl_absolute))}>
            {formatCurrency(row.original.pl_absolute)}
          </p>
          <p className={cn("font-mono text-xs", plClass(row.original.pl_percent))}>
            {formatPercent(row.original.pl_percent, true)}
          </p>
        </div>
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
      id: "target_allocation_percent",
      accessorFn: (row) => row.target_allocation_percent,
      header: () => <TermTooltip term="Meta de Alocação" />,
      sortingFn: numericSorting,
      cell: ({ row }) => {
        const assetId = row.original.asset_id;
        const value = targetInputs[assetId] ?? "";
        const invalid = invalidTargetAssetIds.has(assetId);

        return (
          <TargetPercentInput
            assetId={assetId}
            value={value}
            invalid={invalid}
            onCommit={onTargetCommit}
          />
        );
      },
    },
    {
      accessorKey: "max_buy_gap_value",
      header: () => <TermTooltip term="Janela de Compra" />,
      sortingFn: numericSorting,
      cell: ({ row }) => {
        const maxBuyPrice = row.original.max_buy_price;
        const gapValue = row.original.max_buy_gap_value;
        const gapPercent = row.original.max_buy_gap_percent;
        const isWithin = row.original.is_within_max_buy_price;

        if (maxBuyPrice == null) {
          return <span className="text-xs text-muted-foreground">Não definido</span>;
        }

        return (
          <div>
            <p className={cn("font-mono text-sm font-medium", plClass(toNumber(gapValue)))}>
              {formatCurrency(toNumber(gapValue))}
            </p>
            <p className={cn("font-mono text-xs", plClass(toNumber(gapPercent)))}>
              {formatPercent(toNumber(gapPercent), true)}
            </p>
            <p className={cn("text-[11px] mt-0.5", isWithin ? "text-gain" : "text-loss")}>
              {isWithin ? "Dentro do preço" : "Acima do máximo"}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "target_gap_value",
      header: () => <TermTooltip term="Desvio da Meta" />,
      sortingFn: numericSorting,
      cell: ({ row }) => {
        const gapValue = toNumber(row.original.target_gap_value);
        const gapPercent = toNumber(row.original.target_gap_percent);
        const needsBuy = gapValue > 0;
        const needsTrim = gapValue < 0;

        return (
          <div title={`Valor alvo: ${formatCurrency(toNumber(row.original.target_value))}`}>
            <p className={cn("font-mono text-sm font-medium", plClass(gapValue))}>
              {formatCurrency(gapValue)}
            </p>
            <p className={cn("font-mono text-xs", plClass(gapPercent))}>
              {formatPercent(gapPercent, true)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {needsBuy && `Aportar ${formatCurrency(gapValue)}`}
              {needsTrim && `Reduzir ${formatCurrency(Math.abs(gapValue))}`}
              {!needsBuy && !needsTrim && "Na meta"}
            </p>
          </div>
        );
      },
    },
  ]), [
    invalidMaxBuyAssetIds,
    invalidTargetAssetIds,
    maxBuyInputs,
    onMaxBuyCommit,
    onTargetCommit,
    targetInputs,
  ]);

  const table = useReactTable({
    data: positions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1520px] text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-haveres-border">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors"
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
                <td key={cell.id} className="py-3 px-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
