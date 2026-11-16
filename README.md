# 小學互動教室

給國小孩子用的互動教學網站：動畫講解加上練習題，有語音、有星星進度。
目前有一年級上學期數學（12 個單元與 2 個總複習）和一個英文試玩單元。

網站網址：`https://<帳號>.github.io/<儲存庫>/`（部署後填入）

## 給爸媽：怎麼使用

### 打開網站

用 Chrome、Edge 或 Safari 打開上面的網址。
第一次進入單元時按「▶ 開始」並打開喇叭，才會有語音。
語音用的是裝置內建的朗讀功能，各裝置的聲音略有不同；沒有語音時仍會顯示字幕。

### 安裝到平板

裝起來之後，桌面上會有圖示，打開時像一般 App 一樣全螢幕。

- **iPad / iPhone**：用 Safari 打開網站 → 點分享按鈕 → 選「加入主畫面」。
- **Android**：用 Chrome 打開網站 → 點右上角選單 → 選「安裝應用程式」（或「加到主畫面」）。

### 下載教材，離線使用

1. 在有網路的時候打開首頁。
2. 展開「📥 下載教材，離線使用」，勾選要用的年級與科目，按下載。
3. 下載完成後，沒有網路也能打開這些單元。

沒有下載的單元，離線時會顯示提示，連上網路後再打開即可。

### 備份進度（匯出／匯入）

進度只存在這台裝置的瀏覽器裡，不會上傳到任何地方。
清除瀏覽資料或換裝置，進度就會不見，所以建議定期備份：

1. 點右上角的「孩子檔案」按鈕。
2. 按「📤 匯出進度」，會下載一個進度檔。
3. 到新裝置（或清除資料後）打開同一個畫面，用「📥 匯入進度」選擇剛才的檔案。

選錯檔案時會顯示「這不是進度檔」，原本的進度不會被改動。

## 給開發者

### 本機開發

需要 Node.js 22 以上。

```bash
npm i            # 安裝套件
npm run dev      # 開發伺服器，修改後自動重新整理
npm test         # 單元測試（Vitest），包含隱私檢查
npm run e2e      # 瀏覽器測試（Playwright），會先自動建置
npm run lint     # ESLint
```

第一次跑 e2e 前要先安裝瀏覽器：`npx playwright install chromium`。

### 部署

推送到 `main` 後，GitHub Actions（`.github/workflows/deploy.yml`）會：

1. 跑單元測試與瀏覽器測試。
2. 用 `BASE_PATH=/<儲存庫名稱>/` 建置。
3. 發布到 GitHub Pages。

本機想模擬部署後的網址，可以這樣跑：

```bash
BASE_PATH=/elementary-school/ npm run build
npx vite preview --base /elementary-school/
# 打開 http://localhost:4173/elementary-school/
```

### 新增一個單元

每個單元由兩個部分組成：

1. **在目錄登記**：在 `src/content/catalog.js` 對應的學期包裡加上單元的中繼資料，
   包括固定 ID（`id`）、`key`、名稱、圖示、說明、課綱代碼、給爸媽的提示，並放進 `chapters`。
   固定 ID 一旦提交就不要再改，進度存檔用它當鍵值。
2. **寫學期包內容**：在學期包（例如 `src/content/math/g1a/`）加上這個單元的動畫場景與練習題型，
   並在學期包的 `index.js` 匯出。

不想自己寫繪圖程式時，可以直接用 `src/templates/` 的範本：

- `explainer`：一步一步顯示圖片與文字的講解動畫。
- `choice`：看圖或看字選答案。
- `listen`：聽語音選答案。
- `match`：連連看。

`src/content/english/g1-demo/index.js` 就是只用範本做出的完整單元，可以照著改。

新增一整個學期時，在 `catalog.js` 的 `PACKS` 加一個學期包，用 `load()` 延遲載入它的內容。
課綱對照文件放在 `docs/curriculum/`。

## 授權

- 程式碼：MIT（見 `LICENSE`）。
- 圖示、音效、字型等素材各自保留原本的授權，完整清單見網站上的「致謝與授權」頁
  （資料來源：`src/content/credits.json`）。
