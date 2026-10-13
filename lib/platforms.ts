import data from "@/data/platforms.json";
import type { Candidate, PlatformSource } from "./types";

/**
 * 政見資料來自 data/platforms.json（由排程任務每天查證後更新，推上 GitHub → Vercel 自動重新部署）。
 * 鍵值格式：「城市代碼/姓名」，例如 "taipei/沈伯洋"。
 * 若 Supabase 的 platform_tags 有手動填寫的內容，以手動填寫為優先。
 */
type Entry = { tags: string[]; status: string | null; sources: PlatformSource[] };
const MAP = (data as { candidates: Record<string, Entry> }).candidates;
export const PLATFORMS_UPDATED_AT = (data as { updatedAt: string }).updatedAt;

export function withPlatforms(list: Candidate[]): Candidate[] {
  return list.map((c) => {
    const e = MAP[`${c.city}/${c.name}`];
    if (!e) return c;
    const manual = c.platform_tags.length > 0;
    return {
      ...c,
      platform_tags: manual ? c.platform_tags : e.tags,
      platform_status: manual ? null : e.status,
      platform_sources: manual ? [] : e.sources,
    };
  });
}
