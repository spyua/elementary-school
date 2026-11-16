// 單元測試用的單元畫面骨架：引擎模組載入時就會抓這些 id，所以要在 import 前放進 document.body。
export const DOM = `<section id="home"></section><button id="homeBtn"></button>
  <section id="lesson" class="hidden"><div id="crumb"></div><span id="stTxt"></span><span id="score"></span>
  <div id="stage"><svg id="svg" viewBox="0 0 800 420"></svg><div id="startOv"></div></div>
  <div id="sub"></div><div id="bar"></div>
  <nav id="nav"><button id="prev"></button><button id="replay"></button><button id="next"></button></nav></section>`;
