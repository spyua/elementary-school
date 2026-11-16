// 致謝頁：依 src/content/credits.json 列出所有素材、套件、字型的來源與授權。
import credits from '../../content/credits.json';
import { formatRoute } from '../router.js';
import { h } from './dom.js';

export function render(container) {
  const list = h('ul', { className: 'credits' },
    credits.map(c => h('li', {},
      h('div', {},
        h('a', { className: 'nm', href: c.url, target: '_blank', rel: 'noopener noreferrer' }, c.name),
        h('span', { className: 'tag' }, c.license)),
      h('div', { className: 'meta' }, `作者：${c.author}`),
      h('div', {}, c.usage))));

  container.replaceChildren(
    h('h2', { className: 'view-title' }, '致謝與授權'),
    h('div', { className: 'panel' },
      h('p', {}, '這個網站使用了下面這些開放授權的素材、套件和字型，謝謝作者們的分享。'),
      list),
    h('div', { className: 'panel' },
      h('p', {}, '網站本身的程式碼以 MIT 授權釋出。各項素材仍保留原本的授權。')),
    h('p', { className: 'home-foot' }, h('a', { href: formatRoute({ view: 'home' }) }, '回首頁')));
}
