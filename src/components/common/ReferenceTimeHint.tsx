import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Clock3 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ReferenceTimeHintProps {
  asOf?: string | null;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  className?: string;
  compact?: boolean;
}

function parseDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCompact(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLong(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function ReferenceTimeHint({
  asOf,
  rangeStart,
  rangeEnd,
  className,
  compact = false,
}: ReferenceTimeHintProps) {
  const start = parseDateTime(rangeStart);
  const end = parseDateTime(rangeEnd);
  const exact = parseDateTime(asOf) ?? end ?? start;

  if (!exact && !start && !end) return null;

  const hasRange = Boolean(start && end && start.getTime() !== end.getTime());
  const compactLabel = hasRange && end
    ? `Ref. ate ${formatCompact(end)}`
    : exact
      ? `Ref. ${formatCompact(exact)}`
      : "Ref.";

  const tooltipTitle = hasRange && start && end
    ? `Base do calculo entre ${formatLong(start)} e ${formatLong(end)}.`
    : exact
      ? `Base do calculo em ${formatLong(exact)}.`
      : "Base do calculo indisponivel.";

  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>
        <span
          aria-label={tooltipTitle}
          className={cn(
            "inline-flex items-center gap-1 text-[10px] leading-none text-muted-foreground/80 cursor-help",
            compact && "text-muted-foreground/70",
            className
          )}
        >
          <Clock3 size={11} className="shrink-0" />
          {!compact && <span>{compactLabel}</span>}
        </span>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 max-w-[280px] rounded-lg bg-haveres-card border border-haveres-border px-3 py-2 text-xs text-muted-foreground shadow-xl leading-relaxed"
        >
          {tooltipTitle}
          <TooltipPrimitive.Arrow className="fill-haveres-border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}