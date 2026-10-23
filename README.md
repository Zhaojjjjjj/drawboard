# Drawboard

带登录自动保存的手绘白板 — 解决原版 Excalidraw 只能存本地、清缓存就丢的问题。

- 画布：官方 `@excalidraw/excalidraw`（MIT），体验与原版一致
- 登录：Supabase Auth（仅 Google 登录）
- 自动保存：停止操作 1.5s 后云端保存，顶部实时显示 已保存 / 保存中 / 未保存 / 保存失败
- 游客可直接画（本地兜底），登录后同步云端
- 画板列表带自动生成的封面缩略图（保存时生成，需跑 002 存储策略 SQL）

规划全文见同级 `../PLAN.md`（本地）/ 仓库内 `docs/PLAN.md`（推送时带上）。

## 本地启动
```bash
npm install
cp .env.example .env.local  # 填 Supabase 三项
npm run dev
```
在 Supabase SQL Editor 执行 `supabase/migrations/001_drawings.sql` 后即可使用。
