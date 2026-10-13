import { deviceHashes, hasVoted, json } from "@/lib/server";

export const dynamic = "force-dynamic";

// 用 POST 而不是 GET，避免裝置代碼出現在網址與伺服器日誌裡
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const hashes = deviceHashes(body.visitorId, body.deviceToken);
    return json({ voted: await hasVoted(hashes) });
  } catch {
    return json({ voted: false });
  }
}
