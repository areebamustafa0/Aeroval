"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Plane, Building2, Route as RouteIcon, Armchair, Ticket, Users,
  CreditCard, BarChart3, Settings, LogOut, Plus, Pencil, Trash2, Download, Check,
  XCircle, CheckCircle2, Globe, Grid3X3, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Alert, Field, Modal, Spinner, StatusBadge } from "@/components/ui";
import { BrandMark } from "@/components/site/nav";
import { cx, money, fmtDate, fmtTime, CABIN_LABEL } from "@/lib/format";

/* ---------- types ---------- */
type Dash = {
  stats: { totalFlights: number; totalBookings: number; customers: number; availableSeats: number; revenue: number; cancelled: number };
  daily: { label: string; bookings: number; revenue: number }[];
  cabins: { cabin: string; n: number }[];
  recent: { id: number; pnr: string; status: string; total: number; createdAt: string; cancelRequestedAt: string | null; user: string; email: string; flightNumber: string }[];
  popular: { route: string; n: number }[];
};
type AdminFlight = {
  id: number; flightNumber: string; status: string; departureAt: string; arrivalAt: string;
  basePrice: number; durationMinutes: number; stops: number; gate: string; terminal: string;
  airlineId: number; aircraftId: number; originId: number; destinationId: number;
  airline: string; aircraftName: string; origin: string; destination: string; booked: number;
};
type Refs = {
  airlines: { id: number; name: string; code: string }[];
  aircraft: { id: number; name: string; model: string }[];
  airports: { id: number; code: string; city: string }[];
};
type AdminBooking = {
  id: number; pnr: string; status: string; cabin: string; total: number; passengerCount: number;
  createdAt: string; cancelRequestedAt: string | null; flightId: number; customer: string; email: string;
  flightNumber: string; departureAt: string;
};
type AdminPax = {
  id: number; bookingId: number; firstName: string; lastName: string; email: string; phone: string;
  nationality: string; passportNumber: string; seatNumber: string; returnSeatNumber: string; dateOfBirth: string;
};
type AdminPayment = { id: number; bookingId: number; amount: number; method: string; status: string; cardLast4: string; reference: string; createdAt: string };
type Reports = {
  daily: { day: string; bookings: number; revenue: number; cancelled: number }[];
  occupancy: { id: number; flightNumber: string; route: string; departureAt: string; capacity: number; taken: number }[];
  popular: { route: string; label: string; bookings: number; revenue: number }[];
  payments: { id: number; amount: number; method: string; status: string; reference: string; cardLast4: string; createdAt: string; pnr: string; customer: string }[];
};
type SeatRow = { id: number; seatNumber: string; row: number; letter: string; cabinClass: string; isExit: boolean; isPremium: boolean; extraPrice: number; status: string };
type EntityRow = Record<string, unknown> & { id: number };

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
  return data as T;
};

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const downloadCsv = (name: string, rows: Record<string, unknown>[]) => {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const TH = ({ children }: { children?: React.ReactNode }) => (
  <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-mist">{children}</th>
);
const TD = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cx("whitespace-nowrap px-4 py-3 text-[13px] text-navy-900/80", className)}>{children}</td>
);

function useTabData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(url));
  const reload = useCallback(() => {
    if (!url) return;
    setLoading(true); setError("");
    api<T>(url).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Failed to load.")).finally(() => setLoading(false));
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}

const Loader = () => <div className="flex justify-center py-16"><Spinner className="h-6 w-6 text-gold-600" /></div>;

/* ---------- dashboard ---------- */
function DashboardTab() {
  const { data, error, loading } = useTabData<Dash>("/api/admin/dashboard");
  if (loading) return <Loader />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return null;
  const s = data.stats;
  const cards = [
    { label: "Total flights", value: String(s.totalFlights), icon: Plane },
    { label: "Total bookings", value: String(s.totalBookings), icon: Ticket },
    { label: "Customers", value: String(s.customers), icon: Users },
    { label: "Available seats", value: s.availableSeats.toLocaleString(), icon: Armchair },
    { label: "Demo revenue", value: money(s.revenue), icon: CreditCard },
    { label: "Cancelled", value: String(s.cancelled), icon: XCircle },
  ];
  const pie = data.cabins.map((c) => ({ name: CABIN_LABEL[c.cabin] ?? c.cabin, value: c.n }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <c.icon size={17} className="text-gold-600" />
            <p className="font-num mt-2.5 text-xl font-bold text-navy-900">{c.value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Revenue · last 14 days</h3>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9AC6E" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#C9AC6E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#101D3212" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#929AA6" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#929AA6" }} width={46} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #101D3215", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#B3924F" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Bookings per day</h3>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#101D3212" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#929AA6" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#929AA6" }} width={30} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #101D3215", fontSize: 12 }} />
                <Bar dataKey="bookings" fill="#162A43" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="card overflow-x-auto">
          <h3 className="px-5 pt-5 text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Recent reservations</h3>
          <table className="mt-3 w-full">
            <thead><tr className="border-b border-navy-900/8"><TH>PNR</TH><TH>Customer</TH><TH>Flight</TH><TH>Status</TH><TH>Total</TH><TH>Booked</TH></tr></thead>
            <tbody>
              {data.recent.map((r) => (
                <tr key={r.id} className="border-b border-navy-900/5 last:border-0">
                  <TD className="font-num font-bold">{r.pnr}</TD>
                  <TD>{r.user}<span className="block text-[11px] text-mist">{r.email}</span></TD>
                  <TD className="font-num">{r.flightNumber}</TD>
                  <TD><StatusBadge status={r.status} /></TD>
                  <TD className="font-num font-bold">{money(r.total)}</TD>
                  <TD className="text-mist">{fmtDate(r.createdAt)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Cabin mix</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {pie.map((_, i) => <Cell key={i} fill={i === 0 ? "#162A43" : "#D9C18D"} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Popular routes</h3>
            <ul className="mt-3 space-y-2.5">
              {data.popular.map((p) => (
                <li key={p.route} className="flex items-center justify-between text-[13px]">
                  <span className="font-num font-bold text-navy-900">{p.route}</span>
                  <span className="rounded-full bg-ivory px-2.5 py-0.5 text-[11px] font-bold text-navy-900/60">{p.n} bookings</span>
                </li>
              ))}
              {data.popular.length === 0 && <li className="text-sm text-mist">No bookings yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- flights ---------- */
function FlightsTab({ notify }: { notify: (t: "success" | "error", m: string) => void }) {
  const { data, error, loading, reload } = useTabData<{ flights: AdminFlight[] } & Refs>("/api/admin/flights");
  const [editing, setEditing] = useState<AdminFlight | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminFlight | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const openForm = (f: AdminFlight | "new") => {
    setEditing(f);
    if (f === "new") {
      const dep = new Date(Date.now() + 7 * 864e5); dep.setHours(9, 0, 0, 0);
      const arr = new Date(dep.getTime() + 4 * 36e5);
      setForm({
        flightNumber: "AV" + Math.floor(100 + Math.random() * 800),
        airlineId: String(data?.airlines[0]?.id ?? ""), aircraftId: String(data?.aircraft[0]?.id ?? ""),
        originId: String(data?.airports[0]?.id ?? ""), destinationId: String(data?.airports[1]?.id ?? ""),
        departureAt: toLocalInput(dep.toISOString()), arrivalAt: toLocalInput(arr.toISOString()),
        basePrice: "399", stops: "0", gate: "A1", terminal: "1",
      });
    } else {
      setForm({
        aircraftId: String(f.aircraftId), departureAt: toLocalInput(f.departureAt), arrivalAt: toLocalInput(f.arrivalAt),
        basePrice: String(f.basePrice), stops: String(f.stops), gate: f.gate, terminal: f.terminal,
      });
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        aircraftId: Number(form.aircraftId), basePrice: Number(form.basePrice), stops: Number(form.stops),
        gate: form.gate, terminal: form.terminal,
        departureAt: new Date(form.departureAt ?? "").toISOString(),
        arrivalAt: new Date(form.arrivalAt ?? "").toISOString(),
      };
      if (editing === "new") {
        Object.assign(body, {
          flightNumber: form.flightNumber, airlineId: Number(form.airlineId),
          originId: Number(form.originId), destinationId: Number(form.destinationId),
        });
        await api("/api/admin/flights", jsonInit("POST", body));
        notify("success", "Flight created with a full seat map.");
      } else if (editing) {
        await api(`/api/admin/flights/${editing.id}`, jsonInit("PUT", body));
        notify("success", "Flight updated.");
      }
      setEditing(null); reload();
    } catch (e) { notify("error", e instanceof Error ? e.message : "Save failed."); }
    finally { setBusy(false); }
  };

  const setStatus = async (f: AdminFlight, status: string) => {
    try {
      await api(`/api/admin/flights/${f.id}`, jsonInit("PUT", { status }));
      notify("success", `${f.flightNumber} is now ${status}.`);
      reload();
    } catch (e) { notify("error", e instanceof Error ? e.message : "Update failed."); }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/flights/${deleting.id}`, { method: "DELETE" });
      notify("success", "Flight deleted.");
      setDeleting(null); reload();
    } catch (e) { notify("error", e instanceof Error ? e.message : "Delete failed."); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return null;

  const sel = (key: string, opts: { id: number; label: string }[], disabled?: boolean) => (
    <select className="input" value={form[key] ?? ""} disabled={disabled} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mist">{data.flights.length} flights · newest departures first</p>
        <button onClick={() => openForm("new")} className="btn btn-gold btn-sm"><Plus size={13} /> Create flight</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-navy-900/8"><TH>Flight</TH><TH>Route</TH><TH>Departure</TH><TH>Arrival</TH><TH>Aircraft</TH><TH>Fare</TH><TH>Booked</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
          <tbody>
            {data.flights.map((f) => (
              <tr key={f.id} className="border-b border-navy-900/5 last:border-0 hover:bg-ivory/50">
                <TD className="font-num font-bold">{f.flightNumber}<span className="block text-[11px] font-normal text-mist">{f.airline}</span></TD>
                <TD className="font-num font-bold">{f.origin} → {f.destination}</TD>
                <TD>{fmtDate(f.departureAt)}<span className="font-num block text-[11px] text-mist">{fmtTime(f.departureAt)}</span></TD>
                <TD>{fmtDate(f.arrivalAt)}<span className="font-num block text-[11px] text-mist">{fmtTime(f.arrivalAt)}</span></TD>
                <TD>{f.aircraftName}</TD>
                <TD className="font-num font-bold">{money(f.basePrice)}</TD>
                <TD className="font-num">{f.booked}</TD>
                <TD>
                  <select value={f.status} onChange={(e) => setStatus(f, e.target.value)} aria-label={`Status for ${f.flightNumber}`}
                    className="rounded-lg border border-navy-900/15 bg-white px-2 py-1 text-[11.5px] font-bold text-navy-900">
                    {["scheduled", "boarding", "departed", "arrived", "delayed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </TD>
                <TD>
                  <span className="flex gap-1.5">
                    <button onClick={() => openForm(f)} aria-label={`Edit ${f.flightNumber}`} className="rounded-lg border border-navy-900/12 p-1.5 text-navy-900/60 hover:border-gold-500 hover:text-navy-900"><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(f)} aria-label={`Delete ${f.flightNumber}`} className="rounded-lg border border-navy-900/12 p-1.5 text-rose-500 hover:border-rose-300"><Trash2 size={13} /></button>
                  </span>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Create a flight" : "Edit flight"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          {editing === "new" && (
            <>
              <Field label="Flight number"><input className="input font-num" value={form.flightNumber ?? ""} onChange={(e) => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })} /></Field>
              <Field label="Airline">{sel("airlineId", data.airlines.map((a) => ({ id: a.id, label: `${a.name} (${a.code})` })))}</Field>
              <Field label="Origin">{sel("originId", data.airports.map((a) => ({ id: a.id, label: `${a.city} (${a.code})` })))}</Field>
              <Field label="Destination">{sel("destinationId", data.airports.map((a) => ({ id: a.id, label: `${a.city} (${a.code})` })))}</Field>
            </>
          )}
          <Field label="Aircraft">{sel("aircraftId", data.aircraft.map((a) => ({ id: a.id, label: `${a.name} · ${a.model}` })))}</Field>
          <Field label="Base fare (USD)"><input className="input font-num" type="number" min={50} value={form.basePrice ?? ""} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></Field>
          <Field label="Departure"><input className="input font-num" type="datetime-local" value={form.departureAt ?? ""} onChange={(e) => setForm({ ...form, departureAt: e.target.value })} /></Field>
          <Field label="Arrival"><input className="input font-num" type="datetime-local" value={form.arrivalAt ?? ""} onChange={(e) => setForm({ ...form, arrivalAt: e.target.value })} /></Field>
          <Field label="Stops"><input className="input font-num" type="number" min={0} max={2} value={form.stops ?? "0"} onChange={(e) => setForm({ ...form, stops: e.target.value })} /></Field>
          <Field label="Gate"><input className="input" value={form.gate ?? ""} onChange={(e) => setForm({ ...form, gate: e.target.value })} /></Field>
          <Field label="Terminal"><input className="input" value={form.terminal ?? ""} onChange={(e) => setForm({ ...form, terminal: e.target.value })} /></Field>
        </div>
        <p className="mt-3 text-[11.5px] text-mist">Creating a flight automatically generates its full seat map from the aircraft configuration.</p>
        <button onClick={save} disabled={busy} className="btn btn-gold mt-5 w-full">{busy ? <Spinner /> : editing === "new" ? "Create flight" : "Save changes"}</button>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete flight?">
        <p className="text-sm text-navy-900/70">
          {deleting?.flightNumber} · {deleting?.origin} → {deleting?.destination}. Flights with booking history are protected — cancel them instead.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setDeleting(null)} className="btn btn-outline flex-1">Keep</button>
          <button onClick={doDelete} disabled={busy} className="btn btn-navy flex-1 bg-rose-600 hover:bg-rose-500">{busy ? <Spinner /> : "Delete"}</button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- generic entities ---------- */
type EntityKind = "airports" | "airlines" | "aircraft" | "routes";
const ENTITY_FIELDS: Record<EntityKind, { key: string; label: string; type: "text" | "number" | "airport"; lockOnEdit?: boolean }[]> = {
  airports: [
    { key: "code", label: "IATA code", type: "text", lockOnEdit: true },
    { key: "name", label: "Airport name", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "country", label: "Country", type: "text" },
    { key: "timezone", label: "Timezone", type: "text" },
  ],
  airlines: [
    { key: "code", label: "Code", type: "text", lockOnEdit: true },
    { key: "name", label: "Airline name", type: "text" },
    { key: "accent", label: "Brand color (hex)", type: "text" },
  ],
  aircraft: [
    { key: "name", label: "Display name", type: "text" },
    { key: "model", label: "Model", type: "text" },
    { key: "manufacturer", label: "Manufacturer", type: "text" },
    { key: "businessRows", label: "Business rows (2–2)", type: "number" },
    { key: "economyRows", label: "Economy rows (3–3)", type: "number" },
    { key: "cruiseSpeedKmh", label: "Cruise speed km/h", type: "number" },
    { key: "rangeKm", label: "Range km", type: "number" },
  ],
  routes: [
    { key: "originId", label: "Origin airport", type: "airport" },
    { key: "destinationId", label: "Destination airport", type: "airport" },
    { key: "distanceKm", label: "Distance km", type: "number" },
  ],
};

function EntityTab({ kind, notify }: { kind: EntityKind; notify: (t: "success" | "error", m: string) => void }) {
  const { data, error, loading, reload } = useTabData<{ rows: EntityRow[] }>(`/api/admin/entities/${kind}`);
  const airports = useTabData<{ rows: EntityRow[] }>(kind === "routes" ? "/api/admin/entities/airports" : null);
  const [editing, setEditing] = useState<EntityRow | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<EntityRow | null>(null);

  const open = (row: EntityRow | "new") => {
    setEditing(row);
    const f: Record<string, string> = {};
    for (const field of ENTITY_FIELDS[kind]) {
      f[field.key] = row === "new" ? (field.type === "number" ? "0" : "") : String(row[field.key] ?? "");
    }
    if (row === "new" && kind === "aircraft") { f.businessRows = "3"; f.economyRows = "24"; f.cruiseSpeedKmh = "870"; f.rangeKm = "6500"; }
    if (row === "new" && kind === "routes") { f.distanceKm = "1500"; f.originId = String(airports.data?.rows[0]?.id ?? ""); f.destinationId = String(airports.data?.rows[1]?.id ?? ""); }
    if (row === "new" && kind === "airlines") f.accent = "#D9C18D";
    if (row === "new" && kind === "airports") f.timezone = "UTC";
    setForm(f);
  };

  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const field of ENTITY_FIELDS[kind]) {
        if (editing !== "new" && field.lockOnEdit) continue;
        body[field.key] = field.type === "number" || field.type === "airport" ? Number(form[field.key]) : form[field.key];
      }
      if (editing === "new") await api(`/api/admin/entities/${kind}`, jsonInit("POST", body));
      else if (editing) await api(`/api/admin/entities/${kind}/${editing.id}`, jsonInit("PUT", body));
      notify("success", "Saved.");
      setEditing(null); reload();
    } catch (e) { notify("error", e instanceof Error ? e.message : "Save failed."); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/entities/${kind}/${deleting.id}`, { method: "DELETE" });
      notify("success", "Deleted.");
      setDeleting(null); reload();
    } catch (e) { notify("error", e instanceof Error ? e.message : "Delete failed."); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader />;
  if (error) return <Alert tone="error">{error}</Alert>;
  const rows = data?.rows ?? [];
  const airportLabel = (id: unknown) => {
    const a = airports.data?.rows.find((x) => x.id === Number(id));
    return a ? `${a.city} (${a.code})` : String(id);
  };
  const cols = ENTITY_FIELDS[kind].filter((f) => !(kind === "airports" && f.key === "code"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mist">{rows.length} records</p>
        <button onClick={() => open("new")} className="btn btn-gold btn-sm"><Plus size={13} /> Add {kind.slice(0, -1)}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-900/8">
              {kind === "airports" && <TH>Code</TH>}
              {cols.map((c) => <TH key={c.key}>{c.label}</TH>)}
              {kind === "aircraft" && <TH>Seats</TH>}
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-navy-900/5 last:border-0 hover:bg-ivory/50">
                {kind === "airports" && <TD className="font-num font-bold">{String(r.code)}</TD>}
                {cols.map((c) => (
                  <TD key={c.key} className={c.type === "number" ? "font-num" : ""}>
                    {c.type === "airport" ? airportLabel(r[c.key]) : c.key === "accent" ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border border-navy-900/15" style={{ background: String(r[c.key]) }} />{String(r[c.key])}</span>
                    ) : String(r[c.key] ?? "")}
                  </TD>
                ))}
                {kind === "aircraft" && <TD className="font-num">{Number(r.businessRows) * 4 + Number(r.economyRows) * 6}</TD>}
                <TD>
                  <span className="flex gap-1.5">
                    <button onClick={() => open(r)} aria-label="Edit record" className="rounded-lg border border-navy-900/12 p-1.5 text-navy-900/60 hover:border-gold-500"><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(r)} aria-label="Delete record" className="rounded-lg border border-navy-900/12 p-1.5 text-rose-500 hover:border-rose-300"><Trash2 size={13} /></button>
                  </span>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? `Add ${kind.slice(0, -1)}` : `Edit ${kind.slice(0, -1)}`} wide={kind === "aircraft"}>
        <div className="grid gap-4 sm:grid-cols-2">
          {ENTITY_FIELDS[kind].map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "airport" ? (
                <select className="input" value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  {(airports.data?.rows ?? []).map((a) => <option key={a.id} value={a.id}>{String(a.city)} ({String(a.code)})</option>)}
                </select>
              ) : (
                <input className="input" type={f.type === "number" ? "number" : "text"} disabled={editing !== "new" && f.lockOnEdit}
                  value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </Field>
          ))}
        </div>
        {kind === "aircraft" && <p className="mt-3 text-[11.5px] text-mist">Changing row counts rebuilds the seat configuration — blocked while flights use this aircraft.</p>}
        <button onClick={save} disabled={busy} className="btn btn-gold mt-5 w-full">{busy ? <Spinner /> : "Save"}</button>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete record?">
        <p className="text-sm text-navy-900/70">Records referenced by flights are protected and cannot be deleted.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setDeleting(null)} className="btn btn-outline flex-1">Keep</button>
          <button onClick={doDelete} disabled={busy} className="btn btn-navy flex-1 bg-rose-600 hover:bg-rose-500">{busy ? <Spinner /> : "Delete"}</button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- seats ---------- */
function SeatsTab({ notify }: { notify: (t: "success" | "error", m: string) => void }) {
  const flights = useTabData<{ flights: AdminFlight[] }>("/api/admin/flights");
  const [flightId, setFlightId] = useState<number | null>(null);
  const [seats, setSeats] = useState<SeatRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async (id: number) => {
    setFlightId(id); setSelected([]); setLoading(true);
    try {
      const d = await api<{ seats: SeatRow[] }>(`/api/admin/seats?flightId=${id}`);
      setSeats(d.seats);
    } catch (e) { notify("error", e instanceof Error ? e.message : "Failed to load seats."); }
    finally { setLoading(false); }
  };

  const setStatus = async (status: "available" | "blocked") => {
    if (!flightId || selected.length === 0) return;
    setBusy(true);
    try {
      await api("/api/admin/seats", jsonInit("POST", { flightId, seatIds: selected, status }));
      notify("success", `${selected.length} seats ${status === "blocked" ? "blocked" : "released"}.`);
      setSelected([]);
      await load(flightId);
    } catch (e) { notify("error", e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  };

  const toggle = (s: SeatRow) => {
    if (!["available", "blocked"].includes(s.status)) return;
    setSelected((cur) => cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]);
  };

  const tone = (s: SeatRow) =>
    selected.includes(s.id) ? "bg-navy-900 text-gold-300 border-navy-900" :
    s.status === "occupied" || s.status === "reserved" ? "bg-navy-800/80 text-white border-navy-800" :
    s.status === "blocked" ? "bg-rose-100 text-rose-400 border-rose-200" :
    s.isPremium ? "bg-gold-400/25 text-navy-900 border-gold-500/60" : "bg-white text-navy-900/70 border-navy-900/15";

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-4 p-5">
        <Field label="Choose flight">
          <select className="input min-w-64" value={flightId ?? ""} onChange={(e) => load(Number(e.target.value))}>
            <option value="" disabled>Select a flight…</option>
            {(flights.data?.flights ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.flightNumber} · {f.origin}→{f.destination} · {fmtDate(f.departureAt)}</option>
            ))}
          </select>
        </Field>
        <button onClick={() => setStatus("blocked")} disabled={busy || selected.length === 0} className="btn btn-navy btn-sm mb-0.5"><XCircle size={13} /> Block {selected.length || ""}</button>
        <button onClick={() => setStatus("available")} disabled={busy || selected.length === 0} className="btn btn-outline btn-sm mb-0.5"><CheckCircle2 size={13} /> Release</button>
        <p className="ml-auto text-[11.5px] text-mist">Tap free/blocked seats to select. Sold seats are locked by the booking engine.</p>
      </div>
      {loading && <Loader />}
      {!loading && seats.length > 0 && (
        <div className="card overflow-x-auto p-6">
          <div className="flex flex-wrap gap-1.5">
            {seats.map((s) => (
              <button key={s.id} onClick={() => toggle(s)} title={`${s.seatNumber} · ${s.status}`}
                className={cx("font-num h-8 w-10 rounded-md border text-[9.5px] font-bold transition", tone(s))}>
                {s.seatNumber}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-semibold text-navy-900/60">
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-navy-900/20 bg-white" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-gold-500/60 bg-gold-400/25" /> Premium</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-navy-800/80" /> Sold / reserved</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-rose-200 bg-rose-100" /> Blocked</span>
          </div>
        </div>
      )}
      {!loading && flightId && seats.length === 0 && <Alert tone="info">This flight has no seat map yet.</Alert>}
    </div>
  );
}

/* ---------- bookings / passengers / payments ---------- */
function BookingsTab({ notify, view }: { notify: (t: "success" | "error", m: string) => void; view: "bookings" | "passengers" }) {
  const { data, error, loading, reload } = useTabData<{ bookings: AdminBooking[]; passengers: AdminPax[]; payments: AdminPayment[] }>("/api/admin/bookings");
  const [busyId, setBusyId] = useState<number | null>(null);

  const act = async (id: number, action: "confirm" | "complete" | "approve-cancel") => {
    setBusyId(id);
    try {
      const d = await api<{ message: string }>("/api/admin/bookings", jsonInit("PATCH", { id, action }));
      notify("success", d.message);
      reload();
    } catch (e) { notify("error", e instanceof Error ? e.message : "Action failed."); }
    finally { setBusyId(null); }
  };

  if (loading) return <Loader />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return null;

  if (view === "passengers") {
    const pnrById = new Map(data.bookings.map((b) => [b.id, b.pnr]));
    return (
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-navy-900/8"><TH>Passenger</TH><TH>Booking</TH><TH>Seat(s)</TH><TH>Nationality</TH><TH>Passport</TH><TH>DOB</TH><TH>Contact</TH></tr></thead>
          <tbody>
            {data.passengers.map((p) => (
              <tr key={p.id} className="border-b border-navy-900/5 last:border-0">
                <TD className="font-bold uppercase">{p.lastName}/{p.firstName}</TD>
                <TD className="font-num">{pnrById.get(p.bookingId) ?? p.bookingId}</TD>
                <TD className="font-num font-bold">{p.seatNumber}{p.returnSeatNumber ? ` / ${p.returnSeatNumber}` : ""}</TD>
                <TD>{p.nationality}</TD>
                <TD className="font-num">{p.passportNumber}</TD>
                <TD className="font-num">{p.dateOfBirth}</TD>
                <TD className="text-mist">{p.email || p.phone || "—"}</TD>
              </tr>
            ))}
            {data.passengers.length === 0 && <tr><TD className="text-mist">No passengers yet.</TD></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-navy-900/8"><TH>PNR</TH><TH>Customer</TH><TH>Flight</TH><TH>Cabin</TH><TH>Pax</TH><TH>Total</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
        <tbody>
          {data.bookings.map((b) => (
            <tr key={b.id} className={cx("border-b border-navy-900/5 last:border-0", b.cancelRequestedAt && "bg-amber-50/60")}>
              <TD className="font-num font-bold">{b.pnr}</TD>
              <TD>{b.customer}<span className="block text-[11px] text-mist">{b.email}</span></TD>
              <TD className="font-num">{b.flightNumber}<span className="block text-[11px] text-mist">{fmtDate(b.departureAt)}</span></TD>
              <TD>{CABIN_LABEL[b.cabin] ?? b.cabin}</TD>
              <TD className="font-num">{b.passengerCount}</TD>
              <TD className="font-num font-bold">{money(b.total)}</TD>
              <TD>
                <StatusBadge status={b.status} />
                {b.cancelRequestedAt && <span className="mt-1 block text-[10px] font-bold text-amber-600">cancel requested</span>}
              </TD>
              <TD>
                <span className="flex gap-1.5">
                  {busyId === b.id ? <Spinner className="h-4 w-4" /> : (
                    <>
                      {b.status === "pending" && (
                        <button onClick={() => act(b.id, "confirm")} className="btn btn-outline btn-sm" title="Confirm manually"><Check size={12} /> Confirm</button>
                      )}
                      {b.status === "confirmed" && !b.cancelRequestedAt && (
                        <button onClick={() => act(b.id, "complete")} className="btn btn-outline btn-sm" title="Mark completed"><CheckCircle2 size={12} /> Complete</button>
                      )}
                      {(b.cancelRequestedAt || ["pending", "confirmed"].includes(b.status)) && (
                        <button onClick={() => act(b.id, "approve-cancel")} className="btn btn-outline btn-sm text-rose-600" title="Cancel & refund"><XCircle size={12} /> {b.cancelRequestedAt ? "Approve cancel" : "Cancel"}</button>
                      )}
                    </>
                  )}
                </span>
              </TD>
            </tr>
          ))}
          {data.bookings.length === 0 && <tr><TD className="text-mist">No bookings yet.</TD></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- reports ---------- */
function ReportsTab() {
  const { data, error, loading } = useTabData<Reports>("/api/admin/reports");
  if (loading) return <Loader />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Daily report · 30 days</h3>
            <button onClick={() => downloadCsv("aerovel-daily-report.csv", data.daily)} className="btn btn-outline btn-sm"><Download size={12} /> CSV</button>
          </div>
          <table className="mt-3 w-full">
            <thead><tr className="border-b border-navy-900/8"><TH>Day</TH><TH>Bookings</TH><TH>Revenue</TH><TH>Cancelled</TH></tr></thead>
            <tbody>
              {data.daily.slice(-14).map((d) => (
                <tr key={d.day} className="border-b border-navy-900/5 last:border-0">
                  <TD className="font-num">{d.day}</TD><TD className="font-num">{d.bookings}</TD>
                  <TD className="font-num font-bold">{money(d.revenue)}</TD><TD className="font-num">{d.cancelled}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Flight occupancy</h3>
            <button onClick={() => downloadCsv("aerovel-occupancy.csv", data.occupancy)} className="btn btn-outline btn-sm"><Download size={12} /> CSV</button>
          </div>
          <div className="mt-4 space-y-3 px-5 pb-5">
            {data.occupancy.slice(0, 12).map((o) => {
              const pct = o.capacity ? Math.round((o.taken / o.capacity) * 100) : 0;
              return (
                <div key={o.id}>
                  <div className="flex justify-between text-[12px]">
                    <span className="font-num font-bold text-navy-900">{o.flightNumber} · {o.route}</span>
                    <span className="font-num text-mist">{o.taken}/{o.capacity} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ivory">
                    <div className="h-full rounded-full bg-gradient-to-r from-navy-800 to-gold-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <h3 className="px-5 pt-5 text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Payment records</h3>
        <table className="mt-3 w-full">
          <thead><tr className="border-b border-navy-900/8"><TH>Reference</TH><TH>PNR</TH><TH>Customer</TH><TH>Method</TH><TH>Amount</TH><TH>Status</TH><TH>Date</TH></tr></thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id} className="border-b border-navy-900/5 last:border-0">
                <TD className="font-num">{p.reference}</TD>
                <TD className="font-num font-bold">{p.pnr}</TD>
                <TD className="text-mist">{p.customer}</TD>
                <TD>{p.method}{p.cardLast4 && <span className="font-num text-mist"> •••• {p.cardLast4}</span>}</TD>
                <TD className="font-num font-bold">{money(p.amount)}</TD>
                <TD><StatusBadge status={p.status} /></TD>
                <TD className="text-mist">{fmtDate(p.createdAt)}</TD>
              </tr>
            ))}
            {data.payments.length === 0 && <tr><TD className="text-mist">No payments recorded yet.</TD></tr>}
          </tbody>
        </table>
      </div>
      <div className="card p-5">
        <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-navy-900/70">Top routes by revenue</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.popular.map((p) => (
            <div key={p.route} className="rounded-xl border border-navy-900/8 bg-ivory/60 p-4">
              <p className="font-num text-[14px] font-bold text-navy-900">{p.route}</p>
              <p className="text-[11.5px] text-mist">{p.label}</p>
              <p className="mt-2 text-[12px] text-navy-900/70">{p.bookings} bookings · <span className="font-num font-bold">{money(p.revenue)}</span></p>
            </div>
          ))}
          {data.popular.length === 0 && <p className="text-sm text-mist">Confirmed bookings will populate this report.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- settings ---------- */
function SettingsTab({ notify }: { notify: (t: "success" | "error", m: string) => void }) {
  const { data, error, loading } = useTabData<{ settings: Record<string, string> }>("/api/admin/settings");
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const current = form ?? data?.settings ?? null;

  const save = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await api("/api/admin/settings", jsonInit("POST", current));
      notify("success", "Platform settings saved.");
    } catch (e) { notify("error", e instanceof Error ? e.message : "Save failed."); }
    finally { setBusy(false); }
  };

  if (loading || !current) return error ? <Alert tone="error">{error}</Alert> : <Loader />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h3 className="font-display text-lg text-navy-900">Support & contact</h3>
        <Field label="Support email"><input className="input" value={current.supportEmail ?? ""} onChange={(e) => setForm({ ...current, supportEmail: e.target.value })} /></Field>
        <Field label="Support phone"><input className="input" value={current.supportPhone ?? ""} onChange={(e) => setForm({ ...current, supportPhone: e.target.value })} /></Field>
        <Field label="Address"><input className="input" value={current.address ?? ""} onChange={(e) => setForm({ ...current, address: e.target.value })} /></Field>
        <Field label="Platform notice"><textarea className="input min-h-20" value={current.notice ?? ""} onChange={(e) => setForm({ ...current, notice: e.target.value })} /></Field>
        <button onClick={save} disabled={busy} className="btn btn-gold w-full">{busy ? <Spinner /> : "Save settings"}</button>
      </div>
      <div className="card h-fit p-6">
        <h3 className="font-display text-lg text-navy-900">Platform status</h3>
        <ul className="mt-4 space-y-3 text-[13px] text-navy-900/70">
          <li className="flex items-center gap-2.5"><CheckCircle2 size={15} className="text-emerald-500" /> PostgreSQL · transactional seat locking active</li>
          <li className="flex items-center gap-2.5"><CheckCircle2 size={15} className="text-emerald-500" /> JWT auth · bcrypt hashing · role-based access</li>
          <li className="flex items-center gap-2.5"><CheckCircle2 size={15} className="text-emerald-500" /> Sandbox payments · no real charges, no card storage</li>
          <li className="flex items-center gap-2.5"><CheckCircle2 size={15} className="text-emerald-500" /> PWA · offline fallback, never fakes availability</li>
          <li className="flex items-start gap-2.5"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" /> All inventory is fictional demo data, clearly labeled across the platform.</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */
type TabKey = "dashboard" | "flights" | "airports" | "routes" | "aircraft" | "seats" | "bookings" | "passengers" | "payments" | "reports" | "settings";

const NAV: { key: TabKey; label: string; icon: typeof Plane }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "flights", label: "Flights", icon: Plane },
  { key: "airports", label: "Airports", icon: Building2 },
  { key: "routes", label: "Routes", icon: RouteIcon },
  { key: "aircraft", label: "Aircraft", icon: Armchair },
  { key: "seats", label: "Seat Management", icon: Grid3X3 },
  { key: "bookings", label: "Bookings", icon: Ticket },
  { key: "passengers", label: "Passengers", icon: Users },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function AdminClient({ name }: { name: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [toast, setToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const notify = useCallback((tone: "success" | "error", text: string) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("aerovel-auth"));
    router.push("/");
    router.refresh();
  };

  const active = NAV.find((n) => n.key === tab)!;

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-navy-950 lg:flex">
        <div className="px-6 py-6"><Link href="/"><BrandMark /></Link>
          <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-gold-400">Administration</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Admin">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setTab(n.key)} aria-current={tab === n.key ? "page" : undefined}
              className={cx("flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition",
                tab === n.key ? "bg-gold-400 text-navy-900" : "text-white/60 hover:bg-white/8 hover:text-white")}>
              <n.icon size={15} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-white/60 hover:bg-white/8 hover:text-white"><Globe size={15} /> View website</Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-rose-300 hover:bg-rose-500/10"><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-navy-900/8 bg-white/90 backdrop-blur-lg">
          <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-gold-600">AEROVÉL Admin</p>
              <h1 className="font-display text-xl text-navy-900">{active.label}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[13px] font-semibold text-navy-900/60 sm:block">{name} · Administrator</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-[12px] font-bold text-gold-300">{name[0]}</span>
              <button onClick={signOut} className="rounded-full border border-navy-900/15 p-2 text-navy-900/60 hover:text-rose-500 lg:hidden" aria-label="Sign out"><LogOut size={15} /></button>
            </div>
          </div>
          <div className="scrollbar-hide flex gap-1.5 overflow-x-auto px-5 pb-3 lg:hidden">
            {NAV.map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)}
                className={cx("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition",
                  tab === n.key ? "bg-navy-900 text-gold-300" : "bg-ivory text-navy-900/60")}>
                <n.icon size={12} /> {n.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8">
          {toast && <div className="mb-5"><Alert tone={toast.tone}>{toast.text}</Alert></div>}
          {tab === "dashboard" && <DashboardTab />}
          {tab === "flights" && <FlightsTab notify={notify} />}
          {(tab === "airports" || tab === "aircraft" || tab === "routes") && (
            <EntityTab key={tab} kind={tab} notify={notify} />
          )}
          {tab === "seats" && <SeatsTab notify={notify} />}
          {tab === "bookings" && <BookingsTab notify={notify} view="bookings" />}
          {tab === "passengers" && <BookingsTab notify={notify} view="passengers" />}
          {tab === "payments" && <ReportsTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "settings" && <SettingsTab notify={notify} />}
        </main>
      </div>
    </div>
  );
}