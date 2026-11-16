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
import { subEl, say, wait, stopSpeech } from './speech.js';
import { playSfx } from './sfx.js';
import { el, txt, clear, paren, markShape } from './svg.js';
import { bar, clearBar, button, enterLesson } from './ui.js';

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

let P=null,item=null,marks={},tool='v',regs=[],layer={},sel=null;
/** cfg: { title, types?, count?, queue?, unitId? }；unitId 是單元固定 ID，再練一次時為 null。 */
export function startPractice(cfg){P={cfg,i:0,correct:0,wrong:[],queue:cfg.queue||makeQueue(cfg.types,cfg.count)};enterLesson();$('#nav').classList.add('hidden');nextItem();}
/** 離開單元時清掉練習狀態（舊檔 goHome 裡的 P=null）。 */
export function resetPractice(){P=null;}
function makeQueue(types,count){let q=[];while(q.length<count)q=q.concat(shuffle(types));return q.slice(0,count);}
function updScore(){$('#score').textContent=`⭐ ${P.correct}`;}
function renderCrumbP(){const c=$('#crumb');c.innerHTML='';for(let i=0;i<P.queue.length;i++){const d=document.createElement('div');d.className='dot'+(i===P.i?' on':i<P.i?' done':'');c.appendChild(d);}}
async function nextItem(){S.runId++;const id=S.runId;stopSpeech();clear();clearBar();
  if(P.i>=P.queue.length)return practiceEnd(id);
  renderCrumbP();updScore();$('#stTxt').textContent=`${P.cfg.title}　第 ${P.i+1}/${P.queue.length} 題`;
  item=GEN[P.queue[P.i]]();item.type=P.queue[P.i];marks={};tool='v';sel=null;
  regs=item.draw();layer.paren=el('g',{});layer.marks=el('g',{});layer.hit=el('g',{});
  if(item.mode==='dual'||item.mode==='classify')regs.forEach(r=>paren(r,layer.paren));
  regs.forEach((r,i)=>{const h=el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:'transparent',style:'cursor:pointer'},layer.hit);h.addEventListener('click',()=>onMark(i,id));});
  if(item.mode==='num'){for(let n=0;n<=(item.max||10);n++)button(String(n),'',()=>{if(item.done||id!==S.runId)return;marks={val:n};item.fill(n,'#333');check(id);},'num');}
  else if(item.mode!=='pick'&&item.mode!=='pair'&&item.mode!=='match'){const tv=button('✓ 打勾','',()=>setTool('v'),'tool sel');const to=button('○ 畫圈','',()=>setTool('o'),'tool');tv.dataset.t='v';to.dataset.t='o';
    button('檢查答案','#ff8c42',()=>check(id)).id='checkBtn';}
  if(item.ask){const it=item;button('🔊 再聽一次','#3a86ff',()=>{if(it.done||id!==S.runId)return;stopSpeech();it.ask(id).catch(()=>{});},'replayQ');}
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
  if(Object.keys(marks).length===n)check(id);}
function onMark(i,id){if(id!==S.runId||item.done)return;
  if(item.mode==='match'){onMatch(i,id);return;}
  if(item.mode==='pick'){marks={[i]:'o'};redrawMarks();check(id);return;}
  if(item.mode==='pair'){if(marks[i])delete marks[i];else marks[i]='o';redrawMarks();if(Object.keys(marks).length===2)check(id);return;}
  if(item.mode==='dual'){if(marks[i]===tool){delete marks[i];}else{for(const k in marks)if(marks[k]===tool)delete marks[k];marks[i]=tool;}
    if(tool==='v'&&!Object.values(marks).includes('o'))setTool('o');else if(tool==='o'&&!Object.values(marks).includes('v'))setTool('v');}
  else marks[i]=marks[i]===tool?undefined:tool,marks[i]===undefined&&delete marks[i];
  redrawMarks();}
async function check(id){if(item.done)return;
  try{
    if(item.mode==='dual'){const vs=Object.values(marks);if(!vs.includes('v')||!vs.includes('o')){await say('題目要你做兩件事喔：要打勾，也要畫圈。再看一次題目：'+item.prompt,id);return;}}
    if(item.mode==='classify'&&Object.keys(marks).length<regs.length){await say('每一條線都要做記號喔！',id);return;}
    item.done=true;clearBar();
    let ok;if(item.mode==='num')ok=marks.val===item.answer;else if(item.mode==='pair')ok=item.isOk(Object.keys(marks).map(Number));else if(item.mode==='pick')ok=+Object.keys(marks)[0]===item.answer;
    else if(item.mode==='dual')ok=marks[item.answer.v]==='v'&&marks[item.answer.o]==='o';
    else if(item.mode==='match')ok=item.answer.every((j,i)=>marks[i]===j);
    else ok=item.answer.every((a,i)=>marks[i]===a);
    if(ok)P.correct++;else P.wrong.push(item.type);updScore();playSfx(ok?'correct':'wrong');
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
async function practiceEnd(id){$('#crumb').innerHTML='';$('#stTxt').textContent='🏆 練習結果';const n=P.correct,t=P.queue.length;
  for(let i=0;i<Math.min(t,10);i++)txt(400-(Math.min(t,10)-1)*35+i*70,150,i<Math.round(n/t*Math.min(t,10))?'⭐':'☆',{'font-size':54,fill:'#d8c9a8',class:'svgtxt pop'});
  txt(400,270,`答對 ${n} / ${t} 題`,{'font-size':42,fill:'#e07a00'});
  playSfx('star');
  if(P.cfg.unitId)hooks.onResult(P.cfg.unitId,Math.round(n/t*3));
  const wrong=[...new Set(P.wrong)];
  if(wrong.length){button('🔁 錯的再練一次','#ff8c42',()=>startPractice({title:'再練一次',types:wrong,queue:shuffle(P.wrong.concat(P.wrong).slice(0,Math.max(3,P.wrong.length))),unitId:null}));}
  button('🏠 回首頁','#3a86ff',()=>hooks.goHome());
  try{if(n===t)await say('太厲害了！全部答對！',id);else if(n/t>=.6)await say(`很棒！答對${n}題。錯的題目再練一次，會更厲害！`,id);else await say('沒關係！回去看動畫，再來挑戰一次！',id);}catch{/* 離開結果頁時語音被中止，不必處理 */}}

/* test hook：對照測試用 window.__T.answer() 作答，行為和舊檔相同。 */
window.__T={answer(correct=true){if(!item||item.done)return;
  if(item.mode==='num'){const n=correct?item.answer:(item.answer+1)%11;marks={val:n};item.fill(n,'#333');check(S.runId);return;}
  if(item.mode==='pair'){const a=correct?item.answer:[item.answer[0],(item.answer[0]+1)%regs.length===item.answer[1]?(item.answer[0]+2)%regs.length:(item.answer[0]+1)%regs.length];marks={};a.forEach(i=>marks[i]='o');redrawMarks();check(S.runId);return;}if(item.mode==='pick'){const i=correct?item.answer:(item.answer+1)%regs.length;onMark(i,S.runId);return;}
  if(item.mode==='match'){const n=item.answer.length;sel=null;marks=Object.fromEntries(item.answer.map((j,i)=>[i,correct?j:item.answer[(i+1)%n]]));redrawMarks();check(S.runId);return;}
  if(item.mode==='dual'){marks=correct?{[item.answer.v]:'v',[item.answer.o]:'o'}:{[item.answer.o]:'v',[item.answer.v]:'o'};}else marks=Object.fromEntries(item.answer.map((a,i)=>[i,a]));redrawMarks();check(S.runId);},
  get state(){return{P:P&&{i:P.i,c:P.correct},type:item&&item.type,done:item&&item.done};}};
