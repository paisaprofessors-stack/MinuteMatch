"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui";

export type ControlButtonVariant = "start" | "end" | "filter";

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ControlButtonVariant;
  icon?: ReactNode;
  label: string;
  sublabel?: string;
}

export function ControlButton({
  variant = "filter",
  icon,
  label,
  sublabel,
  className,
  ...props
}: ControlButtonProps) {
  const variantClasses = {
    start: "bg-[#e8f7ec] border border-[#a7f3d0] text-[#065f46] hover:bg-[#d1fae5] hover:border-[#34d399] active:scale-[0.98] shadow-sm",
    end: "bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-[0.98] shadow-sm",
    filter: "bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98] shadow-sm"
  };

  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center justify-center w-full h-24 md:h-28 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-40 disabled:pointer-events-none select-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <div className="mb-1.5 shrink-0 transition-transform duration-200 group-hover:scale-105">{icon}</div>}
      <span className="text-xs md:text-sm font-black tracking-wide uppercase">{label}</span>
      {sublabel && (
        <span className="text-[10px] lowercase font-medium text-neutral-400 mt-0.5 truncate max-w-full px-1.5">
          {sublabel}
        </span>
      )}
    </button>
  );
}

