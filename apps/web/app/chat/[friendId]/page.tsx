"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ban, Flag, Send, ArrowLeft, MessageSquare, PhoneCall, Video, Circle } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage, FriendCallRequest, FriendPresence, Friendship, ReportReason, UserProfile } from "@minutematch/shared";
import { BlockModal } from "@/components/BlockModal";
import { ReportModal } from "@/components/ReportModal";
import { VideoRoom } from "@/components/VideoRoom";
import { Button, Card, GhostButton, Navbar, Shell, Notice, Badge } from "@/components/ui";
import { SOCKET_URL } from "@/lib/config";
import { getSocket } from "@/lib/socket";
import { useProfileStore } from "@/store/profileStore";
import { useToastStore } from "@/store/toastStore";

type FriendsPayload = { 
  matches: Friendship[]; 
  blocked: string[];
  users: Record<string, UserProfile>;
  presence: Record<string, FriendPresence>;
};

export default function ChatPage() {
  const params = useParams<{ friendId: string }>();
  const router = useRouter();
  const friendshipId = params.friendId;
  
  const { profile, authToken, hydrate, save, setAuthToken, authHeaders } = useProfileStore();
  const { addToast } = useToastStore();
  
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [presence, setPresence] = useState<Record<string, FriendPresence>>({});
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [activeCall, setActiveCall] = useState<FriendCallRequest | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const partnerId = friendship?.users.find((id) => id !== profile?.userId) ?? "";
  const partner = users[partnerId];
  const isBlocked = blockedList.includes(partnerId);

  async function load() {
    if (!profile) return;
    try {
      const friendResponse = await fetch(`${SOCKET_URL}/api/friends/${profile.userId}`, { headers: authHeaders() });
      if (!friendResponse.ok) throw new Error("Friend sync was rejected.");
      const friends = await friendResponse.json() as FriendsPayload;
      setBlockedList(friends.blocked);
      setUsers(friends.users);
      setPresence(friends.presence ?? {});
      
      const found = friends.matches.find((item) => item.id === friendshipId) ?? null;
      if (!found) {
        setNotice("Accepted friendship not found or user blocked.");
        return;
      }
      setFriendship(found);
      
      const historyResponse = await fetch(`${SOCKET_URL}/api/messages/${friendshipId}`, { headers: authHeaders() });
      if (!historyResponse.ok) throw new Error("Message history was rejected.");
      const history = await historyResponse.json() as ChatMessage[];
      setMessages(history);
    } catch {
      addToast("Failed to sync chat metadata.", "error");
    }
  }

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (!profile) return;
    const socket = getSocket();
    socket.emit("client:profile:save", { profile, authToken });

    socket.on("server:profile:saved", ({ profile: savedProfile, authToken: nextToken }: { profile?: UserProfile; authToken?: string }) => {
      if (savedProfile) save(savedProfile);
      if (nextToken) setAuthToken(nextToken);
      void load();
    });
    
    socket.on("server:friend:message", (message: ChatMessage) => {
      if (message.roomId === friendshipId) {
        setMessages((current) => [...current, message]);
      }
    });
    
    socket.on("server:message:error", ({ message }) => {
      addToast(message, "warning");
    });

    socket.on("server:friend:presence", ({ userId, presence: next }: { userId: string; presence: FriendPresence }) => {
      setPresence((current) => ({ ...current, [userId]: next }));
    });

    socket.on("server:friend:call:ring", (call: FriendCallRequest) => {
      if (call.friendshipId !== friendshipId) return;
      setActiveCall(call);
      if (call.receiverId === profile.userId) addToast("Incoming friend call request.", "info");
      if (call.requesterId === profile.userId) addToast("Waiting for your friend to accept.", "info");
    });

    socket.on("server:friend:call:accepted", (call: FriendCallRequest) => {
      if (call.friendshipId !== friendshipId) return;
      setActiveCall(call);
      addToast("Call accepted.", "success");
    });

    socket.on("server:friend:call:declined", (call: FriendCallRequest) => {
      if (call.friendshipId !== friendshipId) return;
      setActiveCall(call);
      addToast(call.status === "declined" ? "Call declined." : "Call cancelled.", "info");
    });

    socket.on("server:friend:call:ended", (call: FriendCallRequest) => {
      if (call.friendshipId !== friendshipId) return;
      setActiveCall(call);
      addToast("Call ended.", "info");
    });

    socket.on("server:friend:call:error", ({ message }) => {
      addToast(message, "error");
    });
    
    return () => {
      socket.off("server:profile:saved");
      socket.off("server:friend:message");
      socket.off("server:message:error");
      socket.off("server:friend:presence");
      socket.off("server:friend:call:ring");
      socket.off("server:friend:call:accepted");
      socket.off("server:friend:call:declined");
      socket.off("server:friend:call:ended");
      socket.off("server:friend:call:error");
    };
  }, [authToken, friendshipId, profile, save, setAuthToken]);

  useEffect(() => {
    if (profile) void load();
  }, [friendshipId, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    if (!profile || !body.trim() || isBlocked) return;
    getSocket().emit("client:friend:message", { friendshipId, userId: profile.userId, body });
    setBody("");
  }

  function requestCall(mode: "audio" | "video") {
    if (!profile || !friendship || isBlocked) return;
    getSocket().emit("client:friend:call:request", { friendshipId: friendship.id, userId: profile.userId, mode });
  }

  function acceptCall(call: FriendCallRequest) {
    if (!profile) return;
    getSocket().emit("client:friend:call:accept", { callId: call.id, userId: profile.userId });
  }

  function declineCall(call: FriendCallRequest) {
    if (!profile) return;
    getSocket().emit("client:friend:call:decline", { callId: call.id, userId: profile.userId });
  }

  function endCall(call: FriendCallRequest) {
    if (!profile) return;
    getSocket().emit("client:friend:call:end", { callId: call.id, userId: profile.userId });
  }

  async function block() {
    if (!profile || !partnerId) return;
    try {
      const response = await fetch(`${SOCKET_URL}/api/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ blockedUserId: partnerId })
      });
      if (response.ok) {
        setBlockOpen(false);
        addToast("User blocked.", "success");
        router.push("/friends");
      }
    } catch {
      addToast("Unblock request failed.", "error");
    }
  }

  async function unblock() {
    if (!profile || !partnerId) return;
    try {
      const response = await fetch(`${SOCKET_URL}/api/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ blockedUserId: partnerId })
      });
      if (response.ok) {
        addToast("User unblocked.", "success");
        void load();
      }
    } catch {
      addToast("Unblock error.", "error");
    }
  }

  async function report(reason: ReportReason, details: string) {
    if (!profile || !partnerId) return;
    try {
      const response = await fetch(`${SOCKET_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ reportedUserId: partnerId, reason, details })
      });
      if (response.ok) {
        addToast("Report submitted successfully.", "success");
        setReportOpen(false);
        router.push("/friends");
      }
    } catch {
      addToast("Report upload failed.", "error");
    }
  }

  function getInitials(name = "") {
    return name.slice(0, 2).toUpperCase() || "?";
  }

  if (!profile) {
    return (
      <Shell>
        <Navbar />
        <Card className="mt-8 max-w-md mx-auto text-center">
          <p className="text-white/70">Create a profile to access permanent chats.</p>
          <Button onClick={() => router.push("/onboarding")} className="mt-4 w-full">
            Onboarding
          </Button>
        </Card>
      </Shell>
    );
  }

  const partnerPresence = presence[partnerId];
  const presenceText = partnerPresence?.online
    ? "Online now"
    : partnerPresence?.lastSeenAt
      ? `Last seen ${new Date(partnerPresence.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Offline";

  return (
    <Shell>
      <Navbar />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={report} />
      <BlockModal open={blockOpen} name={partner?.displayName} onClose={() => setBlockOpen(false)} onConfirm={block} />
      {activeCall && activeCall.status === "pending" && activeCall.receiverId === profile.userId ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 backdrop-blur-sm sm:place-items-center">
          <Card className="w-full max-w-md border border-neonBlue/20 bg-[#080a12]">
            <Badge tone="accent">{activeCall.mode.toUpperCase()} CALL</Badge>
            <h2 className="mt-3 text-2xl font-black">Incoming call from {partner?.displayName ?? "friend"}</h2>
            <p className="mt-2 text-sm text-white/60">This repeat call starts only if you accept.</p>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1 bg-neonGreen text-ink" onClick={() => acceptCall(activeCall)}>
                <PhoneCall className="h-4 w-4" /> Accept
              </Button>
              <GhostButton className="flex-1" onClick={() => declineCall(activeCall)}>
                Decline
              </GhostButton>
            </div>
          </Card>
        </div>
      ) : null}
      
      <div className="mx-auto max-w-4xl py-2">
        <button 
          onClick={() => router.push("/friends")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Friends
        </button>

        <Card className="grid min-h-[75vh] grid-rows-[auto_1fr_auto] gap-4 border border-white/5 bg-white/5">
          {/* Header */}
          <div className="flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-neonBlue/10 border border-neonBlue/20 flex items-center justify-center text-sm font-black text-neonBlue">
                {getInitials(partner?.displayName)}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 leading-none">Permanent chat</p>
                <h1 className="text-xl font-black text-white mt-1.5">{partner?.displayName ?? "Friend"}</h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-white/45">
                  <Circle className={`h-2.5 w-2.5 ${partnerPresence?.online ? "fill-neonGreen text-neonGreen" : "fill-white/20 text-white/20"}`} />
                  {presenceText}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <GhostButton
                disabled={isBlocked || !friendship}
                onClick={() => requestCall("audio")}
                className="text-xs h-9 py-1 px-3 text-neonGreen border-neonGreen/20 hover:border-neonGreen/40"
              >
                <PhoneCall className="h-3.5 w-3.5 mr-1" /> Audio
              </GhostButton>
              <GhostButton
                disabled={isBlocked || !friendship}
                onClick={() => requestCall("video")}
                className="text-xs h-9 py-1 px-3 text-neonBlue border-neonBlue/20 hover:border-neonBlue/40"
              >
                <Video className="h-3.5 w-3.5 mr-1" /> Video
              </GhostButton>
              <GhostButton onClick={() => setReportOpen(true)} className="text-xs h-9 py-1 px-3 text-warning border-transparent hover:border-warning/20">
                <Flag className="h-3.5 w-3.5 mr-1" /> Report
              </GhostButton>
              {isBlocked ? (
                <Button onClick={unblock} className="text-xs h-9 py-1 px-3 bg-neonGreen text-ink">
                  Unblock
                </Button>
              ) : (
                <GhostButton onClick={() => setBlockOpen(true)} className="text-xs h-9 py-1 px-3 text-white/60 border-transparent hover:border-white/10">
                  <Ban className="h-3.5 w-3.5 mr-1" /> Block
                </GhostButton>
              )}
            </div>
          </div>

          {activeCall && (activeCall.status === "pending" || activeCall.status === "accepted") ? (
            <Notice tone={activeCall.status === "accepted" ? "success" : "neutral"}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">
                    {activeCall.status === "accepted"
                      ? `${activeCall.mode === "video" ? "Video" : "Audio"} call active`
                      : activeCall.requesterId === profile.userId
                        ? "Waiting for your friend to accept"
                        : "Incoming call waiting for your consent"}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    Calls are only available between accepted friends and can be ended by either person.
                  </p>
                </div>
                {activeCall.status === "accepted" ? (
                  <GhostButton className="h-9 text-xs text-warning" onClick={() => endCall(activeCall)}>End call</GhostButton>
                ) : activeCall.requesterId === profile.userId ? (
                  <GhostButton className="h-9 text-xs" onClick={() => declineCall(activeCall)}>Cancel</GhostButton>
                ) : null}
              </div>
              {activeCall.status === "accepted" ? <div className="mt-3"><VideoRoom mode={activeCall.mode} /></div> : null}
            </Notice>
          ) : null}

          {/* Messages Container */}
          <div className="overflow-y-auto rounded-2xl bg-black/25 p-4 max-h-[50vh] min-h-[350px]">
            {isBlocked && (
              <Notice tone="danger">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <span>You have blocked this connection. Unblock them to restart conversation.</span>
                  <Button onClick={unblock} className="text-[11px] h-8 px-4 w-fit bg-white text-ink">Unblock</Button>
                </div>
              </Notice>
            )}
            
            {notice && !isBlocked && (
              <Notice tone="warning">
                {notice}
              </Notice>
            )}

            {messages.length === 0 && !notice ? (
              <div className="flex flex-col items-center justify-center text-center p-8 h-full text-white/30">
                <MessageSquare className="h-8 w-8 text-white/10 mb-2" />
                <p className="text-xs font-bold">This is the start of your permanent chat history.</p>
                <p className="text-[10px] mt-0.5">Send a message to keep in touch!</p>
              </div>
            ) : null}

            <div className="grid gap-3">
              {messages.map((message) => {
                const mine = message.senderId === profile?.userId;
                return (
                  <motion.div 
                    key={message.id} 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] flex gap-2.5 items-start ${mine ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    {!mine && (
                      <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 select-none mt-1 shrink-0">
                        {getInitials(message.senderName)}
                      </div>
                    )}
                    <div className={`rounded-2xl p-3 shadow-sm ${
                      mine ? "bg-neonBlue/15 border border-neonBlue/20 text-white" : "bg-white/[0.06] border border-white/5 text-white/95"
                    }`}>
                      <p className="text-[9px] text-white/40 mb-1">
                        {mine ? "You" : message.senderName} - {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm leading-relaxed break-words">{message.body}</p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Footer Input */}
          <div className="flex gap-2">
            <input 
              value={body} 
              onChange={(event) => setBody(event.target.value)} 
              onKeyDown={(event) => event.key === "Enter" && send()} 
              disabled={isBlocked}
              placeholder={isBlocked ? "Unblock connection to type messages" : "Message an accepted friend"} 
              className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm outline-none transition focus:border-neonBlue disabled:cursor-not-allowed disabled:opacity-40" 
            />
            <Button onClick={send} disabled={isBlocked || !body.trim()} className="bg-gradient-to-r from-neonBlue to-neonPink text-white">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
