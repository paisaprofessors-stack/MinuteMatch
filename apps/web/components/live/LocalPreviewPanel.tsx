"use client";
 
import React, { useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
 
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
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b0c16] to-[#020205] border-r border-white/5">
      {/* Analog noise scanline CSS overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.015),rgba(0,255,0,0.01),rgba(0,0,255,0.015))] bg-[length:100%_4px,4px_100%] opacity-60 z-0" />
      
      {/* Fine-grain noise canvas overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_0)] bg-[size:16px_16px] opacity-75 z-0" />
 
      {/* Local Video Stream Element */}
      <div className="absolute inset-0 z-0 bg-transparent flex items-center justify-center">
        <video
          ref={videoRef}
          id="localVideo"
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${stream ? "" : "hidden"}`}
        />
        {/* Stream Overlay Status */}
        <div
          id="localVideoStatus"
          className={`absolute top-4 left-4 bg-black/60 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-white/50 tracking-wider ${
            stream ? "" : "hidden"
          }`}
        >
          Camera Connected
        </div>
      </div>
 
      {/* Main Branding Information */}
      <div className="text-center z-10 p-6 max-w-sm">
        <h1 className="text-3xl md:text-4xl font-black tracking-wider text-white select-none">
          Minute<span className="accent-text">Match</span>
        </h1>
        <p className="mt-2 text-[10px] md:text-xs font-black tracking-widest uppercase text-white/40 select-none">
          Meet someone new. One minute at a time.
        </p>
        <div className="mt-5 text-[10px] bg-white/[0.04] border border-white/5 rounded-full px-3.5 py-1.5 font-bold text-white/50 w-fit mx-auto shadow-sm select-none">
          Local Preview: {displayName} ({gender})
        </div>
      </div>
 
      {/* Micro volume meter at bottom */}
      <div className="absolute bottom-5 left-5 right-5 flex items-center gap-2.5 bg-black/45 backdrop-blur-md rounded-xl py-2.5 px-4 border border-white/5 z-10 max-w-md mx-auto">
        <Mic className="h-4 w-4 text-white/40 shrink-0" />
        <div className="flex items-center gap-0.5 flex-1">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-1 rounded-full transition-all duration-200"
              style={{
                backgroundColor: i < volLevel ? "#ff007f" : "rgba(255, 255, 255, 0.08)",
                opacity: i < volLevel ? 0.95 : 1,
                boxShadow: i < volLevel ? "0 0 8px #ff007fbb" : "none"
              }}
            />
          ))}
        </div>
        <Volume2 className="h-4 w-4 text-white/40 shrink-0" />
      </div>
    </div>
  );
}

