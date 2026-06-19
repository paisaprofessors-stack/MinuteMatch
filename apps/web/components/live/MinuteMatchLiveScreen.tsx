"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage, MatchFoundPayload, SwipeResultPayload, ReportReason } from "@minutematch/shared";
import { getSocket } from "@/lib/socket";
import { useProfileStore } from "@/store/profileStore";
import { useToastStore } from "@/store/toastStore";
import { AnimatePresence, motion } from "framer-motion";

// Sub-components
import { VideoStage } from "./VideoStage";
import { LocalPreviewPanel } from "./LocalPreviewPanel";
import { RemotePartnerPanel, PartnerScreenState } from "./RemotePartnerPanel";
import { ControlDock } from "./ControlDock";
import { RulesCard } from "./RulesCard";
import { ChatInput } from "./ChatInput";
import { TimerBadge } from "./TimerBadge";
import { SwipeResultOverlay } from "./SwipeResultOverlay";

// Modals
import {
  InterestSelectorModal,
  ProfilePreferenceModal,
  BlockModal,
  ReportModal,
  SafetyReminderModal
} from "./Modals";

export function MinuteMatchLiveScreen() {
  const router = useRouter();
  const { profile, authToken, hydrate, save, setAuthToken, xp, streak, checkStreak, addXP } = useProfileStore();
  const { addToast } = useToastStore();

  // Screen State
  const [currentState, setCurrentState] = useState<PartnerScreenState>("idle");
  const [statusText, setStatusText] = useState("Ready to discover");
  const [remaining, setRemaining] = useState(60);
  const [match, setMatch] = useState<MatchFoundPayload | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatBody, setChatBody] = useState("");
  const [waitingSwipe, setWaitingSwipe] = useState(false);
  const [swipeResult, setSwipeResult] = useState<SwipeResultPayload | null>(null);

  // Floating emoji state
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; char: string; left: number }>>([]);
  const emojiIdRef = useRef(0);

  const triggerLocalEmoji = (emoji: string) => {
    const id = emojiIdRef.current++;
    const left = Math.random() * 80 + 10;
    setFloatingEmojis((prev) => [...prev, { id, char: emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const sendEmojiReaction = (emoji: string) => {
    if (!profile || !match) return;
    addXP(5); // Award +5 XP for visual reactions!
    getSocket().emit("client:session:message", {
      sessionId: match.sessionId,
      userId: profile.userId,
      body: `[emoji]:${emoji}`
    });
  };

  // WebRTC States and Refs
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [volLevel, setVolLevel] = useState(2);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const matchRef = useRef<MatchFoundPayload | null>(null);

  const chatViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [messages]);

  function cleanupPeerConnection() {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
  }

  async function initializePeerConnection(sessionId: string, partnerId: string) {
    cleanupPeerConnection();

    const socket = getSocket();
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };

    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && profile) {
        socket.emit("client:webrtc:signal", {
          sessionId,
          userId: profile.userId,
          signal: { candidate: event.candidate }
        });
      }
    };

    if (!profile) return;
    const isInitiator = profile.userId < partnerId;

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("client:webrtc:signal", {
          sessionId,
          userId: profile.userId,
          signal: { sdp: pc.localDescription }
        });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    }
  }

  function initAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = ctx;
      audioAnalyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const blockVal = Math.min(18, Math.floor(avg / 6.5));
        setVolLevel(blockVal < 1 ? 1 : blockVal);
      }, 100);
      audioIntervalRef.current = interval;
    } catch (e) {
      console.warn("Failed to initialize audio context analyzer:", e);
    }
  }

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24 }
          },
          audio: true
        });
        setLocalStream(stream);
        activeStream = stream;
        initAudioAnalyser(stream);
      } catch (err) {
        console.error("Failed to access local media devices:", err);
        addToast("Camera/Mic permissions declined. Fallback mode active.", "warning");
      }
    }
    initMedia();

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Modal states
  const [interestOpen, setInterestOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

  const partner = match?.partner;

  // Hydrate Profile on Mount and execute daily streaks check
  useEffect(() => {
    hydrate();
    checkStreak();
  }, [hydrate]);

  // Connect & register Socket.IO events
  useEffect(() => {
    if (!profile) return;
    const socket = getSocket();

    // Register/update user profile on server connection
    socket.emit("client:profile:save", { profile, authToken });

    socket.on("server:profile:saved", ({ profile: savedProfile, authToken: nextToken }) => {
      if (savedProfile) save(savedProfile);
      if (nextToken) setAuthToken(nextToken);
    });

    socket.on("server:queue:waiting", (payload) => {
      setCurrentState("searching");
      setStatusText(payload.message ?? "Finding someone with your vibe...");
    });

    socket.on("server:match:found", (payload: MatchFoundPayload) => {
      setMatch(payload);
      setCurrentState("matched");
      setStatusText("Match Found!");
      addToast(`Pairing found on shared interest: ${payload.sharedInterest}!`, "success");

      // Join the matched session
      socket.emit("client:session:join", {
        sessionId: payload.sessionId,
        userId: profile.userId
      });
    });

    socket.on("server:session:ready", () => {
      setStatusText("Session starting...");
    });

    socket.on("server:timer:start", ({ remaining: next }) => {
      setCurrentState("inSession");
      setRemaining(next);
      setMessages([]);
      setSwipeResult(null);
      setWaitingSwipe(false);
      setStatusText("Chat is live!");
      addToast("Session started. Keep it clean!", "success");

      const currentMatch = matchRef.current;
      if (currentMatch?.sessionId && currentMatch.partner?.userId) {
        initializePeerConnection(currentMatch.sessionId, currentMatch.partner.userId);
      }
    });

    socket.on("server:timer:tick", ({ remaining: next }) => {
      setRemaining(next);
    });

    socket.on("server:session:notice", ({ message }) => {
      addToast(message, "info");
    });

    socket.on("server:timer:end", () => {
      setCurrentState("timerEnded");
      setStatusText("Time's up. Connect?");
      addToast("Session complete. Select choice.", "info");
      addXP(10); // Reward +10 XP for finishing a full round!
    });

    socket.on("server:session:ended", ({ reason }) => {
      if (reason === "Partner left" || reason === "partner_left") {
        setCurrentState("partnerLeft");
        setStatusText("Partner left session.");
        addToast("Your partner disconnected.", "warning");
        cleanupPeerConnection();
      }
    });

    socket.on("server:webrtc:signal", async ({ signal }: { signal: any }) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (signal.sdp) {
          const desc = new RTCSessionDescription(signal.sdp);
          await pc.setRemoteDescription(desc);

          if (desc.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const currentMatch = matchRef.current;
            if (currentMatch && profile) {
              getSocket().emit("client:webrtc:signal", {
                sessionId: currentMatch.sessionId,
                userId: profile.userId,
                signal: { sdp: pc.localDescription }
              });
            }
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error("Failed to process WebRTC signal payload:", err);
      }
    });

    socket.on("server:session:message", ({ message }: { message: ChatMessage }) => {
      if (message.body.startsWith("[emoji]:")) {
        const emoji = message.body.split(":")[1];
        triggerLocalEmoji(emoji);
      } else {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("server:message:error", ({ message }) => {
      addToast(message, "error");
    });

    socket.on("server:swipe:waiting", () => {
      setWaitingSwipe(true);
      addToast("Waiting for partner swipe choice...", "info");
    });

    socket.on("server:swipe:result", (result: SwipeResultPayload) => {
      setWaitingSwipe(false);
      if (result.type === "error") {
        addToast(result.message, "error");
        return;
      }
      setSwipeResult(result);
      if (result.type === "mutual_match") {
        addToast("It's a Mutual Match! Chat unlocked.", "success");
        addXP(50); // Reward +50 XP for a successful Mutual Match!
      } else if (result.type === "request_sent") {
        addToast("Friend request saved.", "info");
      } else {
        addToast("Match skipped.", "info");
      }
    });

    socket.on("server:report:created", () => {
      setCurrentState("reported");
      setReportOpen(false);
    });

    socket.on("disconnect", () => {
      addToast("Socket disconnected. Reconnecting...", "error");
    });

    return () => {
      socket.off("server:queue:waiting");
      socket.off("server:profile:saved");
      socket.off("server:match:found");
      socket.off("server:session:ready");
      socket.off("server:timer:start");
      socket.off("server:timer:tick");
      socket.off("server:session:notice");
      socket.off("server:timer:end");
      socket.off("server:session:ended");
      socket.off("server:session:message");
      socket.off("server:message:error");
      socket.off("server:swipe:waiting");
      socket.off("server:swipe:result");
      socket.off("server:report:created");
      socket.off("server:webrtc:signal");
    };
  }, [profile, authToken, addToast, save, setAuthToken]);

  // Helper actions
  function startMatching() {
    if (!profile) {
      router.push("/onboarding");
      return;
    }
    setCurrentState("searching");
    setStatusText("Connecting to matching queue...");
    const socket = getSocket();
    socket.emit("client:profile:save", { profile, authToken });
    socket.emit("client:queue:join", profile);
  }

  function endMatchingOrSession() {
    const socket = getSocket();
    if (currentState === "searching") {
      if (profile) socket.emit("client:queue:leave", { userId: profile.userId });
      setCurrentState("idle");
      setStatusText("Ready to discover");
    } else if (
      currentState === "inSession" ||
      currentState === "matched" ||
      currentState === "timerEnded"
    ) {
      if (match) socket.emit("client:session:end", { sessionId: match.sessionId });
      setCurrentState("idle");
      setStatusText("Ready to discover");
      setMatch(null);
      cleanupPeerConnection();
    }
  }

  function handleSwipe(choice: "left" | "right") {
    if (!profile || !match) return;
    setWaitingSwipe(true);
    getSocket().emit("client:swipe", {
      sessionId: match.sessionId,
      userId: profile.userId,
      choice
    });
  }

  function handleReport(reason: ReportReason, details: string) {
    if (!profile || !partner) return;
    getSocket().emit("client:report", {
      reporterId: profile.userId,
      reportedUserId: partner.userId,
      sessionId: match?.sessionId,
      reason,
      details
    });
    cleanupPeerConnection();
  }

  function handleBlock() {
    if (!profile || !partner) return;
    getSocket().emit("client:block", {
      blockerId: profile.userId,
      blockedUserId: partner.userId
    });
    setCurrentState("blocked");
    cleanupPeerConnection();
    addToast("User blocked successfully.", "success");
  }

  function sendMessage() {
    if (!profile || !chatBody.trim() || !match) return;
    getSocket().emit("client:session:message", {
      sessionId: match.sessionId,
      userId: profile.userId,
      body: chatBody
    });
    setChatBody("");
  }

  function saveProfileUpdates(updates: Partial<typeof profile>) {
    if (!profile) return;
    const next = { ...profile, ...updates };
    save(next);
    const socket = getSocket();
    socket.emit("client:profile:save", { profile: next, authToken });
    addToast("Match preferences updated.", "success");
  }

  const icebreaker = useMemo(() => {
    return match?.icebreaker ?? "What is your current obsession?";
  }, [match]);

  const activeInterestLabel = useMemo(() => {
    if (!profile?.interests || profile.interests.length === 0) return "General Chat";
    const first = profile.interests[0];
    const rest = profile.interests.length - 1;
    return rest > 0 ? `${first} +${rest}` : first;
  }, [profile?.interests]);

  const activeIAmLabel = useMemo(() => {
    if (!profile?.gender) return "set";
    return profile.gender;
  }, [profile?.gender]);

  const level = Math.floor(xp / 100) + 1;
  const xpPercent = xp % 100;

  return (
    <div className="relative flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-black text-white font-sans select-none">
      
      {/* Floating Emojis Canvas Overlay */}
      <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((e) => (
            <motion.div
              key={e.id}
              initial={{ y: "100vh", opacity: 0, scale: 0.6 }}
              animate={{ y: "10vh", opacity: [0, 1, 1, 0], scale: [0.6, 1.4, 1.4, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute text-4xl font-normal"
              style={{ left: `${e.left}%` }}
            >
              {e.char}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Emoji Reaction Dock */}
      {currentState === "inSession" && (
        <div className="absolute bottom-24 md:bottom-28 left-4 md:left-6 z-25 flex gap-1 bg-black/50 border border-white/10 p-1 rounded-full backdrop-blur-md shadow-lg select-none">
          {["🔥", "👋", "💯", "😂", "❤️", "👍"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendEmojiReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center text-base rounded-full hover:bg-white/15 hover:scale-110 active:scale-95 transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* LEFT SECTION: Video Stage and Controls */}
      <div className="flex-1 flex flex-col h-[60vh] md:h-full border-r border-white/5 relative min-w-0 bg-[#06070a]">
        {/* Left Section Header */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.01] shrink-0 flex justify-between items-center h-12">
          <div className="flex items-center gap-2 select-none">
            <span className="text-sm font-black tracking-wide font-display">
              Minute<span className="text-neonPink">Match</span> Live
            </span>
          </div>

          {/* Gamified HUD in Header */}
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-3 py-1 rounded-full shadow-inner select-none">
            <div className="flex items-center gap-1 text-[11px] font-black text-white" title="Daily Match Streak">
              <span className="text-neonPink animate-pulse">🔥</span>
              <span>{streak}d</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase text-neonBlue">Lv. {level}</span>
              <div className="relative w-12 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-neonBlue to-neonPink rounded-full transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-white/50">{xp} XP</span>
            </div>
          </div>
        </div>

        {/* Video Stage Container */}
        <div className="flex-1 min-h-0 relative p-4 pb-2">
          <VideoStage
            localPanel={
              <LocalPreviewPanel
                displayName={profile?.displayName}
                gender={profile?.gender}
                inSession={currentState === "inSession"}
                stream={localStream}
                volLevel={volLevel}
              />
            }
            remotePanel={
              <RemotePartnerPanel
                currentState={currentState}
                partner={partner ?? null}
                sharedInterest={match?.sharedInterest}
                icebreaker={icebreaker}
                statusText={statusText}
                stream={remoteStream}
                onReportClick={() => setReportOpen(true)}
                onBlockClick={() => setBlockOpen(true)}
                onFindNext={startMatching}
                onBack={() => {
                  setCurrentState("idle");
                  setMatch(null);
                  cleanupPeerConnection();
                }}
              />
            }
            timerBadge={
              currentState === "inSession" ? <TimerBadge remaining={remaining} /> : null
            }
            swipeOverlay={
              currentState === "timerEnded" && partner ? (
                <SwipeResultOverlay
                  partnerName={partner.displayName}
                  sharedInterest={match?.sharedInterest ?? ""}
                  waitingSwipe={waitingSwipe}
                  swipeResult={swipeResult}
                  onSwipe={handleSwipe}
                  onKeepMatching={startMatching}
                  onOpenChat={(friendshipId) => router.push(`/chat/${friendshipId}`)}
                  onViewFriends={() => router.push("/friends")}
                  onBackToQueue={() => {
                    setCurrentState("idle");
                    setMatch(null);
                  }}
                />
              ) : null
            }
          />
        </div>

        {/* Controls Dock */}
        <div className="h-fit py-2 px-4 shrink-0 bg-transparent">
          <ControlDock
            onStart={startMatching}
            onEnd={endMatchingOrSession}
            onInterest={() => setInterestOpen(true)}
            onIAm={() => setProfileOpen(true)}
            isStartDisabled={
              currentState === "searching" ||
              currentState === "inSession" ||
              currentState === "timerEnded" ||
              currentState === "matched"
            }
            isEndDisabled={currentState === "idle"}
            isInterestDisabled={
              currentState === "searching" ||
              currentState === "inSession" ||
              currentState === "matched"
            }
            isIAmDisabled={
              currentState === "searching" ||
              currentState === "inSession" ||
              currentState === "matched"
            }
            activeInterestLabel={activeInterestLabel}
            activeIAmLabel={activeIAmLabel}
          />
        </div>
      </div>

      {/* RIGHT SECTION: Chat Message List Sidebar */}
      <div className="w-full md:w-[350px] lg:w-[400px] h-[40vh] md:h-full bg-[#0a0b12]/60 backdrop-blur-md shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-white/10 z-10">
        {/* Chat Sidebar Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01] shrink-0 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-widest text-[#00f0ff]">Conversation Chat Logs</span>
          {currentState === "inSession" && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        {/* Chat Messages Scrolling viewport */}
        <div 
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 select-text" 
          ref={chatViewportRef}
        >
          {messages.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 opacity-50">
              <p className="text-xs font-black text-white/30 uppercase tracking-widest">No Messages</p>
              <p className="text-[10px] text-white/20 mt-1 max-w-[200px] leading-relaxed">
                {currentState === "inSession" 
                  ? "Vibe match is active! Say hi to start the conversation." 
                  : "Active session logs will display here."}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === profile?.userId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${isSelf ? "items-end" : "items-start"} w-full`}
                >
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider px-1">
                    {msg.senderName}
                  </span>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs font-medium break-words max-w-[85%] shadow-md border ${
                      isSelf
                        ? "bg-gradient-to-r from-neonBlue to-neonPink text-white border-none rounded-tr-none"
                        : "bg-white/[0.04] text-white border-white/5 rounded-tl-none"
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area: Rules & Chat input */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex flex-col gap-3 shrink-0">
          <RulesCard onSafetyClick={() => setSafetyOpen(true)} />
          <ChatInput
            value={chatBody}
            onChange={setChatBody}
            onSend={sendMessage}
            isEnabled={currentState === "inSession"}
          />
        </div>
      </div>

      {/* Modals & Popups */}
      <InterestSelectorModal
        open={interestOpen}
        selected={profile?.interests ?? []}
        onClose={() => setInterestOpen(false)}
        onSave={(interests) => saveProfileUpdates({ interests })}
      />

      <ProfilePreferenceModal
        open={profileOpen}
        profile={profile}
        onClose={() => setProfileOpen(false)}
        onSave={(data) => saveProfileUpdates(data)}
      />

      {partner && (
        <BlockModal
          open={blockOpen}
          partnerName={partner.displayName}
          onClose={() => setBlockOpen(false)}
          onConfirm={handleBlock}
        />
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />

      <SafetyReminderModal
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
      />
    </div>
  );
}
