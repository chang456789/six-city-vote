import { getPhase, SCHEDULE } from "@/lib/config";
import { json, loadCandidates } from "@/lib/server";
import { PLATFORMS_UPDATED_AT } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = await loadCandidates();
    return json({ candidates, phase: getPhase(), schedule: SCHEDULE, platformsUpdatedAt: PLATFORMS_UPDATED_AT });
  } catch (e) {
    return json({ error: "無法載入候選人名單", detail: String(e) }, 500);
  }
}
