/**
 * 正上茶舍角色库（固定资产，各期共用）。各期一律从这里取，不要在 epNN 里重画小正。
 * - 小正（正面）  drawXiaozheng(ctx, height, state) · xiaozhengIdle(frame, seed)
 * 用法与姿势一览见 docs/小正.md。
 */
export { drawXiaozheng, xiaozhengIdle, XZ_COLORS, type XzExpr, type XzPose, type XzState } from "./xiaozheng";
