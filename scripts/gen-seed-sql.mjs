// 由 lib/seed.ts 產生 supabase/schema.sql（開發者用，一般不需要執行）
import { readFileSync, writeFileSync } from "fs";
const src = readFileSync(new URL("../lib/seed.ts", import.meta.url), "utf8");
const block = src.slice(src.indexOf("const RAW"), src.indexOf("};", src.indexOf("const RAW")));
const rows = [];
let n = 0;
for (const line of block.split("\n")) {
  const m = line.match(/city: "(\w+)", name: "([^"]+)", party: "([^"]+)", party_note: (null|"[^"]*")/);
  if (!m) continue;
  n++;
  const order = rows.filter((r) => r.city === m[1]).length + 1;
  rows.push({ id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, city: m[1], name: m[2], party: m[3], note: m[4] === "null" ? null : m[4].slice(1, -1), order });
}
const q = (s) => (s === null ? "null" : `'${s.replace(/'/g, "''")}'`);
const values = rows.map((r) => `  (${q(r.id)}, ${q(r.city)}, ${q(r.name)}, ${q(r.party)}, ${q(r.note)}, ${r.order})`).join(",\n");
const head = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8").split("insert into public.sc_candidates")[0];
writeFileSync(
  new URL("../supabase/schema.sql", import.meta.url),
  `${head}insert into public.sc_candidates (id, city, name, party, party_note, sort_order) values\n${values}\non conflict (id) do nothing;\n`,
);
console.log(`wrote ${rows.length} candidates`);
