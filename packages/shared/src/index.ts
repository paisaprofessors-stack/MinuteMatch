export type Gender = "man" | "woman" | "non_binary" | "prefer_not";
export type ShowMe = "men" | "women" | "everyone";
export type Language = "Hinglish" | "Hindi" | "English";
export type Mode = "text" | "audio" | "video";
export type UserStatus = "active" | "restricted" | "banned";
export type SessionStatus = "created" | "waiting_for_users" | "active" | "ended" | "cancelled" | "reported";
export type SwipeChoice = "left" | "right";
export type SwipeResultType = "mutual_match" | "request_sent" | "no_match" | "partner_left" | "error";
export type FriendshipStatus = "pending" | "accepted" | "declined";
export type CallRequestStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportReason =
  | "Harassment"
  | "Sexual behavior"
  | "Hate speech"
  | "Threats"
  | "Spam/scam"
  | "Underage user"
  | "Fake profile"
  | "Other";

export interface UserProfile {
  userId: string;
  displayName: string;
  ageConfirmed: boolean;
  gender: Gender;
  showMe: ShowMe;
  interests: string[];
  language: Language;
  mode: Mode;
  safetyAgreed: boolean;
  createdAt: number;
  status: UserStatus;
  reportCount: number;
}

export interface QueueUser {
  userId: string;
  socketId: string;
  displayName: string;
  gender: Gender;
  showMe: ShowMe;
  interests: string[];
  language: Language;
  mode: Mode;
  joinedAt: number;
}

export interface MatchSession {
  id: string;
  userAId: string;
  userBId: string;
  usersReady: string[];
  sharedInterest: string;
  icebreaker: string;
  status: SessionStatus;
  mode: Mode;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  endedReason?: string;
}

export interface SwipeDecision {
  sessionId: string;
  userId: string;
  choice: SwipeChoice;
  createdAt: number;
}

export interface Friendship {
  id: string;
  requesterId: string;
  receiverId: string;
  users: [string, string];
  status: FriendshipStatus;
  sharedInterest: string;
  sessionId?: string;
  createdAt: number;
  acceptedAt?: number;
  declinedAt?: number;
  updatedAt?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: number;
  kind: "session" | "friend";
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  sessionId?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: number;
}

export interface Block {
  blockerId: string;
  blockedUserId: string;
  createdAt: number;
}

export interface FriendPresence {
  userId: string;
  online: boolean;
  socketId?: string;
  lastSeenAt: number;
  currentSessionId?: string;
  currentCallId?: string;
}

export interface FriendSummary {
  friendship: Friendship;
  partner: Pick<UserProfile, "userId" | "displayName" | "gender" | "interests" | "language" | "mode" | "status">;
  presence?: FriendPresence;
  unreadCount: number;
}

export interface FriendRequestPayload {
  friendship: Friendship;
  requester: Pick<UserProfile, "userId" | "displayName">;
  receiver: Pick<UserProfile, "userId" | "displayName">;
}

export interface FriendCallRequest {
  id: string;
  friendshipId: string;
  requesterId: string;
  receiverId: string;
  mode: Exclude<Mode, "text">;
  status: CallRequestStatus;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  declinedAt?: number;
  endedAt?: number;
  roomId?: string;
}

export interface ModerationFilterResult {
  ok: boolean;
  reason?: string;
  code?: "contact_sharing" | "message_length" | "spam" | "blocked" | "locked";
}

export interface FriendsListPayload {
  matches: Friendship[];
  pendingReceived: Friendship[];
  sentRequests: Friendship[];
  blocked: string[];
  users: Record<string, UserProfile>;
  presence: Record<string, FriendPresence>;
  unreadCounts: Record<string, number>;
}

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  queueSize: number;
  activeSessions: number;
  completedSessions: number;
  openReports: number;
  restrictedUsers: number;
  bannedUsers: number;
  contactViolations: number;
  mutedUsers: number;
  callRequests: number;
}

export interface MatchFoundPayload {
  sessionId: string;
  partner: Pick<UserProfile, "userId" | "displayName" | "gender" | "interests" | "language" | "mode">;
  sharedInterest: string;
  icebreaker: string;
  mode: Mode;
}

export interface SessionMessagePayload {
  sessionId: string;
  message: ChatMessage;
}

export interface SwipeResultPayload {
  type: SwipeResultType;
  friendship?: Friendship;
  partnerId: string;
  message: string;
}
