"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cityName } from "@/lib/config";
import type { Candidate } from "@/lib/types";
import { Avatar, PartyBadge } from "./CandidateCard";
import Turnstile from "./Turnstile";

type Props = {
  c: Candidate;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (turnstileToken: string) => void;
};

export default function VoteDialog({ c, submitting, error, onCancel, onConfirm }: Props) {
  const [resident, setResident] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const ready = resident && !!token && !submitting;

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) onCancel();
      }}
      className="m-auto w-[min(520px,calc(100vw-32px))] border border-ink bg-paper p-0 text-ink backdrop:bg-ink/70"
    >
      <div className="flex items-center justify-between bg-ink px-5 py-3 text-paper">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase">Ballot · 確認選票</span>
        <button onClick={onCancel} disabled={submitting} aria-label="關閉" className="p-1 hover:opacity-70">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-[13px] text-muted">{cityName(c.city)}長候選人</p>
        <div className="mt-2 flex items-center gap-4">
          <Avatar c={c} size={64} />
          <div>
            <div className="font-serif text-3xl font-black">{c.name}</div>
            <div className="mt-1">
              <PartyBadge party={c.party} />
            </div>
          </div>
        </div>

        <div className="mt-5 border-y border-rule py-4 text-[14px] leading-relaxed">
          每台裝置在六都中<strong>只能投一票</strong>，送出後無法更改。本站不收集姓名、電話、Email 或 IP。
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={resident}
            onChange={(e) => setResident(e.target.checked)}
            className="mt-1 size-4 accent-ink"
          />
          <span>
            我是<strong>{cityName(c.city)}</strong>市民（設籍於{cityName(c.city)}），並以本人意願參與模擬投票。
          </span>
        </label>

        <div className="mt-4">
          <Turnstile onToken={setToken} />
        </div>

        {error && <p className="mt-3 border-l-4 border-signal bg-white px-3 py-2 text-[14px] text-signal">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 border border-ink px-4 py-3 text-[15px] font-medium hover:bg-paper-2"
          >
            再想想
          </button>
          <button
            onClick={() => token && onConfirm(token)}
            disabled={!ready}
            className="flex flex-[1.4] items-center justify-center gap-2 bg-ink px-4 py-3 text-[15px] font-bold text-paper disabled:opacity-35"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            投下這一票
          </button>
        </div>
      </div>
    </dialog>
  );
}
