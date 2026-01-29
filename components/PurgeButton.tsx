"use client";
import { Trash2 } from "lucide-react";

export function PurgeButton({ onPurge }: { onPurge: () => void }) {
  const handlePurge = async () => {
    if (confirm("Permanently wipe all logs?")) {
      const res = await fetch("/api/loot", { method: "DELETE" });
      if (res.ok) onPurge();
    }
  };

  return (
    <button
      onClick={handlePurge}
      className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 hover:text-red-500 transition-colors text-[10px] font-medium uppercase tracking-widest">
      <Trash2 className="w-3 h-3" />
      Wipe Data
    </button>
  );
}
