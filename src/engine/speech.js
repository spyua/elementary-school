// 語音與字幕（從舊檔 CORE 段的 speech 搬來）。
// 沒有語音合成或靜音時，只顯示字幕並等待一段時間，流程不會卡住。
import { ABORT, S } from './state.js';
import { $ } from './util.js';

let voice=null;
function pickVoice(){if(!('speechSynthesis' in window))return;const vs=speechSynthesis.getVoices();
  voice=vs.find(v=>/zh[-_]TW/i.test(v.lang))||vs.find(v=>/zh[-_](HK|Hant)/i.test(v.lang))||vs.find(v=>/^zh/i.test(v.lang))||null;}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
export { pickVoice };
export const subEl=$('#sub');
export function chk(id){if(id!==S.runId)throw ABORT;}
export function wait(ms,id){return new Promise((res,rej)=>setTimeout(()=>{id!==undefined&&id!==S.runId?rej(ABORT):res()},ms));}
export function speakOne(text){return new Promise(res=>{let done=false;const fin=()=>{if(!done){done=true;res();}};
  if(S.muted||!('speechSynthesis' in window)){setTimeout(fin,500+text.length*200);return;}
  const u=new SpeechSynthesisUtterance(text.replace(/✓/g,'勾').replace(/○/g,'圈').replace(/[＋+]/g,'加').replace(/[－−]/g,'減').replace(/[＝=]/g,'等於'));u.lang='zh-TW';if(voice)u.voice=voice;u.rate=.88;u.pitch=1.15;
  u.onend=fin;u.onerror=fin;setTimeout(fin,1500+text.length*350);
  try{speechSynthesis.resume();speechSynthesis.speak(u);}catch{fin();}});}
export async function say(text,id){chk(id);subEl.textContent=text;await speakOne(text);chk(id);await wait(220,id);}
export function stopSpeech(){if('speechSynthesis' in window)speechSynthesis.cancel();}
