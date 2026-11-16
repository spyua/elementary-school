// 首頁：最上方「繼續學習」大按鈕，下方一到六年級卡片，最底下是致謝頁連結。
import { PACKS, allUnits } from '../../content/catalog.js';
import { formatRoute } from '../router.js';
import { nextUnit } from '../storage.js';
import { h, GRADE_NAMES } from './dom.js';
import { icon } from '../icons.js';
import { offlineSection } from '../offline.js';

export function render(container, ctx) {
  const list = allUnits();
  const nodes = [];

  if (list.length) {
    const id = nextUnit(ctx.state, list.map(x => x.unit.id));
    const { pack, unit } = list.find(x => x.unit.id === id) || list[0];
    const href = formatRoute({ view: 'unit', grade: pack.grade, subject: pack.subject, semester: pack.semester, key: unit.key });
    nodes.push(h('a', { id: 'continue', className: 'continue', href },
      h('span', { className: 'play' }, icon('play', 36)),
      h('span', {}, `繼續學習：${unit.icon} ${unit.name}`)));
  }

  nodes.push(h('h2', { className: 'pick' }, '自己選：'));
  const grid = h('div', { className: 'grid grades' });
  GRADE_NAMES.forEach((name, i) => {
    const grade = i + 1;
    if (PACKS.some(p => p.grade === grade)) {
      grid.append(h('a', { className: 'grade-card', href: formatRoute({ view: 'grade', grade }) },
        h('div', { className: 'nm' }, name)));
    } else {
      grid.append(h('div', { className: 'grade-card soon', 'aria-disabled': 'true' },
        h('div', { className: 'nm' }, name),
        h('span', { className: 'tag soon-tag' }, '準備中')));
    }
  });
  nodes.push(grid);

  // 「下載教材，離線使用」：勾選年級與科目，預先存到瀏覽器。
  const offline = offlineSection();
  if (offline) nodes.push(offline);

  // 頁尾：致謝與授權頁的連結。
  nodes.push(h('p', { className: 'home-foot' },
    h('a', { id: 'creditsLink', href: formatRoute({ view: 'credits' }) }, icon('heart', 28), ' 致謝與授權')));

  container.replaceChildren(...nodes);
}
