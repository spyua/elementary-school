// 啟動：依路由顯示首頁或單元畫面。
// 目前首頁只是 g1a 單元的簡單清單；Task 7 會換成正式的首頁、年級與學期畫面，
// Task 4 會接上真正的單元播放引擎。
import { PACKS, findPack, findUnit } from './content/catalog.js';
import { onRoute, navigate, formatRoute } from './platform/router.js';

const $ = s => document.querySelector(s);

function showHome() {
  $('#lesson').classList.add('hidden');
  $('#home').classList.remove('hidden');
  $('#homeBtn').classList.add('hidden');
  const box = $('#units');
  box.replaceChildren();
  for (const pack of PACKS) {
    const base = { grade: pack.grade, subject: pack.subject, semester: pack.semester };
    for (const ch of pack.chapters) {
      const h = document.createElement('h3');
      h.className = 'chap';
      h.textContent = ch.name;
      box.appendChild(h);
      const keys = [...ch.units, ...(ch.review ? [ch.review] : [])];
      for (const key of keys) {
        const meta = findUnit(pack, key);
        const a = document.createElement('a');
        a.className = ch.review === key ? 'unit review' : 'unit';
        a.href = formatRoute({ view: 'unit', ...base, key });
        const ic = document.createElement('div');
        ic.className = 'ic';
        ic.textContent = meta.icon || '🏆';
        const nm = document.createElement('div');
        nm.className = 'nm';
        nm.textContent = meta.name || meta.title;
        const ds = document.createElement('div');
        ds.className = 'ds';
        ds.textContent = meta.desc;
        a.append(ic, nm, ds);
        box.appendChild(a);
      }
    }
  }
}

function showUnit(route) {
  const meta = findUnit(findPack(route.grade, route.subject, route.semester), route.key);
  $('#home').classList.add('hidden');
  $('#lesson').classList.remove('hidden');
  $('#homeBtn').classList.remove('hidden');
  $('#stTxt').textContent = `${meta.icon || '🏆'} ${meta.name || meta.title}`;
}

$('#homeBtn').onclick = () => navigate({ view: 'home' });

onRoute(route => {
  if (route.view === 'unit') showUnit(route);
  else showHome();
});
