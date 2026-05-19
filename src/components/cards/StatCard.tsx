import type { ReactNode } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";

interface StatCardProps {
  title: ReactNode;
  value: string | number;
  isCurrency?: boolean;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title, value, isCurrency = false, change, changeLabel,
  icon: Icon, iconColor = "text-haveres-blue", subtitle, className,
}: StatCardProps) {
  const displayValue = isCurrency && typeof value === "number"
    ? formatCurrency(value)
    : value;

  const ChangeIcon = change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className={cn("card-haveres p-5 hover:bg-haveres-card-hover transition-colors", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-secondary/50">
            <Icon size={16} className={iconColor} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white font-numeric mb-1">{displayValue}</p>
      {(change !== undefined || subtitle) && (
        <div className="flex items-center gap-2 mt-1">
          {change !== undefined && ChangeIcon && (
            <span className={cn("flex items-center gap-1 text-xs font-medium", plClass(change))}>
              <ChangeIcon size={12} />
              {formatPercent(change, true)}
            </span>
          )}
          {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
          {subtitle && !changeLabel && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface PLCardProps {
  title: ReactNode;
  absolute: number;
  percent: number;
  className?: string;
}

export function PLCard({ title, absolute, percent, className }: PLCardProps) {
  return (
    <div className={cn("card-haveres p-5", className)}>
      <p className="text-sm text-muted-foreground font-medium mb-3">{title}</p>
      <p className={cn("text-2xl font-bold font-numeric", plClass(absolute))}>
        {formatCurrency(absolute)}
      </p>
      <p className={cn("text-sm font-medium font-numeric mt-1", plClass(percent))}>
        {formatPercent(percent, true)}
      </p>
    </div>
  );
}
