import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onClose, title, children, size = "md" }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 bg-haveres-card border border-haveres-border rounded-xl w-full max-h-[90vh] overflow-y-auto", SIZES[size])}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-haveres-border bg-haveres-card sticky top-0 rounded-t-xl z-10">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors p-1 rounded hover:bg-secondary"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
