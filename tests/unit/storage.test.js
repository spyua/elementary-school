import {
  STORAGE_KEY, defaultState, loadState, saveState, safeStorage,
  recordResult, markVisited, getStars, addProfile, removeProfile, switchProfile,
  exportState, importState, ImportError, nextUnit,
} from '../../src/platform/storage.js';

const T = '2026-11-16T08:00:00.000Z';

// 簡單的記憶體 Storage，用來隔離每個測試。
function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
  };
}

test('沒有資料時回傳預設狀態', () => expect(loadState(memStorage()).profiles[defaultState().activeProfile].name).toBe('小朋友'));

test('資料損毀時回傳預設狀態', () => {
  const s = memStorage({ 'esp:v1': '{壞掉' });
  expect(loadState(s)).toEqual(defaultState());
});

test('資料結構被改壞時回傳預設狀態', () => {
  for (const bad of ['null', '[]', '{"version":1}', '{"version":1,"activeProfile":"x","profiles":{},"settings":{}}']) {
    expect(loadState(memStorage({ [STORAGE_KEY]: bad }))).toEqual(defaultState());
  }
});

test('localStorage 丟錯誤時仍可讀寫', () => {
  const desc = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  try {
    const st = safeStorage();
    st.setItem('k', 'v');
    expect(st.getItem('k')).toBe('v');
    const s = recordResult(defaultState(), 'G1A-M-num10', 2, T);
    saveState(s, st);
    expect(loadState(st)).toEqual(s);
  } finally {
    if (desc) Object.defineProperty(window, 'localStorage', desc);
    else delete window.localStorage;
  }
});

test('setItem 丟錯誤（空間已滿）時 saveState 不會中斷', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem() {} };
  expect(() => saveState(defaultState(), st)).not.toThrow();
});

test('存檔後讀回相同', () => {
  const st = memStorage();
  const s = markVisited(recordResult(defaultState(), 'G1A-M-add', 1, T), 'G1A-M-add', T);
  saveState(s, st);
  expect(loadState(st)).toEqual(s);
});

test('星數只保留最高', () => {
  let s = recordResult(defaultState(), 'G1A-M-curve', 3, T);
  s = recordResult(s, 'G1A-M-curve', 1, T);
  expect(getStars(s, 'G1A-M-curve')).toBe(3);
});

test('修改函式不直接修改傳入的 state', () => {
  const s = defaultState();
  const snap = JSON.parse(JSON.stringify(s));
  recordResult(s, 'G1A-M-num10', 2, T);
  markVisited(s, 'G1A-M-num10', T);
  addProfile(s, { name: '哥哥', icon: '🐯' });
  expect(s).toEqual(snap);
});

test('markVisited 同時更新 lastUnit', () => {
  const s = markVisited(defaultState(), 'G1A-M-line', T);
  expect(s.profiles[s.activeProfile].lastUnit).toBe('G1A-M-line');
  expect(s.profiles[s.activeProfile].progress['G1A-M-line'].visitedAt).toBe(T);
  expect(getStars(s, 'G1A-M-line')).toBe(0);
});

test('不同孩子的進度分開', () => {
  const base = defaultState();
  const first = base.activeProfile;
  const { state, id } = addProfile(base, { name: '妹妹', icon: '🐰' });
  expect(id).not.toBe(first);
  let s = switchProfile(state, id);
  s = recordResult(s, 'G1A-M-num10', 3, T);
  expect(getStars(s, 'G1A-M-num10')).toBe(3);
  s = switchProfile(s, first);
  expect(getStars(s, 'G1A-M-num10')).toBe(0);
});

test('切換到不存在的孩子會丟錯', () => expect(() => switchProfile(defaultState(), 'nope')).toThrow());

test('刪除目前的孩子後，改用剩下的檔案', () => {
  const base = defaultState();
  const { state, id } = addProfile(base, { name: '妹妹', icon: '🐰' });
  const s = removeProfile(state, base.activeProfile);
  expect(s.activeProfile).toBe(id);
  expect(s.profiles[base.activeProfile]).toBeUndefined();
});

test('不能刪除最後一個孩子', () => expect(() => removeProfile(defaultState(), defaultState().activeProfile)).toThrow());

test('匯出再匯入完全相同', () => {
  const s = recordResult(defaultState(), 'G1A-M-num10', 2, T);
  expect(importState(exportState(s, T))).toEqual(s);
});

test('匯出格式帶有 app、version、exportedAt', () => {
  const o = JSON.parse(exportState(defaultState(), T));
  expect(o).toMatchObject({ app: 'elementary-school', version: 1, exportedAt: T });
  expect(o.data).toEqual(defaultState());
});

const BAD_IMPORTS = ['', '{}', '[]', '{"app":"other","version":1,"data":{}}', '{"app":"elementary-school","version":99,"data":{}}', 'not json',
  '{"app":"elementary-school","version":1,"data":{}}', 'null'];
test.each(BAD_IMPORTS)('錯誤的匯入內容丟出 ImportError：%s', t => expect(() => importState(t)).toThrow(ImportError));

function stateFrom({ lastUnit, stars }) {
  let s = defaultState();
  for (const [u, n] of Object.entries(stars)) s = recordResult(s, u, n, T);
  const p = s.activeProfile;
  return { ...s, profiles: { ...s.profiles, [p]: { ...s.profiles[p], lastUnit } } };
}

test.each([
  [{ lastUnit: null, stars: {} }, 'A'],
  [{ lastUnit: 'B', stars: { B: 1 } }, 'B'],
  [{ lastUnit: 'B', stars: { B: 3 } }, 'C'],
  [{ lastUnit: 'C', stars: { C: 3, A: 3, B: 2 } }, 'B'],
  [{ lastUnit: 'B', stars: { A: 3, B: 3, C: 3 } }, 'B'],
  [{ lastUnit: 'GONE', stars: {} }, 'A'],
  [{ lastUnit: null, stars: { A: 3, B: 3, C: 3 } }, 'A'],
])('nextUnit %#', (cfg, want) => expect(nextUnit(stateFrom(cfg), ['A', 'B', 'C'])).toBe(want));
