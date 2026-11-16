// SVG 繪圖基本工具（從舊檔 CORE 段搬來）。
// 只有學期包用到的繪圖函式放在學期包裡；這裡只放引擎也會用到的。
import { ABORT, S } from './state.js';
import { $ } from './util.js';

export const svg=$('#svg'), NS='http://www.w3.org/2000/svg';
export function el(tag,attrs={},parent=svg){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent.appendChild(e);return e;}
export function txt(x,y,s,attrs={},parent=svg){const t=el('text',Object.assign({x,y,'text-anchor':'middle','dominant-baseline':'middle',class:'svgtxt'},attrs),parent);t.textContent=s;return t;}
export function clear(){svg.innerHTML='';}
export function tween(dur,fn,id){return new Promise((res,rej)=>{const t0=performance.now();const step=now=>{if(id!==S.runId){rej(ABORT);return;}
  const t=Math.min(1,(now-t0)/dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;fn(e);t<1?requestAnimationFrame(step):res();};requestAnimationFrame(step);});}

/* marks */
export function paren(r,parent){txt(r.mx-30,r.my,'(',{'font-size':40,fill:'#999',class:'svgtxt'},parent);txt(r.mx+30,r.my,')',{'font-size':40,fill:'#999',class:'svgtxt'},parent);}
export function markShape(r,kind,color,parent){const g=el('g',{class:'pop'},parent);
  if(kind==='v')el('path',{d:`M${r.mx-15} ${r.my-2} l11 13 l22 -28`,stroke:color,'stroke-width':6,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},g);
  else if(kind==='o')el('circle',{cx:r.mx,cy:r.my,r:16,stroke:color,'stroke-width':5,fill:'none'},g);
  else if(kind==='ring')el('ellipse',{cx:r.x+r.w/2,cy:r.y+r.h/2,rx:r.w/2+8,ry:r.h/2+8,stroke:color,'stroke-width':5,fill:'none'},g);
  return g;}
