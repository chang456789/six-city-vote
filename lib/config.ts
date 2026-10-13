// 全站共用設定：城市、時程、投票階段

export const CITIES = [
  { id: "taipei", name: "臺北市", en: "TAIPEI" },
  { id: "newtaipei", name: "新北市", en: "NEW TAIPEI" },
  { id: "taoyuan", name: "桃園市", en: "TAOYUAN" },
  { id: "taichung", name: "臺中市", en: "TAICHUNG" },
  { id: "tainan", name: "臺南市", en: "TAINAN" },
  { id: "kaohsiung", name: "高雄市", en: "KAOHSIUNG" },
] as const;

export type CityId = (typeof CITIES)[number]["id"];

export function cityName(id: string): string {
  return CITIES.find((c) => c.id === id)?.name ?? id;
}

export const ELECTION_DAY = "2026-11-28T08:00:00+08:00";

const BLACKOUT_START = process.env.RESULTS_BLACKOUT_START ?? "2026-11-18T00:00:00+08:00";
const VOTING_CLOSES = process.env.VOTING_CLOSES ?? "2026-11-28T16:00:00+08:00";

/**
 * open     ：可投票，投完可看結果
 * blackout ：選前 10 天封關期，可投票，但「不公布」任何結果（選罷法第 51 條）
 * closed   ：正式投票結束（11/28 16:00），停止投票、恢復公開結果
 */
export type Phase = "open" | "blackout" | "closed";

export function getPhase(now: Date = new Date()): Phase {
  if (now >= new Date(VOTING_CLOSES)) return "closed";
  if (now >= new Date(BLACKOUT_START)) return "blackout";
  return "open";
}

export const SCHEDULE = {
  blackoutStart: BLACKOUT_START,
  votingCloses: VOTING_CLOSES,
};
