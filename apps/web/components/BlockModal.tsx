"use client";

import { Ban } from "lucide-react";
import { useState } from "react";
import { Button, GhostButton, ModalShell, Notice } from "./ui";

export function BlockModal({
  open,
  name,
  onClose,
  onConfirm
}: {
  open: boolean;
  name?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [blocking, setBlocking] = useState(false);

  if (!open) return null;

  return (
    <ModalShell title={`Block ${name ?? "user"}`} onClose={onClose}>
      <div className="mt-4 grid gap-4">
        <Notice tone="danger">
          <span className="inline-flex items-center gap-2 font-bold"><Ban className="h-4 w-4" /> You control every conversation.</span>
          <span className="mt-1 block text-white/70">Blocking removes active contact, hides any friendship, and prevents future rematches with this person.</span>
        </Notice>
        <div className="flex flex-wrap gap-2">
          <Button
            loading={blocking}
            className="bg-rose-300 text-ink hover:bg-rose-200"
            onClick={async () => {
              setBlocking(true);
              await onConfirm();
              setBlocking(false);
            }}
          >
            Confirm block
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </ModalShell>
  );
}
