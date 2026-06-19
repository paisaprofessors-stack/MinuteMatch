"use client";

import React from "react";

interface RulesCardProps {
  onSafetyClick: () => void;
}

export function RulesCard({ onSafetyClick }: RulesCardProps) {
  return (
    <div className="glass-card rounded-2xl py-3.5 px-4.5 text-[11px] leading-relaxed text-white/60 shadow-md relative select-none border border-white/5 bg-white/[0.02]">
      <span className="font-black text-white/95 block mb-1 uppercase tracking-wider text-[10px]">
        Community Rules & Safety
      </span>
      <p className="inline">
        By pressing Start Match, you agree to our rules. Be respectful. No harassment, spam, or unsafe behavior. Mutual matches unlock permanent contact tools.
      </p>
      <button
        type="button"
        onClick={onSafetyClick}
        className="ml-1.5 text-neonPink font-extrabold hover:underline inline-flex items-center gap-0.5 outline-none cursor-pointer tracking-wider text-[10px] uppercase"
      >
        ⚠ Safety Guide
      </button>
    </div>
  );
}

