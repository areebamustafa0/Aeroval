"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { cx } from "@/lib/format";
import { Spinner } from "@/components/ui";

export default function NewsletterForm({ tone = "light", compact }: { tone?: "light" | "dark"; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Subscription failed.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  };

  if (state === "done")
    return (
      <div className={cx(
        "flex items-center gap-3 rounded-2xl border px-5 py-4",
        tone === "light" ? "border-gold-400/50 bg-white/10 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}>
        <CheckCircle2 size={20} className="shrink-0 text-gold-400" />
        <p className="text-sm font-semibold">Welcome aboard — beautiful journeys are headed to your inbox.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div className={cx(
        "flex items-center gap-2 rounded-full p-1.5",
        tone === "light" ? "bg-white/95 shadow-lg" : "border border-navy-900/15 bg-white",
        compact ? "" : "sm:max-w-md"
      )}>
        <label htmlFor={tone + "-newsletter"} className="sr-only">Email address</label>
        <input
          id={tone + "-newsletter"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full bg-transparent px-4 py-2 text-sm text-navy-900 outline-none placeholder:text-mist"
        />
        <button type="submit" disabled={state === "loading"} className="btn btn-gold btn-sm shrink-0">
          {state === "loading" ? <Spinner className="h-4 w-4" /> : <>Subscribe <Send size={13} /></>}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-rose-300">{error}</p>}
    </form>
  );
}