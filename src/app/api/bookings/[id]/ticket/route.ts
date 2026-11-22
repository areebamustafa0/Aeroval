import { NextRequest } from "next/server";
import { route, vInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getBookingDetail } from "@/lib/booking";
import { buildTicketPdf } from "@/lib/ticket-pdf";
import { getTicket, putTicket } from "@/lib/storage";

export const GET = route(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const detail = await getBookingDetail(vInt(id, "Booking id", 1, 1_000_000), user);
  const pnr = detail.booking.pnr;

  // Serve the archived e-ticket from Neon Object Storage. On a cache miss,
  // generate it and archive it on the branch that owns the booking.
  // Storage is an enhancement: failures fall back to on-demand PDF generation.
  let bytes: Uint8Array | null = null;
  let archived = false;
  try {
    bytes = await getTicket(pnr);
    archived = bytes !== null;
  } catch {
    bytes = null;
  }
  if (!bytes) {
    bytes = await buildTicketPdf(detail);
    try {
      await putTicket(pnr, bytes);
      archived = true;
    } catch {
      // Keep the download working even if object storage is temporarily unavailable.
    }
  }

  // Copy into a plain ArrayBuffer so the Response body is unambiguously typed.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Response(ab, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="AEROVEL-${pnr}.pdf"`,
      "Cache-Control": "no-store",
      "X-Aerovel-Ticket-Source": archived ? "neon-object-storage" : "generated",
    },
  });
});
