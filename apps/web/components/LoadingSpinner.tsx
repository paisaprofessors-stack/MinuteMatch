"use client";

import { motion } from "framer-motion";
import { MeeMascot } from "./MeeMascot";

export function LoadingSpinner({ message = "Finding someone with your vibe..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center p-6 select-none relative">
      {/* Radar Container */}
      <div className="relative w-48 h-48 flex items-center justify-center bg-black/40 rounded-full border border-white/5 overflow-hidden">
        
        {/* Concentric rings */}
        <div className="absolute inset-0 rounded-full border border-neonBlue/5 scale-[0.3]" />
        <div className="absolute inset-0 rounded-full border border-neonBlue/10 scale-[0.6]" />
        <div className="absolute inset-0 rounded-full border border-neonBlue/20 scale-[0.9] border-dashed" />
        
        {/* Sweeping line */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          className="absolute inset-0 origin-center"
          style={{
            background: "conic-gradient(from 0deg, rgba(0, 240, 255, 0.15) 0deg, rgba(0, 240, 255, 0) 90deg, transparent 360deg)"
          }}
        />

        {/* Pulsing Match dots */}
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
          className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-neonGreen rounded-full shadow-[0_0_10px_#9ff84d]"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
          className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-neonPink rounded-full shadow-[0_0_8px_#ff007f]"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.7, 1.3, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 1.0 }}
          className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-neonBlue rounded-full shadow-[0_0_8px_#00f0ff]"
        />

        {/* Central mascot 'Mee' searching */}
        <div className="absolute inset-0 flex items-center justify-center z-10 scale-[0.55] select-none">
          <MeeMascot state="searching" size={120} />
        </div>
      </div>

      <div className="space-y-1.5 z-10">
        <p className="text-base font-black text-white font-display tracking-tight">{message}</p>
        <p className="text-[10px] text-neonBlue/80 uppercase tracking-[0.2em] font-black">
          Scanning compatible interest filters
        </p>
      </div>
    </div>
  );
}
