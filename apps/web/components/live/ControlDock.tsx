"use client";

import React from "react";
import { Sparkles, X, Smile, User } from "lucide-react";
import { ControlButton } from "./ControlButton";

interface ControlDockProps {
  onStart: () => void;
  onEnd: () => void;
  onInterest: () => void;
  onIAm: () => void;
  isStartDisabled: boolean;
  isEndDisabled: boolean;
  isInterestDisabled: boolean;
  isIAmDisabled: boolean;
  activeInterestLabel: string;
  activeIAmLabel: string;
}

export function ControlDock({
  onStart,
  onEnd,
  onInterest,
  onIAm,
  isStartDisabled,
  isEndDisabled,
  isInterestDisabled,
  isIAmDisabled,
  activeInterestLabel,
  activeIAmLabel
}: ControlDockProps) {
  return (
    <div className="w-full h-full p-4 flex items-center justify-center bg-transparent">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl md:max-w-none">
        <ControlButton
          variant="start"
          icon={<Sparkles className="h-5 w-5" />}
          label="Start Match"
          onClick={onStart}
          disabled={isStartDisabled}
        />
        <ControlButton
          variant="end"
          icon={<X className="h-5 w-5" />}
          label="End"
          onClick={onEnd}
          disabled={isEndDisabled}
        />
        <ControlButton
          variant="filter"
          icon={<Smile className="h-5 w-5 text-neonBlue" />}
          label="Interest"
          sublabel={activeInterestLabel}
          onClick={onInterest}
          disabled={isInterestDisabled}
        />
        <ControlButton
          variant="filter"
          icon={<User className="h-5 w-5 text-neonPink" />}
          label="I Am"
          sublabel={activeIAmLabel}
          onClick={onIAm}
          disabled={isIAmDisabled}
        />
      </div>
    </div>
  );
}

