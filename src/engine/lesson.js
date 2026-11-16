// 場景播放器（從舊檔 LESSON RUNNER 段搬來）。
// openUnit 打開一般單元（有 scenes）或總複習（有 queue）；closeLesson 離開時停止動畫與語音。
import { ABORT, S } from './state.js';
import { $ } from './util.js';
import { subEl, stopSpeech, pickVoice } from './speech.js';
import { clear } from './svg.js';
import { clearBar, button, enterLesson } from './ui.js';
import { startPractice, resetPractice } from './practice.js';

let unit=null,cur=0,pendingPractice=null;

/**
 * 打開單元。unit 是 catalog 中繼資料與學期包內容合併後的物件：
 * - 一般單元：{ id, icon, name, scenes, practice, count }
 * - 總複習：{ id, title, queue }（舊檔 startReview）
 * 還沒按過「開始」時先顯示開始畫面，等 unlockAudio 再播放。
 */
export function openUnit(u){
  if(!u.scenes&&u.queue)return openReview(u);
  unit=u;resetPractice();pendingPractice=null;enterLesson();$('#nav').classList.remove('hidden');$('#score').textContent='';
  if(!S.unlocked){$('#startOv').classList.remove('hidden');clear();subEl.textContent='　';$('#stTxt').textContent=u.icon+' '+u.name;}else go(0);}

function openReview(rv){const cfg={title:rv.title,queue:rv.queue(),unitId:rv.id};
  if(!S.unlocked){pendingPractice=cfg;unit=null;enterLesson();$('#nav').classList.add('hidden');$('#crumb').innerHTML='';$('#score').textContent='';$('#stTxt').textContent='🏆 '+rv.title;clear();$('#startOv').classList.remove('hidden');}else startPractice(cfg);}

/** 離開單元：讓進行中的動畫與語音停下來，清空畫布與按鈕列。 */
export function closeLesson(){S.runId++;stopSpeech();clear();clearBar();resetPractice();unit=null;pendingPractice=null;$('#startOv').classList.add('hidden');}

function renderCrumbU(){const c=$('#crumb');c.innerHTML='';unit.scenes.forEach((_,i)=>{const d=document.createElement('div');d.className='dot'+(i===cur?' on':i<cur?' done':'');c.appendChild(d);});}
async function go(i){if(!unit)return;S.runId++;const id=S.runId;stopSpeech();cur=Math.max(0,Math.min(unit.scenes.length-1,i));clear();clearBar();
  $('#next').classList.remove('pulse');$('#prev').disabled=cur===0;$('#next').disabled=cur===unit.scenes.length-1;
  renderCrumbU();$('#stTxt').textContent=`${unit.icon} ${unit.name}　${cur+1}. ${unit.scenes[cur].title}`;subEl.textContent='　';
  try{await unit.scenes[cur].run(id);if(id!==S.runId)return;
    if(cur<unit.scenes.length-1)$('#next').classList.add('pulse');
    else{const u=unit;button(`✏️ 開始練習 ${unit.count||5} 題`,'#2bb673',()=>startPractice({title:u.name+' 練習',types:u.practice,count:u.count||5,unitId:u.id}),'pulse');}
  }catch(e){if(e!==ABORT)console.error(e);}}
$('#prev').onclick=()=>go(cur-1);$('#next').onclick=()=>go(cur+1);$('#replay').onclick=()=>go(cur);

/** 原本 #startBtn 的處理：瀏覽器要求使用者先點一下才能出聲。 */
export function unlockAudio(){S.unlocked=true;$('#startOv').classList.add('hidden');if('speechSynthesis' in window){pickVoice();try{speechSynthesis.speak(new SpeechSynthesisUtterance(''));}catch{/* 有些瀏覽器不允許空字串，忽略 */}}
  if(pendingPractice){const c=pendingPractice;pendingPractice=null;startPractice(c);}else go(0);}
