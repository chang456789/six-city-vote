-- =====================================================================
--  六都市長模擬投票：資料庫結構
--  使用方式：Supabase → SQL Editor → New query → 整份貼上 → Run（只要跑一次）
-- =====================================================================

-- 1) 候選人（你之後在 Table Editor 直接編輯這張表）
create table if not exists public.candidates (
  id            uuid primary key default gen_random_uuid(),
  city          text not null check (city in ('taipei','newtaipei','taoyuan','taichung','tainan','kaohsiung')),
  ballot_no     int,                              -- 號次，10/23 抽籤後填入
  name          text not null,
  party         text not null default '無黨籍',
  party_note    text,                             -- 例：國民黨、民眾黨共同推薦
  platform_tags text[] not null default '{}',     -- 政見標籤，例：{社會住宅,捷運延伸}
  photo_url     text,                             -- 照片網址，可留空
  sort_order    int not null default 0,           -- 抽籤前的排列順序
  is_active     boolean not null default true,    -- 退選/資格不符 → 改成 false 即隱藏
  updated_at    timestamptz not null default now()
);

-- 2) 票數：只記「投給誰」，不記任何裝置資訊；時間只記到「日」，無法和裝置紀錄對時比對
create table if not exists public.votes (
  id           bigint generated always as identity primary key,
  candidate_id uuid not null references public.candidates(id),
  city         text not null,
  voted_on     date not null default (now() at time zone 'Asia/Taipei')::date
);
create index if not exists votes_candidate_idx on public.votes(candidate_id);

-- 3) 已投票裝置：只存伺服器加密雜湊後的值，與 votes 表沒有任何關聯
create table if not exists public.voted_devices (
  device_hash text primary key
);

-- 4) 關閉所有公開存取：只有網站後端（service_role 金鑰）能讀寫
alter table public.candidates    enable row level security;
alter table public.votes         enable row level security;
alter table public.voted_devices enable row level security;

-- 5) 投票（同一個交易內完成：檢查 → 記錄裝置 → 加一票）
create or replace function public.cast_vote(p_hashes text[], p_candidate_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city text;
begin
  select city into v_city from candidates where id = p_candidate_id and is_active;
  if v_city is null then
    raise exception 'INVALID_CANDIDATE';
  end if;

  if exists (select 1 from voted_devices where device_hash = any(p_hashes)) then
    return 'ALREADY_VOTED';
  end if;

  begin
    insert into voted_devices(device_hash) select distinct unnest(p_hashes);
  exception when unique_violation then
    return 'ALREADY_VOTED';   -- 兩個請求同時送來時的保險
  end;

  insert into votes(candidate_id, city) values (p_candidate_id, v_city);
  return v_city;
end;
$$;

create or replace function public.has_voted(p_hashes text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from voted_devices where device_hash = any(p_hashes));
$$;

create or replace function public.get_results()
returns table(candidate_id uuid, city text, votes bigint)
language sql
security definer
set search_path = public
as $$
  select c.id, c.city, count(v.id)
  from candidates c
  left join votes v on v.candidate_id = c.id
  where c.is_active
  group by c.id, c.city;
$$;

revoke all on function public.cast_vote(text[], uuid) from public, anon, authenticated;
revoke all on function public.has_voted(text[])       from public, anon, authenticated;
revoke all on function public.get_results()           from public, anon, authenticated;
grant execute on function public.cast_vote(text[], uuid) to service_role;
grant execute on function public.has_voted(text[])       to service_role;
grant execute on function public.get_results()           to service_role;

-- 6) 初始候選人名單（2026/9/4 登記截止後媒體整理；號次待 10/23 抽籤）
insert into public.candidates (id, city, name, party, party_note, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'taipei', '蔣萬安', '中國國民黨', '現任市長', 1),
  ('00000000-0000-4000-8000-000000000002', 'taipei', '沈伯洋', '民主進步黨', null, 2),
  ('00000000-0000-4000-8000-000000000003', 'taipei', '郭璽', '台灣麻將最大黨', null, 3),
  ('00000000-0000-4000-8000-000000000004', 'taipei', '蕭文乾', '台灣SoR無法黨', null, 4),
  ('00000000-0000-4000-8000-000000000005', 'taipei', '唐新民', '三勢團結促進聯盟', null, 5),
  ('00000000-0000-4000-8000-000000000006', 'taipei', '林志成', '無黨籍', null, 6),
  ('00000000-0000-4000-8000-000000000007', 'newtaipei', '李四川', '中國國民黨', '國民黨、民眾黨共同推薦', 1),
  ('00000000-0000-4000-8000-000000000008', 'newtaipei', '蘇巧慧', '民主進步黨', null, 2),
  ('00000000-0000-4000-8000-000000000009', 'newtaipei', '蘇輝湟', '無黨籍', null, 3),
  ('00000000-0000-4000-8000-000000000010', 'taoyuan', '張善政', '中國國民黨', '現任市長', 1),
  ('00000000-0000-4000-8000-000000000011', 'taoyuan', '黃世杰', '民主進步黨', null, 2),
  ('00000000-0000-4000-8000-000000000012', 'taichung', '江啟臣', '中國國民黨', null, 1),
  ('00000000-0000-4000-8000-000000000013', 'taichung', '何欣純', '民主進步黨', null, 2),
  ('00000000-0000-4000-8000-000000000014', 'taichung', '洪麗華', '司法正義黨', null, 3),
  ('00000000-0000-4000-8000-000000000015', 'tainan', '謝龍介', '中國國民黨', null, 1),
  ('00000000-0000-4000-8000-000000000016', 'tainan', '陳亭妃', '民主進步黨', null, 2),
  ('00000000-0000-4000-8000-000000000017', 'tainan', '蕭燐洪', '台灣SoR無法黨', null, 3),
  ('00000000-0000-4000-8000-000000000018', 'tainan', '葉人文', '無黨籍', null, 4),
  ('00000000-0000-4000-8000-000000000019', 'kaohsiung', '柯志恩', '中國國民黨', null, 1),
  ('00000000-0000-4000-8000-000000000020', 'kaohsiung', '賴瑞隆', '民主進步黨', null, 2),
  ('00000000-0000-4000-8000-000000000021', 'kaohsiung', '張靜', '司法改革黨', null, 3),
  ('00000000-0000-4000-8000-000000000022', 'kaohsiung', '王肇民', '無黨籍', null, 4),
  ('00000000-0000-4000-8000-000000000023', 'kaohsiung', '洪方隆', '無黨籍', null, 5)
on conflict (id) do nothing;
