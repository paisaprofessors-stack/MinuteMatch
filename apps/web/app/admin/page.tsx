"use client";

import { useState } from "react";
import type { AdminStats, Report, ReportReason, ReportStatus, UserProfile } from "@minutematch/shared";
import { Button, Card, Field, GhostButton, Navbar, Shell, TextInput, Badge, PageHeader, Select } from "@/components/ui";
import { SOCKET_URL } from "@/lib/config";
import { useToastStore } from "@/store/toastStore";
import { ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("admin123");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportQuery, setReportQuery] = useState("");
  const [reportStatus, setReportStatus] = useState<ReportStatus | "all">("all");
  const [reportReason, setReportReason] = useState<ReportReason | "all">("all");
  const [userQuery, setUserQuery] = useState("");
  const { addToast } = useToastStore();

  async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const sep = path.includes("?") ? "&" : "?";
    const response = await fetch(`${SOCKET_URL}${path}${sep}password=${encodeURIComponent(password)}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<T>;
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextStats, nextReports, nextUsers] = await Promise.all([
        adminFetch<AdminStats>("/admin/stats"),
        adminFetch<Report[]>("/admin/reports"),
        adminFetch<UserProfile[]>("/admin/users")
      ]);
      setStats(nextStats);
      setReports(nextReports);
      setUsers(nextUsers);
      addToast("Moderation dashboard loaded successfully.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load admin dashboard.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function reportAction(reportId: string, action: string) {
    try {
      await adminFetch(`/admin/reports/${reportId}/action`, { 
        method: "POST", 
        body: JSON.stringify({ action }) 
      });
      addToast(`Action "${action}" applied to report.`, "success");
      await load();
    } catch (err) {
      addToast("Failed to apply action.", "error");
    }
  }

  async function userAction(userId: string, action: string) {
    try {
      await adminFetch(`/admin/users/${userId}/action`, { 
        method: "POST", 
        body: JSON.stringify({ action }) 
      });
      addToast(`Action "${action}" applied to user.`, "success");
      await load();
    } catch (err) {
      addToast("Failed to alter user status.", "error");
    }
  }

  const statCards = stats ? [
    ["Total Users", stats.totalUsers, "neutral"],
    ["Online Users", stats.onlineUsers, "success"],
    ["Queue Size", stats.queueSize, "accent"],
    ["Active Sessions", stats.activeSessions, "success"],
    ["Completed", stats.completedSessions, "neutral"],
    ["Open Reports", stats.openReports, "danger"],
    ["Restricted", stats.restrictedUsers, "warning"],
    ["Banned Users", stats.bannedUsers, "danger"],
    ["Contact Blocks", stats.contactViolations, "warning"],
    ["Muted Users", stats.mutedUsers, "danger"],
    ["Call Requests", stats.callRequests, "accent"]
  ] as const : [];

  const reportReasons: Array<ReportReason | "all"> = ["all", "Harassment", "Sexual behavior", "Hate speech", "Threats", "Spam/scam", "Underage user", "Fake profile", "Other"];
  const reportStatuses: Array<ReportStatus | "all"> = ["all", "open", "reviewing", "resolved", "dismissed"];
  const filteredReports = reports.filter((report) => {
    const query = reportQuery.trim().toLowerCase();
    const queryMatches = !query ||
      report.id.toLowerCase().includes(query) ||
      report.reporterId.toLowerCase().includes(query) ||
      report.reportedUserId.toLowerCase().includes(query) ||
      report.reason.toLowerCase().includes(query) ||
      (report.details ?? "").toLowerCase().includes(query);
    return queryMatches && (reportStatus === "all" || report.status === reportStatus) && (reportReason === "all" || report.reason === reportReason);
  });
  const filteredUsers = users.filter((user) => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return true;
    return user.userId.toLowerCase().includes(query) || user.displayName.toLowerCase().includes(query) || user.status.toLowerCase().includes(query);
  });

  function getStatusBadge(status: string) {
    if (status === "active") return <Badge tone="success">Active</Badge>;
    if (status === "restricted") return <Badge tone="warning">Restricted</Badge>;
    if (status === "banned") return <Badge tone="danger">Banned</Badge>;
    return <Badge>{status}</Badge>;
  }

  function getReportBadge(status: string) {
    if (status === "open") return <Badge tone="danger">Open</Badge>;
    if (status === "reviewing") return <Badge tone="warning">Reviewing</Badge>;
    if (status === "resolved") return <Badge tone="success">Resolved</Badge>;
    if (status === "dismissed") return <Badge tone="neutral">Dismissed</Badge>;
    return <Badge>{status}</Badge>;
  }

  return (
    <Shell>
      <Navbar />
      <div className="py-6 mx-auto max-w-6xl">
        <PageHeader 
          eyebrow="Moderation Portal" 
          title="Moderation dashboard" 
          copy="Review live connection metrics, handle reporter claims, restrict or lift matching bans."
        />

        <Card className="flex flex-col gap-4 border border-white/5 bg-white/5 sm:flex-row sm:items-end p-5 max-w-xl">
          <div className="flex-1">
            <Field label="Admin Password">
              <TextInput 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                type="password" 
                placeholder="Enter password"
              />
            </Field>
          </div>
          <Button onClick={load} loading={loading} className="px-6">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Reload
          </Button>
        </Card>

        {error ? (
          <p className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-warning">
            {error}
          </p>
        ) : null}

        {stats ? (
          <>
            {/* Stats Section */}
            <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
              {statCards.map(([label, value, tone]) => (
                <Card key={label} className="border border-white/5 bg-white/5 py-4 px-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white leading-none">{value}</span>
                    <span className="flex h-2 w-2 rounded-full" style={{
                      backgroundColor: tone === "success" ? "#34d399" : tone === "danger" ? "#fb7185" : tone === "warning" ? "#f59e0b" : tone === "accent" ? "#68b8ff" : "rgba(255,255,255,0.2)"
                    }} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Reports Section */}
            <Card className="mt-8 overflow-hidden border border-white/5 bg-white/5 p-0">
              <div className="border-b border-white/5 px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="text-xl font-black text-white">Open Reports</h2>
                <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
                  <TextInput value={reportQuery} onChange={(event) => setReportQuery(event.target.value)} placeholder="Search reports" />
                  <Select value={reportStatus} onChange={(event) => setReportStatus(event.target.value as ReportStatus | "all")}>
                    {reportStatuses.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>)}
                  </Select>
                  <Select value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason | "all")}>
                    {reportReasons.map((reason) => <option key={reason} value={reason}>{reason === "all" ? "All reasons" : reason}</option>)}
                  </Select>
                </div>
                <Badge tone="danger">{filteredReports.length} Shown</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs text-white/80">
                  <thead className="bg-white/[0.02] text-white/40 uppercase tracking-widest text-[9px] font-bold border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-4 py-4">Reporter</th>
                      <th className="px-4 py-4">Reported User</th>
                      <th className="px-4 py-4">Reason</th>
                      <th className="px-4 py-4">Details</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-white/50">{report.id.slice(0, 12)}</td>
                        <td className="px-4 py-4 font-mono text-white/60">{report.reporterId.slice(0, 8)}</td>
                        <td className="px-4 py-4 font-mono text-white/60">{report.reportedUserId.slice(0, 8)}</td>
                        <td className="px-4 py-4 text-white font-semibold">{report.reason}</td>
                        <td className="px-4 py-4 text-white/60 max-w-[150px] truncate" title={report.details}>{report.details || "—"}</td>
                        <td className="px-4 py-4">{getReportBadge(report.status)}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1.5 flex-wrap">
                          <GhostButton onClick={() => reportAction(report.id, "reviewing")} className="text-[10px] h-8 px-2 py-0.5 border-white/10">
                            Review
                          </GhostButton>
                          <GhostButton onClick={() => reportAction(report.id, "dismiss")} className="text-[10px] h-8 px-2 py-0.5 border-white/10">
                            Dismiss
                          </GhostButton>
                          <GhostButton onClick={() => reportAction(report.id, "restrict")} className="text-[10px] h-8 px-2 py-0.5 text-warning border-transparent hover:border-warning/20">
                            Restrict (24h)
                          </GhostButton>
                          <GhostButton onClick={() => reportAction(report.id, "ban")} className="text-[10px] h-8 px-2 py-0.5 text-warning border-transparent hover:border-warning/20">
                            Ban
                          </GhostButton>
                          <GhostButton onClick={() => reportAction(report.id, "unban")} className="text-[10px] h-8 px-2 py-0.5 text-neonGreen border-transparent hover:border-neonGreen/20">
                            Restore
                          </GhostButton>
                        </td>
                      </tr>
                    ))}
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-white/40">No reports found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Users list */}
            <Card className="mt-8 overflow-hidden border border-white/5 bg-white/5 p-0">
              <div className="border-b border-white/5 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-xl font-black text-white">Registered User Directory</h2>
                <TextInput value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search users" className="sm:max-w-xs" />
                <Badge tone="success">{filteredUsers.length} Shown</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs text-white/80">
                  <thead className="bg-white/[0.02] text-white/40 uppercase tracking-widest text-[9px] font-bold border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-4 py-4">Display Name</th>
                      <th className="px-4 py-4">Gender</th>
                      <th className="px-4 py-4">Interests</th>
                      <th className="px-4 py-4">Reports</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredUsers.map((user) => (
                      <tr key={user.userId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-white/50">{user.userId.slice(0, 8)}</td>
                        <td className="px-4 py-4 font-semibold text-white">{user.displayName}</td>
                        <td className="px-4 py-4 text-white/60 capitalize">{user.gender.replace("_", " ")}</td>
                        <td className="px-4 py-4 text-white/60">{user.interests.join(", ")}</td>
                        <td className="px-4 py-4 text-white/70 font-mono">{user.reportCount}</td>
                        <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1.5 flex-wrap">
                          <GhostButton onClick={() => userAction(user.userId, "ban")} className="text-[10px] h-8 px-2.5 py-0.5 text-warning border-transparent hover:border-warning/20">
                            Ban
                          </GhostButton>
                          <GhostButton onClick={() => userAction(user.userId, "restrict")} className="text-[10px] h-8 px-2.5 py-0.5 text-warning border-transparent hover:border-warning/20">
                            Restrict (24h)
                          </GhostButton>
                          <GhostButton onClick={() => userAction(user.userId, "unban")} className="text-[10px] h-8 px-2.5 py-0.5 text-neonGreen border-transparent hover:border-neonGreen/20">
                            Restore
                          </GhostButton>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-white/40">No users registered yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
