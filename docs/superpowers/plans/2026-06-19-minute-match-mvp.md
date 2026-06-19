# MinuteMatch MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first, real-time 18+ social discovery MVP with onboarding, matchmaking, 60-second chat sessions, swipe outcomes, friends, reporting, blocking, and moderation.

**Architecture:** The repo is a small npm workspace with shared TypeScript types, an Express + Socket.IO server, and a Next.js app. The server owns queue compatibility, session timers, swipes, friend state, reports, blocks, and admin actions through modular in-memory stores that can later be replaced by Redis/Postgres/Supabase.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Zustand, Socket.IO, Express, Vitest.

---

### Task 1: Workspace And Shared Types

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/index.ts`

- [x] Create npm workspaces for `apps/server`, `apps/web`, and `packages/shared`.
- [x] Define shared product types for profiles, queue users, sessions, swipes, friendships, reports, blocks, messages, admin stats, and socket payloads.

### Task 2: Backend Core

**Files:**
- Create: `apps/server/src/storage/memoryStore.ts`
- Create: `apps/server/src/matchmaking/matcher.ts`
- Create: `apps/server/src/safety/rateLimit.ts`
- Create: `apps/server/src/sessions/sessionService.ts`
- Create: `apps/server/src/socket/socketHandlers.ts`
- Create: `apps/server/src/index.ts`
- Test: `apps/server/src/__tests__/core.test.ts`

- [x] Write failing tests for matching, spam limits, swipes, reports, and block safety.
- [x] Implement memory stores and service functions to pass those tests.
- [x] Wire Socket.IO event handlers and REST admin/friend endpoints.

### Task 3: Frontend MVP

**Files:**
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/onboarding/page.tsx`
- Create: `apps/web/app/match/page.tsx`
- Create: `apps/web/app/session/[sessionId]/page.tsx`
- Create: `apps/web/app/friends/page.tsx`
- Create: `apps/web/app/chat/[friendId]/page.tsx`
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/components/*.tsx`
- Create: `apps/web/lib/*.ts`
- Create: `apps/web/store/*.ts`

- [x] Build premium dark landing, profile onboarding, queue, session, swipe, friends, chat, report/block, and admin screens.
- [x] Store local profiles in `localStorage`.
- [x] Connect to the backend with Socket.IO and HTTP APIs.

### Task 4: Verification And Docs

**Files:**
- Create: `README.md`

- [x] Document local setup, two-tab test flow, admin password, and future Supabase/Redis/LiveKit upgrades.
- [ ] Run `npm install`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
