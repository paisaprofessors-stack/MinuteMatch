"use client";

import { useState } from "react";
import type { Gender, Language, ShowMe, UserProfile } from "@minutematch/shared";
import { Chip, Field, ModalShell, Select, TextInput, Button, GhostButton } from "./ui";
import { genders, interests, languages, showMeOptions } from "@/lib/profile";
import { ShieldCheck, EyeOff, Ban, Flag, Sparkles } from "lucide-react";

export function InterestSelectorModal({
  open,
  selected,
  onClose,
  onSave
}: {
  open: boolean;
  selected: string[];
  onClose: () => void;
  onSave: (interests: string[]) => void;
}) {
  const [current, setCurrent] = useState<string[]>(selected);

  if (!open) return null;

  function toggle(interest: string) {
    setCurrent((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  return (
    <ModalShell title="Select Interests" onClose={onClose}>
      <div className="mt-4 grid gap-5">
        <p className="text-xs text-white/60">
          MinuteMatch prioritizing matching with people who share your interests. Pick at least one.
        </p>
        <div className="flex flex-wrap gap-2 py-2">
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
        <div className="flex gap-2 border-t border-white/5 pt-4">
          <Button
            onClick={() => {
              if (current.length === 0) return;
              onSave(current);
              onClose();
            }}
            disabled={current.length === 0}
            className="flex-1 bg-gradient-to-r from-neonBlue to-neonPink text-white"
          >
            Apply Filters
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

export function ProfilePreferenceModal({
  open,
  profile,
  onClose,
  onSave
}: {
  open: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => void;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [gender, setGender] = useState<Gender>(profile?.gender ?? "prefer_not");
  const [showMe, setShowMe] = useState<ShowMe>(profile?.showMe ?? "everyone");
  const [language, setLanguage] = useState<Language>(profile?.language ?? "English");

  if (!open) return null;

  return (
    <ModalShell title="Edit Preferences" onClose={onClose}>
      <div className="mt-4 grid gap-4">
        <Field label="Display Name">
          <TextInput
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Avery"
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

        <div className="flex gap-2 border-t border-white/5 pt-4 mt-2">
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
            className="flex-1 bg-gradient-to-r from-[#d86bff] to-[#ff4fd8] text-white"
          >
            Save Options
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

export function BlockModal({
  open,
  partnerName,
  onClose,
  onConfirm
}: {
  open: boolean;
  partnerName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <ModalShell title="Confirm Block" onClose={onClose}>
      <div className="mt-4 grid gap-4">
        <div className="flex items-center gap-3 text-warning">
          <Ban className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">You are blocking {partnerName}</p>
        </div>
        <p className="text-xs leading-relaxed text-white/70">
          This connection will be completely removed. Blocked users can never rematch with you in the queue, message you, or see your profile parameters.
        </p>
        <div className="flex gap-2 border-t border-white/5 pt-4 mt-2">
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 bg-warning text-white"
          >
            Block User
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}

export function SafetyReminderModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <ModalShell title="Safety Guidelines" onClose={onClose}>
      <div className="mt-4 grid gap-4 text-xs leading-relaxed text-white/80">
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

        <Button onClick={onClose} className="mt-2 w-full bg-white text-ink font-bold">
          Understood
        </Button>
      </div>
    </ModalShell>
  );
}
