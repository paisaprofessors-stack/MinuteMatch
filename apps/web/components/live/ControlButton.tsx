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
    start: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-glowGreen shadow-[0_0_15px_rgba(159,248,77,0.05)]",
    end: "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 hover:shadow-glowPink shadow-[0_0_15px_rgba(255,0,127,0.05)]",
    filter: "bg-white/[0.03] border border-white/10 text-white/80 hover:bg-white/[0.08] hover:border-white/20 hover:text-white"
  };

  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center justify-center w-full h-24 md:h-28 rounded-2xl transition-all duration-300 focus:outline-none disabled:opacity-30 disabled:pointer-events-none select-none hover:-translate-y-0.5",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <div className="mb-1.5 shrink-0 transition-transform duration-300 group-hover:scale-105">{icon}</div>}
      <span className="text-xs md:text-sm font-black tracking-wider uppercase">{label}</span>
      {sublabel && (
        <span className="text-[10px] lowercase font-medium text-white/40 mt-0.5 truncate max-w-full px-1.5">
          {sublabel}
        </span>
      )}
    </button>
  );
}

