import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/auth-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign In" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/dashboard";
  return <SignInForm next={next} />;
}