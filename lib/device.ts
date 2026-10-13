"use client";

/**
 * 前端的兩層防護：
 *  1. 裝置指紋（FingerprintJS 開源版）：由瀏覽器、螢幕、字型等特徵算出 visitorId，清除資料也不會變
 *  2. 本機代碼：隨機產生一組代碼，同時存在 localStorage 與 IndexedDB，兩邊互相備份
 * 兩者都只送到伺服器做雜湊比對，伺服器不存原始值。
 */

const LS_TOKEN = "scv.deviceToken";
const LS_VOTE = "scv.vote";
const IDB_NAME = "scv";
const IDB_STORE = "kv";

export type LocalVote = { city: string; at: string };

// ---------- IndexedDB 小工具 ----------
function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const d = await idb();
  if (!d) return null;
  return new Promise((resolve) => {
    try {
      const r = d.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
      r.onsuccess = () => resolve((r.result as T) ?? null);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const d = await idb();
  if (!d) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = d.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 無痕模式等情況會失敗，沒關係 */
  }
}

// ---------- 本機代碼 ----------
export async function getDeviceToken(): Promise<string> {
  const fromLs = lsGet(LS_TOKEN);
  const fromIdb = await idbGet<string>(LS_TOKEN);
  let token = fromLs || fromIdb;
  if (!token) {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // 任何一邊被清掉，就由另一邊補回
  if (fromLs !== token) lsSet(LS_TOKEN, token);
  if (fromIdb !== token) await idbSet(LS_TOKEN, token);
  return token;
}

// ---------- 裝置指紋 ----------
let fpPromise: Promise<string | null> | null = null;
export function getVisitorId(): Promise<string | null> {
  if (!fpPromise) {
    fpPromise = import("@fingerprintjs/fingerprintjs")
      .then((FP) => FP.load({ monitoring: false })) // 關閉 FingerprintJS 的使用統計回傳
      .then((agent) => agent.get())
      .then((r) => r.visitorId)
      .catch(() => null);
  }
  return fpPromise;
}

export async function getDeviceIds() {
  const [visitorId, deviceToken] = await Promise.all([getVisitorId(), getDeviceToken()]);
  return { visitorId, deviceToken };
}

// ---------- 本機投票紀錄 ----------
export async function getLocalVote(): Promise<LocalVote | null> {
  const raw = lsGet(LS_VOTE);
  let v: LocalVote | null = null;
  try {
    v = raw ? (JSON.parse(raw) as LocalVote) : null;
  } catch {
    v = null;
  }
  if (!v) v = await idbGet<LocalVote>(LS_VOTE);
  if (v) await setLocalVote(v); // 互相補回
  return v;
}

export async function setLocalVote(v: LocalVote) {
  lsSet(LS_VOTE, JSON.stringify(v));
  await idbSet(LS_VOTE, v);
}
