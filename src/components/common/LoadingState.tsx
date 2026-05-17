import { cn } from "@/utils/cn";

interface Props { message?: string; className?: string }

export function LoadingState({ message = "Carregando...", className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3", className)}>
      <div className="w-8 h-8 border-2 border-haveres-blue border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-haveres p-6 animate-pulse", className)}>
      <div className="h-4 bg-secondary rounded w-1/3 mb-3" />
      <div className="h-8 bg-secondary rounded w-1/2 mb-2" />
      <div className="h-3 bg-secondary rounded w-1/4" />
    </div>
  );
}
