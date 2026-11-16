# 一上數學：動畫升級與期中、期末考設計

日期：2026-11-16
狀態：已實作（2026-11-17；和設計不同的地方見第 10 節）
前一份設計：`docs/superpowers/specs/2026-11-16-platform-foundation-design.md`

## 0. 一分鐘看完

這份設計做兩件事：

1. **讓現有動畫更好看、更有趣。** 把畫面上的文字 emoji 換成開源的 Fluent Emoji 圖片，加上吉祥物、單元背景、答對慶祝和更 Q 彈的動畫。
2. **新增期中考與期末考。** 一上數學第一～五章是期中範圍，第六～九章（加上全冊總複習）是期末範圍。學期畫面依這個分組顯示。每份考卷 20 題、每題 5 分，每次都重新隨機出題，作答時不顯示對錯，交卷後才看分數和錯題講解。

最大的限制是**對照測試（parity）**。它用固定亂數重播每個單元，逐字比對字幕。所以：

- 現有場景、練習、總複習的**字幕一個字都不能改**。
- 現有流程裡 **`Math.random` 的呼叫次數和順序不能變**。
- 考試是新功能，不受這兩條限制。

| 項目 | 做法 | 風險 |
|---|---|---|
| 換圖片 | 新增 `emojiAt()`，參數和 `txt()` 一樣，只換呼叫點 | 🟢 低：不碰亂數、不改時序 |
| 動畫升級 | 只加 CSS 動畫與裝飾，不新增 `await`、不改既有時長 | 🟢 低 |
| 考試引擎 | 在練習引擎加「考試模式」分支；不開考試時行為完全不變 | 🟡 中：要靠對照測試證明沒改到練習 |
| 錯題重看 | 每題記一個亂數種子，重看時用同一個種子重建同一題 | 🟡 中：靠單元測試證明重建結果一致 |
| 素材 | 只用 Fluent Emoji Flat SVG（MIT），約 80 個檔、預估 < 400 KB | 🟢 低 |

---

## 1. 目的

孩子已經能用現有的 12 個單元學習。這一階段要讓學習更有吸引力，並提供「像紙本考試」的期中、期末練習，讓孩子在學校考試前可以完整演練一次。

## 2. 目標與非目標

### 目標

1. 現有 g1a 場景的物件改用開源圖片顯示，整體動畫更生動（第 5 節）。
2. 學期畫面依「期中範圍」「期末範圍」分組，每組最後放一張考試卡。
3. 期中考、期末考各 20 題、每題 5 分、滿分 100 分；每次重新隨機，而且每章都有固定題數。
4. 作答時不洩漏對錯；交卷後顯示分數、列出錯題，點錯題可以看正確答案和講解動畫。
5. 每題前有主題開場動畫，讓孩子想繼續答題。
6. 下載教材後，考試和新圖片在離線時都能使用。
7. 對照測試在 chromium 與 iPad 兩個 project 都維持全綠。

### 非目標

- 不改現有場景與練習的字幕、題目內容和出題順序。
- 不做考試中途存檔。離開考試就結束，下次進來重新出一份。
- 不做「跳回第幾題改答案」。只在最後一題後顯示「要交卷了嗎？」確認畫面。
- 不做計時器，也不記錄作答時間。
- 不把分數或作答內容送到任何伺服器，也不寫進 repo。分數只存在瀏覽器（沿用現有的星星進度）。
- 不支援一上以外的學期考試。引擎做成通用的，但這一階段只寫 g1a 的考卷藍圖。

## 3. 使用者決策（原文照錄）

> A. Optimise the current animations and use open-source UI/UX images so teaching is more fun.
>
> B. Math 一上: chapters 1–5 (一、10以內的數 num10; 二、比長短 line/curve/thick/align; 三、順序與多少 order; 四、分與合 split; 五、認識形狀 shape) = 期中考 range;
> chapters 6–9 (六、加法 add; 七、減法 sub; 八、30以內的數 num30; 九、時間 time) = 期末考 range. Show this grouping on the semester screen.
>
> C. Full 期中考 and 期末考 papers: 20 questions, 5 points each, 100 total; randomised every attempt with balanced coverage of every chapter in range; may add new exam-style generators modelled on typical Taiwanese 一上 test question types (original content only).
>
> D. Exam behaviour: like a paper test — NO right/wrong feedback while answering; at the end show the score out of 100, list the wrong questions, and let the child tap each to see the correct answer plus the explanation animation. Questions should come with animated intros/themes that make the child want to answer.

**補充說明：** 使用者原話是「1-5 章期中，6-10 期末」。一上數學只有九章，學期畫面上的第十個區塊是「🏆 學習加油讚」（全冊總複習）。因此本設計把它放進期末組，排在期末考卡片前面，當作考前暖身。

## 4. 素材選擇與授權

### 4.1 採用

| 素材 | 授權 | 放在哪裡 | 用途 |
|---|---|---|---|
| Microsoft Fluent Emoji（Flat SVG） | MIT | `public/emoji/`（教材圖）、`public/ui/`（引擎共用圖） | 數數物件、動物、生活事件卡、考試主題圖、吉祥物、獎盃獎牌 |

只用一套畫風，畫面才協調。Flat SVG 每個約 0.5～4.5 KB，放大不會糊，也能直接用 CSS 做動畫。

`credits.json` 已經有 Fluent Emoji 這一筆。新增檔案時，要在 `usage` 欄位補上「本地檔名 ← Fluent 原名」，例如 `car ← Automobile`、`rabbit-face ← Rabbit face`。

### 4.2 不採用（以及原因）

| 素材 | 原因 |
|---|---|
| canvas-confetti（ISC） | 內部呼叫 `Math.random`，而且不能設定種子。只要在練習裡撒彩帶，對照測試就會失敗。改成自己寫 CSS 紙花 |
| animate.css | GitHub 主分支授權改成 Hippocratic 2.1，不在白名單。自己寫 5～6 個 keyframes（動畫影格）就夠 |
| Animated Noto Emoji（Lottie，CC-BY-4.0） | 授權可以，但播放器加動畫約 380 KB，畫風也和 Fluent 不同。第一版不用 |
| Kenney 圖片包（CC0） | 授權可以，但這一版用 Fluent 加 CSS 就能做完。之後若要加，要在 credits.json 新增一筆 |
| OpenMoji（CC BY-SA） | ShareAlike（相同方式分享）不在白名單 |
| unDraw、Freepik、Flaticon、LottieFiles 平台動畫 | 不是開源授權 |

### 4.3 檔案分兩個資料夾

| 資料夾 | 放什麼 | 怎麼離線快取 |
|---|---|---|
| `public/emoji/` | 教材專屬的圖（蘋果、兔子、牙刷、考試主題圖…） | 列進學期包的 `assets`，按「下載教材」時抓取；service worker 現有的 `emoji` 規則會存起來 |
| `public/ui/` | 所有學期包共用的引擎圖（吉祥物、星星、獎盃、獎牌、紙花） | 加進 Workbox 的 `globPatterns`，跟 App 外殼一起預先快取 |

為什麼要分開：結果頁的星星和吉祥物，英文試玩包也會用到。放進 App 外殼，就不必每個學期包都重複列一次。

### 4.4 檔案清單（下載時再確認 Fluent 原名）

**教材圖（`public/emoji/`）**，依研究報告第 4 節整理：

- 物件與食物：apple（已有）、glowing-star、balloon、strawberry、cookie、candy、car、soccer-ball、carrot、cup-with-straw、spoon、doughnut、bone、blossom、locomotive
- 動物與人物：rabbit-face、bird（已有）、fish（已有）、baby-chick、dog（已有）、front-facing-baby-chick、turtle、cat（已有）、bear、panda、frog、pig-face、monkey-face、chicken、tiger-face、honeybee、child、lady-beetle
- 生活事件卡：toothbrush、sleeping-face、pencil、bed、backpack、soap、cooked-rice、school、socks、running-shoe、door、bathtub、t-shirt
- 口訣卡 icon（選用，只換「整個字串就是 emoji」的地方）：link、input-numbers、ribbon、scissors、chequered-flag、balance-scale、hourglass-not-done
- 考試主題圖：deciduous-tree、castle、alarm-clock、rainbow、cloud、sun（已有）、lollipop、shortcake

`child`、手勢類 emoji 在 Fluent 裡有膚色子資料夾，一律取 `Default`。

**引擎共用圖（`public/ui/`）**：mascot（← Bear）、star、trophy、medal-gold（← 1st place medal）、medal-silver、medal-bronze、sparkles、party-popper、confetti-ball、wrapped-gift。

預估約 80 個檔，總共 200～400 KB，遠低於 2 MB 上限。單元測試會檢查 `public/emoji` 加 `public/ui` 總大小小於 1 MB。

下載用一支腳本 `scripts/fetch-fluent.mjs`，內含「本地檔名 → Fluent 資料夾名稱」對照表，從 `raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/...` 抓檔。腳本會提交進 repo，日後新增圖片時可以重跑。

---

## 5. 動畫升級

### 5.1 核心：`emojiAt()` 把文字 emoji 換成圖片

**問題：** 舊程式用 `txt(x, y, '🍎')` 畫物件，而且很多地方會讀寫這個 `<text>` 的 `x`、`y`，當成「中心點」。換成 `<image>` 時，`x`、`y` 代表的卻是「左上角」。

**做法：** 新增 `emojiAt(x, y, ch, attrs, parent)`，參數和 `txt()` 完全相同。

- 對照表有這個 emoji，就畫 `<image>`；沒有就退回 `txt()`，行為和原本一樣。
- 在這個 `<image>` 上覆寫 `getAttribute` 和 `setAttribute`（稱為 shim，墊片）。舊程式讀到的仍是中心點，實際寫進 DOM 的是左上角。
- 圖檔載入失敗時，把 `href` 換成文字 emoji 的 data URI，節點不變，舊程式手上的參照仍然有效。
- 不呼叫 `Math.random`，不改任何 `await` 或時序。

這樣做，`c_xy`、`c_moveTo`、`a_realign` 這些舊函式一行都不用改。呼叫點只要把 `txt(` 換成 `emojiAt(`。

**為什麼不用 `<g transform>` 包起來：** `.pop` 是 CSS transform 動畫，播完後 `scale(1)` 會蓋掉 transform 屬性，圖片就會偏移半張。巢狀 `<svg>` 在 iPad Safari 上搭配 CSS transform 不穩。

**只換「整個字串就是一個 emoji」的呼叫點。** 這些字串**不能改**：

- `'🌅 早上'`、`'☀️ 中午'`、`'🌙 晚上'`：「我的一天」用 `a.slice(2)` 切掉 emoji 產生字幕，字串一動字幕就變。
- `#bar` 按鈕上的 emoji（🪄、⏩、✏️、🔊、🔁、🏠）：harness（自動跑場景的測試腳本）用按鈕文字找按鈕。
- `①②`、「3 節」、時鐘標籤：有三處程式用 `querySelectorAll('text')` 找它們，必須保持 `<text>`。

### 5.2 升級清單

每一項都**不改字幕**、**不動 `Math.random`**、**不改既有 `wait()` 與 `tween()` 時長**、**不新增 `await`**。

| # | 升級 | 改哪裡 |
|---|---|---|
| 1 | emoji 文字換成 Fluent 圖片 | g1a 各檔約 15 處呼叫點 |
| 2 | 瓢蟲換成 Fluent 🐞，藍藍用 `hue-rotate` 變藍，走路時身體輕擺 | `length.js` `bug()`；`walk()` 不動 |
| 3 | `tween(dur, fn, id, ease)` 加可選緩動參數：掉落用彈跳、飛走用 back、排隊用 ease-out-back | `svg.js`；預設值維持原樣 |
| 4 | `.pop` 改成 0 → 1.18 → 0.94 → 1 的 Q 彈曲線 | `app.css` |
| 5 | 待機輕晃 `.bob`（上下 3px），延遲用「索引 × 固定值」錯開 | `app.css`、場景角色 |
| 6 | 數數時物件跳一下，數字改成圓形徽章 | `a_tagCount`、`c_num`、`c_countObjs`、`countDots` |
| 7 | 小鳥飛走拍翅、餅乾被吃冒碎屑（固定角度）、劃掉的物件變灰 | `c_flyAway`、`c_tapEat`、`c_cross` |
| 8 | 練習答對灑紙花、答錯輕搖；紙花用固定圖樣，不 `await` | `practice.js` `check()` |
| 9 | 練習結果頁：⭐ 換 Fluent 圖片依序彈出、🏆、分數 count-up | `practice.js` `practiceEnd()` |
| 10 | 吉祥物小熊：放在字幕列旁，說話時嘴動、練習答對跳、答錯歪頭 | 新增 `mascot.js`；`say()` 發出 `lesson:say` 事件 |
| 11 | 單元背景：數數是草地、加減是野餐桌、時間是天空、形狀是積木地墊 | `#stage[data-theme]` 的 CSS 背景 |
| 12 | 地面、盤子、口訣卡加厚度和陰影 | 只用 `el()`，不新增 `<text>` |
| 13 | 火車輪子轉動、移動時冒煙 | `split.js` `trCar`、`trainPlay` |
| 14 | 打勾、畫圈改成「手寫」逐筆畫出 | `markShape` 加 `.draw` class |
| 15 | 時鐘彩色外框、粗刻度、指針圓點 | `num30time.js` `d_clock` |
| 16 | 支援「減少動態效果」：`prefers-reduced-motion` 時只保留淡入 | `app.css` |

### 5.3 守住對照測試的規則

1. **不新增 `Math.random` 呼叫。** 裝飾用的位置一律用固定公式，或用獨立的 `mulberry32`（固定種子的亂數產生器，不碰 `Math.random`）。
2. **不新增 `await`，不改既有時長。** harness 每 250 ms 取樣一次字幕，時間軸一變就可能漏抓短暫出現的字幕。新動畫一律是「不等待」的 CSS 動畫。
3. **不在 `#bar` 加按鈕，不在 `#svg` 新增 `.blink`、`.pulse`。** harness 會自動點這些東西，新增會改變點擊路徑。裝飾動畫用新的 class 名稱（`.bob`、`.hop`、`.flap`）。
4. **新裝飾不用 `<text>`。** 避免被那三處 `querySelectorAll('text')` 誤刪或誤改。數數徽章的數字例外，因為那幾個場景沒有清除 text 的程式。
5. **吉祥物、背景、紙花放在 `#svg` 外面**，設 `pointer-events: none`。`clear()` 清不到它們，也不會擋住 iPad 點擊。
6. **練習與考試時，要數的物件不晃動。** `#stage[data-mode="practice"] .bob` 和 `#stage[data-mode="exam"] .bob` 關掉動畫，避免干擾孩子數數。

---

## 6. 考試設計

### 6.1 學期畫面分組

`catalog.js` 的 g1a 學期包新增三個欄位，舊欄位不變：

```js
chapters: [
  { name: '一、10 以內的數', units: ['num10'], term: 'mid' },
  // …二～五章 term: 'mid'
  { name: '六、10 以內的加法', units: ['add'], term: 'final' },
  // …七～九章 term: 'final'
  { name: '🏆 學習加油讚', units: [], review: 'review-all', term: 'final' },
],
terms: [
  { key: 'mid', name: '📝 期中考範圍', range: '第一～五章', exam: 'exam-mid' },
  { key: 'final', name: '📝 期末考範圍', range: '第六～九章', exam: 'exam-final' },
],
exams: [
  { key: 'exam-mid', id: 'G1A-M-exam-mid', title: '期中考', desc: '20 題・100 分' },
  { key: 'exam-final', id: 'G1A-M-exam-final', title: '期末考', desc: '20 題・100 分' },
],
```

- 學期畫面：有 `terms` 的學期包，依 `term` 把章節分成兩組。每組有一個大標題（例如「📝 期中考範圍・第一～五章」），組內照舊列章節與單元卡，最後放一張考試卡。
- 沒有 `terms` 的學期包（英文試玩）照舊顯示。
- `findUnit()` 也要搜尋 `pack.exams`，路由 `#/g1/math/a/exam-mid` 才找得到。
- 考試 ID `G1A-M-exam-mid`、`G1A-M-exam-final` 一旦提交就不再更改，星星進度用它當鍵值。

### 6.2 整體流程

```
學期畫面 → 點「期中考」卡
  → 開始畫面（點一下解鎖語音，沿用 #startOv）
  → 考試封面：地圖動畫「森林探險 20 站」
  → 每題：開場動畫（≤ 1.2 秒，點一下可略過）→ 作答 → 按「✔ 好了」→ 中性回饋「收到！」
  → 每區結束：休息站（看收集到的小物，按「繼續 ▶」）
  → 最後一題後：「要交卷了嗎？」→ 交卷
  → 結果頁：慶祝完成 → 分數 count-up → 錯題卡片「再看一次」
  → 點錯題卡：重畫這一題，顯示孩子的答案（灰色）與正確答案（綠色），播講解動畫 → 回成績單
```

### 6.3 怎麼接進現有練習引擎

**原則：只加分支，不改原路徑。** 不開考試時，練習引擎每一行執行的程式和現在一樣，所以對照測試不受影響。

`startPractice(cfg)` 多接受一個可選欄位 `cfg.exam`：

```js
startPractice({
  title: '期中考', unitId: 'G1A-M-exam-mid',
  queue: paper.map(q => q.type),
  exam: { paper, onAnswered(entry) {}, onEnd(log) {} },
});
```

`practice.js` 內有 `P.cfg.exam` 時，才走以下分支：

| 位置 | 練習（不變） | 考試分支 |
|---|---|---|
| `nextItem()` 建題 | `item = GEN[type](); regs = item.draw();` | 同一段程式包在 `withSeed(paper[i].seed, …)` 裡執行 |
| 題目旁按鈕 | 只有範本題有「🔊 再聽一次」 | 每題都有「🔊 再聽一次」 |
| `#score` | 顯示 ⭐ 答對數 | 清空，不顯示 |
| pick／num／pair 點選 | 點了就檢查 | 點了只是「選中」（放大加外框），出現「✔ 好了」按鈕才送出 |
| dual／classify 的「檢查答案」 | 檢查答案 | 文字改成「✔ 好了」 |
| `check()` 判分後 | 音效、綠色正解、稱讚語、講解、「下一題」 | 記錄結果，播**同一個**音效與「收到！」動畫，固定 900 ms 後自動進下一題 |
| 題目結束 | `practiceEnd()` | 呼叫 `cfg.exam.onEnd(log)`，交給 `exam.js` 顯示結果頁 |

**不洩漏對錯的檢查重點：** 答對和答錯時，音效、動畫長度、字幕文字、吉祥物動作必須完全一樣。e2e 測試會比對這幾點（第 8 節）。

**判分邏輯共用：** 把 `check()` 裡「算出 ok」那段抽成 `judge(item, marks)` 純函式，練習和考試都呼叫它。抽出來的函式不呼叫 `Math.random`，所以練習的亂數順序不變。

`exam.js`（新檔，`src/engine/exam.js`）負責考試專屬的畫面：封面地圖、每題開場、休息站、交卷確認、結果頁、錯題卡片。它不碰練習引擎的內部變數，只透過 `startPractice` 的 `cfg.exam` 和 `practice.js` 匯出的 `reviewExamItem()` 溝通。

### 6.4 出卷：藍圖與種子

**藍圖（blueprint）** 是一份資料，描述每一區要出哪些題型：

```js
// src/content/math/g1a/exam.js
export const MID_BLUEPRINT = {
  key: 'exam-mid', title: '期中考', theme: 'forest',
  zones: [
    { chapter: '一、10 以內的數', name: '蘋果果園', icon: 'apple',
      slots: [['n10count'], ['n10match', 'n10frame'], ['n10corr'], ['exN10CircleN']] },
    // …
  ],
};
```

- 每個 `slot` 出一題，從清單裡隨機挑一個題型。
- 一區內的題目順序隨機打亂；區與區的順序固定（由淺到深，就是地圖分區的效果）。
- 所有 slot 加起來必須剛好 20 個，每題 5 分。

**出卷函式** `buildPaper(blueprint, rand = Math.random)`（`src/engine/paper.js`，純函式）回傳：

```js
[{ type: 'n10count', seed: 1234567, zone: 0 }, …]   // 共 20 筆
```

每題配一個 32 位元整數**種子**。建題時用 `withSeed(seed, fn)` 暫時把 `Math.random` 換成 `mulberry32(seed)`，執行完再換回來。這樣同一個種子一定得到同一道題、同一個畫面。

### 6.5 錯題怎麼存、怎麼重看

**存什麼：** 每題作答後記一筆：

```js
{ n: 7, type: 'ordNth', seed: 1234567, zone: 2, given: { 3: 'o' }, ok: false }
```

`given` 是孩子的作答（`marks` 的複本）。整份考卷的紀錄只放在記憶體，離開考試就丟掉，不寫進 localStorage，也不寫進 repo。

**為什麼存種子，不存題目物件：** 題目物件的 `draw()` 會畫在共用的 `#svg` 上，而且部分題型在 `draw()` 裡也會用亂數決定位置。如果只保存物件再呼叫一次 `draw()`，畫面可能和孩子當時看到的不一樣，正確答案的位置也可能對不上。用同一個種子重建「出題 + 畫圖」，可以保證重看時畫面和作答時完全相同。

**重看流程** `reviewExamItem(entry, id)`（`practice.js` 匯出）：

1. `clear()`，在 `withSeed(entry.seed, …)` 裡重新執行 `GEN[type]()` 和 `draw()`。
2. 用灰色（`#9a8c7a`）畫出孩子的答案 `given`。
3. 用綠色（`#2bb673`）畫出正確答案，畫法和練習的「顯示正解」相同。
4. 字幕：num 題說「正確答案是 N。我們一起看看。」，其他題說「我們一起看看為什麼。」
5. 有 `moves` 的題型，先移除標記再播講解，和練習一樣。
6. `await item.explain(id)`，播完出現「回到成績單」按鈕。

講解動畫在 `withSeed` 外面執行，用的是真正的 `Math.random`。這不影響正確性，因為講解內容都來自題目物件裡已經決定好的數值。

### 6.6 每章題數與題型配置

#### 期中考（5 區 × 4 題 = 20 題）

主題「森林探險」。

| 區 | 章 | 主題 | 4 個 slot（同一格內隨機挑一個） |
|---|---|---|---|
| 1 | 一、10 以內的數 | 蘋果果園 🍎 | `n10count`｜`n10match`、`n10frame`｜`n10corr`｜`exN10CircleN` |
| 2 | 二、比長短 | 彩虹橋 🌈 | `classify`｜`rope`、`box`、`curve3`、`exLenUnits`｜`thick2`、`thick3`｜`align` |
| 3 | 三、順序與多少 | 動物列車 🚂 | `ordSeq`、`exOrdCompare`｜`ordNth`、`ordCardinal`｜`ordMore`、`ordDiff`｜`exOrdQueue` |
| 4 | 四、分與合 | 糖果屋 🍭 | `bond`｜`picture`、`pair`｜`ten`、`wrong`｜`exSplitAll` |
| 5 | 五、認識形狀 | 積木城堡 🏰 | `shpName`、`shpClassify`｜`shpRoll`、`shpTrace`｜`shpCount`｜`exShpPattern` |

第二區的 4 個 slot 剛好對應「直線和曲線、曲線比長短、厚和薄、比高矮」四個單元，每個單元都考到。

#### 期末考（4 區 × 5 題 = 20 題）

主題「遊樂園探險」。

| 區 | 章 | 主題 | 5 個 slot |
|---|---|---|---|
| 1 | 六、10 以內的加法 | 氣球廣場 🎈 | `addPic`｜`addEq`｜`addPickEq`、`exAddSwap`｜`addMissing`｜`exAddWord` |
| 2 | 七、10 以內的減法 | 餅乾工廠 🍪 | `subPic`｜`subEq`、`subMissing`｜`subPickEq`、`subStory`｜`exSubCompare`｜`exSubWord` |
| 3 | 八、30 以內的數 | 水族館 🐟 | `n30bundle`、`n30tens`｜`n30seq`｜`n30cmp`｜`exN30SkipCount`｜`exN30MoreLess` |
| 4 | 九、時間 | 鐘樓 ⏰ | `timRead`｜`timHalfTrap`｜`timOrder`、`timEarlier`｜`exTimPickClock`｜`exTimDaily` |

#### 新增的考試題型（14 個）

全部原創，模仿台灣一上考卷常見題型，不抄任何出版社題目。題目裡的角色用動物（小熊、小兔），不用真實人名。

| 題型 | 章 | 模式 | 內容 |
|---|---|---|---|
| `exN10CircleN` | 一 | pick | 三個盤子，「哪一盤剛好是 7 個？」（含 0 個的空盤變體） |
| `exLenUnits` | 二 | num | 物件下方有方格，「鉛筆有幾格長？」 |
| `exOrdQueue` | 三 | num | 動物排隊，「小兔前面有 2 隻、後面有 3 隻，一共幾隻？」 |
| `exOrdCompare` | 三 | pick | 三張數字卡，選最大或最小（不用 > < 符號） |
| `exSplitAll` | 四 | pick | 列出一個數的分法表，缺一組，選缺的那一組 |
| `exShpPattern` | 五 | pick | ○△○△、□□△□□ 的規律，選下一個 |
| `exAddWord` | 六 | num | 聽題作答的加法文字題，直接求答案 |
| `exAddSwap` | 六 | pick | 選出和 3＋5 一樣大的算式（交換律） |
| `exSubWord` | 七 | num | 聽題作答的減法文字題（和 `exAddWord` 共用文字題引擎） |
| `exSubCompare` | 七 | num | 兩排物件對齊，「紅的比藍的多幾個？」 |
| `exN30SkipCount` | 八 | pick | 2、4、6、□ 或 5、10、15、□ |
| `exN30MoreLess` | 八 | pick | 「比 18 多 1 是多少？」「比 20 少 1 是多少？」 |
| `exTimPickClock` | 九 | pick | 給「3 點半」，從三個鐘面選出正確的 |
| `exTimDaily` | 九 | pick | 生活情境版：「小熊 7 點起床」，選對應的鐘面 |

規則：

- 放在新檔 `src/content/math/g1a/exam.js`，匯出 `EXAM_TYPES`，用 `registerTypes` 登記。
- 只出現在考試藍圖裡。**不加進任何單元的 `practice` 陣列**，所以 `review-all` 的題型池和亂數順序不變。
- 介面和現有題型相同：`{ mode, prompt, answer, max?, draw(), fill?, explain(id) }`。每個都要有講解動畫，因為錯題重看需要它。
- 只用現有的作答模式（pick、num），不新增模式。
- 畫物件一律用 `emojiAt()`。

### 6.7 開場動畫與主題

目標：讓孩子想答下一題，但不搶題目畫面。

- **地圖進度列：** 考試時 `#crumb` 換成 20 個「站」。每答一題，吉祥物走到下一站，已過的站亮起來。6 歲孩子看不太懂「12/20」，用位置比較直覺。
- **每題開場（≤ 1.2 秒）：** `#stage` 上蓋一層 `#examIntro`。該區主題圖彈入，顯示「第 7 站」，吉祥物跳一下。點一下畫面就略過。播完才畫題目。
- **休息站：** 每區結束時顯示「蘋果果園完成！」和這一區收集到的小物，按「繼續 ▶」進下一區。給孩子一個喘口氣的機會。
- **收集物：** 每答一題（不論對錯）就收到一個該區小物，飛進畫面角落的背包。這是「完成獎勵」，和分數無關。
- **中性回饋：** 送出答案後，吉祥物從 3 種動作（點頭、比讚、收卡片）輪流挑一種。挑哪一種只依題號決定（`n % 3`），和對錯無關。
- **動畫只在題目區外圍。** 題目區內不放持續移動的東西。
- **減少動態效果：** 關掉地圖移動與彈跳，只保留淡入。

### 6.8 結果頁

分三幕，順序很重要：先肯定孩子做完，再看分數，最後才看錯題。

1. **完成：** 「你完成了 20 站冒險！」加紙花。紙花用 CSS 加 `mulberry32`，不用 canvas-confetti。
2. **分數：** 數字從 0 跳到最終分數，旁邊依分數顯示獎盃或獎牌。每一檔都用正面語氣：

   | 分數 | 圖 | 文字 |
   |---|---|---|
   | 100 | 金獎盃 + 滿天星 | 全部答對！太厲害了！ |
   | 80～95 | 金牌 | 好棒！只差一點點！ |
   | 60～75 | 銀牌 | 很努力喔！一起看看哪裡可以更好。 |
   | 60 以下 | 銅牌 + 吉祥物舉加油旗 | 你很勇敢，做完了全部！一起來練習吧！ |

   不用紅色叉叉、哭臉或「不及格」這類字。

3. **錯題卡片：** 標題是「再看一次」。每張卡片顯示題號、該區主題圖和「看答案」。卡片高度至少 88px，適合 iPad 點擊。看完的卡片打勾，全部看完送一張「認真小學者」貼紙動畫。

底部按鈕列（`#bar`）：

- 「🔁 練習這些題型」：把錯題的題型丟進現有的練習流程（`startPractice`，一般練習模式）。
- 「📝 再考一次」：重新出一份新考卷。
- 「🏠 回首頁」。

星星進度：100 分 3 顆、80 分以上 2 顆、其他 1 顆，透過現有的 `hooks.onResult(unitId, stars)` 存進瀏覽器。

### 6.9 測試掛鉤

`window.__T` 增加唯讀的 `exam` 屬性，供 e2e 測試使用：

```js
window.__T.exam  // { i, total, phase: 'intro'|'question'|'rest'|'submit'|'result'|'review', score, wrong: number[] }
```

`__T.answer(correct)` 在考試模式也能用：它直接設定答案並送出，跳過「✔ 好了」那一步。

---

## 7. 離線快取

| 檔案 | 快取方式 |
|---|---|
| `public/emoji/*.svg`（教材圖、考試主題圖） | g1a 學期包新增 `assets` 欄位。清單由共用的對照表 `src/engine/emoji-map.js` 產生，「下載教材」時逐一抓取 |
| `public/ui/*.svg`（吉祥物、星星、獎盃） | Workbox `globPatterns` 加 `ui/*.svg`，隨 App 外殼預先快取 |
| 考試程式 | 和 g1a 學期包同一個 chunk（`index.js` 匯入 `exam.js`），下載學期包時一起存 |

單元測試會檢查：對照表裡每個檔名都在 `public/emoji/` 找得到，而且 g1a 的 `assets` 涵蓋所有對照到的檔案和考試主題圖。

## 8. 測試策略

| 層級 | 測什麼 |
|---|---|
| 對照測試（既有） | 12 個單元、練習、2 個總複習的字幕序列不變。chromium 與 iPad 都要綠 |
| 單元：`emojiAt` | 呼叫時 `Math.random` 0 次；`setAttribute('x', v)` 後 `getAttribute('x')` 讀回相同字串，DOM 實際 x 等於 v − 邊長/2；沒有對照的字元退回 `<text>` |
| 單元：素材 | 對照表的檔案都存在；`assets` 涵蓋全部；`public/emoji` + `public/ui` 小於 1 MB；credits 測試通過 |
| 單元：出卷 | 一定 20 題；每區題數符合藍圖；題型都來自該 slot；種子是整數；不同亂數得到不同考卷 |
| 單元：種子重建 | 兩份藍圖用到的每個題型，同一個種子建兩次，`prompt`、`answer` 和 `#svg` 內容完全相同 |
| 單元：新題型 | 每個 `ex*` 題型跑 200 個種子：答案在選項範圍內、選項不重複、num 題答案 ≤ `max`、有 `explain` |
| 單元：判分 | `judge()` 對各模式的對錯判斷和練習原本的結果相同 |
| 單元：目錄 | `terms` 涵蓋所有章節；考試 ID 格式正確且不重複；`findUnit` 找得到考試 |
| e2e：考試流程 | 開期中考，用 `__T.answer` 交替答對答錯 20 題；每題送出後 `#sub` 都是「收到！」、`#svg` 沒有綠色正解、`#score` 是空的；結果頁分數 = 答對題數 × 5；錯題卡數量正確；點一張卡會畫出綠色正解並播講解，再回成績單 |
| e2e：學期畫面 | 出現兩個分組標題與兩張考試卡；點卡片進入考試 |
| e2e：離線 | 下載教材後離線，打開考試和有圖片的單元都正常 |
| 隱私（既有） | `npm test` 的隱私測試通過；`private/` 不被追蹤 |

## 9. 風險與對策

| 風險 | 對策 |
|---|---|
| 換圖後某個場景的字幕時序被打亂 | 圖片不 `await` 載入；每換一個檔案就跑該單元的對照測試 |
| 考試分支意外改到練習流程 | 分支一律用 `if (P.cfg.exam)` 包住；`judge()` 抽出後跑完整對照測試 |
| 某題型在 `draw()` 外也用亂數，重看時畫面不同 | 「種子重建」單元測試涵蓋藍圖裡的每個題型 |
| 孩子從音效或動畫長短猜出對錯 | e2e 比對答對與答錯時的字幕與畫面；中性回饋只依題號挑動作 |
| 圖檔下載失敗（離線、檔名打錯） | `emojiAt` 失敗時換回文字 emoji，畫面不會空一塊 |

## 10. 實作後和設計不同的地方

整體照設計完成。下面這些是實作時調整的細節，都不影響練習流程，對照測試在兩個 project 都維持全綠。

### 10.1 素材與圖片

| 項目 | 設計 | 實際 | 原因 |
|---|---|---|---|
| 圖片數量 | 約 80 個、200～400 KB | `public/emoji/` 63 個、`public/ui/` 10 個，實際檔案大小約 172 KB（`du -ch` 以磁碟區塊計約 331 KB） | 只下載用得到的圖 |
| 手勢 emoji | 有膚色的取 Default | 沒有下載手勢類（👆👉☝️） | 4.4 的清單裡沒有它們；含手勢的字串本來就不能換 |
| 對照表多出的字元 | — | 多對照 🌳🏰⏰🌈☁☀🍭🍰🐞 | 考試主題圖和瓢蟲直接可用 |
| 變體選擇符 | — | 對照表的鍵不含 U+FE0F，查表前先去掉 | `'✏️'`、`'⚖️'` 這類字元也查得到圖 |

`emojiAt()` 另外多做三件事：`setAttribute('font-size')` 會重算圖片邊長且中心點不動；讀 `textContent` 會拿到原本的 emoji 字元；`fill`、`text-anchor` 這類只對文字有用的屬性不寫到 `<image>` 上。

### 10.2 動畫升級

- **藍藍瓢蟲變色：** 用 SVG 濾鏡（`feColorMatrix` 的 `hueRotate`），沒有用 CSS `filter: hue-rotate()`。iPad Safari 對 SVG 元素套 CSS filter 的支援不穩。
- **`tween()` 回呼：** 多傳第二個參數 `t`（原始時間比例）。這樣飛走時位置可以用 back 緩動，透明度仍用線性的 `1 − t`。不傳 `ease` 時進度曲線和原本相同。
- **`lesson:say` 事件：** 從 `speakOne()` 發出，不是 `say()`。有些場景直接呼叫 `speakOne()`，放在這裡吉祥物才不會漏掉句子。
- **數數徽章：** `countDots` 只加圓形徽章，不加 `.hop`，避免蓋掉點點剛彈出的 `.pop`。
- **練習結果頁：** 分數文字從 y=270 移到 y=250，下方加獎盃（答對 6 成以上才出現）。count-up 結束時的文字和原本完全相同。
- **吉祥物位置：** `#sub` 包進新的 `#subRow`（flex 排列），左邊放 `#mascotBox`。既有的 id 都沒有改。
- **單元背景：** 五種主題（meadow、paper、picnic、sky、blocks）都用 CSS 漸層加內嵌 SVG，沒有另外放背景圖檔。

### 10.3 考試流程

- **多一個封面階段：** `__T.exam.phase` 除了第 6.9 節列的六種，還有 `'cover'`。封面唸完「森林探險，出發！」後自動開始，點一下畫面也可以略過。
- **最後一區也有休息站：** 最後一區答完先到休息站，再到「要交卷了嗎？」。這樣每一區的節奏都一樣。
- **`startPractice` 的 `cfg.exam` 多三個掛鉤：** `onItem(i)`（每題畫好時通知 `exam.js` 更新進度）、`beforeItem`（播每題開場）、`crumb`（更新地圖進度列）。全部包在 `if (P.cfg.exam)` 裡。
- **藍圖多兩個欄位：** `adventure`（封面標題，「森林探險」「遊樂園探險」）和 `collect`（每區收集物）。期中是 🍎 🌟 🎀 🍬 🍰，期末是 🎈 🍪 🐟 🌟，都用現有的圖。
- **考試資料多 `icon: '📝'`：** 標題列會讀 `meta.icon`。考試也有單元背景：期中用 meadow、期末用 picnic。
- **「收到！」：** 除了字幕，也用語音念出來，但不等它念完。換題時間固定 900 ms，答對答錯都一樣。
- **中性回饋：** 吉祥物動作由 `practice.js` 送出 `{ neutral: true, act }`，`act` 依題號在點頭、比讚、收卡片之間輪流。

### 10.4 測試

- **「沒有綠色正解」的檢查方式：** 綠色（`#2bb673`）本來就是部分題目的配色（例如曲線題的第三條線）。所以 e2e 改成比對「送出答案前後，綠色元素的數量沒有增加」。
- **`__T.answer(false)` 在 classify 題：** 練習模式原本的行為會填出正確答案。考試模式另外寫 `examAnswer()`，答錯時故意把第一格改錯。練習模式的 `__T.answer` 沒有改。
- **用語檢查：** 沒有擴充 `wording.test.js`，改在 `exam-types.test.js` 檢查每個 `ex` 題型的題目與畫面文字不出現出版社名稱或常見人名。
- **計畫外多寫的測試：** `tests/unit/exam-mode.test.js`（作答時不透露對錯、要按「✔ 好了」才送出、錯題重看的灰圈與綠圈）、`tests/unit/exam-types.test.js`、`tests/unit/helpers/lesson-dom.js`（幾個 jsdom 測試共用的頁面骨架）。
- **離線 e2e：** 新增一個獨立測試：下載「一年級 數學」後離線，emoji 與 ui 圖都要拿得到。
