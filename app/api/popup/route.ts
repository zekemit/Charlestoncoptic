import { connection } from "next/server";
import { isPopupActive, toPublic } from "@/lib/popup";
import { getPopup } from "@/lib/popup-store";
import { json } from "@/lib/request";

// Public: the homepage asks for the current announcement on every visit. Always request-time
// and never cached, so an admin's change is live on the next page load.
export async function GET() {
  await connection();
  const config = await getPopup();
  return json({ popup: isPopupActive(config) ? toPublic(config) : null });
}
