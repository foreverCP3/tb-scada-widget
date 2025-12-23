# TB SCADA Widget

## 项目概述

A SCADA/HMI widget for ThingsBoard, powered by FUXA rendering engine.

为 ThingsBoard 平台开发的工业组态 SCADA Widget，基于 FUXA 渲染引擎。

## 核心原则

### 1. 直接复制 FUXA 源码

**重要**: 我们采用直接复制 FUXA 源码的策略，仅移除 Angular 依赖，不裁剪任何功能。

- **不要重写**: 直接复制 FUXA 的核心代码
- **不要简化**: 保留所有功能和性能优化
- **最小改动**: 只移除 Angular 特定的装饰器和依赖注入

### 2. UI 框架选择

**使用 Material Components Web (MDC Web)** - Google 官方 Material Design 实现，与 ThingsBoard Angular Material 风格完全一致。

```html
<!-- MDC Web 依赖 -->
<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet">
<script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"></script>
```

### 3. Angular 依赖处理

需要移除/替换的 Angular 特性：

```typescript
// 移除这些装饰器
@Component, @Injectable, @Input, @Output, @ViewChild

// 替换 EventEmitter
import { EventEmitter } from '@angular/core';  // 移除
import { EventEmitter } from './lib/event-emitter';  // 使用自定义实现

// 替换依赖注入
constructor(private service: SomeService) { }  // 移除
init(service: SomeService) { this.service = service; }  // 显式传递

// 替换生命周期
ngOnInit() { }  →  init() { }
ngOnDestroy() { }  →  destroy() { }
```

### 4. 开源工具
如果使用到了开源工具，尽量使用开源工具，不要自己去实现，比如 rxjs等。
我们的目标是脱离 angular，但是一些特性如果已经有开源的脱离了 angular 的工具可以实现，就优先使用。

### 5. 注释
- 注释掉的代码需要保留。
- 注释可以适当精简，只保留主要的注释，要中文。

## 完整迁移计划

详见 `docs/FULL_MIGRATION_PLAN.md`

### 里程碑概览

| 里程碑 | 内容 | 完成 TODO | 累计时间 | 验证方式 |
|--------|------|-----------|----------|----------|
| **M1** | 最小可用 View | V1-V8 | 8.5 天 | 本地 HTML |
| **M2** | 完整 View + TB | V1-V11 | 11 天 | TB Widget |
| **M3** | 最小可用 Editor | V1-V6 + E1-E4 | 12 天 | 本地 HTML |
| **M4** | 完整 Editor + TB | 全部 | 21 天 | TB Widget |

### View 模式 TODO (11 天)

| TODO | 内容 | 时间 |
|------|------|------|
| V1 | 事件系统 (EventEmitter) | 0.5 天 |
| V2 | 数据模型层 (hmi.ts, device.ts) | 0.5 天 |
| V3 | 工具函数层 (utils.ts, svg-utils.ts) | 0.5 天 |
| V4 | 图元基类 (gauge-base.ts) | 0.5 天 |
| V5 | 21 种图元组件 | 2 天 |
| V6 | 图元管理器 (gauges-manager.ts) | 1.5 天 |
| V7 | HMI 服务 (hmi-service.ts) | 1 天 |
| V8 | 视图渲染器 (fuxa-view.ts) | 2 天 |
| V9 | TB 主题适配 | 0.5 天 |
| V10 | TB Widget 集成 | 1 天 |
| V11 | 测试验证 | 1 天 |

### Edit 模式 TODO (10 天)

| TODO | 内容 | 时间 |
|------|------|------|
| E1 | 编辑器库集成 | 0.5 天 |
| E2 | 编辑器核心类 | 1 天 |
| E3 | MDC Web 集成 | 0.5 天 |
| E4 | 编辑器 UI 框架 | 1.5 天 |
| E5 | 工具栏实现 | 1 天 |
| E6 | 控件面板 | 1 天 |
| E7 | 属性面板 | 2 天 |
| E8 | 视图管理 | 1 天 |
| E9 | TB Editor Widget 集成 | 1 天 |
| E10 | 测试验证 | 0.5 天 |

## 第一步要完成的 TODO

**达到 M1（最小可用 View，本地验证）需要完成 8 个 TODO (V1-V8)**：

```
V1 事件系统 → V2 数据模型 → V3 工具函数 → V4 图元基类
      ↓
V5 图元组件 → V6 图元管理器 → V7 HMI 服务 → V8 视图渲染器
      ↓
>>> 里程碑 M1: 本地可验证 View 模式 <<<
```

## 目录结构

```
tb-industrial-widgets/
├── src/
│   ├── fuxa-core/              # View 模式核心
│   │   ├── lib/                # 辅助库 (event-emitter)
│   │   ├── models/             # 数据模型 (hmi, device)
│   │   ├── helpers/            # 工具函数 (utils, svg-utils)
│   │   ├── gauges/             # 图元系统
│   │   │   ├── gauge-base.ts
│   │   │   ├── gauges-manager.ts
│   │   │   └── controls/       # 21 种图元
│   │   ├── services/           # 服务层 (hmi-service)
│   │   ├── renderer/           # 渲染器 (fuxa-view)
│   │   └── theme/              # 主题系统
│   │
│   ├── fuxa-editor/            # Edit 模式
│   │   ├── lib/                # 编辑器库 (fuxa-editor.min.js 等)
│   │   ├── core/               # 编辑器核心逻辑
│   │   ├── ui/                 # UI 组件 (使用 MDC Web)
│   │   └── styles/             # 样式
│   │
│   ├── tb-adapter/             # TB 数据适配层
│   │
│   └── widgets/                # Widget 定义
│       ├── scada-viewer/       # View Widget
│       └── scada-editor/       # Edit Widget
│
├── FUXA/                       # FUXA 源码（本地参考）
├── dev/                        # 本地开发测试
│   ├── view-test.html
│   └── editor-test.html
├── docs/
│   ├── FULL_MIGRATION_PLAN.md  # 完整迁移计划
│   ├── MIGRATION_PLAN.md       # View 模式详细计划
│   ├── EDITOR_MIGRATION_PLAN.md # Edit 模式详细计划
│   └── EDITOR_ARCHITECTURE_ANALYSIS.md # 编辑器架构分析
└── dist/                       # 构建产物
```

## ThingsBoard 主题适配

### TB 主题 CSS 变量

```css
:root {
  /* 主色调 */
  --tb-primary-color: #305680;
  --tb-accent-color: #d97f0d;
  
  /* 背景色 */
  --tb-background-color: #fff;           /* 亮色 */
  --tb-background-color: #2a323d;        /* 暗色 */
  
  /* 文字颜色 */
  --tb-text-primary: rgba(0,0,0,0.87);   /* 亮色 */
  --tb-text-primary: #ffffff;            /* 暗色 */
  
  /* 状态颜色 */
  --tb-success-color: #4caf50;
  --tb-warning-color: #ff9800;
  --tb-error-color: #f44336;
}
```

### MDC Web 主题映射

```css
/* 覆盖 MDC 变量，使用 TB 变量 */
:root {
  --mdc-theme-primary: var(--tb-primary-color);
  --mdc-theme-secondary: var(--tb-accent-color);
  --mdc-theme-surface: var(--tb-surface-color);
  --mdc-theme-background: var(--tb-background-color);
}
```

## 开发流程

### 本地开发
```bash
pnpm install
pnpm dev
```

### 构建
```bash
pnpm build
# 产物: dist/tb-scada-widget-bundle.json
```

## TB Widget API

```typescript
// 生命周期
self.onInit = function() { }         // 初始化
self.onDataUpdated = function() { }  // 数据更新
self.onResize = function() { }       // 尺寸变化
self.onDestroy = function() { }      // 销毁

// 上下文
self.ctx.$container[0]               // DOM 容器
self.ctx.settings                    // Widget 设置
self.ctx.defaultSubscription.data    // 订阅的数据
```

## 技术栈

- **语言**: TypeScript
- **UI 框架**: Material Components Web (MDC Web)
- **渲染引擎**: FUXA (SVG + SVG.js)
- **目标平台**: ThingsBoard 4.0+
- **构建工具**: Vite

## 相关文档

- [完整迁移计划](./docs/FULL_MIGRATION_PLAN.md)
- [View 模式计划](./docs/MIGRATION_PLAN.md)
- [Edit 模式计划](./docs/EDITOR_MIGRATION_PLAN.md)
- [编辑器架构分析](./docs/EDITOR_ARCHITECTURE_ANALYSIS.md)
