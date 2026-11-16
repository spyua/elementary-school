// 啟動：載入進度、依路由顯示首頁、年級、學期、孩子檔案或單元畫面。
import { findPack, findUnit } from './content/catalog.js';
import { onRoute, navigate } from './platform/router.js';
import { loadState, saveState, markVisited, recordResult } from './platform/storage.js';
import { S } from './engine/state.js';
import { stopSpeech } from './engine/speech.js';
import { openUnit, closeLesson, unlockAudio } from './engine/lesson.js';
import { setPracticeHooks } from './engine/practice.js';
import * as homeView from './platform/views/home.js';
import * as gradeView from './platform/views/grade.js';
import * as semesterView from './platform/views/semester.js';
import * as profilesView from './platform/views/profiles.js';

const $ = s => document.querySelector(s);
const VIEWS = { home: homeView, grade: gradeView, semester: semesterView, profiles: profilesView };

let state = loadState();
let current = { view: 'home' };
// 每次換畫面就 +1；學期包載入完成時若已經換到別的畫面，就不要再打開單元。
let routeToken = 0;

const ctx = {
  get state() { return state; },
  setState(next) {
    state = next;
    saveState(state);
    updateHeader();
    // 單元畫面不重畫（動畫正在播）；其他畫面依新狀態重畫。
    if (current.view !== 'unit') showView(current);
  },
};

const semesterOf = r => ({ view: 'semester', grade: r.grade, subject: r.subject, semester: r.semester });

function updateHeader() {
  const p = state.profiles[state.activeProfile];
  const btn = $('#profileBtn');
  btn.textContent = p.icon;
  btn.title = `孩子檔案：${p.name}`;
  btn.classList.toggle('hidden', current.view !== 'home');
  $('#homeBtn').classList.toggle('hidden', current.view === 'home');
}

function showView(route) {
  $('#lesson').classList.add('hidden');
  const box = $('#home');
  box.classList.remove('hidden');
  (VIEWS[route.view] || homeView).render(box, ctx, route);
}

async function showUnit(route, token) {
  const pack = findPack(route.grade, route.subject, route.semester);
  const meta = findUnit(pack, route.key);
  $('#home').classList.add('hidden');
  $('#lesson').classList.remove('hidden');
  $('#stTxt').textContent = `${meta.icon || '🏆'} ${meta.name || meta.title}`;
  const mod = await pack.load();
  if (token !== routeToken) return;
  const { bodies, reviews } = mod.default;
  const body = bodies[route.key] || reviews[route.key];
  if (!body) {
    navigate({ view: 'home' });
    return;
  }
  ctx.setState(markVisited(state, meta.id, new Date().toISOString()));
  openUnit({ ...meta, ...body });
}

setPracticeHooks({
  onResult(unitId, stars) {
    ctx.setState(recordResult(state, unitId, stars, new Date().toISOString()));
  },
  // 結果頁的「回首頁」回到該單元所在的學期畫面。
  goHome: () => navigate(current.view === 'unit' ? semesterOf(current) : { view: 'home' }),
});

$('#homeBtn').onclick = () => navigate(current.view === 'unit' ? semesterOf(current) : { view: 'home' });
$('#profileBtn').onclick = () => navigate({ view: 'profiles' });
$('#startBtn').onclick = unlockAudio;
$('#mute').onclick = e => {
  S.muted = !S.muted;
  e.target.textContent = S.muted ? '🔇' : '🔊';
  if (S.muted) stopSpeech();
};

onRoute(route => {
  const token = ++routeToken;
  // 離開單元（或換到別的單元）時，一律先停止動畫與語音、清空畫布。
  closeLesson();
  current = route;
  updateHeader();
  if (route.view === 'unit') {
    showUnit(route, token).catch(err => {
      console.error(err);
      if (token === routeToken) navigate({ view: 'home' });
    });
  } else {
    showView(route);
    window.scrollTo(0, 0);
  }
});
