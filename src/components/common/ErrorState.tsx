import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message = "Erro ao carregar dados.", onRetry, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3", className)}>
      <AlertCircle size={32} className="text-loss" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-sm text-haveres-blue hover:underline"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
