import type { Candidate } from "./types";

/**
 * 六都市長登記參選名單（依 2026/9/4 登記截止後的媒體整理）。
 * 中選會將於 10/16 前審定名單、10/23 抽籤決定號次、11/12 正式公告。
 * ⚠️ 正式名單與號次以中選會公告為準；上線後請到 Supabase 的 candidates 表更新，不用改這個檔。
 *
 * 這個檔只用在兩個地方：
 *   1. 本機沒設定 Supabase 時的預覽資料
 *   2. scripts/gen-seed-sql.mjs 產生 supabase/schema.sql 裡的初始資料
 */
type Seed = Omit<Candidate, "id" | "sort_order" | "ballot_no" | "photo_url" | "platform_tags"> & {
  party_note?: string | null;
};

const RAW: Record<string, Seed[]> = {
  taipei: [
    { city: "taipei", name: "蔣萬安", party: "中國國民黨", party_note: "現任市長" },
    { city: "taipei", name: "沈伯洋", party: "民主進步黨", party_note: null },
    { city: "taipei", name: "郭璽", party: "台灣麻將最大黨", party_note: null },
    { city: "taipei", name: "蕭文乾", party: "台灣SoR無法黨", party_note: null },
    { city: "taipei", name: "唐新民", party: "三勢團結促進聯盟", party_note: null },
    { city: "taipei", name: "林志成", party: "無黨籍", party_note: null },
  ],
  newtaipei: [
    { city: "newtaipei", name: "李四川", party: "中國國民黨", party_note: "國民黨、民眾黨共同推薦" },
    { city: "newtaipei", name: "蘇巧慧", party: "民主進步黨", party_note: null },
    { city: "newtaipei", name: "蘇輝湟", party: "無黨籍", party_note: null },
  ],
  taoyuan: [
    { city: "taoyuan", name: "張善政", party: "中國國民黨", party_note: "現任市長" },
    { city: "taoyuan", name: "黃世杰", party: "民主進步黨", party_note: null },
  ],
  taichung: [
    { city: "taichung", name: "江啟臣", party: "中國國民黨", party_note: null },
    { city: "taichung", name: "何欣純", party: "民主進步黨", party_note: null },
    { city: "taichung", name: "洪麗華", party: "司法正義黨", party_note: null },
  ],
  tainan: [
    { city: "tainan", name: "謝龍介", party: "中國國民黨", party_note: null },
    { city: "tainan", name: "陳亭妃", party: "民主進步黨", party_note: null },
    { city: "tainan", name: "蕭燐洪", party: "台灣SoR無法黨", party_note: null },
    { city: "tainan", name: "葉人文", party: "無黨籍", party_note: null },
  ],
  kaohsiung: [
    { city: "kaohsiung", name: "柯志恩", party: "中國國民黨", party_note: null },
    { city: "kaohsiung", name: "賴瑞隆", party: "民主進步黨", party_note: null },
    { city: "kaohsiung", name: "張靜", party: "司法改革黨", party_note: null },
    { city: "kaohsiung", name: "王肇民", party: "無黨籍", party_note: null },
    { city: "kaohsiung", name: "洪方隆", party: "無黨籍", party_note: null },
  ],
};

let n = 0;
export const SEED_CANDIDATES: Candidate[] = Object.values(RAW).flatMap((list) =>
  list.map((c, i) => {
    n += 1;
    return {
      id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      city: c.city,
      ballot_no: null,
      name: c.name,
      party: c.party,
      party_note: c.party_note ?? null,
      platform_tags: [],
      photo_url: null,
      sort_order: i + 1,
    };
  }),
);
