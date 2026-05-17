import { PenLine, Landmark, FileSpreadsheet, Link2, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

interface SourceConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

const SOURCE_MAP: Record<string, SourceConfig> = {
  MANUAL: {
    label: "Manual",
    icon: <PenLine size={11} />,
    className: "text-muted-foreground border-haveres-border bg-secondary",
  },
  B3_CEI: {
    label: "B3",
    icon: <Landmark size={11} />,
    className: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  },
  GENERIC_CSV: {
    label: "Planilha",
    icon: <FileSpreadsheet size={11} />,
    className: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  },
  XP: {
    label: "XP",
    icon: <FileSpreadsheet size={11} />,
    className: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  },
  CLEAR: {
    label: "Clear",
    icon: <FileSpreadsheet size={11} />,
    className: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  },
  INTER: {
    label: "Inter",
    icon: <FileSpreadsheet size={11} />,
    className: "text-orange-500 border-orange-500/30 bg-orange-500/10",
  },
  RICO: {
    label: "Rico",
    icon: <FileSpreadsheet size={11} />,
    className: "text-green-400 border-green-400/30 bg-green-400/10",
  },
  OPEN_FINANCE: {
    label: "Open Finance",
    icon: <Link2 size={11} />,
    className: "text-gain border-gain/30 bg-gain/10",
  },
  BRAPI_SYNC: {
    label: "Sync Auto",
    icon: <RefreshCw size={11} />,
    className: "text-haveres-blue border-haveres-blue/30 bg-haveres-blue/10",
  },
};

const FALLBACK: SourceConfig = {
  label: "Desconhecido",
  icon: <PenLine size={11} />,
  className: "text-muted-foreground border-haveres-border bg-secondary",
};

interface Props {
  source?: string;
}

export function SourceBadge({ source }: Props) {
  if (!source) return null;
  const config = SOURCE_MAP[source.toUpperCase()] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium whitespace-nowrap",
        config.className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
