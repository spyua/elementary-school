// 一上數學學期包：12 個單元的場景與題型、2 個總複習，以及期中考、期末考的藍圖。
// 名稱、圖示、說明等中繼資料只放在 catalog.js；打開單元時用 { ...meta, ...body } 合併。
// 匯入這個模組時，會順便把所有題型登記到練習引擎。
import { registerTypes } from '../../../engine/practice.js';
import { shuffle } from '../../../engine/util.js';
import { unitLine, unitCurve, unitThick, unitAlign, TYPES as LENGTH_TYPES } from './length.js';
import { unitSplit, TYPES as SPLIT_TYPES } from './split.js';
import { unitNum10, unitOrder, TYPES as NUMBER_TYPES } from './numbers.js';
import { unitShape, TYPES as SHAPE_TYPES } from './shapes.js';
import { unitAdd, unitSub, TYPES as ADDSUB_TYPES } from './addsub.js';
import { unitNum30, unitTime, TYPES as NUM30TIME_TYPES } from './num30time.js';
import { MID_BLUEPRINT, FINAL_BLUEPRINT, EXAM_TYPES } from './exam.js';

for (const types of [LENGTH_TYPES, SPLIT_TYPES, NUMBER_TYPES, SHAPE_TYPES, ADDSUB_TYPES, NUM30TIME_TYPES]) {
  registerTypes(types);
}
// 考試專用題型：只登記到題型表給考試藍圖用，不加進任何單元的 practice 陣列。
registerTypes(EXAM_TYPES);

// 順序和舊檔 UNITS 相同；review-all 依這個順序合併題型，亂數結果才會和舊檔一致。
const bodies = {
  num10: unitNum10,
  line: unitLine,
  curve: unitCurve,
  thick: unitThick,
  align: unitAlign,
  order: unitOrder,
  split: unitSplit,
  shape: unitShape,
  add: unitAdd,
  sub: unitSub,
  num30: unitNum30,
  time: unitTime,
};

const reviews = {
  'review-length': {
    queue: () => shuffle(['classify', 'rope', 'box', 'box', 'curve3', 'curve3', 'thick2', 'thick3', 'thick3', 'align']),
  },
  'review-all': {
    queue: () => shuffle([...new Set(Object.values(bodies).flatMap(u => u.practice))]).slice(0, 12),
  },
};

// 期中考、期末考：只放藍圖，出卷與作答由 src/engine/exam.js 處理。
const exams = {
  'exam-mid': { blueprint: MID_BLUEPRINT },
  'exam-final': { blueprint: FINAL_BLUEPRINT },
};

export default { bodies, reviews, exams };
