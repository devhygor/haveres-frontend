import React, { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className,
}) => {
  return (
    <div className={cn("group relative inline-block", className)}>
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-max">
        {content}
      </div>
    </div>
  );
};
