// 練習引擎（從舊檔 PRACTICE ENGINE 段搬來）。
// 題型由學期包用 registerTypes 登記到 GEN；結果與「回首頁」透過 setPracticeHooks 交給平台處理。
//
// Item 格式維持舊檔：{ mode: 'pick'|'num'|'pair'|'dual'|'classify'|'match', prompt, answer,
//   draw(): Region[], explain(id), fill?, isOk?, moves?, max?,
//   hints?: string[], boost?: Scene[], rationale?: string,   // 這三個是預留欄位
//   ask?(id) }   // 範本題目用：取代預設的「朗讀 prompt」，並在按鈕列放「🔊 再聽一次」
//
// match 模式：draw() 回傳的區域前一半是左欄、後一半是右欄；answer[i] 是左邊第 i 項對應右邊第幾項。
// 點左邊一項再點右邊一項就連一條線；再點一次已連線的項目取消；全部連好自動檢查。
import { ABORT, S } from './state.js';
import { $, pick, shuffle } from './util.js';
import { subEl, say, wait, stopSpeech, speakOne } from './speech.js';
import { playSfx } from './sfx.js';
import { el, txt, clear, paren, markShape } from './svg.js';
import { bar, clearBar, button, enterLesson } from './ui.js';
import { uiUrl } from './emoji.js';
import { confetti, starBurst, replay } from './fx.js';
import { withSeed } from './rng.js';

// 答題回饋特效：答對灑紙花（種子用題號，圖樣固定）、答錯讓記號輕搖，並通知吉祥物。
// 都是 CSS 動畫，不 await、不加按鈕、不呼叫 Math.random。
function answerFx(ok){const st=$('#stage');
  if(ok)confetti(st,{seed:(P?P.i:0)+1});else if(layer.marks&&layer.marks.childNodes.length)replay(layer.marks,'shake');
  window.dispatchEvent(new CustomEvent('lesson:answer',{detail:{ok}}));}

/** 題型登記表：key → () => Item */
export const GEN = {};

/** 登記題型；key 重複時丟錯誤，避免兩個學期包互相蓋掉。 */
export function registerTypes(types) {
  for (const k of Object.keys(types)) {
    if (Object.prototype.hasOwnProperty.call(GEN, k)) throw new Error(`題型 key 重複：${k}`);
  }
  Object.assign(GEN, types);
}

let hooks = { onResult() {}, goHome() {} };
/** 設定結果回報與回首頁的處理函式。 */
export function setPracticeHooks(h) { hooks = { ...hooks, ...h }; }
/** 目前的結果回報與回首頁處理函式（考試結果頁 exam.js 也用它存星星）。 */
export function practiceHooks() { return hooks; }

/**
 * 判斷對錯（從 check() 抽出來，練習與考試共用）。純函式，不呼叫 Math.random。
 * marks 的格式：num 是 { val }；pick／pair 是 { 區域編號: 'o' }；dual／classify 是 { 區域編號: 'v'|'o' }；
 * match 是 { 左邊 i: 右邊 j }。
 */
export function judge(item,marks){
  if(item.mode==='num')return marks.val===item.answer;
  if(item.mode==='pair')return item.isOk(Object.keys(marks).map(Number));
  if(item.mode==='pick')return +Object.keys(marks)[0]===item.answer;
  if(item.mode==='dual')return marks[item.answer.v]==='v'&&marks[item.answer.o]==='o';
  if(item.mode==='match')return item.answer.every((j,i)=>marks[i]===j);
  return item.answer.every((a,i)=>marks[i]===a);}

let P=null,item=null,marks={},tool='v',regs=[],layer={},sel=null;
/**
 * cfg: { title, types?, count?, queue?, unitId?, exam? }；unitId 是單元固定 ID，再練一次時為 null。
 * exam（考試模式，由 exam.js 傳入）：{ paper: [{type,seed,zone}], beforeItem?(i,id), crumb?(i), onItem?(i), onAnswered(entry), onEnd(log) }。
 *   beforeItem 在出題前 await（封面、休息站、每題開場）；crumb 取代預設的進度點。
 * 沒有 exam 時，練習的每一行程式都和原本一樣（對照測試靠這點）。
 */
export function startPractice(cfg){const st=$('#stage');if(st)st.dataset.mode=cfg.exam?'exam':'practice';P={cfg,i:0,correct:0,wrong:[],log:[],queue:cfg.queue||makeQueue(cfg.types,cfg.count)};enterLesson();$('#nav').classList.add('hidden');nextItem();}
/** 離開單元時清掉練習狀態（舊檔 goHome 裡的 P=null）。 */
export function resetPractice(){P=null;}
function makeQueue(types,count){let q=[];while(q.length<count)q=q.concat(shuffle(types));return q.slice(0,count);}
function updScore(){$('#score').textContent=P.cfg.exam?'':`⭐ ${P.correct}`;}
function renderCrumbP(){const c=$('#crumb');c.innerHTML='';for(let i=0;i<P.queue.length;i++){const d=document.createElement('div');d.className='dot'+(i===P.i?' on':i<P.i?' done':'');c.appendChild(d);}}
async function nextItem(){S.runId++;const id=S.runId;stopSpeech();clear();clearBar();
  if(P.i>=P.queue.length)return P.cfg.exam?P.cfg.exam.onEnd(P.log):practiceEnd(id);
  // 考試：出題前先播 exam.js 的封面、休息站與每題開場，播完才出題；地圖進度列也交給 exam.js 畫。
  if(P.cfg.exam){if(P.cfg.exam.beforeItem){try{await P.cfg.exam.beforeItem(P.i,id);}catch(e){if(e!==ABORT)console.error(e);return;}if(id!==S.runId)return;}
    if(P.cfg.exam.crumb)P.cfg.exam.crumb(P.i);else renderCrumbP();}
  else renderCrumbP();
  updScore();$('#stTxt').textContent=`${P.cfg.title}　第 ${P.i+1}/${P.queue.length} 題`;
  const ex=P.cfg.exam;
  const make=()=>{item=GEN[P.queue[P.i]]();item.type=P.queue[P.i];marks={};tool='v';sel=null;
    regs=item.draw();};
  // 考試：出題和畫圖包在 withSeed 裡，錯題重看時用同一個種子就能還原同一個畫面。
  if(ex)withSeed(ex.paper[P.i].seed,make);else make();
  layer.paren=el('g',{});layer.marks=el('g',{});layer.hit=el('g',{});
  if(item.mode==='dual'||item.mode==='classify')regs.forEach(r=>paren(r,layer.paren));
  regs.forEach((r,i)=>{const h=el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:'transparent',style:'cursor:pointer'},layer.hit);h.addEventListener('click',()=>onMark(i,id));});
  if(item.mode==='num'){for(let n=0;n<=(item.max||10);n++){const b=button(String(n),'',()=>{if(item.done||id!==S.runId)return;marks={val:n};item.fill(n,'#333');
      // 考試：點數字只是「選中」，要按「✔ 好了」才送出
      if(ex){bar.querySelectorAll('button.num').forEach(x=>x.classList.toggle('sel',x===b));examReady(true,id);return;}
      check(id);},'num');}}
  else if(item.mode!=='pick'&&item.mode!=='pair'&&item.mode!=='match'){const tv=button('✓ 打勾','',()=>setTool('v'),'tool sel');const to=button('○ 畫圈','',()=>setTool('o'),'tool');tv.dataset.t='v';to.dataset.t='o';
    button(ex?'✔ 好了':'檢查答案','#ff8c42',()=>check(id)).id='checkBtn';}
  // 考試：每題都有「🔊 再聽一次」
  if(ex){const it=item;button('🔊 再聽一次','#3a86ff',()=>{if(it.done||id!==S.runId)return;stopSpeech();(it.ask?it.ask(id):say(it.prompt,id)).catch(()=>{});},'replayQ');
    if(ex.onItem)ex.onItem(P.i);}
  else if(item.ask){const it=item;button('🔊 再聽一次','#3a86ff',()=>{if(it.done||id!==S.runId)return;stopSpeech();it.ask(id).catch(()=>{});},'replayQ');}
  subEl.textContent=item.prompt;await (item.ask?item.ask(id):say(item.prompt,id)).catch(()=>{});
  if(id===S.runId&&(item.mode==='dual'||item.mode==='classify')&&!item.done&&!item.hinted){item.hinted=1;subEl.textContent=item.prompt+'（先選 ✓ 或 ○，再點圖）';}
}
function setTool(t){tool=t;bar.querySelectorAll('.tool').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));}
function redrawMarks(){layer.marks.innerHTML='';if(item.mode==='match'){drawLinks(marks,'#333',layer.marks);if(sel!==null)markShape(regs[sel],'ring','#ff8c42',layer.marks);return;}for(const k in marks)markShape(regs[k],(item.mode==='pick'||item.mode==='pair')?'ring':marks[k],'#333',layer.marks);}
/* match 模式的連線：links 是 { 左邊 i: 右邊 j }，從左卡右緣畫到右卡左緣。 */
function drawLinks(links,color,parent){const n=regs.length/2;for(const k in links){const a=regs[k],b=regs[n+links[k]];
  el('line',{x1:a.x+a.w,y1:a.y+a.h/2,x2:b.x,y2:b.y+b.h/2,stroke:color,'stroke-width':6,'stroke-linecap':'round',class:'pop'},parent);}}
function onMatch(i,id){const n=regs.length/2,left=i<n;
  // 點到已連線的項目：取消那條線
  const k=left?(i in marks?i:null):Object.keys(marks).find(k=>marks[k]===i-n);
  if(k!==null&&k!==undefined){delete marks[k];sel=null;redrawMarks();return;}
  if(sel===null||sel===i||(sel<n)===left){sel=sel===i?null:i;redrawMarks();return;}
  const l=left?i:sel,r=(left?sel:i)-n;marks[l]=r;sel=null;redrawMarks();
  if(P&&P.cfg.exam){examReady(Object.keys(marks).length===n,id);return;}
  if(Object.keys(marks).length===n)check(id);}
function onMark(i,id){if(id!==S.runId||item.done)return;
  if(item.mode==='match'){onMatch(i,id);return;}
  const ex=P&&P.cfg.exam;
  if(item.mode==='pick'){marks={[i]:'o'};redrawMarks();if(ex){examReady(true,id);return;}check(id);return;}
  if(item.mode==='pair'){if(marks[i])delete marks[i];else marks[i]='o';redrawMarks();if(ex){examReady(Object.keys(marks).length===2,id);return;}if(Object.keys(marks).length===2)check(id);return;}
  if(item.mode==='dual'){if(marks[i]===tool){delete marks[i];}else{for(const k in marks)if(marks[k]===tool)delete marks[k];marks[i]=tool;}
    if(tool==='v'&&!Object.values(marks).includes('o'))setTool('o');else if(tool==='o'&&!Object.values(marks).includes('v'))setTool('v');}
  else marks[i]=marks[i]===tool?undefined:tool,marks[i]===undefined&&delete marks[i];
  redrawMarks();}
async function check(id){if(item.done)return;
  try{
    if(item.mode==='dual'){const vs=Object.values(marks);if(!vs.includes('v')||!vs.includes('o')){await say('題目要你做兩件事喔：要打勾，也要畫圈。再看一次題目：'+item.prompt,id);return;}}
    if(item.mode==='classify'&&Object.keys(marks).length<regs.length){await say('每一條線都要做記號喔！',id);return;}
    item.done=true;clearBar();
    const ok=judge(item,marks);
    if(P.cfg.exam){await examSubmit(ok,id);return;}
    if(ok)P.correct++;else P.wrong.push(item.type);updScore();playSfx(ok?'correct':'wrong');answerFx(ok);
    // show correct marks in green
    if(layer.hit)layer.hit.remove();const sol=el('g',{});
    if(item.mode==='num'){if(!ok)item.fill(item.answer,'#2bb673');}
    else if(item.mode==='pair'){if(!ok)item.answer.forEach(i=>markShape(regs[i],'ring','#2bb673',sol));}
    else if(item.mode==='pick')markShape(regs[item.answer],'ring','#2bb673',sol);
    else if(item.mode==='dual'){markShape(regs[item.answer.v],'v','#2bb673',sol);markShape(regs[item.answer.o],'o','#2bb673',sol);}
    else if(item.mode==='match'){if(!ok){layer.marks.innerHTML='';drawLinks(Object.fromEntries(item.answer.map((j,i)=>[i,j])),'#2bb673',sol);}}
    else item.answer.forEach((a,i)=>{if(marks[i]!==a)markShape(regs[i],a,'#2bb673',sol);});
    await say(ok?pick(['答對了！好棒！','太厲害了！','完全正確！']):(item.mode==='num'?`差一點點，答案是 ${item.answer}。我們一起看看。`:'差一點點，我們一起看看為什麼。'),id);
    if(item.moves){await wait(700,id);sol.remove();layer.marks.remove();layer.paren.remove();}
    await item.explain(id);
    const last=P.i===P.queue.length-1;const b=button(last?'看結果 🏆':'下一題 ▶','#2bb673',()=>{P.i++;nextItem();},'pulse');b.id='nextQ';
  }catch(e){if(e!==ABORT)console.error(e);}}
/* ===== 考試模式（只有 P.cfg.exam 存在時才會走到） ===== */

/* 「✔ 好了」按鈕：選好答案時出現；沒選好（例如 pair 只圈一個）時收起來。 */
function examReady(ready,id){let b=$('#examOk');
  if(!ready){if(b)b.remove();return;}
  if(!b){b=button('✔ 好了','#2bb673',()=>{if(id===S.runId&&!item.done)check(id);},'examOk');b.id='examOk';}}

/*
 * 考試送出：記下作答。答對答錯一律同樣的音效、吉祥物動作和字幕「收到！」，900 ms 後自動換題。
 * 不畫正解、不說稱讚語、不播講解。作答紀錄只放在記憶體（P.log 與 exam.js），不存檔。
 */
export const EXAM_ACK='收到！';
const NEUTRAL_ACTS=['nod','thumb','card'];
async function examSubmit(ok,id){const ex=P.cfg.exam,q=ex.paper[P.i];
  if(ok)P.correct++;else P.wrong.push(item.type);
  const entry={n:P.i+1,type:item.type,seed:q.seed,zone:q.zone,given:{...marks},ok};
  P.log.push(entry);ex.onAnswered(entry);
  if(layer.hit)layer.hit.remove();
  // 吉祥物的中性動作只依題號輪流（點頭、比讚、收卡片），和對錯無關
  playSfx('tap');window.dispatchEvent(new CustomEvent('lesson:answer',{detail:{neutral:true,act:NEUTRAL_ACTS[P.i%3]}}));
  stopSpeech();subEl.textContent=EXAM_ACK;speakOne(EXAM_ACK);
  await wait(900,id);P.i++;nextItem();}

/**
 * 錯題重看：用作答時的種子重建題目與畫面，灰色畫出孩子的答案、綠色畫出正確答案，再播講解。
 * entry 是考試紀錄的一筆 { type, seed, given, ... }；id 是呼叫端的 S.runId，離開時會中止（丟 ABORT）。
 * 講解在 withSeed 外面執行，用真正的 Math.random；講解內容都來自題目物件，不影響正確性。
 */
export async function reviewExamItem(entry,id){
  stopSpeech();clear();clearBar();
  withSeed(entry.seed,()=>{item=GEN[entry.type]();item.type=entry.type;regs=item.draw();});
  item.done=true;const given=entry.given||{};marks={...given};sel=null;
  layer.paren=el('g',{});layer.marks=el('g',{class:'examGiven'});layer.hit=null;
  if(item.mode==='dual'||item.mode==='classify')regs.forEach(r=>paren(r,layer.paren));
  const GRAY='#9a8c7a',OK='#2bb673',sol=el('g',{class:'examSol'});
  if(item.mode==='num'){if(given.val!==undefined){item.fill(given.val,GRAY);await wait(700,id);}item.fill(item.answer,OK);}
  else if(item.mode==='match'){drawLinks(given,GRAY,layer.marks);drawLinks(Object.fromEntries(item.answer.map((j,i)=>[i,j])),OK,sol);}
  else if(item.mode==='pick'||item.mode==='pair'){for(const k in given)markShape(regs[k],'ring',GRAY,layer.marks);
    (item.mode==='pick'?[item.answer]:item.answer).forEach(i=>markShape(regs[i],'ring',OK,sol));}
  else if(item.mode==='dual'){for(const k in given)markShape(regs[k],given[k],GRAY,layer.marks);markShape(regs[item.answer.v],'v',OK,sol);markShape(regs[item.answer.o],'o',OK,sol);}
  else{for(const k in given)markShape(regs[k],given[k],GRAY,layer.marks);item.answer.forEach((a,i)=>{if(given[i]!==a)markShape(regs[i],a,OK,sol);});}
  await say(item.mode==='num'?`正確答案是 ${item.answer}。我們一起看看。`:'我們一起看看為什麼。',id);
  if(item.moves){await wait(700,id);sol.remove();layer.marks.remove();layer.paren.remove();}
  await item.explain(id);}

async function practiceEnd(id){$('#crumb').innerHTML='';$('#stTxt').textContent='🏆 練習結果';const n=P.correct,t=P.queue.length;
  // 星星改用 Fluent 圖片，一顆一顆彈出來；沒拿到的星星用同一張圖加 .dim（變灰變淡）。
  const k=Math.min(t,10),got=Math.round(n/t*k);
  for(let i=0;i<k;i++){const cx=400-(k-1)*35+i*70;el('image',{href:uiUrl('star'),x:cx-31,y:150-31,width:62,height:62,class:'svgtxt pop'+(i<got?'':' dim'),style:`animation-delay:${(i*.12).toFixed(2)}s`});}
  if(n/t>=.6)el('image',{href:uiUrl('trophy'),x:400-36,y:300,width:72,height:72,class:'svgtxt pop',style:`animation-delay:${(k*.12+.1).toFixed(2)}s`});
  countUp(txt(400,250,`答對 0 / ${t} 題`,{'font-size':42,fill:'#e07a00'}),n,t,id);
  if(n/t>=.6){const st=$('#stage');confetti(st,{seed:77});if(n===t)starBurst(st,{xPct:50,yPct:36});}
  playSfx('star');
  if(P.cfg.unitId)hooks.onResult(P.cfg.unitId,Math.round(n/t*3));
  const wrong=[...new Set(P.wrong)];
  if(wrong.length){button('🔁 錯的再練一次','#ff8c42',()=>startPractice({title:'再練一次',types:wrong,queue:shuffle(P.wrong.concat(P.wrong).slice(0,Math.max(3,P.wrong.length))),unitId:null}));}
  button('🏠 回首頁','#3a86ff',()=>hooks.goHome());
  try{if(n===t)await say('太厲害了！全部答對！',id);else if(n/t>=.6)await say(`很棒！答對${n}題。錯的題目再練一次，會更厲害！`,id);else await say('沒關係！回去看動畫，再來挑戰一次！',id);}catch{/* 離開結果頁時語音被中止，不必處理 */}}

/* 結果頁的分數從 0 數到 n（只改 SVG 文字，不動字幕）；最後一定停在原本的文字。 */
function countUp(node,n,t,id){const t0=performance.now(),dur=Math.max(300,n*90);
  const step=now=>{if(id!==S.runId)return;const p=Math.min(1,(now-t0)/dur);node.textContent=`答對 ${Math.round(n*p)} / ${t} 題`;if(p<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);}

/* test hook：對照測試用 window.__T.answer() 作答，行為和舊檔相同。 */
/*
 * 考試模式的 __T.answer：直接設好答案並送出，跳過「✔ 好了」。
 * correct 為 false 時一定給錯的答案（classify 會改錯第一格）。
 */
function examAnswer(correct){const n=regs.length;
  if(item.mode==='num'){const v=correct?item.answer:(item.answer+1)%11;marks={val:v};item.fill(v,'#333');}
  else if(item.mode==='pick')marks={[correct?item.answer:(item.answer+1)%n]:'o'};
  else if(item.mode==='pair'){const a=correct?item.answer:[item.answer[0],(item.answer[0]+1)%n===item.answer[1]?(item.answer[0]+2)%n:(item.answer[0]+1)%n];marks={};a.forEach(i=>marks[i]='o');}
  else if(item.mode==='match'){const m=item.answer.length;sel=null;marks=Object.fromEntries(item.answer.map((j,i)=>[i,correct?j:item.answer[(i+1)%m]]));}
  else if(item.mode==='dual')marks=correct?{[item.answer.v]:'v',[item.answer.o]:'o'}:{[item.answer.o]:'v',[item.answer.v]:'o'};
  else{marks=Object.fromEntries(item.answer.map((a,i)=>[i,a]));if(!correct)marks[0]=marks[0]==='v'?'o':'v';}
  if(item.mode!=='num')redrawMarks();check(S.runId);}

window.__T={answer(correct=true){if(!item||item.done)return;
  if(P&&P.cfg.exam){examAnswer(correct);return;}
  if(item.mode==='num'){const n=correct?item.answer:(item.answer+1)%11;marks={val:n};item.fill(n,'#333');check(S.runId);return;}
  if(item.mode==='pair'){const a=correct?item.answer:[item.answer[0],(item.answer[0]+1)%regs.length===item.answer[1]?(item.answer[0]+2)%regs.length:(item.answer[0]+1)%regs.length];marks={};a.forEach(i=>marks[i]='o');redrawMarks();check(S.runId);return;}if(item.mode==='pick'){const i=correct?item.answer:(item.answer+1)%regs.length;onMark(i,S.runId);return;}
  if(item.mode==='match'){const n=item.answer.length;sel=null;marks=Object.fromEntries(item.answer.map((j,i)=>[i,correct?j:item.answer[(i+1)%n]]));redrawMarks();check(S.runId);return;}
  if(item.mode==='dual'){marks=correct?{[item.answer.v]:'v',[item.answer.o]:'o'}:{[item.answer.o]:'v',[item.answer.v]:'o'};}else marks=Object.fromEntries(item.answer.map((a,i)=>[i,a]));redrawMarks();check(S.runId);},
  get state(){return{P:P&&{i:P.i,c:P.correct},type:item&&item.type,done:item&&item.done};}};
