// 啟動：依路由顯示首頁或單元畫面。
// 目前首頁只是 g1a 單元的簡單清單；Task 7 會換成正式的首頁、年級與學期畫面。
import { PACKS, findPack, findUnit } from './content/catalog.js';
import { onRoute, navigate, formatRoute } from './platform/router.js';
import { S } from './engine/state.js';
import { stopSpeech } from './engine/speech.js';
import { openUnit, closeLesson, unlockAudio } from './engine/lesson.js';
import { setPracticeHooks } from './engine/practice.js';

const $ = s => document.querySelector(s);

// 每次換畫面就 +1；學期包載入完成時若已經換到別的畫面，就不要再打開單元。
let routeToken = 0;

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
  window.scrollTo(0, 0);
}

async function showUnit(route, token) {
  const pack = findPack(route.grade, route.subject, route.semester);
  const meta = findUnit(pack, route.key);
  $('#home').classList.add('hidden');
  $('#lesson').classList.remove('hidden');
  $('#homeBtn').classList.remove('hidden');
  $('#stTxt').textContent = `${meta.icon || '🏆'} ${meta.name || meta.title}`;
  const mod = await pack.load();
  if (token !== routeToken) return;
  const { bodies, reviews } = mod.default;
  const body = bodies[route.key] || reviews[route.key];
  if (!body) {
    navigate({ view: 'home' });
    return;
  }
  openUnit({ ...meta, ...body });
}

setPracticeHooks({
  // Task 6 會改成寫進進度存檔。
  onResult() {},
  goHome: () => navigate({ view: 'home' }),
});

$('#homeBtn').onclick = () => navigate({ view: 'home' });
$('#startBtn').onclick = unlockAudio;
$('#mute').onclick = e => {
  S.muted = !S.muted;
  e.target.textContent = S.muted ? '🔇' : '🔊';
  if (S.muted) stopSpeech();
};

onRoute(route => {
  const token = ++routeToken;
  closeLesson();
  if (route.view === 'unit') {
    showUnit(route, token).catch(err => {
      console.error(err);
      if (token === routeToken) navigate({ view: 'home' });
    });
  } else {
    showHome();
  }
});
