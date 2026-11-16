// 學期畫面：依章節列出單元卡與總複習卡，底部是「給爸媽」區。
// 有 terms 的學期包（例如一上數學）先依期中、期末分成兩組，每組有大標題，組尾放一張考試卡。
// 課綱代碼與課本章名只放在「給爸媽」區，不出現在孩子看的單元卡上。
import { SUBJECTS, findPack, findUnit } from '../../content/catalog.js';
import { formatRoute } from '../router.js';
import { getStars } from '../storage.js';
import { h, GRADE_NAMES, stars } from './dom.js';

// 課本版本代號 → 顯示名稱。
const VERSION_NAMES = { hanlin: '翰林版' };

function unitCard(pack, meta, state, isReview) {
  const href = formatRoute({ view: 'unit', grade: pack.grade, subject: pack.subject, semester: pack.semester, key: meta.key });
  return h('a', { className: isReview ? 'unit review' : 'unit', href },
    h('div', { className: 'ic' }, isReview ? '🏆' : meta.icon),
    h('div', { className: 'nm' }, isReview ? meta.title : meta.name),
    h('div', { className: 'ds' }, meta.desc),
    h('div', { className: 'st' }, stars(getStars(state, meta.id))));
}

/* 考試卡：圖示 📝，顯示星星；樣式用 unit exam。 */
function examCard(pack, meta, state) {
  const href = formatRoute({ view: 'unit', grade: pack.grade, subject: pack.subject, semester: pack.semester, key: meta.key });
  return h('a', { className: 'unit exam', href },
    h('div', { className: 'ic' }, meta.icon || '📝'),
    h('div', { className: 'nm' }, meta.title),
    h('div', { className: 'ds' }, meta.desc),
    h('div', { className: 'st' }, stars(getStars(state, meta.id))));
}

/* 一章的標題、單元卡與總複習卡。 */
function appendChapter(grid, pack, ch, state) {
  if (ch.name) grid.append(h('h3', { className: 'chap' }, ch.name));
  for (const key of ch.units) {
    const meta = findUnit(pack, key);
    if (meta) grid.append(unitCard(pack, meta, state, false));
  }
  if (ch.review) {
    const meta = findUnit(pack, ch.review);
    if (meta) grid.append(unitCard(pack, meta, state, true));
  }
}

function chaptersOf(pack) {
  if (pack.chapters && pack.chapters.length) return pack.chapters;
  // 沒有分章的學期包（例如試玩包）：全部單元放在同一組，總複習接在後面。
  return [{ name: '', units: pack.units.map(u => u.key) },
    ...pack.reviews.map(r => ({ name: '', units: [], review: r.key }))];
}

function parentBox(pack) {
  const box = h('details', { className: 'parent' },
    h('summary', {}, '👨‍👩‍👦 給爸媽：怎麼陪孩子用這個網站'));
  const guide = pack.parentGuide || {};
  if (guide.principles && guide.principles.length) {
    box.append(h('h4', {}, '陪讀三原則'), h('ul', {}, guide.principles.map(p => h('li', {}, p))));
  }
  for (const u of pack.units) {
    const items = [];
    if (u.tip) items.push(h('li', {}, `💬 ${u.tip}`));
    if (u.task) items.push(h('li', {}, `🏠 生活任務：${u.task}`));
    if (u.curriculum && u.curriculum.length) items.push(h('li', {}, `📚 課綱：${u.curriculum.join('、')}`));
    for (const [v, chapter] of Object.entries(u.versions || {})) {
      items.push(h('li', {}, `📖 ${VERSION_NAMES[v] || v}：${chapter}`));
    }
    box.append(h('h4', {}, `${u.icon} ${u.name}`), h('ul', {}, items));
  }
  if (guide.reminders) {
    box.append(h('h4', {}, guide.reminders.title), h('ul', {}, guide.reminders.items.map(t => h('li', {}, t))));
  }
  return box;
}

export function render(container, ctx, route) {
  const pack = findPack(route.grade, route.subject, route.semester);
  const subject = SUBJECTS[pack.subject] || { name: pack.subject, icon: '' };
  const nodes = [
    h('h2', { className: 'view-title' }, `${GRADE_NAMES[pack.grade - 1]} ${subject.icon} ${subject.name} ${pack.label || ''}`.trim()),
  ];
  if (pack.intro) nodes.push(h('div', { className: 'intro' }, pack.intro));

  const grid = h('div', { className: 'grid' });
  if (pack.terms && pack.terms.length) {
    // 依期中、期末分組：大標題 → 該組的章節 → 考試卡
    for (const term of pack.terms) {
      grid.append(h('h3', { className: 'term', 'data-term': term.key }, `${term.name}・${term.range}`));
      for (const ch of chaptersOf(pack).filter(c => c.term === term.key)) appendChapter(grid, pack, ch, ctx.state);
      const meta = term.exam && findUnit(pack, term.exam);
      if (meta) grid.append(examCard(pack, meta, ctx.state));
    }
  } else {
    for (const ch of chaptersOf(pack)) appendChapter(grid, pack, ch, ctx.state);
  }
  nodes.push(grid, parentBox(pack));
  container.replaceChildren(...nodes);
}
