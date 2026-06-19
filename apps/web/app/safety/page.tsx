"use client";

import Link from "next/link";
import { Ban, EyeOff, LockKeyhole, ShieldCheck, Siren, UserCheck } from "lucide-react";
import { Badge, Button, Card, Navbar, Notice, PageHeader, Shell } from "@/components/ui";

const safetyRules = [
  "Never share your phone number, address, school, exact location, passwords, or financial details.",
  "You control every conversation. End, block, or report anytime.",
  "Permanent chat unlocks only after mutual consent.",
  "Dating and social discovery flows in this MVP are 18+ only."
];

const features = [
  { icon: UserCheck, title: "18+ confirmation", copy: "Users must confirm adult status before entering the dating/social discovery queue." },
  { icon: Ban, title: "Block protection", copy: "Blocking prevents future rematches and removes active connection surfaces." },
  { icon: Siren, title: "Report review", copy: "Reports create moderation records and can trigger restrictions or bans." },
  { icon: EyeOff, title: "No exact location", copy: "MinuteMatch does not ask for exact location, school, address, or phone number." },
  { icon: LockKeyhole, title: "Consent-gated chat", copy: "Permanent chat only opens after matching rules allow a connection." },
  { icon: ShieldCheck, title: "Spam limits", copy: "Message bursts, repeated messages, requests, and reports are rate-limited." }
];

export default function SafetyPage() {
  return (
    <Shell>
      <Navbar />
      <PageHeader
        eyebrow="Safety"
        title="Safer one-minute discovery."
        copy="MinuteMatch keeps safety controls close to the conversation: report, block, end, rate limits, restrictions, and admin review are built into the core flow."
        action={<Link href="/onboarding"><Button>Set up profile</Button></Link>}
      />

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="h-fit">
          <Badge tone="warning">Read before matching</Badge>
          <div className="mt-5 grid gap-3">
            {safetyRules.map((rule) => (
              <Notice key={rule}>{rule}</Notice>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <feature.icon className="h-5 w-5 text-[#68b8ff]" />
              <h2 className="mt-4 text-lg font-black">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{feature.copy}</p>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
