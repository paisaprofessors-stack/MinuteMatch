import type {
  AdminStats,
  Block,
  FriendCallRequest,
  FriendPresence,
  ChatMessage,
  Friendship,
  MatchSession,
  QueueUser,
  Report,
  ReportReason,
  ReportStatus,
  SwipeDecision,
  UserProfile,
  UserStatus
} from "@minutematch/shared";
import { randomUUID } from "node:crypto";
import type { StorePersistence } from "./supabaseStore.js";

export interface StoredMessageForGuard {
  body: string;
  createdAt: number;
}

export interface MemoryStore {
  persistence?: StorePersistence;
  users: Map<string, UserProfile>;
  onlineSockets: Map<string, string>;
  socketUsers: Map<string, string>;
  queue: Map<string, QueueUser>;
  sessions: Map<string, MatchSession>;
  swipes: Map<string, SwipeDecision>;
  friendships: Map<string, Friendship>;
  messages: Map<string, ChatMessage[]>;
  reports: Map<string, Report>;
  callRequests: Map<string, FriendCallRequest>;
  presence: Map<string, FriendPresence>;
  blocks: Set<string>;
  bans: Set<string>;
  restrictions: Map<string, number>;
  contactViolations: Map<string, number[]>;
  mutedUntil: Map<string, number>;
  userAuthTokens: Map<string, string>;
  completedSessions: number;
  messageHistory: Map<string, StoredMessageForGuard[]>;
  skipHistory: Map<string, number[]>;
  requestHistory: Map<string, number[]>;
  reportHistory: Map<string, number[]>;
  createReport(input: {
    reporterId: string;
    reportedUserId: string;
    sessionId?: string;
    reason: ReportReason;
    details?: string;
  }): Report;
  setUserStatus(userId: string, status: UserStatus, until?: number): void;
  getStats(): AdminStats;
}

export function blockKey(a: string, b: string): string {
  return `${a}:${b}`;
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function createMemoryStore(persistence?: StorePersistence): MemoryStore {
  const store: MemoryStore = {
    persistence,
    users: new Map(),
    onlineSockets: new Map(),
    socketUsers: new Map(),
    queue: new Map(),
    sessions: new Map(),
    swipes: new Map(),
    friendships: new Map(),
    messages: new Map(),
    reports: new Map(),
    callRequests: new Map(),
    presence: new Map(),
    blocks: new Set(),
    bans: new Set(),
    restrictions: new Map(),
    contactViolations: new Map(),
    mutedUntil: new Map(),
    userAuthTokens: new Map(),
    completedSessions: 0,
    messageHistory: new Map(),
    skipHistory: new Map(),
    requestHistory: new Map(),
    reportHistory: new Map(),
    createReport(input) {
      const report: Report = {
        id: createId("report"),
        reporterId: input.reporterId,
        reportedUserId: input.reportedUserId,
        sessionId: input.sessionId,
        reason: input.reason,
        details: input.details,
        status: "open",
        createdAt: Date.now()
      };
      this.reports.set(report.id, report);
      this.blocks.add(blockKey(input.reporterId, input.reportedUserId));
      this.persistence?.upsertReport(report);
      this.persistence?.upsertBlock({ blockerId: input.reporterId, blockedUserId: input.reportedUserId, createdAt: report.createdAt });
      removeFriendshipsBetween(this, input.reporterId, input.reportedUserId);

      if (input.sessionId) {
        const session = this.sessions.get(input.sessionId);
        if (session) {
          session.status = "reported";
          session.endedAt = Date.now();
          session.endedReason = "reported";
        }
      }

      const reported = this.users.get(input.reportedUserId);
      if (reported) {
        reported.reportCount += 1;
        if (reported.reportCount >= 3 && reported.status !== "banned") {
          this.setUserStatus(reported.userId, "restricted", Date.now() + 24 * 60 * 60 * 1000);
        } else {
          this.persistence?.upsertUser(reported);
        }
      }

      return report;
    },
    setUserStatus(userId, status, until) {
      const user = this.users.get(userId);
      if (user) user.status = status;
      if (status === "banned") this.bans.add(userId);
      if (status !== "banned") this.bans.delete(userId);
      if (status === "restricted") this.restrictions.set(userId, until ?? Date.now() + 24 * 60 * 60 * 1000);
      if (status !== "restricted") this.restrictions.delete(userId);
      if (status !== "active") this.queue.delete(userId);
      if (user) this.persistence?.upsertUser(user);
    },
    getStats() {
      const activeSessions = [...this.sessions.values()].filter((session) => session.status === "active").length;
      return {
        totalUsers: this.users.size,
        onlineUsers: this.onlineSockets.size,
        queueSize: this.queue.size,
        activeSessions,
        completedSessions: this.completedSessions,
        openReports: [...this.reports.values()].filter((report) => report.status === "open").length,
        restrictedUsers: [...this.users.values()].filter((user) => user.status === "restricted").length,
        bannedUsers: this.bans.size,
        contactViolations: [...this.contactViolations.values()].reduce((sum, values) => sum + values.length, 0),
        mutedUsers: [...this.mutedUntil.values()].filter((until) => until > Date.now()).length,
        callRequests: this.callRequests.size
      };
    }
  };

  return store;
}

export function removeFriendshipsBetween(store: MemoryStore, a: string, b: string): void {
  for (const [id, friendship] of store.friendships) {
    if (friendship.users.includes(a) && friendship.users.includes(b)) {
      store.friendships.delete(id);
      store.persistence?.deleteFriendship(id);
    }
  }
}

export function unblockUser(store: MemoryStore, blockerId: string, blockedUserId: string): void {
  store.blocks.delete(blockKey(blockerId, blockedUserId));
  store.persistence?.deleteBlock(blockerId, blockedUserId);
}

export function updateReportStatus(store: MemoryStore, reportId: string, status: ReportStatus): Report | null {
  const report = store.reports.get(reportId);
  if (!report) return null;
  report.status = status;
  store.persistence?.upsertReport(report);
  return report;
}

export const store = createMemoryStore();
