// 一上數學學期包：10以內的加法、減法：單元與題型。
// 程式從舊版單檔原樣搬來，只補上 import／export，並把 runId 改成 S.runId。
// 動畫升級：emoji 改用 Fluent 圖片、盤子加厚度、數數徽章、飛走拍翅、吃掉冒碎屑、劃掉變灰。字幕、亂數、時長都沒有改。
import { ABORT, S } from '../../../engine/state.js';
import { RED, BLUE, ri, pick, shuffle } from '../../../engine/util.js';
import { subEl, chk, wait, speakOne } from '../../../engine/speech.js';
import { svg, el, txt, tween, EASE } from '../../../engine/svg.js';
import { emojiAt } from '../../../engine/emoji.js';
import { replay, crumbs } from '../../../engine/fx.js';
import { clearBar, button, askChoice } from '../../../engine/ui.js';
import { OBJ, bondDiag, sentence, countDots, tenFrame } from './split.js';

/* ===== module c_addsub.js ===== */
/* ================= Builder C：10以內的加法、減法（翰林 1上 第六、七單元） ================= */
const c_spk=s=>s.replace(/＋/g,'加').replace(/－/g,'減').replace(/＝/g,'等於');
async function c_say(text,id){chk(id);subEl.textContent=text;await speakOne(c_spk(text));chk(id);await wait(220,id);}
function c_grid(cx,cy,n,em,cols=5,gap=58,size=42,parent=svg){const out=[],rows=Math.ceil(n/cols)||1;
  for(let i=0;i<n;i++){const r=Math.floor(i/cols),c=i%cols,inRow=Math.min(cols,n-r*cols);
    out.push(emojiAt(cx-(inRow-1)*gap/2+c*gap,cy-(rows-1)*gap/2+r*gap,em,{'font-size':size,class:'svgtxt bob',style:`--i:${i}`},parent));}return out;}
/* 盤子：底下一圈影子、盤面、內圈盤緣，看起來有厚度。回傳盤面。 */
function c_plate(cx,cy,rx=150,ry=80,col='#f1f5ff',st='#c7d3f0'){el('ellipse',{cx,cy:cy+10,rx:rx+2,ry,fill:'rgba(61,44,30,.10)'});
  const e=el('ellipse',{cx,cy,rx,ry,fill:col,stroke:st,'stroke-width':3});el('ellipse',{cx,cy,rx:rx*.8,ry:ry*.72,fill:'none',stroke:st,'stroke-width':2,opacity:.6});return e;}
function c_crossXY(x,y,parent=svg,r=20){const g=el('g',{class:'pop'},parent);
  el('line',{x1:x-r,y1:y-r,x2:x+r,y2:y+r,stroke:'#e63946','stroke-width':5,'stroke-linecap':'round'},g);
  el('line',{x1:x+r,y1:y-r,x2:x-r,y2:y+r,stroke:'#e63946','stroke-width':5,'stroke-linecap':'round'},g);return g;}
const c_xy=t=>[+t.getAttribute('x'),+t.getAttribute('y')];
function c_cross(t,parent=svg){const[x,y]=c_xy(t);if(t.classList)t.classList.add('gone');return c_crossXY(x,y,parent);}
/* 數數徽章：物件右上角的彩色圓底＋白色數字，物件跳一下。 */
function c_num(t,n,col='#e07a00'){const[x,y]=c_xy(t);replay(t,'hop');const g=el('g',{class:'pop'});el('circle',{cx:x+22,cy:y-24,r:12,fill:col,stroke:'#fff','stroke-width':2},g);
  return txt(x+22,y-23,String(n),{'font-size':17,fill:'#fff'},g);}
const c_eq=(a,op,b,c,unk=-1)=>[{v:a,u:unk===0},op,{v:b,u:unk===1},'＝',{v:c,u:unk===2}];
async function c_countObjs(objs,id,col){for(let i=0;i<objs.length;i++){chk(id);c_num(objs[i],i+1,col);await wait(170,id);}}
/* 點點說明：加法 a 紅 + b 藍 */
async function c_addDots(a,b,y,id){const n=a+b;if(!n)return;await countDots(400-(n-1)*23,y,Array.from({length:n},(_,i)=>i<a?RED.c:BLUE.c),id,46,1);}
/* 點點說明：減法 n 個，劃掉後面 b 個，數剩下的 */
async function c_subDots(n,b,y,id,countCross){const dx=400-(n-1)*23,pts=[];
  for(let i=0;i<n;i++){el('circle',{cx:dx+i*46,cy:y,r:17,fill:i<n-b?RED.c:'#bbb',class:'pop'});pts.push(dx+i*46);}
  await wait(300,id);
  for(let i=n-b;i<n;i++){chk(id);c_crossXY(pts[i],y,svg,15);if(countCross)txt(pts[i],y+32,String(i-(n-b)+1),{'font-size':16,fill:'#e63946',class:'svgtxt pop'});await wait(160,id);}
  if(!countCross)for(let i=0;i<n-b;i++){chk(id);txt(pts[i],y-30,String(i+1),{'font-size':18,fill:'#7a6650',class:'svgtxt pop'});await wait(140,id);}}
/* 點點說明：a ＋ ? ＝ c */
async function c_missDots(a,c,y,id){const dx=400-(c-1)*23,cs=[];
  for(let i=0;i<c;i++)cs.push(el('circle',{cx:dx+i*46,cy:y,r:17,fill:i<a?RED.c:'#ddd',stroke:'#bbb','stroke-width':i<a?0:2,class:'pop'}));
  await wait(400,id);for(let i=a;i<c;i++){chk(id);cs[i].setAttribute('fill',BLUE.c);cs[i].setAttribute('stroke-width',0);txt(dx+i*46,y-30,String(i-a+1),{'font-size':18,fill:BLUE.c,class:'svgtxt pop'});await wait(180,id);}}
function c_card(cx,cy,w,h,label,size=34,parent=svg){el('rect',{x:cx-w/2,y:cy-h/2,width:w,height:h,rx:16,fill:'#fff',stroke:'#c9b28a','stroke-width':4},parent);
  txt(cx,cy+2,label,{'font-size':size,fill:'#3d2c1e'},parent);return{x:cx-w/2-6,y:cy-h/2-6,w:w+12,h:h+12};}
function c_moveTo(objs,targets,dur,id){const st=objs.map(c_xy);
  return tween(dur,e=>objs.forEach((t,i)=>{t.setAttribute('x',st[i][0]+(targets[i][0]-st[i][0])*e);t.setAttribute('y',st[i][1]+(targets[i][1]-st[i][1])*e);}),id,EASE.outBack);}
/* 飛走：位置用 inBack（先縮一下再衝出去）；透明度用原始時間 t，不用 back 曲線。小鳥會拍翅。 */
function c_flyAway(objs,dur,id,dx=320,dy=-260){const st=objs.map(c_xy);objs.forEach(t=>{if(t.textContent==='🐦'&&t.classList)t.classList.add('flap');});
  return tween(dur,(e,tt)=>objs.forEach((t,i)=>{t.setAttribute('x',st[i][0]+dx*e);t.setAttribute('y',st[i][1]+dy*e);t.style.opacity=1-tt;}),id,EASE.inBack);}
/* 孩子點按鈕放東西 */
function c_tapAdd(id,cx,cy,start,need,em){const objs=c_grid(cx,cy,start+need,em,5,58,42);objs.forEach((t,i)=>{if(i>=start)t.style.display='none';});
  return new Promise((res,rej)=>{let n=start;const t=setInterval(()=>{if(id!==S.runId){clearInterval(t);clearBar();rej(ABORT);}},200);
    const add=()=>{if(n>=start+need)return;objs[n].style.display='';objs[n].setAttribute('class','svgtxt pop');n++;subEl.textContent=`放進 ${n-start} 個`;
      if(n===start+need){clearInterval(t);clearBar();res(objs);}};
    clearBar();button(`${em} 放一個`,'#ff5a5f',add);button('🪄 幫我放','#9b7bd8',()=>{while(n<start+need)add();});});}
/* 孩子點東西把它吃掉 */
function c_tapEat(id,objs,need){return new Promise((res,rej)=>{let eaten=0;const done=new Set();const t=setInterval(()=>{if(id!==S.runId){clearInterval(t);clearBar();rej(ABORT);}},200);
  const eat=i=>{if(done.has(i)||eaten>=need)return;done.add(i);eaten++;objs[i].style.opacity=.35;crumbs(...c_xy(objs[i]),svg,'#ff8fab');c_cross(objs[i]);subEl.textContent=`吃掉 ${eaten} 個`;
    if(eaten===need){clearInterval(t);clearBar();res([...done]);}};
  objs.forEach((o,i)=>{o.style.cursor='pointer';o.addEventListener('click',()=>eat(i));});
  clearBar();button('🪄 幫我吃','#9b7bd8',()=>{for(let i=objs.length-1;i>=0&&eaten<need;i--)eat(i);});});}

export const unitAdd={count:8,
 practice:['addPic','addEq','addPickEq','addMissing'],
 scenes:[
 {title:'合起來是多少？',async run(id){
   c_plate(200,140);c_plate(600,140,150,80,'#fff1f1','#f0c7c7');
   const L=c_grid(200,140,3,'🍎'),R=c_grid(600,140,2,'🍎');
   await c_say('左邊盤子有 3 個蘋果，右邊盤子有 2 個。',id);await c_say('合起來有幾個？',id);
   const all=L.concat(R);await c_moveTo(all,all.map((_,i)=>[284+i*58,265]),1200,id);
   await c_countObjs(all,id);sentence(360,c_eq(3,'＋',2,5));
   await c_say('合起來是 5 個。寫成算式：3＋2＝5。',id);
   await c_say('中間的十字叫做加號，意思是合起來；兩條線叫做等號，後面寫答案。',id);}},
 {title:'又來了幾隻？',async run(id){
   el('path',{d:'M60 210 Q400 190 740 215',stroke:'#8d5a26','stroke-width':12,fill:'none','stroke-linecap':'round'});
   const sit=c_grid(260,180,4,'🐦',4,70,44);await c_say('樹枝上有 4 隻小鳥。',id);
   const come=[emojiAt(860,60,'🐦',{'font-size':44,class:'svgtxt flap'}),emojiAt(920,100,'🐦',{'font-size':44,class:'svgtxt flap'})];
   await c_say('又飛來 2 隻！',id);await c_moveTo(come,[[540,180],[610,180]],1400,id);come.forEach(t=>t.classList.remove('flap'));
   await c_say('現在有幾隻？你猜猜看。',id);
   const g=await askChoice([5,6,7].map(v=>({label:v+' 隻',color:'#3a86ff',value:v})),id);
   await c_countObjs(sit.concat(come),id);sentence(330,c_eq(4,'＋',2,6));
   await c_say(`有 6 隻。${g===6?'你猜對了！':''}4＋2＝6，再來幾個，也是用加法。`,id);}},
 {title:'換你放放看',async run(id){
   c_plate(400,160,240,100);await c_say('盤子裡有 2 個草莓。',id);
   const p=c_tapAdd(id,400,160,2,3,'🍓');await c_say('請你按「放一個」，再放 3 個草莓進去。',id);
   const objs=await p;await c_say('放好了！我們數一數。',id);await c_countObjs(objs,id);
   sentence(340,c_eq(2,'＋',3,5));await c_say('原來有 2 個，再放 3 個，2＋3＝5。',id);}},
 {title:'0 的加法',async run(id){
   c_plate(200,150);c_plate(600,150,150,80,'#fff1f1','#f0c7c7');c_grid(200,150,4,'🐟',2,60);
   await c_say('左邊盤子有 4 條魚，右邊盤子一條也沒有。',id);txt(600,150,'0',{'font-size':60,fill:'#bbb',class:'svgtxt pop'});
   await c_say('一條也沒有，就是 0。',id);sentence(330,c_eq(4,'＋',0,4));
   await c_say('4＋0＝4。加上 0，數量不會變。',id);await c_say('0＋3 也是 3 喔！',id);}},
 {title:'交換也一樣',async run(id){
   await c_addDots(3,2,85,id);sentence(165,c_eq(3,'＋',2,5));await c_say('3 個紅點和 2 個藍點，3＋2＝5。',id);
   const dx=400-4*23;[BLUE.c,BLUE.c,RED.c,RED.c,RED.c].forEach((c,i)=>el('circle',{cx:dx+i*46,cy:260,r:17,fill:c,class:'pop'}));
   sentence(340,c_eq(2,'＋',3,5));await c_say('換個位置，先數藍的再數紅的，2＋3 也等於 5。',id);
   await c_say('兩個數交換位置，答案一樣！',id);}},
 {title:'分合圖和湊 10',async run(id){
   bondDiag(150,50,[10,6,4],-1);const cells=tenFrame(560,120,6);
   await c_say('分合圖：10 可以分成 6 和 4。',id);await c_say('十格框有 6 個，再放幾個就滿了？',id);
   for(let i=6;i<10;i++){chk(id);const g=el('g',{class:'pop'});el('circle',{cx:cells[i][0],cy:cells[i][1],r:22,fill:BLUE.c},g);txt(cells[i][0],cells[i][1]+1,String(i-5),{'font-size':20,fill:'#fff'},g);await wait(250,id);}
   sentence(300,c_eq(6,'＋',4,10));await c_say('再 4 個，6＋4＝10。',id);
   txt(400,380,'1＋9　2＋8　3＋7　4＋6　5＋5',{'font-size':28,fill:'#e07a00',class:'svgtxt pop'});
   await c_say('1＋9、2＋8、3＋7、4＋6、5＋5，都會湊成 10！',id);await c_say('接下來換你練習！',id);}}
 ]};

export const unitSub={count:8,
 practice:['subPic','subEq','subPickEq','subStory','subMissing'],
 scenes:[
 {title:'吃掉了，還剩幾個？',async run(id){
   c_plate(400,150,250,95);const objs=c_grid(400,150,5,'🍪',5,70,46);
   await c_say('盤子裡有 5 片餅乾。',id);await c_say('小熊吃掉了 2 片。',id);
   await c_flyAway(objs.slice(3),1200,id,0,-150);await c_say('還剩幾片？',id);
   await c_countObjs(objs.slice(0,3),id);sentence(330,c_eq(5,'－',2,3));
   await c_say('還剩 3 片。5－2＝3。',id);await c_say('中間的一橫叫做減號，意思是拿走。',id);}},
 {title:'換你吃吃看',async run(id){
   c_plate(400,160,260,100);const objs=c_grid(400,160,6,'🍬',6,70,46);
   await c_say('盤子裡有 6 顆糖果。',id);const p=c_tapEat(id,objs,2);
   await c_say('請你點兩顆糖果，把它吃掉！',id);const eaten=await p;
   const left=objs.filter((_,i)=>!eaten.includes(i));await c_say('還剩幾顆？數一數。',id);await c_countObjs(left,id);
   sentence(340,c_eq(6,'－',2,4));await c_say('6 顆吃掉 2 顆，還剩 4 顆。6－2＝4。',id);}},
 {title:'飛走了幾隻？',async run(id){
   el('path',{d:'M60 220 Q400 200 740 225',stroke:'#8d5a26','stroke-width':12,fill:'none','stroke-linecap':'round'});
   const birds=c_grid(400,190,7,'🐦',7,80,44);await c_say('樹枝上有 7 隻小鳥。',id);await c_say('飛走了 3 隻。',id);
   await c_flyAway(birds.slice(4),1400,id);await c_say('還剩幾隻？你猜猜看。',id);
   const g=await askChoice([3,4,5].map(v=>({label:v+' 隻',color:'#3a86ff',value:v})),id);
   await c_countObjs(birds.slice(0,4),id);sentence(330,c_eq(7,'－',3,4));
   await c_say(`還剩 4 隻。${g===4?'你猜對了！':''}7－3＝4。`,id);}},
 {title:'0 的減法',async run(id){
   const A=c_grid(200,150,5,'🎈',3,60,44);txt(200,40,'一個都沒飛走',{'font-size':22,fill:'#7a6650'});
   await c_say('左邊有 5 顆氣球，一顆都沒有飛走。',id);sentence(330,c_eq(5,'－',0,5),el('g',{transform:'translate(-200,0)'}));
   await c_say('5－0＝5。減掉 0，數量不變。',id);
   const B=c_grid(600,150,5,'🎈',3,60,44);txt(600,40,'全部飛走',{'font-size':22,fill:'#7a6650'});
   await c_say('右邊也有 5 顆，結果全部飛走了！',id);await c_flyAway(B,1300,id,120,-200);
   sentence(330,c_eq(5,'－',5,0),el('g',{transform:'translate(200,0)'}));
   await c_say('5－5＝0。全部拿走，就剩下 0。',id);}},
 {title:'加一加，減一減',async run(id){
   await c_addDots(3,2,90,id);sentence(170,c_eq(3,'＋',2,5));await c_say('3 個紅點加 2 個藍點，3＋2＝5。',id);
   const dx=400-4*23;for(let i=0;i<5;i++)el('circle',{cx:dx+i*46,cy:265,r:17,fill:i<3?RED.c:BLUE.c,class:'pop'});
   await c_say('現在把 2 個藍點拿走。',id);for(let i=3;i<5;i++){c_crossXY(dx+i*46,265,svg,15);await wait(250,id);}
   const g=el('g',{transform:'translate(0,175)'});sentence(170,c_eq(5,'－',2,3),g);
   await c_say('剩下 3 個紅點，5－2＝3。',id);await c_say('加法和減法是好朋友，可以互相檢查！',id);}},
 {title:'要加還是要減？',async run(id){
   el('rect',{x:60,y:30,width:320,height:200,rx:20,fill:'#e8f1ff'});el('rect',{x:420,y:30,width:320,height:200,rx:20,fill:'#ffe8e8'});
   txt(220,70,'用加法 ＋',{'font-size':30,fill:BLUE.c});txt(580,70,'用減法 －',{'font-size':30,fill:RED.c});
   ['合起來','再來、又飛來','一共'].forEach((w,i)=>txt(220,120+i*40,w,{'font-size':24,fill:'#3d2c1e',class:'svgtxt pop'}));
   ['吃掉、拿走','飛走、破掉','還剩'].forEach((w,i)=>txt(580,120+i*40,w,{'font-size':24,fill:'#3d2c1e',class:'svgtxt pop'}));
   await c_say('看到合起來、再來、又飛來，通常用加法。',id);await c_say('看到吃掉、飛走、還剩，通常用減法。',id);
   txt(400,290,'盤子有 8 個水餃，吃掉 3 個，還剩幾個？',{'font-size':26,fill:'#3d2c1e'});
   await c_say('盤子有 8 個水餃，吃掉 3 個，還剩幾個？要用加法還是減法？',id);
   const g=await askChoice([{label:'＋ 加法',color:BLUE.c,value:'+'},{label:'－ 減法',color:RED.c,value:'-'}],id);
   const s=el('g',{transform:'translate(0,80)'});sentence(290,c_eq(8,'－',3,5),s);
   await c_say(`${g==='-'?'答對了！':'要用減法喔。'}吃掉了，數量變少，8－3＝5。`,id);await c_say('接下來換你練習！',id);}}
 ]};

/* ---------- 練習題 ---------- */
function c_pickEqItem(prompt,correct,wrongs,drawPic,explain){
  const opts=shuffle([correct,...wrongs]);const ans=opts.indexOf(correct);
  return{mode:'pick',prompt,answer:ans,
    draw(){drawPic();return opts.map((o,i)=>c_card(140+i*260,330,230,84,o,32));},
    explain};}
function c_uniqWrongs(correct,cands,n=2){const out=[];for(const c of cands)if(c!==correct&&!out.includes(c))out.push(c);
  const ansNum=+correct.split('＝ ')[1];let k=1;while(out.length<n){const f=correct.replace(/＝ \d+$/,'＝ '+(ansNum+k));if(!out.includes(f))out.push(f);k++;}
  return out.slice(0,n);}
export const TYPES={
 addPic(){const em=pick(OBJ);const a=ri(1,6);let b=ri(1,Math.min(5,10-a));if(Math.random()<.1)b=0;const s=a+b;let S,objs=[];
   return{mode:'num',prompt:'兩個盤子合起來有幾個？',answer:s,max:10,
     draw(){c_plate(220,150);c_plate(580,150,150,80,'#fff1f1','#f0c7c7');objs=c_grid(220,150,a,em,3,58).concat(c_grid(580,150,b,em,3,58));
       S=sentence(335,c_eq(a,'＋',b,s,2));return[];},
     fill(n,c){S.fill(n,c);},
     async explain(id){await c_countObjs(objs,id);await c_say(`${a}＋${b}＝${s}，合起來有 ${s} 個。`,id);}};},
 addEq(){let a,b;do{a=Math.random()<.15?0:ri(1,9);b=Math.random()<.15?0:ri(1,9);}while(a+b>10||a+b<1);let S;
   return{mode:'num',prompt:`${a} 加 ${b} 等於多少？`,answer:a+b,max:10,
     draw(){S=sentence(160,c_eq(a,'＋',b,a+b,2));return[];},fill(n,c){S.fill(n,c);},
     async explain(id){await c_addDots(a,b,320,id);await c_say(`畫圈圈數一數：${a}＋${b}＝${a+b}。${a===0||b===0?'加 0 數量不變。':''}`,id);}};},
 addMissing(){const c=ri(3,10),a=ri(1,c-1);let S;
   return{mode:'num',prompt:`${a} 加多少等於 ${c}？`,answer:c-a,max:10,
     draw(){S=sentence(160,c_eq(a,'＋',c-a,c,1));return[];},fill(n,cl){S.fill(n,cl);},
     async explain(id){await c_missDots(a,c,320,id);await c_say(`先畫 ${a} 個，再往上數到 ${c}，多了 ${c-a} 個。${a}＋${c-a}＝${c}。`,id);}};},
 addPickEq(){const em=pick(OBJ),a=ri(2,6),b=ri(1,Math.min(4,10-a)),s=a+b;const add=Math.random()<.5;let objs=[];
   const correct=`${a} ＋ ${b} ＝ ${s}`;
   const wrongs=c_uniqWrongs(correct,[`${a} ＋ ${b} ＝ ${s+(s<10?1:-1)}`,a>b?`${a} － ${b} ＝ ${a-b}`:`${a} ＋ ${a} ＝ ${2*a}`,`${b} ＋ ${b} ＝ ${2*b}`]);
   return c_pickEqItem(add?`原來有 ${a} 個，又來了 ${b} 個。哪一個算式是對的？`:'兩邊合起來，哪一個算式是對的？',correct,wrongs,
     ()=>{if(add){objs=c_grid(300,140,a,em,3,58);const more=c_grid(600,140,b,em,2,58);more.forEach(t=>t.style.opacity=.85);objs=objs.concat(more);txt(450,140,'又來了 →',{'font-size':24,fill:'#7a6650'});}
       else{c_plate(220,140,150,75);c_plate(580,140,150,75,'#fff1f1','#f0c7c7');objs=c_grid(220,140,a,em,3,58).concat(c_grid(580,140,b,em,3,58));}},
     async id=>{await c_countObjs(objs,id);await c_say(`${a} 個和 ${b} 個合起來是 ${s} 個，所以是 ${a}＋${b}＝${s}。`,id);});},
 subPic(){const em=pick(OBJ),n=ri(3,10),b=ri(1,n-1),r=n-b;let S,objs=[];
   return{mode:'num',prompt:'劃掉的被吃掉了，還剩幾個？',answer:r,max:10,
     draw(){objs=c_grid(400,145,n,em,5,66,44);objs.slice(r).forEach(t=>{t.style.opacity=.4;c_cross(t);});S=sentence(335,c_eq(n,'－',b,r,2));return[];},
     fill(n2,c){S.fill(n2,c);},
     async explain(id){await c_countObjs(objs.slice(0,r),id);await c_say(`${n} 個劃掉 ${b} 個，還剩 ${r} 個。${n}－${b}＝${r}。`,id);}};},
 subEq(){const n=ri(1,10);let b=ri(0,n);if(Math.random()<.15)b=pick([0,n]);let S;
   return{mode:'num',prompt:`${n} 減 ${b} 等於多少？`,answer:n-b,max:10,
     draw(){S=sentence(160,c_eq(n,'－',b,n-b,2));return[];},fill(x,c){S.fill(x,c);},
     async explain(id){await c_subDots(n,b,320,id);await c_say(`畫 ${n} 個圈，劃掉 ${b} 個，剩下 ${n-b} 個。${b===0?'減 0 不變。':b===n?'全部劃掉就是 0。':''}`,id);}};},
 subMissing(){const n=ri(3,10),r=ri(0,n-1),b=n-r;let S;
   return{mode:'num',prompt:`${n} 減多少等於 ${r}？`,answer:b,max:10,
     draw(){S=sentence(160,c_eq(n,'－',b,r,1));return[];},fill(x,c){S.fill(x,c);},
     async explain(id){await c_subDots(n,b,320,id,true);await c_say(`畫 ${n} 個，劃到只剩 ${r} 個，劃掉了 ${b} 個。${n}－${b}＝${r}。`,id);}};},
 subPickEq(){const em=pick(OBJ),n=ri(4,10),b=ri(1,n-2),r=n-b;let objs=[];const correct=`${n} － ${b} ＝ ${r}`;
   const wrongs=c_uniqWrongs(correct,[`${n} ＋ ${b} ＝ ${n+b}`,`${n} － ${b} ＝ ${r+1}`,`${n} － ${r} ＝ ${b+1}`]);
   return c_pickEqItem(`有 ${n} 個，劃掉的被拿走了。哪一個算式是對的？`,correct,wrongs,
     ()=>{objs=c_grid(400,140,n,em,5,66,44);objs.slice(r).forEach(t=>{t.style.opacity=.4;c_cross(t);});},
     async id=>{await c_countObjs(objs.slice(0,r),id);await c_say(`${n} 個拿走 ${b} 個，還剩 ${r} 個，所以是 ${n}－${b}＝${r}。`,id);});},
 subStory(){const isAdd=Math.random()<.5;
   const A=[['樹上有 {a} 隻小鳥，又飛來 {b} 隻，','現在有幾隻？','又飛來'],['左手有 {a} 顆糖，右手有 {b} 顆，','合起來有幾顆？','合起來'],['哥哥有 {a} 張貼紙，媽媽再給他 {b} 張，','現在有幾張？','再給'],['池塘有 {a} 隻青蛙，又跳來 {b} 隻，','一共有幾隻？','又跳來']];
   const Sb=[['盤子有 {a} 個餅乾，吃掉 {b} 個，','還剩幾個？','吃掉、還剩'],['樹上有 {a} 隻小鳥，飛走 {b} 隻，','還剩幾隻？','飛走、還剩'],['有 {a} 顆氣球，破了 {b} 顆，','還有幾顆？','破了'],['車上有 {a} 個人，下車 {b} 個人，','車上還有幾個人？','下車、還有']];
   let a,b;if(isAdd){a=ri(1,7);b=ri(1,10-a);}else{a=ri(3,10);b=ri(1,a-1);}
   const t=pick(isAdd?A:Sb),l1=t[0].replace('{a}',a).replace('{b}',b),l2=t[1],eq=isAdd?`${a}＋${b}＝${a+b}`:`${a}－${b}＝${a-b}`;
   return{mode:'pick',prompt:`${l1}${l2}要用加法還是減法？`,answer:isAdd?0:1,
     draw(){txt(400,70,l1,{'font-size':30,fill:'#3d2c1e'});txt(400,120,l2,{'font-size':30,fill:'#3d2c1e'});
       return[c_card(250,250,220,110,'＋ 加法',38),c_card(550,250,220,110,'－ 減法',38)];},
     async explain(id){txt(400,375,eq,{'font-size':36,fill:'#2bb673',class:'svgtxt pop'});
       await c_say(`題目說「${t[2]}」，數量${isAdd?'變多':'變少'}，用${isAdd?'加':'減'}法：${eq}。`,id);}};}
};
