# Drawboard — 带登录自动保存的 Excalidraw

> 规划 v1 · 2026-10-23 · 解决原版 excalidraw.com 的核心痛点：只能存浏览器本地、清缓存就丢、找不到历史

## 1. 产品定位

一个打开就能画、登录后自动云端保存的手绘白板。体验对齐原版 Excalidraw（无限画布、手绘风、形状/箭头/文字/自由画笔），补齐原版免费版缺的：

- 账号登录
- 云端自动保存（不用手动导文件）
- 我的画板列表（历史找回、重命名、复制、删除）
- 后续：分享链接、协作（v2）

不做：付费墙、复杂团队空间（MVP 先个人版跑通）

## 2. 技术选型（推荐方案 A，已核查）

| 方案 | 做法 | 优劣 |
|---|---|---|
| **A. 官方组件（推荐）** | Next.js + `@excalidraw/excalidraw` 官方 npm 包（MIT 开源） | 1:1 还原原版全部画图能力，开发最快；我们只做账号+保存层 |
| B. tldraw | Next.js + tldraw SDK | UI 更现代，但不是手绘风，且商用授权要注意 |
| C. 全自研 Canvas | Konva/Fabric 从零搭 | 周期长、体验难追平原版，不选 |

**定版 A 的理由**：zz 要的是“一个这样的网站”，核心诉求是画布本身别缩水 + 登录保存。官方组件正好把画布问题清零，我们的精力全花在账号和保存上。

### 技术栈（复用 zz 现有栈，和 AgentFlow/photo-studio 一致）

- 前端/全栈：Next.js 15 (App Router) + React 19 + TypeScript
- 画布：@excalidraw/excalidraw
- 数据库/登录/存储：Supabase（Postgres + Auth + Storage）
  - Auth：仅 Google 登录（2026-10-23 zz 改定，先简化）
  - 不用自建 scrypt 用户表——Supabase Auth 现成、带 RLS，省一周
- 部署：Vercel（同其他项目）
- 样式：纯白 + #7C3AED 紫（zz 锁定设计系统，画布外壳/列表页/登录页遵循，白板内保持 Excalidraw 原生主题）

## 3. 核心机制：自动保存

这是本产品的命门，设计如下：

```
画布变化 onChange
  → 防抖 1.5s（停止操作后触发）
  → 序列化 scene：elements + appState(精简) + files(图片资源)
  → PUT /api/drawings/[id] 写入 Supabase
  → 顶部状态：正在保存… → 已保存 HH:MM:SS / 保存失败(自动重试3次)
```

细节：
- 状态必须可见且可区分（借鉴 AgentFlow 教训）：`已保存` / `保存中` / `未保存改动` / `保存失败` 四态文案+颜色分开，不让用户猜是不是存上了
- 游客模式：未登录也能画，存 localStorage 兜底；登录后弹窗提示“一键导入本地画板到云端”，不丢稿
- 版本兜底：每次保存同时在 `drawing_versions` 留最近 20 个快照（防误清空画布，可回滚）— MVP 先只存，不做 UI，v1.1 加回滚入口
- 缩略图：保存时用官方 `exportToBlob` 生成 PNG 缩略图存 Supabase Storage，列表页用它做封面，不用打开就知道是哪张

## 4. 数据模型（Supabase SQL 一次建好）

```sql
-- 画板主表
drawings
  id uuid pk
  owner_id uuid -> auth.users
  title text default '未命名画板'
  scene jsonb          -- { elements, appState, files }
  thumbnail_path text  -- storage 路径
  created_at / updated_at timestamptz

-- 版本快照（自动保存兜底）
drawing_versions
  id uuid pk
  drawing_id uuid -> drawings
  scene jsonb
  created_at timestamptz

-- RLS：所有表 owner_id = auth.uid() 才能读写，他人不可见
-- Storage 桶：thumbnails（私有，signed url 读取）
```

## 5. 页面结构

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 落地页 | 一句话定位 + 「开始画」CTA + 登录入口，不做营销长页 |
| `/login` | 登录 | 仅 Google 登录 |
| `/boards` | 我的画板 | 卡片网格（缩略图/标题/更新时间），新建/重命名/复制/删除，搜索 |
| `/board/[id]` | 画布页 | 全屏 Excalidraw + 顶栏：标题(可编辑)/保存状态/导出PNG·SVG/分享(禁用占位)/返回列表 |
| `/board/new` | 新建 | 建空记录后跳转 /board/[id]，保证第一笔就有云端 id 可存 |

访客路径：`/` → 开始画 → 直接进临时画布（本地存）→ 顶部横幅“登录后自动保存到云端”。

## 6. MVP 范围与排期

**v1（首版，目标当天可跑通主链路）**
- [ ] Next.js 脚手架 + Excalidraw 组件接入（动态 import，ssr:false）
- [ ] Supabase 迁移 SQL：drawings + versions + RLS + thumbnails 桶
- [ ] 登录：仅 Google OAuth（Supabase Auth）
- [ ] 画板 CRUD + 列表页
- [ ] 自动保存（防抖+状态指示+失败重试）+ 游客本地存/登录导入
- [ ] 导出 PNG/SVG（官方自带，接入菜单即可）
- [ ] Vercel 部署

**v1.1**
- [ ] 版本历史回滚 UI
- [ ] 分享只读链接（生成 token，他人免登录看）
- [ ] 模板：流程图/思维导图/线框图空白模板一键起稿

**v2（看使用情况再定）**
- [ ] 实时协作（官方 collab 需自建 socket 服务，成本另计）
- [ ] 文件夹/标签整理

## 7. 仓库与启动步骤

⚠️ 已知限制（2026-10-08 实测）：Muse 的 GitHub 集成没有建仓权限（403），仓库要 zz 本人在 GitHub 建。

1. zz 建私有仓库（建议名见下）→ 在 https://github.com/apps/meta-muse-ai/installations/new 给 Muse 授权该仓库
2. 我方：本地脚手架已先搭好 → 授权后一次性推送 → zz 在 Supabase 建项目跑迁移、Vercel 导入仓库、填 env（SUPABASE_URL / ANON_KEY / SERVICE_ROLE / Google OAuth 回调）
3. 联调：登录 → 新建 → 画 → 看到“已保存” → 刷新/换浏览器登录 → 画板还在 = 主链路通

## 8. 待 zz 拍板（仅 2 项）

1. 仓库名：`drawboard`（推荐） / `sketchboard` / `zz-draw`
2. 登录方式：已定版（2026-10-23）仅 Google 登录
