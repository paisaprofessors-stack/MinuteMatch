import type { Server, Socket } from "socket.io";
import type { QueueUser, ReportReason, UserProfile } from "@minutematch/shared";
import { findBestMatch } from "../matchmaking/matcher.js";
import { pushLimited } from "../safety/rateLimit.js";
import { createSession, partnerId, SESSION_SECONDS, submitSwipe } from "../sessions/sessionService.js";
import { type MemoryStore } from "../storage/memoryStore.js";
import { createFriendMessage, createSessionMessage } from "../messages/messageService.js";
import { acceptFriendship, blockUser, createFriendRequest, declineFriendship, listSocialGraph } from "../social/socialService.js";
import {
  acceptFriendCallRequest,
  canSignalFriendCall,
  createFriendCallRequest,
  declineFriendCallRequest,
  endFriendCall
} from "../calls/callService.js";
import { ensureUserToken } from "../security/auth.js";
import { filterContactSharing } from "../safety/contactSafety.js";

type ProfileSaveInput = UserProfile | { profile: UserProfile; authToken?: string };

const timers = new Map<string, NodeJS.Timeout>();

function parseProfileSaveInput(input: ProfileSaveInput): { profile: UserProfile; authToken?: string } {
  if (input && typeof input === "object" && "profile" in input) return { profile: input.profile, authToken: input.authToken };
  return { profile: input as UserProfile };
}

function requireSocketActor(socket: Socket, store: MemoryStore): string | null {
  const actorId = store.socketUsers.get(socket.id) ?? null;
  if (!actorId) socket.emit("server:match:error", { message: "Authenticate your profile first." });
  return actorId;
}

function profileToQueueUser(profile: UserProfile, socketId: string): QueueUser {
  return {
    userId: profile.userId,
    socketId,
    displayName: profile.displayName,
    gender: profile.gender,
    showMe: profile.showMe,
    interests: profile.interests,
    language: profile.language,
    mode: profile.mode,
    joinedAt: Date.now()
  };
}

function emitToUser(io: Server, store: MemoryStore, userId: string, event: string, payload: unknown): void {
  const socketId = store.onlineSockets.get(userId);
  if (socketId) io.to(socketId).emit(event, payload);
}

function emitPresenceToFriends(io: Server, store: MemoryStore, userId: string): void {
  const presence = store.presence.get(userId);
  if (!presence) return;
  for (const friendship of store.friendships.values()) {
    if (friendship.status !== "accepted" || !friendship.users.includes(userId)) continue;
    const otherId = friendship.users.find((id) => id !== userId);
    if (otherId) emitToUser(io, store, otherId, "server:friend:presence", { userId, presence });
  }
}

function startSessionTimer(io: Server, store: MemoryStore, sessionId: string): void {
  const session = store.sessions.get(sessionId);
  if (!session || session.status === "active") return;

  session.status = "active";
  session.startedAt = Date.now();
  store.persistence?.upsertSession(session);
  let remaining = SESSION_SECONDS;
  console.info("[session] started", { sessionId });
  io.to(sessionId).emit("server:timer:start", { remaining });

  const timer = setInterval(() => {
    remaining -= 1;
    if (remaining === 30) {
      io.to(sessionId).emit("server:session:notice", { message: "Halfway there. Ask one real question." });
    }
    if (remaining === 15) {
      io.to(sessionId).emit("server:session:notice", { message: "Last 15 seconds. Decide your vibe." });
    }
    io.to(sessionId).emit("server:timer:tick", { remaining });
    if (remaining <= 0) {
      clearInterval(timer);
      timers.delete(sessionId);
      const current = store.sessions.get(sessionId);
      if (current) {
        current.status = "ended";
        current.endedAt = Date.now();
        current.endedReason = "timer";
        store.persistence?.upsertSession(current);
        store.completedSessions += 1;
      }
      console.info("[timer] ended", { sessionId });
      io.to(sessionId).emit("server:timer:end", { sessionId });
      io.to(sessionId).emit("server:session:ended", { reason: "timer" });
      setTimeout(() => autoLeftUnanswered(io, store, sessionId), 20000);
    }
  }, 1000);
  timers.set(sessionId, timer);
}

function endSession(io: Server, store: MemoryStore, sessionId: string, reason: string): void {
  const session = store.sessions.get(sessionId);
  if (!session || ["ended", "reported", "cancelled"].includes(session.status)) return;
  const timer = timers.get(sessionId);
  if (timer) clearInterval(timer);
  timers.delete(sessionId);
  session.status = reason === "reported" ? "reported" : "ended";
  session.endedAt = Date.now();
  session.endedReason = reason;
  store.persistence?.upsertSession(session);
  store.completedSessions += 1;
  io.to(sessionId).emit("server:session:ended", { reason });
}

function autoLeftUnanswered(io: Server, store: MemoryStore, sessionId: string): void {
  const session = store.sessions.get(sessionId);
  if (!session) return;
  for (const userId of [session.userAId, session.userBId]) {
    if (!store.swipes.has(`${sessionId}:${userId}`)) {
      const result = submitSwipe(store, sessionId, userId, "left");
      if (result.type !== "waiting") emitToUser(io, store, userId, "server:swipe:result", result);
    }
  }
}

function tryMatch(io: Server, store: MemoryStore, user: QueueUser): void {
  const candidates = [...store.queue.values()].filter((candidate) => candidate.userId !== user.userId);
  const match = findBestMatch(user, candidates, store.blocks);
  if (!match) {
    io.to(user.socketId).emit("server:queue:waiting", { queueSize: store.queue.size, message: "Searching for someone compatible..." });
    return;
  }

  store.queue.delete(user.userId);
  store.queue.delete(match.userId);
  const session = createSession(store, user, match);
  const aProfile = store.users.get(user.userId);
  const bProfile = store.users.get(match.userId);
  if (!aProfile || !bProfile) return;
  console.info("[match] created", { sessionId: session.id, userAId: user.userId, userBId: match.userId, sharedInterest: session.sharedInterest });

  io.to(user.socketId).emit("server:match:found", {
    sessionId: session.id,
    partner: bProfile,
    sharedInterest: session.sharedInterest,
    icebreaker: session.icebreaker,
    mode: session.mode
  });
  io.to(match.socketId).emit("server:match:found", {
    sessionId: session.id,
    partner: aProfile,
    sharedInterest: session.sharedInterest,
    icebreaker: session.icebreaker,
    mode: session.mode
  });
}

export function registerSocketHandlers(io: Server, store: MemoryStore): void {
  io.on("connection", (socket: Socket) => {
    console.info("[socket] connected", { socketId: socket.id });
    socket.on("client:profile:save", (input: ProfileSaveInput) => {
      const { profile, authToken } = parseProfileSaveInput(input);
      if (!profile?.userId || !profile.ageConfirmed || !profile.safetyAgreed) {
        socket.emit("server:match:error", { message: "Complete age confirmation and safety agreement first." });
        return;
      }
      const displayNameGuard = filterContactSharing(profile.displayName);
      if (!displayNameGuard.ok || profile.displayName.trim().length < 2 || profile.displayName.length > 24) {
        socket.emit("server:match:error", { message: "Use a display name without contact details." });
        return;
      }
      const issued = ensureUserToken(store, profile.userId, authToken);
      if (!issued) {
        socket.emit("server:match:error", { message: "Profile authentication failed." });
        return;
      }
      const existing = store.users.get(profile.userId);
      const status = existing?.status ?? profile.status ?? "active";
      const savedProfile = { ...profile, status, reportCount: existing?.reportCount ?? profile.reportCount ?? 0 };
      store.users.set(profile.userId, savedProfile);
      store.persistence?.upsertUser(savedProfile);
      store.onlineSockets.set(profile.userId, socket.id);
      store.socketUsers.set(socket.id, profile.userId);
      const presence = { userId: profile.userId, online: true, socketId: socket.id, lastSeenAt: Date.now() };
      store.presence.set(profile.userId, presence);
      store.persistence?.upsertPresence(presence);
      console.info("[profile] saved", { userId: profile.userId, socketId: socket.id });
      socket.emit("server:profile:saved", { profile: store.users.get(profile.userId), authToken: issued.token });
      emitPresenceToFriends(io, store, profile.userId);
    });

    socket.on("client:queue:join", (profile: UserProfile) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== profile.userId) return;
      const saved = store.users.get(profile.userId) ?? profile;
      if (!saved.ageConfirmed || !saved.safetyAgreed) {
        socket.emit("server:match:error", { message: "MinuteMatch is 18+ and requires the safety agreement." });
        return;
      }
      if (saved.status === "banned" || store.bans.has(saved.userId)) {
        socket.emit("server:match:error", { message: "This account is banned from matching." });
        return;
      }
      if (saved.status === "restricted" && (store.restrictions.get(saved.userId) ?? 0) > Date.now()) {
        socket.emit("server:match:error", { message: "This account is temporarily restricted." });
        return;
      }
      if (store.queue.has(saved.userId)) {
        socket.emit("server:queue:waiting", { queueSize: store.queue.size, message: "You are already in the queue." });
        return;
      }
      const queueUser = profileToQueueUser(saved, socket.id);
      store.users.set(saved.userId, saved);
      store.persistence?.upsertUser(saved);
      store.onlineSockets.set(saved.userId, socket.id);
      store.socketUsers.set(socket.id, saved.userId);
      const presence = {
        userId: saved.userId,
        online: true,
        socketId: socket.id,
        lastSeenAt: Date.now(),
        currentSessionId: undefined
      };
      store.presence.set(saved.userId, presence);
      store.persistence?.upsertPresence(presence);
      store.queue.set(saved.userId, queueUser);
      console.info("[queue] joined", { userId: saved.userId, mode: saved.mode, interests: saved.interests });
      tryMatch(io, store, queueUser);
    });

    socket.on("client:queue:leave", ({ userId }: { userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      store.queue.delete(actorId);
      socket.emit("server:queue:left");
    });

    socket.on("client:session:join", ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const session = store.sessions.get(sessionId);
      if (!session || ![session.userAId, session.userBId].includes(userId)) {
        socket.emit("server:match:error", { message: "Session not found." });
        return;
      }
      if (["ended", "cancelled", "reported"].includes(session.status)) {
        socket.emit("server:session:ended", { reason: session.endedReason ?? "Session expired" });
        return;
      }
      socket.join(sessionId);
      if (!session.usersReady.includes(userId)) session.usersReady.push(userId);
      const presence = store.presence.get(userId);
      if (presence) presence.currentSessionId = sessionId;
      if (presence) store.persistence?.upsertPresence(presence);
      socket.emit("server:session:ready", { session });
      if (session.usersReady.length === 2) startSessionTimer(io, store, sessionId);
    });

    socket.on("client:session:message", ({ sessionId, userId, body }: { sessionId: string; userId: string; body: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const result = createSessionMessage(store, sessionId, actorId, body);
      if (!result.ok) {
        socket.emit("server:message:error", { message: result.message });
        return;
      }
      io.to(sessionId).emit("server:session:message", { sessionId, message: result.message });
    });

    socket.on("client:session:end", ({ sessionId }: { sessionId: string }) => {
      const actorId = requireSocketActor(socket, store);
      const session = store.sessions.get(sessionId);
      if (!actorId || !session || ![session.userAId, session.userBId].includes(actorId)) return;
      endSession(io, store, sessionId, "ended_by_user");
    });

    socket.on("client:webrtc:signal", ({ sessionId, callId, userId, signal }: { sessionId?: string; callId?: string; userId: string; signal: any }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      if (JSON.stringify(signal ?? {}).length > 20000) return;
      if (callId) {
        const call = canSignalFriendCall(store, callId, actorId);
        if (!call) {
          socket.emit("server:message:error", { message: "Call signaling requires an accepted call." });
          return;
        }
        const targetId = call.requesterId === actorId ? call.receiverId : call.requesterId;
        emitToUser(io, store, targetId, "server:webrtc:signal", { callId, signal });
        return;
      }
      const session = sessionId ? store.sessions.get(sessionId) : null;
      if (session && [session.userAId, session.userBId].includes(actorId)) {
        const targetId = partnerId(session, actorId);
        emitToUser(io, store, targetId, "server:webrtc:signal", { sessionId, signal });
      }
    });

    socket.on("client:swipe", ({ sessionId, userId, choice }: { sessionId: string; userId: string; choice: "left" | "right" }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      console.info("[swipe] received", { sessionId, userId: actorId, choice });
      if (choice === "left") pushLimited(store.skipHistory, actorId, 20, 10 * 60 * 1000);
      if (choice === "right") {
        const limit = pushLimited(store.requestHistory, actorId, 5, 10 * 60 * 1000);
        if (!limit.ok) {
          socket.emit("server:swipe:result", { type: "error", partnerId: "", message: limit.reason });
          return;
        }
      }
      const result = submitSwipe(store, sessionId, actorId, choice);
      if (result.type === "waiting") {
        socket.emit("server:swipe:waiting", result);
        return;
      }
      const session = store.sessions.get(sessionId);
      if (!session) return;
      emitToUser(io, store, actorId, "server:swipe:result", result);
      emitToUser(io, store, partnerId(session, actorId), "server:swipe:result", submitSwipe(store, sessionId, partnerId(session, actorId), choice));
    });

    socket.on("client:friend:message", ({ friendshipId, userId, body }: { friendshipId: string; userId: string; body: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const result = createFriendMessage(store, friendshipId, actorId, body);
      if (!result.ok) {
        socket.emit("server:message:error", { message: result.message });
        return;
      }
      const friendship = store.friendships.get(friendshipId);
      const otherId = friendship?.users.find((id) => id !== actorId) ?? "";
      socket.emit("server:friend:message", result.message);
      emitToUser(io, store, otherId, "server:friend:message", result.message);
    });

    socket.on("client:friend:request:create", ({ requesterId, receiverId, sharedInterest }: { requesterId: string; receiverId: string; sharedInterest?: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== requesterId) return;
      const limit = pushLimited(store.requestHistory, actorId, 5, 10 * 60 * 1000);
      if (!limit.ok) {
        socket.emit("server:friend:request:error", { message: limit.reason });
        return;
      }
      try {
        const friendship = createFriendRequest(store, actorId, receiverId, sharedInterest ?? "Conversation");
        socket.emit("server:friend:request:created", friendship);
        emitToUser(io, store, receiverId, "server:friend:request:created", friendship);
      } catch (error) {
        socket.emit("server:friend:request:error", { message: error instanceof Error ? error.message : "Could not create request." });
      }
    });

    socket.on("client:friend:request:accept", ({ friendshipId, userId }: { friendshipId: string; userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      try {
        const friendship = acceptFriendship(store, friendshipId, actorId);
        for (const id of friendship.users) emitToUser(io, store, id, "server:friend:request:updated", friendship);
      } catch (error) {
        socket.emit("server:friend:request:error", { message: error instanceof Error ? error.message : "Could not accept request." });
      }
    });

    socket.on("client:friend:request:decline", ({ friendshipId, userId }: { friendshipId: string; userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      try {
        const friendship = declineFriendship(store, friendshipId, actorId);
        for (const id of friendship.users) emitToUser(io, store, id, "server:friend:request:updated", friendship);
      } catch (error) {
        socket.emit("server:friend:request:error", { message: error instanceof Error ? error.message : "Could not decline request." });
      }
    });

    socket.on("client:friend:call:request", ({ friendshipId, userId, mode }: { friendshipId: string; userId: string; mode: "audio" | "video" }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const limit = pushLimited(store.requestHistory, `call:${actorId}`, 4, 10 * 60 * 1000);
      if (!limit.ok) {
        socket.emit("server:friend:call:error", { message: limit.reason });
        return;
      }
      const result = createFriendCallRequest(store, friendshipId, actorId, mode);
      if (!result.ok) {
        socket.emit("server:friend:call:error", { message: result.message });
        return;
      }
      socket.emit("server:friend:call:ring", result.call);
      emitToUser(io, store, result.call.receiverId, "server:friend:call:ring", result.call);
    });

    socket.on("client:friend:call:accept", ({ callId, userId }: { callId: string; userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const result = acceptFriendCallRequest(store, callId, actorId);
      if (!result.ok) {
        socket.emit("server:friend:call:error", { message: result.message });
        return;
      }
      emitToUser(io, store, result.call.requesterId, "server:friend:call:accepted", result.call);
      emitToUser(io, store, result.call.receiverId, "server:friend:call:accepted", result.call);
    });

    socket.on("client:friend:call:decline", ({ callId, userId }: { callId: string; userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const result = declineFriendCallRequest(store, callId, actorId);
      if (!result.ok) {
        socket.emit("server:friend:call:error", { message: result.message });
        return;
      }
      emitToUser(io, store, result.call.requesterId, "server:friend:call:declined", result.call);
      emitToUser(io, store, result.call.receiverId, "server:friend:call:declined", result.call);
    });

    socket.on("client:friend:call:end", ({ callId, userId }: { callId: string; userId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== userId) return;
      const result = endFriendCall(store, callId, actorId);
      if (!result.ok) {
        socket.emit("server:friend:call:error", { message: result.message });
        return;
      }
      emitToUser(io, store, result.call.requesterId, "server:friend:call:ended", result.call);
      emitToUser(io, store, result.call.receiverId, "server:friend:call:ended", result.call);
    });

    socket.on("client:report", (input: { reporterId: string; reportedUserId: string; sessionId?: string; reason: ReportReason; details?: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== input.reporterId) return;
      const limit = pushLimited(store.reportHistory, actorId, 10, 60 * 60 * 1000);
      if (!limit.ok) {
        socket.emit("server:report:error", { message: limit.reason });
        return;
      }
      const report = store.createReport({ ...input, reporterId: actorId });
      console.info("[report] created", { reportId: report.id, reporterId: actorId, reportedUserId: input.reportedUserId });
      if (input.sessionId) endSession(io, store, input.sessionId, "reported");
      socket.emit("server:report:created", report);
    });

    socket.on("client:block", ({ blockerId, blockedUserId }: { blockerId: string; blockedUserId: string }) => {
      const actorId = requireSocketActor(socket, store);
      if (!actorId || actorId !== blockerId) return;
      blockUser(store, actorId, blockedUserId);
      socket.emit("server:block:created", { blockerId: actorId, blockedUserId, createdAt: Date.now() });
      emitToUser(io, store, blockedUserId, "server:block:created", { blockerId: actorId, blockedUserId, createdAt: Date.now() });
    });

    socket.on("disconnect", () => {
      const userId = store.socketUsers.get(socket.id);
      console.info("[socket] disconnected", { socketId: socket.id, userId });
      if (!userId) return;
      store.queue.delete(userId);
      store.onlineSockets.delete(userId);
      store.socketUsers.delete(socket.id);
      const presence = store.presence.get(userId);
      if (presence) {
        presence.online = false;
        presence.socketId = undefined;
        presence.lastSeenAt = Date.now();
        presence.currentSessionId = undefined;
        presence.currentCallId = undefined;
        store.persistence?.upsertPresence(presence);
      }
      emitPresenceToFriends(io, store, userId);
      for (const session of store.sessions.values()) {
        if (session.status === "active" && [session.userAId, session.userBId].includes(userId)) {
          emitToUser(io, store, partnerId(session, userId), "server:session:ended", { reason: "Partner left" });
          endSession(io, store, session.id, "partner_left");
        }
      }
    });
  });
}
