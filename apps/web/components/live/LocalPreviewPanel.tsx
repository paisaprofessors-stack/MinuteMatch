"use client";

import React, { useEffect, useRef } from "react";
import { CameraOff, Mic } from "lucide-react";

interface LocalPreviewPanelProps {
  displayName?: string;
  gender?: string;
  inSession: boolean;
  stream: MediaStream | null;
  volLevel: number;
}

export function LocalPreviewPanel({
  displayName = "Guest User",
  gender = "prefer not",
  inSession,
  stream,
  volLevel
}: LocalPreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Local camera playback issue:", err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-slate-950/40 rounded-2xl border border-white/10 shadow-lg select-none">
      {stream ? (
        // Active stream view (100% clean video window)
        <div className="absolute inset-0 z-0 bg-transparent flex items-center justify-center">
          <video
            ref={videoRef}
            id="localVideo"
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          />
        </div>
      ) : (
        // Inactive camera placeholder state
        <div className="flex flex-col items-center justify-center p-4 text-center z-10 gap-3">
          <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] text-white/30 animate-pulse">
            <CameraOff className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/50">{displayName}</p>
            <p className="text-[8px] uppercase tracking-widest text-white/30">Camera Idle</p>
          </div>
        </div>
      )}
    </div>
  );
}
