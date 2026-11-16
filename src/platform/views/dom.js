// 各畫面共用的小工具：建立 DOM 元素。
// 一律用 textContent 放文字，不用 innerHTML，避免孩子暱稱等使用者輸入被當成 HTML。

/**
 * h('a', { className: 'unit', href: '#/' }, child1, 'text', ...)
 * props 的鍵若是元素的屬性（className、href、onclick、disabled…）就直接設定，
 * 其他鍵（例如 aria-*、data-*、type）用 setAttribute。
 */
export function h(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k in e && !k.includes('-')) e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === undefined || c === null || c === false) continue;
    e.append(c instanceof Node ? c : String(c));
  }
  return e;
}

export const GRADE_NAMES = ['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'];

export function stars(n) {
  const k = Math.max(0, Math.min(3, n || 0));
  return '⭐'.repeat(k) + '☆'.repeat(3 - k);
}
