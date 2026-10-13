import { getPhase } from "@/lib/config";
import { db, deviceHashes, hasVoted, json, mem } from "@/lib/server";
import { SEED_CANDIDATES } from "@/lib/seed";
import type { ResultsPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

// 只有「這台裝置已投過票」才回傳結果；封關期間一律不回傳
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phase = getPhase();
  const empty: ResultsPayload = { hidden: true, counts: {}, totals: {}, updatedAt: new Date().toISOString() };

  if (phase === "blackout") {
    return json({ ...empty, reason: "BLACKOUT" });
  }
  if (phase !== "closed") {
    const voted = await hasVoted(deviceHashes(body.visitorId, body.deviceToken));
    if (!voted) return json({ ...empty, reason: "NOT_VOTED" });
  }

  const counts: Record<string, number> = {};
  const totals: Record<string, number> = {};
  const sb = db();
  if (!sb) {
    for (const c of SEED_CANDIDATES) {
      const n = mem.counts.get(c.id) ?? 0;
      counts[c.id] = n;
      totals[c.city] = (totals[c.city] ?? 0) + n;
    }
  } else {
    const { data, error } = await sb.rpc("get_results");
    if (error) return json({ error: "無法讀取結果" }, 500);
    for (const row of (data ?? []) as { candidate_id: string; city: string; votes: number }[]) {
      counts[row.candidate_id] = Number(row.votes);
      totals[row.city] = (totals[row.city] ?? 0) + Number(row.votes);
    }
  }
  return json({ hidden: false, counts, totals, updatedAt: new Date().toISOString() } satisfies ResultsPayload);
}
