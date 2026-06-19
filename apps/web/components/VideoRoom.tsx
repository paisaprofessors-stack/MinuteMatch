import { Video } from "lucide-react";

export function VideoRoom({ mode }: { mode: "text" | "audio" | "video" }) {
  if (mode === "text") return null;
  return (
    <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Video className="h-4 w-4 text-neonBlue" />
        {mode === "video" ? "Video mode coming soon" : "Audio mode coming soon"}
      </div>
      <p className="mt-2 text-sm text-white/60">The app is prepared for future LiveKit integration, but this local MVP keeps conversations in text.</p>
    </div>
  );
}
