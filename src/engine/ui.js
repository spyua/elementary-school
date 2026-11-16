// 底部按鈕列與畫面切換（從舊檔 CORE 段的 bottom bar helpers 搬來）。
import { ABORT, S } from './state.js';
import { $ } from './util.js';

export const bar=$('#bar');
export function clearBar(){bar.innerHTML='';}
export function button(label,bg,onclick,cls=''){const b=document.createElement('button');b.textContent=label;b.style.background=bg;b.className=cls;b.onclick=onclick;bar.appendChild(b);return b;}
export function askChoice(opts,id){return new Promise((res,rej)=>{clearBar();const t=setInterval(()=>{if(id!==S.runId){clearInterval(t);clearBar();rej(ABORT);}},200);
  opts.forEach(o=>button(o.label,o.color,()=>{clearInterval(t);clearBar();id===S.runId?res(o.value):rej(ABORT);}));});}

/** 顯示單元畫面（舊檔 enterLesson）。單元播放與練習都會用到，所以放在這裡。 */
export function enterLesson(){$('#home').classList.add('hidden');$('#lesson').classList.remove('hidden');$('#homeBtn').classList.remove('hidden');}
