"use client";

import React, { ReactNode } from "react";

interface VideoStageProps {
  localPanel: ReactNode;
  remotePanel: ReactNode;
  timerBadge?: ReactNode;
  swipeOverlay?: ReactNode;
}

export function VideoStage({
  localPanel,
  remotePanel,
  timerBadge,
  swipeOverlay
}: VideoStageProps) {
  return (
    <div className="relative w-full h-full bg-[#08090f] overflow-hidden rounded-2xl border border-white/10 shadow-glow">
      {/* Main Remote Partner view container */}
      <div className="w-full h-full z-0">
        {remotePanel}
      </div>

      {/* Floating Local preview webcam container (PiP) */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 w-32 h-44 sm:w-44 sm:h-60 md:w-52 md:h-72 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
        {localPanel}
      </div>

      {/* Floating timer countdown badge */}
      {timerBadge && (
        <div className="absolute top-4 left-4 z-30">
          {timerBadge}
        </div>
      )}

      {/* Swipe choice / result overlay */}
      {swipeOverlay && (
        <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center">
          {swipeOverlay}
        </div>
      )}
    </div>
  );
}
