"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { CITIES, cityName } from "@/lib/config";
import { partyStyle } from "@/lib/parties";
import type { Candidate, ResultsPayload } from "@/lib/types";

function Donut({ rows, total }: { rows: { c: Candidate; n: number }[]; total: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="size-40 shrink-0 sm:size-48" role="img" aria-label="得票比例圓環圖">
      <circle cx="70" cy="70" r={R} fill="none" stroke="#2f3337" strokeWidth="18" />
      {total > 0 &&
        rows.map(({ c, n }) => {
          const len = (n / total) * C;
          const el = (
            <circle
              key={c.id}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={partyStyle(c.party).color}
              strokeWidth="18"
              strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
      <text x="70" y="66" textAnchor="middle" className="font-serif" fill="#F9F9FB" fontSize="26" fontWeight="900">
        {total.toLocaleString()}
      </text>
      <text x="70" y="86" textAnchor="middle" fill="#9aa0a6" fontSize="10" letterSpacing="2">
        總票數
      </text>
    </svg>
  );
}

type Props = {
  candidates: Candidate[];
  results: ResultsPayload | null;
  initialCity: string;
  loading: boolean;
};

export default function ResultsBoard({ candidates, results, initialCity, loading }: Props) {
  const [city, setCity] = useState(initialCity);

  if (results?.hidden && results.reason === "BLACKOUT") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <Lock className="mx-auto mb-4 text-paper/60" />
        <h3 className="font-serif text-2xl font-black text-paper">選前十日 · 結果封存</h3>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-paper/70">
          依《公職人員選舉罷免法》第 51 條，投票日前十日起至投票截止前，不得發布民意調查資料。
          您的票已確實計入，模擬開票結果將於 11 月 28 日下午 4 時投票截止後公開。
        </p>
      </div>
    );
  }

  const rows = candidates
    .filter((c) => c.city === city)
    .map((c) => ({ c, n: results?.counts[c.id] ?? 0 }))
    .sort((a, b) => b.n - a.n);
  const total = results?.totals[city] ?? 0;
  const top = rows[0]?.n ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-paper/20 pb-4">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-paper/50 uppercase">Live tally · 模擬開票</div>
          <h2 className="font-serif mt-1 text-3xl font-black text-paper sm:text-4xl">{cityName(city)}長 得票概況</h2>
        </div>
        <div className="text-right text-[12px] text-paper/50">
          {results ? `更新於 ${new Date(results.updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </div>
      </div>

      <div role="tablist" aria-label="切換城市" className="-mx-4 mb-8 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {CITIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={city === c.id}
            onClick={() => setCity(c.id)}
            className={`shrink-0 px-3 py-1.5 text-[14px] transition-colors ${
              city === c.id ? "bg-paper font-bold text-ink" : "text-paper/70 hover:bg-paper/10"
            }`}
          >
            {c.name}
            <span className="tnum ml-1.5 text-[11px] opacity-60">{(results?.totals[c.id] ?? 0).toLocaleString()}</span>
          </button>
        ))}
      </div>

      {loading && !results ? (
        <div className="py-16 text-center text-paper/60">開票中…</div>
      ) : (
        <div className="flex flex-col gap-10 md:flex-row md:items-start">
          <div className="flex justify-center md:w-56">
            <Donut rows={rows} total={total} />
          </div>
          <ol className="flex-1 space-y-5">
            {rows.map(({ c, n }, i) => {
              const pct = total > 0 ? (n / total) * 100 : 0;
              const p = partyStyle(c.party);
              return (
                <li key={c.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="tnum font-mono text-[12px] text-paper/40">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-serif truncate text-xl font-black text-paper">{c.name}</span>
                      <span className="truncate text-[12px] text-paper/50">{c.party}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-serif tnum text-2xl font-black text-paper">{pct.toFixed(1)}</span>
                      <span className="ml-0.5 text-[12px] text-paper/60">%</span>
                      <span className="tnum ml-3 text-[12px] text-paper/50">{n.toLocaleString()} 票</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-[#2f3337]">
                    <div
                      key={`${city}-${c.id}`}
                      className="bar-grow h-full"
                      style={{
                        width: `${pct}%`,
                        background: p.color,
                        outline: n === top && n > 0 ? "1px solid rgba(249,249,251,.6)" : "none",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <p className="mt-10 border-t border-paper/15 pt-4 text-[12px] leading-relaxed text-paper/50">
        本結果為網路自由參與之模擬投票，參與者未經抽樣，不具統計上的代表性，不能用來推估實際選舉結果。
        依法自 11 月 18 日起至投票截止前停止公開。
      </p>
    </div>
  );
}
