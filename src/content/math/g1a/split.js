// 一上數學學期包：分與合：分合圖、算式卡、火車車廂工具，分與合單元與題型。
// 程式從舊版單檔原樣搬來，只補上 import／export，並把 runId 改成 S.runId。
import { ABORT, S } from '../../../engine/state.js';
import { RED, BLUE, GREEN, ri, pick, shuffle } from '../../../engine/util.js';
import { subEl, chk, wait, speakOne, say } from '../../../engine/speech.js';
import { svg, el, txt, clear, tween } from '../../../engine/svg.js';
import { clearBar, button } from '../../../engine/ui.js';

/* ================= 分與合 ================= */
export const OBJ=['🍎','🍓','🐟','⚽','🍬','🐥','🍪','🌟'];
export function bondDiag(cx,ty,vals,unk,parent=svg){const pos=[[cx,ty],[cx-95,ty+120],[cx+95,ty+120]];
  el('line',{x1:cx-20,y1:ty+30,x2:cx-80,y2:ty+90,stroke:'#b9a27a','stroke-width':5},parent);el('line',{x1:cx+20,y1:ty+30,x2:cx+80,y2:ty+90,stroke:'#b9a27a','stroke-width':5},parent);
  const T=[];pos.forEach(([x,y],i)=>{const u=i===unk;el('circle',{cx:x,cy:y,r:36,fill:i===0?'#fff3c4':'#fff',stroke:u?'#ff8c42':'#c9b28a','stroke-width':4,'stroke-dasharray':u?'7 6':'none'},parent);
    T[i]=txt(x,y+2,u?'?':String(vals[i]),{'font-size':36,fill:u?'#ff8c42':'#3d2c1e'},parent);});
  return{fill(n,c='#3d2c1e'){if(unk>=0){T[unk].textContent=n;T[unk].setAttribute('fill',c);}}};}
export function sentence(cy,toks,parent=svg){const W=t=>typeof t==='string'?t.length*30+18:86;const tot=toks.reduce((s,t)=>s+W(t),0);let x=400-tot/2,ut=null;
  toks.forEach(t=>{const w=W(t);if(typeof t==='string')txt(x+w/2,cy,t,{'font-size':28,fill:'#3d2c1e'},parent);
    else{el('rect',{x:x+7,y:cy-38,width:72,height:76,rx:12,fill:'#fff',stroke:t.u?'#ff8c42':'#c9b28a','stroke-width':4,'stroke-dasharray':t.u?'7 6':'none'},parent);
      const tt=txt(x+w/2,cy+2,t.u?'?':String(t.v),{'font-size':38,fill:t.u?'#ff8c42':'#3d2c1e'},parent);if(t.u)ut=tt;}x+=w;});
  return{fill(n,c='#3d2c1e'){if(ut){ut.textContent=n;ut.setAttribute('fill',c);}}};}
export async function countDots(x0,y,cols,id,gap=46,fast){const out=[];for(let i=0;i<cols.length;i++){chk(id);const g=el('g',{class:'pop'});
  el('circle',{cx:x0+i*gap,cy:y,r:17,fill:cols[i]},g);txt(x0+i*gap,y-30,String(i+1),{'font-size':18,fill:'#7a6650'},g);out.push(g);await wait(fast?110:220,id);}return out;}
export function tenFrame(cx,cy,k,parent=svg){const cs=64,x0=cx-cs*2.5,y0=cy-cs,cells=[];for(let r=0;r<2;r++)for(let c=0;c<5;c++){
  el('rect',{x:x0+c*cs,y:y0+r*cs,width:cs,height:cs,fill:'#fff',stroke:'#c9b28a','stroke-width':3},parent);cells.push([x0+c*cs+cs/2,y0+r*cs+cs/2]);}
  for(let i=0;i<k;i++)el('circle',{cx:cells[i][0],cy:cells[i][1],r:22,fill:RED.c},parent);return cells;}
/* ---------- 火車 helpers ---------- */
const TP=66;
function trCar(p,x,y,col){const g=el('g',{},p);el('rect',{x:x,y:y-22,width:58,height:38,rx:9,fill:col,stroke:'rgba(0,0,0,.25)','stroke-width':2},g);
  el('rect',{x:x+8,y:y-15,width:17,height:14,rx:3,fill:'#fff'},g);el('rect',{x:x+33,y:y-15,width:17,height:14,rx:3,fill:'#fff'},g);
  el('circle',{cx:x+14,cy:y+18,r:7,fill:'#444'},g);el('circle',{cx:x+44,cy:y+18,r:7,fill:'#444'},g);return g;}
function trTrack(p,x1,x2,y){el('line',{x1,y1:y+26,x2,y2:y+26,stroke:'#8d6e63','stroke-width':4},p);for(let x=x1;x<x2;x+=22)el('line',{x1:x,y1:y+22,x2:x+10,y2:y+30,stroke:'#bcaaa4','stroke-width':3},p);}
function trCoupler(p,x,y){return el('circle',{cx:x,cy:y+2,r:7,fill:'#ffbe0b',stroke:'#fff','stroke-width':2,class:'blink'},p);}
function trSlot(p,x,y){el('rect',{x:x,y:y-22,width:58,height:38,rx:9,fill:'none',stroke:'#bbb','stroke-width':3,'stroke-dasharray':'7 5'},p);}
function trainPlay(n,id,avoid){return new Promise((res,rej)=>{clear();
  const x0=400-(n*TP)/2,y=300;trTrack(svg,30,770,y);let cut=-1;const bondG=el('g',{});
  const cars=[...Array(n)].map((_,i)=>{const g=trCar(svg,x0+i*TP,y,'#9e9e9e');g.style.transition='transform .35s';return g;});
  const cps=[];for(let k=1;k<n;k++){const cx=x0+k*TP-4;const c=trCoupler(svg,cx,y);const h=el('rect',{x:cx-26,y:y-50,width:52,height:100,fill:'transparent',style:'cursor:pointer'});
    h.addEventListener('click',()=>setCut(k));cps.push(c);}
  const hint=txt(400,385,'👆 點兩節車廂中間，把火車分開',{'font-size':22,fill:'#9a8466'});
  function setCut(k){cut=k;cars.forEach((g,i)=>{g.style.transform=i>=k?'translate(50px,0)':'translate(-10px,0)';g.querySelector('rect').setAttribute('fill',i<k?RED.c:BLUE.c);});
    cps.forEach(c=>c.style.opacity=0);hint.textContent='';bondG.innerHTML='';bondDiag(400,40,[n,k,n-k],-1,bondG);}
  bondDiag(400,40,[n,0,0],-1,bondG);bondG.innerHTML='';bondDiag(400,40,[n,'?','?'],-1,bondG);
  const tm=setInterval(()=>{if(id!==S.runId){clearInterval(tm);rej(ABORT);}},200);clearBar();
  button('✔ 我分好了','#2bb673',()=>{if(cut<0){subEl.textContent='先點兩節車廂中間，把火車分開喔！';speakOne(subEl.textContent);return;}
    if(avoid&&cut===avoid[0]){subEl.textContent='這個分法剛剛用過了，換一種不一樣的！';speakOne(subEl.textContent);return;}clearInterval(tm);clearBar();res([cut,n-cut]);});
  button('🪄 幫我分','#9b7bd8',()=>{let k;do{k=ri(1,n-1);}while(avoid&&k===avoid[0]);setCut(k);});});}

export const unitSplit={count:8,practice:['bond','picture','ten','pair','wrong'],
 scenes:[
 {title:'火車接起來',async run(id){
   trTrack(svg,20,780,150);const A=[0,1,2].map(i=>trCar(svg,60+i*TP,150,RED.c)),B=[0,1].map(i=>trCar(svg,560+i*TP,150,BLUE.c));
   txt(150,215,'3 節',{'font-size':24,fill:RED.c});txt(625,215,'2 節',{'font-size':24,fill:BLUE.c});
   await say('紅色火車有 3 節車廂，藍色火車有 2 節車廂。',id);await say('兩列火車接起來，一共有幾節車廂呢？',id);
   svg.querySelectorAll('text').forEach(t=>t.remove());
   await tween(1500,e=>B.forEach(g=>g.setAttribute('transform',`translate(${(60+3*TP-560)*e},0)`)),id);
   for(let i=0;i<5;i++){txt(60+i*TP+29,100,String(i+1),{'font-size':24,fill:'#e07a00',class:'svgtxt pop'});subEl.textContent=String(i+1);await speakOne(String(i+1));chk(id);}
   await say('3 節和 2 節，接起來是 5 節。3 和 2 合起來是 5。',id);bondDiag(560,250,[5,3,2],-1);
   await say('右下這個叫做分合圖：上面是全部，下面是分開的兩個部分。',id);}},
 {title:'換你分火車',async run(id){
   let p=trainPlay(6,id);await say('這列火車有 6 節車廂，要分成兩列火車。',id);await say('點兩節車廂中間，火車就會分開。分好了按「我分好了」。',id);
   const[a,b]=await p;await say(`你把 6 節分成 ${a} 節和 ${b} 節！6 可以分成 ${a} 和 ${b}。`,id);await say('再換一個地方分分看！',id);
   p=trainPlay(6,id,[a,b]);const[c,d]=await p;await say(`這次是 ${c} 和 ${d}！`,id);await say('不管從哪裡分開，兩列合起來都是 6 節。',id);}},
 {title:'5 節車廂有幾種分法？',async run(id){
   const x0=235,y=90;trTrack(svg,180,620,y);const cars=[0,1,2,3,4].map(i=>trCar(svg,x0+i*TP,y,BLUE.c));
   const bar=el('line',{x1:228,y1:50,x2:228,y2:130,stroke:'#3d2c1e','stroke-width':6,'stroke-linecap':'round'});
   await say('5 節車廂，從不同的地方分開。',id);
   for(let k=0;k<=5;k++){const x=x0+k*TP-4;bar.setAttribute('x1',x);bar.setAttribute('x2',x);cars.forEach((g,i)=>g.querySelector('rect').setAttribute('fill',i<k?RED.c:BLUE.c));
     txt(400,170+k*40,`${k} 和 ${5-k}`,{'font-size':30,fill:'#3d2c1e',class:'svgtxt pop'});await say(`${k} 和 ${5-k}`,id);}
   await say('紅色多 1 節，藍色就少 1 節。',id);await say('0 就是一節都沒有。5 也可以分成 0 和 5 喔！',id);}},
 {title:'開走了幾節？剩下幾節？',async run(id){
   const B=bondDiag(130,50,[8,3,0],2);const x0=270,y=330;trTrack(svg,240,790,y);const cars=[...Array(8)].map((_,i)=>trCar(svg,x0+i*TP,y,'#9e9e9e'));
   await say('8 節車廂的火車，分合圖上面是 8，左下是 3，右下的問號是多少？',id);
   cars.slice(0,3).forEach(g=>g.querySelector('rect').setAttribute('fill',RED.c));await say('前面 3 節塗紅色。',id);
   await tween(1000,e=>cars.slice(0,3).forEach(g=>g.setAttribute('transform',`translate(0,${-110*e})`)),id);
   await say('紅色的 3 節分出去了，剩下的數一數。',id);
   for(let i=3;i<8;i++){cars[i].querySelector('rect').setAttribute('fill',BLUE.c);txt(x0+i*TP+29,y+60,String(i-2),{'font-size':22,fill:BLUE.c,class:'svgtxt pop'});await speakOne(String(i-2));chk(id);}
   B.fill(5,GREEN.c);await say('剩下 5 節，所以 8 可以分成 3 和 5。',id);await say('反過來說：3 和 5 合起來是 8。',id);}},
 {title:'湊滿 10 節車廂',async run(id){
   const x0=70,y=160;trTrack(svg,40,760,y);for(let i=0;i<10;i++)trSlot(svg,x0+i*TP,y);for(let i=0;i<7;i++)trCar(svg,x0+i*TP,y,RED.c);
   await say('火車要湊滿 10 節車廂。現在有 7 節，還要再接幾節？',id);
   for(let i=7;i<10;i++){const g=el('g',{class:'pop'});trCar(g,x0+i*TP,y,BLUE.c);txt(x0+i*TP+29,y-45,String(i-6),{'font-size':22,fill:BLUE.c},g);await speakOne(String(i-6));chk(id);}
   await say('再接 3 節就滿了！7 和 3 合起來是 10，它們是 10 的好朋友！',id);
   for(let k=0;k<=5;k++)txt(130+k*110,300+(k%2)*50,`${k} 和 ${10-k}`,{'font-size':28,fill:k%2?'#e07a00':'#3d2c1e',class:'svgtxt pop'});
   await say('0和10、1和9、2和8、3和7、4和6、5和5，都是 10 的好朋友！',id);}},
 {title:'記住小口訣',async run(id){
   const L=[['🔗','合起來：兩列火車接起來 → 全部','#e8f1ff'],['✂️','分開來：一列火車分成兩列','#ffe8e8'],['✏️','不會的時候，畫車廂數一數！','#e6f8ee']];
   for(let i=0;i<3;i++){const y=90+i*120,g=el('g',{class:'pop'});el('rect',{x:40,y:y-45,width:720,height:90,rx:20,fill:L[i][2]},g);
     txt(95,y+2,L[i][0],{'font-size':38},g);txt(140,y+2,L[i][1],{'font-size':27,fill:'#3d2c1e','text-anchor':'start'},g);await say(L[i][1].replace('→','變成'),id);}
   await say('接下來換你練習！',id);}}
 ]};

export const TYPES={
 bond(){const T=ri(3,10);const a=Math.random()<.15?pick([0,T]):ri(1,T-1),b=T-a,unk=ri(0,2),vals=[T,a,b],dots=Math.random()<.4;let B;
   const prompt=unk===0?`${a} 和 ${b} 合起來是幾？`:unk===1?`${T} 可以分成幾和 ${b}？`:`${T} 可以分成 ${a} 和幾？`;
   const dx=400-(T-1)*23;
   return{mode:'num',prompt,answer:vals[unk],max:10,
     draw(){B=bondDiag(400,50,vals,unk);if(dots){for(let i=0;i<T;i++){const c=unk===0?(i<a?RED.c:BLUE.c):unk===1?(i<b?BLUE.c:'#ddd'):(i<a?RED.c:'#ddd');el('circle',{cx:dx+i*46,cy:330,r:17,fill:c,stroke:'#bbb','stroke-width':c==='#ddd'?2:0,class:'hint'});}}return[];},
     fill(n,c){B.fill(n,c);},
     async explain(id){svg.querySelectorAll('.hint').forEach(e=>e.remove());await countDots(dx,350,Array.from({length:T},(_,i)=>i<a?RED.c:BLUE.c),id,46,1);
       await say(unk===0?`${a} 和 ${b} 合起來是 ${T}。`:`${T} 可以分成 ${a} 和 ${b}。`,id);}};},
 picture(){const a=ri(1,6);let b=ri(0,Math.min(6,10-a));if(b===0&&Math.random()<.6)b=ri(1,Math.min(6,10-a));const T=a+b;
   const he=Math.random()<.5,slots=he?[a,b,T]:[T,a,b],parts=he?[0,1]:[1,2],unk=ri(0,2),tunnel=parts.includes(unk)&&Math.random()<.55;
   const hidden=tunnel?(he?unk:unk-1):-1;let S,tun;const cars=[];const q=(i,v)=>unk===i?'幾':v;const x0=400-(T*TP)/2,y=170;
   const prompt=tunnel?`火車一共有 ${T} 節車廂，山洞裡有幾節？`:he?`紅色 ${q(0,a)} 節和藍色 ${q(1,b)} 節，合起來是 ${q(2,T)} 節？`:(unk===0?`什麼數可以分成 ${a} 和 ${b}？`:`${T} 節車廂可以分成 ${q(1,a)} 節和 ${q(2,b)} 節？`);
   return{mode:'num',prompt,answer:slots[unk],max:10,
     draw(){trTrack(svg,30,770,y);for(let i=0;i<T;i++)cars.push(trCar(svg,x0+i*TP+(i>=a?14:0),y,i<a?RED.c:BLUE.c));
       if(tunnel){const L=hidden===0?x0:x0+a*TP+8,R=hidden===0?x0+a*TP-4:x0+T*TP+14;tun=el('g',{});
         el('path',{d:`M${L-10} ${y+30} L${L-10} ${y-40} Q${(L+R)/2} ${y-150} ${R+10} ${y-40} L${R+10} ${y+30} Z`,fill:'#7cb342',stroke:'#558b2f','stroke-width':4},tun);
         el('path',{d:`M${(L+R)/2-34} ${y+30} L${(L+R)/2-34} ${y-10} Q${(L+R)/2} ${y-50} ${(L+R)/2+34} ${y-10} L${(L+R)/2+34} ${y+30} Z`,fill:'#33691e'},tun);
         txt((L+R)/2,y-62,'?',{'font-size':46,fill:'#fff'},tun);}
       S=sentence(345,he?[{v:a,u:unk===0},'和',{v:b,u:unk===1},'合起來是',{v:T,u:unk===2}]:[{v:T,u:unk===0},'可以分成',{v:a,u:unk===1},'和',{v:b,u:unk===2}]);return[];},
     fill(n,c){S.fill(n,c);},
     async explain(id){if(tun){await tween(700,e=>tun.style.opacity=1-e,id);tun.remove();}
       for(let i=0;i<T;i++){chk(id);txt(x0+i*TP+(i>=a?14:0)+29,y-45,String(i+1),{'font-size':20,fill:i<a?RED.c:BLUE.c,class:'svgtxt pop'});await wait(150,id);}
       await say(he?`${a} 節和 ${b} 節，合起來是 ${T} 節。`:`${T} 可以分成 ${a} 和 ${b}。`,id);}};},
 ten(){const k=ri(1,9);let S;const x0=70,y=150;
   return{mode:'num',prompt:`火車要湊滿 10 節車廂，現在有 ${k} 節，還要再接幾節？`,answer:10-k,max:10,
     draw(){trTrack(svg,40,760,y);for(let i=0;i<10;i++)trSlot(svg,x0+i*TP,y);for(let i=0;i<k;i++)trCar(svg,x0+i*TP,y,RED.c);
       S=sentence(320,[{v:k,u:false},'和',{v:10-k,u:true},'合起來是',{v:10,u:false}]);return[];},
     fill(n,c){S.fill(n,c);},
     async explain(id){for(let i=k;i<10;i++){chk(id);const g=el('g',{class:'pop'});trCar(g,x0+i*TP,y,BLUE.c);txt(x0+i*TP+29,y-45,String(i-k+1),{'font-size':20,fill:BLUE.c},g);await wait(180,id);}
       await say(`空位還有 ${10-k} 個，要再接 ${10-k} 節。${k} 和 ${10-k} 合起來是 10。`,id);}};},
 pair(){const T=ri(5,10);let a;do{a=ri(1,T-1);}while(a*2===T);const vs=new Set([a,T-a]);while(vs.size<6)vs.add(ri(1,9));const cards=shuffle([...vs]);
   const ans=[cards.indexOf(a),cards.indexOf(T-a)];
   return{mode:'pair',prompt:`哪兩張卡片合起來是 ${T}？點兩張。`,answer:ans,isOk:s=>s.length===2&&cards[s[0]]+cards[s[1]]===T,
     draw(){txt(400,60,`合起來是 ${T}`,{'font-size':40,fill:'#e07a00'});return cards.map((v,i)=>{const x=115+i*114;el('rect',{x:x-48,y:140,width:96,height:130,rx:16,fill:'#fff',stroke:'#c9b28a','stroke-width':4});
       txt(x,207,String(v),{'font-size':54,fill:'#3d2c1e'});return{x:x-54,y:134,w:108,h:142};});},
     async explain(id){const x=cards[ans[0]],y=cards[ans[1]];await countDots(400-(T-1)*23,370,Array.from({length:T},(_,i)=>i<x?RED.c:BLUE.c),id,46,1);await say(`${x} 和 ${y} 合起來是 ${T}。`,id);}};},
 wrong(){const T=ri(4,10);const good=shuffle([...Array(T+1).keys()].map(k=>[k,T-k]).filter(([x,y])=>x>0&&y>0)).slice(0,2);let bad;
   do{const x=ri(1,T-1);bad=[x,T-x+pick([-1,1])];}while(bad[1]<0||good.some(g=>g[0]===bad[0]&&g[1]===bad[1]));
   const opts=shuffle([...good,bad]),ans=opts.indexOf(bad);
   return{mode:'pick',prompt:`${T} 可以分成幾和幾？哪一個分法不對？把它圈起來。`,answer:ans,
     draw(){txt(400,60,`${T} 可以分成…`,{'font-size':40,fill:'#e07a00'});return opts.map(([x,y],i)=>{const cx=150+i*250;el('rect',{x:cx-100,y:140,width:200,height:110,rx:18,fill:'#fff',stroke:'#c9b28a','stroke-width':4});
       txt(cx,195,`${x} 和 ${y}`,{'font-size':40,fill:'#3d2c1e'});return{x:cx-106,y:134,w:212,h:122};});},
     async explain(id){opts.forEach(([x,y],i)=>{const cx=150+i*250,s=x+y,ok=s===T;txt(cx,305,`合起來是 ${s}`,{'font-size':24,fill:ok?'#2bb673':'#e63946',class:'svgtxt pop'});txt(cx,345,ok?'✔':'✘',{'font-size':30,fill:ok?'#2bb673':'#e63946',class:'svgtxt pop'});});
       await say(`${bad[0]} 和 ${bad[1]} 合起來是 ${bad[0]+bad[1]}，不是 ${T}，所以這個分法不對。`,id);}};}
};
