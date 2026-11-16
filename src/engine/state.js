// 引擎共用的可變狀態。
// 舊檔用全域變數 runId、muted、unlocked；搬成模組後，其他模組不能直接改別人的 let 變數，
// 所以集中放在 S 物件裡，一律讀寫 S.runId、S.muted、S.unlocked。
// - runId：每次換場景、換題目、離開單元都會 +1；舊的動畫看到 id 不一致就丟 ABORT 停下來。
// - ABORT：用來中止動畫的特殊例外，catch 到它時不當成錯誤。
export const ABORT = {};
export const S = { runId: 0, muted: false, sfxMuted: false, unlocked: false };
