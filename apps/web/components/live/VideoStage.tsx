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
    <div className="relative flex flex-col md:flex-row h-[65vh] md:h-[70vh] w-full border-b border-white/5 bg-[#08090f] overflow-hidden">
      {/* Local preview video container */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-white/5 shrink-0">
        {localPanel}
      </div>

      {/* Partner preview video container */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full shrink-0">
        {remotePanel}
        
        {/* Floating timer countdown badge */}
        {timerBadge}

        {/* Swipe choice / result overlays */}
        {swipeOverlay}
      </div>
    </div>
  );
}

