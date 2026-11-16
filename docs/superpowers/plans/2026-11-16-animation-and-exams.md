# 一上數學：動畫升級與期中、期末考實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 現有 g1a 動畫改用開源圖片並更生動；新增期中考（第一～五章）與期末考（第六～九章＋全冊總複習），各 20 題、100 分、作答時不顯示對錯，交卷後可重看錯題講解。

**Spec：** `docs/superpowers/specs/2026-11-16-animation-and-exams-design.md`

**Tech Stack：** Vite 6、原生 JS ES modules、Vitest 3（jsdom）、Playwright（chromium＋iPad）、ESLint 9、vite-plugin-pwa、Microsoft Fluent Emoji Flat SVG（MIT）。

## 任務一覽

| 任務 | 內容 | 碰到對照測試的範圍 |
|---|---|---|
| T1 | 素材匯入、`emojiAt()`、credits、離線清單 | 不碰（只新增檔案與函式） |
| T2 | g1a 場景與練習的動畫升級 | 🟡 全部單元，必須維持全綠 |
| T3 | 考試引擎：出卷、考試模式、結果頁、錯題重看 | 🟡 練習引擎加分支，必須維持全綠 |
| T4 | 14 個新考試題型、開場動畫與主題、學期畫面分組 | 不碰（新功能） |
| T5 | 文件、給爸媽說明、最終驗證 | 不碰 |

每個任務完成時都要 commit 一次，不 push。

## Global Constraints

- **字幕不改。** 現有場景、練習、`review-length`、`review-all` 的 `#sub` 文字一個字都不能動。
- **亂數不動。** 現有流程的 `Math.random` 呼叫次數與順序不變。裝飾用亂數改用 `src/engine/rng.js` 的 `mulberry32`。
- **時序不動。** 不改既有 `wait()`、`tween()` 時長；不新增 `await`。
- **harness 點擊路徑不動。** 不在 `#bar` 加按鈕（考試除外）；不在 `#svg` 新增 `.blink`、`.pulse`。裝飾用 `.bob`、`.hop`、`.flap` 等新 class。
- **新裝飾不用 `<text>`**（數數徽章除外）。
- **資料字串不改：** `'🌅 早上'`、`'☀️ 中午'`、`'🌙 晚上'`、`#bar` 按鈕文字、`①②`、「3 節」。
- **素材只用 Fluent Emoji Flat SVG（MIT）。** 不用 canvas-confetti、animate.css、Lottie、OpenMoji、unDraw、Freepik、Flaticon。
- **隱私：** 不寫入任何孩子的名字、分數、作答內容或考卷原文。考試紀錄只在記憶體。`private/` 保持不被追蹤。
- **固定 ID：** `G1A-M-exam-mid`、`G1A-M-exam-final`，提交後不再更改。
- 程式註解與文件用台灣繁體中文；孩子看到的文字要短、親切。
- iPad 為主：點擊目標至少 64px（考試選項與錯題卡至少 88px），離線可用。
- commit 結尾加：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## 驗證指令（每個任務都要跑）

```bash
npm test          # 單元測試，含隱私與 credits
npm run lint
npm run e2e       # 會先 build；4173 埠必須空著
```

T5 另外要跑子路徑建置（Git Bash）：

```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/elementary-school/ npm run build
```

`private/golden/` 只在本機。對照測試若顯示「略過」，代表沒有基準檔，**不能**當作通過。

---

## T1：素材匯入、中央圖片 helper、credits 與離線清單

**目標：** 把需要的 Fluent 圖片放進 repo，提供 `emojiAt()`，讓 T2、T4 可以直接用。這個任務不改任何場景。

**檔案：**

- 新增 `scripts/fetch-fluent.mjs`：本地檔名 → Fluent 資料夾名稱的對照表；從 `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/<Name>/Flat/<name>_flat.svg` 下載。有膚色的（`Child`、手勢）改抓 `<Name>/Default/Flat/<name>_flat_default.svg`。重複執行時略過已存在的檔案。
- 新增 `public/emoji/*.svg`：spec 4.4 的教材圖與考試主題圖。
- 新增 `public/ui/*.svg`：mascot、star、trophy、medal-gold、medal-silver、medal-bronze、sparkles、party-popper、confetti-ball、wrapped-gift。
- 新增 `src/engine/emoji-map.js`（純資料，不 import 任何東西）：

  ```js
  /** emoji 字元 → public/emoji/ 檔名（不含 .svg） */
  export const EMOJI_FILE = { '🍎': 'apple', '🐰': 'rabbit-face', /* … */ };
  /** 考試主題圖（public/emoji/） */
  export const EXAM_THEME_FILES = ['deciduous-tree', 'castle', 'alarm-clock', 'rainbow', 'cloud', 'sun', 'lollipop', 'shortcake'];
  /** 引擎共用圖（public/ui/） */
  export const UI_FILES = ['mascot', 'star', 'trophy', /* … */];
  /** 學期包 assets 用：教材圖相對 BASE_URL 的路徑，已去重。 */
  export function packEmojiAssets() { /* emoji/<name>.svg[] */ }
  ```

- 修改 `src/engine/emoji.js`，新增：

  ```js
  export function uiUrl(name) {}              // `${BASE_URL}ui/${name}.svg`
  export function emojiFile(ch) {}            // EMOJI_FILE[ch] 或 undefined
  /** 參數同 txt()。有對照圖就畫 <image>（x/y 讀寫的是中心點），沒有就回傳 txt()。 */
  export function emojiAt(x, y, ch, attrs = {}, parent = svg) {}
  ```

  實作照 spec 5.1：`size = round((font-size || 40) * 1.15)`；中心點存在 `dataset.cx/cy`；覆寫實例的 `getAttribute`/`setAttribute`；`class` 預設 `svgtxt`；`style` 原樣帶過去；`error` 時把 `href` 換成文字 emoji 的 `data:image/svg+xml` URI。現有 `drawEmoji` 不動。
- 修改 `src/content/catalog.js`：g1a 學期包加 `assets: packEmojiAssets()`。
- 修改 `vite.config.js`：`globPatterns` 加 `'ui/*.svg'`。
- 修改 `src/content/credits.json`：Fluent Emoji 的 `usage` 補上新檔名對照（`car ← Automobile`、`rabbit-face ← Rabbit face`、`mascot ← Bear`、`medal-gold ← 1st place medal`…）。

**測試（新增 `tests/unit/emoji.test.js`、`tests/unit/assets.test.js`）：**

- [ ] `EMOJI_FILE`、`EXAM_THEME_FILES` 每個檔名在 `public/emoji/` 都有檔案；`UI_FILES` 在 `public/ui/` 都有。
- [ ] g1a 的 `assets` 包含所有 `EMOJI_FILE` 值與 `EXAM_THEME_FILES`。
- [ ] `public/emoji` + `public/ui` 總大小 < 1 MB。
- [ ] `emojiAt` 呼叫期間 `Math.random` 被呼叫 0 次（`vi.spyOn`）。
- [ ] `emojiAt(100, 50, '🍎', {'font-size': 40})`：回傳 `<image>`；`getAttribute('x') === '100'`；DOM 實際 `x` 是 `100 - 23`；`setAttribute('x', 130)` 後讀回 `'130'`。
- [ ] 對照表沒有的字元（例如 `'①'`）回傳 `<text>`，和 `txt()` 一樣。
- [ ] 既有 `credits.test.js`、`privacy.test.js` 通過。
- [ ] e2e `offline.spec.js`：下載教材後離線，`emoji/rabbit-face.svg` 與 `ui/mascot.svg` 都能從快取讀到（擴充既有測試）。

**驗證：** `npm test`、`npm run lint`、`npm run e2e`（對照測試應不受影響）。

**Commit：** `feat: Fluent emoji assets and emojiAt image helper`

---

## T2：g1a 動畫升級（不破壞對照測試）

**目標：** 依 spec 5.2 升級畫面。所有改動都是「換畫法、加裝飾」，字幕、亂數、時序完全不變。

**檔案：**

- `src/content/math/g1a/{addsub,numbers,length,split,num30time,shapes}.js`：
  - 「整個字串就是一個 emoji」的 `txt(` 換成 `emojiAt(`（spec 5.1 範圍；研究報告第 2 節第 1 項列出的呼叫點）。
  - `length.js` `bug()` 改用 lady-beetle 圖，藍藍加 `filter: hue-rotate()`；`walk()` 不動。
  - 數數徽章（`a_tagCount`、`c_num`、`c_countObjs`、`countDots`）：多畫一個 `<circle>`，物件加 `.hop`。
  - `c_flyAway` 加 `.flap`；`c_tapEat` 冒碎屑（固定角度陣列）；`c_cross`、`subPic` 被劃掉的物件加 `.gone`（灰階）。
  - 地面、盤子、口訣卡、立體積木加厚度與陰影（只用 `el()`）。
  - 火車輪子加放射線與 `.spin`；時鐘外框、刻度、指針圓點。
- `src/engine/svg.js`：`tween(dur, fn, id, ease = easeInOutQuad)`；新增 `EASE = { outBounce, inBack, outBack }`。只在掉落、飛走、排隊等呼叫點明確傳入。back 類緩動不用在 opacity 或 strokeDashoffset。`markShape` 產生的元素加 `.draw`。
- 新增 `src/engine/rng.js`：

  ```js
  export function mulberry32(seed) {}         // 回傳 () => [0,1)
  export function withSeed(seed, fn) {}       // 暫時替換 Math.random，finally 還原；回傳 fn() 的結果
  ```

  T2 只用 `mulberry32`（紙花）；`withSeed` 給 T3。
- 新增 `src/engine/mascot.js`：`mountMascot()` 在 `#sub` 旁放 `<img id="mascot" src=uiUrl('mascot')>`，`pointer-events:none`；監聽 `lesson:say`（說話動畫）、`lesson:answer`（`detail.ok` 為 true 跳、false 歪頭；考試時 T3 改送 `detail.neutral`）。
- 新增 `src/engine/fx.js`：`confetti(container, { seed })` 用 CSS 動畫產生約 24 片紙花，位置用 `mulberry32`；`starBurst()`。全部不回傳 Promise 給呼叫端等待。
- `src/engine/speech.js`：`say()` 開始與結束時 `dispatchEvent(new CustomEvent('lesson:say', …))`。
- `src/engine/practice.js`：
  - `check()`：在 `playSfx` 後呼叫 `confetti()`（答對）或給答錯記號加 `.shake`，並送出 `lesson:answer`。不加 `await`、不加按鈕。
  - `practiceEnd()`：⭐/☆ 改用 `emojiAt` 等級的圖片（☆ 用同一張加 `.dim`），依序 `animation-delay` 彈出；分數文字 count-up（改 textContent，不動字幕）。
- `src/engine/lesson.js`：`openUnit`、`openReview` 設 `#stage[data-theme]`（依單元 key 對照）與 `data-mode="lesson"`；`practice.js` 的 `startPractice` 設 `data-mode="practice"`。
- `src/styles/app.css`：新 `.pop` 曲線、`.bob`、`.hop`、`.flap`、`.spin`、`.gone`、`.dim`、`.draw`、`.shake`、紙花、吉祥物、`#stage[data-theme=…]` 背景（漸層＋inline SVG pattern，不另外放圖檔）、練習與考試時關掉 `.bob`、`@media (prefers-reduced-motion: reduce)`。
- `index.html`：字幕列旁加吉祥物容器（新 id `mascotBox`，不改既有 id）。

**做法：一次改一個檔案，改完就跑該檔案相關單元的對照測試**，例如：

```bash
npx playwright test tests/e2e/parity.spec.js -g "unit add|unit sub"
```

全部改完再跑完整 `npm run e2e`（兩個 project）。

**測試：**

- [ ] 新增 `tests/unit/rng.test.js`：同種子序列相同；`withSeed` 結束後 `Math.random` 還原（含 fn 丟錯時）。
- [ ] 新增 `tests/unit/fx.test.js`：`confetti()` 期間 `Math.random` 0 次。
- [ ] 新增 `tests/unit/svg.test.js`：`tween` 不傳 ease 時進度曲線與原本相同。
- [ ] 對照測試 12 個單元＋2 個總複習，chromium 與 iPad 全綠。
- [ ] 手動在 iPad 尺寸看過每個單元至少一個場景（`npm run dev` 或 run skill 截圖），確認圖片位置、數字標籤、劃叉沒有偏移。

**驗證：** `npm test`、`npm run lint`、`npm run e2e`。

**Commit：** `feat: livelier g1a animations with Fluent images, mascot and themes`

---

## T3：考試引擎、結果頁與錯題重看

**目標：** 用現有題型就能跑完一份期中、期末考。練習引擎只加分支；不開考試時行為完全不變。

**檔案：**

- 新增 `src/engine/paper.js`：

  ```js
  /** 檢查藍圖：zones 的 slots 加總必須是 20，每個 slot 至少一個題型。不合法就丟錯誤。 */
  export function validateBlueprint(bp, gen) {}
  /** 依藍圖出卷：每個 slot 挑一個題型、區內打亂、每題配 32 位元種子。 */
  export function buildPaper(bp, rand = Math.random) {}   // → [{ type, seed, zone }] × 20
  ```

  同一份考卷中，同一題型盡量只出現一次：挑 slot 題型時，先排除已經挑過的；全部挑過才允許重複。
- 修改 `src/engine/practice.js`（只加分支）：
  - 抽出 `export function judge(item, marks)`，回傳 boolean，邏輯和現在 `check()` 裡算 `ok` 的那段完全相同。
  - `nextItem()`：有 `P.cfg.exam` 時，把「`GEN[type]()` + `draw()`」包進 `withSeed(P.cfg.exam.paper[P.i].seed, …)`；沒有時原樣執行。
  - 考試模式：每題加「🔊 再聽一次」；`#score` 清空；pick／num／pair／match 點選後只標記為選中，出現 `✔ 好了`（id `examOk`）才 `check()`；dual／classify 的「檢查答案」文字改「✔ 好了」。
  - `check()` 考試分支：`item.done = true` → `judge()` → `P.cfg.exam.onAnswered({ n, type, seed, zone, given: {...marks}, ok })` → 播 `tap` 音效 → 送出 `lesson:answer`（`detail.neutral = true`）→ 字幕「收到！」→ 固定 900 ms 後 `P.i++` 進下一題。不畫正解、不說稱讚語、不播講解。
  - 題目做完：有 `P.cfg.exam` 時呼叫 `P.cfg.exam.onEnd()`，不呼叫 `practiceEnd()`。
  - 新增 `export async function reviewExamItem(entry, id)`：照 spec 6.5 重畫題目、灰色畫孩子的答案、綠色畫正解、說明字幕、`await item.explain(id)`。
  - `window.__T.answer()` 在考試模式直接送出（跳過 `✔ 好了`）。
- 新增 `src/engine/exam.js`：

  ```js
  /** cfg: { id, title, blueprint, theme }。出卷後呼叫 startPractice({ …, exam }) */
  export function startExam(cfg) {}
  export function examState() {}   // 給 __T.exam：{ i, total, phase, score, wrong }
  ```

  內容：交卷確認畫面（「要交卷了嗎？」＋「✔ 交卷」）、結果頁三幕（spec 6.8）、錯題卡片（HTML 面板 `#examResult`，放在 `#stage` 內，可捲動，卡片 ≥ 88px）、看完打勾與貼紙、底部「🔁 練習這些題型」「📝 再考一次」「🏠 回首頁」、`hooks.onResult(id, stars)`（100 分 3 顆、≥ 80 分 2 顆、其他 1 顆）。這一版先用簡單的題號進度與「收到！」，開場動畫與地圖在 T4 加。
- 修改 `src/engine/lesson.js`：`openUnit(u)` 遇到 `u.blueprint` 時走 `openExam(u)`，和 `openReview` 一樣先等 `#startOv` 解鎖語音；`closeLesson()` 也要清掉考試畫面。
- 修改 `src/content/catalog.js`：g1a 加 `exams`（spec 6.1）；`findUnit()` 也搜尋 `pack.exams`。`terms` 與章節 `term` 欄位留到 T4。
- 新增 `src/content/math/g1a/exam.js`：`MID_BLUEPRINT`、`FINAL_BLUEPRINT`。**這一版的 slot 只放現有題型**（spec 6.6 表格去掉 `ex*`；只剩 `ex*` 的 slot 暫時用同章其他題型代替），T4 再換成完整版。
- 修改 `src/content/math/g1a/index.js`：匯出 `exams: { 'exam-mid': { blueprint: MID_BLUEPRINT }, 'exam-final': { blueprint: FINAL_BLUEPRINT } }`。
- 修改 `src/main.js`：`const body = bodies[key] || reviews[key] || exams?.[key]`。
- `src/styles/app.css`：考試選中狀態（放大＋外框）、`#examOk`、`#examResult`、錯題卡、成績獎牌。

**測試：**

- [ ] 新增 `tests/unit/paper.test.js`：一定 20 題；每區題數等於 slot 數；題型都來自對應 slot；種子是 0～2³²−1 的整數；兩個不同 `rand` 出的考卷不同；`validateBlueprint` 對 19 題或空 slot 丟錯誤。
- [ ] 新增 `tests/unit/exam-seed.test.js`（jsdom，匯入 g1a `index.js` 登記題型）：兩份藍圖用到的每個題型，同一個種子建兩次，`prompt`、`JSON.stringify(answer)`、`#svg` 的 `innerHTML` 都相同。
- [ ] 新增 `tests/unit/judge.test.js`：各模式的對錯判斷（num、pick、pair、dual、classify、match）。
- [ ] 擴充 `tests/unit/catalog.test.js`：考試 ID 是 `G1A-M-exam-mid`、`G1A-M-exam-final`；所有 ID（含 exams）不重複；`findUnit(pack, 'exam-mid')` 找得到。
- [ ] 新增 `tests/e2e/exam.spec.js`：
  1. 打開 `#/g1/math/a/exam-mid`，點 `#startBtn`。
  2. 迴圈 20 次：等 `__T.exam.phase === 'question'`，呼叫 `__T.answer(i % 3 !== 0)`。每題送出後檢查：`#sub` 是「收到！」；`#svg` 裡沒有 `stroke="#2bb673"` 或 `fill="#2bb673"` 的元素；`#score` 是空字串；答對與答錯時的 `#sub` 相同。
  3. 交卷確認後，`#examResult` 的分數 = 答對題數 × 5；錯題卡數量 = 答錯題數。
  4. 點第一張錯題卡：`#svg` 出現綠色正解，`#sub` 文字改變（講解在播）；按「回到成績單」回到 `#examResult`，那張卡打勾。
  5. 期末考跑一次相同流程（可以全部答對，檢查 100 分且沒有錯題卡）。
- [ ] 對照測試全綠（證明練習沒被改到）。

**驗證：** `npm test`、`npm run lint`、`npm run e2e`。

**Commit：** `feat: exam mode with deferred feedback, score page and wrong-item review`

---

## T4：新考試題型、開場動畫與主題、學期畫面分組

**目標：** 考卷題型補齊 spec 6.6 的完整藍圖；加上冒險地圖、每題開場、休息站、收集物；學期畫面依期中、期末分組。

**檔案：**

- 修改 `src/content/math/g1a/exam.js`：
  - 新增 `EXAM_TYPES`，14 個題型（spec 6.6 表格）。介面 `{ mode: 'pick'|'num', prompt, answer, max?, draw(), fill?, explain(id) }`；畫物件用 `emojiAt()`；角色用動物；文字全部原創。
  - `exAddWord`、`exSubWord` 共用一個文字題引擎 `wordProblem(op)`。
  - `exTimPickClock`、`exTimDaily` 共用鐘面繪製，可從 `num30time.js` 匯出既有的 `d_clock` 使用（只加 `export`，不改函式內容）。
  - `MID_BLUEPRINT`、`FINAL_BLUEPRINT` 換成 spec 6.6 完整版；每區加 `name`、`icon`（主題圖檔名）、`collect`（收集物 emoji）。
- 修改 `src/content/math/g1a/index.js`：`registerTypes(EXAM_TYPES)`，放在既有題型登記之後。**不加進任何 `practice` 陣列。**
- 修改 `src/engine/exam.js`：
  - 考試封面：地圖動畫（SVG 路徑＋20 站），標題「森林探險」或「遊樂園探險」。
  - `#crumb` 考試時畫成 20 站，吉祥物站在目前這一站。
  - 每題開場 `#examIntro`：主題圖彈入、「第 N 站」、吉祥物跳一下，≤ 1.2 秒，點一下略過；播完才呼叫出題。需要在 `practice.js` 加一個考試專用的 `await P.cfg.exam.beforeItem?.(n, id)` 掛鉤（只在考試分支內）。
  - 休息站：每區結束顯示「○○完成！」與收集到的小物，按「繼續 ▶」。
  - 收集物：每題送出後該區小物飛進角落背包（不論對錯）。
  - 中性回饋動作依 `n % 3` 挑選。
  - `prefers-reduced-motion` 時只淡入。
- 修改 `src/content/catalog.js`：章節加 `term`，學期包加 `terms`（spec 6.1）；「🏆 學習加油讚」歸 `final`。
- 修改 `src/platform/views/semester.js`：有 `terms` 時依 `term` 分組，每組標題「📝 期中考範圍・第一～五章」，組尾放考試卡（`unit exam` class，圖示 📝，顯示星星）。沒有 `terms` 的學期包照舊。
- 修改 `src/content/catalog.js` 的 `parentGuide.reminders`：加一條考試說明（作答時不會顯示對錯、交卷後一起看錯題、分數只存在這台裝置）。
- `src/styles/app.css`：分組標題、考試卡、地圖、開場、休息站、背包。

**測試：**

- [ ] 新增 `tests/unit/exam-types.test.js`：每個 `ex*` 題型跑 200 個種子（用 `withSeed`）：`mode` 是 pick 或 num；pick 題 `0 ≤ answer < draw() 回傳的區域數`；num 題 `0 ≤ answer ≤ (max ?? 10)`；選項不重複（比對區域內容）；`prompt` 非空；`explain` 是函式；`Math.random` 以外沒有用到 `Date.now()` 之類的不確定來源。
- [ ] 擴充 `tests/unit/exam-seed.test.js`：涵蓋所有 `ex*` 題型。
- [ ] 擴充 `tests/unit/paper.test.js`：完整藍圖驗證通過；期中每區 4 題、期末每區 5 題；跑 500 份考卷，藍圖裡每個題型都至少出現過一次。
- [ ] 擴充 `tests/unit/catalog.test.js`：每個章節都有 `term`；`terms[].exam` 都在 `exams` 裡；第一～五章是 `mid`，其餘是 `final`；既有「順序同舊檔」測試仍通過。
- [ ] 擴充 `tests/unit/wording.test.js`（若它檢查孩子看到的文字）：新題型 prompt 沒有真實人名、沒有出版社名稱。
- [ ] 擴充 `tests/e2e/exam.spec.js`：開場出現 `#examIntro`，點一下會消失；第 4 題後（期中）出現休息站，按「繼續 ▶」接著出題；開啟 reduced-motion 時流程仍能走完。
- [ ] 新增或擴充 `tests/e2e/navigation.spec.js`：學期畫面有「期中考範圍」「期末考範圍」兩個標題與兩張考試卡；點期中考卡進入考試；英文試玩學期畫面沒有分組。
- [ ] 對照測試全綠（新題型登記不影響 `review-all`）。

**驗證：** `npm test`、`npm run lint`、`npm run e2e`。

**Commit：** `feat: exam-style generators, adventure intros and term grouping`

---

## T5：文件、給爸媽說明與最終驗證

**目標：** 文件跟上新功能，並在乾淨狀態下跑完所有驗證。

**檔案：**

- `README.md`：新增「期中考、期末考」段落（範圍、20 題 100 分、作答不顯示對錯、錯題重看）；「素材來源」段落補上 `public/ui/` 與 `scripts/fetch-fluent.mjs` 的用途。
- `docs/curriculum/g1a-math.md`（若存在）：補上期中、期末範圍與考試題型對照。
- `src/content/credits.json`：最後檢查 usage 是否列出所有新檔名。
- 致謝頁（`src/platform/views/credits.js`）：確認新素材顯示正確，不需要改程式就不改。
- `docs/superpowers/specs/2026-11-16-animation-and-exams-design.md`：狀態改為「已實作」，並記下和設計不同的地方（如果有）。

**檢查清單：**

- [ ] `npm test` 全綠（含隱私、credits、素材大小）。
- [ ] `npm run lint` 無錯誤。
- [ ] `npm run e2e` 全綠，對照測試沒有被略過（`private/golden/` 存在）。
- [ ] `MSYS_NO_PATHCONV=1 BASE_PATH=/elementary-school/ npm run build` 成功；用 `npx vite preview --base /elementary-school/` 打開，圖片與考試都正常。
- [ ] `git status` 確認 `private/` 沒有被追蹤，也沒有分數或作答紀錄檔。
- [ ] 新增素材總大小（`du -ch public/emoji public/ui`）記在 commit 訊息裡。

**Commit：** `docs: exams and animation upgrade in README and parent guide`
