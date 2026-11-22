export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const money = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US");

export const CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  business: "Business",
};

export const CABIN_MULTIPLIER: Record<string, number> = {
  economy: 1,
  business: 2.6,
};

export const cabinPrice = (base: number, cabin: string) =>
  Math.round(base * (CABIN_MULTIPLIER[cabin] ?? 1));

export const fmtDur = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const fmtDateLong = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const isoDay = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

export const todayISO = () => isoDay(new Date());

export const STATUS_TONE: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  successful: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-violet-50 text-violet-700 border-violet-200",
  scheduled: "bg-sky-50 text-sky-700 border-sky-200",
  boarding: "bg-amber-50 text-amber-700 border-amber-200",
  departed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  arrived: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delayed: "bg-orange-50 text-orange-700 border-orange-200",
};