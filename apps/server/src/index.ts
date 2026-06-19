import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import type { ReportReason } from "@minutematch/shared";
import { createMemoryStore, unblockUser, updateReportStatus } from "./storage/memoryStore.js";
import { createSupabasePersistenceFromEnv } from "./storage/supabaseStore.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";
import { acceptFriendship, blockUser, declineFriendship, listSocialGraph, removeFriendship } from "./social/socialService.js";
import { acceptFriendCallRequest, createFriendCallRequest, declineFriendCallRequest } from "./calls/callService.js";
import { requireStrongProductionSecrets, verifyAdminSecret, verifyUserToken } from "./security/auth.js";

const app = express();
const port = Number(process.env.SERVER_PORT ?? 4000);
requireStrongProductionSecrets(process.env);
const adminPassword = process.env.ADMIN_PASSWORD ?? "";
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : process.env.NODE_ENV === "production" ? [] : true;
const persistence = createSupabasePersistenceFromEnv();
const store = createMemoryStore(persistence ?? undefined);

if (persistence) {
  try {
    await persistence.hydrate(store);
    console.info("[supabase] hydrated persistent social store");
  } catch (error) {
    console.error("[supabase] hydration failed; continuing with empty in-memory store", error);
  }
} else {
  console.info("[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing; using in-memory store");
}

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: true }
});

registerSocketHandlers(io, store);

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const auth = String(req.headers.authorization ?? "");
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  const password = String(req.headers["x-admin-password"] ?? bearer);
  if (!verifyAdminSecret(adminPassword, password)) {
    res.status(401).json({ error: "Invalid admin password." });
    return;
  }
  next();
}

function requireActor(req: express.Request, res: express.Response): string | null {
  const userId = String(req.headers["x-user-id"] ?? "");
  const token = String(req.headers["x-user-token"] ?? "");
  if (!verifyUserToken(store, userId, token)) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  return userId;
}

function actorCanReadRoom(actorId: string, roomId: string): boolean {
  const friendship = store.friendships.get(roomId);
  if (friendship?.status === "accepted" && friendship.users.includes(actorId)) return true;
  const session = store.sessions.get(roomId);
  return Boolean(session && [session.userAId, session.userBId].includes(actorId));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "MinuteMatch", stats: store.getStats() });
});

app.get("/api/friends/:userId", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  if (actorId !== req.params.userId) return res.status(403).json({ error: "Forbidden." });
  res.json(listSocialGraph(store, actorId));
});

app.post("/api/friends/:friendshipId/accept", (req, res) => {
  try {
    const actorId = requireActor(req, res);
    if (!actorId) return;
    res.json(acceptFriendship(store, req.params.friendshipId, actorId));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not accept request." });
  }
});

app.post("/api/friends/:friendshipId/decline", (req, res) => {
  try {
    const actorId = requireActor(req, res);
    if (!actorId) return;
    res.json(declineFriendship(store, req.params.friendshipId, actorId));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not decline request." });
  }
});

app.post("/api/friends/:friendshipId/remove", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  res.json({ ok: removeFriendship(store, req.params.friendshipId, actorId) });
});

app.post("/api/block", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const { blockedUserId } = req.body as { blockedUserId: string };
  if (!blockedUserId) return res.status(400).json({ error: "Missing block fields." });
  blockUser(store, actorId, blockedUserId);
  res.json({ blockerId: actorId, blockedUserId, createdAt: Date.now() });
});

app.post("/api/unblock", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const { blockedUserId } = req.body as { blockedUserId: string };
  if (!blockedUserId) return res.status(400).json({ error: "Missing unblock fields." });
  unblockUser(store, actorId, blockedUserId);
  res.json({ ok: true, blockerId: actorId, blockedUserId });
});

app.post("/api/report", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const body = req.body as { reportedUserId: string; sessionId?: string; reason: ReportReason; details?: string };
  if (!body.reportedUserId || !body.reason) return res.status(400).json({ error: "Missing report fields." });
  const report = store.createReport({ ...body, reporterId: actorId });
  console.info("[report] created", { reportId: report.id, reporterId: actorId, reportedUserId: body.reportedUserId });
  res.json(report);
});

app.get("/api/messages/:roomId", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  if (!actorCanReadRoom(actorId, req.params.roomId)) return res.status(403).json({ error: "Forbidden." });
  res.json(store.messages.get(req.params.roomId) ?? []);
});

app.post("/api/calls/request", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const { friendshipId, mode } = req.body as { friendshipId: string; mode: "audio" | "video" };
  if (!friendshipId || !["audio", "video"].includes(mode)) return res.status(400).json({ error: "Missing call request fields." });
  const result = createFriendCallRequest(store, friendshipId, actorId, mode);
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.json(result.call);
});

app.post("/api/calls/:callRequestId/accept", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const result = acceptFriendCallRequest(store, req.params.callRequestId, actorId);
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.json(result.call);
});

app.post("/api/calls/:callRequestId/decline", (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const result = declineFriendCallRequest(store, req.params.callRequestId, actorId);
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.json(result.call);
});

app.get("/admin/stats", requireAdmin, (_req, res) => res.json(store.getStats()));

app.get("/admin/reports", requireAdmin, (_req, res) => {
  res.json([...store.reports.values()].sort((a, b) => b.createdAt - a.createdAt));
});

app.post("/admin/reports/:reportId/action", requireAdmin, (req, res) => {
  const { action } = req.body as { action: "reviewing" | "dismiss" | "resolve" | "warn" | "restrict" | "ban" | "unban" };
  const report = store.reports.get(req.params.reportId);
  if (!report) return res.status(404).json({ error: "Report not found." });
  if (action === "reviewing") updateReportStatus(store, report.id, "reviewing");
  if (action === "dismiss") updateReportStatus(store, report.id, "dismissed");
  if (action === "resolve") updateReportStatus(store, report.id, "resolved");
  if (action === "restrict") store.setUserStatus(report.reportedUserId, "restricted", Date.now() + 24 * 60 * 60 * 1000);
  if (action === "ban") store.setUserStatus(report.reportedUserId, "banned");
  if (action === "unban") store.setUserStatus(report.reportedUserId, "active");
  res.json({ report: store.reports.get(report.id), user: store.users.get(report.reportedUserId) });
});

app.get("/admin/users", requireAdmin, (_req, res) => {
  res.json([...store.users.values()].sort((a, b) => b.createdAt - a.createdAt));
});

app.post("/admin/users/:userId/action", requireAdmin, (req, res) => {
  const { action } = req.body as { action: "ban" | "unban" | "restrict" };
  if (action === "ban") store.setUserStatus(req.params.userId, "banned");
  if (action === "unban") store.setUserStatus(req.params.userId, "active");
  if (action === "restrict") store.setUserStatus(req.params.userId, "restricted", Date.now() + 24 * 60 * 60 * 1000);
  res.json(store.users.get(req.params.userId));
});

server.listen(port, () => {
  console.log(`MinuteMatch server running on http://localhost:${port}`);
});
