// 固定種子的亂數產生器。
// 裝飾用的位置、顏色（例如紙花）用這裡的 mulberry32，不呼叫 Math.random，
// 這樣現有流程的 Math.random 呼叫次數與順序不會變，對照測試才會一致。

/** 回傳一個函式，每次呼叫給出 [0, 1) 之間的數；同一個種子永遠得到同一串數字。 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 暫時把 Math.random 換成固定種子的版本，執行 fn，結束後一定還原（fn 丟錯也會還原）。
 * 回傳 fn() 的結果。給考試出卷用：同一個種子出同一份卷。
 */
export function withSeed(seed, fn) {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}
