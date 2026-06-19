"use client";

import type { ReportReason } from "@minutematch/shared";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button, GhostButton, ModalShell, Notice, Select, TextArea } from "./ui";

const reasons: ReportReason[] = ["Harassment", "Sexual behavior", "Hate speech", "Threats", "Spam/scam", "Underage user", "Fake profile", "Other"];

export function ReportModal({
  open,
  onClose,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState<ReportReason>("Harassment");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  return (
    <ModalShell title="Report user" onClose={onClose}>
        <div className="mt-4 grid gap-3">
          <Notice tone="warning">
            <span className="inline-flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> This ends the active session.</span>
            <span className="mt-1 block text-white/70">Reports help moderation review unsafe behavior. You will not be matched with this person again.</span>
          </Notice>
          <Select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {reasons.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <TextArea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Optional details for moderation"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              loading={submitting}
              className="bg-rose-300 text-ink hover:bg-rose-200"
              onClick={async () => {
                setSubmitting(true);
                await onSubmit(reason, details);
                setSubmitting(false);
                setDetails("");
              }}
            >
              Submit report
            </Button>
            <GhostButton onClick={onClose}>Cancel</GhostButton>
          </div>
        </div>
    </ModalShell>
  );
}
