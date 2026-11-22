import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import AdminClient from "@/components/admin/admin-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/admin");
  if (user.role !== "admin") {
    return (
      <div className="container-x flex min-h-[70vh] items-center justify-center pt-24">
        <div className="card max-w-md p-10 text-center">
          <ShieldAlert size={32} className="mx-auto text-gold-600" />
          <h1 className="mt-4 font-display text-2xl text-navy-900">Administrators only</h1>
          <p className="mt-3 text-sm text-navy-900/60">
            Your account doesn&apos;t have admin access. Sign in with the demo administrator account to explore the panel.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/signin?next=/admin" className="btn btn-gold btn-sm">Switch account</Link>
            <Link href="/dashboard" className="btn btn-outline btn-sm">My dashboard</Link>
          </div>
        </div>
      </div>
    );
  }
  return <AdminClient name={user.firstName} />;
}