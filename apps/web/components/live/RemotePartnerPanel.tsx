"use client";

import React, { useEffect, useRef } from "react";
import { Flag, Ban, Smile, Sparkles, X, Heart, ShieldAlert } from "lucide-react";
import { Button, GhostButton } from "@/components/ui";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MeeMascot } from "@/components/MeeMascot";

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
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0a0b12] to-[#030307] overflow-hidden rounded-2xl border border-white/5 shadow-inner">
      {/* Background ambient lighting for empty states */}
      {["idle", "searching", "matched", "partnerLeft", "reported", "blocked"].includes(currentState) && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="morphic-orb w-64 h-64 bg-gradient-to-tr from-neonBlue/10 to-neonPink/10 blur-2xl opacity-75" />
          <div className="absolute w-80 h-80 ambient-glow opacity-25" />
        </div>
      )}

      {/* HTML structure for Remote Peer WebRTC stream */}
      <div className="absolute inset-0 z-0 bg-transparent flex items-center justify-center">
        <video
          ref={videoRef}
          id="remoteVideo"
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            stream && (currentState === "inSession" || currentState === "timerEnded") ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Stream Scanlines overlay */}
        {stream && (currentState === "inSession" || currentState === "timerEnded") && (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-25 z-10" />
        )}
      </div>

      {/* Idle State */}
      {currentState === "idle" && (
        <div className="relative z-10 glass-panel p-8 rounded-3xl max-w-sm w-[90%] text-center border border-white/10 shadow-glow transition-all duration-300 hover:scale-[1.01]">
          <div className="mb-4 flex justify-center">
            <MeeMascot state="idle" size={100} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wide">Start Discovery</h2>
          <p className="text-xs text-white/50 mt-2 leading-relaxed lowercase tracking-wider">
            Ready to find people matching your interests from around the world? Tap Start Match below.
          </p>
        </div>
      )}

      {/* Searching State */}
      {currentState === "searching" && (
        <div className="relative z-10">
          <LoadingSpinner message={statusText} />
        </div>
      )}

      {/* Connection Established State */}
      {currentState === "matched" && (
        <div className="relative z-10 glass-panel p-8 rounded-3xl max-w-sm w-[90%] text-center border border-white/10 shadow-glowPink text-center space-y-4">
          <div className="mb-2 flex justify-center">
            <MeeMascot state="success" size={105} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide animate-pulse">Vibe Matched!</h2>
          <p className="text-[10px] text-neonPink uppercase tracking-[0.25em] font-black">
            Configuring connection stage...
          </p>
        </div>
      )}

      {/* In Session State Overlay Controls */}
      {(currentState === "inSession" || currentState === "timerEnded") && partner && (
        <>
          {/* Top Floating Glass Info Banner (Shared Topic) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-black/60 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-lg z-20 text-center select-none">
            <span className="text-[8px] font-black uppercase text-neonBlue tracking-widest">Shared Vibe</span>
            <h3 className="text-sm font-black text-white truncate mt-0.5">{sharedInterest ?? "General Chat"}</h3>
            {icebreaker && (
              <p className="text-[10px] text-white/60 italic leading-relaxed mt-1">
                "{icebreaker}"
              </p>
            )}
          </div>

          {/* Bottom Left Glass Profile Tag HUD Overlay */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 select-none">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/5 px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-ping" />
              <span className="text-[9px] font-black uppercase text-white tracking-widest">
                {partner.displayName}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-w-xs mt-1">
              {partner.interests.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-black/40 backdrop-blur-sm border border-white/5 px-2 py-0.5 text-[8px] font-semibold text-white/70 uppercase tracking-wider"
                >
                  #{interest.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Partner Left State */}
      {currentState === "partnerLeft" && (
        <div className="relative z-10 glass-panel p-8 rounded-3xl max-w-sm w-[90%] text-center border border-white/10 shadow-lg space-y-4">
          <div className="mb-2 flex justify-center">
            <MeeMascot state="sad" size={90} />
          </div>
          <h2 className="text-lg font-black text-white">Partner Left Vibe</h2>
          <p className="text-xs text-white/50 leading-relaxed max-w-xs">
            Your partner has disconnected. Ready to start a new match?
          </p>
          <div className="flex gap-2.5 justify-center pt-2">
            <Button onClick={onFindNext} className="text-xs px-5 bg-gradient-to-r from-neonBlue to-neonPink text-white hover:brightness-105">
              Match Next
            </Button>
            <GhostButton onClick={onBack} className="text-xs border-white/10 bg-white/5">
              Go Back
            </GhostButton>
          </div>
        </div>
      )}

      {/* Reported Notification Screen */}
      {currentState === "reported" && (
        <div className="relative z-10 glass-panel p-8 rounded-3xl max-w-sm w-[90%] text-center border border-[#eab308]/20 shadow-lg space-y-4">
          <div className="h-12 w-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-400 mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-white">Safety Report Logged</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            Report has been received. Thank you for keeping the community safe and clean.
          </p>
          <Button onClick={onBack} className="text-xs px-6 mt-2 bg-white text-black hover:bg-neutral-100 w-full rounded-xl">
            Return to Desk
          </Button>
        </div>
      )}

      {/* Blocked Notification Screen */}
      {currentState === "blocked" && (
        <div className="relative z-10 glass-panel p-8 rounded-3xl max-w-sm w-[90%] text-center border border-rose-500/20 shadow-lg space-y-4">
          <div className="mb-2 flex justify-center">
            <MeeMascot state="sad" size={90} />
          </div>
          <h2 className="text-lg font-black text-white">User Blocked</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            You will no longer be paired with this user. Back to matching controls.
          </p>
          <Button onClick={onBack} className="text-xs px-6 mt-2 bg-white text-black hover:bg-neutral-100 w-full rounded-xl">
            Return
          </Button>
        </div>
      )}

      {/* Floating Action Menu (Report, Block buttons over session streams) */}
      {currentState === "inSession" && partner && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            type="button"
            onClick={onReportClick}
            className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/5 text-white/70 hover:text-rose-400 hover:border-rose-500/30 px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase transition cursor-pointer select-none"
          >
            <Flag className="h-3 w-3" /> Report
          </button>
          <button
            type="button"
            onClick={onBlockClick}
            className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/5 text-white/70 hover:text-rose-400 hover:border-rose-500/30 px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase transition cursor-pointer select-none"
          >
            <Ban className="h-3 w-3" /> Block
          </button>
        </div>
      )}
    </div>
  );
}
