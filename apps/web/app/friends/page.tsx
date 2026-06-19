"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { FriendCallRequest, FriendPresence, Friendship, UserProfile } from "@minutematch/shared";
import { Ban, MessageSquare, Trash2, Check, X, PhoneCall, Video, Circle } from "lucide-react";
import { Button, Card, EmptyState, GhostButton, Navbar, Shell, Badge } from "@/components/ui";
import { SOCKET_URL } from "@/lib/config";
import { getSocket } from "@/lib/socket";
import { useProfileStore } from "@/store/profileStore";
import { useToastStore } from "@/store/toastStore";

type FriendsPayload = {
  matches: Friendship[];
  pendingReceived: Friendship[];
  sentRequests: Friendship[];
  blocked: string[];
  users: Record<string, UserProfile>;
  presence: Record<string, FriendPresence>;
  unreadCounts: Record<string, number>;
};

export default function FriendsPage() {
  const router = useRouter();
  const { profile, authToken, hydrate, setAuthToken, authHeaders } = useProfileStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<"matches" | "pending" | "sent" | "blocked">("matches");
  const [data, setData] = useState<FriendsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCall, setActiveCall] = useState<FriendCallRequest | null>(null);

  async function load(userId = profile?.userId) {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${SOCKET_URL}/api/friends/${userId}`, { headers: authHeaders() });
      if (response.ok) {
        const payload = await response.json() as FriendsPayload;
        setData(payload);
      }
    } catch (err) {
      addToast("Failed to reload connections.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => { 
    if (profile) void load(profile.userId); 
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const socket = getSocket();
    socket.emit("client:profile:save", { profile, authToken });
    socket.on("server:profile:saved", ({ authToken: nextToken }) => {
      if (nextToken) setAuthToken(nextToken);
    });

    const reload = () => void load(profile.userId);
    const onPresence = ({ userId, presence }: { userId: string; presence: FriendPresence }) => {
      setData((current) => current ? { ...current, presence: { ...current.presence, [userId]: presence } } : current);
    };
    const onCallRing = (call: FriendCallRequest) => {
      setActiveCall(call);
      if (call.receiverId === profile.userId) addToast("Incoming friend call request.", "info");
      if (call.requesterId === profile.userId) addToast("Call request sent. Waiting for consent.", "info");
    };
    const onCallAccepted = (call: FriendCallRequest) => {
      setActiveCall(call);
      addToast("Friend call accepted.", "success");
    };
    const onCallDeclined = (call: FriendCallRequest) => {
      setActiveCall(call);
      addToast(call.status === "declined" ? "Call declined." : "Call cancelled.", "info");
    };

    socket.on("server:friend:request:created", reload);
    socket.on("server:friend:request:updated", reload);
    socket.on("server:friend:presence", onPresence);
    socket.on("server:friend:call:ring", onCallRing);
    socket.on("server:friend:call:accepted", onCallAccepted);
    socket.on("server:friend:call:declined", onCallDeclined);
    socket.on("server:friend:call:error", ({ message }) => addToast(message, "error"));

    return () => {
      socket.off("server:friend:request:created", reload);
      socket.off("server:profile:saved");
      socket.off("server:friend:request:updated", reload);
      socket.off("server:friend:presence", onPresence);
      socket.off("server:friend:call:ring", onCallRing);
      socket.off("server:friend:call:accepted", onCallAccepted);
      socket.off("server:friend:call:declined", onCallDeclined);
      socket.off("server:friend:call:error");
    };
  }, [profile, authToken, addToast, setAuthToken]);

  async function action(path: string, successMessage: string) {
    try {
      const response = await fetch(`${SOCKET_URL}${path}`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: "{}"
      });
      if (response.ok) {
        addToast(successMessage, "success");
        await load();
      } else {
        addToast("Action failed.", "error");
      }
    } catch {
      addToast("Network connection error.", "error");
    }
  }

  async function unblock(blockedUserId: string) {
    if (!profile) return;
    try {
      const response = await fetch(`${SOCKET_URL}/api/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ blockedUserId })
      });
      if (response.ok) {
        addToast("User unblocked.", "success");
        await load();
      } else {
        addToast("Failed to unblock.", "error");
      }
    } catch {
      addToast("Network connection error.", "error");
    }
  }

  function partnerName(friendship: Friendship) {
    const id = friendship.users.find((item) => item !== profile?.userId) ?? friendship.receiverId;
    return data?.users[id]?.displayName ?? id;
  }

  function partnerId(friendship: Friendship) {
    return friendship.users.find((item) => item !== profile?.userId) ?? friendship.receiverId;
  }

  function presenceFor(friendship: Friendship) {
    return data?.presence?.[partnerId(friendship)];
  }

  function presenceLabel(friendship: Friendship) {
    const presence = presenceFor(friendship);
    if (presence?.online) return "Online now";
    if (!presence?.lastSeenAt) return "Offline";
    return `Last seen ${new Date(presence.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  function requestCall(friendship: Friendship, mode: "audio" | "video") {
    if (!profile) return;
    getSocket().emit("client:friend:call:request", { friendshipId: friendship.id, userId: profile.userId, mode });
  }

  if (!profile) {
    return (
      <Shell>
        <Navbar />
        <Card className="mt-8 max-w-md mx-auto text-center">
          <p className="text-white/70">Create a profile to access friendships.</p>
          <Button onClick={() => router.push("/onboarding")} className="mt-4 w-full">
            Onboarding
          </Button>
        </Card>
      </Shell>
    );
  }

  const tabs = [
    ["matches", "Matches"],
    ["pending", "Pending Received"],
    ["sent", "Sent Requests"],
    ["blocked", "Blocked Users"]
  ] as const;

  return (
    <Shell>
      <Navbar />
      {activeCall && activeCall.status === "pending" && activeCall.receiverId === profile.userId ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 backdrop-blur-sm sm:place-items-center">
          <Card className="w-full max-w-md border border-neonBlue/20 bg-[#080a12]">
            <Badge tone="accent">{activeCall.mode.toUpperCase()} CALL</Badge>
            <h2 className="mt-3 text-2xl font-black">Incoming friend call</h2>
            <p className="mt-2 text-sm text-white/60">A matched friend wants to reconnect. The call starts only if you accept.</p>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1 bg-neonGreen text-ink" onClick={() => getSocket().emit("client:friend:call:accept", { callId: activeCall.id, userId: profile.userId })}>
                <PhoneCall className="h-4 w-4" /> Accept
              </Button>
              <GhostButton className="flex-1" onClick={() => getSocket().emit("client:friend:call:decline", { callId: activeCall.id, userId: profile.userId })}>
                Decline
              </GhostButton>
            </div>
          </Card>
        </div>
      ) : null}
      <div className="py-6 mx-auto max-w-4xl">
        <h1 className="text-4xl font-black">Friends & Requests</h1>
        <p className="mt-2 text-sm text-white/50">
          Unlock permanent, unlimited text chats only through mutual session swipes.
        </p>

        {/* Tab selection */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-white/5 pb-3">
          {tabs.map(([value, label]) => {
            const isActive = tab === value;
            return (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`relative rounded-full px-4 py-2 text-xs font-black transition-colors ${
                  isActive ? "text-ink" : "text-white/60 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="friends-tab-pill"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab contents */}
        <div className="mt-6 grid gap-4">
          {tab === "matches" && (
            data?.matches.length ? (
              data.matches.map((friendship) => (
                <motion.div
                  key={friendship.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center border border-white/8 bg-black/60 shadow-lg hover:border-white/15 transition duration-200">
                    <div className="flex items-center gap-4">
                      {/* Avatar Block with pulsing presence status */}
                      <div className="relative h-12 w-12 rounded-xl bg-neonBlue/10 border border-neonBlue/20 flex items-center justify-center font-display font-black text-neonBlue text-sm select-none shrink-0">
                        {partnerName(friendship).slice(0, 2).toUpperCase() || "?"}
                        {presenceFor(friendship)?.online && (
                          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-neonGreen border border-obsidian shadow-[0_0_8px_#9ff84d] animate-pulse" />
                        )}
                      </div>

                      <div>
                        <h2 className="text-xl font-black text-white font-display">{partnerName(friendship)}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] bg-neonPink/10 border border-neonPink/20 text-[#ffe5f0] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            {friendship.sharedInterest}
                          </span>
                          <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider">
                            · {presenceLabel(friendship)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/chat/${friendship.id}`}>
                        <Button className="text-xs font-bold py-1.5 h-10 px-4 shadow-glow bg-gradient-to-r from-neonBlue to-neonPink text-white hover:brightness-105 border-0">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                        </Button>
                      </Link>
                      <GhostButton
                        onClick={() => requestCall(friendship, "audio")}
                        className="h-10 text-xs border-neonGreen/20 text-neonGreen hover:border-neonGreen/40 active:scale-95 transition"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Audio
                      </GhostButton>
                      <GhostButton
                        onClick={() => requestCall(friendship, "video")}
                        className="h-10 text-xs border-neonBlue/20 text-neonBlue hover:border-neonBlue/40 active:scale-95 transition"
                      >
                        <Video className="h-3.5 w-3.5" /> Video
                      </GhostButton>
                      <GhostButton 
                        onClick={() => action(`/api/friends/${friendship.id}/remove`, "Friend connection removed.")}
                        className="text-white/40 hover:text-warning border-transparent hover:border-warning/20 h-10 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </GhostButton>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState title="No active matches" copy="Your mutual right swipes will populate here. Enter matching queue to find connections." />
            )
          )}

          {tab === "pending" && (
            data?.pendingReceived.length ? (
              data.pendingReceived.map((friendship) => (
                <motion.div
                  key={friendship.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center border border-white/5 bg-white/5">
                    <div>
                      <h2 className="text-xl font-black">{partnerName(friendship)}</h2>
                      <p className="text-xs text-white/50 mt-1">Sent you a connection request from session: {friendship.sharedInterest}.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => action(`/api/friends/${friendship.id}/accept`, "Connection accepted! Permanent chat unlocked.")}
                        className="text-xs py-1.5 h-10 bg-neonGreen hover:bg-neonGreen/90 text-ink"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Accept
                      </Button>
                      <GhostButton 
                        onClick={() => action(`/api/friends/${friendship.id}/decline`, "Request declined.")}
                        className="text-xs h-10 text-white/70"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Decline
                      </GhostButton>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState title="No pending requests" copy="Incoming connection requests wait here quietly. You can accept to open permanent chats." />
            )
          )}

          {tab === "sent" && (
            data?.sentRequests.length ? (
              data.sentRequests.map((friendship) => (
                <motion.div
                  key={friendship.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center border border-white/5 bg-white/5">
                    <div>
                      <h2 className="text-xl font-black">{partnerName(friendship)}</h2>
                      <p className="text-xs text-white/50 mt-1">Waiting for partner decision. Shared Interest: {friendship.sharedInterest}.</p>
                    </div>
                    <GhostButton 
                      onClick={() => action(`/api/friends/${friendship.id}/decline`, "Friend request cancelled.")}
                      className="text-xs border-white/10 hover:border-warning/30 h-10 hover:text-warning"
                    >
                      Cancel Request
                    </GhostButton>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState title="No pending sent requests" copy="Your one-sided right swipes will display here until accepted." />
            )
          )}

          {tab === "blocked" && (
            data?.blocked.length ? (
              data.blocked.map((userId) => (
                <motion.div
                  key={userId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="flex items-center justify-between border border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                      <Ban className="h-4 w-4 text-warning" /> 
                      <span className="text-sm font-semibold text-white/95">
                        {data.users[userId]?.displayName ?? `User ${userId.slice(0, 8)}`}
                      </span>
                    </div>
                    <GhostButton 
                      onClick={() => unblock(userId)} 
                      className="text-xs h-9 border-white/10 hover:border-neonGreen/30 hover:text-neonGreen"
                    >
                      Unblock
                    </GhostButton>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState title="No blocked users" copy="Blocked users are prevented from pairing or messaging you in matching rooms." />
            )
          )}
        </div>
      </div>
    </Shell>
  );
}
