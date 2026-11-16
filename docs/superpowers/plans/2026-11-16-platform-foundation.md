# 小學教學平台：第一階段「平台地基」實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 把單檔的 `index.html` 改成可擴充的多檔平台，現有 12 個單元與 2 個總複習的行為不變。平台要能部署到 GitHub Pages、支援離線安裝，並加上範本機制與一個英文示範單元。

**Architecture：**
- 原生 JavaScript ES modules，用 Vite 打包。
- `engine/` 是從舊檔抽出的播放與練習引擎；`platform/` 負責路由、進度、首頁；`content/` 放教材包，每個「學期包」是一個延遲載入的程式區塊（chunk）。
- 正確性靠「對照測試」保證：用 Playwright 讓舊檔與新站跑同一套固定亂數與假時鐘，比對每個場景的字幕序列。

**Tech Stack：** Vite 6、Vitest 3（jsdom）、Playwright、ESLint 9、vite-plugin-pwa、open-props、@tabler/icons、Microsoft Fluent Emoji（複製 SVG）、Kenney 音效（CC0）、Google Fonts 粉圓（Huninn）。

**Spec：** `docs/superpowers/specs/2026-11-16-platform-foundation-design.md`

## Global Constraints

- 不使用 React、Vue 等前端框架；不引入 Tailwind。
- 現有單元的手繪 SVG 場景不換成套件素材，行為必須和舊檔一致（只允許 Task 5 列出的文字修改）。
- 以下 DOM id 必須保留，對照測試與既有程式都依賴它們：`#svg`、`#sub`、`#bar`、`#nav`、`#prev`、`#replay`、`#next`、`#crumb`、`#stTxt`、`#score`、`#startOv`、`#startBtn`、`#mute`、`#homeBtn`。
- 網址一律用 `#` 開頭的路徑，例如 `#/g1/math/a/num10`。
- 課綱代碼只出現在資料與「給爸媽」區，不出現在孩子的畫面上。
- 進度只存在瀏覽器；不蒐集任何資料，不放分析工具，不呼叫第三方 API（Google Fonts 除外）。
- 程式碼授權 MIT；素材各自保留原授權，並登記在 `src/content/credits.json`。
- 不得使用 NC、ND 授權素材；不得使用 unDraw、LottieFiles 動畫、PhET 原始碼。
- 公開檔案中不得出現：「個人弱點標籤」、「個人弱點註記」、「原本的使用者」、`weak:true`、`weak:`。考卷檔案只能放在 `private/`（已列入 `.gitignore`）。
- 單元固定 ID 格式為 `G1A-M-<舊 key>`（例如 `G1A-M-num10`），一旦提交就不再更改。

## Review Focus

1. **`localStorage` 不能用或資料損毀**（無痕模式、使用者手動改壞）→ 網站照常運作，改用記憶體暫存，不出現空白頁。測試在 Task 6。
2. **匯入錯誤的檔案**（別的 JSON、空檔、舊版格式）→ 顯示「這不是進度檔」，現有進度不變。測試在 Task 6、Task 7。
3. **網址指向不存在的年級或單元**（打錯字、舊書籤）→ 回到首頁，不出現空白頁。測試在 Task 3。
4. **裝置沒有英文或中文語音** → 只顯示字幕並等待一段時間，流程不會卡住。測試在 Task 8。
5. **動畫播到一半就離開單元**（按上一頁、改網址）→ 動畫和語音立即停止，畫布清空，不會殘留在下一個畫面。測試在 Task 7。

---

## 檔案結構

```
index.html                     App 外殼（保留舊 DOM id）
vite.config.js                 base 路徑、PWA 設定
eslint.config.js               no-undef 等規則，用來抓搬移漏掉的 import
src/
  main.js                      啟動：載入狀態、掛路由
  styles/tokens.css            顏色與尺寸變數（引用 open-props）
  styles/app.css               從舊檔搬來的樣式，改用變數
  engine/
    state.js                   共用可變狀態 S 與 ABORT
    util.js                    rand、ri、pick、shuffle、distinct、顏色常數
    speech.js                  語音、字幕、wait、chk
    sfx.js                     音效
    svg.js                     el、txt、clear、markShape、paren、tween
    ui.js                      底部按鈕列：clearBar、button、askChoice
    lesson.js                  場景播放器
    practice.js                練習引擎與題型登記表
    emoji.js                   Fluent Emoji 繪製
  templates/
    choice.js  listen.js  match.js  explainer.js
  platform/
    router.js                  解析與產生網址
    storage.js                 進度、孩子檔案、匯出匯入、下一個單元
    views/home.js  views/grade.js  views/semester.js  views/credits.js  views/profiles.js
    offline.js                 「下載教材」按鈕
  content/
    catalog.js                 全站目錄（只有中繼資料）
    credits.json               素材授權清單
    math/g1a/                  一上數學學期包（index.js + 依舊檔分段的模組）
    english/g1-demo/index.js   英文示範單元
public/
  emoji/*.svg                  用到的 Fluent Emoji
  sfx/*.mp3                    Kenney 音效（轉成 mp3）
  icons/                       PWA 圖示
tests/
  unit/*.test.js               Vitest
  e2e/*.spec.js                Playwright
  e2e/helpers/harness.js       假時鐘、固定亂數、移除語音
private/                       不進 Git：舊檔、對照基準、考卷
docs/curriculum/g1a-math.md    課綱文件（由舊的 小一上數學課綱.md 改寫）
.github/workflows/deploy.yml
LICENSE  README.md
```

---

### Task 1：建立儲存庫，並先清除個人資訊

**Files:**
- Create: `.gitignore`、`package.json`、`vite.config.js`、`vitest.config.js`、`playwright.config.js`、`eslint.config.js`、`LICENSE`、`tests/unit/privacy.test.js`
- Move: `index.html` → `private/legacy-index.html`（不進 Git）
- Move + 改寫：`小一上數學課綱.md` → `docs/curriculum/g1a-math.md`
- Modify: `docs/superpowers/specs/2026-11-16-platform-foundation-design.md`

**Interfaces:**
- Produces：npm scripts `dev`、`build`、`preview`、`test`（vitest run）、`e2e`（playwright test）、`lint`（eslint src tests）。
- Produces：`private/legacy-index.html`，Task 2 的對照測試用它當基準。

- [ ] **Step 1：`git init -b main`，建立 `.gitignore`**

內容至少包含：`node_modules/`、`dist/`、`private/`、`test-results/`、`playwright-report/`。

- [ ] **Step 2：把舊檔移到 `private/legacy-index.html`**

- [ ] **Step 3：改寫課綱文件，移到 `docs/curriculum/g1a-math.md`**

刪除「⚠️ 個人弱點註記」那一行。「網站」欄裡的「考卷」字樣也一併改掉。其餘內容保留。

- [ ] **Step 4：改寫設計文件中提到家人的句子**

第 1 節「給原本的使用者用」改成「給一年級學生用的原型」；5.6 節「舊版的使用者只有原本的使用者」改成「舊版只在少數裝置上使用過」；5.11 節「孩子的考卷」改成「學生的考卷」。5.9 節的「『個人弱點標籤』標籤」改成「個人化的弱點標籤」，「個人弱點註記」改成「個人弱點註記」。改完後設計文件不能含有 Global Constraints 列出的任何禁用字。

- [ ] **Step 5：安裝開發工具**

```bash
npm init -y
npm i -D vite@6 vitest@3 jsdom @playwright/test eslint@9 @eslint/js globals
npx playwright install chromium
```

`vitest.config.js` 用 `environment: 'jsdom'`，只收 `tests/unit/**`。`playwright.config.js` 的 `webServer` 跑 `npm run build && npm run preview -- --port 4173`，`baseURL` 為 `http://localhost:4173`，只用 chromium，並另設一個平板尺寸的 project（`devices['iPad (gen 7)']`，引擎仍用 chromium）。`eslint.config.js` 對 `src/**` 開啟 `no-undef`、`no-unused-vars`（warn），globals 用 browser。

- [ ] **Step 6：寫隱私檢查測試 `tests/unit/privacy.test.js`**

```js
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const FORBIDDEN = ['個人弱點標籤', '個人弱點註記', '原本的使用者', 'weak:true', 'weak:'];
test('公開檔案沒有個人資訊', () => {
  const files = execSync('git ls-files --cached --others --exclude-standard').toString().trim().split('\n').filter(Boolean);
  const hits = files.flatMap(f => {
    if (f === 'tests/unit/privacy.test.js' || f.startsWith('docs/superpowers/plans/')) return [];
    const t = readFileSync(f, 'utf8');
    return FORBIDDEN.filter(w => t.includes(w)).map(w => `${f}: ${w}`);
  });
  expect(hits).toEqual([]);
});
test('private/ 不會被追蹤', () => {
  expect(execSync('git check-ignore private/legacy-index.html').toString().trim()).toBe('private/legacy-index.html');
});
```

- [ ] **Step 7：執行 `npm test`，預期 PASS**

如果失敗，代表還有檔案含禁用字，回頭清除，不要改測試。

- [ ] **Step 8：建立 `LICENSE`（MIT，著作權人寫 `elementary-school contributors`），第一次提交**

```bash
git add -A && git status   # 確認清單裡沒有 private/ 與舊 index.html
git commit -m "chore: bootstrap repo with scrubbed docs"
```

---

### Task 2：建立舊檔的對照測試工具

**Files:**
- Create: `tests/e2e/helpers/harness.js`、`tests/e2e/legacy-baseline.spec.js`

**Interfaces:**
- Produces：
  - `prepare(page, { seed = 42 }): Promise<void>`：注入固定亂數、移除語音、安裝假時鐘。
  - `recordScene(page, { maxMs = 120000 }): Promise<string[]>`：記錄目前場景的字幕序列，直到場景結束。
  - `recordPractice(page, { pattern = [true, false] }): Promise<string[]>`：用 `window.__T.answer()` 依 pattern 作答到結果頁，記錄字幕。
  - `TEXT_CHANGES: Array<[string, string]>`：允許的文字差異，Task 5 填入。
  - `normalize(lines: string[]): string[]`：套用 `TEXT_CHANGES`。
  - 基準檔：`private/golden/<unitKey>.json`，格式為 `{ scenes: string[][], practice: string[] }`。

- [ ] **Step 1：實作 `prepare`**

用 `page.addInitScript` 注入：
- mulberry32 亂數，以 `seed` 取代 `Math.random`。
- `delete Window.prototype.speechSynthesis; delete window.speechSynthesis;`，讓 `'speechSynthesis' in window` 為 false。舊程式會改走「只顯示字幕、等待一段時間」的路徑。
- `window.Audio = class { play() { return Promise.resolve(); } };`，避免新站的音效干擾。

最後呼叫 `await page.clock.install()`。這個假時鐘同時控制 `setTimeout`、`setInterval`、`requestAnimationFrame`、`performance.now`。

- [ ] **Step 2：實作 `recordScene`**

用迴圈每次 `await page.clock.runFor(250)`。`#sub` 文字有變化就記錄下來。`#bar` 出現按鈕時點第一顆，這樣「綁成一捆」「🪄 幫我拉直」這類互動都能自動往下走。

場景結束的判斷：`#next` 有 `pulse` class，或 `#bar` 出現文字開頭為「✏️ 開始練習」的按鈕。超過 `maxMs` 就丟出錯誤，錯誤訊息要包含最後一句字幕。

- [ ] **Step 3：寫 `tests/e2e/legacy-baseline.spec.js`**

用 `file://` 開啟 `private/legacy-index.html`。對 `CHAPTERS` 裡的每個單元：點擊名稱相符的 `.unit` 卡片 → 點 `#startBtn` → 逐一記錄每個場景（場景之間點 `#next`）→ 點「開始練習」→ `recordPractice`。兩個總複習則點 review 卡片後直接 `recordPractice`。結果寫進 `private/golden/<key>.json`。

這個 spec 只在設定 `LEGACY=1` 時執行（`test.skip(!process.env.LEGACY)`），因為 CI 上沒有 `private/`。

- [ ] **Step 4：執行並確認基準完整**

Run：`LEGACY=1 npx playwright test legacy-baseline --project=chromium`
Expected：PASS；`private/golden/` 有 14 個檔案，每個場景至少有 1 句字幕。

如果某個場景卡住（例如需要點 SVG 物件，而不是按鈕），在 `recordScene` 增加一條規則：`#bar` 沒有按鈕超過 3 秒時，點擊 SVG 中有 `blink` 或 `pulse` class 的第一個元素。

- [ ] **Step 5：提交**

```bash
git add tests/e2e && git commit -m "test: legacy parity harness"
```

---

### Task 3：目錄、路由與 App 外殼

**Files:**
- Create: `src/content/catalog.js`、`src/platform/router.js`、`src/main.js`、`index.html`、`tests/unit/router.test.js`、`tests/unit/catalog.test.js`

**Interfaces:**
- Produces：`catalog.js`

```js
export const SUBJECTS = { math: { name: '數學', icon: '🔢' }, english: { name: '英文', icon: '🔤' }, science: { name: '自然', icon: '🔬' } };
export const PACKS = [ /* Pack */ ];
// Pack = { id: 'g1a-math', grade: 1, subject: 'math', semester: 'a', label: '上學期',
//          trial?: boolean, load: () => import('./math/g1a/index.js'),
//          chapters: [{ name, units: [unitKey], review?: reviewKey }],
//          units: [UnitMeta], reviews: [ReviewMeta] }
// UnitMeta = { id: 'G1A-M-num10', key: 'num10', icon, name, desc, curriculum: ['N-1-1'],
//              versions: { hanlin: '一、10 以內的數' }, prereqs: [], lang: 'zh-TW', tip, task }
// ReviewMeta = { id: 'G1A-M-review-length', key: 'review-length', title, desc }
export function findPack(grade, subject, semester): Pack | undefined
export function findUnit(pack, key): UnitMeta | ReviewMeta | undefined
export function allUnits(): Array<{ pack, unit }>
```

- Produces：`router.js`

```js
// Route = { view: 'home' } | { view: 'grade', grade } | { view: 'semester', grade, subject, semester }
//       | { view: 'unit', grade, subject, semester, key } | { view: 'credits' } | { view: 'profiles' }
export function parseRoute(hash: string): Route
export function formatRoute(route: Route): string
export function onRoute(handler: (route: Route) => void): void   // 監聽 hashchange，啟動時先呼叫一次
export function navigate(route: Route): void
```

- [ ] **Step 1：寫 `tests/unit/router.test.js`**

```js
test.each([
  ['', { view: 'home' }], ['#/', { view: 'home' }],
  ['#/g1', { view: 'grade', grade: 1 }],
  ['#/g1/math/a', { view: 'semester', grade: 1, subject: 'math', semester: 'a' }],
  ['#/g1/math/a/num10', { view: 'unit', grade: 1, subject: 'math', semester: 'a', key: 'num10' }],
  ['#/credits', { view: 'credits' }], ['#/profiles', { view: 'profiles' }],
])('parseRoute(%s)', (h, r) => expect(parseRoute(h)).toEqual(r));
test('來回轉換一致', () => { const r = { view: 'unit', grade: 1, subject: 'math', semester: 'a', key: 'curve' }; expect(parseRoute(formatRoute(r))).toEqual(r); });
test.each(['#/g9', '#/g1/art/a', '#/g1/math/z/num10', '#/g1/math/a/nope', '#/%%%', '#/g1/math/a/num10/extra'])
  ('不存在的網址回首頁：%s', h => expect(parseRoute(h)).toEqual({ view: 'home' }));
```

`parseRoute` 要用 `catalog` 檢查年級、科目、學期、單元是否真的存在。最後一組 case 對應 Review Focus 第 3 項。

- [ ] **Step 2：寫 `tests/unit/catalog.test.js`**

- 所有 `id` 不重複，而且符合 `/^G\dA?-[MES]-[\w-]+$/`。
- 每個 `chapters[].units` 和 `review` 都找得到對應的 `UnitMeta` 或 `ReviewMeta`。
- g1a-math 有 12 個單元與 2 個總複習，順序和舊檔的 `CHAPTERS` 相同：num10、line、curve、thick、align、order、split、shape、add、sub、num30、time。

- [ ] **Step 3：執行測試，預期 FAIL（模組不存在）**

- [ ] **Step 4：實作 `catalog.js` 的 g1a-math 項目**

`icon`、`name`、`desc`、`tip`、`task`、`chapters` 從 `private/legacy-index.html` 的單元物件與 `CHAPTERS` 照抄。`curriculum` 與 `versions.hanlin` 依 `docs/curriculum/g1a-math.md` 的表格填寫。`load` 先指向一個暫時的空模組，Task 4 再換成真的學期包。

- [ ] **Step 5：實作 `router.js`，以及 `index.html` 與 `main.js` 外殼**

`index.html` 沿用舊檔的 `<header>`、`#home`、`#lesson` 結構與所有 DOM id。`main.js` 依路由顯示 `#home` 或 `#lesson`；首頁先用最簡單的清單列出 g1a 單元連結即可，Task 7 再做正式設計。

- [ ] **Step 6：執行 `npm test`，預期 PASS；提交**

```bash
git commit -am "feat: catalog, hash router and app shell"
```

---

### Task 4：抽出引擎，搬移一上數學學期包

這是最大的一個任務。原則是「搬移，不改寫」：每段程式盡量原樣複製，只補上 `import`／`export`，並把全域變數改成模組變數。

**Files:**
- Create: `src/engine/{state,util,speech,svg,ui,lesson,practice}.js`
- Create: `src/content/math/g1a/index.js`，以及依舊檔分段標記切出的模組：
  - `length.js`：舊檔第 138–195 行的長度繪圖工具、`dragStraighten`、`rowsStraighten`、`thickGen`，以及 line、curve、thick、align 四個單元與第 445 行的第一組 `GEN`
  - `split.js`：第 357–440 行與第 519 行起的 `GEN`
  - `numbers.js`：`module a_numbers.js` 段
  - `shapes.js`：`module b_shapes.js` 段
  - `addsub.js`：`module c_addsub.js` 段
  - `num30time.js`：`module d_num30_time.js` 段
- Create: `tests/e2e/parity.spec.js`
- Modify: `src/content/catalog.js`（`load` 改指向 `./math/g1a/index.js`）

**Interfaces:**
- Produces：`engine/state.js`

```js
export const ABORT = {};
export const S = { runId: 0, muted: false, sfxMuted: false, unlocked: false };
```

舊程式裡所有直接讀寫 `runId`、`muted`、`unlocked` 的地方，都改成 `S.runId`、`S.muted`、`S.unlocked`。

- Produces：`engine/practice.js`

```js
export const GEN = {};                                   // 題型登記表：key → () => Item
export function registerTypes(types: Record<string, () => Item>): void   // key 重複時丟錯誤
export function startPractice(cfg: { title, types?, count?, queue?, unitId?: string }): void
export function setPracticeHooks(h: { onResult(unitId: string, stars: 0|1|2|3): void, goHome(): void }): void
// Item 的格式維持舊檔：{ mode: 'pick'|'num'|'pair'|'dual'|'classify'|'match', prompt, answer,
//   draw(): Region[], explain(id), fill?, isOk?, moves?, max?,
//   hints?: string[], boost?: Scene[], rationale?: string }   // 最後三個是預留欄位
```

舊的 `cfg.unitKey` 改名為 `cfg.unitId`，存的是固定 ID。結果頁原本直接呼叫 `saveStars`，改成呼叫 `hooks.onResult`；「回首頁」改成呼叫 `hooks.goHome`。

- Produces：`engine/lesson.js`

```js
export function openUnit(unit: { id, icon, name, scenes, practice, count }): void
export function closeLesson(): void   // runId++、stopSpeech、clear、clearBar
export function unlockAudio(): void    // 原本 #startBtn 的處理
```

- Produces：學期包 `content/math/g1a/index.js`

```js
export default {
  bodies: { num10: { scenes, practice, count }, line: {...}, /* 12 個 */ },
  reviews: { 'review-length': { queue: () => string[] }, 'review-all': { queue: () => string[] } },
};
```

匯入這個模組時，順便對所有題型呼叫 `registerTypes`。`icon`、`name` 等中繼資料只放在 catalog，單元打開時用 `{ ...meta, ...body }` 合併。

`review-all` 原本用 `UNITS.flatMap(u => u.practice)` 取得題型，改成用 `bodies` 的 `practice` 合併，結果要和舊檔相同。

- Produces：`window.__T` 測試入口，由 `engine/practice.js` 掛上，行為和舊檔相同。

- [ ] **Step 1：寫 `tests/e2e/parity.spec.js`**

對每個單元：`prepare(page)` → 前往 `#/g1/math/a/<key>` → 點 `#startBtn` → 依序 `recordScene` → 練習 `recordPractice`。總複習前往 `#/g1/math/a/review-length` 與 `#/g1/math/a/review-all`。

```js
const golden = JSON.parse(readFileSync(`private/golden/${key}.json`, 'utf8'));
expect(actual.scenes).toEqual(golden.scenes.map(normalize));
expect(actual.practice).toEqual(normalize(golden.practice));
```

沒有 `private/golden/` 時用 `test.skip`。

- [ ] **Step 2：執行 `npx playwright test parity`，預期 FAIL**

- [ ] **Step 3：建立 `engine/` 各模組**

依上面的檔案分工，把舊檔第 107–225 行與第 1337–1414 行搬過去。判斷規則：只被一個學期包使用的繪圖函式放在學期包裡；被引擎或兩個以上的包使用才放進 `engine/`。

- [ ] **Step 4：依分段標記切出學期包的 6 個模組，建立 `index.js`**

- [ ] **Step 5：執行 `npm run lint`，預期沒有 `no-undef` 錯誤**

`no-undef` 錯誤代表某個函式搬了但沒有 import。逐一補上，不要用 `/* global */` 帶過。

- [ ] **Step 6：執行 `npx playwright test parity`，預期 14 個單元與總複習全部 PASS**

不一致時，先檢查亂數呼叫順序有沒有被改變。最常見的原因是搬移時改動了 `shuffle`、`pick` 的呼叫順序，或是在模組載入時多呼叫了一次亂數。

- [ ] **Step 7：提交**

```bash
git commit -am "refactor: split engine and g1a math pack into modules"
```

---

### Task 5：清除介面上的考卷字樣與個人化標籤

**Files:**
- Modify: `src/content/math/g1a/length.js`、`src/content/catalog.js`、`src/platform/views/*`（或目前顯示「給爸媽」的地方）、`tests/e2e/helpers/harness.js`

**Interfaces:**
- Consumes：Task 2 的 `TEXT_CHANGES`。

| 原文 | 改成 |
|---|---|
| 場景標題「考卷會這樣考」 | 「容易搞錯的題目」 |
| 「考卷常常這樣說：是直線的打勾，是曲線的畫圈。」 | 「題目常常這樣說：是直線的打勾，是曲線的畫圈。」 |
| curve 單元 task「沿著考卷上的彎線擺好」 | 「沿著紙上畫的彎線擺好」 |
| 總複習 desc「10 題考卷變形題」 | 「10 題挑戰題」 |
| 「給爸媽」標題「📝 考卷提醒」 | 「📝 作答小提醒」 |
| 首頁說明「依翰林版一上課本順序排列，共 9 章 12 個單元。」 | 「依 108 課綱一年級上學期的主題排列，共 9 章 12 個單元。各版本課本的對照請看「給爸媽」。」 |
| 單元卡上的「個人弱點標籤」標籤，以及 `weak` 欄位 | 刪除 |

- [ ] **Step 1：把前兩列加進 `TEXT_CHANGES`**

- [ ] **Step 2：依表格修改文字**

- [ ] **Step 3：執行 `npx playwright test parity` 與 `npm test`，預期都 PASS**

隱私測試會檢查 `weak:` 已經完全移除。

- [ ] **Step 4：提交**

```bash
git commit -am "chore: remove exam wording and personal tags"
```

---

### Task 6：進度儲存、孩子檔案與匯出匯入

**Files:**
- Create: `src/platform/storage.js`、`tests/unit/storage.test.js`

**Interfaces:**
- Produces：

```js
export const STORAGE_KEY = 'esp:v1';
// State = { version: 1, activeProfile: string,
//   profiles: { [id]: { name, icon, lastUnit: string|null, progress: { [unitId]: { stars: 0|1|2|3, visitedAt: string } } } },
//   settings: { muted: boolean, sfxMuted: boolean } }
export function defaultState(): State                     // 一個預設檔案：{ name: '小朋友', icon: '🐣' }
export function loadState(storage = safeStorage()): State   // 不存在或損毀時回傳 defaultState()
export function saveState(state: State, storage = safeStorage()): void
export function safeStorage(): Storage                      // localStorage 會丟錯誤時，回傳記憶體版本
export function recordResult(state, unitId, stars, nowIso): State   // 只保留最高星數
export function markVisited(state, unitId, nowIso): State           // 同時更新 lastUnit
export function getStars(state, unitId): 0|1|2|3
export function addProfile(state, { name, icon }): { state, id }
export function removeProfile(state, id): State             // 不能刪最後一個
export function switchProfile(state, id): State
export function exportState(state, nowIso): string          // JSON：{ app: 'elementary-school', version: 1, exportedAt, data }
export function importState(text: string): State            // 格式不符時丟出 ImportError
export class ImportError extends Error {}
export function nextUnit(state, orderedUnitIds: string[]): string
```

`nextUnit` 的規則：
1. `lastUnit` 存在、還在清單中，而且星數小於 3 → 回傳 `lastUnit`。
2. 否則回傳清單中、`lastUnit` 之後第一個星數小於 3 的單元；找不到就從清單開頭找。
3. 全部滿星 → 回傳 `lastUnit`；沒有 `lastUnit` 就回傳清單第一個。

所有修改函式都回傳新的物件，不直接修改傳入的 state。

- [ ] **Step 1：寫 `tests/unit/storage.test.js`**

```js
test('沒有資料時回傳預設狀態', () => expect(loadState(memStorage()).profiles[defaultState().activeProfile].name).toBe('小朋友'));
test('資料損毀時回傳預設狀態', () => { const s = memStorage({ 'esp:v1': '{壞掉' }); expect(loadState(s)).toEqual(defaultState()); });
test('localStorage 丟錯誤時仍可讀寫', () => { /* 把 window.localStorage 換成 getter 會丟錯的物件，safeStorage() 仍可 setItem/getItem */ });
test('星數只保留最高', () => { let s = recordResult(defaultState(), 'G1A-M-curve', 3, T); s = recordResult(s, 'G1A-M-curve', 1, T); expect(getStars(s, 'G1A-M-curve')).toBe(3); });
test('不同孩子的進度分開', () => { /* addProfile → switchProfile → recordResult，另一個檔案的星數仍是 0 */ });
test('不能刪除最後一個孩子', () => expect(() => removeProfile(defaultState(), defaultState().activeProfile)).toThrow());
test('匯出再匯入完全相同', () => { const s = recordResult(defaultState(), 'G1A-M-num10', 2, T); expect(importState(exportState(s, T))).toEqual(s); });
test.each(['', '{}', '[]', '{"app":"other","version":1,"data":{}}', '{"app":"elementary-school","version":99,"data":{}}', 'not json'])
  ('錯誤的匯入內容丟出 ImportError：%s', t => expect(() => importState(t)).toThrow(ImportError));
test.each([
  [{ lastUnit: null, stars: {} }, 'A'],
  [{ lastUnit: 'B', stars: { B: 1 } }, 'B'],
  [{ lastUnit: 'B', stars: { B: 3 } }, 'C'],
  [{ lastUnit: 'C', stars: { C: 3, A: 3, B: 2 } }, 'B'],
  [{ lastUnit: 'B', stars: { A: 3, B: 3, C: 3 } }, 'B'],
  [{ lastUnit: 'GONE', stars: {} }, 'A'],
])('nextUnit %#', (cfg, want) => { /* 依 cfg 建 state，nextUnit(state, ['A','B','C']) === want */ });
```

前三個測試對應 Review Focus 第 1 項；匯入錯誤的測試對應第 2 項。

- [ ] **Step 2：執行，預期 FAIL**

- [ ] **Step 3：實作 `storage.js`**

- [ ] **Step 4：執行 `npm test`，預期 PASS；提交**

```bash
git commit -am "feat: local progress, profiles, export/import"
```

---

### Task 7：首頁、年級與學期畫面、孩子切換

**Files:**
- Create: `src/platform/views/{home,grade,semester,profiles}.js`、`tests/e2e/navigation.spec.js`
- Modify: `src/main.js`、`index.html`

**Interfaces:**
- Consumes：Task 3 的 `catalog`、`router`；Task 4 的 `openUnit`、`closeLesson`、`setPracticeHooks`；Task 6 的 `storage`。
- Produces：每個 view 都是 `render(container: HTMLElement, ctx: { state, setState(next) }, route): void`。

畫面要求（對照設計文件 5.5）：

- **首頁**：最上方一顆大按鈕「▶ 繼續學習：<icon> <單元名稱>」，目標由 `nextUnit` 決定，單元順序依 catalog。下方是一到六年級卡片，沒有內容的年級顯示「準備中」且不能點。右上角顯示目前孩子的圖示，點了進入 `#/profiles`。
- **年級畫面**：三個科目卡片。有學期包的科目可以點；只有試玩包的科目加上「試玩」標籤；沒有內容的顯示「準備中」。
- **學期畫面**：依 `chapters` 分組列出單元卡（圖示、名稱、說明、星星）與總複習卡，沿用舊檔的 `.chap`、`.unit` 樣式。底部是「給爸媽」區，內容包含每個單元的 `tip`、`task`、課綱代碼與翰林章名，以及陪讀三原則與「📝 作答小提醒」。
- **孩子檔案畫面**：列出所有檔案，可以切換、新增（暱稱加上 8 個 emoji 圖示擇一）、刪除（用原生 `<dialog>` 確認，不用 `confirm()`），以及「匯出進度」（下載 `elementary-school-progress-YYYY-MM-DD.json`）和「匯入進度」（`<input type=file>`）。匯入失敗時顯示「這不是進度檔，原本的進度沒有改變。」
- **進入單元**：呼叫 `markVisited`，再呼叫 `openUnit`。`onResult` 寫入 `recordResult` 並存檔。🏠 與「回首頁」改成回到該單元所在的學期畫面。
- **離開單元**：路由從 unit 換成其他畫面時，一律先呼叫 `closeLesson()`。

- [ ] **Step 1：寫 `tests/e2e/navigation.spec.js`**

- 首頁 → 一年級 → 數學 → 「曲線比長短」，網址變成 `#/g1/math/a/curve`。
- 完成一次練習（用 `__T.answer(true)` 全部答對）後回到學期畫面，「曲線比長短」顯示 ⭐⭐⭐；首頁的「繼續學習」指向下一個還沒滿星的單元。
- 在 `#/profiles` 新增「小明」並切換，學期畫面的星星全部歸零；切回原本的孩子，星星還在。
- 匯出後清空 `localStorage`，再匯入同一個檔案，星星恢復。
- 匯入一個內容為 `{"hello":1}` 的檔案，畫面出現「這不是進度檔」，星星不變。（Review Focus 第 2 項）
- 打開 `#/g1/math/a/curve` 並開始播放，假時鐘前進 1 秒後執行 `history.back()`：`#svg` 沒有子元素、`#lesson` 隱藏，再前進 5 秒後 `#sub` 不再變化。（Review Focus 第 5 項）
- 前往 `#/g9/math/a`，畫面顯示首頁。（Review Focus 第 3 項）

- [ ] **Step 2：執行，預期 FAIL**

- [ ] **Step 3：實作各 view，並在 `main.js` 接上路由與 hooks**

- [ ] **Step 4：執行 `npx playwright test navigation parity`，預期 PASS**

- [ ] **Step 5：提交**

```bash
git commit -am "feat: home, grade, semester and profile views"
```

---

### Task 8：多語語音、音效與分開的靜音開關

**Files:**
- Modify: `src/engine/speech.js`、`src/engine/practice.js`、`index.html`、`src/main.js`
- Create: `src/engine/sfx.js`、`public/sfx/{correct,wrong,star,tap}.mp3`、`tests/e2e/audio.spec.js`

**Interfaces:**
- Produces：

```js
// speech.js
export function say(text: string, id: number, opts?: { lang?: 'zh-TW' | 'en-US', rate?: number }): Promise<void>
export function speakOne(text: string, lang = 'zh-TW', rate?: number): Promise<void>
// 只有 zh-TW 才套用舊檔的符號替換（✓→勾、＋→加…）。各語言分別挑選語音並快取；
// zh-TW 依舊檔順序挑選，en-US 依 en-US → en-GB → /^en/ 的順序挑選。
// 找不到該語言的語音時，仍以 u.lang 播放；speechSynthesis 不存在時沿用舊檔的「字幕＋等待」路徑。
// sfx.js
export function playSfx(name: 'correct' | 'wrong' | 'star' | 'tap'): void   // S.sfxMuted 為 true 時不播放；播放失敗時忽略
```

- [ ] **Step 1：準備音效**

從 Kenney 的 Interface Sounds 或 UI Audio 素材包各挑一個答對、答錯、得星、點擊的音效。用 `npx ffmpeg-static` 轉成 mp3（iPad 對 ogg 的支援不穩定），放進 `public/sfx/`。在 `src/content/credits.json` 登記素材包名稱、網址、`CC0-1.0`。

- [ ] **Step 2：寫 `tests/e2e/audio.spec.js`**

- 用 `addInitScript` 換掉 `speechSynthesis`，假物件會記錄 `speak()` 收到的 `text` 與 `lang`；`getVoices()` 回傳只有 `zh-TW` 的清單。呼叫 `say('apple', id, { lang: 'en-US' })`（透過英文示範單元或暴露的測試入口）時，記錄到的 `lang` 是 `en-US`，文字沒有經過中文符號替換。
- 同樣的假物件下，`getVoices()` 回傳空陣列，英文單元仍能從第一個場景播到最後一個場景，不會卡住。（Review Focus 第 4 項）
- header 有兩個開關：🔊（朗讀）與 🎵（音效）。關掉 🎵 後答一題，假的 `Audio.play` 沒有被呼叫，但 `speechSynthesis.speak` 仍有被呼叫。
- 兩個開關的狀態存在 `state.settings`，重新整理頁面後不變。

- [ ] **Step 3：實作 `speech.js`、`sfx.js`，在 `practice.js` 的答對、答錯與結果頁呼叫 `playSfx`，並在 header 加上 🎵 開關**

- [ ] **Step 4：執行 `npx playwright test audio parity`，預期 PASS**

對照測試已經把 `Audio` 換成假物件，所以音效不影響字幕序列。

- [ ] **Step 5：提交**

```bash
git commit -am "feat: multilingual speech and separate sfx toggle"
```

---

### Task 9：套用開源介面套件、致謝頁與授權清單

**Files:**
- Create: `src/styles/tokens.css`、`src/styles/app.css`、`src/platform/views/credits.js`、`src/content/credits.json`、`tests/unit/credits.test.js`
- Modify: `index.html`、`src/main.js`

**Interfaces:**
- Produces：`credits.json` 的每一筆格式為 `{ name, url, license, author, usage }`，`license` 必須是 SPDX 代碼。
- Produces：`#/credits` 畫面，依 `credits.json` 列表顯示，首頁底部放連結。

- [ ] **Step 1：寫 `tests/unit/credits.test.js`**

- 每一筆都有五個欄位，而且 `license` 屬於 `['MIT', 'ISC', 'Apache-2.0', 'CC0-1.0', 'OFL-1.1', 'CC-BY-4.0']`。
- 至少包含 open-props、Tabler Icons、Microsoft Fluent Emoji、Kenney、jf open 粉圓（Huninn）五筆。
- `package.json` 的 `dependencies` 裡每個套件都在 `credits.json` 中。

- [ ] **Step 2：執行，預期 FAIL**

- [ ] **Step 3：安裝套件，搬移樣式**

```bash
npm i open-props @tabler/icons
```

把舊檔 `<style>` 的內容搬到 `app.css`。顏色改用 `tokens.css` 的變數，值和舊檔 `:root` 相同（`--red:#ff5a5f` 等）。圓角與陰影改用 open-props 的變數，外觀要和舊檔接近。只 import 用到的 open-props 子檔，例如 `open-props/src/props.sizes.css`、`props.borders.css`、`props.animations.css`。

字型改成 Google Fonts 的 `Huninn`，備用字型順序為 `"Huninn", "Noto Sans TC", system-ui, sans-serif`。SVG 內的 `.svgtxt` 字型也同步更新。

header 與首頁的圖示（首頁、聲音、音效、孩子檔案）改用 Tabler Icons，用 `import x from '@tabler/icons/filled/home.svg?raw'` 的方式嵌入，`stroke-width` 至少 2.5，尺寸至少 28px。單元卡上的 emoji 圖示維持不變。

- [ ] **Step 4：填寫 `credits.json`，實作致謝頁**

- [ ] **Step 5：執行 `npm test` 與 `npx playwright test`，預期全部 PASS**

用 `npm run dev` 打開首頁與任一單元，目測確認風格和舊檔一致：奶油色背景、大圓角按鈕、按下有凹陷感。

- [ ] **Step 6：提交**

```bash
git commit -am "feat: open-source UI kit, fonts, icons and credits page"
```

---

### Task 10：範本機制

**Files:**
- Create: `src/engine/emoji.js`、`src/templates/{choice,listen,match,explainer}.js`、`tests/unit/templates.test.js`、`public/emoji/`（依 Task 11 需要的詞彙）
- Modify: `src/engine/practice.js`（新增 `match` 作答模式）

**Interfaces:**
- Consumes：`engine/svg.js` 的 `el`、`txt`；`engine/speech.js` 的 `say`；`engine/ui.js` 的 `askChoice`。
- Produces：

```js
// emoji.js
export function drawEmoji(name: string, x: number, y: number, size: number, parent?): SVGElement
// 用 <image href="${import.meta.env.BASE_URL}emoji/${name}.svg">；圖片載入失敗時改顯示 fallback 文字

// 詞彙項目
// Item = { key: string, label: string, emoji: string, sayText?: string, lang?: 'zh-TW' | 'en-US' }

// choice.js：看圖選字或看字選圖
export function makeChoiceType(cfg: { items: Item[], options = 3, show: 'emoji' | 'label', answerBy: 'emoji' | 'label',
  prompt: (target: Item) => string, promptLang?: 'zh-TW' | 'en-US', explain: (target: Item) => string }): () => PracticeItem
// listen.js：聽音選圖
export function makeListenType(cfg: { items: Item[], options = 3, prompt: string, explain: (target: Item) => string }): () => PracticeItem
// match.js：左右配對
export function makeMatchType(cfg: { items: Item[], pairs = 3, left: 'emoji' | 'label', right: 'emoji' | 'label', prompt: string }): () => PracticeItem
// explainer.js：講解場景
export function makeExplainerScene(cfg: { title: string,
  steps: Array<{ emoji?: string, text?: string, say: string, lang?: 'zh-TW' | 'en-US', tapLabel?: string }> }): { title, run(id) }
```

範本產生的題目都是舊引擎認得的 `PracticeItem`：choice 與 listen 用 `mode: 'pick'`，match 用新增的 `mode: 'match'`。

`match` 模式的操作：點左邊一項，再點右邊一項，兩者之間畫一條線。再點一次已連線的項目可以取消。全部連好後自動檢查。`answer` 是 `number[]`，表示左邊第 i 項對應右邊第幾項。答錯時，正確的連線用綠色畫出。

- [ ] **Step 1：寫 `tests/unit/templates.test.js`（jsdom 環境，DOM 中放一個 `#svg`）**

- 用 `Math.random` 固定為序列的方式呼叫 `makeChoiceType(...)()` 100 次：每次都有 `options` 個選項、選項不重複、`answer` 落在範圍內、正解剛好出現一次。
- `items` 少於 `options` 時，`makeChoiceType` 立即丟出錯誤，錯誤訊息包含「items」。
- `makeMatchType(...)()` 的 `answer` 是 0 到 `pairs - 1` 的一個排列；`draw()` 回傳 `pairs * 2` 個區域。
- `makeExplainerScene` 回傳的物件有 `title` 與 `run`，`run` 是 async 函式。

- [ ] **Step 2：執行，預期 FAIL**

- [ ] **Step 3：實作 `emoji.js` 與四個範本，在 `practice.js` 加入 `match` 模式（包含 `__T.answer` 對 `match` 的支援）**

- [ ] **Step 4：執行 `npm test` 與 `npx playwright test parity`，預期 PASS**

對照測試用來確認新增 `match` 模式沒有影響舊的作答模式。

- [ ] **Step 5：提交**

```bash
git commit -am "feat: data-driven templates and match mode"
```

---

### Task 11：英文示範單元

**Files:**
- Create: `src/content/english/g1-demo/index.js`、`public/emoji/{apple,banana,cat,dog,fish,bird,egg,sun}.svg`、`tests/e2e/english-demo.spec.js`
- Modify: `src/content/catalog.js`、`src/content/credits.json`

**Interfaces:**
- Consumes：Task 10 的四個範本。
- Produces：catalog 新增一個 Pack：`{ id: 'g1-english-demo', grade: 1, subject: 'english', semester: 'demo', label: '試玩', trial: true }`，裡面只有一個單元：`{ id: 'G1-E-words', key: 'words', icon: '🔤', name: '認識英文單字', desc: '聽一聽、選一選、連一連', lang: 'en-US', curriculum: [] }`。

內容規格：

- 8 個單字：apple、banana、cat、dog、fish、bird、egg、sun。SVG 從 Fluent Emoji 的 Flat 版本複製（Red apple、Banana、Cat face、Dog face、Fish、Bird、Egg、Sun），檔名改成英文單字。
- 場景 1：講解場景，4 個水果與食物，每個步驟先用中文說「這是」，再用英文唸單字（`lang: 'en-US'`）。
- 場景 2：講解場景，4 個動物，做法相同。
- 練習（`count: 6`）：三種題型各登記一個 key：`enListen`（聽英文選圖）、`enChoice`（看圖選英文字）、`enMatch`（英文字和圖配對，3 組）。
- 這個單元的檔案只用範本，不直接呼叫 `el`、`txt` 等繪圖函式。

- [ ] **Step 1：寫 `tests/e2e/english-demo.spec.js`**

- 一年級畫面的英文卡片顯示「試玩」，點進去後可以進入 `#/g1/english/demo/words`。
- 兩個講解場景都能播完；`speechSynthesis` 的假物件至少收到一次 `lang === 'en-US'` 的 `apple`。
- 練習 6 題全部答對後，學期畫面顯示 ⭐⭐⭐。
- 8 張 emoji 圖片都成功載入（`naturalWidth > 0`）。

- [ ] **Step 2：執行，預期 FAIL**

- [ ] **Step 3：實作單元，更新 catalog 與 credits**

另外用 grep 確認 `src/content/english/` 內沒有出現 `el(` 或 `txt(`。

- [ ] **Step 4：執行 `npx playwright test`，預期全部 PASS；提交**

```bash
git commit -am "feat: English demo unit built only from templates"
```

---

### Task 12：離線安裝（PWA）與「下載教材」

**Files:**
- Create: `src/platform/offline.js`、`public/icons/`（由 `@vite-pwa/assets-generator` 產生）、`tests/e2e/offline.spec.js`
- Modify: `vite.config.js`、`src/content/catalog.js`、`src/platform/views/home.js`

**Interfaces:**
- Produces：

```js
// offline.js
export async function downloadPacks(packs: Pack[], onProgress: (done: number, total: number) => void): Promise<void>
// 對每個 pack 呼叫 pack.load()，並 fetch pack.assets 列出的每個網址，交給 service worker 快取
export function isOfflineReady(): Promise<boolean>   // service worker 是否已啟用
```

- Produces：Pack 新增選填欄位 `assets: string[]`（相對 `BASE_URL` 的路徑，例如 `emoji/apple.svg`）。

設定（`vite-plugin-pwa`，`registerType: 'autoUpdate'`）：

- `manifest`：`name: '小學互動教室'`、`short_name: '互動教室'`、`lang: 'zh-Hant-TW'`、`display: 'standalone'`、`background_color` 與 `theme_color` 用 `#fff8e7`、`start_url` 與 `scope` 用 `BASE_URL`。
- 圖示：用 Fluent Emoji 的「Books」SVG 當來源，以 `npx pwa-assets-generator` 產生；同時在 `index.html` 加上 `apple-touch-icon`。
- `workbox.globPatterns` 只預先快取 App 外殼：`index.html`、CSS、`assets/main-*.js`、`sfx/*.mp3`、`icons/*`。
- `runtimeCaching`：
  - 其他 `assets/*.js`（學期包）與 `emoji/*.svg` 用 `CacheFirst`。
  - `fonts.googleapis.com` 用 `StaleWhileRevalidate`。
  - `fonts.gstatic.com` 用 `CacheFirst`，`cacheableResponse.statuses: [0, 200]`。

首頁新增「📥 下載教材，離線使用」區塊：列出每個有內容的年級與科目，可以勾選，按下後顯示進度「下載中 3/5」，完成後顯示「✅ 可以離線使用了」。

離線時打開還沒下載的單元：顯示「這個單元還沒下載，連上網路後再打開一次就會存起來。」並提供回首頁的按鈕，不出現空白頁。

- [ ] **Step 1：寫 `tests/e2e/offline.spec.js`（對 `npm run preview` 的正式建置執行）**

- 第一次造訪首頁後，等待 `navigator.serviceWorker.ready`。
- 打開「曲線比長短」並播完第一個場景，接著 `context.setOffline(true)`，重新整理後再打開同一個單元，第一個場景仍能播放。
- 離線狀態下打開英文試玩單元（沒有造訪過），畫面顯示「這個單元還沒下載」。
- 恢復連線，在首頁勾選「一年級 英文」並下載，完成後切換成離線，英文單元可以打開，8 張 emoji 都有載入。
- 離線時重新整理頁面，字型取不到也不影響版面：`#bar` 的按鈕仍然在畫面內可以點擊。

- [ ] **Step 2：執行，預期 FAIL**

- [ ] **Step 3：安裝與實作**

```bash
npm i -D vite-plugin-pwa @vite-pwa/assets-generator
```

- [ ] **Step 4：執行 `npx playwright test`，預期全部 PASS；提交**

```bash
git commit -am "feat: installable offline PWA with pack downloads"
```

---

### Task 13：部署到 GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.js`、`README.md`

**Interfaces:**
- Consumes：`npm run build` 產生 `dist/`。
- Produces：`vite.config.js` 的 `base` 為 `process.env.BASE_PATH ?? '/'`。

- [ ] **Step 1：寫 `deploy.yml`**

觸發條件為 push 到 `main` 與手動觸發（`workflow_dispatch`）。

- **build job**：`actions/checkout` → `actions/setup-node`（Node 22，啟用 npm 快取）→ `npm ci` → `npm test` → `npx playwright install --with-deps chromium` → `npx playwright test`（對照測試在 CI 上會自動略過）→ `BASE_PATH=/${{ github.event.repository.name }}/ npm run build` → `actions/upload-pages-artifact`（path: `dist`）。
- **deploy job**：`actions/deploy-pages`，`permissions` 為 `pages: write` 與 `id-token: write`，`environment` 為 `github-pages`。

注意 e2e 測試也要用相同的 `BASE_PATH` 建置，或是在建置正式版之前就先跑完測試。實作者選一種，並確保 `playwright.config.js` 的 `baseURL` 和建置的 `base` 一致。

- [ ] **Step 2：改寫 `README.md`**

內容包含：網站網址（先留 `https://<帳號>.github.io/<儲存庫>/`，Step 4 後再填入）、怎麼安裝到平板（iPad 用 Safari「加入主畫面」；Android 用 Chrome「安裝應用程式」）、怎麼下載教材離線使用、怎麼備份進度（匯出／匯入）、本機開發指令（`npm i`、`npm run dev`、`npm test`、`npm run e2e`）、怎麼新增一個單元（catalog 登記 + 學期包檔案，或範本）、授權說明（程式碼 MIT，素材見致謝頁）。

不再提「雙擊 `index.html`」。

- [ ] **Step 3：本機驗證**

Run：`BASE_PATH=/elementary-school/ npm run build && npx vite preview --base /elementary-school/`
Expected：打開 `http://localhost:4173/elementary-school/`，首頁、單元與致謝頁都正常；DevTools 的 Application 分頁顯示 manifest 與已啟用的 service worker。

- [ ] **Step 4：建立 GitHub 儲存庫並推送（⚠️ 先問使用者）**

這一步會把程式碼公開。執行前要先向使用者確認：帳號、儲存庫名稱，以及是否同意公開。

確認後執行：

```bash
npm test                                   # 隱私檢查必須通過
git log --all --stat | grep -E "private/|legacy-index" && echo "STOP: 歷史紀錄中有私人檔案"
gh repo create <帳號>/<名稱> --public --source . --push
gh api -X POST repos/<帳號>/<名稱>/pages -f build_type=workflow
gh run watch
```

Expected：Actions 執行成功；`https://<帳號>.github.io/<名稱>/` 可以打開首頁。

- [ ] **Step 5：把正式網址填進 README，提交並推送**

```bash
git commit -am "docs: README for the deployed site" && git push
```
