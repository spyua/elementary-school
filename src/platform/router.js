// Hash 路由：網址一律是 # 開頭的路徑，例如 #/g1/math/a/num10。
// parseRoute 會用 catalog 檢查年級、科目、學期、單元是否真的存在，
// 不存在（打錯字、舊書籤）一律回首頁，避免出現空白頁。
import { PACKS, findPack, findUnit } from '../content/catalog.js';

const HOME = Object.freeze({ view: 'home' });

export function parseRoute(hash) {
  let parts;
  try {
    parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return { ...HOME };
  }
  if (parts.length === 0) return { ...HOME };

  if (parts.length === 1 && parts[0] === 'credits') return { view: 'credits' };
  if (parts.length === 1 && parts[0] === 'profiles') return { view: 'profiles' };

  const m = /^g(\d)$/.exec(parts[0]);
  if (!m || parts.length > 4) return { ...HOME };
  const grade = Number(m[1]);
  if (!PACKS.some(p => p.grade === grade)) return { ...HOME };
  if (parts.length === 1) return { view: 'grade', grade };
  if (parts.length === 2) return { ...HOME };

  const [, subject, semester, key] = parts;
  const pack = findPack(grade, subject, semester);
  if (!pack) return { ...HOME };
  if (parts.length === 3) return { view: 'semester', grade, subject, semester };

  if (!findUnit(pack, key)) return { ...HOME };
  return { view: 'unit', grade, subject, semester, key };
}

export function formatRoute(route) {
  const enc = encodeURIComponent;
  switch (route && route.view) {
    case 'grade': return `#/g${route.grade}`;
    case 'semester': return `#/g${route.grade}/${enc(route.subject)}/${enc(route.semester)}`;
    case 'unit': return `#/g${route.grade}/${enc(route.subject)}/${enc(route.semester)}/${enc(route.key)}`;
    case 'credits': return '#/credits';
    case 'profiles': return '#/profiles';
    default: return '#/';
  }
}

// 監聽 hashchange；註冊時先依目前網址呼叫一次。
export function onRoute(handler) {
  window.addEventListener('hashchange', () => handler(parseRoute(window.location.hash)));
  handler(parseRoute(window.location.hash));
}

export function navigate(route) {
  window.location.hash = formatRoute(route);
}
