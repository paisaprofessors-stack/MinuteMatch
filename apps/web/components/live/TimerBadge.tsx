import { Clock3 } from "lucide-react";

export function TimerBadge({ remaining }: { remaining: number }) {
  const value = Math.max(0, remaining);

  return (
    <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-black/55 px-3.5 py-2 text-white shadow-[0_14px_38px_rgba(0,0,0,0.28)] backdrop-blur-md">
      <Clock3 className="h-4 w-4 text-[#9ff84d]" />
      <span className="tabular-nums text-lg font-black leading-none">{value}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">sec</span>
    </div>
  );
}
