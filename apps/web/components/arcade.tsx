"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight, Ban, Flag, Loader2, Power, ShieldAlert } from "lucide-react";
import { cn } from "./ui";

export function GameShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("arcade-bg relative min-h-screen overflow-x-hidden px-4 py-4 text-white sm:px-6 lg:px-8", className)}>
      <div className="scanline pointer-events-none fixed inset-0 z-0" />
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}

export function HUDBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <nav className="sticky top-0 z-40 grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-white/10 bg-[#050506]/86 py-3 backdrop-blur-xl">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{center}</div>
      <div className="flex min-w-0 justify-end">{right}</div>
    </nav>
  );
}

export function ArcadeBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={cn("font-black uppercase tracking-[-0.02em]", compact ? "text-lg" : "text-2xl sm:text-3xl")}>
      Minute<span className="text-[#9ff84d]">Match</span>
    </Link>
  );
}

export function TinyNav() {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1 text-[11px] font-black uppercase tracking-[0.08em] text-white/54">
      <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/safety">Safety</Link>
      <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/friends">Friends</Link>
      <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/admin">Admin</Link>
    </div>
  );
}

export function ArcadePanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("arcade-panel rounded-[1.25rem] p-4 sm:p-5", className)}>{children}</section>;
}

export function ArcadeButton({
  children,
  loading,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: "primary" | "ghost" | "danger" | "success" }) {
  const variants = {
    primary: "bg-white text-black hover:bg-[#9ff84d]",
    ghost: "border border-white/13 bg-white/[0.035] text-white hover:border-white/24 hover:bg-white/[0.08]",
    danger: "border border-[#ff4f70]/35 bg-[#ff4f70]/12 text-[#ff91a6] hover:bg-[#ff4f70]/18",
    success: "bg-[#9ff84d] text-black hover:bg-[#b8ff73]"
  };
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.06em] transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function StatPill({ label, value, tone = "blue" }: { label: string; value: string | number; tone?: "blue" | "rose" | "green" | "white" }) {
  const tones = {
    blue: "border-[#56b7ff]/24 bg-[#56b7ff]/10 text-[#7fc8ff]",
    rose: "border-[#ff6f9f]/24 bg-[#ff6f9f]/10 text-[#ff9cbd]",
    green: "border-[#9ff84d]/24 bg-[#9ff84d]/10 text-[#c9ff94]",
    white: "border-white/12 bg-white/[0.045] text-white/78"
  };
  return (
    <div className={cn("rounded-2xl border px-3 py-2", tones[tone])}>
      <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-60">{label}</p>
      <p className="mt-0.5 text-xl font-black leading-none">{value}</p>
    </div>
  );
}

export function ProgressDots({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={step} className={cn("h-2 rounded-full transition-all", index === current ? "w-8 bg-[#9ff84d]" : index < current ? "w-4 bg-white/45" : "w-2 bg-white/16")} />
      ))}
    </div>
  );
}

export function ChoiceTile({
  active,
  title,
  meta,
  icon,
  onClick,
  disabled
}: {
  active?: boolean;
  title: string;
  meta?: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group min-h-20 rounded-2xl border p-4 text-left transition duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-42",
        active ? "border-[#9ff84d]/70 bg-[#9ff84d]/12 shadow-[0_0_28px_rgba(159,248,77,0.08)]" : "border-white/10 bg-white/[0.04] hover:border-white/22 hover:bg-white/[0.07]"
      )}
    >
      <div className="flex items-center gap-3">
        {icon ? <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/35 text-[#9ff84d]">{icon}</div> : null}
        <div>
          <p className="text-base font-black">{title}</p>
          {meta ? <p className="mt-1 text-xs font-semibold text-white/45">{meta}</p> : null}
        </div>
      </div>
    </button>
  );
}

export function LoadoutChip({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return (
    <span className={cn("inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-black uppercase tracking-[0.06em]", active ? "border-[#56b7ff]/25 bg-[#56b7ff]/10 text-[#8fd0ff]" : "border-white/10 bg-white/[0.035] text-white/45")}>
      {children}
    </span>
  );
}

export function ScannerPanel({ active, lines }: { active: boolean; lines: string[] }) {
  return (
    <ArcadePanel className="relative overflow-hidden">
      <div className={cn("scanner-beam absolute inset-x-0 top-0 h-24 opacity-0", active && "opacity-100")} />
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9ff84d]">Match scanner</p>
        <div className="mt-4 grid gap-2">
          {lines.map((line, index) => (
            <motion.div
              key={line}
              animate={active ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.7 }}
              transition={{ repeat: active ? Infinity : 0, duration: 1.6, delay: index * 0.18 }}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-black/24 px-3 py-2 text-xs font-bold text-white/64"
            >
              <span>{line}</span>
              <span className={active ? "text-[#9ff84d]" : "text-white/28"}>{active ? "LIVE" : "IDLE"}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </ArcadePanel>
  );
}

export function RoundTimer({ remaining, finalPhase }: { remaining: number; finalPhase: boolean }) {
  const progress = Math.max(0, Math.min(60, remaining));
  const degree = (progress / 60) * 360;
  return (
    <motion.div
      animate={finalPhase ? { scale: [1, 1.035, 1], rotate: [0, -0.6, 0.6, 0] } : { scale: 1, rotate: 0 }}
      transition={{ repeat: finalPhase ? Infinity : 0, duration: 0.75 }}
      className="relative mx-auto grid h-48 w-48 place-items-center rounded-full sm:h-60 sm:w-60"
      style={{ background: `conic-gradient(${finalPhase ? "#ffb84d" : "#9ff84d"} ${degree}deg, rgba(255,255,255,0.08) 0deg)` }}
    >
      <div className="grid h-[86%] w-[86%] place-items-center rounded-full border border-white/10 bg-[#050506] text-center shadow-[inset_0_0_36px_rgba(255,255,255,0.035)]">
        <div>
          <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", finalPhase ? "text-[#ffcf72]" : "text-[#9ff84d]")}>{finalPhase ? "Final 15" : "Round live"}</p>
          <p className="mt-1 text-7xl font-black leading-none tracking-[-0.08em]">{remaining}</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/34">seconds</p>
        </div>
      </div>
    </motion.div>
  );
}

export function DecisionCard({
  title,
  copy,
  result,
  waiting,
  onPass,
  onLock,
  onNext,
  onFriends
}: {
  title: string;
  copy: string;
  result?: "mutual_match" | "request_sent" | "no_match" | "partner_left" | "error";
  waiting?: boolean;
  onPass: () => void;
  onLock: () => void;
  onNext: () => void;
  onFriends: () => void;
}) {
  const complete = Boolean(result);
  return (
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed inset-0 z-40 grid place-items-end bg-black/76 p-3 backdrop-blur-md sm:place-items-center">
      <div className="arcade-panel relative w-full max-w-xl overflow-hidden rounded-[1.6rem] p-5 sm:p-7">
        {result === "mutual_match" ? <div className="confetti-burst absolute inset-x-0 top-0 h-24" /> : null}
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#56b7ff]">{complete ? "Result" : "Decision card"}</p>
        <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">{title}</h2>
        <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/56">{copy}</p>
        {!complete ? (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <ArcadeButton disabled={waiting} variant="ghost" onClick={onPass} className="min-h-16">Pass</ArcadeButton>
            <ArcadeButton loading={waiting} variant="success" onClick={onLock} className="min-h-16">Lock in</ArcadeButton>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <ArcadeButton variant="success" onClick={onNext} className="min-h-16">Next round</ArcadeButton>
            <ArcadeButton variant="ghost" onClick={onFriends} className="min-h-16">Friends</ArcadeButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function IconSafetyButton({
  label,
  kind,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; kind: "report" | "block" | "end" }) {
  const Icon = kind === "report" ? Flag : kind === "block" ? Ban : Power;
  const color = kind === "report" ? "text-[#ffcf72]" : kind === "block" ? "text-[#ff7d9a]" : "text-white/55";
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={cn("grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-white/22 hover:bg-white/[0.075]", color, props.className)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function SafetyMark({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#9ff84d]/20 bg-[#9ff84d]/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#c9ff94]">
      <ShieldAlert className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

export function StartLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href}>
      <ArcadeButton className="min-h-16 rounded-[1.25rem] px-7 text-base">
        {children}
        <ArrowRight className="h-5 w-5" />
      </ArcadeButton>
    </Link>
  );
}
