import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState, type Row,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatPercent, formatQuantity, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Position } from "@/types/portfolio";

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

const columns: ColumnDef<Position>[] = [
  {
    accessorKey: "ticker",
    header: "Ticker",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-white font-mono text-sm">{row.original.ticker}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{row.original.name}</p>
      </div>
    ),
  },
  {
    accessorKey: "asset_type",
    header: "Tipo",
    cell: ({ getValue }) => (
      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
        {getValue() as string}
      </span>
    ),
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
    header: "PM",
    sortingFn: numericSorting,
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">{formatCurrency(getValue() as number)}</span>
    ),
  },
  {
    accessorKey: "current_price",
    header: "Cotação",
    sortingFn: numericSorting,
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-white">{formatCurrency(getValue() as number)}</span>
    ),
  },
  {
    accessorKey: "total_invested",
    header: "Investido",
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
    header: "P&L",
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
    header: "Alocação",
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
];

interface Props { positions: Position[] }

export function PositionsTable({ positions }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "current_value", desc: true },
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
      <table className="w-full text-sm">
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
