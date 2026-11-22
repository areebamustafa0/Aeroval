"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Alert, Field, Spinner } from "@/components/ui";
import { BrandMark } from "@/components/site/nav";
import { IMG } from "@/lib/images";
import { cx } from "@/lib/format";

function Shell({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={IMG.windowClouds} alt="Clouds seen from an aircraft window" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-navy-950/40" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <BrandMark />
          <p className="mt-6 max-w-md font-display text-3xl italic leading-snug text-white">
            “The world is yours. Make every journey extraordinary.”
          </p>
          <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.3em] text-gold-300">Members travel beautifully</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 pb-16 pt-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <p className="eyebrow text-gold-600">AEROVÉL account</p>
          <h1 className="mt-4 font-display text-3xl text-navy-900 md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-navy-900/55">{sub}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-[13.5px] text-navy-900/60">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}

const postAuth = (router: ReturnType<typeof useRouter>, next: string) => {
  window.dispatchEvent(new Event("aerovel-auth"));
  router.push(next.startsWith("/") ? next : "/dashboard");
  router.refresh();
};

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loginWith = async (emailValue: string, passwordValue: string) => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed.");
      postAuth(router, data.user?.role === "admin" && next === "/dashboard" ? "/admin" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void loginWith(email, password);
  };

  /** One-tap demo sign-in: fills the fields for transparency, then logs in. */
  const demoSignIn = (demoEmail: string, demoPassword: string) => {
    if (busy) return;
    setEmail(demoEmail);
    setPassword(demoPassword);
    void loginWith(demoEmail, demoPassword);
  };

  return (
    <Shell title="Welcome back." sub="Sign in to manage bookings, seats and beautiful e-tickets."
      footer={<>New to AEROVÉL? <Link href="/register" className="font-bold text-gold-600 hover:underline">Create an account</Link> · <Link href="/forgot-password" className="font-bold text-navy-900/70 hover:underline">Forgot password?</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email address">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </Field>
        <button type="submit" disabled={busy} className="btn btn-gold w-full">
          {busy ? <Spinner /> : <>Sign In <ArrowRight size={14} /></>}
        </button>
      </form>
      <div className="mt-6 rounded-2xl border border-dashed border-gold-500/50 bg-gold-400/8 p-4">
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-600"><Sparkles size={13} /> Demo accounts</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => demoSignIn("traveler@aerovel.demo", "FlyBeyond2025")}
            className="rounded-xl border border-navy-900/10 bg-white px-3 py-2.5 text-left text-[12px] transition hover:border-gold-500 disabled:opacity-50">
            <span className="block font-bold text-navy-900">Traveler {busy && "·"}</span>
            <span className="font-num block text-[10.5px] text-mist">traveler@aerovel.demo</span>
          </button>
          <button type="button" disabled={busy} onClick={() => demoSignIn("admin@aerovel.demo", "AdminBeyond2025")}
            className="rounded-xl border border-navy-900/10 bg-white px-3 py-2.5 text-left text-[12px] transition hover:border-gold-500 disabled:opacity-50">
            <span className="block font-bold text-navy-900">Administrator</span>
            <span className="font-num block text-[10.5px] text-mist">admin@aerovel.demo</span>
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-mist">
          {busy ? <><Spinner className="h-3 w-3" /> Signing you in…</> : "One tap signs you in — no typing needed."}
        </p>
      </div>
    </Shell>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.firstName.trim().length < 2) errs.firstName = "At least 2 characters.";
    if (form.lastName.trim().length < 2) errs.lastName = "At least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = "Enter a valid email.";
    if (form.password.length < 8) errs.password = "At least 8 characters.";
    if (form.confirm !== form.password) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setApiError(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed.");
      postAuth(router, next);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Registration failed.");
      setBusy(false);
    }
  };

  return (
    <Shell title="Begin your story." sub="One account for bookings, seats, tickets and saved destinations."
      footer={<>Already a member? <Link href="/signin" className="font-bold text-gold-600 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {apiError && <Alert tone="error">{apiError}</Alert>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" error={errors.firstName}>
            <input className={cx("input", errors.firstName && "input-error")} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Amara" />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input className={cx("input", errors.lastName && "input-error")} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Okafor" />
          </Field>
        </div>
        <Field label="Email address" error={errors.email}>
          <input className={cx("input", errors.email && "input-error")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className={cx("input", errors.password && "input-error")} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input className={cx("input", errors.confirm && "input-error")} type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
        </Field>
        <button type="submit" disabled={busy} className="btn btn-gold w-full">
          {busy ? <Spinner /> : <>Create Account <ArrowRight size={14} /></>}
        </button>
        <p className="flex items-center gap-2 text-[11.5px] text-mist"><ShieldCheck size={13} className="shrink-0 text-gold-600" /> Passwords are bcrypt-hashed; sessions use signed JWT cookies.</p>
      </form>
    </Shell>
  );
}

export function ForgotForm() {
  const [phase, setPhase] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setNote(data.note ?? "");
      if (data.demoToken) setToken(data.demoToken);
      setPhase("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally { setBusy(false); }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed.");
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally { setBusy(false); }
  };

  return (
    <Shell title="Reset your password." sub="Demo mode generates the reset code instantly — no email required."
      footer={<Link href="/signin" className="font-bold text-gold-600 hover:underline">Back to sign in</Link>}>
      {phase === "request" && (
        <form onSubmit={request} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Account email">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <button type="submit" disabled={busy} className="btn btn-gold w-full">{busy ? <Spinner /> : <>Generate reset code <KeyRound size={14} /></>}</button>
        </form>
      )}
      {phase === "reset" && (
        <form onSubmit={reset} className="space-y-4" noValidate>
          {note && <Alert tone="info">{note}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Reset code">
            <input className="input font-num" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste the code" />
          </Field>
          <Field label="New password">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" />
          </Field>
          <button type="submit" disabled={busy} className="btn btn-gold w-full">{busy ? <Spinner /> : <>Set new password <ArrowRight size={14} /></>}</button>
        </form>
      )}
      {phase === "done" && (
        <Alert tone="success">Password updated. <Link href="/signin" className="font-bold underline">Sign in</Link> with your new password.</Alert>
      )}
    </Shell>
  );
}