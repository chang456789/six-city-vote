import { getPhase } from "@/lib/config";
import { db, deviceHashes, json, mem, verifyTurnstile } from "@/lib/server";
import { SEED_CANDIDATES } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "資料格式錯誤" }, 400);

  if (getPhase() === "closed") return json({ error: "投票已截止" }, 403);
  if (body.residentConfirmed !== true) return json({ error: "請先確認您是該市市民" }, 400);

  const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
  if (!/^[0-9a-f-]{36}$/i.test(candidateId)) return json({ error: "候選人不存在" }, 400);

  // 第三層：Cloudflare Turnstile 擋機器人
  if (!(await verifyTurnstile(body.turnstileToken))) {
    return json({ error: "人機驗證未通過，請重新整理後再試" }, 403);
  }

  // 第一、二層：裝置指紋 + 本機代碼 → 伺服器雜湊
  const hashes = deviceHashes(body.visitorId, body.deviceToken);
  if (hashes.length === 0) return json({ error: "無法辨識裝置，請關閉無痕模式或換個瀏覽器" }, 400);

  const sb = db();
  if (!sb) {
    // 本機預覽模式
    const c = SEED_CANDIDATES.find((x) => x.id === candidateId);
    if (!c) return json({ error: "候選人不存在" }, 400);
    if (hashes.some((h) => mem.devices.has(h))) return json({ error: "ALREADY_VOTED" }, 409);
    hashes.forEach((h) => mem.devices.add(h));
    mem.counts.set(candidateId, (mem.counts.get(candidateId) ?? 0) + 1);
    return json({ ok: true, city: c.city });
  }

  const { data, error } = await sb.rpc("sc_cast_vote", { p_hashes: hashes, p_candidate_id: candidateId });
  if (error) {
    if (error.message.includes("INVALID_CANDIDATE")) return json({ error: "候選人不存在" }, 400);
    return json({ error: "系統忙碌，請稍後再試" }, 500);
  }
  if (data === "ALREADY_VOTED") return json({ error: "ALREADY_VOTED" }, 409);
  return json({ ok: true, city: data });
}
