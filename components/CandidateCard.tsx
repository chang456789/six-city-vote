"use client";

import { Check } from "lucide-react";
import { partyStyle } from "@/lib/parties";
import type { Candidate } from "@/lib/types";

export function Avatar({ c, size = 72 }: { c: Candidate; size?: number }) {
  const p = partyStyle(c.party);
  if (c.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={c.photo_url}
        alt={c.name}
        width={size}
        height={size}
        className="shrink-0 object-cover grayscale-[15%]"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="font-serif grid shrink-0 place-items-center select-none"
      style={{ width: size, height: size, background: p.color, color: p.text, fontSize: size * 0.46, fontWeight: 900 }}
    >
      {c.name.slice(0, 1)}
    </div>
  );
}

export function PartyBadge({ party }: { party: string }) {
  const p = partyStyle(party);
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
      <span className="inline-block size-2.5 rounded-full" style={{ background: p.color }} />
      {party}
    </span>
  );
}

type Props = {
  c: Candidate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

export default function CandidateCard({ c, selected, disabled, onSelect }: Props) {
  const p = partyStyle(c.party);
  const tone = selected ? "text-paper/60" : "text-muted";
  const sources = c.platform_sources ?? [];
  return (
    <div
      className={[
        "relative flex w-full flex-col border border-ink transition-colors",
        selected ? "bg-ink text-paper" : "bg-white",
        disabled || selected ? "" : "hover:bg-paper-2",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={`選擇 ${c.name}`}
        className={`flex flex-col text-left ${disabled ? "cursor-default" : "cursor-pointer"}`}
      >
        <span className="block h-1.5 w-full" style={{ background: p.color }} />
        <div className="flex gap-4 p-4 sm:p-5">
          <Avatar c={c} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className={`font-mono text-[11px] tracking-[0.18em] uppercase ${selected ? "text-paper/70" : "text-muted"}`}>
                {c.ballot_no ? "號次" : "號次待抽籤"}
              </div>
              {selected && (
                <span className="inline-flex items-center gap-1 bg-paper px-1.5 py-0.5 text-[11px] font-bold text-ink">
                  <Check size={12} strokeWidth={3} />
                  已選
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              {c.ballot_no !== null && (
                <span className="font-serif tnum text-[40px] leading-none font-black">{c.ballot_no}</span>
              )}
              <span className="font-serif truncate text-[26px] leading-tight font-black tracking-wide">{c.name}</span>
            </div>
            <div className={`mt-2 ${selected ? "[&_span]:text-paper" : ""}`}>
              <PartyBadge party={c.party} />
              {c.party_note && <span className={`ml-2 text-[12px] ${selected ? "text-paper/70" : "text-muted"}`}>{c.party_note}</span>}
            </div>
          </div>
        </div>
      </button>

      <div className={`mt-auto border-t px-4 py-3 sm:px-5 ${selected ? "border-paper/20" : "border-rule"}`}>
        <div className={`mb-1.5 font-mono text-[10px] tracking-[0.18em] ${tone}`}>主要政見</div>
        <div className="flex flex-wrap gap-1.5">
          {c.platform_tags.length > 0 ? (
            c.platform_tags.map((t) => (
              <span key={t} className={`px-2 py-0.5 text-[12px] ${selected ? "bg-paper/10 text-paper" : "bg-paper-2 text-ink"}`}>
                {t}
              </span>
            ))
          ) : (
            <span className={`text-[12px] italic ${tone}`}>{c.platform_status ?? "政見整理中"}</span>
          )}
        </div>
        {sources.length > 0 && (
          <details className={`group/src mt-2 text-[11px] ${tone}`}>
            <summary className="cursor-pointer list-none underline decoration-dotted underline-offset-2 select-none">
              資料來源（{sources.length}）
            </summary>
            <ul className="mt-1.5 space-y-1">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">
                    {s.publisher}・{s.date}・{s.title} ↗
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
