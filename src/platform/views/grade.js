// 年級畫面：每個科目一張卡片。
// 有學期包的科目可以點；只有試玩包的加上「試玩」標籤；沒有內容的顯示「準備中」。
import { PACKS, SUBJECTS } from '../../content/catalog.js';
import { formatRoute } from '../router.js';
import { h, GRADE_NAMES } from './dom.js';

export function render(container, ctx, route) {
  const grid = h('div', { className: 'grid subjects' });
  for (const [subject, info] of Object.entries(SUBJECTS)) {
    // 正式學期包排前面，試玩包排後面。
    const packs = PACKS.filter(p => p.grade === route.grade && p.subject === subject)
      .sort((a, b) => Number(!!a.trial) - Number(!!b.trial));
    if (!packs.length) {
      grid.append(h('div', { className: 'subject-card soon', 'aria-disabled': 'true' },
        h('div', { className: 'ic' }, info.icon),
        h('div', { className: 'nm' }, info.name),
        h('span', { className: 'tag soon-tag' }, '準備中')));
      continue;
    }
    for (const pack of packs) {
      const href = formatRoute({ view: 'semester', grade: pack.grade, subject: pack.subject, semester: pack.semester });
      grid.append(h('a', { className: 'subject-card', href },
        h('div', { className: 'ic' }, info.icon),
        h('div', { className: 'nm' }, info.name, pack.trial ? h('span', { className: 'tag trial' }, '試玩') : null),
        pack.trial ? null : h('div', { className: 'ds' }, pack.label)));
    }
  }
  container.replaceChildren(
    h('h2', { className: 'view-title' }, GRADE_NAMES[route.grade - 1]),
    grid,
  );
}
