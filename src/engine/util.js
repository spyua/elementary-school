// 亂數與小工具（從舊檔 CORE 段原樣搬來）。
// 注意：對照測試依賴亂數呼叫順序，這裡的函式不要改寫。
export const $ = s => document.querySelector(s);
export const C=[{c:'#ff5a5f',l:'#ffd3d4',n:'紅'},{c:'#3a86ff',l:'#cfe0ff',n:'藍'},{c:'#2bb673',l:'#c9f0dc',n:'綠'}];
export const RED=C[0],BLUE=C[1],GREEN=C[2];
export const rand=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rand(a,b+1)), pick=a=>a[ri(0,a.length-1)];
export const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function distinct(n,lo,hi,gap=1){for(let t=0;t<500;t++){const s=Array.from({length:n},()=>ri(lo,hi)).sort((a,b)=>a-b);let ok=true;for(let i=1;i<n;i++)if(s[i]-s[i-1]<gap)ok=false;if(ok)return shuffle(s);}return shuffle(Array.from({length:n},(_,i)=>lo+i*gap));}
export const POS3=['左邊','中間','右邊'],POS2=['左邊','右邊'];
