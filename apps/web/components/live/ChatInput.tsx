"use client";

import React, { KeyboardEvent } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isEnabled: boolean;
}

export function ChatInput({ value, onChange, onSend, isEnabled }: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-center h-12 rounded-full border border-dashed border-white/10 bg-white/[0.02] text-xs text-white/40 font-black select-none uppercase tracking-wider">
        Chat unlocks during live session
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center w-full">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={300}
          placeholder="Write a message..."
          className="w-full h-12 pr-10 pl-4 rounded-full border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/30 outline-none transition focus:border-neonBlue focus:ring-2 focus:ring-[#00f0ff]/10 focus:bg-white/[0.06]"
        />
        <Smile className="absolute right-3.5 top-3.5 h-5 w-5 text-white/40 cursor-pointer hover:text-white/70 transition" />
      </div>
      <Button
        onClick={onSend}
        disabled={!value.trim()}
        className="h-12 w-12 rounded-full p-0 flex items-center justify-center bg-gradient-to-r from-neonBlue to-neonPink text-white shrink-0 hover:brightness-105 active:scale-[0.98] transition-all border-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

