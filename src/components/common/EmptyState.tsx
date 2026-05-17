import { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox, title = "Nenhum dado encontrado",
  description, action, className,
}: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3 text-center", className)}>
      <Icon size={40} className="text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
