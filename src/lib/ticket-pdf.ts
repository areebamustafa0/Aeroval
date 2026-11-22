import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { BookingDetail } from "@/lib/booking";
import { verifyRef } from "@/lib/booking";
import { CABIN_LABEL, fmtDate, fmtTime, fmtDur, money } from "@/lib/format";
import type { FlightDTO } from "@/lib/data";

const NAVY = rgb(0.063, 0.114, 0.196);
const GOLD = rgb(0.851, 0.757, 0.553);
const INK = rgb(0.12, 0.16, 0.23);
const GREY = rgb(0.45, 0.5, 0.57);
const IVORY = rgb(0.969, 0.965, 0.949);

export async function buildTicketPdf(detail: BookingDetail): Promise<Uint8Array> {
  const { booking, outbound, inbound, passengers, payments } = detail;
  const segments = [outbound, inbound].filter(Boolean) as FlightDTO[];
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const W = 842;
  const H = 250 + segments.length * 210 + passengers.length * 26 + 90;
  const page = doc.addPage([W, H]);

  const qrPng = await QRCode.toBuffer(JSON.stringify({ pnr: booking.pnr, verify: verifyRef(booking.pnr) }), {
    margin: 1, width: 220, color: { dark: "#101D32", light: "#FFFFFF" },
  });
  const qrImg = await doc.embedPng(qrPng);

  // header
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: NAVY });
  page.drawText("AEROVÉL", { x: 40, y: H - 52, size: 26, font: bold, color: GOLD });
  page.drawText("THE WORLD IS YOURS", { x: 40, y: H - 72, size: 8, font: reg, color: rgb(0.72, 0.78, 0.85) });
  page.drawText("E-TICKET / BOARDING PASS", { x: W - 260, y: H - 50, size: 12, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`PNR ${booking.pnr}`, { x: W - 260, y: H - 70, size: 11, font: reg, color: GOLD });
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 4, color: GOLD });

  // body background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H - 100, color: IVORY });

  let y = H - 140;
  page.drawText(`Status: ${booking.status.toUpperCase()}`, { x: 40, y, size: 11, font: bold, color: INK });
  const pay = payments[0];
  page.drawText(
    `Payment: ${pay ? `${pay.status} (${pay.method})` : "pending"}  ·  Total ${money(booking.totalAmount)}  ·  ${CABIN_LABEL[booking.cabinClass] ?? booking.cabinClass}`,
    { x: 250, y, size: 10, font: reg, color: GREY }
  );
  y -= 26;

  for (const f of segments) {
    page.drawRectangle({ x: 32, y: y - 168, width: W - 64, height: 182, color: rgb(1, 1, 1), borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });
    page.drawText(`${f.airline.name} · ${f.flightNumber}`, { x: 48, y: y - 8, size: 10, font: bold, color: GREY });
    page.drawText(f.origin.code, { x: 48, y: y - 48, size: 34, font: bold, color: NAVY });
    page.drawText(f.destination.code, { x: 260, y: y - 48, size: 34, font: bold, color: NAVY });
    page.drawText("»", { x: 202, y: y - 46, size: 26, font: bold, color: GOLD });
    page.drawText(`${f.origin.city}  ${fmtTime(f.departureAt)}`, { x: 48, y: y - 68, size: 10, font: reg, color: GREY });
    page.drawText(`${f.destination.city}  ${fmtTime(f.arrivalAt)}`, { x: 260, y: y - 68, size: 10, font: reg, color: GREY });
    page.drawText(fmtDate(f.departureAt), { x: 48, y: y - 92, size: 11, font: bold, color: INK });
    page.drawText(`${fmtDur(f.durationMinutes)} · ${f.stops === 0 ? "Non-stop" : `${f.stops} stop(s)`}`, { x: 48, y: y - 110, size: 9, font: reg, color: GREY });
    page.drawText(`Terminal ${f.terminal} · Gate ${f.gate} · ${f.aircraft.model}`, { x: 48, y: y - 126, size: 9, font: reg, color: GREY });
    const isReturn = inbound && f.id === inbound.id;
    const seatList = passengers.map((p) => (isReturn ? p.returnSeatNumber : p.seatNumber)).join(", ");
    page.drawText(`Seats: ${seatList}`, { x: 48, y: y - 148, size: 11, font: bold, color: NAVY });
    page.drawText(CABIN_LABEL[f.cabin] ?? f.cabin, { x: 260, y: y - 148, size: 10, font: reg, color: GREY });
    page.drawImage(qrImg, { x: W - 190, y: y - 152, width: 128, height: 128 });
    page.drawText("Scan to verify", { x: W - 178, y: y - 162, size: 7, font: reg, color: GREY });
    y -= 210;
  }

  y -= 4;
  page.drawText("PASSENGERS", { x: 40, y, size: 9, font: bold, color: GREY });
  y -= 18;
  for (const p of passengers) {
    page.drawText(`${p.lastName.toUpperCase()}/${p.firstName.toUpperCase()}`, { x: 40, y, size: 10, font: bold, color: INK });
    page.drawText(`Seat ${p.seatNumber}${p.returnSeatNumber ? ` / ${p.returnSeatNumber}` : ""} · Passport ${p.passportNumber || "—"}`, { x: 300, y, size: 9, font: reg, color: GREY });
    y -= 22;
  }

  page.drawText("This is a demonstration e-ticket for the AEROVÉL sample platform. No real flight or payment is involved.", {
    x: 40, y: 34, size: 8, font: reg, color: GREY,
  });
  page.drawText(`Verification ref ${verifyRef(booking.pnr)} · aerovel.demo`, { x: 40, y: 20, size: 8, font: reg, color: GREY });

  return doc.save();
}