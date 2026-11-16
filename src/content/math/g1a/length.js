// 一上數學學期包：比長短：長度繪圖工具、拉直互動，直線和曲線、曲線比長短、厚和薄、比高矮四個單元與題型。
// 程式從舊版單檔原樣搬來，只補上 import／export，並把 runId 改成 S.runId。
// 動畫升級：瓢蟲改用 Fluent 圖（藍藍用 hueRotate 濾鏡變藍、走路輕擺）、糖果與口訣卡圖片、地面加厚度。字幕、亂數、時長都沒有改。
import { ABORT, S } from '../../../engine/state.js';
import { C, RED, BLUE, rand, ri, pick, shuffle, distinct, POS3, POS2 } from '../../../engine/util.js';
import { subEl, chk, wait, speakOne, say } from '../../../engine/speech.js';
import { svg, el, txt, tween, paren, markShape } from '../../../engine/svg.js';
import { emojiAt } from '../../../engine/emoji.js';
import { clearBar, button, askChoice } from '../../../engine/ui.js';

const pstr=p=>p.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ');
function cumLen(p){const c=[0];for(let i=1;i<p.length;i++)c.push(c[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return c;}
const plen=p=>{const c=cumLen(p);return c[c.length-1];};
const SH={wave:n=>u=>Math.sin(u*n*2*Math.PI),arc:u=>Math.sin(Math.PI*u),sag:u=>-Math.sin(Math.PI*u)};
function gen(f,x0,y0,span,amp){const N=260,p=[];for(let i=0;i<=N;i++){const u=i/N;p.push([x0+u*span,y0-(f?amp*f(u):0)]);}return p;}
function buildLen(f,x0,y0,span,len){if(!f)return gen(null,x0,y0,len,0);let lo=0,hi=700;
  for(let i=0;i<60;i++){const m=(lo+hi)/2;plen(gen(f,x0,y0,span,m))<len?lo=m:hi=m;}return gen(f,x0,y0,span,(lo+hi)/2);}
function ampOf(p,y0){return Math.max(...p.map(q=>Math.abs(q[1]-y0)));}
function curl(x0,y0,span,r,loops){const N=300,p=[];for(let i=0;i<=N;i++){const t=i/N,a=t*loops*2*Math.PI;p.push([x0+t*span-r*Math.sin(a)*.9,y0-r*(1-Math.cos(a))]);}return p;}
function mkLine(pts,color,w=10,parent=svg){const e=el('polyline',{points:pstr(pts),fill:'none',stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round'},parent);return{e,pts,color};}
function setPts(L,p){L.pts=p;L.e.setAttribute('points',pstr(p));}
async function drawIn(L,dur,id){const len=L.e.getTotalLength();L.e.style.strokeDasharray=len;L.e.style.strokeDashoffset=len;
  await tween(dur,e=>L.e.style.strokeDashoffset=len*(1-e),id);L.e.style.strokeDasharray='';L.e.style.strokeDashoffset='';}
function straightTargets(L,tx,ty){const from=L.pts.map(q=>q.slice()),c=cumLen(from);return{from,to:from.map((_,i)=>[tx+c[i],ty])};}
async function straighten(L,tx,ty,dur,id){const{from,to}=straightTargets(L,tx,ty);
  await tween(dur,e=>setPts(L,from.map((q,i)=>[q[0]+(to[i][0]-q[0])*e,q[1]+(to[i][1]-q[1])*e])),id);}
async function blocks(x,y,n,unit,col,id,fast){for(let i=0;i<n;i++){chk(id);const g=el('g',{class:'pop'});
  el('rect',{x:x+i*unit+2,y:y+14,width:unit-4,height:26,rx:7,fill:col.l,stroke:col.c,'stroke-width':2},g);
  txt(x+i*unit+unit/2,y+28,String(i+1),{fill:col.c,'font-size':unit>45?18:15},g);await wait(fast?90:160,id);}}
function label(x,y,col,name){el('circle',{cx:x,cy:y,r:22,fill:col.c});txt(x,y+1,name||col.n,{fill:'#fff','font-size':19});}
/* 小瓢蟲：Fluent 🐞 圖片，走路時身體輕擺（.waddle）。紅紅用原色；藍藍套 SVG hueRotate 濾鏡變藍。
   用 SVG 濾鏡而不是 CSS filter，是因為 iPad Safari 對 SVG 元素的 CSS filter 支援不穩。 */
function bugFilter(){if(svg.querySelector('#bugBlue'))return;const d=el('defs',{});
  const f=el('filter',{id:'bugBlue','color-interpolation-filters':'sRGB'},d);el('feColorMatrix',{type:'hueRotate',values:'215'},f);}
function bug(color){const g=el('g',{}),blue=color!==RED.c;el('ellipse',{cx:0,cy:15,rx:14,ry:4,fill:'rgba(0,0,0,.15)'},g);
  if(blue)bugFilter();const b=emojiAt(0,-2,'🐞',{'font-size':32,class:'svgtxt waddle'},g);if(blue)b.setAttribute('filter','url(#bugBlue)');return g;}
function walk(L,color,speed,id){const p=L.pts,c=cumLen(p),total=c[c.length-1],g=bug(color),dur=total/speed*1000;
  return new Promise((res,rej)=>{const t0=performance.now();let i=0;const step=now=>{if(id!==S.runId){rej(ABORT);return;}
    const d=Math.min(total,(now-t0)/dur*total);while(i<c.length-2&&c[i+1]<d)i++;const k=(d-c[i])/((c[i+1]-c[i])||1);
    g.setAttribute('transform',`translate(${p[i][0]+(p[i+1][0]-p[i][0])*k},${p[i][1]+(p[i+1][1]-p[i][1])*k-2})`);d<total?requestAnimationFrame(step):res(g);};requestAnimationFrame(step);});}
function candy(x,y){emojiAt(x,y,'🍬',{'font-size':32,class:'svgtxt bob'});}
/* 地面：先畫一條有厚度的土色帶，再畫原本的線。 */
function ground(x1,y,x2){el('rect',{x:x1,y,width:x2-x1,height:12,rx:6,fill:'#f3e7cf'});el('line',{x1,y1:y,x2,y2:y,stroke:'#c9b28a','stroke-width':4});}
function ruler(x,y,len,angle=0,parent=svg){const g=el('g',{transform:`rotate(${angle} ${x} ${y})`,class:'pop'},parent);
  el('rect',{x,y:y-34,width:len,height:24,rx:4,fill:'#ffe08a',stroke:'#d4a72c','stroke-width':2},g);
  for(let i=10;i<len;i+=20)el('line',{x1:x+i,y1:y-10,x2:x+i,y2:y-(i%40===10?22:16),stroke:'#a07818','stroke-width':2},g);return g;}
function dashed(x1,y1,x2,y2,color='#888'){return el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':3,'stroke-dasharray':'8 7'});}
function kid(x,y,color){const g=el('g',{});el('line',{x1:x,y1:y-4,x2:x,y2:y-34,stroke:color,'stroke-width':6,'stroke-linecap':'round'},g);
  el('circle',{cx:x,cy:y-48,r:13,fill:'#ffd9b3',stroke:color,'stroke-width':3},g);el('line',{x1:x-12,y1:y+20,x2:x,y2:y-4,stroke:color,'stroke-width':5,'stroke-linecap':'round'},g);
  el('line',{x1:x+12,y1:y+20,x2:x,y2:y-4,stroke:color,'stroke-width':5,'stroke-linecap':'round'},g);return g;}

/* thick objects (side view, lying flat). return {top,h,g} */
function objBook(p,cx,base,lv,w,col){const h=lv*18,y=base-h;el('rect',{x:cx-w/2,y,width:w,height:h,rx:4,fill:col||'#e76f51'},p);
  el('rect',{x:cx-w/2+10,y:y+4,width:w-14,height:Math.max(4,h-8),fill:'#fffdf5'},p);for(let yy=y+9;yy<base-6;yy+=6)el('line',{x1:cx-w/2+12,y1:yy,x2:cx+w/2-6,y2:yy,stroke:'#e2d9c3','stroke-width':1.5},p);return{top:y,h};}
function objBread(p,cx,base,lv,w){let y=base;for(let i=0;i<lv;i++){y-=16;el('rect',{x:cx-w/2,y,width:w,height:15,rx:6,fill:'#f6d39b',stroke:'#c98f45','stroke-width':3},p);}return{top:y,h:base-y};}
function objCookie(p,cx,base,lv,w){let y=base;for(let i=0;i<lv;i++){y-=13;el('rect',{x:cx-w/2,y,width:w,height:12,rx:6,fill:'#c98f45',stroke:'#8d5a26','stroke-width':2},p);
  for(let k=0;k<3;k++)el('circle',{cx:cx-w/3+k*w/3,cy:y+6,r:2.5,fill:'#5b3416'},p);}return{top:y,h:base-y};}
function objCake(p,cx,base,lv,w){let y=base;for(let i=0;i<lv;i++){y-=18;el('rect',{x:cx-w/2,y,width:w,height:18,fill:i%2?'#fff':'#ffe2a8',stroke:'#e8b86a','stroke-width':1.5},p);}
  y-=10;el('rect',{x:cx-w/2,y,width:w,height:10,rx:4,fill:'#ff9fb5'},p);el('circle',{cx:cx+w/4,cy:y-8,r:8,fill:'#e63946'},p);return{top:y-16,h:base-y+16};}
function objBurger(p,cx,base,lv,w){let y=base-14;el('rect',{x:cx-w/2,y,width:w,height:14,rx:7,fill:'#e9b36a'},p);
  for(let i=0;i<lv;i++){y-=6;el('rect',{x:cx-w/2-4,y,width:w+8,height:6,rx:3,fill:'#6ab04c'},p);y-=15;el('rect',{x:cx-w/2+2,y,width:w-4,height:15,rx:6,fill:'#7b4a2a'},p);
    y-=5;el('rect',{x:cx-w/2,y,width:w,height:5,rx:2,fill:'#ffd23f'},p);}
  y-=26;el('path',{d:`M${cx-w/2} ${y+26} Q${cx-w/2} ${y} ${cx} ${y} Q${cx+w/2} ${y} ${cx+w/2} ${y+26} Z`,fill:'#e9a54f'},p);
  for(let k=0;k<4;k++)el('ellipse',{cx:cx-w/4+k*w/6,cy:y+10+(k%2)*5,rx:3,ry:2,fill:'#fff3d6'},p);return{top:y,h:base-y};}
const THICK={book:{f:objBook,lo:1,hi:5,name:'書'},bread:{f:objBread,lo:1,hi:6,name:'吐司'},cookie:{f:objCookie,lo:2,hi:7,name:'餅乾'},cake:{f:objCake,lo:1,hi:5,name:'蛋糕'},burger:{f:objBurger,lo:1,hi:4,name:'漢堡'}};
function bottle(p,cx,base,h,color){const g=el('g',{},p);el('rect',{x:cx-24,y:base-h+18,width:48,height:h-18,rx:14,fill:color},g);
  el('rect',{x:cx-16,y:base-h,width:32,height:22,rx:5,fill:'#555'},g);el('rect',{x:cx-14,y:base-h+34,width:8,height:h-60,rx:4,fill:'rgba(255,255,255,.45)'},g);return g;}
function bamboo(p,x,base,len,angle){const g=el('g',{transform:`rotate(${angle} ${x} ${base})`},p);el('rect',{x:x-9,y:base-len,width:18,height:len,rx:6,fill:'#7cc36b',stroke:'#4d8f3e','stroke-width':2},g);
  for(let yy=base-40;yy>base-len+10;yy-=40)el('line',{x1:x-9,y1:yy,x2:x+9,y2:yy,stroke:'#4d8f3e','stroke-width':3},g);return g;}

/* drag-to-straighten (child does it) */
function dragStraighten(L,tx,ty,id){return new Promise((res,rej)=>{
  const{from,to}=straightTargets(L,tx,ty),e0=from[from.length-1][0],e1=to[to.length-1][0];
  const h=el('g',{style:'cursor:grab'});el('circle',{r:26,fill:'#ffbe0b',stroke:'#fff','stroke-width':5,class:'blink'},h);txt(0,1,'👉',{'font-size':24},h);
  let prog=0,drag=false,done=false;const place=()=>{const p=L.pts[L.pts.length-1];h.setAttribute('transform',`translate(${p[0]},${p[1]})`);};
  const apply=e=>{prog=e;setPts(L,from.map((q,i)=>[q[0]+(to[i][0]-q[0])*e,q[1]+(to[i][1]-q[1])*e]));place();};place();
  const toSvg=ev=>{const pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse());};
  const down=ev=>{drag=true;svg.style.touchAction='none';ev.preventDefault();};
  const move=ev=>{if(!drag||done)return;const p=toSvg(ev);const e=Math.max(prog,Math.min(1,(p.x-e0)/(e1-e0)));apply(e);if(e>.95)finish();};
  const up=()=>{drag=false;};
  const cleanup=()=>{svg.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);svg.style.touchAction='';clearInterval(t);clearBar();h.remove();};
  const finish=async()=>{if(done)return;done=true;const s=prog;cleanup();try{await tween(400,e=>apply(s+(1-s)*e),id);res();}catch(x){rej(x);}};
  svg.addEventListener('pointerdown',down);window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  const t=setInterval(()=>{if(id!==S.runId&&!done){done=true;cleanup();rej(ABORT);}},200);
  clearBar();button('🪄 幫我拉直','#9b7bd8',()=>finish());
});}

/* ================= TEACHING UNITS ================= */
const U=60;
export const unitLine={practice:['classify'],
 scenes:[
 {title:'直直的線',async run(id){
   const A=mkLine([[110,110],[430,110]],'#555'),B=mkLine([[500,70],[720,190]],'#555'),Cc=mkLine([[250,220],[250,390]],'#555');
   await say('這些都是直直的線，叫做直線。',id);await drawIn(A,700,id);await drawIn(B,700,id);await drawIn(Cc,700,id);
   ruler(100,116,340);await say('直線可以用尺畫出來，尺放上去，剛剛好貼緊。',id);
   ruler(495,76,250,28.6);await say('斜斜的線，只要是直直的，也是直線喔！',id);
   ruler(256,395,170,-90);await say('站著的線，也是直線。',id);}},
 {title:'彎彎的線',async run(id){
   const a=mkLine(gen(SH.arc,90,170,260,100),'#555'),w=mkLine(gen(SH.wave(1.5),440,110,300,40),'#555'),c=mkLine(curl(170,370,420,38,4),'#555');
   await say('這些都是彎彎的線，叫做曲線。',id);await drawIn(a,700,id);await drawIn(w,700,id);await drawIn(c,1000,id);
   await say('像彩虹、像毛線、像捲捲的麵條，都是曲線。',id);
   ruler(90,176,260);await say('尺放上去貼不緊，彎彎的，就是曲線。',id);}},
 {title:'容易搞錯的題目',async run(id){
   const r1={mx:220,my:330},r2={mx:580,my:330};
   mkLine([[110,160],[330,240]],'#555');mkLine(gen(SH.wave(1),470,200,220,60),'#555');paren(r1);paren(r2);
   await say('題目常常這樣說：是直線的打勾，是曲線的畫圈。',id);
   markShape(r1,'v','#e63946');await say('這條是直直的，是直線，打勾。',id);
   markShape(r2,'o','#e63946');await say('這條是彎彎的，是曲線，畫圈。',id);
   await say('接下來換你練習！',id);}}
 ]};

export const unitCurve={practice:['rope','box','curve3'],
 scenes:[
 {title:'你猜誰的路比較長？',async run(id){
   label(50,120,BLUE);label(50,290,RED);
   const B=mkLine(buildLen(null,110,120,0,6*U),BLUE.c),R=mkLine(buildLen(SH.wave(2.5),110,290,360,9*U),RED.c);
   await say('紅紅和藍藍兩隻小瓢蟲，要去吃糖果。',id);await drawIn(B,900,id);candy(500,120);await say('藍藍走直直的路。',id);
   await drawIn(R,1300,id);candy(500,290);await say('紅紅走彎彎的路。起點一樣，終點也一樣。',id);
   await say('你猜，哪一條路比較長？按按看！',id);
   const g=await askChoice([{label:'紅色的路',color:RED.c,value:'r'},{label:'藍色的路',color:BLUE.c,value:'b'}],id);
   await say(g==='r'?'你猜紅色！':'你猜藍色！',id);await say('我們讓牠們用一樣快的速度走走看。',id);
   const pB=walk(B,BLUE.c,110,id),pR=walk(R,RED.c,110,id);await pB;subEl.textContent='藍藍先到了！';speakOne('藍藍先到了！');await pR;chk(id);
   await say('紅紅的路彎來彎去，要走比較多路，所以紅色的路比較長。'+(g==='r'?'你猜對了！':'沒關係，現在你知道了！'),id);}},
 {title:'換你來拉直！',async run(id){
   label(50,120,BLUE);label(50,290,RED);mkLine(buildLen(null,110,120,0,6*U),BLUE.c);
   const R=mkLine(buildLen(SH.wave(2.5),110,290,360,9*U),RED.c);
   await say('彎彎的線，就像一條繩子。',id);await say('換你來！用手指按住黃色圓點，往右邊拉！',id);
   await dragStraighten(R,110,290,id);
   await say('哇！你把彎彎的線拉直了！',id);await say('拉直以後，紅線比藍線長多了！',id);}},
 {title:'數一數格子',async run(id){
   label(50,120,BLUE);label(50,290,RED);mkLine(buildLen(null,110,120,0,6*U),BLUE.c);mkLine(buildLen(null,110,290,0,9*U),RED.c);
   await say('用一樣大的格子來量一量。',id);await blocks(110,120,6,U,BLUE,id);await say('藍色的線，有6格。',id);
   await blocks(110,290,9,U,RED,id);await say('紅色的線，有9格。9比6多，紅色比較長。',id);}},
 {title:'哪一條跳繩比較長？',async run(id){
   const S=340,x0=230;const r1=buildLen(SH.sag,x0,80,S,390),r2=buildLen(SH.sag,x0,250,S,500);
   const k=[kid(x0,90,'#8e7dbe'),kid(x0+S,90,'#8e7dbe'),kid(x0,260,'#e07a5f'),kid(x0+S,260,'#e07a5f')];
   const L1=mkLine(r1,RED.c,8),L2=mkLine(r2,BLUE.c,8);txt(x0+S/2,ampOf(r1,80)+80+26,'①',{'font-size':26,fill:RED.c});txt(x0+S/2,ampOf(r2,250)+250+26,'②',{'font-size':26,fill:BLUE.c});
   await say('兩條跳繩，小朋友站得一樣遠。',id);await say('哪一條繩子比較長？',id);
   const g=await askChoice([{label:'① 紅繩',color:RED.c,value:1},{label:'② 藍繩',color:BLUE.c,value:2}],id);
   await say('我們把兩條繩子拉直看看！',id);k.forEach(x=>x.remove());[...svg.querySelectorAll('text')].forEach(t=>t.remove());
   await Promise.all([straighten(L1,90,120,1800,id),straighten(L2,90,290,1800,id)]);
   await Promise.all([blocks(90,120,Math.round(390/52),52,RED,id),blocks(90,290,Math.round(500/52),52,BLUE,id)]);
   await say('藍色的繩子垂得比較低、彎得比較多，拉直以後比較長。'+(g===2?'你答對了！':''),id);}},
 {title:'小心陷阱！',async run(id){
   label(50,120,BLUE);label(50,290,RED);await say('可是，彎彎的線一定比較長嗎？不一定喔！',id);
   const B=mkLine(buildLen(null,110,120,0,8*U),BLUE.c);await drawIn(B,900,id);await say('這條藍色的直線很長。',id);
   const R=mkLine(buildLen(SH.wave(1.5),110,290,200,6*U),RED.c);await drawIn(R,900,id);await say('這條紅色的彎線，彎彎的，可是很短。拉直看看！',id);
   await straighten(R,110,290,1800,id);await blocks(110,120,8,U,BLUE,id,1);await blocks(110,290,6,U,RED,id,1);
   await say('藍色8格，紅色只有6格。這次是直線比較長！',id);await say('所以不能只看彎不彎，要拉直，再比一比。',id);}},
 {title:'記住小口訣',async run(id){
   const L=[['🏁','起點終點一樣時，直直的線最短。','#e8f1ff'],['〰️','起點終點一樣時，彎得越多，線越長。','#ffe8e8'],['🪄','不確定？把線拉直，再數格子！','#e6f8ee']];
   for(let i=0;i<3;i++){const y=90+i*120,g=el('g',{class:'pop'});el('rect',{x:40,y:y-39,width:720,height:90,rx:20,fill:'rgba(61,44,30,.10)'},g);el('rect',{x:40,y:y-45,width:720,height:90,rx:20,fill:L[i][2]},g);
     emojiAt(95,y+2,L[i][0],{'font-size':38},g);txt(140,y+2,L[i][1],{'font-size':26,fill:'#3d2c1e','text-anchor':'start'},g);await say(L[i][1],id);}
   await say('接下來換你練習！',id);}}
 ]};

export const unitThick={practice:['thick2','thick3'],
 scenes:[
 {title:'什麼是厚？什麼是薄？',async run(id){
   ground(60,360,740);
   const g=el('g',{});objBread(g,250,360,1,170);await say('一片吐司，薄薄的。',id);
   const nums=['兩','三','四','五'];
   for(let i=2;i<=5;i++){g.innerHTML='';objBread(g,250,360,i,170);await say(nums[i-2]+'片。',id);}
   await say('疊起來，越來越高，就越來越厚！',id);
   el('rect',{x:470,y:354,width:200,height:5,fill:'#fff',stroke:'#999','stroke-width':1.5});txt(570,330,'一張紙',{'font-size':22,fill:'#7a6650'});
   await say('一張紙很薄。',id);const b=el('g',{class:'pop'});objBook(b,570,250,5,190,'#4d96ff');txt(570,140,'一本書',{'font-size':22,fill:'#7a6650'});
   await say('一本書很厚。',id);}},
 {title:'兩本書，哪本比較厚？',async run(id){
   ground(40,340,760);
   const a=el('g',{}),b=el('g',{});const A=objBook(a,230,340,2,250,'#e76f51'),B=objBook(b,590,340,4,140,'#2a9d8f');
   await say('這兩本書平平放在桌上。',id);await say('哪一本比較厚？',id);
   const g=await askChoice([{label:'左邊',color:'#e76f51',value:0},{label:'右邊',color:'#2a9d8f',value:1}],id);
   dashed(60,B.top,760,B.top,'#2a9d8f');await say('看誰疊得比較高。右邊的書比較高，所以右邊比較厚。'+(g===1?'答對了！':''),id);
   await say('左邊的書雖然比較寬，但是比較矮，所以比較薄。',id);await say('記住：寬寬的不一定厚喔！',id);}},
 {title:'三個比一比',async run(id){
   ground(40,340,760);
   const lv=[3,1,5],xs=[200,400,600],gs=lv.map((v,i)=>{const g=el('g',{});objCake(g,xs[i],340,v,130);return g;});
   await say('三塊蛋糕，哪一塊最薄？哪一塊最厚？',id);await say('我們從薄排到厚。',id);
   const order=[1,0,2];await tween(1400,e=>{order.forEach((idx,pos)=>{gs[idx].setAttribute('transform',`translate(${(xs[pos]-xs[idx])*e},0)`);});},id);
   txt(200,380,'最薄',{'font-size':26,fill:'#2a9d8f',class:'svgtxt pop'});await say('這一塊最矮，最薄。',id);
   txt(600,380,'最厚',{'font-size':26,fill:'#e76f51',class:'svgtxt pop'});await say('這一塊最高，最厚。',id);}},
 {title:'題目要做兩件事！',async run(id){
   ground(40,300,760);
   const lv=[2,4,1],xs=[200,400,600];lv.forEach((v,i)=>{const g=el('g',{});objBurger(g,xs[i],300,v,120);});
   const rs=xs.map(x=>({mx:x,my:360}));rs.forEach(r=>paren(r));
   txt(400,40,'最薄的打 ✓，最厚的畫 ○',{'font-size':30,fill:'#3d2c1e'});
   await say('這種題目要做兩件事喔！',id);await say('第一件事：最薄的打勾。',id);markShape(rs[2],'v','#e63946');await say('最薄的是右邊這個，打勾。',id);
   await say('第二件事：最厚的畫圈。',id);markShape(rs[1],'o','#e63946');await say('最厚的是中間這個，畫圈。',id);
   await say('做完要檢查：打勾了嗎？畫圈了嗎？兩件事都要做到！',id);}}
 ]};

export const unitAlign={practice:['align'],
 scenes:[
 {title:'站在箱子上的保溫瓶',async run(id){
   ground(60,380,740);
   const box=el('g',{});el('rect',{x:420,y:300,width:140,height:80,fill:'#d9a066',stroke:'#a8743f','stroke-width':3},box);el('line',{x1:420,y1:340,x2:560,y2:340,stroke:'#a8743f','stroke-width':2},box);
   const A=bottle(svg,260,380,200,'#e76f51'),B=bottle(svg,490,300,160,'#3a86ff');
   txt(260,405,'甲',{'font-size':22});txt(490,405,'乙',{'font-size':22});
   await say('哪一個保溫瓶比較高？',id);
   const g=await askChoice([{label:'甲',color:'#e76f51',value:0},{label:'乙',color:'#3a86ff',value:1}],id);
   await say('乙站在箱子上，看起來比較高。我們把它拿下來，從同一個地方比。',id);
   await tween(1300,e=>{B.setAttribute('transform',`translate(0,${80*e})`);box.style.opacity=1-e;},id);
   dashed(80,180,720,180,'#e76f51');await say('原來是甲比較高！'+(g===0?'你答對了！':''),id);}},
 {title:'斜斜的竹竿',async run(id){
   ground(60,380,740);
   const A=bamboo(svg,250,380,260,35),B=bamboo(svg,560,380,240,0);
   await say('一根竹竿斜斜的，一根直直站著。哪一根比較長？',id);
   const g=await askChoice([{label:'斜的',color:'#7cc36b',value:0},{label:'站著的',color:'#4d8f3e',value:1}],id);
   await say('斜斜的要先把它立起來，從同一個地方比。',id);
   await tween(1300,e=>A.setAttribute('transform',`rotate(${35*(1-e)} 250 380)`),id);
   dashed(80,120,720,120,'#4d8f3e');await say('原來斜的那根比較長！'+(g===0?'你答對了！':''),id);
   await say('記住：比長短、比高矮，要從同一個地方開始比！',id);}}
 ]};

/* ================= PRACTICE GENERATORS ================= */
const PU=40;
function rowsStraighten(lines,rows,tx,id,dur=1700){return Promise.all(lines.map((L,i)=>straighten(L,tx,rows[i],dur,id)));}
export const TYPES={
 classify(){
   const cells=[[40,20],[420,20],[40,220],[420,220]];
   let kinds=shuffle(['s','s','c','c']);if(Math.random()<.5)kinds[ri(0,3)]=pick(['s','c']);
   const regs=[],draws=[];kinds.forEach((k,i)=>{const[x,y]=cells[i],cx=x+170,cy=y+75;
     draws.push(()=>{if(k==='s'){const v=pick(['h','d','v']);if(v==='h')mkLine([[cx-120,cy],[cx+120,cy]],'#555',7);else if(v==='d'){const s=pick([1,-1]);mkLine([[cx-100,cy+45*s],[cx+100,cy-45*s]],'#555',7);}else mkLine([[cx,cy-60],[cx,cy+55]],'#555',7);}
       else{const v=pick(['arc','wave','curl']);if(v==='arc')mkLine(gen(SH.arc,cx-110,cy+45,220,95),'#555',7);else if(v==='wave')mkLine(gen(SH.wave(pick([1,1.5,2])),cx-120,cy,240,38),'#555',7);else mkLine(curl(cx-110,cy+35,200,30,3),'#555',7);}});
     regs.push({x,y,w:340,h:190,mx:cx,my:y+168});});
   return{mode:'classify',prompt:'是直線的打 ✓，是曲線的畫 ○。',answer:kinds.map(k=>k==='s'?'v':'o'),
     draw(){draws.forEach(d=>d());return regs;},
     async explain(id){kinds.forEach((k,i)=>txt(regs[i].mx+70,regs[i].my,k==='s'?'直線':'曲線',{'font-size':20,fill:k==='s'?'#2a9d8f':'#e76f51',class:'svgtxt pop'}));
       await say('直直的是直線，打勾；彎彎的是曲線，畫圈。斜斜的、站著的直線，也是直線喔。',id);}};
 },
 rope(){
   let L=distinct(2,7,12,2).map(v=>v*PU),same=Math.random()<.5;
   let S=L.map(l=>Math.round(l*rand(.8,.92)));if(same){const s=Math.min(...S);S=[s,s];}
   else if(Math.random()<.6){const lo=L[0]<L[1]?0:1;S[lo]=Math.max(S[lo],Math.min(L[lo]*.95,Math.max(...S)+20));S[1-lo]=Math.min(S[1-lo],L[1-lo]*.85,S[lo]-30);}
   S=S.map((s,i)=>Math.max(200,L[i]*.78,Math.min(s,L[i]*.95)));
   const rows=[60,235],ans=L[0]>L[1]?0:1;let lines,kids=[];
   return{mode:'pick',prompt:pick(['哪一條繩子比較長？把它圈起來。','哪一條跳繩比較長？把它圈起來。']),answer:ans,moves:true,
     draw(){const regs=[];lines=[0,1].map(i=>{const x0=440-S[i]/2,p=buildLen(SH.sag,x0,rows[i],S[i],L[i]);
       kids.push(kid(x0,rows[i]+10,i?'#e07a5f':'#8e7dbe'),kid(x0+S[i],rows[i]+10,i?'#e07a5f':'#8e7dbe'));
       const a=ampOf(p,rows[i]);kids.push(txt(70,rows[i]+a/2,i?'②':'①',{'font-size':34,fill:'#555'}));
       regs.push({x:x0-30,y:rows[i]-70,w:S[i]+60,h:a+90});return mkLine(p,C[i].c,8);});return regs;},
     async explain(id){kids.forEach(k=>k.remove());await rowsStraighten(lines,[110,290],90,id);
       const n=L.map(l=>l/PU);await Promise.all([blocks(90,110,n[0],PU,C[0],id,1),blocks(90,290,n[1],PU,C[1],id,1)]);
       await say(`拉直以後，①有${n[0]}格，②有${n[1]}格，${ans?'②':'①'}比較長。看繩子垂得多低、彎得多不多，拉直才知道！`,id);}};
 },
 box(){
   const three=Math.random()<.6,n=three?3:2,askLong=Math.random()<.6;
   let units=three?[10,ri(12,13),ri(15,16)]:[10,ri(12,15)];
   const kinds=units.map((u,i)=>i===0?'s':'c');const order=shuffle([...Array(n).keys()]);
   const U2=order.map(i=>units[i]),K=order.map(i=>kinds[i]);
   const rows=three?[95,210,325]:[130,290],x0=180,span=400;let lines;
   const target=askLong?U2.indexOf(Math.max(...U2)):U2.indexOf(Math.min(...U2));
   const word=n===3?(askLong?'最長':'最短'):(askLong?'比較長':'比較短');
   return{mode:'pick',prompt:`${word}的線，把它圈起來。`,answer:target,moves:true,
     draw(){el('line',{x1:x0,y1:40,x2:x0,y2:390,stroke:'#bbb','stroke-width':3,'stroke-dasharray':'6 6'});el('line',{x1:x0+span,y1:40,x2:x0+span,y2:390,stroke:'#bbb','stroke-width':3,'stroke-dasharray':'6 6'});
       const regs=[];lines=U2.map((u,i)=>{let p;if(K[i]==='s')p=buildLen(null,x0,rows[i],0,u*PU);else{let w=Math.round(span/100)+pick([0,.5,1]);do{p=buildLen(SH.wave(w),x0,rows[i],span,u*PU);w+=.5;}while(ampOf(p,rows[i])>(three?44:60));}
         regs.push({x:x0-20,y:rows[i]-50,w:span+40,h:100});label(80,rows[i],C[i]);return mkLine(p,C[i].c,8);});return regs;},
     async explain(id){await rowsStraighten(lines,rows,120,id);await Promise.all(lines.map((L,i)=>blocks(120,rows[i],U2[i],PU,C[i],id,1)));
       await say(`拉直以後，${U2.map((u,i)=>C[i].n+'色'+u+'格').join('，')}。${C[target].n}色${word}。起點終點一樣時，彎得越多越長！`,id);}};
 },
 curve3(){
   const U3=distinct(3,5,14,2),rows=[95,210,325];let hasS=false;const K=U3.map(u=>{if(!hasS&&u<=12&&Math.random()<.4){hasS=true;return's';}return'c';});
   let lines;const iv=U3.indexOf(Math.max(...U3)),io=U3.indexOf(Math.min(...U3));
   return{mode:'dual',prompt:'最長的打 ✓，最短的畫 ○。',answer:{v:iv,o:io},moves:true,
     draw(){const regs=[];lines=U3.map((u,i)=>{const len=u*PU;let p,span;
       if(K[i]==='s'){span=len;const x=ri(110,Math.max(110,690-span));p=buildLen(null,x,rows[i],0,len);}
       else{span=Math.max(120,Math.round(len*rand(.55,.85)));const x=ri(110,Math.max(110,690-span));let w=Math.max(1,Math.round(span/95));do{p=buildLen(SH.wave(w),x,rows[i],span,len);w+=.5;}while(ampOf(p,rows[i])>42);}
       label(55,rows[i],C[i]);regs.push({x:p[0][0]-15,y:rows[i]-48,w:span+30,h:96,mx:745,my:rows[i]});return mkLine(p,C[i].c,8);});return regs;},
     async explain(id){await rowsStraighten(lines,rows,90,id);await Promise.all(lines.map((L,i)=>blocks(90,rows[i],U3[i],PU,C[i],id,1)));
       await say(`拉直數格子：${U3.map((u,i)=>C[i].n+'色'+u+'格').join('，')}。${C[iv].n}色最長，打勾；${C[io].n}色最短，畫圈。`,id);}};
 },
 thick2(){return thickGen(2);},thick3(){return thickGen(3);},
 align(){const v=pick(['bottle','bamboo','bamboo2']);
   if(v==='bottle'){const bh=ri(60,90),hb=ri(130,170),hf=hb+ri(25,Math.min(45,bh-15)),raised=ri(0,1),xs=[250,520];let B,box;
     return{mode:'pick',prompt:'哪一個保溫瓶比較高？把它圈起來。',answer:1-raised,
       draw(){ground(60,380,740);box=el('g',{});const bx=xs[raised];
         el('rect',{x:bx-70,y:380-bh,width:140,height:bh,fill:'#d9a066',stroke:'#a8743f','stroke-width':3},box);
         B=bottle(svg,bx,380-bh,hb,'#3a86ff');bottle(svg,xs[1-raised],380,hf,'#e76f51');
         return xs.map((x,i)=>i===raised?{x:x-75,y:380-bh-hb-10,w:150,h:bh+hb+20}:{x:x-40,y:380-hf-10,w:80,h:hf+20});},
       async explain(id){await say('站在箱子上的，要拿下來，從同一個地方比。',id);await tween(1200,e=>{B.setAttribute('transform',`translate(0,${bh*e})`);box.style.opacity=1-e;},id);
         dashed(70,380-hf,730,380-hf,'#e76f51');await say(`拿下來比，${POS2[1-raised]}的比較高。`,id);}};}
   const ask=pick(['長','短']);const tiltLonger=Math.random()<.6;const Lv=ri(200,240),Lt=tiltLonger?Lv+ri(15,30):Lv-ri(30,50);const ang=pick([30,35,-30,-35]);
   const ti=ri(0,1),xs=[250,560];let T;const longIdx=tiltLonger?ti:1-ti;const ans=ask==='長'?longIdx:1-longIdx;
   return{mode:'pick',prompt:`哪一根竹竿比較${ask}？把它圈起來。`,answer:ans,
     draw(){ground(60,380,740);T=bamboo(svg,xs[ti],380,Lt,ang);bamboo(svg,xs[1-ti],380,Lv,0);
       return xs.map((x,i)=>i===ti?{x:x-(ang>0?20:Lt*.6),y:380-Lt-10,w:Lt*.6+40,h:Lt+20}:{x:x-30,y:380-Lv-10,w:60,h:Lv+20});},
     async explain(id){await say('斜斜的竹竿，先把它立起來再比。',id);await tween(1200,e=>T.setAttribute('transform',`rotate(${ang*(1-e)} ${xs[ti]} 380)`),id);
       dashed(70,380-Math.max(Lt,Lv),730,380-Math.max(Lt,Lv),'#4d8f3e');await say(`立起來比，${POS2[ans]}的竹竿比較${ask}。`,id);}};
 }
};

function thickGen(n){const type=pick(Object.keys(THICK)),T=THICK[type];const lv=distinct(n,T.lo,T.hi,1);
  let ws=Array.from({length:n},()=>ri(100,160));if(Math.random()<.6){const sw=ws.slice().sort((a,b)=>b-a),ord=lv.map((v,i)=>i).sort((a,b)=>lv[a]-lv[b]);ord.forEach((idx,k)=>ws[idx]=sw[k]);}
  const xs=n===2?[270,530]:[180,400,620],base=320,iv=lv.indexOf(Math.min(...lv)),io=lv.indexOf(Math.max(...lv));let info=[];
  const P=n===2?POS2:POS3,w1=n===2?'比較':'最';
  return{mode:'dual',prompt:`${w1}薄的打 ✓，${w1}厚的畫 ○。`,answer:{v:iv,o:io},
    draw(){ground(40,base,760);const cols=['#e76f51','#2a9d8f','#9b5de5'];
      return xs.map((x,i)=>{const g=el('g',{});const r=T.f(g,x,base,lv[i],ws[i],cols[i]);info.push(r);return{x:x-ws[i]/2-14,y:r.top-12,w:ws[i]+28,h:base-r.top+20,mx:x,my:375};});},
    async explain(id){info.forEach((r,i)=>{if(i===io||i===iv)dashed(40,r.top,760,r.top,i===io?'#e76f51':'#2a9d8f');});
      await say(`平平放著，看誰疊得高。${P[io]}的${T.name}最高，${w1}厚，畫圈；${P[iv]}的最矮，${w1}薄，打勾。寬寬的不一定厚喔！`,id);}};}
