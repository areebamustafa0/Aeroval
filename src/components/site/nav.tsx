"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, LayoutDashboard, ShieldCheck, LogOut, UserRound, Search } from "lucide-react";
import { cx } from "@/lib/format";

type NavUser = { id: number; firstName: string; lastName: string; email: string; role: string } | null;

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/destinations", label: "Explore" },
  { href: "/flights", label: "Flights" },
  { href: "/deals", label: "Flight Deals" },
  { href: "/about", label: "About Us" },
];

export function BrandMark({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="h-[26px] w-[26px]" aria-hidden="true">
        <path d="M6 30 C14 26 20 20 24 10 C25 8 27 6 30 5 C28 12 26 16 23 20 C29 17 33 13 36 8 C35 16 30 23 22 27 C17 29.5 11 30.5 6 30 Z" fill="#D4BD93" />
        <path d="M8 33 C15 32.5 22 31 28 27.5 C24 32 17 34.5 10 34.5 Z" fill={dark ? "#0C1928" : "#E3D2AE"} opacity="0.85" />
      </svg>
      <span className={cx(
        "font-display text-[1.3rem] font-medium leading-none tracking-[0.14em]",
        dark ? "text-navy-900" : "text-white"
      )}>
        AEROV<span className="text-gold-300">É</span>L
      </span>
    </span>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [user, setUser] = useState<NavUser>(null);

  const loadUser = () => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => setUser(null));
  };

  useEffect(() => {
    loadUser();
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("aerovel-auth", loadUser);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("aerovel-auth", loadUser);
    };
  }, []);

  useEffect(() => { setOpen(false); setUserMenu(false); }, [pathname]);

  const solid = scrolled || open;
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("aerovel-auth"));
    router.push("/");
    router.refresh();
  };

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className={cx(
        "no-print fixed inset-x-0 top-0 z-[70] transition-all duration-700",
        solid
          ? "border-b border-white/[0.07] bg-navy-950/88 backdrop-blur-2xl"
          : "border-b border-transparent bg-gradient-to-b from-navy-950/62 to-transparent"
      )}>
        <div className="container-x flex h-[76px] items-center justify-between gap-4">
          <Link href="/" aria-label="AEROVÉL home"><BrandMark /></Link>

          <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Primary">
            {LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.label} href={l.href}
                  className={cx(
                    "group relative flex h-full items-center px-4 text-[12.5px] font-semibold tracking-[0.01em] transition-colors duration-300",
                    active ? "text-gold-200" : "text-white/80 hover:text-white"
                  )}
                >
                  <span>{l.label}</span>
                  <span className={cx("absolute inset-x-4 bottom-4 h-px bg-gold-400 transition-transform duration-300", active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/flights" aria-label="Search flights" className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
              <Search size={17} />
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/18 py-1.5 pl-1.5 pr-3 text-white transition hover:border-gold-400/50"
                  aria-expanded={userMenu}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-[10.5px] font-bold tracking-wide text-navy-900">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                  <span className="max-w-[88px] truncate text-[12.5px] font-medium">{user.firstName}</span>
                  <ChevronDown size={13} className={cx("text-white/50 transition", userMenu && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-navy-900/10 bg-white py-2 shadow-xl"
                    >
                      <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-navy-900 hover:bg-ivory">
                        <LayoutDashboard size={15} className="text-gold-600" /> My Dashboard
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-navy-900 hover:bg-ivory">
                          <ShieldCheck size={15} className="text-gold-600" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={signOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/signin" className="px-1 text-[12.5px] font-medium text-white/72 transition hover:text-gold-200">Sign In</Link>
                <Link href="/register" className="hidden px-1 text-[12.5px] font-medium text-white/72 transition hover:text-gold-200 xl:block">Create Account</Link>
              </>
            )}
            <span className="h-5 w-px bg-white/15" aria-hidden="true" />
            <Link href="/flights" className="btn btn-gold btn-sm">Book Your Flight</Link>
          </div>

          <button
            className="rounded-full p-2 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="no-print fixed inset-0 z-[65] bg-navy-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 flex h-full w-[84%] max-w-sm flex-col bg-navy-900 px-7 pb-8 pt-24"
              onClick={(e) => e.stopPropagation()}
              aria-label="Mobile"
            >
              {LINKS.map((l, i) => (
                <motion.div key={l.label} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={cx(
                    "block border-b border-white/8 py-4 font-display text-xl",
                    isActive(l.href) ? "text-gold-300" : "text-white"
                  )}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-auto space-y-3">
                {user ? (
                  <>
                    <Link href="/dashboard" className="btn btn-gold w-full"><UserRound size={15} /> {user.firstName}&apos;s Dashboard</Link>
                    {user.role === "admin" && <Link href="/admin" className="btn btn-ghost-light w-full"><ShieldCheck size={15} /> Admin Panel</Link>}
                    <button onClick={signOut} className="btn btn-ghost-light w-full"><LogOut size={15} /> Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-gold w-full">Create Account</Link>
                    <Link href="/signin" className="btn btn-ghost-light w-full">Sign In</Link>
                  </>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}