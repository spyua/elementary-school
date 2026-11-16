// 語音與字幕（從舊檔 CORE 段的 speech 搬來，加上多語）。
// 沒有語音合成或靜音時，只顯示字幕並等待一段時間，流程不會卡住。
import { ABORT, S } from './state.js';
import { $ } from './util.js';

// 各語言挑選語音的順序；挑到的語音依語言快取在 voices。
// zh-TW 維持舊檔順序；en-US 依 en-US → en-GB → 任何 en 的順序。
const VOICE_ORDER = {
  'zh-TW': [/zh[-_]TW/i, /zh[-_](HK|Hant)/i, /^zh/i],
  'en-US': [/en[-_]US/i, /en[-_]GB/i, /^en/i],
};
const voices = {};
function pickVoice(){if(!('speechSynthesis' in window))return;const vs=speechSynthesis.getVoices()||[];
  for(const lang in VOICE_ORDER){voices[lang]=null;for(const re of VOICE_ORDER[lang]){const v=vs.find(v=>re.test(v.lang));if(v){voices[lang]=v;break;}}}}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
export { pickVoice };
export const subEl=$('#sub');
export function chk(id){if(id!==S.runId)throw ABORT;}
export function wait(ms,id){return new Promise((res,rej)=>setTimeout(()=>{id!==undefined&&id!==S.runId?rej(ABORT):res()},ms));}
// 只有中文要把符號換成唸得出來的字（✓→勾、＋→加…）；英文原樣朗讀。
const zhText=t=>t.replace(/✓/g,'勾').replace(/○/g,'圈').replace(/[＋+]/g,'加').replace(/[－−]/g,'減').replace(/[＝=]/g,'等於');
/**
 * 朗讀一句話，唸完（或逾時、出錯）時 resolve，永遠不會 reject。
 * 找不到該語言的語音時，仍設定 u.lang 交給瀏覽器決定；也沒有回應時靠逾時往下走。
 */
export function speakOne(text,lang='zh-TW',rate=.88){return new Promise(res=>{let done=false;const fin=()=>{if(!done){done=true;res();}};
  if(S.muted||!('speechSynthesis' in window)){setTimeout(fin,500+text.length*200);return;}
  const u=new SpeechSynthesisUtterance(lang==='zh-TW'?zhText(text):text);u.lang=lang;const v=voices[lang];if(v)u.voice=v;u.rate=rate;u.pitch=1.15;
  u.onend=fin;u.onerror=fin;setTimeout(fin,1500+text.length*350);
  try{speechSynthesis.resume();speechSynthesis.speak(u);}catch{fin();}});}
/** 顯示字幕並朗讀；opts.lang 預設 zh-TW。id 不是目前的 S.runId 時丟 ABORT。 */
export async function say(text,id,opts={}){chk(id);subEl.textContent=text;await speakOne(text,opts.lang,opts.rate);chk(id);await wait(220,id);}
export function stopSpeech(){if('speechSynthesis' in window)speechSynthesis.cancel();}

/* test hook：e2e 測試用來直接呼叫 say（英文示範單元完成前，沒有其他英文入口）。 */
window.__speech={say,speakOne,get runId(){return S.runId;}};
