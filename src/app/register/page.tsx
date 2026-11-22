import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/dashboard";
  return <RegisterForm next={next} />;
}