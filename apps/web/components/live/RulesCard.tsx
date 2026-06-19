"use client";

import React from "react";

interface RulesCardProps {
  onSafetyClick: () => void;
}

export function RulesCard({ onSafetyClick }: RulesCardProps) {
  return (
    <div className="bg-[#e8e8ec] border border-black/[0.04] rounded-xl py-3 px-4 text-[11px] md:text-xs leading-relaxed text-neutral-700 shadow-sm relative select-none">
      <span className="font-black text-neutral-800 block mb-1 uppercase tracking-wide text-[10px] md:text-[11px]">
        Community Rules & Safety
      </span>
      <p className="inline">
        By pressing Start Match, you agree to our rules. Be respectful. No harassment, spam, or unsafe behavior. Permanent chat unlocks only after mutual match.
      </p>
      <button
        type="button"
        onClick={onSafetyClick}
        className="ml-1.5 text-neonPink font-bold hover:underline inline-flex items-center gap-0.5 outline-none cursor-pointer"
      >
        ⚠ Safety Reminder
      </button>
    </div>
  );
}

