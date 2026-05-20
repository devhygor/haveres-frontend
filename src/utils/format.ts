import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function toFinite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function formatCurrency(value: number, compact = false): string {
  const safeValue = toFinite(value);

  if (compact && Math.abs(safeValue) >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(safeValue);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatPercent(value: number, alwaysSign = false): string {
  const safeValue = toFinite(value);
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safeValue));
  const sign = safeValue > 0 ? "+" : safeValue < 0 ? "-" : alwaysSign ? "+" : "";
  return `${sign}${formatted}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  const safeValue = toFinite(value);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeValue);
}

export function formatQuantity(value: number): string {
  const safeValue = toFinite(value);
  return safeValue % 1 === 0
    ? new Intl.NumberFormat("pt-BR").format(safeValue)
    : formatNumber(safeValue, 4);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM/yy", { locale: ptBR });
}

export function isPositive(value: number): boolean {
  return toFinite(value) > 0;
}

export function plClass(value: number): string {
  const safeValue = toFinite(value);
  if (safeValue > 0) return "text-gain";
  if (safeValue < 0) return "text-loss";
  return "text-muted-foreground";
}
