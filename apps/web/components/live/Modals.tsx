"use client";

import React, { useState, useEffect } from "react";
import type { Gender, Language, ShowMe, UserProfile, ReportReason } from "@minutematch/shared";
import { Chip, Field, ModalShell, Select, TextInput, TextArea, Button, GhostButton, Notice } from "@/components/ui";
import { genders, interests, languages, showMeOptions } from "@/lib/profile";
import { ShieldCheck, EyeOff, Ban, Flag, Sparkles, AlertTriangle } from "lucide-react";

// --- INTEREST SELECTOR MODAL ---
interface InterestSelectorModalProps {
  open: boolean;
  selected: string[];
  onClose: () => void;
  onSave: (interests: string[]) => void;
}

export function InterestSelectorModal({
  open,
  selected,
  onClose,
  onSave
}: InterestSelectorModalProps) {
  const [current, setCurrent] = useState<string[]>(selected);

  // Sync state when opened
  useEffect(() => {
    if (open) {
      setCurrent(selected);
    }
  }, [open, selected]);

  if (!open) return null;

  function toggle(interest: string) {
    setCurrent((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  return (
    <ModalShell title="Filter by Interests" onClose={onClose}>
      <div className="mt-4 grid gap-5 select-none">
        <p className="text-xs text-white/60 leading-relaxed">
          MinuteMatch prioritizes matching you with people who share your active vibes. Pick one or more interests below.
        </p>
        <div className="flex flex-wrap gap-2 py-2 max-h-56 overflow-y-auto pr-1">
          {interests.map((interest) => (
            <Chip
              key={interest}
              active={current.includes(interest)}
              onClick={() => toggle(interest)}
            >
              {interest}
            </Chip>
          ))}
        </div>
        <div className="flex gap-3 border-t border-white/5 pt-4">
          <Button
            onClick={() => {
              if (current.length === 0) return;
              onSave(current);
              onClose();
            }}
            disabled={current.length === 0}
            className="flex-1 bg-gradient-to-r from-neonBlue to-neonPink text-white shadow-glow hover:brightness-105"
          >
            Apply Filters
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

// --- PROFILE PREFERENCE MODAL ---
interface ProfilePreferenceModalProps {
  open: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => void;
}

export function ProfilePreferenceModal({
  open,
  profile,
  onClose,
  onSave
}: ProfilePreferenceModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender>("prefer_not");
  const [showMe, setShowMe] = useState<ShowMe>("everyone");
  const [language, setLanguage] = useState<Language>("English");

  // Sync state when opened
  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.displayName ?? "");
      setGender(profile.gender ?? "prefer_not");
      setShowMe(profile.showMe ?? "everyone");
      setLanguage(profile.language ?? "English");
    }
  }, [open, profile]);

  if (!open) return null;

  return (
    <ModalShell title="Edit Matching Filters" onClose={onClose}>
      <div className="mt-4 grid gap-4 text-left">
        <Field label="Display Name">
          <TextInput
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="E.g., Avery"
            maxLength={20}
          />
        </Field>
        
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="My Gender">
            <Select value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
              {genders.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </Select>
          </Field>
          
          <Field label="Show Me">
            <Select value={showMe} onChange={(event) => setShowMe(event.target.value as ShowMe)}>
              {showMeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          
          <Field label="Language">
            <Select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
        </div>

        <div className="flex gap-3 border-t border-white/5 pt-4 mt-2">
          <Button
            onClick={() => {
              if (displayName.trim().length < 2) return;
              onSave({
                displayName: displayName.trim(),
                gender,
                showMe,
                language
              });
              onClose();
            }}
            disabled={displayName.trim().length < 2}
            className="flex-1 bg-gradient-to-r from-neonBlue to-neonPink text-white shadow-glow hover:brightness-105"
          >
            Save Options
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

// --- BLOCK USER MODAL ---
interface BlockModalProps {
  open: boolean;
  partnerName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function BlockModal({
  open,
  partnerName,
  onClose,
  onConfirm
}: BlockModalProps) {
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (open) {
      setBlocking(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <ModalShell title={`Block ${partnerName}`} onClose={onClose}>
      <div className="mt-4 grid gap-4 text-left">
        <Notice tone="danger">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <Ban className="h-4 w-4 shrink-0" />
            <span>Block Action is Permanent</span>
          </div>
          <p className="mt-1 text-xs text-rose-100/70">
            Blocking ends the current session. You won't be matched with this person again, and active chat relations are disconnected.
          </p>
        </Notice>
        <p className="text-xs leading-relaxed text-white/70">
          Are you sure you want to block {partnerName}? They will not be notified, but our matchmaking system will filter them out of your feed.
        </p>
        <div className="flex gap-3 border-t border-white/5 pt-4">
          <Button
            loading={blocking}
            onClick={async () => {
              setBlocking(true);
              await onConfirm();
              onClose();
            }}
            className="flex-1 bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            Block User
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

// --- REPORT USER MODAL ---
interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}

const reportReasons: ReportReason[] = [
  "Harassment",
  "Sexual behavior",
  "Hate speech",
  "Threats",
  "Spam/scam",
  "Underage user",
  "Fake profile",
  "Other"
];

export function ReportModal({
  open,
  onClose,
  onSubmit
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("Harassment");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("Harassment");
      setDetails("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <ModalShell title="Report User" onClose={onClose}>
      <div className="mt-4 grid gap-3 text-left">
        <Notice tone="warning">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>This ends the active session</span>
          </div>
          <p className="mt-1 text-xs text-amber-100/70">
            Reporting immediately terminates the connection. Our team monitors matches to keep MinuteMatch safe and respectful.
          </p>
        </Notice>
        
        <Field label="Reason for Report">
          <Select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {reportReasons.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </Field>

        <Field label="Details (Optional)">
          <TextArea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Tell us what happened..."
            maxLength={300}
          />
        </Field>

        <div className="flex gap-3 border-t border-white/5 pt-4 mt-2">
          <Button
            loading={submitting}
            onClick={async () => {
              setSubmitting(true);
              await onSubmit(reason, details);
              onClose();
            }}
            className="flex-1 bg-[#fb7185] text-white hover:bg-rose-500 transition"
          >
            Submit Report
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

// --- SAFETY GUIDELINES MODAL ---
interface SafetyReminderModalProps {
  open: boolean;
  onClose: () => void;
}

export function SafetyReminderModal({
  open,
  onClose
}: SafetyReminderModalProps) {
  if (!open) return null;

  return (
    <ModalShell title="MinuteMatch Safety Guidelines" onClose={onClose}>
      <div className="mt-4 grid gap-4 text-xs leading-relaxed text-white/80 select-none text-left">
        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <ShieldCheck className="h-5 w-5 text-neonGreen shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Protect Private Info</p>
            <p className="mt-1 text-white/60">Do not share physical locations, school names, phone numbers, addresses, social IDs, or payment details.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <EyeOff className="h-5 w-5 text-neonBlue shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Keep it on MinuteMatch</p>
            <p className="mt-1 text-white/60">Abusive users often ask you to move to snap, discord, or telegram. Chatting here maintains our automated safety filters.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Flag className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Abuse & Reporting</p>
            <p className="mt-1 text-white/60">If a match exhibits harassment, sexual behavior, hate speech, or spam, immediately hit the Report button. Three reports trigger server-side restrictions.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Sparkles className="h-5 w-5 text-[#ff4fd8] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Adults Only (18+)</p>
            <p className="mt-1 text-white/60">Dating/social speed discovery is 18+. Report underage behavior under "Underage user" to assist in maintaining rules.</p>
          </div>
        </div>

        <Button onClick={onClose} className="mt-2 w-full bg-white text-black font-bold hover:bg-neutral-100">
          Understood
        </Button>
      </div>
    </ModalShell>
  );
}
