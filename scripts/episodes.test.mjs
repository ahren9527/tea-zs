// 每期结构自检（同 npm run check:ep）：有错误就让 npm test 失败
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAll } from "./check-episode.mjs";

test("每一期的节拍结构、口播分段与时间表一致", () => {
  const errors = checkAll().flatMap(({ n, errors }) => errors.map((e) => `第${n}期 ${e}`));
  assert.deepEqual(errors, []);
});
