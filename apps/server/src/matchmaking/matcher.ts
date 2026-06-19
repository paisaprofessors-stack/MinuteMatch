import type { QueueUser } from "@minutematch/shared";
import { blockKey } from "../storage/memoryStore.js";

const WAIT_RELAX_MS = 30000;

function wants(viewer: QueueUser, candidate: QueueUser): boolean {
  if (viewer.showMe === "everyone") return true;
  if (viewer.showMe === "men") return candidate.gender === "man";
  if (viewer.showMe === "women") return candidate.gender === "woman";
  return true;
}

export function sharedInterests(a: QueueUser, b: QueueUser): string[] {
  const bInterests = new Set(b.interests);
  return a.interests.filter((interest) => bInterests.has(interest));
}

export function canMatch(a: QueueUser, b: QueueUser, blocks: Set<string>): boolean {
  if (a.userId === b.userId) return false;
  if (a.mode !== b.mode) return false;
  if (blocks.has(blockKey(a.userId, b.userId)) || blocks.has(blockKey(b.userId, a.userId))) return false;
  return wants(a, b) && wants(b, a);
}

export function findBestMatch(seeker: QueueUser, candidates: QueueUser[], blocks: Set<string>, now = Date.now()): QueueUser | null {
  const relaxed = now - seeker.joinedAt >= WAIT_RELAX_MS;
  const viable = candidates.filter((candidate) => canMatch(seeker, candidate, blocks));
  const scored = viable
    .map((candidate) => {
      const shared = sharedInterests(seeker, candidate).length;
      if (!relaxed && shared === 0) return null;
      return {
        candidate,
        score:
          shared * 50 +
          (candidate.language === seeker.language ? 15 : 0) +
          Math.min(30, Math.floor((now - candidate.joinedAt) / 1000))
      };
    })
    .filter((entry): entry is { candidate: QueueUser; score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score || a.candidate.joinedAt - b.candidate.joinedAt);

  return scored[0]?.candidate ?? null;
}
