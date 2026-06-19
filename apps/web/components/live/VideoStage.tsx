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
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 w-28 h-36 sm:w-36 sm:h-48 md:w-40 md:h-52 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.03]">
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
