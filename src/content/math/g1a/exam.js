// 一上數學的期中考、期末考藍圖（每份 20 題，每題 5 分）。
// 每一區對應一章，每個 slot 出一題，從清單裡隨機挑一個題型（出卷邏輯在 src/engine/paper.js）。
//
// 這一版只用現有的練習題型。設計文件 6.6 裡的考試專用題型（ex 開頭）會在下一步加入；
// 原本只放 ex 題型的 slot，暫時用同一章的其他題型代替。
// icon 是該區主題圖（public/emoji/ 的檔名）。

export const MID_BLUEPRINT = {
  key: 'exam-mid', title: '期中考', theme: 'forest',
  zones: [
    { chapter: '一、10 以內的數', name: '蘋果果園', icon: 'apple',
      slots: [['n10count'], ['n10match', 'n10frame'], ['n10corr'], ['n10frame', 'n10match']] },
    { chapter: '二、比長短', name: '彩虹橋', icon: 'rainbow',
      slots: [['classify'], ['rope', 'box', 'curve3'], ['thick2', 'thick3'], ['align']] },
    { chapter: '三、順序與多少', name: '動物列車', icon: 'locomotive',
      slots: [['ordSeq'], ['ordNth', 'ordCardinal'], ['ordMore', 'ordDiff'], ['ordDiff', 'ordCardinal']] },
    { chapter: '四、分與合', name: '糖果屋', icon: 'lollipop',
      slots: [['bond'], ['picture', 'pair'], ['ten', 'wrong'], ['wrong', 'pair']] },
    { chapter: '五、認識形狀', name: '積木城堡', icon: 'castle',
      slots: [['shpName', 'shpClassify'], ['shpRoll', 'shpTrace'], ['shpCount'], ['shpClassify', 'shpName']] },
  ],
};

export const FINAL_BLUEPRINT = {
  key: 'exam-final', title: '期末考', theme: 'park',
  zones: [
    { chapter: '六、10 以內的加法', name: '氣球廣場', icon: 'balloon',
      slots: [['addPic'], ['addEq'], ['addPickEq'], ['addMissing'], ['addPic', 'addEq']] },
    { chapter: '七、10 以內的減法', name: '餅乾工廠', icon: 'cookie',
      slots: [['subPic'], ['subEq', 'subMissing'], ['subPickEq', 'subStory'], ['subStory', 'subPickEq'], ['subMissing', 'subEq']] },
    { chapter: '八、30 以內的數', name: '水族館', icon: 'fish',
      slots: [['n30bundle', 'n30tens'], ['n30seq'], ['n30cmp'], ['n30tens', 'n30bundle'], ['n30seq', 'n30cmp']] },
    { chapter: '九、時間', name: '鐘樓', icon: 'alarm-clock',
      slots: [['timRead'], ['timHalfTrap'], ['timOrder', 'timEarlier'], ['timEarlier', 'timOrder'], ['timRead', 'timHalfTrap']] },
  ],
};
