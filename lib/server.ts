import "server-only";
import { createHmac } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SEED_CANDIDATES } from "./seed";
import { withPlatforms } from "./platforms";
import type { Candidate } from "./types";

// ---------- Supabase ----------
let client: SupabaseClient | null | undefined;

/** 有設定 Supabase 就回傳 client；沒有就回傳 null，改用本機記憶體（只適合預覽）。 */
export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

// ---------- 本機預覽用的記憶體資料庫（部署到 Vercel 一定要設 Supabase） ----------
type MemStore = { devices: Set<string>; counts: Map<string, number> };
const g = globalThis as unknown as { __mem?: MemStore };
export const mem: MemStore = (g.__mem ??= { devices: new Set(), counts: new Map() });

// ---------- 候選人 ----------
export async function loadCandidates(): Promise<Candidate[]> {
  const sb = db();
  if (!sb) return withPlatforms(SEED_CANDIDATES);
  const { data, error } = await sb
    .from("candidates")
    .select("id, city, ballot_no, name, party, party_note, platform_tags, photo_url, sort_order")
    .eq("is_active", true)
    .order("city")
    .order("ballot_no", { ascending: true, nullsFirst: false })
    .order("sort_order");
  if (error) throw new Error(error.message);
  return withPlatforms((data ?? []).map((c) => ({ ...c, platform_tags: c.platform_tags ?? [] })) as Candidate[]);
}

// ---------- 裝置雜湊 ----------
/**
 * 前端送來的是「裝置指紋 visitorId」與「本機隨機代碼」。
 * 伺服器用祕密 salt 做 HMAC-SHA256 後才存，資料庫裡看不到原始值，也無法反推。
 * 投票紀錄(votes)和裝置紀錄(voted_devices)是兩張完全不相連的表，無法知道誰投給誰。
 */
export function deviceHashes(visitorId: unknown, deviceToken: unknown): string[] {
  const salt = process.env.VOTE_HASH_SALT || "local-dev-salt-change-me";
  const out: string[] = [];
  const useFp = (process.env.FINGERPRINT_BLOCKING ?? "true") !== "false";
  const clean = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(v) ? v : null);
  const fp = clean(visitorId);
  const tk = clean(deviceToken);
  if (useFp && fp) out.push("fp:" + createHmac("sha256", salt).update("fp:" + fp).digest("hex"));
  if (tk) out.push("tk:" + createHmac("sha256", salt).update("tk:" + tk).digest("hex"));
  return out;
}

export async function hasVoted(hashes: string[]): Promise<boolean> {
  if (hashes.length === 0) return false;
  const sb = db();
  if (!sb) return hashes.some((h) => mem.devices.has(h));
  const { data, error } = await sb.rpc("has_voted", { p_hashes: hashes });
  if (error) throw new Error(error.message);
  return data === true;
}

// ---------- Turnstile ----------
export async function verifyTurnstile(token: unknown): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production"; // 本機沒設定就略過
  if (typeof token !== "string" || token.length < 10) return false;
  const body = new URLSearchParams({ secret, response: token });
  // 刻意不傳 remoteip：本站不處理任何 IP
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const json = (await res.json()) as { success?: boolean };
  return json.success === true;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
