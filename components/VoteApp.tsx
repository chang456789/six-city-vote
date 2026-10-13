"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, EyeOff, Fingerprint, ShieldCheck } from "lucide-react";
import { CITIES, cityName, ELECTION_DAY, type Phase } from "@/lib/config";
import { getDeviceIds, getLocalVote, setLocalVote } from "@/lib/device";
import type { Candidate, ResultsPayload } from "@/lib/types";
import CandidateCard from "./CandidateCard";
import ResultsBoard from "./ResultsBoard";
import VoteDialog from "./VoteDialog";

type VotedState = { city: string | null } | null;

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function todayLine() {
  return new Date().toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function VoteApp() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [phase, setPhase] = useState<Phase>("open");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [city, setCity] = useState<string>(CITIES[0].id);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voted, setVoted] = useState<VotedState>(null);
  const [checking, setChecking] = useState(true);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [meta, setMeta] = useState({ date: "", days: 0 });
  const [platformsAt, setPlatformsAt] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const ids = await getDeviceIds();
      const r = await fetch("/api/results", { method: "POST", body: JSON.stringify(ids) });
      if (r.ok) setResults(await r.json());
    } finally {
      setResultsLoading(false);
    }
  }, []);

  // 初始化：載入名單、檢查這台裝置是否投過
  useEffect(() => {
    setMeta({ date: todayLine(), days: daysUntil(ELECTION_DAY) });
    (async () => {
      try {
        const r = await fetch("/api/candidates");
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setCandidates(j.candidates);
        setPhase(j.phase);
        setPlatformsAt(j.platformsUpdatedAt ?? null);
        if (j.phase === "closed") fetchResults();
      } catch {
        setLoadError("候選人名單載入失敗，請稍後重新整理。");
      }

      const local = await getLocalVote();
      if (local) {
        setVoted({ city: local.city });
        setCity(local.city);
        fetchResults();
        setChecking(false);
        return;
      }
      try {
        const ids = await getDeviceIds();
        const r = await fetch("/api/status", { method: "POST", body: JSON.stringify(ids) });
        const j = await r.json();
        if (j.voted) {
          setVoted({ city: null });
          fetchResults();
        }
      } catch {
        /* 檢查失敗就讓使用者正常操作，送出時伺服器仍會再擋一次 */
      }
      setChecking(false);
    })();
  }, [fetchResults]);

  const byCity = useMemo(() => {
    const m: Record<string, Candidate[]> = {};
    for (const c of candidates) (m[c.city] ??= []).push(c);
    return m;
  }, [candidates]);

  const list = byCity[city] ?? [];
  const canVote = !voted && !checking && phase !== "closed";
  const showResults = !!voted || phase === "closed";

  async function submit(turnstileToken: string) {
    if (!selected) return;
    setSubmitting(true);
    setVoteError(null);
    try {
      const ids = await getDeviceIds();
      const r = await fetch("/api/vote", {
        method: "POST",
        body: JSON.stringify({ ...ids, candidateId: selected.id, turnstileToken, residentConfirmed: true }),
      });
      const j = await r.json();
      if (r.status === 409) {
        setVoted({ city: null });
        setDialogOpen(false);
        setSelected(null);
        fetchResults();
        return;
      }
      if (!r.ok) {
        setVoteError(j.error ?? "投票失敗，請稍後再試");
        return;
      }
      await setLocalVote({ city: j.city, at: new Date().toISOString() });
      setVoted({ city: j.city });
      setDialogOpen(false);
      setSelected(null);
      await fetchResults();
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setVoteError("連線中斷，請確認網路後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ================= 報頭 ================= */}
      <header className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between border-b border-paper/15 py-2.5 font-mono text-[11px] tracking-[0.14em] text-paper/60">
            <span suppressHydrationWarning>{meta.date || " "}</span>
            <span className="hidden sm:inline">2026 LOCAL ELECTIONS · MUNICIPAL MAYORS</span>
          </div>
          <div className="grid gap-6 py-8 sm:py-12 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-3 inline-block bg-signal px-2 py-0.5 text-[12px] font-bold tracking-[0.2em] text-white">
                模擬投票
              </p>
              <h1 className="font-serif text-[52px] leading-[0.95] font-black tracking-tight sm:text-[88px]">
                六都．誰當家
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-paper/75 sm:text-[17px]">
                2026 年臺北、新北、桃園、臺中、臺南、高雄市長選舉。選擇你設籍的城市，投下你的一票，立即看見模擬開票。
              </p>
            </div>
            <div className="border-l-4 border-paper pl-4 md:text-right md:border-l-0 md:border-r-4 md:pr-4 md:pl-0">
              <div className="text-[12px] tracking-[0.2em] text-paper/60">距 11 月 28 日投票</div>
              <div className="font-serif tnum text-[64px] leading-none font-black" suppressHydrationWarning>
                {meta.days}
                <span className="ml-1 text-[20px] font-semibold">天</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-paper/15">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 py-3 text-[12px] text-paper/70 sm:px-6">
            <span className="inline-flex items-center gap-1.5">
              <EyeOff size={13} /> 零個資：不收姓名、電話、Email、IP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint size={13} /> 一台裝置，六都只能投一票
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} /> Cloudflare 人機驗證
            </span>
          </div>
        </div>
      </header>

      {/* ================= 狀態列 ================= */}
      {voted && (
        <div className="border-b border-ink bg-paper-2">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-[14px] sm:px-6">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>
              {voted.city
                ? `這台裝置已在「${cityName(voted.city)}」完成投票，感謝參與。`
                : "這台裝置先前已投過票，每台裝置在六都中只能投一次。"}
            </span>
          </div>
        </div>
      )}
      {phase === "blackout" && !voted && (
        <div className="border-b border-ink bg-paper-2">
          <div className="mx-auto max-w-6xl px-4 py-3 text-[14px] sm:px-6">
            選前十日封關期：仍可投票，但依法暫停公布結果，11/28 16:00 後揭曉。
          </div>
        </div>
      )}

      {/* ================= 城市分頁 ================= */}
      <nav aria-label="選擇城市" className="sticky top-0 z-20 border-b border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div role="tablist" className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {CITIES.map((c) => {
              const active = c.id === city;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setCity(c.id);
                    setSelected(null);
                  }}
                  className={`group relative shrink-0 px-3 pt-3 pb-2.5 text-left sm:px-5 ${active ? "" : "text-muted hover:text-ink"}`}
                >
                  <span className="font-serif block text-[18px] font-black sm:text-[20px]">{c.name}</span>
                  <span className="block font-mono text-[9px] tracking-[0.18em]">{c.en}</span>
                  <span
                    className={`absolute inset-x-3 bottom-0 h-[3px] bg-ink transition-transform sm:inset-x-5 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ================= 候選人 ================= */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-2 rule-double" />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-4xl font-black sm:text-5xl">{cityName(city)}長</h2>
            <p className="mt-2 text-[14px] text-muted">
              登記參選 {list.length} 人
              {list.some((c) => c.ballot_no === null) && " · 號次將於 10 月 23 日由選委會抽籤決定"}
            </p>
          </div>
          <p className="max-w-xs text-[12px] leading-relaxed text-muted sm:text-right">
            名單依中選會登記資料整理，正式候選人以中選會 11 月 12 日公告為準。
            {platformsAt && (
              <>
                <br />
                政見摘要更新於 {platformsAt}，整理自候選人公開發表內容與新聞報導，點「資料來源」可查證原文。
              </>
            )}
          </p>
        </div>

        {loadError && <p className="border-l-4 border-signal bg-white px-4 py-3 text-signal">{loadError}</p>}

        {!loadError && candidates.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse border border-rule bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <CandidateCard
                key={c.id}
                c={c}
                selected={selected?.id === c.id}
                disabled={!canVote}
                onSelect={() => setSelected(selected?.id === c.id ? null : c)}
              />
            ))}
          </div>
        )}

        {canVote && (
          <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-ink bg-paper px-4 py-4 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px] text-muted">
                {selected ? (
                  <>
                    已選擇 <strong className="text-ink">{selected.name}</strong>（{cityName(selected.city)}）
                  </>
                ) : (
                  "點選一位候選人"
                )}
              </p>
              <button
                disabled={!selected}
                onClick={() => {
                  setVoteError(null);
                  setDialogOpen(true);
                }}
                className="bg-ink px-8 py-3.5 text-[16px] font-bold text-paper disabled:opacity-30"
              >
                前往投票
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= 開票 ================= */}
      {showResults && (
        <section ref={resultsRef} className="scroll-mt-16 bg-ink">
          <ResultsBoard
            key={voted?.city ?? "all"}
            candidates={candidates}
            results={results}
            initialCity={voted?.city ?? city}
            loading={resultsLoading}
          />
        </section>
      )}

      {/* ================= 方法與隱私 ================= */}
      <footer className="border-t-4 border-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-[14px] leading-relaxed sm:px-6 md:grid-cols-3">
          <div>
            <h3 className="font-serif mb-2 text-lg font-black">隱私承諾</h3>
            <p className="text-muted">
              本站不要求登入，不收集姓名、電話、Email、身分證字號，也不記錄 IP。投票內容與裝置紀錄分開存放，任何人（包含站長）都無法得知某台裝置投給誰。
            </p>
          </div>
          <div>
            <h3 className="font-serif mb-2 text-lg font-black">一台裝置一票</h3>
            <p className="text-muted">
              以瀏覽器裝置特徵與本機隨機代碼辨識是否重複投票，兩者都在伺服器端以加密雜湊處理後才儲存，無法還原成原始資料；並以 Cloudflare Turnstile 阻擋自動化程式。
            </p>
          </div>
          <div>
            <h3 className="font-serif mb-2 text-lg font-black">方法限制</h3>
            <p className="text-muted">
              本站為網路自由參與的模擬投票，並非隨機抽樣民調，結果不具代表性。依《選罷法》第 51 條，11 月 18 日起至投票截止前不公布結果。
            </p>
          </div>
        </div>
        <div className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-4 py-4 font-mono text-[11px] tracking-[0.14em] text-muted sm:px-6">
            六都．誰當家 — 獨立製作之非營利模擬投票，與任何政黨、候選人或選務機關無關
          </div>
        </div>
      </footer>

      {dialogOpen && selected && (
        <VoteDialog
          c={selected}
          submitting={submitting}
          error={voteError}
          onCancel={() => setDialogOpen(false)}
          onConfirm={submit}
        />
      )}
    </>
  );
}
