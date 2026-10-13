# 六都．誰當家 — 2026 六都市長模擬投票

Next.js 16 + Tailwind CSS 4 + Supabase + Cloudflare Turnstile，部署在 Vercel 免費方案。

- 一台裝置在六都中只能投一票（裝置指紋 ＋ localStorage/IndexedDB 代碼 ＋ Turnstile 三層）
- 不收集任何個人資料，也不記錄 IP；投票內容與裝置紀錄分兩張表存放，互不關聯
- 投完立即看長條圖＋圓環圖；**11/18 00:00 起自動隱藏結果**（選罷法第 51 條），11/28 16:00 投票截止後自動恢復公開並停止投票

---

## 完全不會寫程式的部署教學（約 30 分鐘）

你已經有 GitHub、Supabase、Cloudflare、Vercel 帳號（taiwan-vote 用過的那些），直接沿用即可。這個網站要**全部另開新的**，不要動到 taiwan-vote。

### 第 1 步：使用現有的 Supabase 專案
Supabase 免費方案最多 2 個專案。本站所有資料表都以 `sc_` 開頭，所以**直接放進你現有的專案（例如 taiwan-vote 用的那個）**，不會和原本的資料表衝突。
1. 登入 https://supabase.com/dashboard → 點進你要共用的專案

### 第 2 步：建立資料表
1. 左側選單 **SQL Editor** → **New query**
2. 打開 GitHub 上的 `supabase/schema.sql`，全部複製後貼進去
3. 按 **Run**，看到 `Success. No rows returned` 就完成
4. 左側 **Table Editor** → 應該多出 `sc_candidates`、`sc_votes`、`sc_voted_devices`；`sc_candidates` 裡有 23 位候選人

### 第 3 步：記下 Supabase 金鑰
左側 **Project Settings → API**（或 Data API / API Keys），記下：
- **Project URL**（像 `https://abcd1234.supabase.co`）→ 等一下填 `SUPABASE_URL`
- **service_role** 金鑰（要按 Reveal 才看得到）→ 填 `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ service_role 金鑰等於資料庫的萬能鑰匙：只能貼在 Vercel 的環境變數，**絕對不要**貼到 GitHub、Threads 或任何地方。

### 第 4 步：建立 Cloudflare Turnstile
1. 登入 https://dash.cloudflare.com → 左側 **Turnstile** → **Add widget**
2. Widget name：`six-city-vote`；Hostname 先填 `vercel.app`（之後有網址再改成完整網址）
3. Widget Mode 選 **Managed** → Create
4. 記下 **Site Key** 和 **Secret Key**

### 第 5 步：上傳到 GitHub
1. GitHub 右上角 **+ → New repository**，名稱 `six-city-vote`，選 **Private** 或 Public 都可以 → Create
2. 在新 repo 頁面點 **uploading an existing file**
3. 把這個專案資料夾裡的**所有檔案和資料夾**拖進去（**不要**拖 `node_modules`、`.next`，壓縮檔裡本來就沒有）
4. 按 **Commit changes**

### 第 6 步：部署到 Vercel
1. 登入 https://vercel.com → **Add New… → Project** → 選剛剛的 `six-city-vote` → **Import**
2. 展開 **Environment Variables**，一行一行加入（左邊名稱、右邊值）：

| 名稱 | 值 |
|---|---|
| `SUPABASE_URL` | 第 3 步的 Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 第 3 步的 service_role 金鑰 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 第 4 步的 Site Key |
| `TURNSTILE_SECRET_KEY` | 第 4 步的 Secret Key |
| `VOTE_HASH_SALT` | 自己亂打 40 個英數字，例如鍵盤亂敲。**上線後不要再改** |
| `RESULTS_BLACKOUT_START` | `2026-11-18T00:00:00+08:00` |
| `VOTING_CLOSES` | `2026-11-28T16:00:00+08:00` |
| `FINGERPRINT_BLOCKING` | `true` |

3. 按 **Deploy**，約 1 分鐘後拿到網址，例如 `six-city-vote.vercel.app`
4. 回 Cloudflare Turnstile，把 Hostname 改成這個完整網址

### 第 7 步：自己測一次
1. 用手機打開網址 → 選一位候選人 → 勾選市民 → 等人機驗證打勾 → 投票
2. 應該立刻看到圖表；重新整理頁面應顯示「已完成投票」
3. 測完到 Supabase **SQL Editor** 執行下面這段，把測試票清掉：
   ```sql
   truncate public.sc_votes, public.sc_voted_devices;
   ```

---

## 日常維護：更新候選人

全部在 Supabase **Table Editor → sc_candidates** 裡直接點格子修改，存檔後網站立刻更新，不用重新部署。

| 情況 | 改哪一欄 |
|---|---|
| **10/23 號次抽籤後** | `ballot_no` 填號次，網站會自動依號次排序 |
| 候選人退選／資格不符 | `is_active` 改成 `false`（不要刪除，已投的票會保留在資料庫） |
| 新增候選人 | 按 **Insert row**，填 `city`（taipei / newtaipei / taoyuan / taichung / tainan / kaohsiung）、`name`、`party` |
| 政見標籤 | 平常**不用管**，由排程任務自動更新（見下一節）。若想手動覆蓋某人，在 `platform_tags` 填 `{社會住宅,捷運延伸}`，網站就會優先顯示你填的內容 |
| 照片 | `photo_url` 貼圖片網址；留空會顯示政黨色塊＋姓氏 |
| 備註 | `party_note`，例如「現任市長」「國民黨、民眾黨共同推薦」 |

**重要時程（中選會）**：10/16 前審定名單 → 10/23 抽籤決定號次 → 11/12 公告直轄市長候選人名單。

新政黨要顯示專屬顏色：在 `lib/parties.ts` 加一行（不加的話會用統一的紫灰色「其他政黨」）。

---

## 政見自動更新

候選人卡片下方的「主要政見」與「資料來源」連結，來自 `data/platforms.json`。整個流程是自動的：

1. Claude 的排程任務每天早上依照 `data/UPDATE_RULES.md` 的規則，查中選會、候選人官方發布與中立新聞
2. 有新政見就更新 `data/platforms.json`，推送（commit）到你的 GitHub repo
3. Vercel 偵測到 GitHub 有新內容，約 1 分鐘內自動重新部署，網站就更新了

你只要做一件事：讓排程任務能寫入你的 GitHub repo（第 5 步建好 repo 後，在對話裡告訴 Claude repo 名稱）。每次更新都會在 GitHub 留下 commit 紀錄，想看改了什麼，或想退回某次修改，都可以在 GitHub 上操作。

---

## 常見問題

**Q：有人說「我沒投過卻顯示已投票」？**
裝置指紋在**同型號 iPhone＋同版本 iOS＋Safari** 上很容易算出一樣的值，結果兩個不同的人會被當成同一台裝置。如果在 Threads 上看到不少這種回報，到 Vercel → Settings → Environment Variables 把 `FINGERPRINT_BLOCKING` 改成 `false`，再到 Deployments 按 **Redeploy**。關掉後改成只靠本機代碼＋Turnstile：誤擋的情況會消失，代價是清除瀏覽器資料就能再投一次。

**Q：結果會在什麼時候自動隱藏？**
11/18 00:00（台灣時間）起，伺服器不再回傳任何數字，網頁顯示「結果封存」；仍然可以投票。11/28 16:00 起停止投票，並對所有人公開結果。

**Q：要怎麼看目前票數？**
Supabase SQL Editor 執行：
```sql
select c.city, c.name, count(v.id) as votes
from sc_candidates c left join sc_votes v on v.candidate_id = c.id
group by c.city, c.name order by c.city, votes desc;
```
⚠️ 11/18～11/28 16:00 這段期間，自己看可以，但**不能**截圖或公布到任何地方。

**Q：真的不記錄 IP 嗎？**
本站的程式和資料庫完全不處理 IP，也不會把 IP 傳給 Cloudflare 驗證。但 Vercel 和 Cloudflare 作為服務平台，本身會有一般的連線紀錄，這部分不在本站控制範圍內。

---

## 給開發者

```bash
npm install
cp .env.example .env.local   # 不填 Supabase 也能跑，會用記憶體假資料
npm run dev
```

| 路徑 | 用途 |
|---|---|
| `app/api/candidates` | 候選人名單＋目前階段 |
| `app/api/status` | 這台裝置是否已投（POST） |
| `app/api/vote` | 投票：Turnstile 驗證 → HMAC 裝置雜湊 → `cast_vote()` 交易 |
| `app/api/results` | 結果；只回給已投票裝置，封關期一律隱藏 |
| `lib/device.ts` | FingerprintJS（已關閉 monitoring）＋ localStorage/IndexedDB 互相備份 |
| `supabase/schema.sql` | 資料表、RLS（全關）、預存函式、初始名單 |
