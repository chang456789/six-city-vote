export type Candidate = {
  id: string;
  city: string;
  ballot_no: number | null; // 10/23 抽籤前為 null
  name: string;
  party: string;
  party_note: string | null; // 例如「國民黨、民眾黨共同推薦」
  platform_tags: string[];
  photo_url: string | null;
  sort_order: number;
  platform_status?: string | null; // 例：「尚未正式發表競選政見」
  platform_sources?: PlatformSource[];
};

export type PlatformSource = { publisher: string; date: string; title: string; url: string };

export type ResultsPayload = {
  hidden: boolean;
  reason?: string;
  counts: Record<string, number>; // candidateId -> 票數
  totals: Record<string, number>; // cityId -> 總票數
  updatedAt: string;
};
