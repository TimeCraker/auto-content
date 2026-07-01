<div align="center">

<img src="https://raw.githubusercontent.com/TimeCraker/auto-content/main/.github/banner.svg" alt="Auto Content Banner" width="100%"/>

# 🚀 Auto Content · 流量引擎

**自用 AI 文案自动流 · 一键产出小红书 / 知乎 / 闲鱼三平台草稿与封面图**

[![CI](https://github.com/TimeCraker/auto-content/actions/workflows/ci.yml/badge.svg)](https://github.com/TimeCraker/auto-content/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-≥20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-f59e0b.svg)](https://github.com/TimeCraker/auto-content/pulls)

> **本项目仅生成草稿与封面图，所有内容须人工审核后手动发布。**  
> 流水线: 抓热榜 → AI 生成 → 渲染封面 → 草稿落库 → 人工发布

</div>

---

## 📑 目录

- [✨ 核心能力](#-核心能力)
- [🏗️ 架构总览](#️-架构总览)
- [⚡ 快速开始](#-快速开始)
- [🔧 流水线命令](#-流水线命令)
- [🗂️ 项目结构](#-项目结构)
- [🛠️ 技术栈](#-技术栈)
- [🗺️ 路线图](#-路线图)
- [📜 License](#-license)

---

## ✨ 核心能力

<table>
<tr>
<td width="50%">

### 🔥 热榜抓取
- 多平台并发抓取（小红书 / 知乎 / 闲鱼）
- Cheerio 解析 + Puppeteer 兜底 JS 渲染
- 趋势打分 + 去重，存为 Markdown 卡片

</td>
<td width="50%">

### 🤖 AI 草稿生成
- 多 LLM Provider 适配（OpenAI 兼容接口）
- 平台风格 prompt 模板：种草 / 长文 / 卖货三套
- 标题党过滤、敏感词检查、可控字数

</td>
</tr>
<tr>
<td>

### 🎨 封面图渲染
- HTML 模板 → Playwright/Puppeteer 截图
- 9 套主题色板，字距/留白/版式自动适配
- 一键产出 1080×1440 / 1080×1080 双规格

</td>
<td>

### 📅 周更流水线
- `weekly-pipeline.ts` 一键串联：抓 → 写 → 出图
- Cron 友好，支持断点续跑
- 输出结构化 JSON + Markdown 双格式

</td>
</tr>
</table>

---

## 🏗️ 架构总览

<div align="center">

<img src="https://raw.githubusercontent.com/TimeCraker/auto-content/main/.github/architecture.svg" alt="Auto Content Architecture" width="100%"/>

</div>

**数据流**: `热榜源 → Crawler → Trends DB → Generator (LLM) → Drafts → Renderer → Cover Images → Review Queue`

---

## ⚡ 快速开始

### 1. 克隆 & 安装

```bash
git clone https://github.com/TimeCraker/auto-content.git
cd auto-content
npm ci
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，至少需要：
#   OPENAI_API_KEY      - LLM Provider Key
#   OPENAI_BASE_URL      - OpenAI 兼容服务地址
#   CRAWL_TARGETS        - json 数组，启用哪些平台
```

### 3. 启动 Web 工作台

```bash
npm run dev
# 同时拉起 Vite 前端 (localhost:5173) + Express 后端 (localhost:8787)
```

打开浏览器访问 `http://localhost:5173` 即可看到草稿工作台。

---

## 🔧 流水线命令

| 命令 | 作用 | 适用场景 |
|------|------|----------|
| `npm run crawl` | 抓取最新热榜 → `input/trends.json` | 每日早晨跑 |
| `npm run generate` | 基于 trends 生成草稿 → `output/drafts/` | 中午人工挑选 |
| `npm run images` | 草稿 → 封面图 → `output/images/` | 下午批量出图 |
| `npm run weekly` | 一键跑完 crawl → generate → images | 周末批量产出 |
| `npm run dev:web` | 只起 Vite 前端 | UI 调试 |
| `npm run dev:server` | 只起 Express 后端 | API 调试 |

---

## 🗂️ 项目结构

```
auto-content/
├── .github/
│   ├── banner.svg            # 仓库封面横幅
│   ├── architecture.svg      # 架构图
│   └── workflows/ci.yml      # GitHub Actions
├── src/                      # React + Vite 前端
│   ├── App.tsx               # 工作台主页
│   ├── main.tsx
│   └── index.css
├── server/                   # Express 后端
│   └── index.ts              # API + 静态托管
├── scripts/                  # 流水线脚本（可独立执行）
│   ├── crawl-trends.ts       # 热榜抓取
│   ├── generate-drafts.ts    # AI 草稿生成
│   ├── to-image.ts           # 渲染封面图
│   ├── weekly-pipeline.ts    # 周更编排
│   └── lib/                  # 共享工具
├── input/                    # 抓取输入（git 忽略）
├── output/                   # 产出物（git 忽略）
├── templates/                # 封面 HTML 模板
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ 技术栈

<div align="center">

| 领域 | 选型 | 理由 |
|------|------|------|
| 前端 | **React 18 + Vite 5** | 启动快、HMR 强、产物小 |
| 后端 | **Express 4 + TS** | 轻、稳、生态广 |
| 抓取 | **Cheerio + Puppeteer** | 静态站 cheerio，JS 渲染站 puppeteer |
| AI | **OpenAI 兼容 SDK** | 一行切到 DeepSeek / SiliconFlow / 智谱 |
| 渲染 | **Puppeteer** | HTML→PNG 跨端一致 |
| Lint | **ESLint + TS** | 静态检查 |
| CI | **GitHub Actions** | 免费、私有仓库也跑 |

</div>

---

## 🗺️ 路线图

- [x] 三平台热榜抓取 + 去重
- [x] AI 草稿生成（OpenAI 兼容）
- [x] 封面图渲染（9 套主题）
- [x] Web 工作台
- [x] GitHub Actions CI
- [ ] 抖音 / 视频号拓展
- [ ] 草稿评分模型（自动筛掉低质）
- [ ] 封面 A/B 测试
- [ ] 多账号矩阵管理

---

## 📜 License

本项目基于 **MIT License** 开源 — 详见 [LICENSE](LICENSE)。

<div align="center">

**⭐ 觉得有用就 star 一下 · 这是对独立开发者最大的鼓励 ⭐**

</div>
