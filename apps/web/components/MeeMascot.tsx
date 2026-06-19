"use client";

import React from "react";
import { motion } from "framer-motion";

export type MascotState = "idle" | "searching" | "success" | "sad";

interface MeeMascotProps {
  state: MascotState;
  className?: string;
  size?: number;
}

export function MeeMascot({ state, className = "", size = 120 }: MeeMascotProps) {
  // Common bouncy float animation
  const floatTransition = {
    y: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <motion.svg
        animate={{ y: [0, -6, 0] }}
        transition={floatTransition}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Shadow underneath */}
        <ellipse cx="60" cy="110" rx="36" ry="6" fill="rgba(0, 240, 255, 0.08)" />

        {/* Mascot Body */}
        <motion.path
          d="M20 60C20 35 35 20 60 20C85 20 100 35 100 60C100 85 85 100 60 100C35 100 20 85 20 60Z"
          fill="url(#bodyGradient)"
          stroke="#00f0ff"
          strokeWidth="3"
        />

        {/* Rosy Cheeks */}
        <circle cx="36" cy="72" r="6" fill="#ff007f" opacity="0.35" />
        <circle cx="84" cy="72" r="6" fill="#ff007f" opacity="0.35" />

        {/* Mascot Eyes */}
        {state !== "sad" ? (
          <>
            {/* Left Eye */}
            <circle cx="44" cy="60" r="8" fill="#ffffff" />
            <motion.circle
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, repeatDelay: 1.5 }}
              cx="44"
              cy="60"
              r="4"
              fill="#08090f"
            />
            {/* Right Eye */}
            <circle cx="76" cy="60" r="8" fill="#ffffff" />
            <motion.circle
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, repeatDelay: 1.5 }}
              cx="76"
              cy="60"
              r="4"
              fill="#08090f"
            />
          </>
        ) : (
          <>
            {/* Sad/Drawn Eyes */}
            <path d="M38 64C40 60 44 60 46 64" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 64C72 60 76 60 78 64" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {/* Mascot Mouth */}
        {state === "idle" && (
          <path d="M54 74C56 77 64 77 66 74" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        )}
        {state === "searching" && (
          <path d="M52 74C54 75 66 75 68 74" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        )}
        {state === "success" && (
          <path d="M52 72C52 78 68 78 68 72Z" fill="#ff007f" stroke="#ffffff" strokeWidth="2" />
        )}
        {state === "sad" && (
          <path d="M54 76C56 73 64 73 66 76" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* State-specific overlay elements */}
        {state === "searching" && (
          /* Cyber Radar Goggles overlay */
          <g>
            <rect x="28" y="50" width="64" height="16" rx="8" fill="rgba(0, 240, 255, 0.3)" stroke="#00f0ff" strokeWidth="2" />
            <line x1="60" y1="50" x2="60" y2="66" stroke="#00f0ff" strokeWidth="2" />
            <circle cx="44" cy="58" r="4" fill="#9ff84d" />
            <circle cx="76" cy="58" r="4" fill="#9ff84d" />
          </g>
        )}

        {state === "success" && (
          /* Glowing Gold Crown */
          <g>
            <path d="M42 22L50 10L60 18L70 10L78 22H42Z" fill="#ffcf72" stroke="#ffffff" strokeWidth="2" />
            <circle cx="50" cy="8" r="2" fill="#ff007f" />
            <circle cx="60" cy="16" r="2" fill="#00f0ff" />
            <circle cx="70" cy="8" r="2" fill="#9ff84d" />
            {/* Sparkles */}
            <path d="M25 15L27 10L29 15L34 17L29 19L27 24L25 19L20 17L25 15Z" fill="#9ff84d" />
            <path d="M92 18L93 14L95 18L99 19L95 20L93 24L92 20L88 19L92 18Z" fill="#00f0ff" />
          </g>
        )}

        {/* Gradients declarations */}
        <defs>
          <linearGradient id="bodyGradient" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#080a18" />
            <stop offset="0.6" stopColor="#0a1d35" />
            <stop offset="1" stopColor="#0b2c52" />
          </linearGradient>
        </defs>
      </motion.svg>

      {state === "sad" && (
        /* Motivational sign overlay */
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="absolute bottom-1 bg-gradient-to-r from-neonPink to-[#9e0059] border border-neonPink/30 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md whitespace-nowrap"
        >
          Next vibe is waiting!
        </motion.div>
      )}
    </div>
  );
}
