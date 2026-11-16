// 學期畫面：依章節列出單元卡與總複習卡，底部是「給爸媽」區。
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
  for (const ch of chaptersOf(pack)) {
    if (ch.name) grid.append(h('h3', { className: 'chap' }, ch.name));
    for (const key of ch.units) {
      const meta = findUnit(pack, key);
      if (meta) grid.append(unitCard(pack, meta, ctx.state, false));
    }
    if (ch.review) {
      const meta = findUnit(pack, ch.review);
      if (meta) grid.append(unitCard(pack, meta, ctx.state, true));
    }
  }
  nodes.push(grid, parentBox(pack));
  container.replaceChildren(...nodes);
}
