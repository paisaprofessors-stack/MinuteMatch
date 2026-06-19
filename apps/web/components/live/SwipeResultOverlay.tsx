"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, X, MessageCircle } from "lucide-react";
import { Button, GhostButton } from "@/components/ui";
import { MeeMascot } from "../MeeMascot";
import type { SwipeResultPayload } from "@minutematch/shared";

const confettiParticles = Array.from({ length: 45 }).map((_, i) => ({
  id: i,
  x: Math.random() * 320 - 160,
  y: Math.random() * -320 - 60,
  size: Math.random() * 6 + 4,
  color: ["#9ff84d", "#00f0ff", "#ff007f", "#ffe1a3"][Math.floor(Math.random() * 4)],
  delay: Math.random() * 0.35
}));

interface SwipeResultOverlayProps {
  partnerName: string;
  sharedInterest: string;
  waitingSwipe: boolean;
  swipeResult: SwipeResultPayload | null;
  onSwipe: (choice: "left" | "right") => void;
  onKeepMatching: () => void;
  onOpenChat: (friendshipId: string) => void;
  onViewFriends: () => void;
  onBackToQueue: () => void;
}

export function SwipeResultOverlay({
  partnerName,
  sharedInterest,
  waitingSwipe,
  swipeResult,
  onSwipe,
  onKeepMatching,
  onOpenChat,
  onViewFriends,
  onBackToQueue
}: SwipeResultOverlayProps) {
  // Prevent double clicking the swipe options
  const [clicked, setClicked] = useState(false);

  const handleAction = (choice: "left" | "right") => {
    if (clicked || waitingSwipe) return;
    setClicked(true);
    onSwipe(choice);
  };

  // Reset clicked state when overlay changes or unmounts
  React.useEffect(() => {
    if (!waitingSwipe && !swipeResult) {
      setClicked(false);
    }
  }, [waitingSwipe, swipeResult]);

  // If there's no swipe result yet, show the choice overlay
  if (!swipeResult) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.9, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass flex flex-col justify-between rounded-3xl border border-white/10 bg-panelSoft p-6 max-w-xs w-full shadow-2xl select-none"
        >
          <div className="text-center">
            <span className="rounded-full bg-[#ff4fd8]/10 border border-[#ff4fd8]/20 px-3.5 py-1 text-[10px] font-black text-[#ff4fd8] tracking-widest uppercase">
              Vibe Decision
            </span>
            <h3 className="text-2xl font-black mt-4 text-white">{partnerName}</h3>
            {sharedInterest && (
              <p className="text-xs text-white/50 mt-1">Shared: {sharedInterest}</p>
            )}
            <p className="text-sm font-semibold mt-4 text-white/80 leading-relaxed">
              Time’s up. Stay connected?
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <GhostButton
              disabled={clicked || waitingSwipe}
              onClick={() => handleAction("left")}
              className="flex-1 text-xs border-white/10 hover:border-rose-400/30 hover:text-rose-400 cursor-pointer"
            >
              Skip (Left)
            </GhostButton>
            <Button
              disabled={clicked || waitingSwipe}
              loading={waitingSwipe}
              onClick={() => handleAction("right")}
              className="flex-1 text-xs bg-gradient-to-r from-neonBlue to-neonPink text-white shadow-glow hover:brightness-105 cursor-pointer"
            >
              Connect (Right)
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show swipe result cards
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-hidden">
      {/* Visual dopamine confetti explosion on mutual match */}
      {swipeResult.type === "mutual_match" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
          {confettiParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 150, scale: 0, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: [0, 1.3, 0.9, 0], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, delay: p.delay, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 12px ${p.color}`
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`glass rounded-3xl border p-6 text-center max-w-sm w-full flex flex-col items-center shadow-2xl transition-all duration-300 z-50 ${
          swipeResult.type === "mutual_match" 
            ? "border-neonGreen/45 bg-black/90 shadow-glowGreen" 
            : "border-white/10 bg-panel"
        }`}
      >
        {swipeResult.type === "mutual_match" ? (
          <>
            {/* Mascot Mee celebrating in golden crown */}
            <div className="relative mb-3 flex items-center justify-center">
              <MeeMascot state="success" size={120} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight font-display">It's a Mutual Match!</h2>
            
            {/* Gamified reward badge */}
            <div className="mt-3 inline-flex items-center gap-1 bg-gradient-to-r from-neonGreen/20 to-neonBlue/20 border border-neonGreen/30 px-4 py-1.5 rounded-full shadow-glowGreen text-[10px] font-black uppercase text-neonGreen tracking-widest animate-bounce">
              🔥 +50 VIBE XP Awarded!
            </div>

            <p className="text-xs text-white/60 mt-3.5 leading-relaxed">
              Excellent! Both of you locked in. Permanent chat channels are now open.
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full">
              <Button
                onClick={() => onOpenChat(swipeResult.friendship?.id ?? "")}
                className="bg-neonGreen text-black text-xs font-bold w-full hover:bg-neonGreen/90 cursor-pointer shadow-glowGreen border-0 h-12"
              >
                <MessageCircle className="h-4 w-4 mr-1.5" /> Start Conversation
              </Button>
              <GhostButton onClick={onKeepMatching} className="text-xs w-full cursor-pointer h-12">
                Keep Matching
              </GhostButton>
            </div>
          </>
        ) : swipeResult.type === "request_sent" ? (
          <>
            <div className="h-14 w-14 rounded-full bg-neonBlue/10 border border-neonBlue/30 flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-neonBlue fill-neonBlue/20" />
            </div>
            <h3 className="text-lg font-black text-white">Request sent.</h3>
            <p className="text-xs text-white/60 mt-2 leading-relaxed">
              Friend request sent quietly. You will be connected once they accept.
            </p>
            <div className="mt-6 flex gap-2 w-full">
              <Button onClick={onKeepMatching} className="flex-1 text-xs bg-white text-black hover:bg-neutral-100 cursor-pointer">
                Keep Matching
              </Button>
              <GhostButton onClick={onViewFriends} className="flex-1 text-xs cursor-pointer">
                View Friends
              </GhostButton>
            </div>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-white/40" />
            </div>
            <h3 className="text-lg font-black text-white">No worries. Find your next vibe?</h3>
            <p className="text-xs text-white/65 mt-2 leading-relaxed">
              Skipped or connection did not align. Let's find your next vibe match.
            </p>
            <Button
              onClick={onKeepMatching}
              className="mt-6 w-full text-xs bg-gradient-to-r from-neonBlue to-neonPink text-white hover:brightness-105 cursor-pointer"
            >
              Find Next
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

