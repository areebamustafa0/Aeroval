"use client";

import { useMemo } from "react";
import { cx, money } from "@/lib/format";
import type { SeatDTO } from "@/lib/data";

export default function SeatMap({ seats, cabin, count, selected, onChange }: {
  seats: SeatDTO[]; cabin: string; count: number; selected: number[]; onChange: (ids: number[]) => void;
}) {
  const rows = useMemo(() => {
    const map = new Map<number, SeatDTO[]>();
    for (const s of seats) {
      const arr = map.get(s.row) ?? [];
      arr.push(s);
      map.set(s.row, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [seats]);

  const bizRows = rows.filter(([, ss]) => ss[0]?.cabinClass === "business");
  const ecoRows = rows.filter(([, ss]) => ss[0]?.cabinClass === "economy");

  const toggle = (s: SeatDTO) => {
    if (s.status !== "available" || s.cabinClass !== cabin) return;
    if (selected.includes(s.id)) onChange(selected.filter((x) => x !== s.id));
    else if (selected.length < count) onChange([...selected, s.id]);
    else onChange([...selected.slice(1), s.id]);
  };

  const seatBtn = (s: SeatDTO) => {
    const isSel = selected.includes(s.id);
    const outside = s.cabinClass !== cabin;
    const state = isSel ? "selected" : s.status;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => toggle(s)}
        disabled={s.status !== "available" || outside}
        data-state={state}
        data-premium={s.isPremium}
        data-exit={s.isExit}
        data-outside={outside}
        className="seat"
        title={`${s.seatNumber} · ${s.cabinClass}${s.isExit ? " · exit row" : ""}${s.extraPrice ? ` · +${money(s.extraPrice)}` : " · included"}`}
        aria-label={`Seat ${s.seatNumber}${isSel ? ", selected" : s.status !== "available" ? ", unavailable" : ""}`}
        aria-pressed={isSel}
      >
        {isSel ? "✓" : s.letter}
      </button>
    );
  };

  const renderRow = (row: number, ss: SeatDTO[], business: boolean) => {
    const sorted = [...ss].sort((a, b) => a.letter.localeCompare(b.letter));
    const left = business ? sorted.filter((s) => ["A", "C"].includes(s.letter)) : sorted.filter((s) => ["A", "B", "C"].includes(s.letter));
    const right = business ? sorted.filter((s) => ["D", "F"].includes(s.letter)) : sorted.filter((s) => ["D", "E", "F"].includes(s.letter));
    const isExit = ss.some((s) => s.isExit);
    return (
      <div key={row} className="relative flex items-center justify-center gap-1.5 py-[3px]">
        {isExit && (
          <>
            <span className="absolute -left-1 rounded bg-skyblue/25 px-1 py-0.5 text-[7.5px] font-extrabold tracking-wider text-navy-700">EXIT</span>
            <span className="absolute -right-1 rounded bg-skyblue/25 px-1 py-0.5 text-[7.5px] font-extrabold tracking-wider text-navy-700">EXIT</span>
          </>
        )}
        <span className="font-num w-6 text-right text-[10px] font-bold text-mist">{row}</span>
        <div className={cx("flex gap-1.5", business && "gap-2")}>{left.map(seatBtn)}</div>
        <span className="w-7" aria-hidden="true" />
        <div className={cx("flex gap-1.5", business && "gap-2")}>{right.map(seatBtn)}</div>
        <span className="w-6" aria-hidden="true" />
      </div>
    );
  };

  return (
    <div>
      <div className="mx-auto w-fit rounded-t-[120px] rounded-b-3xl border border-navy-900/12 bg-gradient-to-b from-ivory to-white px-6 pb-8 pt-14 shadow-inner sm:px-10">
        <div className="mx-auto mb-8 h-2 w-16 rounded-full bg-navy-900/10" aria-hidden="true" />
        {bizRows.length > 0 && (
          <>
            <p className="mb-3 text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-gold-600">Business · 2–2</p>
            <div className={cx(cabin !== "business" && "opacity-90")}>{bizRows.map(([r, ss]) => renderRow(r, ss, true))}</div>
            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-navy-900/10" />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-mist">Galley</span>
              <span className="h-px flex-1 bg-navy-900/10" />
            </div>
          </>
        )}
        <p className="mb-3 text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-navy-900/50">Economy · 3–3</p>
        {ecoRows.map(([r, ss]) => renderRow(r, ss, false))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-navy-900/70">
        <span className="flex items-center gap-1.5"><span className="seat pointer-events-none h-5 w-5" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="seat pointer-events-none h-5 w-5" data-premium="true" /> Premium / exit</span>
        <span className="flex items-center gap-1.5"><span className="seat pointer-events-none h-5 w-5" data-state="selected" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="seat pointer-events-none h-5 w-5" data-state="occupied" /> Taken</span>
      </div>
      <p className="mt-3 text-center text-[12px] text-mist">
        {selected.length} of {count} seat{count > 1 ? "s" : ""} chosen
        {selected.length === count && count > 1 ? " — tapping another seat replaces your first pick." : "."}
        {" "}Exit & front-row seats carry a small extra; window dreams are free.
      </p>
    </div>
  );
}