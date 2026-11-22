"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cx } from "@/lib/format";

export default function SaveButton({ destinationId, initialSaved = false, className }: {
  destinationId: number; initialSaved?: boolean; className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/destinations/${destinationId}/save`, { method: "POST" });
      if (res.status === 401) {
        router.push("/signin?next=/destinations");
        return;
      }
      const data = await res.json();
      if (res.ok) setSaved(Boolean(data.saved));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from saved destinations" : "Save destination"}
      aria-pressed={saved}
      className={cx(
        "flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition",
        saved ? "border-gold-400 bg-gold-400 text-navy-900" : "border-white/40 bg-navy-950/30 text-white hover:bg-navy-950/60",
        className
      )}
    >
      <Heart size={15} className={saved ? "fill-navy-900" : ""} />
    </button>
  );
}