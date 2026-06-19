"use client";

import { motion } from "framer-motion";

export function TimerRing({ remaining }: { remaining: number }) {
  const progress = Math.max(0, Math.min(60, remaining));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 60) * circumference;

  // Color shifting: rose (danger) under 10s, amber (warning) under 30s, green (normal) above
  const strokeColor = remaining <= 10 ? "#fb7185" : remaining <= 30 ? "#f59e0b" : "#34d399";
  const isPulsing = remaining <= 15 && remaining > 0;

  return (
    <motion.div
      className="relative flex h-28 w-28 items-center justify-center"
      animate={isPulsing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{
        repeat: isPulsing ? Infinity : 0,
        duration: remaining <= 5 ? 0.5 : 1,
        ease: "easeInOut"
      }}
    >
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background Track Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-white/[0.08]"
          strokeWidth="6"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke={strokeColor}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "linear" }}
          strokeLinecap="round"
          style={{
            filter: remaining <= 15 ? `drop-shadow(0 0 6px ${strokeColor}aa)` : "none"
          }}
        />
      </svg>

      {/* Countdown digits */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-3xl font-black leading-none tabular-nums transition-colors duration-300 ${remaining <= 10 ? "text-[#fb7185]" : "text-white"}`}>
          {remaining}
        </span>
        <span className="mt-1 text-[8px] uppercase tracking-[0.24em] text-white/40">seconds</span>
      </div>
    </motion.div>
  );
}
