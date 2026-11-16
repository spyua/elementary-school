// SVG 繪圖基本工具（從舊檔 CORE 段搬來）。
// 只有學期包用到的繪圖函式放在學期包裡；這裡只放引擎也會用到的。
import { ABORT, S } from './state.js';
import { $ } from './util.js';

export const svg=$('#svg'), NS='http://www.w3.org/2000/svg';
export function el(tag,attrs={},parent=svg){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent.appendChild(e);return e;}
export function txt(x,y,s,attrs={},parent=svg){const t=el('text',Object.assign({x,y,'text-anchor':'middle','dominant-baseline':'middle',class:'svgtxt'},attrs),parent);t.textContent=s;return t;}
export function clear(){svg.innerHTML='';}

/** 原本 tween 寫死的 ease-in-out 二次曲線；不傳 ease 時就用它，動畫和以前一模一樣。 */
const easeInOutQuad=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

/**
 * 可選的緩動曲線（輸入 0～1 的時間，回傳進度）。
 * - outBounce：落地彈兩下，給「掉下來」用。
 * - inBack：先往後縮一下再衝出去，給「飛走」用。
 * - outBack：衝過頭一點再回來，給「排隊、移到定位」用。
 * back 類曲線會小於 0 或大於 1，不要拿來算透明度或 strokeDashoffset。
 */
export const EASE={
  outBounce(t){const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d){t-=1.5/d;return n*t*t+.75;}if(t<2.5/d){t-=2.25/d;return n*t*t+.9375;}t-=2.625/d;return n*t*t+.984375;},
  inBack(t){const c1=1.70158,c3=c1+1;return c3*t*t*t-c1*t*t;},
  outBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);},
};

/**
 * 在 dur 毫秒內每一格呼叫 fn(e, t)：e 是緩動後的進度，t 是原始時間比例（0～1）。
 * id 不是目前的 S.runId 時中止（reject ABORT）。最後一格的 e 一定是 1，物件會停在原本的終點。
 */
export function tween(dur,fn,id,ease=easeInOutQuad){return new Promise((res,rej)=>{const t0=performance.now();const step=now=>{if(id!==S.runId){rej(ABORT);return;}
  const t=Math.min(1,(now-t0)/dur),e=t>=1?1:ease(t);fn(e,t);t<1?requestAnimationFrame(step):res();};requestAnimationFrame(step);});}

/* marks */
export function paren(r,parent){txt(r.mx-30,r.my,'(',{'font-size':40,fill:'#999',class:'svgtxt'},parent);txt(r.mx+30,r.my,')',{'font-size':40,fill:'#999',class:'svgtxt'},parent);}
/**
 * 打勾、畫圈、圈選的記號。線條加上 .draw，像用筆一筆畫出來。
 * 線長由 getTotalLength() 算出放進 --len；量不到（例如測試環境）就不加 .draw，直接顯示。
 */
export function markShape(r,kind,color,parent){const g=el('g',{class:'pop'},parent);let m;
  if(kind==='v')m=el('path',{d:`M${r.mx-15} ${r.my-2} l11 13 l22 -28`,stroke:color,'stroke-width':6,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},g);
  else if(kind==='o')m=el('circle',{cx:r.mx,cy:r.my,r:16,stroke:color,'stroke-width':5,fill:'none'},g);
  else if(kind==='ring')m=el('ellipse',{cx:r.x+r.w/2,cy:r.y+r.h/2,rx:r.w/2+8,ry:r.h/2+8,stroke:color,'stroke-width':5,fill:'none'},g);
  if(m)drawStroke(m);
  return g;}
function drawStroke(m){let len=0;try{len=m.getTotalLength?m.getTotalLength():0;}catch{len=0;}
  if(len>0){m.style.setProperty('--len',String(Math.ceil(len)+1));m.classList.add('draw');}}
