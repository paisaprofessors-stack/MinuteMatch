"use client";

import { motion } from "framer-motion";
import { GameShell, HUDBar, ArcadeBrand, TinyNav, SafetyMark, StartLink, StatPill, ArcadePanel } from "@/components/arcade";

export default function LandingPage() {
  return (
    <GameShell>
      <HUDBar left={<ArcadeBrand compact />} right={<TinyNav />} />
      <section className="grid min-h-[calc(100vh-5.5rem)] place-items-center py-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-5xl">
          <div className="mb-5 flex justify-center sm:justify-start">
            <SafetyMark>18+ only · report/block live</SafetyMark>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-[clamp(4rem,13vw,11rem)] font-black uppercase leading-[0.78] tracking-[-0.09em]">
                Minute<br />
                <span className="text-[#9ff84d]">Match</span>
              </h1>
              <p className="mt-6 max-w-xl text-xl font-black leading-7 text-white sm:text-2xl">60 seconds. One person. Decide the vibe.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <StartLink href="/onboarding">Start a round</StartLink>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-white/36">No fake matches · local MVP</span>
              </div>
            </div>
            <ArcadePanel className="p-0">
              <div className="border-b border-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#56b7ff]">Round preview</p>
              </div>
              <div className="grid gap-3 p-4">
                <div className="rounded-2xl border border-[#9ff84d]/24 bg-[#9ff84d]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#caff98]">Prompt card</p>
                  <p className="mt-2 text-2xl font-black leading-7">What song do you never skip?</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatPill label="Timer" value="60" tone="green" />
                  <StatPill label="Choice" value="2" tone="rose" />
                  <StatPill label="Chat" value="Live" tone="blue" />
                </div>
              </div>
            </ArcadePanel>
          </div>
        </motion.div>
      </section>
    </GameShell>
  );
}
