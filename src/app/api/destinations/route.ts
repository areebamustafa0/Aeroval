import { ok, route } from "@/lib/api";
import { getDestinations } from "@/lib/data";

export const GET = route(async () => {
  const destinations = await getDestinations();
  return ok({ destinations });
});