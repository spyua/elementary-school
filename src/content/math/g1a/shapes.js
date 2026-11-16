// 一上數學學期包：認識形狀：平面圖形、立體積木工具，單元與題型。
// 程式從舊版單檔原樣搬來，只補上 import／export，並把 runId 改成 S.runId。
import { ABORT, S } from '../../../engine/state.js';
import { rand, ri, pick, shuffle } from '../../../engine/util.js';
import { subEl, chk, wait, speakOne, say } from '../../../engine/speech.js';
import { svg, el, txt, clear, tween, markShape } from '../../../engine/svg.js';
import { clearBar, button, askChoice } from '../../../engine/ui.js';

/* ===== module b_shapes.js ===== */
/* ================= 認識形狀 (Builder B) — 翰林 1上 第五單元 ================= */
const b_NAME={tri:'三角形',sq:'正方形',rect:'長方形',circ:'圓形'};
const b_FEAT={tri:'有3個角、3條邊',sq:'有4個角，4條邊一樣長',rect:'有4個角，有長的邊也有短的邊',circ:'圓圓的，沒有角'};
const b_COLS=['#ff8fab','#7ec4cf','#ffd166','#9b8cff','#8ac926','#ff9f43','#4cc9f0'];
const b_INK='#3d2c1e';
function b_ground(y=360){el('line',{x1:30,y1:y,x2:770,y2:y,stroke:'#c9b28a','stroke-width':4});}
function b_rotPt(px,py,cx,cy,deg){const a=deg*Math.PI/180,dx=px-cx,dy=py-cy;return[cx+dx*Math.cos(a)-dy*Math.sin(a),cy+dx*Math.sin(a)+dy*Math.cos(a)];}
function b_hOf(s){return s.k==='sq'||s.k==='circ'?s.w:(s.h||s.w);}
/* plane shape: s={k,x,y,w,h,rot,c} */
function b_shape(p,s,styleOverride){const g=el('g',{},p);const{x,y,w}=s,h=b_hOf(s);let e;
  if(s.k==='circ')e=el('circle',{cx:x,cy:y,r:w/2},g);
  else if(s.k==='tri')e=el('polygon',{points:`${x},${y-h/2} ${x-w/2},${y+h/2} ${x+w/2},${y+h/2}`},g);
  else e=el('rect',{x:x-w/2,y:y-h/2,width:w,height:h},g);
  const st=Object.assign({fill:s.c||'#7ec4cf',stroke:b_INK,'stroke-width':3,'stroke-linejoin':'round'},styleOverride||{});
  for(const k in st)e.setAttribute(k,st[k]);
  if(s.rot)g.setAttribute('transform',`rotate(${s.rot} ${x} ${y})`);g.shapeInfo=s;g.shapeEl=e;return g;}
function b_corners(s){const{x,y,w}=s,h=b_hOf(s);let pts=[];
  if(s.k==='tri')pts=[[x,y-h/2],[x-w/2,y+h/2],[x+w/2,y+h/2]];
  else if(s.k==='sq'||s.k==='rect')pts=[[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]];
  return pts.map(([px,py])=>s.rot?b_rotPt(px,py,x,y,s.rot):[px,py]);}
function b_reg(s,pad=14){const w=s.w,h=b_hOf(s);let ww=w,hh=h;if(s.rot&&s.rot%180){const m=Math.hypot(w,h);ww=Math.min(m,w+h);hh=ww;}
  return{x:s.x-ww/2-pad,y:s.y-hh/2-pad,w:ww+2*pad,h:hh+2*pad,mx:s.x,my:s.y+hh/2+pad+26};}
function b_outline(s,color='#ffbe0b',width=8,p=svg){return b_shape(p,s,{fill:'none',stroke:color,'stroke-width':width});}
async function b_cornerDots(s,id,say_=true){const pts=b_corners(s);for(let i=0;i<pts.length;i++){chk(id);const g=el('g',{class:'pop'});
  el('circle',{cx:pts[i][0],cy:pts[i][1],r:11,fill:'#e63946',stroke:'#fff','stroke-width':3},g);await wait(say_?320:120,id);}return pts.length;}
function b_badge(x,y,n,color='#e63946'){const g=el('g',{class:'pop'});el('circle',{cx:x,cy:y,r:16,fill:color,stroke:'#fff','stroke-width':3},g);txt(x,y+1,String(n),{'font-size':18,fill:'#fff'},g);return g;}

/* 3D solids (simple oblique view). return {g,reg} */
function b_quad(p,pts,fill,shade){const s=pts.map(q=>q.join(',')).join(' ');el('polygon',{points:s,fill,stroke:b_INK,'stroke-width':2.5,'stroke-linejoin':'round'},p);
  if(shade)el('polygon',{points:s,fill:shade>0?'#fff':'#000',opacity:Math.abs(shade),'pointer-events':'none'},p);}
function b_box(p,x,base,w,h,d,col,faceCol){const g=el('g',{},p),y=base-h,dy=d*.55;
  b_quad(g,[[x,y],[x+d,y-dy],[x+w+d,y-dy],[x+w,y]],col,.35);
  b_quad(g,[[x+w,y],[x+w+d,y-dy],[x+w+d,base-dy],[x+w,base]],col,-.18);
  const f=el('rect',{x,y,width:w,height:h,fill:faceCol||col,stroke:b_INK,'stroke-width':2.5},g);
  return{g,face:{k:w===h?'sq':'rect',x:x+w/2,y:y+h/2,w,h},reg:{x:x-10,y:y-dy-10,w:w+d+20,h:h+dy+20}};}
function b_cyl(p,cx,base,r,h,col,topCol){const g=el('g',{},p),ry=r*.32;
  el('path',{d:`M${cx-r} ${base-h} L${cx-r} ${base} A${r} ${ry} 0 0 0 ${cx+r} ${base} L${cx+r} ${base-h} Z`,fill:col,stroke:b_INK,'stroke-width':2.5},g);
  el('rect',{x:cx-r+10,y:base-h+ry,width:10,height:h-ry-6,rx:5,fill:'#fff',opacity:.35},g);
  el('ellipse',{cx,cy:base-h,rx:r,ry,fill:topCol||col,stroke:b_INK,'stroke-width':2.5},g);
  if(!topCol)el('ellipse',{cx,cy:base-h,rx:r,ry,fill:'#fff',opacity:.35},g);
  return{g,face:{k:'circ',x:cx,y:base-h,w:2*r},reg:{x:cx-r-12,y:base-h-ry-12,w:2*r+24,h:h+2*ry+24}};}
function b_cylLie(p,cx,cy,L,r,col){const g=el('g',{},p),rx=r*.32,x1=cx-L/2,x2=cx+L/2;
  el('path',{d:`M${x1} ${cy-r} L${x2} ${cy-r} L${x2} ${cy+r} L${x1} ${cy+r} A${rx} ${r} 0 0 1 ${x1} ${cy-r} Z`,fill:col,stroke:b_INK,'stroke-width':2.5},g);
  el('ellipse',{cx:x2,cy,rx,ry:r,fill:col,stroke:b_INK,'stroke-width':2.5},g);el('ellipse',{cx:x2,cy,rx,ry:r,fill:'#fff',opacity:.35},g);
  return{g,reg:{x:x1-rx-12,y:cy-r-12,w:L+2*rx+24,h:2*r+24}};}
function b_ball(p,cx,cy,r,col){const g=el('g',{},p);el('circle',{cx,cy,r,fill:col,stroke:b_INK,'stroke-width':2.5},g);
  el('path',{d:`M${cx-r} ${cy} Q${cx} ${cy+r*.55} ${cx+r} ${cy}`,fill:'none',stroke:'#fff','stroke-width':4,opacity:.8},g);
  el('ellipse',{cx:cx-r*.35,cy:cy-r*.4,rx:r*.25,ry:r*.15,fill:'#fff',opacity:.6},g);
  return{g,reg:{x:cx-r-12,y:cy-r-12,w:2*r+24,h:2*r+24}};}
function b_prism(p,cx,base,w,h,d,col,faceCol){const g=el('g',{},p),dy=d*.55;const A=[cx,base-h],B=[cx-w/2,base],Cc=[cx+w/2,base];
  b_quad(g,[A,[A[0]+d,A[1]-dy],[Cc[0]+d,Cc[1]-dy],Cc],col,-.12);
  el('polygon',{points:[A,B,Cc].map(q=>q.join(',')).join(' '),fill:faceCol||col,stroke:b_INK,'stroke-width':2.5,'stroke-linejoin':'round'},g);
  return{g,face:{k:'tri',x:cx,y:base-h/2,w,h},reg:{x:cx-w/2-12,y:base-h-dy-12,w:w+d+24,h:h+dy+24}};}
const b_SOLID={box:'長方體',cube:'正方體',cyl:'圓柱',cylLie:'圓柱',ball:'球',prism:'三角形積木'};
function b_solid(kind,cx,base,col,faceCol){
  if(kind==='box')return b_box(svg,cx-90,base,140,80,40,col,faceCol);
  if(kind==='cube')return b_box(svg,cx-65,base,90,90,40,col,faceCol);
  if(kind==='cyl')return b_cyl(svg,cx,base,50,110,col,faceCol);
  if(kind==='cylLie')return b_cylLie(svg,cx,base-42,130,42,col);
  if(kind==='ball')return b_ball(svg,cx,base-52,52,col);
  return b_prism(svg,cx-15,base,120,100,40,col,faceCol);}

/* interactions */
function b_tapOne(groups,idx,name,id){return new Promise((res,rej)=>{let done=false;
  const fin=()=>{if(done)return;done=true;clearInterval(t);clearBar();groups.forEach(g=>g.onclick=null);markShape(b_reg(groups[idx].shapeInfo,8),'ring','#2bb673');res();};
  groups.forEach((g,i)=>{g.style.cursor='pointer';g.onclick=()=>{if(done)return;if(i===idx)fin();else{subEl.textContent=`這是${b_NAME[g.shapeInfo.k]}，再找找${name}！`;speakOne(subEl.textContent);}};});
  const t=setInterval(()=>{if(id!==S.runId&&!done){done=true;clearInterval(t);clearBar();rej(ABORT);}},200);
  clearBar();button('🪄 幫我找','#9b7bd8',fin);});}
function b_tapCount(groups,kind,id){return new Promise((res,rej)=>{let done=false,n=0;const found=new Set();const targets=groups.map((g,i)=>g.shapeInfo.k===kind?i:-1).filter(i=>i>=0);
  const mark=i=>{found.add(i);n++;const s=groups[i].shapeInfo;b_outline(s);b_badge(s.x,s.y,n);};
  const end=()=>{if(done)return;done=true;clearInterval(t);clearBar();groups.forEach(g=>g.onclick=null);res(targets.length);};
  groups.forEach((g,i)=>{g.style.cursor='pointer';g.onclick=()=>{if(done||found.has(i))return;
    if(g.shapeInfo.k===kind){mark(i);subEl.textContent=`${n} 個！`;speakOne(String(n));if(found.size===targets.length)setTimeout(end,600);}
    else{subEl.textContent=`這是${b_NAME[g.shapeInfo.k]}，不是${b_NAME[kind]}喔！`;speakOne(subEl.textContent);}};});
  const t=setInterval(()=>{if(id!==S.runId&&!done){done=true;clearInterval(t);clearBar();rej(ABORT);}},200);
  clearBar();button('🪄 幫我數','#9b7bd8',async()=>{for(const i of targets)if(!found.has(i)){mark(i);await new Promise(r=>setTimeout(r,250));}end();});});}

/* composite pictures for 拼一拼 */
const b_TPL={
 house:{name:'房子',free:[[610,770,150,380]],shapes:[
  {k:'sq',x:230,y:285,w:150,c:'#ffd166'},{k:'tri',x:230,y:165,w:200,h:90,c:'#ef476f'},{k:'rect',x:230,y:325,w:44,h:70,c:'#a86b3c'},
  {k:'circ',x:187,y:255,w:40,c:'#8ecae6'},{k:'sq',x:276,y:255,w:40,c:'#8ecae6'},
  {k:'rect',x:500,y:330,w:24,h:60,c:'#a86b3c'},{k:'tri',x:500,y:268,w:110,h:80,c:'#06d6a0'},{k:'tri',x:500,y:212,w:84,h:70,c:'#06d6a0'},
  {k:'circ',x:700,y:75,w:76,c:'#ffb703'}]},
 robot:{name:'機器人',free:[[50,240,120,380],[580,770,120,380]],shapes:[
  {k:'tri',x:400,y:45,w:50,h:40,c:'#ef476f'},{k:'sq',x:400,y:115,w:100,c:'#8ecae6'},{k:'circ',x:378,y:105,w:22,c:'#fff'},{k:'circ',x:422,y:105,w:22,c:'#fff'},
  {k:'rect',x:400,y:142,w:44,h:12,c:'#ef476f'},{k:'rect',x:400,y:240,w:180,h:118,c:'#ffd166'},{k:'circ',x:400,y:210,w:28,c:'#06d6a0'},{k:'tri',x:400,y:268,w:40,h:34,c:'#ef476f'},
  {k:'rect',x:300,y:230,w:40,h:100,c:'#9b8cff'},{k:'rect',x:500,y:230,w:40,h:100,c:'#9b8cff'},
  {k:'rect',x:365,y:350,w:36,h:76,c:'#118ab2'},{k:'rect',x:435,y:350,w:36,h:76,c:'#118ab2'}]},
 rocket:{name:'火箭',free:[[50,280,60,380],[530,770,60,380]],shapes:[
  {k:'tri',x:400,y:85,w:96,h:80,c:'#ef476f'},{k:'rect',x:400,y:215,w:96,h:180,c:'#e9ecef'},{k:'circ',x:400,y:180,w:44,c:'#8ecae6'},{k:'circ',x:400,y:248,w:30,c:'#8ecae6'},
  {k:'tri',x:330,y:280,w:44,h:64,c:'#118ab2',rot:-20},{k:'tri',x:470,y:280,w:44,h:64,c:'#118ab2',rot:20},{k:'tri',x:400,y:342,w:60,h:66,c:'#ffb703',rot:180}]}
};
function b_composite(tplKey,extras=0){const T=b_TPL[tplKey];const list=T.shapes.map(s=>Object.assign({},s));
  const cells=[];T.free.forEach(([x1,x2,y1,y2])=>{for(let x=x1+40;x<=x2-40;x+=85)for(let y=y1+40;y<=y2-40;y+=85)cells.push([x,y]);});
  shuffle(cells).slice(0,extras).forEach(([x,y])=>{const k=pick(['tri','sq','rect','circ']),w=ri(44,62);list.push({k,x,y,w,h:k==='rect'?Math.round(w*.55):k==='tri'?Math.round(w*.9):w,c:pick(b_COLS),rot:k==='tri'&&Math.random()<.3?180:0});});
  return list;}

/* ================= SCENES ================= */
export const unitShape={count:8,practice:['shpName','shpClassify','shpRoll','shpTrace','shpCount'],
 scenes:[
 {title:'方盒、圓罐、球',async run(id){
   b_ground(360);const B=b_box(svg,90,360,130,90,50,'#ffb703'),Cy=b_cyl(svg,400,360,55,120,'#8ecae6'),Ba=b_ball(svg,640,308,52,'#fb8500');
   txt(180,392,'長方體（方盒）',{'font-size':20});txt(400,392,'圓柱（圓罐）',{'font-size':20});txt(640,392,'球',{'font-size':20});
   await say('這是方盒，叫做長方體。',id);await say('這是圓罐，叫做圓柱。',id);await say('這是球。',id);
   await say('推一推，你猜哪一個最會滾？',id);
   const g=await askChoice([{label:'長方體',color:'#e09b00',value:0},{label:'圓柱',color:'#219ebc',value:1},{label:'球',color:'#fb8500',value:2}],id);
   await say('我們來推推看！',id);
   await tween(600,e=>B.g.setAttribute('transform',`translate(${Math.sin(e*Math.PI)*10},0)`),id);await say('長方體推一推，不會滾。',id);
   await tween(1600,e=>Ba.g.setAttribute('transform',`translate(${100*e},0) rotate(${260*e} 640 308)`),id);await say('球圓圓的，往哪裡推都會滾！',id);
   await tween(500,e=>Cy.g.style.opacity=1-e,id);const L=b_cylLie(svg,400,318,120,42,'#8ecae6');
   await say('圓柱站著不會滾，躺下來就會滾。',id);await tween(1200,e=>L.g.setAttribute('transform',`translate(${70*e},0)`),id);
   await say(g===2?'你猜對了！球最會滾。':'答案是球，球最會滾喔！',id);}},
 {title:'誰可以疊高？',async run(id){
   b_ground(370);txt(170,400,'長方體',{'font-size':20});txt(400,400,'圓柱',{'font-size':20});txt(630,400,'球',{'font-size':20});
   await say('我們來疊疊看，哪一種疊得高高的？',id);
   const g=await askChoice([{label:'長方體',color:'#e09b00',value:0},{label:'圓柱',color:'#219ebc',value:1},{label:'球',color:'#fb8500',value:2}],id);
   const drop=async(make)=>{const o=make();o.g.setAttribute('transform','translate(0,-160)');await tween(450,e=>o.g.setAttribute('transform',`translate(0,${-160*(1-e)})`),id);return o;};
   for(let i=0;i<3;i++)await drop(()=>b_box(svg,105,370-i*62,110,62,30,'#ffb703'));
   await say('長方體一個一個疊上去，好穩！',id);
   for(let i=0;i<3;i++)await drop(()=>b_cyl(svg,400,370-i*62,45,62,'#8ecae6'));
   await say('圓柱也可以疊，因為上下都是平平的。',id);
   b_ball(svg,630,328,42,'#fb8500');
   for(let k=0;k<2;k++){const o=b_ball(svg,630,244,42,'#fb8500');o.g.setAttribute('transform','translate(0,-120)');
     await tween(400,e=>o.g.setAttribute('transform',`translate(0,${-120*(1-e)})`),id);
     const dir=k?-1:1;await tween(700,e=>o.g.setAttribute('transform',`translate(${dir*(70+40*k)*e},${84*Math.min(1,e*1.4)}) rotate(${dir*200*e} 630 244)`),id);}
   await say('球疊上去，就滾下來了！',id);
   await say('有平平的面才可以疊高；圓圓的球會滾，不能疊。'+(g===2?'':'所以長方體和圓柱都可以疊高。'),id);}},
 {title:'印出平面圖形',async run(id){
   const items=[{s:b_box(svg,85,190,120,70,40,'#bbb','#ffd166'),x:160,name:'長方形'},{s:b_box(svg,330,190,90,90,40,'#bbb','#ffd166'),x:400,name:'正方形'},{s:b_cyl(svg,640,190,52,100,'#bbb','#ffd166'),x:640,name:'圓形'}];
   el('rect',{x:40,y:250,width:720,height:150,rx:12,fill:'#fffdf5',stroke:'#e5d6b8','stroke-width':3});
   await say('把積木黃色的那一面，印在紙上，會印出什麼形狀呢？',id);
   for(const it of items){chk(id);const f=it.s.face;const target=Object.assign({},f,{x:it.x,y:320});
     const ghost=b_shape(svg,f,{fill:'none',stroke:'#e63946','stroke-width':5,'stroke-dasharray':'10 6'});
     await tween(900,e=>ghost.setAttribute('transform',`translate(${(target.x-f.x)*e},${(target.y-f.y)*e})`),id);
     ghost.remove();b_shape(svg,target,{fill:'#ffd16655',stroke:'#e63946','stroke-width':5});
     txt(it.x,385,it.name,{'font-size':22,fill:'#e63946',class:'svgtxt pop'});await say(`印出來是${it.name}。`,id);}
   await say('立體的積木，每一面都是平平的圖形。',id);}},
 {title:'四種平面圖形',async run(id){
   const S=[{k:'tri',x:120,y:170,w:130,h:115,c:'#ff8fab'},{k:'sq',x:310,y:170,w:115,c:'#7ec4cf'},{k:'rect',x:505,y:170,w:160,h:95,c:'#ffd166'},{k:'circ',x:690,y:170,w:120,c:'#9b8cff'}];
   S.forEach(s=>b_shape(svg,s));
   for(const s of S){chk(id);txt(s.x,270,b_NAME[s.k],{'font-size':24,fill:b_INK,class:'svgtxt pop'});
     if(s.k!=='circ')await b_cornerDots(s,id);await say(`${b_NAME[s.k]}${b_FEAT[s.k]}。`,id);}
   await wait(500,id);clear();
   const target=pick(['tri','sq','rect','circ']);const kinds=shuffle(['tri','sq','rect','circ']);const xs=[130,310,490,670];
   const gs=kinds.map((k,i)=>b_shape(svg,{k,x:xs[i],y:200,w:k==='rect'?140:105,h:k==='rect'?80:k==='tri'?95:105,c:b_COLS[i],rot:pick([0,0,15,-20])}));
   const p=b_tapOne(gs,kinds.indexOf(target),b_NAME[target],id);await say(`換你點一點：哪一個是${b_NAME[target]}？`,id);await p;
   await say(`找到了！${b_NAME[target]}${b_FEAT[target]}。`,id);}},
 {title:'轉一轉還是一樣',async run(id){
   const s={k:'sq',x:200,y:200,w:130,c:'#7ec4cf'};const g=b_shape(svg,s);await say('這是正方形。',id);
   await say('把它轉一轉…',id);await tween(1000,e=>g.setAttribute('transform',`rotate(${45*e} 200 200)`),id);s.rot=45;
   await say('變成這樣，它是什麼形狀？',id);
   const a=await askChoice([{label:'正方形',color:'#219ebc',value:'sq'},{label:'三角形',color:'#ef476f',value:'tri'},{label:'長方形',color:'#e09b00',value:'rect'}],id);
   await b_cornerDots(s,id,false);await say('還是4個角，4條邊一樣長，所以還是正方形！'+(a==='sq'?'你答對了！':''),id);
   const T=[{k:'tri',x:470,y:110,w:150,h:110},{k:'tri',x:690,y:120,w:60,h:50},{k:'tri',x:480,y:300,w:110,h:90,rot:180},{k:'tri',x:680,y:300,w:70,h:130}];
   T.forEach((t,i)=>{t.c=b_COLS[i];b_shape(svg,t);});
   await say('大的、小的、倒過來的、瘦瘦的，',id);await say('只要有3個角、3條邊，都是三角形！',id);
   await say('形狀的名字，不會因為大小、轉方向就改變。',id);}},
 {title:'拼一拼、數一數',async run(id){
   const list=b_composite('house');b_ground(362);const gs=list.map(s=>b_shape(svg,s));
   await say('這間房子，是用很多形狀拼起來的。',id);
   const p=b_tapCount(gs,'tri',id);await say('找一找，有幾個三角形？點一點，把它們找出來！',id);
   const n=await p;await say(`一共有 ${n} 個三角形！`,id);
   await say('門和樹幹是長方形，太陽和窗戶有圓形，牆壁是正方形。',id);await say('接下來換你練習！',id);}}
 ]};

/* ================= PRACTICE ================= */
function b_randShape(k,x,y,big){const w=big?ri(95,125):ri(70,105);
  const s={k,x,y,w,c:pick(b_COLS)};
  if(k==='rect'){s.w=Math.min(140,Math.round(w*1.35));s.h=Math.round(s.w*rand(.45,.6));s.rot=pick([0,0,0,20,-25,90]);}
  else if(k==='tri'){s.h=Math.round(w*rand(.75,1.15));s.rot=pick([0,0,0,180,25,-30]);}
  else if(k==='sq'){s.rot=pick([0,0,0,45,20,-15]);}
  return s;}
export const TYPES={
 shpName(){const t=pick(['tri','sq','rect','circ']);const others=['tri','sq','rect','circ'].filter(k=>k!==t);
   let kinds=[t,...shuffle(others)];if(Math.random()<.4){const confuse={sq:'rect',rect:'sq',tri:pick(['sq','rect']),circ:pick(['sq','tri'])}[t];kinds=[t,confuse,confuse,pick(others)];}
   kinds=shuffle(kinds);const xs=[120,300,490,680];const S=kinds.map((k,i)=>b_randShape(k,xs[i],200,true));const ans=kinds.indexOf(t);
   return{mode:'pick',prompt:`哪一個是${b_NAME[t]}？把它圈起來。`,answer:ans,
     draw(){S.forEach(s=>b_shape(svg,s));return S.map(s=>b_reg(s));},
     async explain(id){S.forEach(s=>txt(s.x,345,b_NAME[s.k],{'font-size':22,fill:s.k===t?'#2bb673':'#7a6650',class:'svgtxt pop'}));
       if(t!=='circ')await b_cornerDots(S[ans],id,false);
       await say(`${b_NAME[t]}${b_FEAT[t]}。`+((S[ans].rot||0)%180?'轉了方向，還是'+b_NAME[t]+'。':''),id);}};},
 shpClassify(){const t=pick(['tri','sq','rect','circ']);let kinds=Array.from({length:4},()=>Math.random()<.45?t:pick(['tri','sq','rect','circ'].filter(k=>k!==t)));
   if(!kinds.includes(t))kinds[ri(0,3)]=t;if(kinds.every(k=>k===t))kinds[ri(0,3)]=pick(['tri','sq','rect','circ'].filter(k=>k!==t));
   const cells=[[40,20],[420,20],[40,220],[420,220]];const S=kinds.map((k,i)=>{const s=b_randShape(k,cells[i][0]+170,cells[i][1]+82,false);if(s.w>100)s.w=100;if(s.h&&s.h>100)s.h=100;return s;});
   return{mode:'classify',prompt:`是${b_NAME[t]}的打 ✓，不是的畫 ○。`,answer:kinds.map(k=>k===t?'v':'o'),
     draw(){S.forEach(s=>b_shape(svg,s));return cells.map(([x,y])=>({x,y,w:340,h:190,mx:x+170,my:y+168}));},
     async explain(id){S.forEach((s,i)=>txt(cells[i][0]+275,cells[i][1]+168,b_NAME[s.k],{'font-size':20,fill:s.k===t?'#2bb673':'#e76f51',class:'svgtxt pop'}));
       await say(`${b_NAME[t]}${b_FEAT[t]}。大小、方向不一樣，名字還是一樣。`,id);}};},
 shpRoll(){const V=pick([
     {q:'哪一個最會滾？',ans:'ball',others:shuffle(['box','cube','cyl']).slice(0,2),why:'球圓圓的，往哪裡推都會滾。'},
     {q:'哪一個不會滾？',ans:pick(['box','cube']),others:['ball','cylLie'],why:'它的面都是平平的，推了也不會滾。'},
     {q:'哪一個不能疊高？',ans:'ball',others:shuffle(['box','cube','cyl']).slice(0,2),why:'球圓圓的，疊上去會滾下來。'},
     {q:'哪一個可以疊高，躺下來又會滾？',ans:'cyl',others:['ball',pick(['box','cube'])],why:'圓柱上下平平的可以疊，側面圓圓的，躺下來會滾。'}]);
   const kinds=shuffle([V.ans,...V.others]),xs=[160,400,640],cols=['#ffb703','#8ecae6','#fb8500'];let objs=[];
   return{mode:'pick',prompt:V.q+'把它圈起來。',answer:kinds.indexOf(V.ans),
     draw(){b_ground(340);objs=kinds.map((k,i)=>b_solid(k,xs[i],340,cols[i]));kinds.forEach((k,i)=>txt(xs[i],380,b_SOLID[k],{'font-size':20}));return objs.map(o=>o.reg);},
     async explain(id){const i=kinds.indexOf(V.ans),o=objs[i];
       if(V.ans==='ball'&&V.q.includes('滾'))await tween(1000,e=>o.g.setAttribute('transform',`translate(${40*Math.sin(e*Math.PI*2)},0)`),id);
       else await tween(600,e=>o.g.setAttribute('transform',`translate(0,${-14*Math.sin(e*Math.PI)})`),id);
       await say(`是${b_SOLID[V.ans]}。${V.why}`,id);}};},
 shpTrace(){const kind=pick(['box','cube','cyl','prism']);const map={box:'rect',cube:'sq',cyl:'circ',prism:'tri'};const t=map[kind];
   const opts=shuffle([t,...shuffle(['tri','sq','rect','circ'].filter(k=>k!==t)).slice(0,2)]);const xs=[470,600,730];let face;
   const S=opts.map((k,i)=>({k,x:xs[i],y:230,w:k==='rect'?110:85,h:k==='rect'?60:k==='tri'?78:85,c:'#fffdf5'}));
   return{mode:'pick',prompt:'把黃色的那一面印在紙上，會印出什麼形狀？把它圈起來。',answer:opts.indexOf(t),
     draw(){const o=b_solid(kind,kind==='prism'?215:200,330,'#c9c9c9','#ffd166');face=o.face||null;txt(200,375,b_SOLID[kind],{'font-size':20});
       el('line',{x1:395,y1:80,x2:395,y2:380,stroke:'#e5d6b8','stroke-width':3,'stroke-dasharray':'6 6'});
       S.forEach(s=>b_shape(svg,s,{'stroke-width':4}));return S.map(s=>b_reg(s,16));},
     async explain(id){const s=S[opts.indexOf(t)];if(face){const g=b_shape(svg,face,{fill:'none',stroke:'#e63946','stroke-width':5,'stroke-dasharray':'10 6'});
         const k=s.w/face.w;await tween(1000,e=>g.setAttribute('transform',`translate(${(s.x-face.x)*e},${(s.y-face.y)*e}) translate(${face.x},${face.y}) scale(${1+(k-1)*e}) translate(${-face.x},${-face.y})`),id);}
       txt(s.x,320,b_NAME[t],{'font-size':22,fill:'#2bb673',class:'svgtxt pop'});await say(`黃色的面印下來，是${b_NAME[t]}。`,id);}};},
 shpCount(){const tk=pick(Object.keys(b_TPL));const list=b_composite(tk,ri(0,3));const present=[...new Set(list.map(s=>s.k))];const t=pick(present);
   const n=list.filter(s=>s.k===t).length;let gs;
   return{mode:'num',prompt:`這個${b_TPL[tk].name}圖裡，有幾個${b_NAME[t]}？`,answer:n,max:10,
     draw(){if(tk==='house')b_ground(362);gs=list.map(s=>b_shape(svg,s));
       this._q=el('g',{});el('rect',{x:20,y:16,width:150,height:56,rx:14,fill:'#fff',stroke:'#ff8c42','stroke-width':3,'stroke-dasharray':'7 6'},this._q);
       this._qt=txt(95,45,`${b_NAME[t]}：?`,{'font-size':22,fill:'#ff8c42'},this._q);return[];},
     fill(v,c){this._qt.textContent=`${b_NAME[t]}：${v}`;this._qt.setAttribute('fill',c);},
     async explain(id){let k=0;for(const s of list)if(s.k===t){chk(id);k++;b_outline(s);b_badge(s.x,s.y,k);await wait(300,id);}
       await say(`一個一個數，一共有 ${n} 個${b_NAME[t]}。數過的做記號，就不會重複喔！`,id);}};}
};
