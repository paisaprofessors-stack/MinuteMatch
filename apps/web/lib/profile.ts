import type { Gender, Language, Mode, ShowMe, UserProfile } from "@minutematch/shared";

export const interests = ["Music", "Gaming", "Coding", "Anime", "Movies", "Fitness", "Fashion", "Books", "Study", "Startups", "Art", "Travel"];
export const genders: { label: string; value: Gender }[] = [
  { label: "Man", value: "man" },
  { label: "Woman", value: "woman" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not" }
];
export const showMeOptions: { label: string; value: ShowMe }[] = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Everyone", value: "everyone" }
];
export const languages: Language[] = ["Hinglish", "Hindi", "English"];
export const modes: { label: string; value: Mode; disabled?: boolean }[] = [
  { label: "Text", value: "text" },
  { label: "Audio coming soon", value: "audio", disabled: true },
  { label: "Video coming soon", value: "video", disabled: true }
];

export function makeProfile(input: Omit<UserProfile, "userId" | "createdAt" | "status" | "reportCount"> & { userId?: string }): UserProfile {
  return {
    ...input,
    userId: input.userId ?? crypto.randomUUID(),
    createdAt: Date.now(),
    status: "active",
    reportCount: 0
  };
}
