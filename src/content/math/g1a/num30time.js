// 一上數學學期包：30以內的數、時間：單元與題型。
// 程式從舊版單檔原樣搬來，只補上 import／export，並把 runId 改成 S.runId。
import { RED, BLUE, GREEN, ri, pick, shuffle, distinct } from '../../../engine/util.js';
import { subEl, chk, wait, speakOne, say } from '../../../engine/speech.js';
import { svg, el, txt, clear, tween } from '../../../engine/svg.js';
import { askChoice } from '../../../engine/ui.js';

/* ===== module d_num30_time.js ===== */
/* ================= 30以內的數 + 時間 (Builder D) ================= */
/* --- helpers --- */
function d_stick(p,x,base){return el('rect',{x,y:base-130,width:7,height:130,rx:3,fill:'#e9c38b',stroke:'#b8894a','stroke-width':1.5},p);}
function d_bundle(p,x,base){const g=el('g',{},p);for(let i=0;i<10;i++)d_stick(g,x+i*8,base);el('rect',{x:x-4,y:base-75,width:84,height:14,rx:4,fill:'#e63946'},g);return g;}
// draws tens bundles + ones sticks starting at x; returns centers
function d_drawNum(p,x,base,tens,ones){const bc=[],oc=[];for(let t=0;t<tens;t++){d_bundle(p,x+t*110,base);bc.push(x+t*110+36);}
  const sx=x+tens*110;for(let k=0;k<ones;k++){d_stick(p,sx+k*22,base);oc.push(sx+k*22+3);}return{bc,oc,width:tens*110+ones*22};}
function d_cards(labels,cy,w=200,h=84,fs=34,parent=svg){const n=labels.length,xs=n===2?[270,530]:n===3?[150,400,650]:labels.map((_,i)=>400-(n-1)*90+i*180);
  return labels.map((l,i)=>{el('rect',{x:xs[i]-w/2,y:cy-h/2,width:w,height:h,rx:18,fill:'#fff',stroke:'#c9b28a','stroke-width':4},parent);
    txt(xs[i],cy+2,String(l),{'font-size':fs,fill:'#3d2c1e'},parent);return{x:xs[i]-w/2-6,y:cy-h/2-6,w:w+12,h:h+12,cx:xs[i]};});}
function d_opts(correct,cands,lo=0,hi=30){const out=[correct];for(const c of cands.concat([correct+1,correct-1,correct+2,correct-2]))
  if(out.length<3&&c>=lo&&c<=hi&&!out.includes(c))out.push(c);const o=shuffle(out);return{opts:o,ans:o.indexOf(correct)};}
function d_track(x0,y0,from,to,cols=10,cw=64,ch=52,hidden=[]){const cells={};for(let n=from;n<=to;n++){const k=n-from,x=x0+(k%cols)*cw,y=y0+Math.floor(k/cols)*ch;
  const r=el('rect',{x,y,width:cw-4,height:ch-4,rx:8,fill:'#fff',stroke:'#c9b28a','stroke-width':2.5});
  const h=hidden.includes(n);const t=txt(x+(cw-4)/2,y+(ch-4)/2+1,h?'?':String(n),{'font-size':24,fill:h?'#ff8c42':'#3d2c1e'});cells[n]={r,t,x,y};}return cells;}
const d_tl=(h,m)=>`${h} 點${m?'半':'鐘'}`;
const d_next=h=>h%12+1;
function d_clock(p,cx,cy,r,h,m){const g=el('g',{},p);
  el('circle',{cx,cy,r,fill:'#fff',stroke:'#3d2c1e','stroke-width':Math.max(3,r*.045)},g);
  for(let i=0;i<60;i++){const a=i*6*Math.PI/180,l=i%5?r*.04:r*.09;el('line',{x1:cx+Math.sin(a)*(r*.95),y1:cy-Math.cos(a)*(r*.95),x2:cx+Math.sin(a)*(r*.95-l),y2:cy-Math.cos(a)*(r*.95-l),stroke:'#999','stroke-width':i%5?1.2:2.5},g);}
  const nums=[];for(let n=1;n<=12;n++){const a=n*30*Math.PI/180;nums[n]=txt(cx+Math.sin(a)*(r*.8),cy-Math.cos(a)*(r*.8)+1,String(n),{'font-size':Math.round(r*.18),fill:'#3d2c1e'},g);}
  const hh=el('line',{x1:cx,y1:cy,x2:cx,y2:cy-r*.48,stroke:'#e63946','stroke-width':r*.08,'stroke-linecap':'round'},g);
  const mh=el('line',{x1:cx,y1:cy,x2:cx,y2:cy-r*.66,stroke:'#3a86ff','stroke-width':r*.05,'stroke-linecap':'round'},g);
  el('circle',{cx,cy,r:r*.06,fill:'#3d2c1e'},g);let tot=0;
  const set=t=>{tot=t;const H=(t/60)%12,M=t%60;hh.setAttribute('transform',`rotate(${H*30} ${cx} ${cy})`);mh.setAttribute('transform',`rotate(${M*6} ${cx} ${cy})`);};
  set(h*60+m);
  return{g,set,nums,cx,cy,r,get t(){return tot;},async to(t,dur,id){const s=tot;await tween(dur,e=>set(s+(t-s)*e),id);},
    numPos(n){const a=n*30*Math.PI/180;return[cx+Math.sin(a)*(r*.8),cy-Math.cos(a)*(r*.8)];}};}
function d_ringNum(ck,n,color){const[x,y]=ck.numPos(n);return el('circle',{cx:x,cy:y,r:ck.r*.14,fill:'none',stroke:color,'stroke-width':4,class:'pop'});}
const D_EVENTS=[[['🛏️','起床'],['🪥','刷牙'],['🎒','上學']],[['🧼','洗手'],['🍚','吃飯'],['🪥','刷牙']],[['🏫','放學'],['✏️','寫功課'],['😴','睡覺']],
  [['🧦','穿襪子'],['👟','穿鞋子'],['🚪','出門']],[['🛁','洗澡'],['👕','穿睡衣'],['😴','睡覺']]];
function d_eventCards(order,cy){const xs=[150,400,650];return order.map((ev,i)=>{const g=el('g',{});
  el('rect',{x:xs[i]-100,y:cy-80,width:200,height:160,rx:20,fill:'#fff',stroke:'#c9b28a','stroke-width':4},g);
  txt(xs[i],cy-20,ev[0],{'font-size':56},g);txt(xs[i],cy+50,ev[1],{'font-size':28,fill:'#3d2c1e'},g);return{g,x:xs[i]};});}
function d_lines(L){for(let i=0;i<L.length;i++){const y=90+i*120,g=el('g',{class:'pop'});el('rect',{x:30,y:y-45,width:740,height:90,rx:20,fill:L[i][2]},g);
  txt(85,y+2,L[i][0],{'font-size':36},g);txt(125,y+2,L[i][1],{'font-size':25,fill:'#3d2c1e','text-anchor':'start'},g);}}

/* ================= 單元：30以內的數 ================= */
export const unitNum30={count:8,practice:['n30bundle','n30tens','n30seq','n30cmp'],
 scenes:[
 {title:'10 根綁成一捆',async run(id){
   const base=330,st=[];for(let i=0;i<13;i++)st.push(d_stick(svg,80+i*40,base));
   await say('這裡有好多根冰棒棍，一根一根數，好累喔。',id);await say('我們把 10 根綁成一捆！按按看。',id);
   await askChoice([{label:'🎀 綁成一捆',color:'#ff8c42',value:1}],id);
   const sx=st.map(s=>+s.getAttribute('x'));
   await tween(1000,e=>st.forEach((s,i)=>{const tx=i<10?120+i*8:330+(i-10)*40;s.setAttribute('x',sx[i]+(tx-sx[i])*e);}),id);
   el('rect',{x:116,y:base-75,width:84,height:14,rx:4,fill:'#e63946',class:'pop'});
   txt(156,base+35,'1 個十',{'font-size':26,fill:'#e63946',class:'svgtxt pop'});await say('10 根綁成一捆，一捆就是 1 個十。',id);
   txt(373,base+35,'3 個一',{'font-size':26,fill:BLUE.c,class:'svgtxt pop'});await say('還有 3 根，是 3 個一。',id);
   txt(620,200,'13',{'font-size':90,fill:'#e07a00',class:'svgtxt pop'});await say('1 個十和 3 個一，合起來是 13。',id);}},
 {title:'數到 30',async run(id){
   const d=d_drawNum(svg,140,320,2,3);await say('看看這裡有幾根？',id);
   txt(d.bc[0],160,'10',{'font-size':26,fill:'#e63946',class:'svgtxt pop'});await say('1 捆是 10。',id);
   txt(d.bc[1],160,'20',{'font-size':26,fill:'#e63946',class:'svgtxt pop'});await say('2 捆是 20。',id);
   for(let k=0;k<3;k++){txt(d.oc[k],160,String(21+k),{'font-size':22,fill:BLUE.c,class:'svgtxt pop'});subEl.textContent=String(21+k);await speakOne(String(21+k));chk(id);}
   txt(640,250,'23',{'font-size':90,fill:'#e07a00',class:'svgtxt pop'});await say('2 個十和 3 個一，是 23。',id);
   clear();d_drawNum(svg,235,320,3,0);await say('那 3 捆是多少呢？',id);
   const g=await askChoice([{label:'3',color:RED.c,value:3},{label:'13',color:BLUE.c,value:13},{label:'30',color:GREEN.c,value:30}],id);
   txt(400,90,'30',{'font-size':80,fill:'#e07a00',class:'svgtxt pop'});await say((g===30?'答對了！':'')+'3 捆就是 3 個十，是 30。',id);}},
 {title:'數的順序',async run(id){
   const c=d_track(80,40,1,30,10,64,56,[13,22,27]);await say('這是 1 到 30 的數字表。',id);
   c[12].r.setAttribute('fill','#fff3c4');await say('12 的後面，多 1，是 13。',id);
   c[13].t.textContent='13';c[13].t.setAttribute('fill',GREEN.c);await say('往後數，每次多 1。',id);
   c[22].t.textContent='22';c[22].t.setAttribute('fill',GREEN.c);await say('21 的後面是 22。',id);
   c[27].t.textContent='27';c[27].t.setAttribute('fill',GREEN.c);await say('26 的後面是 27。',id);
   for(const n of [20,19,18,17])c[n].r.setAttribute('fill','#ffe1cc');await say('倒著數，從大數到小：20、19、18、17。每次少 1。',id);
   await say('一排有 10 個數，往下一格，就多 10。',id);for(const n of [5,15,25])c[n].r.setAttribute('fill','#dff5e8');await say('5、15、25。',id);}},
 {title:'比大小：先比十',async run(id){
   d_drawNum(svg,50,330,1,9);d_drawNum(svg,450,330,2,1);
   txt(190,70,'19',{'font-size':64,fill:RED.c});txt(560,70,'21',{'font-size':64,fill:BLUE.c});
   await say('19 和 21，哪個比較大？',id);
   const g=await askChoice([{label:'19',color:RED.c,value:19},{label:'21',color:BLUE.c,value:21}],id);
   await say('9 看起來比 1 大，可是要先比十！',id);
   txt(90,375,'1 個十',{'font-size':24,fill:RED.c,class:'svgtxt pop'});txt(560,375,'2 個十',{'font-size':24,fill:BLUE.c,class:'svgtxt pop'});
   await say('19 有 1 個十，21 有 2 個十。',id);await say('2 個十比較多，所以 21 比較大。'+(g===21?'你答對了！':''),id);
   clear();d_drawNum(svg,50,330,2,4);d_drawNum(svg,450,330,2,7);txt(190,70,'24',{'font-size':64,fill:RED.c});txt(600,70,'27',{'font-size':64,fill:BLUE.c});
   await say('24 和 27 呢？十一樣多，都是 2 個十。',id);await say('那就再比一：7 比 4 多，所以 27 比較大。',id);}},
 {title:'記住小口訣',async run(id){
   const L=[['🎀','10 個一，就是 1 個十。','#e8f1ff'],['🔢','往後數多 1，往前數少 1。','#ffe8e8'],['⚖️','比大小：先比十，再比一！','#e6f8ee']];
   d_lines(L);for(const l of L)await say(l[1],id);await say('接下來換你練習！',id);}}
 ]};

/* ================= 單元：時間 ================= */
export const unitTime={count:8,practice:['timRead','timHalfTrap','timOrder','timEarlier'],
 scenes:[
 {title:'事情的先後',async run(id){
   const evs=D_EVENTS[0],ord=[2,0,1],cards=d_eventCards(ord.map(i=>evs[i]),200);
   await say('上學前要做這三件事。',id);await say('哪一件事最先做？',id);
   const g=await askChoice(ord.map(i=>({label:evs[i][1],color:['#ff8c42','#3a86ff','#2bb673'][i],value:i})),id);
   await say(g===0?'答對了！':'我們排排看。',id);
   const xs=[150,400,650];await tween(1200,e=>ord.forEach((evi,pos)=>cards[pos].g.setAttribute('transform',`translate(${(xs[evi]-xs[pos])*e},0)`)),id);
   xs.forEach((x,i)=>{const g2=el('g',{class:'pop'});el('circle',{cx:x-80,cy:110,r:22,fill:'#ffbe0b'},g2);txt(x-80,111,String(i+1),{'font-size':22,fill:'#fff'},g2);});
   await say('先起床，再刷牙，最後去上學。',id);}},
 {title:'幾點鐘',async run(id){
   const ck=d_clock(svg,400,205,165,12,0);
   await say('紅色短短的是短針，藍色長長的是長針。',id);
   await ck.to(180,2200,id);await say('長針指著 12，短針指著 3，就是 3 點鐘。',id);
   await say('換你轉轉看！',id);await askChoice([{label:'⏩ 長針轉一圈',color:'#ff8c42',value:1}],id);
   await ck.to(240,1800,id);await say('長針轉一圈，短針走到 4。現在幾點？',id);
   const g=await askChoice([{label:'12 點鐘',color:RED.c,value:12},{label:'4 點鐘',color:BLUE.c,value:4},{label:'5 點鐘',color:GREEN.c,value:5}],id);
   await say((g===4?'答對了！':'')+'長針指著 12，短針指著 4，是 4 點鐘。',id);}},
 {title:'幾點半',async run(id){
   const ck=d_clock(svg,400,205,165,3,0);await say('現在是 3 點鐘。',id);
   await ck.to(210,2000,id);await say('長針轉半圈，指著 6。',id);
   d_ringNum(ck,3,'#e63946');d_ringNum(ck,4,'#e63946');await say('短針走到 3 和 4 的中間。',id);await say('這是 3 點半。',id);
   await say('短針還沒走到 4，所以是 3 點半，不是 4 點半喔！',id);
   clear();const c2=d_clock(svg,400,205,165,7,30);await say('那這個時鐘是幾點半？',id);
   const g=await askChoice([{label:'6 點半',color:RED.c,value:6},{label:'7 點半',color:BLUE.c,value:7},{label:'8 點半',color:GREEN.c,value:8}],id);
   d_ringNum(c2,7,'#e63946');d_ringNum(c2,8,'#e63946');await say((g===7?'答對了！':'')+'短針在 7 和 8 中間，還沒到 8，是 7 點半。',id);}},
 {title:'我的一天',async run(id){
   const items=[[150,7,0,'🌅 早上','7 點起床'],[400,12,0,'☀️ 中午','12 點吃午餐'],[650,9,0,'🌙 晚上','9 點睡覺']];
   await say('我們來看看一天的時間。',id);
   for(const[x,h,m,a,b] of items){const g=el('g',{class:'pop'});d_clock(g,x,160,95,h,m);txt(x,300,a,{'font-size':28,fill:'#e07a00'},g);txt(x,345,b,{'font-size':26,fill:'#3d2c1e'},g);
     await say(`${a.slice(2).trim()}${b}。`,id);}
   await say('早上、中午、晚上，一天的事情有先有後。',id);}},
 {title:'哪個比較早？',async run(id){
   const A=d_clock(svg,230,190,125,2,0),B=d_clock(svg,570,190,125,3,0);
   txt(230,360,'2 點鐘',{'font-size':28});txt(570,360,'3 點鐘',{'font-size':28});
   await say('2 點和 3 點，哪個比較早？',id);
   const g=await askChoice([{label:'2 點',color:RED.c,value:2},{label:'3 點',color:BLUE.c,value:3}],id);
   await say((g===2?'答對了！':'')+'先到 2 點，再到 3 點。2 點比 3 點早，3 點比 2 點晚。',id);
   await say('那 3 點和 3 點半呢？',id);await A.to(180,1200,id);await B.to(210,1200,id);
   svg.querySelectorAll('text').forEach(t=>{if(t.textContent==='2 點鐘')t.textContent='3 點鐘';if(t.textContent==='3 點鐘'&&+t.getAttribute('x')===570)t.textContent='3 點半';});
   await say('3 點過了半小時，才是 3 點半。所以 3 點比較早。',id);}},
 {title:'記住小口訣',async run(id){
   const L=[['🕒','長針指 12，短針指幾，就是幾點鐘。','#e8f1ff'],['🕞','長針指 6，短針在中間，是前面那個數的幾點半。','#ffe8e8'],['⏳','先發生的比較早，後發生的比較晚。','#e6f8ee']];
   d_lines(L);for(const l of L)await say(l[1],id);await say('接下來換你練習！',id);}}
 ]};

/* ================= 練習題 ================= */
export const TYPES={
 n30bundle(){let t=ri(0,2),o=ri(0,9);if(t===0&&o<2)o=ri(2,9);if(Math.random()<.1){t=3;o=0;}const n=t*10+o;
   const{opts,ans}=d_opts(n,[o*10+t,t+o,n+10,n-10],1,39);let d;
   return{mode:'pick',prompt:'一捆是 10 根。一共有幾根？把對的數字圈起來。',answer:ans,
     draw(){d=d_drawNum(svg,400-(t*110+o*22)/2,250,t,o);return d_cards(opts,345);},
     async explain(id){d.bc.forEach((x,i)=>txt(x,100,String((i+1)*10),{'font-size':24,fill:'#e63946',class:'svgtxt pop'}));
       for(let k=0;k<o;k++){txt(d.oc[k],100-(k%2)*24,String(t*10+k+1),{'font-size':18,fill:BLUE.c,class:'svgtxt pop'});await wait(120,id);}
       await say(`${t} 捆是 ${t} 個十，再 ${o} 根是 ${o} 個一，一共是 ${n}。`+(t+o!==n&&t>0?'不能把一捆當成 1 根喔！':''),id);}};},
 n30tens(){const t=ri(1,2),o=ri(1,9),n=t*10+o;const{opts,ans}=d_opts(n,[o*10+t,t+o,n+10],1,99);let d;
   return{mode:'pick',prompt:`${t} 個十和 ${o} 個一，是多少？`,answer:ans,
     draw(){txt(400,60,`${t} 個十和 ${o} 個一`,{'font-size':42,fill:'#e07a00'});return d_cards(opts,190,200,100,46);},
     async explain(id){d=d_drawNum(svg,400-(t*110+o*22)/2,410,t,o);await wait(300,id);
       await say(`${t} 個十是 ${t*10}，再加 ${o} 個一，是 ${n}。十位寫 ${t}，個位寫 ${o}。`,id);}};},
 n30seq(){const desc=Math.random()<.35,s=ri(1,26),seq=[0,1,2,3,4].map(k=>desc?s+4-k:s+k),mi=ri(1,4),n=seq[mi];
   const{opts,ans}=d_opts(n,[desc?n+2:n-2,n+10,n-10].filter(v=>v>0&&v<=30),1,30);const cells=[];
   return{mode:'pick',prompt:desc?'從大數到小，空格裡是什麼數？':'按照順序，空格裡是什麼數？',answer:ans,
     draw(){seq.forEach((v,i)=>{const x=70+i*136;el('rect',{x,y:110,width:120,height:90,rx:14,fill:'#fff',stroke:i===mi?'#ff8c42':'#c9b28a','stroke-width':4,'stroke-dasharray':i===mi?'8 6':'none'});
         cells.push(txt(x+60,157,i===mi?'?':String(v),{'font-size':44,fill:i===mi?'#ff8c42':'#3d2c1e'}));if(i<4)txt(x+128,157,desc?'←':'→',{'font-size':22,fill:'#bbb'});});
       return d_cards(opts,330);},
     async explain(id){cells[mi].textContent=String(n);cells[mi].setAttribute('fill',GREEN.c);
       await say(desc?`倒著數，每次少 1：${seq.join('、')}。空格是 ${n}。`:`往後數，每次多 1：${seq.join('、')}。空格是 ${n}。`,id);}};},
 n30cmp(){let a,b;if(Math.random()<.55){const t=ri(0,1),o1=ri(3,9),o2=ri(0,o1-1);a=t*10+o1;b=(t+1)*10+o2;if(a<1)a=o1;}else{const t=ri(1,2),o=distinct(2,0,9,1);a=t*10+o[0];b=t*10+o[1];}
   const nums=shuffle([a,b]),big=Math.random()<.7,ans=big?nums.indexOf(Math.max(a,b)):nums.indexOf(Math.min(a,b));
   return{mode:'pick',prompt:`哪一個數比較${big?'大':'小'}？把它圈起來。`,answer:ans,
     draw(){return d_cards(nums,170,220,140,70);},
     async explain(id){const tt=nums.map(v=>Math.floor(v/10)),oo=nums.map(v=>v%10);
       nums.forEach((v,i)=>txt([270,530][i],300,`${tt[i]} 個十 ${oo[i]} 個一`,{'font-size':26,fill:'#7a6650',class:'svgtxt pop'}));
       const w=nums[ans];await say(tt[0]!==tt[1]?`先比十：${Math.max(...tt)} 個十比 ${Math.min(...tt)} 個十多，所以 ${Math.max(a,b)} 比較大，${Math.min(a,b)} 比較小。`:`十一樣多，再比一：${Math.max(...oo)} 比 ${Math.min(...oo)} 多，所以 ${Math.max(a,b)} 比較大，${Math.min(a,b)} 比較小。`,id);}};},
 timRead(){const h=ri(1,12),m=pick([0,30]);const L=m?[d_tl(h,30),d_tl(d_next(h),30),d_tl(h,0)]:[d_tl(h,0),d_tl(d_next(h),0),d_tl(h,30)];
   const opts=shuffle(L),ans=opts.indexOf(L[0]);let ck;
   return{mode:'pick',prompt:'時鐘上是幾點？把對的圈起來。',answer:ans,
     draw(){ck=d_clock(svg,400,160,125,h,m);return d_cards(opts,350,210,76,30);},
     async explain(id){if(m){d_ringNum(ck,h,'#e63946');d_ringNum(ck,d_next(h),'#e63946');await say(`長針指著 6，短針在 ${h} 和 ${d_next(h)} 中間，是 ${h} 點半。`,id);}
       else{d_ringNum(ck,12,'#3a86ff');d_ringNum(ck,h,'#e63946');await say(`長針指著 12，短針指著 ${h}，是 ${h} 點鐘。`,id);}}};},
 timHalfTrap(){const h=ri(1,12),L=[d_tl(h,30),d_tl(d_next(h),30),d_tl(d_next(h),0)];const opts=shuffle(L),ans=opts.indexOf(L[0]);let ck;
   return{mode:'pick',prompt:'短針在兩個數字中間，是幾點半？把對的圈起來。',answer:ans,
     draw(){ck=d_clock(svg,400,160,125,h,30);return d_cards(opts,350,210,76,30);},
     async explain(id){d_ringNum(ck,h,'#e63946');d_ringNum(ck,d_next(h),'#e63946');
       await say(`短針在 ${h} 和 ${d_next(h)} 中間，還沒到 ${d_next(h)}，所以是 ${h} 點半，不是 ${d_next(h)} 點半。`,id);}};},
 timOrder(){const evs=pick(D_EVENTS),first=Math.random()<.65,ord=shuffle([0,1,2]),target=first?0:2,ans=ord.indexOf(target);let cards;
   return{mode:'pick',prompt:`哪一件事${first?'最先':'最後'}做？把它圈起來。`,answer:ans,
     draw(){cards=d_eventCards(ord.map(i=>evs[i]),210);return cards.map(c=>({x:c.x-106,y:124,w:212,h:172}));},
     async explain(id){const xs=[150,400,650];await tween(1000,e=>ord.forEach((evi,pos)=>cards[pos].g.setAttribute('transform',`translate(${(xs[evi]-xs[pos])*e},0)`)),id);
       xs.forEach((x,i)=>{const g=el('g',{class:'pop'});el('circle',{cx:x-80,cy:130,r:22,fill:'#ffbe0b'},g);txt(x-80,131,String(i+1),{'font-size':22,fill:'#fff'},g);});
       await say(`先${evs[0][1]}，再${evs[1][1]}，最後${evs[2][1]}。`,id);}};},
 timEarlier(){const ts=distinct(2,2,22,1).map(v=>v*30),early=Math.random()<.65;const ans=early?ts.indexOf(Math.min(...ts)):ts.indexOf(Math.max(...ts));
   const lab=t=>d_tl(Math.floor(t/60),t%60);
   return{mode:'pick',prompt:`哪一個時間比較${early?'早':'晚'}？把時鐘圈起來。`,answer:ans,
     draw(){ts.forEach((t,i)=>d_clock(svg,[230,570][i],200,130,Math.floor(t/60),t%60));return[0,1].map(i=>({x:[230,570][i]-140,y:60,w:280,h:280}));},
     async explain(id){ts.forEach((t,i)=>txt([230,570][i],370,lab(t),{'font-size':28,fill:'#3d2c1e',class:'svgtxt pop'}));
       const e=Math.min(...ts),l=Math.max(...ts);await say(`先到 ${lab(e)}，再到 ${lab(l)}。${lab(e)}比較早，${lab(l)}比較晚。`,id);}};}
};
