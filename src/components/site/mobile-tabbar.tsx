"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Compass, Ticket, UserRound } from "lucide-react";
import { cx } from "@/lib/format";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/destinations", label: "Explore", icon: Compass },
  { href: "/flights", label: "Book", icon: Ticket },
  { href: "/dashboard", label: "Account", icon: UserRound },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/book/")) return null;
  return (
    <nav
      aria-label="App navigation"
      className="no-print fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-navy-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="grid grid-cols-4 px-1.5 pt-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className="relative flex flex-col items-center py-2">
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-x-1 inset-y-0 rounded-2xl bg-gold-400/14"
                />
              )}
              <span className={cx("relative z-10 flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition", active ? "text-gold-300" : "text-white/55")}>
                <t.icon size={19} strokeWidth={active ? 2.4 : 1.8} />
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-1" />
    </nav>
  );
}