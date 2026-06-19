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
      {/* Scanline pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-40 z-10" />

      {stream ? (
        // Active stream view
        <div className="absolute inset-0 z-0 bg-transparent flex items-center justify-center">
          <video
            ref={videoRef}
            id="localVideo"
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          />
          
          {/* Live indicator badge */}
          <div className="absolute top-3 left-3 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[8px] uppercase font-black text-emerald-300 tracking-wider shadow-sm z-20">
            LIVE
          </div>

          {/* Micro vertical volume visualizer on the left */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-black/45 backdrop-blur-md p-1.5 rounded-full border border-white/5 z-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-150"
                style={{
                  backgroundColor: i < Math.ceil(volLevel / 3) ? "#00f0ff" : "rgba(255, 255, 255, 0.15)",
                  boxShadow: i < Math.ceil(volLevel / 3) ? "0 0 6px #00f0ff" : "none"
                }}
              />
            ))}
          </div>

          {/* Small glass user identity overlay */}
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm border border-white/5 px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold text-white/90 tracking-wide z-20 truncate shadow-md text-center">
            {displayName} ({gender})
          </div>
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
