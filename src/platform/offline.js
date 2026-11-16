// 離線使用：首頁的「下載教材」區塊、離線打開還沒下載的單元時的提示。
// 快取由 service worker（vite-plugin-pwa 產生）負責：這裡只要把學期包與圖檔請求一次，
// service worker 的 runtimeCaching（CacheFirst）就會把它們存起來。
import { PACKS, SUBJECTS } from '../content/catalog.js';
import { formatRoute } from './router.js';
import { h, GRADE_NAMES } from './views/dom.js';

const hasSW = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

/** service worker 已啟用並接管這個頁面：之後的請求才會經過快取。 */
export async function isOfflineReady() {
  if (!hasSW()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!(reg && reg.active && navigator.serviceWorker.controller);
}

// 等 service worker 接管頁面（第一次造訪時，啟用後要再一下子才會接管）。最多等 timeout 毫秒。
async function waitForController(timeout = 10000) {
  if (!hasSW()) return;
  const sw = navigator.serviceWorker;
  if (sw.controller) return;
  await Promise.race([
    sw.ready.then(() => sw.controller || new Promise(res => sw.addEventListener('controllerchange', res, { once: true }))),
    new Promise(res => setTimeout(res, timeout)),
  ]);
}

/**
 * 對每個 pack 呼叫 pack.load()，並 fetch pack.assets 列出的每個網址，交給 service worker 快取。
 * 任何一項失敗就丟出錯誤（呼叫端顯示「下載失敗」）。
 */
export async function downloadPacks(packs, onProgress = () => {}) {
  await waitForController();
  const jobs = packs.flatMap(p => [
    () => p.load(),
    ...(p.assets || []).map(path => async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
      if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      await res.arrayBuffer();
    }),
  ]);
  let done = 0;
  onProgress(done, jobs.length);
  for (const job of jobs) {
    await job();
    onProgress(++done, jobs.length);
  }
}

// 依「年級＋科目」分組：同一個年級科目的學期包一起下載。
function groups() {
  const map = new Map();
  for (const p of PACKS) {
    const key = `${p.grade}-${p.subject}`;
    if (!map.has(key)) map.set(key, { key, label: `${GRADE_NAMES[p.grade - 1]} ${SUBJECTS[p.subject].name}`, packs: [] });
    map.get(key).packs.push(p);
  }
  return [...map.values()];
}

/** 首頁的「📥 下載教材，離線使用」區塊。瀏覽器不支援 service worker 時不顯示。 */
export function offlineSection() {
  if (!hasSW()) return null;
  const status = h('p', { className: 'offline-status', role: 'status' });
  const boxes = groups().map(g => {
    const input = h('input', { type: 'checkbox', value: g.key, id: `dl-${g.key}` });
    return { g, input, row: h('label', { className: 'offline-pick', htmlFor: `dl-${g.key}` }, input, ` ${g.label}`) };
  });
  const btn = h('button', { type: 'button', className: 'offline-btn' }, '下載');
  btn.onclick = async () => {
    const packs = boxes.filter(b => b.input.checked).flatMap(b => b.g.packs);
    if (!packs.length) {
      status.textContent = '請先勾選要下載的年級與科目。';
      return;
    }
    btn.disabled = true;
    try {
      await downloadPacks(packs, (done, total) => { status.textContent = `下載中 ${done}/${total}`; });
      status.textContent = (await isOfflineReady())
        ? '✅ 可以離線使用了'
        : '已下載，但這個瀏覽器還沒準備好離線使用，請重新整理後再試一次。';
    } catch (err) {
      console.error(err);
      status.textContent = '下載失敗，請確認網路連線後再試一次。';
    } finally {
      btn.disabled = false;
    }
  };
  return h('details', { id: 'offlineBox', className: 'offline', open: true },
    h('summary', {}, '📥 下載教材，離線使用'),
    h('p', { className: 'offline-hint' }, '勾選要帶著走的教材，下載後沒有網路也能打開。'),
    h('div', { className: 'offline-list' }, boxes.map(b => b.row)),
    btn,
    status);
}

/** 離線打開還沒下載的單元：顯示提示與回首頁按鈕，不出現空白頁。 */
export function renderNotDownloaded(container) {
  container.replaceChildren(h('div', { id: 'notDownloaded', className: 'not-downloaded' },
    h('div', { className: 'big' }, '📴'),
    h('p', {}, '這個單元還沒下載，連上網路後再打開一次就會存起來。'),
    h('a', { className: 'bigbtn', href: formatRoute({ view: 'home' }) }, '🏠 回首頁')));
}
