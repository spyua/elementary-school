// 進度、孩子檔案、匯出匯入。
// 資料只存在瀏覽器；localStorage 不能用時改用記憶體暫存，網站照常運作。
// 所有修改函式都回傳新的物件，不直接修改傳入的 state。

export const STORAGE_KEY = 'esp:v1';
const APP = 'elementary-school';
const VERSION = 1;
const DEFAULT_ID = 'p1';

export class ImportError extends Error {
  constructor(message = '這不是進度檔') {
    super(message);
    this.name = 'ImportError';
  }
}

export function defaultState() {
  return {
    version: VERSION,
    activeProfile: DEFAULT_ID,
    profiles: {
      [DEFAULT_ID]: { name: '小朋友', icon: '🐣', lastUnit: null, progress: {} },
    },
    settings: { muted: false, sfxMuted: false },
  };
}

// ---- 儲存空間 ----

function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
  };
}

// 同一個分頁內共用一份記憶體暫存，切換畫面時進度不會消失。
let fallback = null;

export function safeStorage() {
  try {
    const ls = window.localStorage;
    const probe = '__esp_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    if (!fallback) fallback = memoryStorage();
    return fallback;
  }
}

// ---- 驗證 ----

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

function isValidProfile(p) {
  if (!isObj(p) || typeof p.name !== 'string' || typeof p.icon !== 'string') return false;
  if (p.lastUnit !== null && typeof p.lastUnit !== 'string') return false;
  if (!isObj(p.progress)) return false;
  return Object.values(p.progress).every(r =>
    isObj(r) && [0, 1, 2, 3].includes(r.stars) && typeof r.visitedAt === 'string');
}

function isValidState(s) {
  return isObj(s)
    && s.version === VERSION
    && typeof s.activeProfile === 'string'
    && isObj(s.profiles)
    && Object.prototype.hasOwnProperty.call(s.profiles, s.activeProfile)
    && Object.values(s.profiles).every(isValidProfile)
    && isObj(s.settings)
    && typeof s.settings.muted === 'boolean'
    && typeof s.settings.sfxMuted === 'boolean';
}

// ---- 讀寫 ----

export function loadState(storage = safeStorage()) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw == null) return defaultState();
    const s = JSON.parse(raw);
    return isValidState(s) ? s : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(state, storage = safeStorage()) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 空間已滿或被封鎖：本次不存檔，畫面照常運作。
  }
}

// ---- 進度 ----

function updateActive(state, fn) {
  const id = state.activeProfile;
  return { ...state, profiles: { ...state.profiles, [id]: fn(state.profiles[id]) } };
}

export function getStars(state, unitId) {
  return state.profiles[state.activeProfile]?.progress[unitId]?.stars ?? 0;
}

export function recordResult(state, unitId, stars, nowIso) {
  const n = Math.max(0, Math.min(3, Math.trunc(Number(stars) || 0)));
  return updateActive(state, p => {
    const prev = p.progress[unitId];
    return {
      ...p,
      progress: {
        ...p.progress,
        [unitId]: { stars: Math.max(prev?.stars ?? 0, n), visitedAt: nowIso },
      },
    };
  });
}

export function markVisited(state, unitId, nowIso) {
  return updateActive(state, p => ({
    ...p,
    lastUnit: unitId,
    progress: {
      ...p.progress,
      [unitId]: { stars: p.progress[unitId]?.stars ?? 0, visitedAt: nowIso },
    },
  }));
}

// ---- 孩子檔案 ----

export function addProfile(state, { name, icon }) {
  let i = 1;
  while (Object.prototype.hasOwnProperty.call(state.profiles, `p${i}`)) i++;
  const id = `p${i}`;
  return {
    id,
    state: {
      ...state,
      profiles: { ...state.profiles, [id]: { name, icon, lastUnit: null, progress: {} } },
    },
  };
}

export function removeProfile(state, id) {
  if (!Object.prototype.hasOwnProperty.call(state.profiles, id)) throw new Error(`沒有這個孩子檔案：${id}`);
  const ids = Object.keys(state.profiles);
  if (ids.length <= 1) throw new Error('不能刪除最後一個孩子檔案');
  const profiles = { ...state.profiles };
  delete profiles[id];
  const activeProfile = state.activeProfile === id ? Object.keys(profiles)[0] : state.activeProfile;
  return { ...state, activeProfile, profiles };
}

export function switchProfile(state, id) {
  if (!Object.prototype.hasOwnProperty.call(state.profiles, id)) throw new Error(`沒有這個孩子檔案：${id}`);
  return { ...state, activeProfile: id };
}

// ---- 匯出匯入 ----

export function exportState(state, nowIso) {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: nowIso, data: state }, null, 2);
}

export function importState(text) {
  let o;
  try {
    o = JSON.parse(text);
  } catch {
    throw new ImportError();
  }
  if (!isObj(o) || o.app !== APP || o.version !== VERSION || !isValidState(o.data)) throw new ImportError();
  return o.data;
}

// ---- 下一個單元 ----

export function nextUnit(state, orderedUnitIds) {
  const last = state.profiles[state.activeProfile]?.lastUnit ?? null;
  const notDone = id => getStars(state, id) < 3;
  const idx = last == null ? -1 : orderedUnitIds.indexOf(last);

  // 1. 上次的單元還沒滿星 → 繼續上次的單元。
  if (idx >= 0 && notDone(last)) return last;
  // 2. 上次的單元之後第一個未滿星的；找不到再從開頭找。
  const after = orderedUnitIds.slice(idx + 1).find(notDone);
  if (after) return after;
  const fromStart = orderedUnitIds.find(notDone);
  if (fromStart) return fromStart;
  // 3. 全部滿星 → 回到上次的單元；沒有就回傳第一個。
  return idx >= 0 ? last : orderedUnitIds[0];
}
