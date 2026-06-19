import type {
  Block,
  ChatMessage,
  FriendCallRequest,
  FriendPresence,
  Friendship,
  MatchSession,
  Report,
  UserProfile
} from "@minutematch/shared";
import type { MemoryStore } from "./memoryStore.js";

type Fetcher = typeof fetch;
type Row = Record<string, unknown>;

export interface SupabaseRestClient {
  select(table: string): Promise<Row[]>;
  upsert(table: string, row: Row | Row[], onConflict: string): Promise<void>;
  delete(table: string, query: string): Promise<void>;
}

export interface StorePersistence {
  hydrate(store: MemoryStore): Promise<void>;
  upsertUser(profile: UserProfile): void;
  upsertSession(session: MatchSession): void;
  upsertFriendship(friendship: Friendship): void;
  deleteFriendship(friendshipId: string): void;
  upsertMessage(message: ChatMessage): void;
  upsertReport(report: Report): void;
  upsertBlock(block: Block): void;
  deleteBlock(blockerId: string, blockedUserId: string): void;
  upsertCallRequest(call: FriendCallRequest): void;
  upsertPresence(presence: FriendPresence): void;
  recordContactViolation(input: { userId: string; roomId?: string; kind?: string; attemptedBody?: string; createdAt: number }): void;
  upsertUserAuthToken?(userId: string, tokenHash: string, createdAt: number): void;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function profileToRow(profile: UserProfile): Row {
  return {
    user_id: profile.userId,
    display_name: profile.displayName,
    age_confirmed: profile.ageConfirmed,
    gender: profile.gender,
    show_me: profile.showMe,
    interests: profile.interests,
    language: profile.language,
    mode: profile.mode,
    safety_agreed: profile.safetyAgreed,
    status: profile.status,
    report_count: profile.reportCount,
    created_at: profile.createdAt,
    updated_at: profile.createdAt
  };
}

export function profileFromRow(row: Row): UserProfile {
  return {
    userId: String(row.user_id),
    displayName: String(row.display_name),
    ageConfirmed: Boolean(row.age_confirmed),
    gender: row.gender as UserProfile["gender"],
    showMe: row.show_me as UserProfile["showMe"],
    interests: stringArray(row.interests),
    language: row.language as UserProfile["language"],
    mode: row.mode as UserProfile["mode"],
    safetyAgreed: Boolean(row.safety_agreed),
    createdAt: Number(row.created_at),
    status: row.status as UserProfile["status"],
    reportCount: Number(row.report_count ?? 0)
  };
}

export function sessionToRow(session: MatchSession): Row {
  return {
    id: session.id,
    user_a_id: session.userAId,
    user_b_id: session.userBId,
    users_ready: session.usersReady,
    shared_interest: session.sharedInterest,
    icebreaker: session.icebreaker,
    status: session.status,
    mode: session.mode,
    created_at: session.createdAt,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    ended_reason: session.endedReason
  };
}

export function sessionFromRow(row: Row): MatchSession {
  return {
    id: String(row.id),
    userAId: String(row.user_a_id),
    userBId: String(row.user_b_id),
    usersReady: stringArray(row.users_ready),
    sharedInterest: String(row.shared_interest),
    icebreaker: String(row.icebreaker),
    status: row.status as MatchSession["status"],
    mode: row.mode as MatchSession["mode"],
    createdAt: Number(row.created_at),
    startedAt: numberOrUndefined(row.started_at),
    endedAt: numberOrUndefined(row.ended_at),
    endedReason: typeof row.ended_reason === "string" ? row.ended_reason : undefined
  };
}

export function friendshipToRow(friendship: Friendship): Row {
  return {
    id: friendship.id,
    requester_id: friendship.requesterId,
    receiver_id: friendship.receiverId,
    users: friendship.users,
    status: friendship.status,
    shared_interest: friendship.sharedInterest,
    session_id: friendship.sessionId,
    created_at: friendship.createdAt,
    accepted_at: friendship.acceptedAt,
    declined_at: friendship.declinedAt,
    updated_at: friendship.updatedAt
  };
}

export function friendshipFromRow(row: Row): Friendship {
  return {
    id: String(row.id),
    requesterId: String(row.requester_id),
    receiverId: String(row.receiver_id),
    users: stringArray(row.users) as [string, string],
    status: row.status as Friendship["status"],
    sharedInterest: String(row.shared_interest),
    sessionId: typeof row.session_id === "string" ? row.session_id : undefined,
    createdAt: Number(row.created_at),
    acceptedAt: numberOrUndefined(row.accepted_at),
    declinedAt: numberOrUndefined(row.declined_at),
    updatedAt: numberOrUndefined(row.updated_at)
  };
}

export function messageToRow(message: ChatMessage): Row {
  return {
    id: message.id,
    room_id: message.roomId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    body: message.body,
    kind: message.kind,
    created_at: message.createdAt
  };
}

export function messageFromRow(row: Row): ChatMessage {
  return {
    id: String(row.id),
    roomId: String(row.room_id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    body: String(row.body),
    kind: row.kind as ChatMessage["kind"],
    createdAt: Number(row.created_at)
  };
}

export function reportToRow(report: Report): Row {
  return {
    id: report.id,
    reporter_id: report.reporterId,
    reported_user_id: report.reportedUserId,
    session_id: report.sessionId,
    reason: report.reason,
    details: report.details,
    status: report.status,
    created_at: report.createdAt
  };
}

export function reportFromRow(row: Row): Report {
  return {
    id: String(row.id),
    reporterId: String(row.reporter_id),
    reportedUserId: String(row.reported_user_id),
    sessionId: typeof row.session_id === "string" ? row.session_id : undefined,
    reason: row.reason as Report["reason"],
    details: typeof row.details === "string" ? row.details : undefined,
    status: row.status as Report["status"],
    createdAt: Number(row.created_at)
  };
}

export function callRequestToRow(call: FriendCallRequest): Row {
  return {
    id: call.id,
    friendship_id: call.friendshipId,
    requester_id: call.requesterId,
    receiver_id: call.receiverId,
    mode: call.mode,
    status: call.status,
    created_at: call.createdAt,
    expires_at: call.expiresAt,
    accepted_at: call.acceptedAt,
    declined_at: call.declinedAt,
    ended_at: call.endedAt,
    room_id: call.roomId
  };
}

export function callRequestFromRow(row: Row): FriendCallRequest {
  return {
    id: String(row.id),
    friendshipId: String(row.friendship_id),
    requesterId: String(row.requester_id),
    receiverId: String(row.receiver_id),
    mode: row.mode as FriendCallRequest["mode"],
    status: row.status as FriendCallRequest["status"],
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    acceptedAt: numberOrUndefined(row.accepted_at),
    declinedAt: numberOrUndefined(row.declined_at),
    endedAt: numberOrUndefined(row.ended_at),
    roomId: typeof row.room_id === "string" ? row.room_id : undefined
  };
}

export function presenceToRow(presence: FriendPresence): Row {
  return {
    user_id: presence.userId,
    socket_id: presence.socketId,
    online: presence.online,
    last_seen_at: presence.lastSeenAt,
    current_session_id: presence.currentSessionId,
    current_call_id: presence.currentCallId
  };
}

export function presenceFromRow(row: Row): FriendPresence {
  return {
    userId: String(row.user_id),
    socketId: typeof row.socket_id === "string" ? row.socket_id : undefined,
    online: Boolean(row.online),
    lastSeenAt: Number(row.last_seen_at),
    currentSessionId: typeof row.current_session_id === "string" ? row.current_session_id : undefined,
    currentCallId: typeof row.current_call_id === "string" ? row.current_call_id : undefined
  };
}

function restHeaders(serviceRoleKey: string, prefer?: string): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

async function assertOk(response: Response, table: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`Supabase ${table} request failed (${response.status}): ${await response.text()}`);
  }
}

export function createSupabaseRestClient(input: { url: string; serviceRoleKey: string; fetcher?: Fetcher }): SupabaseRestClient {
  const baseUrl = input.url.replace(/\/$/, "");
  const fetcher = input.fetcher ?? fetch;

  return {
    async select(table) {
      const response = await fetcher(`${baseUrl}/rest/v1/${table}?select=*`, {
        method: "GET",
        headers: restHeaders(input.serviceRoleKey)
      });
      await assertOk(response, table);
      return (await response.json()) as Row[];
    },
    async upsert(table, row, onConflict) {
      const response = await fetcher(`${baseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
        method: "POST",
        headers: restHeaders(input.serviceRoleKey, "resolution=merge-duplicates"),
        body: JSON.stringify(row)
      });
      await assertOk(response, table);
    },
    async delete(table, query) {
      const response = await fetcher(`${baseUrl}/rest/v1/${table}?${query}`, {
        method: "DELETE",
        headers: restHeaders(input.serviceRoleKey)
      });
      await assertOk(response, table);
    }
  };
}

export async function hydrateStoreFromSupabase(store: MemoryStore, client: Pick<SupabaseRestClient, "select">): Promise<void> {
  const [users, sessions, friendships, messages, reports, blocks, callRequests, presence, authTokens] = await Promise.all([
    client.select("users"),
    client.select("sessions"),
    client.select("friendships"),
    client.select("messages"),
    client.select("reports"),
    client.select("blocks"),
    client.select("call_requests"),
    client.select("presence"),
    client.select("user_auth_tokens")
  ]);

  for (const row of users) {
    const profile = profileFromRow(row);
    store.users.set(profile.userId, profile);
    if (profile.status === "banned") store.bans.add(profile.userId);
  }
  for (const row of sessions) {
    const session = sessionFromRow(row);
    store.sessions.set(session.id, session);
  }
  for (const row of friendships) {
    const friendship = friendshipFromRow(row);
    store.friendships.set(friendship.id, friendship);
  }
  for (const row of messages) {
    const message = messageFromRow(row);
    const existing = store.messages.get(message.roomId) ?? [];
    store.messages.set(message.roomId, [...existing, message]);
  }
  for (const row of reports) {
    const report = reportFromRow(row);
    store.reports.set(report.id, report);
  }
  for (const row of blocks) {
    store.blocks.add(`${String(row.blocker_id)}:${String(row.blocked_user_id)}`);
  }
  for (const row of callRequests) {
    const call = callRequestFromRow(row);
    store.callRequests.set(call.id, call);
  }
  for (const row of presence) {
    const item = presenceFromRow(row);
    store.presence.set(item.userId, { ...item, online: false, socketId: undefined, currentSessionId: undefined, currentCallId: undefined });
  }
  for (const row of authTokens) {
    store.userAuthTokens.set(String(row.user_id), String(row.token_hash));
  }
}

function persistSafely(action: () => Promise<void>): void {
  void action().catch((error) => {
    console.error("[supabase] persistence failed", error);
  });
}

export function createSupabasePersistence(client: SupabaseRestClient): StorePersistence {
  return {
    hydrate: (store) => hydrateStoreFromSupabase(store, client),
    upsertUser: (profile) => persistSafely(() => client.upsert("users", profileToRow(profile), "user_id")),
    upsertSession: (session) => persistSafely(() => client.upsert("sessions", sessionToRow(session), "id")),
    upsertFriendship: (friendship) => persistSafely(() => client.upsert("friendships", friendshipToRow(friendship), "id")),
    deleteFriendship: (friendshipId) => persistSafely(() => client.delete("friendships", `id=eq.${encodeURIComponent(friendshipId)}`)),
    upsertMessage: (message) => persistSafely(() => client.upsert("messages", messageToRow(message), "id")),
    upsertReport: (report) => persistSafely(() => client.upsert("reports", reportToRow(report), "id")),
    upsertBlock: (block) => persistSafely(() => client.upsert("blocks", { blocker_id: block.blockerId, blocked_user_id: block.blockedUserId, created_at: block.createdAt }, "blocker_id,blocked_user_id")),
    deleteBlock: (blockerId, blockedUserId) =>
      persistSafely(() => client.delete("blocks", `blocker_id=eq.${encodeURIComponent(blockerId)}&blocked_user_id=eq.${encodeURIComponent(blockedUserId)}`)),
    upsertCallRequest: (call) => persistSafely(() => client.upsert("call_requests", callRequestToRow(call), "id")),
    upsertPresence: (presence) => persistSafely(() => client.upsert("presence", presenceToRow(presence), "user_id")),
    recordContactViolation: (input) =>
      persistSafely(() =>
        client.upsert(
          "contact_violations",
          {
            user_id: input.userId,
            room_id: input.roomId,
            kind: input.kind,
            attempted_body: input.attemptedBody,
            created_at: input.createdAt
          },
          "id"
        )
      ),
    upsertUserAuthToken: (userId, tokenHash, createdAt) =>
      persistSafely(() =>
        client.upsert(
          "user_auth_tokens",
          {
            user_id: userId,
            token_hash: tokenHash,
            created_at: createdAt
          },
          "user_id"
        )
      )
  };
}

export function createSupabasePersistenceFromEnv(env = process.env): StorePersistence | null {
  const url = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createSupabasePersistence(createSupabaseRestClient({ url, serviceRoleKey }));
}
