// 出題：依藍圖（blueprint）挑題型、區內打亂、每題配一個種子。
// 純函式，不碰畫面。亂數來源由呼叫端傳入（預設 Math.random），測試時可以傳固定種子的版本。
//
// 藍圖格式：{ zones: [{ chapter?, name?, icon?, slots: [['題型A', '題型B'], ...] }, ...] }
// - 每個 slot 出一題，從清單裡挑一個題型。
// - 區與區的順序固定（由淺到深）；同一區內的題目順序打亂。
// - 所有 slot 加起來必須剛好 20 個（每題 5 分，滿分 100）。

export const PAPER_SIZE = 20;

/**
 * 檢查藍圖：zones 的 slots 加總必須是 20，每個 slot 至少一個題型。
 * 有傳 gen（題型登記表）時，也檢查每個題型都登記過。不合法就丟錯誤。
 */
export function validateBlueprint(bp, gen) {
  if (!bp || !Array.isArray(bp.zones) || !bp.zones.length) throw new Error('藍圖沒有 zones');
  let total = 0;
  bp.zones.forEach((z, zi) => {
    if (!Array.isArray(z.slots) || !z.slots.length) throw new Error(`第 ${zi + 1} 區沒有 slots`);
    z.slots.forEach((slot, si) => {
      if (!Array.isArray(slot) || !slot.length) throw new Error(`第 ${zi + 1} 區第 ${si + 1} 格沒有題型`);
      if (gen) {
        for (const t of slot) {
          if (!Object.prototype.hasOwnProperty.call(gen, t)) throw new Error(`題型沒有登記：${t}`);
        }
      }
    });
    total += z.slots.length;
  });
  if (total !== PAPER_SIZE) throw new Error(`藍圖共有 ${total} 題，必須剛好 ${PAPER_SIZE} 題`);
}

/**
 * 依藍圖出卷，回傳 20 筆 { type, seed, zone }。
 * 同一次考試中，同一題型盡量只出現一次：挑題型時先排除已經挑過的，全部挑過才允許重複。
 * seed 是 0～2³²−1 的整數，建題時交給 withSeed()，同一個種子一定得到同一道題。
 */
export function buildPaper(bp, rand = Math.random) {
  validateBlueprint(bp);
  const used = new Set();
  const out = [];
  bp.zones.forEach((z, zone) => {
    const types = z.slots.map(slot => {
      const fresh = slot.filter(t => !used.has(t));
      const pool = fresh.length ? fresh : slot;
      const type = pool[Math.floor(rand() * pool.length)];
      used.add(type);
      return type;
    });
    // 區內打亂（Fisher–Yates）
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    for (const type of types) out.push({ type, seed: Math.floor(rand() * 4294967296), zone });
  });
  return out;
}
