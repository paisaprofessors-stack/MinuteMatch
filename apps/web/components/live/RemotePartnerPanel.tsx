"use client";

import React, { useEffect, useRef } from "react";
import { Flag, Ban, Smile, Sparkles, X } from "lucide-react";
import { Button, GhostButton } from "@/components/ui";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export type PartnerScreenState =
  | "idle"
  | "searching"
  | "matched"
  | "inSession"
  | "timerEnded"
  | "partnerLeft"
  | "reported"
  | "blocked";

interface RemotePartnerPanelProps {
  currentState: PartnerScreenState;
  partner: {
    userId: string;
    displayName: string;
    gender: string;
    language: string;
    mode: string;
    interests: string[];
  } | null;
  sharedInterest?: string | null;
  icebreaker?: string | null;
  statusText: string;
  stream: MediaStream | null;
  onReportClick: () => void;
  onBlockClick: () => void;
  onFindNext: () => void;
  onBack: () => void;
}

export function RemotePartnerPanel({
  currentState,
  partner,
  sharedInterest,
  icebreaker,
  statusText,
  stream,
  onReportClick,
  onBlockClick,
  onFindNext,
  onBack
}: RemotePartnerPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Remote partner playback issue:", err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-black overflow-hidden">
      {/* HTML structure hook for attaching remote WebRTC video stream */}
      <div className="absolute inset-0 z-0 bg-transparent flex items-center justify-center">
        <video
          ref={videoRef}
          id="remoteVideo"
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover ${
            stream && (currentState === "inSession" || currentState === "timerEnded") ? "" : "hidden"
          }`}
        />
      </div>

      {/* State views */}
      {currentState === "idle" && (
        <div className="text-center p-6 space-y-3 select-none z-10">
          <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-white/40 mb-3 shadow-inner">
            <Smile className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Press Start Match to begin.</h2>
          <p className="text-xs text-white/40 max-w-xs leading-relaxed lowercase tracking-widest">
            Find people with your interests from around the world
          </p>
        </div>
      )}

      {currentState === "searching" && (
        <div className="z-10">
          <LoadingSpinner message={statusText} />
        </div>
      )}

      {currentState === "matched" && (
        <div className="text-center p-6 space-y-4 z-10 animate-pulse">
          <Sparkles className="h-10 w-10 text-neonPink animate-bounce mx-auto" />
          <h2 className="text-2xl font-black text-white tracking-wide">Connection Established!</h2>
          <p className="text-xs text-[#4ea8ff] uppercase tracking-widest font-black text-white/45">
            Initialising secure session...
          </p>
        </div>
      )}

      {(currentState === "inSession" || currentState === "timerEnded") && partner && (
        <div className="flex flex-col items-center justify-center text-center p-6 select-none space-y-5 z-10 w-full max-w-md">
          <span className="text-[10px] font-black tracking-widest text-neonPink bg-neonPink/10 border border-neonPink/25 rounded-full px-3.5 py-1 uppercase shadow-sm">
            Interaction Active
          </span>
          
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white drop-shadow-md">{partner.displayName}</h2>
            <p className="text-[11px] text-white/50 uppercase tracking-widest font-bold">
              Language: {partner.language} · Mode: {partner.mode}
            </p>
          </div>

          {/* Shared interest and icebreaker badge */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 w-full max-w-sm backdrop-blur-md shadow-lg">
            <p className="text-[10px] font-black text-neonBlue uppercase tracking-widest">Shared Interest</p>
            <p className="text-base font-black mt-1 text-white">{sharedInterest ?? "General Chat"}</p>
            {icebreaker && (
              <p className="text-xs text-white/50 mt-2.5 italic leading-relaxed">
                "{icebreaker}"
              </p>
            )}
          </div>

          {/* Partner tags list */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
            {partner.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-white/[0.04] border border-white/5 px-2.5 py-0.5 text-[10px] font-bold text-white/60 uppercase tracking-wide"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {currentState === "partnerLeft" && (
        <div className="text-center p-6 space-y-4 z-10">
          <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400 mb-2">
            <X className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">Partner Left</h2>
          <p className="text-xs text-white/45 max-w-xs leading-relaxed">
            The session was terminated because your partner disconnected from the server.
          </p>
          <div className="flex gap-2.5 justify-center pt-2">
            <Button onClick={onFindNext} className="text-xs px-5 bg-gradient-to-r from-neonBlue to-neonPink text-white hover:brightness-105">
              Find Next
            </Button>
            <GhostButton onClick={onBack} className="text-xs border-white/10">
              Go Back
            </GhostButton>
          </div>
        </div>
      )}

      {currentState === "reported" && (
        <div className="text-center p-6 space-y-4 z-10">
          <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-2">
            <Flag className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">Report Logged</h2>
          <p className="text-xs text-white/45 max-w-xs leading-relaxed">
            Report has been successfully logged. Thank you for making MinuteMatch safe.
          </p>
          <Button onClick={onBack} className="text-xs px-6 mt-2 bg-white text-black hover:bg-neutral-100">
            Return to Desk
          </Button>
        </div>
      )}

      {currentState === "blocked" && (
        <div className="text-center p-6 space-y-4 z-10">
          <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400 mb-2">
            <Ban className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">User Blocked</h2>
          <p className="text-xs text-white/45 max-w-xs leading-relaxed">
            You will not be matched with this person again. Returning to main controls.
          </p>
          <Button onClick={onBack} className="text-xs px-6 mt-2 bg-white text-black hover:bg-neutral-100">
            Return
          </Button>
        </div>
      )}

      {/* Floating session action overlay (Report, Block) */}
      {currentState === "inSession" && partner && (
        <div className="absolute top-5 left-5 z-20 flex gap-2">
          <button
            type="button"
            onClick={onReportClick}
            className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/10 text-white/70 hover:text-rose-400 hover:border-rose-400/35 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer select-none"
          >
            <Flag className="h-3.5 w-3.5" /> Report
          </button>
          <button
            type="button"
            onClick={onBlockClick}
            className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/10 text-white/70 hover:text-rose-400 hover:border-rose-400/35 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer select-none"
          >
            <Ban className="h-3.5 w-3.5" /> Block
          </button>
        </div>
      )}
    </div>
  );
}

