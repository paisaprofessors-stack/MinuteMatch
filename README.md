# MinuteMatch

MinuteMatch is a local-first MVP for 60-second, interest-based social discovery. It uses a real Express + Socket.IO backend, server-owned session timers, text chat, swipe results, friend requests, accepted-friend chat, mutual-consent repeat calls, presence, reporting, blocking, and a password-gated moderation dashboard.

## Stack

- Next.js, TypeScript, Tailwind CSS, Framer Motion, Zustand
- Node.js, Express, Socket.IO
- Shared TypeScript package for product and socket types
- Supabase/Postgres persistence for users, sessions, friendships, messages, reports, blocks, presence, and friend calls
- In-memory queue/timer/socket state for live matching, backed by durable Supabase social data

## Run Locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000`

PowerShell note: if `npm` is blocked by execution policy, use `npm.cmd install` and `npm.cmd run dev`.

## Environment

Copy `.env.example` to `.env` if you want to override defaults.

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
SERVER_PORT=4000
CORS_ORIGIN=http://localhost:3000
ADMIN_PASSWORD=admin123
APP_NAME=MinuteMatch
SUPABASE_URL=https://lkluaaxyaypgjzltviiy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present, the server hydrates durable state from Supabase on boot and writes social/session/message/report/call changes back to Supabase. Without those values, local development falls back to the in-memory store.

## Deploy

### Supabase

The active Supabase project is `website` (`lkluaaxyaypgjzltviiy`). The migration `minute_match_social_schema` creates:

- `users`, `sessions`, `friendships`, `messages`
- `blocks`, `reports`, `call_requests`, `presence`
- `contact_violations`

The checked-in SQL copy lives at `apps/server/src/storage/postgresSchema.sql`.

### Vercel Web App

Deploy the repository root to Vercel. `vercel.json` builds the Next app with:

```bash
npm run build:web
```

Set Vercel environment variables:

```bash
NEXT_PUBLIC_SOCKET_URL=https://your-minute-match-server.example.com
```

`NEXT_PUBLIC_SOCKET_URL` must point at the deployed Socket.IO server.

### Socket.IO Server

Vercel serverless functions are not a good fit for this app's long-running Socket.IO matchmaking server. Deploy `apps/server` on a persistent Node host such as Railway, Render, Fly.io, or a VPS using `apps/server/Dockerfile`.

Server environment variables:

```bash
SERVER_PORT=4000
CORS_ORIGIN=https://your-vercel-domain.vercel.app
ADMIN_PASSWORD=replace-this
SUPABASE_URL=https://lkluaaxyaypgjzltviiy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Use a comma-separated `CORS_ORIGIN` if you need both preview and production domains.

## Two-Tab Test Flow

1. Run `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs or two browsers.
3. Create a profile in each tab with age confirmation and safety agreement.
4. Pick compatible preferences, at least one shared interest, and the same language for a faster match.
5. Click **Start matching** in both tabs.
6. Both tabs should enter the same 60-second session room.
7. Send messages during the timer.
8. Wait for the server timer to end, then swipe right in both tabs to create an accepted friendship.
9. Open `/friends` to see the match, presence state, permanent chat, and audio/video call buttons.
10. Test one-sided right by swiping right in one tab and left in the other; the pending request appears in Friends.
11. Accept a pending request to unlock permanent chat.
12. From `/friends` or `/chat/:friendId`, request an audio/video call. The receiver must accept before the call becomes active.

## Admin Dashboard

Open `http://localhost:3000/admin` and use the password from `ADMIN_PASSWORD` (`admin123` by default).

Admin can view stats, reports, users, mark reports reviewing/dismissed, restrict users for 24 hours, ban users, and unban users.

## Safety Behavior

- Age confirmation and safety agreement are required before queueing.
- Banned and currently restricted users cannot join queue.
- Report creates a moderation report, ends the active session, blocks future rematches between the pair, and increments report count.
- Three reports temporarily restrict a user.
- Blocking prevents rematch, removes/hides friendships, and disables chat.
- Chat messages are limited to 300 characters, duplicate spam is blocked, and bursts over 10 messages per 10 seconds are blocked.
- Phone numbers, emails, social handles, invite links, and obvious contact-sharing bypasses are blocked before messages are saved or delivered.
- Three contact-sharing attempts in 15 minutes temporarily mute messaging for 5 minutes.
- Friend requests are rate-limited to 5 per 10 minutes and reports to 10 per hour.
- Friend calls require an accepted friendship and explicit receiver consent every time.

## Architecture Notes

- Redis: replace `apps/server/src/storage/memoryStore.ts` queue, timers, rate-limit histories, and socket lookup maps with Redis structures.
- Supabase/Postgres: durable social data is written through `apps/server/src/storage/supabaseStore.ts`.
- LiveKit: keep `VideoRoom` as the integration boundary and add token creation on the server after a match is created. Text mode remains the fallback when keys are absent.

## Useful Commands

```bash
npm run dev
npm run dev:web
npm run dev:server
npm test
npm run build
npm run typecheck
```
