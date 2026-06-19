import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useEffect } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";
import { useProfileStore } from "@/store/profileStore";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="quiet-grid pointer-events-none fixed inset-0 -z-10" />
      {children}
    </main>
  );
}

export function Navbar() {
  const { xp, streak, checkStreak, hydrate } = useProfileStore();

  useEffect(() => {
    hydrate();
    checkStreak();
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpPercent = xp % 100;

  return (
    <nav className="sticky top-0 z-35 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/5 bg-[#030303]/80 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <Link href="/" className="text-base font-black tracking-wide sm:text-lg font-display">
          Minute<span className="accent-text">Match</span>
        </Link>
        
        {/* Gamified HUD for Mobile */}
        <div className="flex sm:hidden items-center gap-3 select-none">
          <div className="flex items-center gap-1 text-xs font-black text-white">
            <span className="text-neonPink animate-pulse">🔥</span>
            <span>{streak}d</span>
          </div>
          <div className="text-[10px] font-black text-neonBlue bg-neonBlue/10 px-2 py-0.5 rounded-full border border-neonBlue/20">
            Lv. {level}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Gamified HUD for Desktop */}
        <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-full shadow-inner select-none">
          <div className="flex items-center gap-1 text-xs font-black text-white" title="Streak">
            <span className="text-neonPink animate-pulse">🔥</span>
            <span>{streak}d</span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-neonBlue">Lv. {level}</span>
            <div className="relative w-12 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-neonBlue to-neonPink rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-white/50">{xp} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs text-white/70 sm:text-sm">
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/match">Match</Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/friends">Friends</Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/safety">Safety</Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/admin">Admin</Link>
        </div>
      </div>
    </nav>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("glass rounded-2xl p-5 soft-in", className)}>{children}</section>;
}

export function Button({ children, loading, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-bold text-white transition duration-200 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Chip({ active, children, onClick, disabled }: { active?: boolean; children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-11 rounded-full border px-3.5 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-45",
        active ? "border-[#ff6fae]/70 bg-[#ff6fae]/15 text-white shadow-[0_0_28px_rgba(255,111,174,0.08)]" : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/18 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/80">
      {label}
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn("min-h-12 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#68b8ff]/70 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#68b8ff]/15", className)}
    />
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("min-h-12 rounded-xl border border-white/10 bg-panelSoft px-4 text-white outline-none transition focus:border-[#68b8ff]/70 focus:ring-2 focus:ring-[#68b8ff]/15", className)}
    />
  );
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn("min-h-28 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#68b8ff]/70 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#68b8ff]/15", className)}
    />
  );
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-center">
      <p className="font-black">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">{copy}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 py-8 sm:py-10 lg:flex-row lg:items-end">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.24em] text-[#68b8ff]">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.02] sm:text-6xl">{title}</h1>
        {copy ? <p className="mt-4 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">{copy}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "accent" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.05] text-white/70",
    success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
    warning: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    danger: "border-rose-300/20 bg-rose-300/10 text-rose-200",
    accent: "border-[#d86bff]/25 bg-[#d86bff]/10 text-[#f0c8ff]"
  };
  return <span className={cn("inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.04] text-white/70",
    success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    danger: "border-rose-300/20 bg-rose-300/10 text-rose-100"
  };
  return <div className={cn("rounded-2xl border p-4 text-sm leading-6", tones[tone])}>{children}</div>;
}

export function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-3 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="glass max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 shadow-glow">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black">{title}</h2>
          <button aria-label={`Close ${title}`} onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CTAButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href}>
      <Button>
        {children}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
