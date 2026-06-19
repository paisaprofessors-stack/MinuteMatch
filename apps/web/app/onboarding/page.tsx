"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Globe2, Heart, Languages, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Gender, Language, Mode, ShowMe } from "@minutematch/shared";
import {
  ArcadeBrand,
  ArcadeButton,
  ArcadePanel,
  ChoiceTile,
  GameShell,
  HUDBar,
  LoadoutChip,
  ProgressDots,
  TinyNav
} from "@/components/arcade";
import { genders, interests, languages, makeProfile, showMeOptions } from "@/lib/profile";
import { useProfileStore } from "@/store/profileStore";
import { MeeMascot } from "@/components/MeeMascot";

const mascotTips = [
  "Hey! I'm Mee, your vibe guide. Tell me your display name to start matching!",
  "Great tag! Next, let's filter who and what language you're looking to meet.",
  "Pick interests you can easily talk about for one minute. This is how we pair you!",
  "Safety first! Confirm you are 18+ and accept safety rules to enter the match pool."
];

const steps = ["Name", "Prefs", "Interests", "Safety"];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, hydrate, save } = useProfileStore();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [gender, setGender] = useState<Gender>("prefer_not");
  const [showMe, setShowMe] = useState<ShowMe>("everyone");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Music", "Coding"]);
  const [language, setLanguage] = useState<Language>("English");
  const [mode] = useState<Mode>("text");
  const [safetyAgreed, setSafetyAgreed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setAgeConfirmed(profile.ageConfirmed);
    setGender(profile.gender);
    setShowMe(profile.showMe);
    setSelectedInterests(profile.interests.length ? profile.interests : ["Music", "Coding"]);
    setLanguage(profile.language);
    setSafetyAgreed(profile.safetyAgreed);
  }, [profile]);

  const canContinue = useMemo(() => {
    if (step === 0) return displayName.trim().length >= 2;
    if (step === 2) return selectedInterests.length > 0;
    if (step === 3) return ageConfirmed && safetyAgreed;
    return true;
  }, [ageConfirmed, displayName, safetyAgreed, selectedInterests.length, step]);

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }

  function continueFlow() {
    setError("");
    if (!canContinue) {
      setError(step === 0 ? "Add a name first." : step === 2 ? "Pick at least one interest." : "Confirm 18+ and safety rules.");
      return;
    }
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    save(makeProfile({ userId: profile?.userId, displayName: displayName.trim(), ageConfirmed, gender, showMe, interests: selectedInterests, language, mode, safetyAgreed }));
    router.push("/match");
  }

  return (
    <GameShell>
      <HUDBar left={<ArcadeBrand compact />} center={<ProgressDots steps={steps} current={step} />} right={<TinyNav />} />
      <section className="mx-auto grid min-h-[calc(100vh-5.5rem)] max-w-3xl content-center py-5">
        <ArcadePanel className="min-h-[68vh]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#56b7ff]">{steps[step]}</p>
              <h1 className="mt-2 text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
                {step === 0 ? "Pick your tag" : step === 1 ? "Set the filter" : step === 2 ? "Build loadout" : "Safety gate"}
              </h1>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-right sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Mode</p>
              <p className="font-black text-[#9ff84d]">Text</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_240px] lg:items-center mt-8">
            <div className="relative min-h-[380px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {step === 0 && (
                    <div className="grid gap-4">
                      <label className="grid gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Display name</span>
                        <input
                          autoFocus
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder="Avery"
                          className="min-h-20 rounded-[1.25rem] border border-white/12 bg-black/30 px-5 text-3xl font-black outline-none transition placeholder:text-white/20 focus:border-[#9ff84d]/60 focus:shadow-glowGreen"
                        />
                      </label>
                      <ChoiceTile active title="Fast profile" meta="No bio. No photo. Just the round." icon={<UserRound className="h-5 w-5" />} />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="grid gap-5">
                      <div>
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/45">I am</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {genders.map((item) => <ChoiceTile key={item.value} active={gender === item.value} title={item.label} icon={<UserRound className="h-5 w-5" />} onClick={() => setGender(item.value)} />)}
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/45">Show me</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {showMeOptions.map((item) => <ChoiceTile key={item.value} active={showMe === item.value} title={item.label} icon={<Heart className="h-5 w-5" />} onClick={() => setShowMe(item.value)} />)}
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/45">Language</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {languages.map((item) => <ChoiceTile key={item} active={language === item} title={item} icon={<Languages className="h-5 w-5" />} onClick={() => setLanguage(item)} />)}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <p className="mb-4 text-sm font-bold text-white/54 font-display">Pick anything you can talk about for one minute.</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`min-h-12 rounded-full border px-4 text-sm font-black uppercase tracking-[0.06em] transition duration-200 active:scale-95 ${selectedInterests.includes(interest) ? "border-[#9ff84d]/60 bg-[#9ff84d]/12 text-[#d7ffb0] shadow-glowGreen" : "border-white/10 bg-white/[0.04] text-white/50 hover:text-white"}`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {selectedInterests.map((interest) => <LoadoutChip key={interest}>{interest}</LoadoutChip>)}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-3">
                      <ChoiceTile active title="Text mode locked" meta="Audio and video stay off for this MVP." icon={<Gamepad2 className="h-5 w-5" />} />
                      <ChoiceTile active={ageConfirmed} title="I am 18+" meta="Required for MinuteMatch." icon={<ShieldCheck className="h-5 w-5" />} onClick={() => setAgeConfirmed((value) => !value)} />
                      <ChoiceTile active={safetyAgreed} title="Safety rules accepted" meta="No private info. Report/block anytime." icon={<Globe2 className="h-5 w-5" />} onClick={() => setSafetyAgreed((value) => !value)} />
                      <div className="rounded-2xl border border-[#ffcf72]/20 bg-[#ffcf72]/10 p-4 text-sm font-semibold leading-6 text-[#ffe1a3]">
                        Keep phone, address, school, exact location, passwords, and payment info out of chat.
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mascot Side Companion */}
            <div className="hidden lg:flex flex-col items-center p-5 bg-white/[0.02] border border-white/5 rounded-3xl text-center select-none shrink-0 self-stretch justify-center">
              <MeeMascot state="idle" size={110} />
              <div className="relative mt-4 p-3 bg-neonBlue/10 border border-neonBlue/20 rounded-xl text-xs font-semibold leading-relaxed text-white/90 text-left">
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-neonBlue/20" />
                {mascotTips[step]}
              </div>
            </div>
          </div>

          {error ? <p className="mt-5 rounded-2xl border border-[#ff4f70]/24 bg-[#ff4f70]/10 p-3 text-sm font-bold text-[#ff9aad]">{error}</p> : null}
        </ArcadePanel>

        <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 border-t border-white/10 bg-[#050506]/86 py-3 backdrop-blur-xl">
          <ArcadeButton variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</ArcadeButton>
          <ArcadeButton variant={canContinue ? "success" : "ghost"} onClick={continueFlow}>
            {step === steps.length - 1 ? "Enter lobby" : "Continue"}
            <Sparkles className="h-4 w-4" />
          </ArcadeButton>
        </div>
      </section>
    </GameShell>
  );
}
