# 兒童學習網站設計研究整理（數學／英語／自然，小一到小六）

## 1. 白話結論：最值得借鏡的 5 件事

1. **首頁放一顆超大「繼續學習」按鈕，「自己選單元」當第二個入口。**
   Khan Academy Kids 的首頁只有一顆 PLAY 鈕，系統替孩子決定下一課。小一、小二還不太會讀字，這樣他們不用自己選。大孩子和家長則用「年級 → 上／下學期 → 單元」的大圖卡自己挑。台灣家長本來就習慣這樣找課，均一和因材網也都這樣排。

2. **每個單元用同一套固定節奏，做成可重複使用的模板。**
   參考 Zearn 和 Duolingo ABC，順序是：暖身 → 動畫講解（現有的 scenes）→ 跟著做 2-3 題 → 自己做 5 題 → 過關。孩子學會一次流程，之後每個單元都會用。

3. **答錯時給「補救」，不扣分。**
   順序是：先給一句提示（Khan）→ 再錯就把題目拆成小步驟，並給 10 格框、數線這類教具（Zearn 的 Boost）→ 最後顯示正確答案和原因（IXL）→ 回到原題再做一次。
   IXL 在高分時答錯會大幅扣分，已經有家長連署抗議。我們不學這一點。

4. **語音優先，而且要先「解鎖聲音」。**
   畫面上所有字都可以點來朗讀，朗讀時一個字一個字亮起來。
   但瀏覽器有 autoplay（自動播放）限制：使用者還沒點過頁面時，網頁不能自己出聲。NN/g 觀察過 PBS 的遊戲，語音說明就是被這個限制擋掉，孩子完全沒聽到。
   所以網站一開始要有一個「點我開始」的畫面，順便解鎖聲音。目標也要同時用圖示和示範動畫表示，不能只靠語音。

5. **動機系統要「低刺激」，美術只用授權乾淨的素材。**
   獎勵用星星，加上幫角色收集裝飾或把地圖點亮（Khan Kids、Teach Your Monster）。不做排行榜、商店、對戰，也不做連續天數壓力（Prodigy、PaGamO 的反面教材）。
   美術建議：
   - UI：Open Props 加上自己寫的元件
   - 插圖：Microsoft Fluent Emoji
   - 音效：Kenney
   - 中文字型：粉圓（Huninn）
   這幾套都是 MIT／CC0／OFL，放進公開 repo 沒有授權疑慮。

> 🟢 另外有一個市場空缺。台灣現有的公共平台（均一、因材網、PaGamO、酷英）**都沒有真正為還不太會讀字的小一、小二設計**。它們要嘛以文字、表格、下拉選單為主，要嘛從三年級才開始。我們的網站剛好可以補上這一塊。

---

## 2. 設計模式摘要表

| 設計模式 | 誰在用 | 適不適合我們（靜態網站、無帳號、小一到小六） | 建議 |
|---|---|---|---|
| 一顆大「開始／繼續」鈕，系統選下一課 | Khan Kids、Zearn | 很適合，用 localStorage 記錄進度就能做到 | ✅ 採用 |
| 年級 → 上／下學期 → 單元 的大圖卡 | 均一、因材網、Starfall | 很適合，台灣家長最熟悉這種分法 | ✅ 採用 |
| 固定單元節奏模板（暖身 → 講解 → 跟著做 → 自己做） | Zearn、Duolingo ABC | 很適合資料驅動模板 | ✅ 採用 |
| 分層提示 + 補救步驟 + 正解說明 | Khan、Zearn、IXL | 很適合，在題目資料加欄位即可 | ✅ 採用 |
| 所有文字可點朗讀、逐字高亮 | Khan Kids、Duolingo ABC、BrainPOP Jr. | 很適合，現有 zh-TW 語音合成可延伸 | ✅ 採用 |
| 「點我開始」解鎖聲音 + 重播鈕 | NN/g 對 PBS 的觀察 | 必要，否則語音可能被瀏覽器擋掉 | ✅ 採用 |
| 閒置提示（手指動畫指向下一步） | Starfall、PhET wiggle-me | 便宜好做（CSS + 計時器） | ✅ 採用 |
| 預測 → 觀察 → 解釋（自然科） | Mystery Science、PhET | 很適合，而且沒有平台把它做成自學元件 | ✅ 採用（自然科） |
| 單元標題用孩子的問題（為什麼影子會變長？） | Mystery Science | 很適合自然科 | ✅ 採用 |
| 精熟分級（練習過 → 會了 → 很熟），只升不降 | Khan（我們改成不降級） | 適合 | ✅ 採用（簡化版） |
| 間隔複習（隔幾天再出 2-3 題舊題） | 均一、Khan Mastery Challenge | 可行，但要先有足夠單元 | ⏳ 之後再說 |
| 錯題本（跨單元） | PaGamO 的詳解回顧 | 可行 | ⏳ 之後再說 |
| 先修單元建議（卡住就推薦前一個單元） | 因材網 | 可行，單元資料加 `prereqs` | ⏳ 之後再說 |
| 學習地圖（完成就點亮區域） | Teach Your Monster、PaGamO | 適合，但需要美術 | ⏳ 之後再說 |
| 自訂角色（拼裝身體、角） | Teach Your Monster | 適合，用 SVG 分層 | ⏳ 之後再說 |
| 「找起點」分級小測驗 | Prodigy（但我們允許家長修改） | 可行 | ⏳ 之後再說 |
| 家長閘門（用國字數字出題） | Starfall、Baby Bus | 必要（家長專區用） | ✅ 採用 |
| 家長頁：星星、錯題、對應 108 課綱 | 因材網、Junyi、IXL | 可行，資料存在本機 | ✅ 採用（簡化版） |
| 出版社順序對照（類康軒／翰林／南一） | 均一 | 可行，只做順序對照表 | ⏳ 之後再說 |
| 每日練習上限提醒 | PaGamO | 適合，也能增加家長信任 | ✅ 採用（溫和版） |
| 發音評分（語音辨識打分） | 酷英網 | 🔴 不可靠：瀏覽器支援不一，Chrome 會把聲音傳到伺服器 | ❌ 不採用（可改成錄音後自己對照） |
| 排行榜、對戰、搶地盤 | PaGamO、Prodigy | 對低年級是懲罰感來源 | ❌ 不採用 |
| 金幣商店、道具掉落、付費推銷 | Prodigy、PaGamO | 喧賓奪主，孩子容易亂猜 | ❌ 不採用 |
| 答錯大扣分（SmartScore 式） | IXL | 造成焦慮 | ❌ 不採用 |
| 登入帳號 | 因材網、酷英網 | 是最常被抱怨的卡點 | ❌ 不採用（無登入是優勢） |

---

## 3. 導覽與資訊架構建議

### 3.1 首頁：兩個入口

- **主入口：一顆超大「繼續學習」按鈕。**
  按下去會打開系統建議的下一個單元，邏輯是：上次做到哪裡、哪個單元還沒滿星。小一、小二不需要讀任何字就能使用。
- **次入口：「自己選」。**
  用大圖卡排成「一年級 … 六年級」→「上學期／下學期」→ 單元卡。

另外放一個小小的「家長專區」連結，放在角落，不要擋到孩子。

> 🟢 可以選擇性加一個「今天的混合練習」：數學 → 英語 → 自然輪流出題。這是 Khan Kids 的做法，用來讓練習比較有變化。

### 3.2 分層結構（內部資料 vs. 孩子看到的畫面）

| 層級 | 孩子看到的 | 內部資料 |
|---|---|---|
| 年級 | 「一年級」大卡 + 插圖 | `grade: 1` |
| 學期 | 「上學期／下學期」 | `semester: 1` |
| 科目 | 數學／英語／自然 大圖示 | `subject: "math"` |
| 單元 | 圖示 + 簡短名稱（「比長短」） | `id: "G1-N-03"`、`curriculum: ["N-1-1"]` |
| 技能 | 不直接顯示 | 每題標註對應的技能 |

- **108 課綱代碼只放在資料裡和家長頁，不要出現在孩子的畫面上。**
  因材網把「1-n-07-S01」這類代碼直接顯示給學生，研究判斷這對兒童不友善。
- **自己訂一套固定 ID。**
  IXL 的技能代碼在不同年級會重複，而且官方會定期改號，所以不適合當永久 ID。我們用類似 `G1-N-03` 的格式，訂下來就不要改。
- **家長頁可以按「學習階段」分組。**
  第一學習階段是 1-2 年級，第二是 3-4 年級，第三是 5-6 年級。這跟 108 課綱與教育大市集的寫法一致。另外要注意，英語在課綱中是從三年級開始。

### 3.3 要不要做「學習地圖」或「技能樹」？

| 形式 | 給誰 | 建議 |
|---|---|---|
| **學習地圖**：每個年級一張地圖，完成單元就點亮一塊區域 | 孩子 | 🟢 之後再做。概念很好，但需要美術投入。第一階段先用單元卡加星星 |
| **技能樹／先修關係圖**：單元是節點，用線連出先修關係（類似因材網的「知識結構」） | 家長 | 🟢 之後再做，只放在家長頁。研究判斷這對孩子太抽象 |
| **長串技能清單**（IXL 式） | — | ❌ 不採用。孩子沒辦法自己找 |

### 3.4 年級標籤要「長得大」

- 🟡 Khan Kids 的內容只做到小二，這是它已知的缺點。Starfall 的評論也提到，年級標籤太明顯會讓程度落後的大孩子覺得「好幼稚」。
- 建議小三到小六的畫面降低卡通感，字可以多一點、圖示可以小一點。
- 單元卡以「主題名稱」為主，年級只當一個小標籤。

---

## 4. 單元內學習循環與回饋建議

### 4.1 標準單元模板

```
① 暖身：2-3 題舊技能（流暢練習）
② 動畫講解：現有的 narrated scenes，加上「第 3/12 步」進度
③ 跟著做：2-3 題，有角色引導
④ 自己做：5 題一輪（BrainPOP Jr. 每輪也是 5 題）
⑤ 錯題重做：現有的 retry wrong ones，包裝成「幫小怪獸修好這幾題」
⑥ 過關：星星 + 「明天見」結束畫面
（自然科可在最後加一張「你知道嗎？」趣味知識卡）
```

- **建議時間：** 小一、小二每單元 5-10 分鐘（研究者的推論）。Teach Your Monster 官方建議每天約 22 分鐘，而且短而規律比長時間好。
- **結束畫面要讓「停下來」感覺很自然。** 例如顯示「今天很棒，明天見！」。

### 4.2 答錯時的處理（最重要的差異點）

| 第幾次錯 | 做什麼 | 來源 |
|---|---|---|
| 第 1 次 | 一句提示（語音 + 一張圖），再試一次 | Khan 分層提示 |
| 第 2 次 | 展開「拆小步驟 + 教具」補救畫面，例如加法錯了就跳出 10 格框讓孩子數 | Zearn Boost |
| 第 3 次 | 顯示正確答案 + 為什麼，看完按「繼續」 | IXL |
| 之後 | 這題會進入錯題重做 | 現有機制 |

題目資料直接支援這個流程。範例如下：

```js
{
  id: "G1-N-03-q12",
  hints: ["先數左邊有幾個", "<svg>...</svg>"],   // 作答中提示
  boost: [ /* 拆小步驟，每步一個小互動 */ ],
  rationale: "因為 3 + 4 = 7 …"                // 作答後解析
}
```

Khan 把「作答中提示（hints）」和「作答後解析（rationales）」分成兩種。建議我們的資料也分開存。

### 4.3 防止亂猜

🟡 PaGamO 的家長擔心孩子為了繼續玩而亂猜。

建議：如果同一題在很短時間內連續點錯好幾次，就不要直接換下一題，而是重新播放講解或提示。研究中的範例是「2 秒內錯 3 次」，實際數字可以之後再調整。

### 4.4 低年級語音優先

| 做法 | 來源 |
|---|---|
| 網站第一個畫面是「點我開始」，用來解鎖 speechSynthesis 和 AudioContext | NN/g 對 PBS 的觀察 |
| 每個模板都有固定的「🔊 再聽一次」按鈕 | 所有平台 |
| 所有文字可點來朗讀，朗讀時逐字高亮（可用 `SpeechSynthesisUtterance` 的 `boundary` 事件） | Khan Kids、Duolingo ABC |
| 語音要間隔播放，不要每一步都講話 | Khan Kids |
| 動畫提示要跟語音同步（講到「蘋果」時蘋果跳一下），語音播完才接受作答 | Duolingo ABC |
| 目標同時用數字和圖示表示（「3」旁邊放 3 顆蘋果） | NN/g 對 PBS Puppy Quest 的觀察 |
| 用不分裝置的動詞，例如「點一下」，不要說「用滑鼠點」 | NN/g |
| 閒置幾秒後，手指動畫指向下一步 | Starfall、PhET |
| 任務開始前先播放示範動畫 | Starfall 數到 100 的失敗案例 |
| 第一次使用時，吉祥物用真實題型示範「點」和「拖」，不計分 | Khan Kids |
| 拖曳要能自動吸附到目標，碰觸區要大；低年級不要有計時或需要精準拖曳的題目 | Duolingo ABC、PBS 評論 |
| 回饋要誇張、要有語音（角色大笑加上「答對了！」），不要只變顏色 | NN/g |
| 音效靜音開關要跟朗讀開關分開 | Duolingo ABC 家長抱怨 |

### 4.5 各科補充

**數學**
- 參考 DragonBox 的「具體 → 半具體 → 抽象」：同一個技能，先用蘋果圖，再用積木或 10 格框，最後只剩算式。
- 可以用 inline SVG 做出可拖拉的數棒。
- 低年級的數量用「格子」計算，不用公分或像素（ScratchJr 的做法）。

**英語**
- 每個英文字都可以點，用 en-US 唸出來，並提供「慢速再聽一次」（Lingokids 的做法）。
- 主題單元依「單字 → 片語 → 句子」漸進。
- 現有的配對模式可以直接做成「圖片 ↔ 英文發音」翻牌遊戲。
- 🟡 自然發音（phonics）需要單獨唸出 /t/ 這類音素。瀏覽器語音合成很可能做不到，但這是研究者的推論，未經驗證。之後如果要做，需要另外找開放授權的短音檔。

**自然**
- 用「預測 → 觀察 → 解釋」三步模板：
  - 先問：「你覺得會怎樣？」（大圖選擇題）
  - 再看：可操作的 SVG 場景，周圍 2-4 個大控制鈕，加上固定的大「重來」鈕
  - 最後揭曉：「你猜的是… 結果是…」
- 數值滑桿要限制範圍，讓兩個極端剛好就是最值得比較的情況。
- 全站使用同一套圖示和顏色代表「力」「熱」「水」。PhET 發現孩子會把換了樣子的東西當成不同的東西。
- 場景一開始要安靜，不要一打開就有大量動畫，PhET 發現那樣會壓抑探索。

---

## 5. 動機系統建議

### 5.1 建議組合

| 機制 | 建議 | 說明 |
|---|---|---|
| 0-3 星／單元 | ✅ 保留 | 現有機制 |
| 精熟三階：練習過 → 會了 → 很熟 | ✅ 採用 | 「很熟」要在單元挑戰的混合題中再答對才給（參考 Khan 的 Mastered） |
| 只升不降 | ✅ 採用 | 不學 Khan、IXL 的降級。改成溫和提示「這個要複習一下囉」 |
| 會往上爬的進度條 | ✅ 採用 | 讓孩子知道一定到得了終點（借 IXL 的「100 一定到得了」概念，但去掉扣分） |
| 貼紙／徽章 | 🟢 輕量採用 | 完成單元給一張（Zearn、Lingokids） |
| 幫角色收集裝飾、自訂角色 | ⏳ 之後再做 | Khan Kids、Teach Your Monster；需要美術 |
| 地圖點亮 | ⏳ 之後再做 | 同上 |
| 可列印的證書（例如三年級字彙全部 ≥2 星） | ⏳ 之後再做 | 酷英網概念，可在瀏覽器端產生 |

### 5.2 對兒童的風險

| 風險 | 等級 | 為什麼 | 怎麼避免 |
|---|---|---|---|
| 獎勵比學習還多 | 🔴 | Fairplay 觀察 Prodigy：19 分鐘內出現 16 次會員廣告，但只有 4 場數學戰鬥 | 獎勵只在單元結束時出現，不在每題之間插入動畫 |
| 扣分、降級造成焦慮 | 🔴 | IXL 有連署和評論抱怨 90 幾分時錯一題就大退 | 只升不降，用錯題重做取代扣分 |
| 為了繼續玩而亂猜 | 🟡 | PaGamO 家長的擔憂 | 快速連錯就重播提示（見 4.3） |
| 連續天數壓力 | 🟡 | 研究中偏科學的平台幾乎都不用 streak（連續天數），靠的是好奇心 | 第一階段不做。之後若要做，只顯示「本週練習了幾天」，不要有「斷掉」的懲罰 |
| 對戰、排行榜 | 🔴 | 對 6-8 歲來說，失去領地會有懲罰感 | 不做 |
| 商店、貨幣、道具 | 🟡 | 動機會從學習轉成收集 | 不做 |
| 刺激太多（大聲音效、花俏畫面） | 🟡 | Duolingo ABC 有家長要求調低答對音效；Khan Kids 因為「不花俏」受到好評 | 提供音效靜音，維持現有的溫暖奶油色系 |
| 無意義的「立即滿足」按鈕 | 🟡 | ScratchJr 移除了「神秘角色」按鈕，因為孩子只會一直按 | 每個按鈕都要跟學習有關 |
| 垃圾食物主題 | 🟢 | Duolingo ABC 有家長抱怨餅乾零食太多 | 題材避開零食 |

---

## 6. 家長功能建議（無帳號前提）

**前提：** 所有資料存在這台裝置的 localStorage（瀏覽器內建的本機儲存），不上傳、不需要後端。

**為什麼不做帳號：** 研究中「登入」是最常被抱怨的問題。有老師反映學生卡在因材網的登入畫面；新竹市家長會也說家長不會用，辦了 7 場實作工作坊。

| 功能 | 第一階段？ | 說明 |
|---|---|---|
| 家長閘門 | ✅ | 用國字數字出題，例如「七加五等於多少？」再按數字鈕。🟡 Lingokids 的閘門被評為 7 歲以上就解得開，所以題目要有一點難度 |
| 每單元星星、做了幾題、錯了哪幾題 | ✅ | 參考 IXL 的報表概念，但大幅簡化 |
| 對應 108 課綱代碼 | ✅ | 讓家長知道孩子學了什麼（DragonBox 的缺點就是家長看不出對應課綱） |
| 「需要陪他一起看」提醒 | ✅ | 同一單元觸發 3 次補救就提示家長（Zearn Tower Alert 的家庭版） |
| 解鎖或跳過單元、調整起點 | ✅ | Zearn 的完全線性在家裡太死板；Prodigy 的分級結果不能改，我們要相反，家長隨時可以調 |
| 依科目設定程度 | 🟢 | 例如數學超前、英語落後（Khan Kids 可以依主題調整程度） |
| 每日練習時間提醒 | 🟢 | 例如 15-20 分鐘後顯示「休息一下」（參考 PaGamO 的上限設計，但改成溫和提示、不強制） |
| 匯出／匯入進度碼 | ⏳ | 換裝置時用。因為沒有帳號，這是唯一的備份方式 |
| 2-3 個兄弟姊妹檔案（用頭像選） | ⏳ | Duolingo ABC 只有一個檔案被批評。localStorage 也做得到 |
| 隱藏某些區塊（例如只開數學） | ⏳ | Khan Kids 老師可以關掉著色和影片分頁 |
| 列印學習單、「在家試試看」觀察單 | ⏳ | 參考均一 OMO 學習單、Mystery Science；用 print CSS 即可 |
| 「跟爸爸媽媽說說看」討論卡 | ✅（自然科） | Mystery Science 的 DISCUSS 暫停卡；我們假設家長在旁邊陪 |
| 出版社順序對照（類康軒／翰林／南一） | ⏳ | 均一的做法。只提供「順序對照表」加通用主題名，不抄課本內容；設定放在家長頁，不要讓孩子看到 |
| 先修關係圖 | ⏳ | 因材網「知識結構」的家長版 |

> 🟡 **localStorage 的風險：** 清除瀏覽器資料就會全部消失，換裝置也帶不走。所以「匯出進度碼」雖然放在之後做，也不要拖太久。

---

## 7. 美術與 UI 套件推薦組合

> 以下授權都**以驗證結果為準**，只列出 verdict 為 keep 或 keep-with-caveat 的項目。
> 授權用語白話說明：
> - **MIT／ISC／Apache-2.0：** 可以自由使用，只要保留授權聲明檔。
> - **CC0：** 公共領域，什麼都不用做。
> - **OFL：** 字型專用授權，可以嵌入網頁，但不能單獨賣字型。
> - **CC BY：** 要標示出處。
> - **CC BY-SA：** 要標示出處，而且改過的東西也要用同樣授權釋出。

### 7.1 第一階段推薦組合（首選）

| 類別 | 推薦 | 授權（驗證後） | 為什麼 | 注意事項 |
|---|---|---|---|---|
| 設計 token（尺寸、圓角、陰影、動畫的共用變數） | **Open Props** | MIT ✅ keep | 只提供變數，不帶外觀，最容易做出奶油色加大圓角的風格；附有彈跳、淡入動畫，適合答對回饋 | GitHub 發版很少，要固定版本；只 import 需要的子檔 |
| 元件 | **自己寫一層小型 CSS** | 自有 | 需要的元件很少（大按鈕、題目卡、星星、進度條），自己寫最好控制 | 對話框優先用原生 `<dialog>` |
| 複雜互動元件（必要時才用） | **Web Awesome Free** | MIT ⚠️ keep-with-caveat | dialog、drawer 這類焦點管理和鍵盤操作不好自己寫；Web Components 不綁框架 | 免費和付費元件放在一起，用之前要逐一確認是 Free；Playful 主題要付費；預設 CDN 是 Font Awesome 的主機，請用 npm 安裝再透過 Vite 自己託管；只 import 需要的元件 |
| 題目和物件插圖 | **Microsoft Fluent Emoji（Flat／Color SVG）** | MIT ✅ keep | 圓潤溫暖，很適合數數題、英文單字圖卡；SVG 可以 inline 嵌入 | 更新很少；3D 版是大 PNG，要轉 WebP 或不用；建議直接從 GitHub 複製 SVG |
| 備用插圖 | **Noto Emoji** | Apache-2.0 ✅ keep | 寬鬆授權，網站上不用標示出處 | 漸層立體風格可能跟扁平場景不搭；旗幟在不同目錄，授權不同 |
| UI 元件圖與音效 | **Kenney（UI Pack、Interface Sounds、UI Audio、Music Jingles）** | CC0 ✅ keep | 答對、答錯、點擊、得星星的音效可以直接用，不用標示出處 | 偏遊戲風，建議挑扁平款；每個素材包內附的 License.txt 還是要確認一次；不能單獨使用 Kenney logo |
| 介面圖示 | **Tabler Icons** 或 **Lucide**（二選一） | Tabler：MIT ✅ keep；Lucide：ISC + 部分 MIT ✅ keep | 都很活躍（2026-11 仍有發版） | 預設線條偏細，給小孩用要加粗、放大；Lucide 要保留 ISC 和 MIT 兩段聲明 |
| 介面圖示（更童趣的替代） | **Phosphor Icons（Fill／Duotone）** | MIT ⚠️ keep-with-caveat | 實心和雙色風格比細線更圓潤、更適合小孩 | 更新變慢（core v2.0.8 是 2024-02，web v2.1.2 是 2025-03）；只載入需要的粗細，全載約多 3MB。與 Tabler／Lucide 只選一套 |
| 中文字型（介面、標題） | **jf open 粉圓／Huninn（用 Google Fonts 版）** | OFL-1.1 ⚠️ keep-with-caveat | 台灣圓體，童趣又好讀，含注音；Google Fonts 會自動只下載用到的字 | 有保留字型名稱：自己做子集化（只留用到的字）就算修改，必須改名。**直接用 Google Fonts 版最省事**；不要跟原版混用，兩者字型度量不同 |
| 中文字型（低年級題目、識字） | **芫荽 Iansui** | OFL-1.1 ⚠️ keep-with-caveat | 接近國小課本的手寫字形，筆順正確，含注音 | 完整字型有數 MB，必須做子集化；沒確認是否宣告保留名稱，保險做法是子集版改名；字形較細，不適合當大標題 |

> 🟡 **Noto Sans TC**（現有原型使用中）也在研究的推薦清單裡，但**這次的授權驗證沒有涵蓋它**。研究資料寫它是 Google Fonts、OFL 授權，建議之後補驗一次。

### 7.2 可用但不是首選（第二階段或特定情境）

| 類別 | 推薦 | 授權（驗證後） | 為什麼 | 注意事項 |
|---|---|---|---|---|
| UI 框架替代方案 | **daisyUI 5 + Tailwind CSS 4** | MIT ⚠️ keep-with-caveat | 主題很多（cupcake、caramellatte 接近暖色童趣）；有 rating 元件可直接當 0-3 星 | 等於整個專案改用 Tailwind 寫樣式，是很大的架構決定；不要跟其他 CSS 框架混用 |
| UI 框架（Material 風） | **Beer CSS** | MIT ✅ keep | 很輕（Brotli 壓縮後約 14.5 kB），不用建置步驟 | 外觀像 Android App，不像兒童網站；安裝範例附帶的 material-dynamic-colors 授權沒驗證 |
| UI 框架（中性） | **Bulma v1** | MIT ✅ keep | 純 CSS，用 CSS 變數換主題 | 外觀中性，要大量自訂；2025-04 之後沒發新版，要固定版本 |
| 設計參考（不引入） | **Khan Wonder Blocks**、**CZI EDS** | MIT ⚠️ keep-with-caveat | 可以參考教育產品的間距、狀態色、回饋設計 | 兩者都綁 React，**不能當依賴套件**；如果移植 token 數值，要保留 MIT 聲明；不能用它們的品牌 |
| 人物角色 | **Open Peeps／Humaaans** | CC0 ⚠️ keep-with-caveat | 可以組合出家長、老師角色 | 都是成人造型（黑白線稿或商務扁平風），不是兒童風；下載要經過 Gumroad 等平台。**長期建議自己畫專屬吉祥物 SVG** |
| emoji（需標示出處） | **Twemoji（jdecked 版）** | 圖像 CC BY 4.0、程式碼 MIT ⚠️ | 扁平簡潔 | 必須標示出處；請用 jdecked 分支（原 X 版已停止維護）；不要跟 Fluent 混用 |
| emoji（需標示出處 + ShareAlike） | **OpenMoji** | 圖像 CC BY-SA 4.0 ⚠️ | 線稿加平塗，容易改色 | 🟡 改色或合成進場景的圖可能都得用 CC BY-SA 釋出，會讓 repo 美術授權變複雜。只當備案，用的話保持獨立檔案、不修改 |
| 英文單字真人發音 | **Wikimedia Commons／Lingua Libre** | 逐檔不同（常見 CC BY-SA）⚠️ | 真人錄音，有美式和英式 | 每個檔案都要記錄作者和授權；音量和口音不一致；iPad 對 OGG 支援差，要轉 MP3（轉檔也算改作）。**第一階段先用瀏覽器 en-US 語音合成**，之後優先挑 CC0／CC BY 檔案，並用 `credits.json` 自動產生致謝頁 |
| 自然科音效（動物叫聲、雷聲） | **Freesound（只用 CC0）** | 逐檔不同 ⚠️ | 音效量大 | 排除 CC BY-NC 和 Sampling+；下載時記錄網址和授權當作證據（作者事後可以改授權）；要註冊帳號 |
| 動畫 | **LottieFiles + lottie-web** | 動畫是 Lottie Simple License（**不是開源授權**）、播放器 MIT ⚠️ | 現成慶祝動畫多 | 🟡 不符合「開源」要求，只能歸在「可接受但非開源」；repo 裡要分開註明授權；播放器約 250KB 以上。**建議第一階段不用**，改用 CSS／SVG 自己做 |

### 7.3 被淘汰的項目

| 項目 | 淘汰原因 |
|---|---|
| **Pico CSS** | 🔴 2026-10-04 已封存，官方宣布停止維護（授權本身沒問題） |
| **Shoelace** | 🔴 官方宣布結束（sunset）、repo 已封存；後繼者是 Web Awesome |
| **NES.css** | 🔴 實質上沒人維護；預設像素字只支援英文，中文像素字的授權未驗證；像素字對低年級閱讀不友善 |
| **Material Web（MWC）** | 🟡 官方標示進入維護模式、等待新維護者，新專案長期風險高 |
| **unDraw** | 🔴 自訂授權禁止「打包轉發」和「拿來訓練 AI」，放進公開 GitHub repo 很可能違反條款；風格也是成人職場插畫 |
| 任何 NC（禁止商用）或 ND（禁止改作）素材 | 🔴 跟公開 repo、自由使用的方向不相容 |

### 7.4 授權管理（建議第一天就做）

- 程式碼用 MIT。素材各自保留原授權，**不要把素材歸在 MIT 底下**。
- 在 repo 建立一份素材授權清單（例如 `ASSETS-LICENSES.md` 或 `THIRD_PARTY_NOTICES`），並在網站加一個致謝頁。
- 所有平台研究對象（Khan、BrainPOP、Mystery Science、PhET 等）的美術、角色、內容**都不是開放授權**。我們只借互動模式，不借素材、截圖、題目文字。
- **PhET 的特例：** 它的模擬程式本身是 CC BY 4.0，可以原封不動用 iframe 嵌入，並標示出處，可當作小五、小六的延伸連結。但它的原始碼是 GPLv3，**絕對不要複製進 MIT repo**，否則整個 repo 會被要求改成 GPL。PhET 名稱和 logo 是商標，不包含在授權內。

---

## 8. 對現有設計文件的具體修改建議

### 8.1 第一階段應納入

| # | 修改項目 | 類型 | 原因 |
|---|---|---|---|
| 1 | 加一個「點我開始」首屏，用來解鎖聲音；每個模板固定放 🔊 重播鈕 | 🔴 現在就該補 | 不做的話，瀏覽器可能擋掉語音，孩子聽不到題目 |
| 2 | 首頁改成「大繼續鈕 + 年級／學期／單元圖卡」兩個入口 | 🟢 | 低年級不用選，家長好找 |
| 3 | 單元資料結構加欄位：`id`（固定 ID）、`curriculum`（108 代碼）、`grade`、`semester`、`prereqs` | 🟡 越晚加越難改 | 後面的家長頁、先修建議、出版社對照都要靠這些欄位 |
| 4 | 題目資料加 `hints[]`、`boost[]`、`rationale` | 🟡 越晚加越難改 | 答錯補救流程靠這些欄位 |
| 5 | 把單元固定節奏寫成模板（暖身 → 講解 → 跟著做 → 自己做 5 題 → 錯題重做 → 過關） | 🟢 | 擴充到 6 個年級 × 3 科時，內容品質一致 |
| 6 | 答錯三段處理：提示 → 補救 → 正解，回到原題 | 🟢 | 學習效果的核心 |
| 7 | 文字可點朗讀、逐字高亮；英文用 en-US 並提供慢速 | 🟢 | 低年級和英語科的基本需求 |
| 8 | 閒置手指提示、任務開始前的示範動畫、首次操作教學 | 🟢 | 便宜好做，解決「不知道要做什麼」 |
| 9 | 精熟改成「只升不降」，保留 0-3 星 | 🟢 | 避免挫折感 |
| 10 | 快速連錯就重播提示 | 🟢 | 防止亂猜 |
| 11 | 音效靜音開關，跟朗讀開關分開 | 🟢 | 家長抱怨點；也適合教室多台裝置同時使用 |
| 12 | 簡化版家長專區：國字閘門、星星與錯題、108 對照、「需要陪看」提示、解鎖單元 | 🟢 | 不需要後端就能建立家長信任 |
| 13 | 自然科加「預測 → 觀察 → 解釋」模板、問題式標題、「跟爸媽說說看」卡 | 🟢 | 自然科的核心模板 |
| 14 | 決定美術組合：Open Props、Fluent Emoji、Kenney 音效、一套圖示、Huninn（Google Fonts） | 🟢 | 授權乾淨，先定案可避免之後換 |
| 15 | 建立素材授權清單與致謝頁 | 🟡 越晚補越難追 | 素材一多就很難回頭追查授權 |
| 16 | 全站視覺字典：同一個概念固定用同一個顏色和圖示 | 🟢 | PhET 發現孩子會把換了樣子的東西當成不同的東西 |

### 8.2 留到之後

| 項目 | 何時考慮 |
|---|---|
| 間隔複習／每日暖身（2-3 題舊題） | 單元數量夠多之後 |
| 跨單元錯題本 | 同上 |
| 先修單元建議、家長版先修關係圖 | 有 2 個年級以上內容時 |
| 學習地圖點亮、自訂角色、收集裝飾 | 有專屬吉祥物美術之後 |
| 「找起點」分級小測驗 | 有多個年級之後 |
| 出版社順序對照（類康軒／翰林／南一） | 家長有需求時；只做順序表 |
| 匯出／匯入進度碼、兄弟姊妹檔案 | 第二階段優先項目 |
| 離線使用（service worker，讓網站沒網路也能用） | 第二階段 |
| 可列印學習單、證書 | 第二階段 |
| 英文真人發音音檔 | 先用語音合成；之後再逐檔整理 CC0／CC BY 錄音 |
| 自然發音（phonics）音素音檔 | 英語科要做拼讀時 |
| 「自由玩」沙盒頁（數棒、積木） | 有餘力時 |
| 嵌入 PhET 模擬當延伸 | 做到小五、小六自然時 |

### 8.3 明確不做

- 🔴 發音評分（語音辨識打分）。可改成「聽示範 → 錄自己的聲音 → 放在一起對照」，不打分；麥克風權限只在活動開始時才要求。
- 🔴 登入帳號、廣告、追蹤、付費、商店、排行榜、對戰。
- 🔴 在孩子的畫面顯示課綱代碼、下拉選單、資料表格。

---

## 9. 參考來源

> 以下網址都來自本次研究資料，沒有額外新增。研究標註「未查證」的項目，上文已盡量註明。

**兒童學習平台**
- Khan Academy Kids：https://sites.google.com/khanacademy.org/khanacademykids/getting-students-into-the-app/three-ways-to-play ／ https://khankids.zendesk.com/hc/en-us/articles/4914881968283-Our-Accessibility-Statement ／ https://www.commonsensemedia.org/app-reviews/khan-academy-kids
- Khan Academy 精熟系統：https://support.khanacademy.org/hc/en-us/articles/360007253831-What-is-self-paced-Mastery ／ https://support.khanacademy.org/hc/en-us/articles/5548760867853
- IXL SmartScore：https://www.ixl.com/materials/SmartScore_Guide.pdf ／ https://www.change.org/p/eliminate-the-stressful-smartscore-system-in-ixl-learning
- Zearn：https://about.zearn.org/how-zearn-math-works ／ https://help.zearn.org/hc/en-us/articles/236239188
- DragonBox：https://en.wikipedia.org/wiki/DragonBox ／ https://www.gamesforyoungminds.com/blog/2018/3/16/dragonbox-numbers
- Prodigy：https://fairplayforkids.org/pf/prodigy/ ／ https://prodigygame.com/blog/prodigy-grade-override-tool
- Duolingo ABC：https://apps.apple.com/app/id1440502568 ／ https://blog.duolingo.com/a-good-read-building-duolingo-abc-for-android/
- Teach Your Monster to Read：https://www.teachyourmonster.org/ ／ https://childrenandmedia.org.au/app-reviews/apps/teach-your-monster-to-read
- Starfall：https://teach.starfall.com/guides/kindergarten/reading
- NN/g 兒童認知與易用性：https://www.nngroup.com/articles/kids-cognition/
- Lingokids：https://childrenandmedia.org.au/app-reviews/apps/lingokids
- PBS KIDS：https://www.educatorstechnology.com/2026/09/pbs-kids-games-review.html
- PhET：https://phet.colorado.edu/publications/PhET%20Look%20and%20Feel.pdf ／ https://arxiv.org/pdf/1306.6544 ／ https://phet.colorado.edu/en/licensing/html
- Mystery Science：https://support.mysteryscience.com/hc/en-us/articles/38300164634003-How-much-instructional-time-do-I-need
- BrainPOP Jr.：https://www.commonsensemedia.org/website-reviews/brainpop-jr ／ https://educators.brainpop.com/?p=38656
- National Geographic Kids：https://kids.nationalgeographic.com/
- ScratchJr：https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2018/02/scratchjr_idc_2013.pdf ／ https://github.com/LLK/scratchjr/blob/develop/LICENSE

**台灣平台**
- 均一：https://www.junyiacademy.org/topics/math-1 ／ https://www.cna.com.tw/news/ahel/201701010044.aspx
- 因材網：https://adl.edu.tw/ ／ https://www.cw.com.tw/article/5118737
- PaGamO：https://www.hsps.hc.edu.tw/uploads/1588555681939XE3gd2jY.pdf ／ https://uptogo.com.tw/?p=296184
- 酷英網：https://www.coolenglish.edu.tw/ ／ https://www.cna.com.tw/news/ahel/202311260031.aspx
- 教育大市集：https://market.cloud.edu.tw/

**UI 套件**
- Open Props：https://github.com/argyleink/open-props
- Web Awesome：https://github.com/shoelace-style/webawesome ／ https://webawesome.com/docs/
- daisyUI：https://github.com/saadeghi/daisyui
- Beer CSS：https://github.com/beercss/beercss
- Bulma：https://github.com/jgthms/bulma
- Pico（已封存）：https://github.com/picocss/pico
- Shoelace（已結束）：https://github.com/shoelace-style/shoelace
- NES.css：https://github.com/nostalgic-css/NES.css
- Material Web：https://github.com/material-components/material-web
- Wonder Blocks：https://github.com/Khan/wonder-blocks
- CZI EDS：https://registry.npmjs.org/@chanzuckerberg/eds/latest

**美術、字型、音效**
- Kenney：https://kenney.nl/support
- Fluent Emoji：https://github.com/microsoft/fluentui-emoji
- Noto Emoji：https://github.com/googlefonts/noto-emoji
- OpenMoji：https://github.com/hfg-gmuend/openmoji
- Twemoji（jdecked）：https://github.com/jdecked/twemoji
- Open Peeps：https://www.openpeeps.com/ ／ Humaaans：https://www.humaaans.com/
- Tabler Icons：https://github.com/tabler/tabler-icons
- Phosphor：https://github.com/phosphor-icons/core
- Lucide：https://github.com/lucide-icons/lucide
- 粉圓：https://github.com/justfont/open-huninn-font ／ https://fonts.google.com/specimen/Huninn
- 芫荽：https://github.com/ButTaiwan/iansui
- Wikimedia Commons 發音：https://commons.wikimedia.org/wiki/File:En-us-apple.ogg
- Freesound：https://freesound.org/help/faq/
- LottieFiles 授權：https://lottiefiles.com/page/license
- unDraw 授權：https://undraw.co/license