// 一上數學學期包：10以內的數、順序與多少：單元與題型。
// 程式從舊版單檔原樣搬來，只補上 import／export，並把 runId 改成 S.runId。
import { ABORT, S } from '../../../engine/state.js';
import { RED, BLUE, ri, pick, shuffle, POS3 } from '../../../engine/util.js';
import { subEl, chk, wait, speakOne, say } from '../../../engine/speech.js';
import { svg, el, txt, tween } from '../../../engine/svg.js';
import { clearBar, button, askChoice } from '../../../engine/ui.js';
import { sentence, tenFrame } from './split.js';

/* ===== module a_numbers.js ===== */
/* ===== Builder A：10以內的數 / 順序與多少（翰林 1上 一、三） ===== */
const a_EMO=['🍎','🐟','🌟','🚗','🐤','🍩','🎈','🐢','🍓','⚽'];
const a_ANI=['🐶','🐱','🐰','🐻','🐼','🐸','🐷','🐵','🐔','🐯'];
const a_PAIRS=[{a:'🐰',b:'🥕',na:'兔子',nb:'蘿蔔'},{a:'🥤',b:'🥄',na:'杯子',nb:'湯匙'},{a:'🐶',b:'🦴',na:'小狗',nb:'骨頭'},{a:'🐝',b:'🌼',na:'蜜蜂',nb:'花'},{a:'🧒',b:'🎈',na:'小朋友',nb:'氣球'}];
function a_xs(n,gap,cx=400){return Array.from({length:n},(_,i)=>cx-(n-1)*gap/2+i*gap);}
function a_grid(n,cx,cy,cols=5,gx=70,gy=70){const rows=Math.ceil(n/cols),out=[];for(let i=0;i<n;i++){const r=Math.floor(i/cols),c=i%cols,inRow=r<rows-1?cols:n-cols*(rows-1);out.push([cx-(inRow-1)*gx/2+c*gx,cy-(rows-1)*gy/2+r*gy]);}return out;}
function a_scatter(n,x0,y0,w,h,minD=72){const pts=[];for(let t=0;t<4000&&pts.length<n;t++){const p=[x0+Math.random()*w,y0+Math.random()*h];if(pts.every(q=>Math.hypot(q[0]-p[0],q[1]-p[1])>=minD))pts.push(p);}
  return pts.length===n?pts:a_grid(n,x0+w/2,y0+h/2,5,80,80);}
const a_X=t=>+t.getAttribute('x'),a_Y=t=>+t.getAttribute('y');
async function a_tagCount(items,id,col='#e07a00',fast,dy=-42){for(let i=0;i<items.length;i++){chk(id);const t=items[i];txt(a_X(t),a_Y(t)+dy,String(i+1),{'font-size':20,fill:col,class:'svgtxt pop'});await wait(fast?140:300,id);}}
async function a_realign(items,xs,id,dur=700){const st=items.map(a_X);await tween(dur,e=>items.forEach((t,i)=>t.setAttribute('x',st[i]+(xs[i]-st[i])*e)),id);}
async function a_pair(top,bot,id){const n=Math.min(top.length,bot.length);
  for(let i=0;i<n;i++){chk(id);el('line',{x1:a_X(top[i]),y1:a_Y(top[i])+26,x2:a_X(bot[i]),y2:a_Y(bot[i])-26,stroke:'#888','stroke-width':3,class:'pop'});await wait(200,id);}
  const extra=(top.length>n?top:bot).slice(n);extra.forEach(e=>el('circle',{cx:a_X(e),cy:a_Y(e),r:30,fill:'none',stroke:'#e63946','stroke-width':4,'stroke-dasharray':'6 5',class:'pop'}));return extra.length;}
function a_rowReg(xs,y){const lo=Math.min(...xs),hi=Math.max(...xs);return{x:lo-40,y:y-40,w:hi-lo+80,h:80};}
function a_cards(cy,vals,unkIdx,gap=110,w=90){const xs=a_xs(vals.length,gap);let ut=null;
  xs.forEach((x,i)=>{const u=i===unkIdx;el('rect',{x:x-w/2,y:cy-42,width:w,height:84,rx:14,fill:u?'#fff':'#fff3c4',stroke:u?'#ff8c42':'#c9b28a','stroke-width':4,'stroke-dasharray':u?'7 6':'none'});
    const t=txt(x,cy+2,u?'?':String(vals[i]),{'font-size':40,fill:u?'#ff8c42':'#3d2c1e'});if(u)ut=t;});
  return{xs,fill(n,c='#3d2c1e'){if(ut){ut.textContent=n;ut.setAttribute('fill',c);}}};}
function a_tapCount(n,emo,id){return new Promise((res,rej)=>{const pts=a_scatter(n,120,80,560,260,85);let k=0;const done=new Set();
  const items=pts.map(([x,y],i)=>{const t=txt(x,y,emo,{'font-size':50,style:'cursor:pointer'});t.addEventListener('click',()=>tap(i));return t;});
  const tm=setInterval(()=>{if(id!==S.runId){clearInterval(tm);clearBar();rej(ABORT);}},200);
  function tap(i){if(done.has(i)||id!==S.runId)return;done.add(i);k++;const t=items[i];t.style.opacity=.5;
    txt(a_X(t),a_Y(t)-40,String(k),{'font-size':24,fill:'#e07a00',class:'svgtxt pop'});subEl.textContent=String(k);speakOne(String(k));
    if(k===n){clearInterval(tm);clearBar();setTimeout(()=>id===S.runId?res(n):rej(ABORT),700);}}
  clearBar();button('🪄 幫我數','#9b7bd8',async()=>{for(let i=0;i<n;i++){if(!done.has(i)){tap(i);await new Promise(r=>setTimeout(r,260));}}});});}
function a_motto(L){return async id=>{const bg=['#e8f1ff','#ffe8e8','#e6f8ee'];for(let i=0;i<L.length;i++){const y=90+i*120,g=el('g',{class:'pop'});
  el('rect',{x:40,y:y-45,width:720,height:90,rx:20,fill:bg[i]},g);txt(95,y+2,L[i][0],{'font-size':38},g);txt(140,y+2,L[i][1],{'font-size':26,fill:'#3d2c1e','text-anchor':'start'},g);await say(L[i][1],id);}
  await say('接下來換你練習！',id);};}

export const unitNum10={count:8,practice:['n10count','n10match','n10corr','n10frame'],
 scenes:[
 {title:'1～5 數一數',async run(id){const xs=a_xs(5,120);await say('我們來數蘋果。',id);
   for(let i=0;i<5;i++){txt(xs[i],180,'🍎',{'font-size':58,class:'svgtxt pop'});txt(xs[i],105,String(i+1),{'font-size':36,fill:'#e07a00',class:'svgtxt pop'});subEl.textContent=String(i+1);await speakOne(String(i+1));chk(id);await wait(200,id);}
   await say('數到 5，就是有 5 個蘋果。',id);
   const g=el('g',{class:'pop'});el('rect',{x:230,y:265,width:340,height:120,rx:20,fill:'#fff3c4'},g);txt(310,327,'5',{'font-size':84,fill:'#3d2c1e'},g);txt(420,327,'五',{'font-size':60,fill:'#3d2c1e'},g);
   a_xs(5,22,515).forEach(x=>el('circle',{cx:x,cy:327,r:8,fill:RED.c},g));
   await say('5 個，寫成數字 5，念作五。',id);}},
 {title:'6～10 數一數',async run(id){const pts=a_grid(10,400,190,5,100,110);await say('先數 5 顆星星。',id);
   for(let i=0;i<5;i++){txt(pts[i][0],pts[i][1],'🌟',{'font-size':54,class:'svgtxt pop'});txt(pts[i][0],pts[i][1]-42,String(i+1),{'font-size':24,fill:'#e07a00',class:'svgtxt pop'});}
   await say('一排 5 顆。再一顆一顆加上去。',id);
   for(let i=5;i<10;i++){txt(pts[i][0],pts[i][1],'🌟',{'font-size':54,class:'svgtxt pop'});txt(pts[i][0],pts[i][1]-42,String(i+1),{'font-size':24,fill:'#e07a00',class:'svgtxt pop'});subEl.textContent=String(i+1);await speakOne(String(i+1));chk(id);await wait(250,id);}
   await say('10 顆星星，剛好排滿兩排，一排 5 顆。',id);}},
 {title:'換你點點數',async run(id){const p=a_tapCount(7,'🐤',id);await say('這裡有好多小雞，換你來數！',id);await say('點一隻，數一個。點過的會變淡，不要再點喔！',id);
   const n=await p;await say(`最後數到 ${n}，所以全部有 ${n} 隻小雞！`,id);await say('一個一個數，不重複、不漏掉。',id);}},
 {title:'一個對一個',async run(id){const top=a_put(a_xs(5,110),110,'🥤'),bot=a_put(a_xs(4,110,345),300,'🥄');
   await say('5 個杯子，4 支湯匙。',id);await say('每個杯子都能分到一支湯匙嗎？',id);
   const g=await askChoice([{label:'夠',color:BLUE.c,value:1},{label:'不夠',color:RED.c,value:0}],id);
   await say('我們一個杯子配一支湯匙，連起來看看。',id);await a_pair(top,bot,id);
   await say('有一個杯子沒有湯匙，湯匙不夠！'+(g===0?'你答對了！':''),id);await say('杯子比湯匙多。一個對一個連起來，就知道夠不夠。',id);}},
 {title:'0 是一個都沒有',async run(id){el('ellipse',{cx:300,cy:230,rx:190,ry:80,fill:'#fff1e0',stroke:'#e8c79a','stroke-width':3});
   const ck=a_put(a_xs(3,100,300),225,'🍪',58);const num=txt(640,225,'3',{'font-size':120,fill:'#e07a00'});
   await say('盤子裡有 3 片餅乾。',id);
   for(let i=2;i>=0;i--){ck[i].remove();num.textContent=String(i);await say(i?`吃掉一片，剩下 ${i} 片。`:'再吃掉一片……',id);}
   await say('盤子裡一片都沒有，就是 0。',id);}},
 {title:'記住小口訣',run:a_motto([['👆','一個一個數，不重複、不漏掉。'],['🔚','最後數到的數，就是全部。'],['🔗','一個對一個，就知道夠不夠。']])}
 ]};
function a_put(xs,y,emo,size=50,parent=svg){return xs.map(x=>txt(x,y,emo,{'font-size':size,class:'svgtxt pop'},parent));}

export const unitOrder={count:8,practice:['ordSeq','ordNth','ordCardinal','ordMore','ordDiff'],
 scenes:[
 {title:'數的順序',async run(id){const xs=a_xs(10,72);txt(26,180,'🚂',{'font-size':40});const T=[];
   await say('數字火車，一節一節排好。',id);
   for(let i=0;i<10;i++){el('rect',{x:xs[i]-31,y:150,width:62,height:60,rx:10,fill:'#fff3c4',stroke:'#c9b28a','stroke-width':3,class:'pop'});T.push(txt(xs[i],182,String(i+1),{'font-size':30,fill:'#3d2c1e',class:'svgtxt pop'}));await wait(120,id);}
   await say('越後面，數字越大。',id);await say('5 的後面是幾？',id);
   const g=await askChoice([{label:'4',color:BLUE.c,value:4},{label:'6',color:RED.c,value:6}],id);
   el('circle',{cx:xs[5],cy:180,r:36,fill:'none',stroke:'#2bb673','stroke-width':5,class:'pop'});await say('5 的後面是 6，多 1。'+(g===6?'答對了！':''),id);await say('5 的前面是 4，少 1。',id);
   T[7].textContent='?';T[7].setAttribute('fill','#ff8c42');await say('這一節的數字不見了，它是幾？',id);
   const h=await askChoice([7,8,9].map(v=>({label:String(v),color:'#ff8c42',value:v})),id);
   T[7].textContent='8';T[7].setAttribute('fill','#2bb673');await say('7 的後面、9 的前面，是 8。'+(h===8?'你答對了！':''),id);}},
 {title:'第幾個？幾個？',async run(id){const xs=a_xs(6,100,430);txt(70,140,'左',{'font-size':28,fill:'#7a6650'});const r1=a_put(xs,140,'🐰',52);
   await say('「從左邊數來第 3 隻」，要圈幾隻呢？',id);
   const g=await askChoice([{label:'1 隻',color:BLUE.c,value:1},{label:'3 隻',color:RED.c,value:3}],id);
   await a_tagCount(r1.slice(0,3),id);el('circle',{cx:xs[2],cy:140,r:36,fill:'none',stroke:'#2bb673','stroke-width':5,class:'pop'});
   await say('數到第 3 隻，只圈這一隻。'+(g===1?'答對了！':''),id);
   txt(70,320,'左',{'font-size':28,fill:'#7a6650'});const r2=a_put(xs,320,'🐰',52);await say('那「3 隻」呢？',id);await a_tagCount(r2.slice(0,3),id);
   el('rect',{x:xs[0]-42,y:280,width:xs[2]-xs[0]+84,height:80,rx:30,fill:'none',stroke:'#e07a00','stroke-width':5,class:'pop'});
   await say('3 隻，要把 3 隻全部圈起來。',id);await say('第 3 個，只有一個；3 個，是全部 3 個。',id);}},
 {title:'從右邊數來',async run(id){const xs=a_xs(6,100,400);const r=a_put(xs,190,'🚗',52);txt(745,190,'右',{'font-size':28,fill:'#7a6650'});
   await say('這次從右邊開始數。',id);await a_tagCount(r.slice(2).reverse(),id,BLUE.c);
   el('circle',{cx:xs[2],cy:190,r:36,fill:'none',stroke:'#2bb673','stroke-width':5,class:'pop'});await say('從右邊數來第 4 台，是這一台。',id);
   await say('那從左邊數來，它是第幾台？',id);const g=await askChoice([2,3,4].map(v=>({label:'第 '+v+' 台',color:'#ff8c42',value:v})),id);
   await a_tagCount(r.slice(0,3),id,'#e07a00',false,40);await say('從左邊數來是第 3 台。'+(g===3?'答對了！':'')+'從哪一邊數，答案會不一樣喔！',id);}},
 {title:'哪一個比較多？',async run(id){const top=a_put(a_xs(6,70,330),110,'🐰'),bot=a_put(a_xs(4,150,400),300,'🥕');
   await say('兔子和蘿蔔，哪一個比較多？',id);const g=await askChoice([{label:'兔子',color:BLUE.c,value:0},{label:'蘿蔔',color:'#ff8c42',value:1}],id);
   await say('蘿蔔排得比較長，可是不一定比較多。我們一個對一個排好。',id);await a_realign(bot,a_xs(6,70,330).slice(0,4),id);await a_pair(top,bot,id);
   await say('兔子多出 2 隻沒有蘿蔔。兔子比蘿蔔多 2 個。'+(g===0?'答對了！':''),id);await say('比多少，不要看排得長不長，要一個對一個比。',id);}},
 {title:'記住小口訣',run:a_motto([['🔢','前面少 1，後面多 1。'],['☝️','第幾個：只圈一個；幾個：全部圈起來。'],['🔗','比多少：一個對一個，剩下的就是多的。']])}
 ]};

export const TYPES={
 n10count(){const n=ri(1,10),emo=pick(a_EMO),grid=Math.random()<.5;let items,S;
   return{mode:'num',prompt:'數一數，一共有幾個？',answer:n,max:10,
     draw(){const pts=grid?a_grid(n,400,170,5,85,85):a_scatter(n,130,70,540,210,78);items=pts.map(([x,y])=>txt(x,y,emo,{'font-size':48}));S=sentence(358,['一共有',{v:n,u:true},'個']);return[];},
     fill(v,c){S.fill(v,c);},
     async explain(id){await a_tagCount(items,id,'#e07a00',true);await say(`一個一個數，最後數到 ${n}，所以有 ${n} 個。`,id);}};},
 n10match(){const t=ri(2,9);const others=shuffle([t-2,t-1,t+1,t+2].filter(v=>v>=1&&v<=10)).slice(0,2);const vals=shuffle([t,...others]),ans=vals.indexOf(t),emo=pick(a_EMO);const cx=[150,400,650];let groups=[];
   return{mode:'pick',prompt:`哪一盒有 ${t} 個？把它圈起來。`,answer:ans,
     draw(){txt(400,42,String(t),{'font-size':48,fill:'#e07a00'});return vals.map((v,i)=>{el('rect',{x:cx[i]-110,y:85,width:220,height:250,rx:18,fill:'#fffaf0',stroke:'#c9b28a','stroke-width':3});
       groups.push(a_grid(v,cx[i],210,3,64,58).map(([x,y])=>txt(x,y,emo,{'font-size':40})));return{x:cx[i]-110,y:85,w:220,h:250};});},
     async explain(id){for(const g of groups)await a_tagCount(g,id,'#e07a00',true,-26);await say(`${POS3[ans]}這盒數到 ${t}，有 ${t} 個。`,id);}};},
 n10corr(){const P=pick(a_PAIRS);let a=ri(2,8),b=Math.random()<.3?a:ri(2,8);if(a!==b&&Math.abs(a-b)>3)b=a+(b>a?3:-3);b=Math.max(2,Math.min(8,b));
   const ans=a>b?0:a<b?1:2;const wideTop=a<b;let top,bot;const xsWide=n=>n===1?[335]:Array.from({length:n},(_,i)=>100+i*470/(n-1)),xsTight=n=>Array.from({length:n},(_,i)=>110+i*62);
   return{mode:'pick',prompt:`${P.na}和${P.nb}，哪一種比較多？一樣多就圈「一樣多」。`,answer:ans,
     draw(){const xa=a===b?xsTight(a):(wideTop?xsWide(a):xsTight(a)),xb=a===b?xsWide(b):(wideTop?xsTight(b):xsWide(b));
       top=xa.map(x=>txt(x,120,P.a,{'font-size':46}));bot=xb.map(x=>txt(x,290,P.b,{'font-size':46}));
       el('rect',{x:640,y:160,width:130,height:96,rx:18,fill:'#fff3c4',stroke:'#c9b28a','stroke-width':3});txt(705,208,'一樣多',{'font-size':28,fill:'#3d2c1e'});
       return[a_rowReg(xa,120),a_rowReg(xb,290),{x:636,y:156,w:138,h:104}];},
     async explain(id){const xs=Array.from({length:8},(_,i)=>110+i*62);await Promise.all([a_realign(top,xs.slice(0,a),id),a_realign(bot,xs.slice(0,b),id)]);await a_pair(top,bot,id);
       await say(a===b?`一個對一個剛剛好，${P.na}和${P.nb}一樣多。`:`一個對一個，${a>b?P.na:P.nb}有剩下，${a>b?P.na:P.nb}比較多。`,id);}};},
 n10frame(){const k=Math.random()<.12?0:ri(1,10);let cells,S;
   return{mode:'num',prompt:'十格框裡有幾個紅點？',answer:k,max:10,
     draw(){cells=tenFrame(400,150,k);S=sentence(330,['有',{v:k,u:true},'個紅點']);return[];},fill(v,c){S.fill(v,c);},
     async explain(id){if(!k){await say('一個紅點都沒有，就是 0。',id);return;}
       for(let i=0;i<k;i++){chk(id);txt(cells[i][0],cells[i][1]+1,String(i+1),{'font-size':20,fill:'#fff',class:'svgtxt pop'});await wait(150,id);}
       await say(k>5?`上面一排 5 個，下面再數到 ${k}，有 ${k} 個。`:`數一數，有 ${k} 個。`,id);}};},
 ordSeq(){const desc=Math.random()<.3,len=6,s=ri(1,10-len+1);let vals=Array.from({length:len},(_,i)=>s+i);if(desc)vals.reverse();const u=ri(0,len-1),ans=vals[u];let K;
   return{mode:'num',prompt:desc?'數字倒著排，問號是幾？':'數字照順序排，問號是幾？',answer:ans,max:10,
     draw(){txt(400,70,desc?'⬅ 越來越小':'越來越大 ➡',{'font-size':26,fill:'#7a6650'});K=a_cards(200,vals,u);return[];},fill(v,c){K.fill(v,c);},
     async explain(id){for(let i=0;i<len;i++){chk(id);el('circle',{cx:K.xs[i],cy:270,r:8,fill:i===u?'#2bb673':'#c9b28a',class:'pop'});await wait(160,id);}
       const nb=u>0?`${vals[u-1]} 的後面是 ${ans}`:`${ans} 的後面是 ${vals[1]}`;await say(`${desc?'倒著數，':''}${nb}，問號是 ${ans}。`,id);}};},
 ordNth(){const n=ri(6,8),left=Math.random()<.5,k=ri(1,n),xs=a_xs(n,85),ans=left?k-1:n-k,emos=shuffle(a_ANI).slice(0,n);let items;
   return{mode:'pick',prompt:`從${left?'左':'右'}邊數來第 ${k} 隻，把牠圈起來。`,answer:ans,
     draw(){txt(left?32:768,210,left?'左':'右',{'font-size':28,fill:'#7a6650'});items=emos.map((e,i)=>txt(xs[i],210,e,{'font-size':48}));return xs.map(x=>({x:x-38,y:165,w:76,h:90}));},
     async explain(id){const seq=left?items.slice(0,k):items.slice(n-k).reverse();await a_tagCount(seq,id,BLUE.c,true,-44);await say(`從${left?'左':'右'}邊開始數，數到 ${k}，就是這一隻。只要圈一隻喔。`,id);}};},
 ordCardinal(){const n=ri(6,7),k=ri(2,5),askNth=Math.random()<.5,nthRow=ri(0,1),xs=a_xs(n,78,430),ys=[140,300];const fill=(row,i)=>row===nthRow?i===k-1:i<k;
   const ans=askNth?nthRow:1-nthRow;
   return{mode:'pick',prompt:askNth?`哪一排是「從左邊數來第 ${k} 個」塗上顏色？`:`哪一排是塗了「${k} 個」？`,answer:ans,
     draw(){ys.forEach((y,r)=>{txt(55,y,r?'②':'①',{'font-size':34,fill:'#555'});xs.forEach((x,i)=>el('circle',{cx:x,cy:y,r:26,fill:fill(r,i)?'#ff8c42':'#fff',stroke:'#c9b28a','stroke-width':3}));});
       return ys.map(y=>a_rowReg(xs,y));},
     async explain(id){for(const y of ys)for(let i=0;i<k;i++){chk(id);txt(xs[i],y-44,String(i+1),{'font-size':18,fill:'#7a6650',class:'svgtxt pop'});await wait(110,id);}
       await say(`第 ${k} 個，只塗一個；${k} 個，要塗 ${k} 個。所以是${ans?'第二':'第一'}排。`,id);}};},
 ordMore(){const P=pick(a_PAIRS),[a,b]=(()=>{const x=ri(3,8);let y;do{y=ri(2,8);}while(y===x||Math.abs(y-x)>3);return[x,y];})(),askMore=Math.random()<.6;
   const ans=askMore?(a>b?0:1):(a<b?0:1);let top,bot;const xa=a<b?Array.from({length:a},(_,i)=>100+i*560/(a-1)):Array.from({length:a},(_,i)=>110+i*64),xb=b<a?Array.from({length:b},(_,i)=>100+i*560/(b-1)):Array.from({length:b},(_,i)=>110+i*64);
   return{mode:'pick',prompt:`${P.na}和${P.nb}，哪一種比較${askMore?'多':'少'}？把那一排圈起來。`,answer:ans,
     draw(){top=xa.map(x=>txt(x,120,P.a,{'font-size':46}));bot=xb.map(x=>txt(x,300,P.b,{'font-size':46}));return[a_rowReg(xa,120),a_rowReg(xb,300)];},
     async explain(id){const xs=Array.from({length:8},(_,i)=>110+i*64);await Promise.all([a_realign(top,xs.slice(0,a),id),a_realign(bot,xs.slice(0,b),id)]);await a_pair(top,bot,id);
       await say(`一個對一個，${a>b?P.na:P.nb}有剩下，${a>b?P.na:P.nb}比較多，${a>b?P.nb:P.na}比較少。不要看排得長不長喔！`,id);}};},
 ordDiff(){const P=pick(a_PAIRS),b=ri(2,6),d=ri(1,Math.min(4,8-b)),a=b+d,xs=Array.from({length:8},(_,i)=>130+i*72);let top,bot,S;
   return{mode:'num',prompt:`${P.na}比${P.nb}多幾個？`,answer:d,max:10,
     draw(){top=xs.slice(0,a).map(x=>txt(x,100,P.a,{'font-size':46}));bot=xs.slice(0,b).map(x=>txt(x,240,P.b,{'font-size':46}));S=sentence(355,[P.na+'多',{v:d,u:true},'個']);return[];},
     fill(v,c){S.fill(v,c);},
     async explain(id){await a_pair(top,bot,id);await a_tagCount(top.slice(b),id,'#e63946',false,-40);await say(`一個對一個，${P.na}多出 ${d} 個，所以多 ${d} 個。`,id);}};}
};
