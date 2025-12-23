# FUXA 完整迁移计划 (View + Edit)

> 更新日期: 2025-12-23
> UI 框架: **Material Components Web (MDC Web)** - 与 ThingsBoard Angular Material 风格完全一致
> 原则: **直接复制 FUXA 源码，仅移除 Angular 依赖，不裁剪任何功能**

---

## 一、项目概览

### 1.1 目标

将 FUXA 的 SCADA/HMI 能力完整迁移到 ThingsBoard Widget，包括：
- **View 模式**: 渲染 SVG 视图，响应数据变化，执行动画和事件
- **Edit 模式**: 可视化编辑器，创建和修改 SVG 视图

### 1.2 技术选型

| 层面 | 技术 | 说明 |
|------|------|------|
| UI 框架 | MDC Web | Google 官方，与 TB Angular Material 同源 |
| SVG 编辑 | fuxa-editor.min.js | 直接复用 FUXA 编辑器库 |
| SVG 操作 | SVG.js | FUXA 原有依赖 |
| 构建工具 | Vite/Rollup | 现代打包工具 |

### 1.3 时间估算总览

| 模式 | 预计时间 | 说明 |
|------|----------|------|
| View 模式 | 11 天 | TODO V1-V11 |
| Edit 模式 | 10 天 | TODO E1-E10 |
| **总计** | **21 天** | 约 4 周 |

---

## 二、里程碑定义

### 里程碑 M1: 最小可用 View (本地验证)
**完成 TODO**: V1-V8  
**预计时间**: 8.5 天  
**验证方式**: `dev/view-test.html` 本地页面

**可验证功能**:
- [x] 加载 FUXA 导出的 SVG JSON
- [x] 显示基础形状 (rect, circle, line, path)
- [x] 显示数值 (Value 图元)
- [x] 响应模拟数据变化
- [x] 基础动画 (blink, hide/show)

---

### 里程碑 M2: 完整 View + TB 集成
**完成 TODO**: V1-V11  
**预计时间**: 11 天  
**验证方式**: ThingsBoard 中创建 Widget

**可验证功能**:
- [x] M1 所有功能
- [x] TB 主题适配 (明/暗模式)
- [x] TB 数据源绑定
- [x] 21 种图元全部可用
- [x] 所有动画和事件正常

---

### 里程碑 M3: 最小可用 Editor (本地验证)
**完成 TODO**: V1-V6 + E1-E4  
**预计时间**: 8 天 (V1-V6) + 4 天 (E1-E4) = 12 天  
**验证方式**: `dev/editor-test.html` 本地页面

**可验证功能**:
- [x] SVG 画布加载
- [x] 基础绘图工具 (矩形、圆、线、文本)
- [x] 元素选择、移动、缩放
- [x] 撤销/重做
- [x] 保存/加载 SVG

---

### 里程碑 M4: 完整 Editor + TB 集成
**完成 TODO**: 全部 (V1-V11 + E1-E10)  
**预计时间**: 21 天  
**验证方式**: ThingsBoard 中创建 Editor Widget

**可验证功能**:
- [x] M3 所有功能
- [x] 添加 FUXA 控件 (按钮、输入框等)
- [x] 属性编辑面板
- [x] 数据绑定配置
- [x] 视图管理 (多视图)
- [x] TB 风格完全一致

---

## 三、View 模式 TODO 列表

### TODO V1: 基础设施 - 事件系统 (0.5天)

**目标**: 创建 Angular EventEmitter 的替代品

**任务**:
- [ ] V1.1 创建 `src/fuxa-core/lib/event-emitter.ts`
- [ ] V1.2 实现 `emit()`, `subscribe()`, `unsubscribe()` 方法
- [ ] V1.3 单元测试

**验收**: EventEmitter 可正常发布/订阅事件

---

### TODO V2: 数据模型层 (0.5天)

**目标**: 复制 FUXA 数据模型，移除 Angular 依赖

**任务**:
- [ ] V2.1 复制 `hmi.ts` → `src/fuxa-core/models/hmi.ts`
- [ ] V2.2 复制 `device.ts` → `src/fuxa-core/models/device.ts`
- [ ] V2.3 添加本地 GridType 定义
- [ ] V2.4 创建 `index.ts` 导出

**验收**: TypeScript 编译通过，类型可正常使用

---

### TODO V3: 工具函数层 (0.5天)

**目标**: 复制工具类，移除装饰器

**任务**:
- [ ] V3.1 复制 `utils.ts` → `src/fuxa-core/helpers/utils.ts`
- [ ] V3.2 复制 `svg-utils.ts` → `src/fuxa-core/helpers/svg-utils.ts`
- [ ] V3.3 移除 `@Injectable()` 装饰器
- [ ] V3.4 创建 `index.ts` 导出

**验收**: 工具函数可正常调用

---

### TODO V4: 图元基类 (0.5天)

**目标**: 复制图元基类，转换为纯 TypeScript

**任务**:
- [ ] V4.1 复制 `gauge-base.component.ts` → `src/fuxa-core/gauges/gauge-base.ts`
- [ ] V4.2 移除 `@Component`, `@Input`, `@Output` 装饰器
- [ ] V4.3 使用自定义 EventEmitter
- [ ] V4.4 保留所有静态方法

**验收**: 静态方法可正常调用

---

### TODO V5: 图元组件 - 批量复制 (2天)

**目标**: 复制所有 21 种图元

**任务**:
- [ ] V5.1 基础形状: shapes, proc-eng, ape-shapes
- [ ] V5.2 数值显示: value
- [ ] V5.3 表单控件: html-button, html-input, html-select, html-switch
- [ ] V5.4 指示器: gauge-progress, gauge-semaphore, slider, pipe
- [ ] V5.5 数据展示: html-chart, html-graph, html-table, html-bag
- [ ] V5.6 容器媒体: panel, html-image, html-video, html-iframe, html-scheduler

**验收**: 每个图元的 `processValue()` 可正常调用

---

### TODO V6: 图元管理器 (1.5天)

**目标**: 复制 GaugesManager，替换 DI

**任务**:
- [ ] V6.1 复制 `gauges.component.ts` → `src/fuxa-core/gauges/gauges-manager.ts`
- [ ] V6.2 移除 `@Injectable()` 装饰器
- [ ] V6.3 替换构造函数注入为显式 `init()` 方法
- [ ] V6.4 注册所有 21 种图元
- [ ] V6.5 保留所有核心方法

**验收**: 可创建实例，注册图元，调用 processValue

---

### TODO V7: HMI 服务 (1天)

**目标**: 复制 HmiService，替换通信层

**任务**:
- [ ] V7.1 复制 `hmi.service.ts` → `src/fuxa-core/services/hmi-service.ts`
- [ ] V7.2 移除 Angular 和 RxJS 依赖
- [ ] V7.3 创建通信接口 `IHmiCommunication`
- [ ] V7.4 实现 TB 适配器 `TBWidgetCommunication`
- [ ] V7.5 保留所有核心方法

**验收**: 可设置和获取信号值

---

### TODO V8: 视图渲染器 (2天)

**目标**: 复制 FuxaViewComponent，重构为纯类

**任务**:
- [ ] V8.1 复制 `fuxa-view.component.ts` → `src/fuxa-core/renderer/fuxa-view.ts`
- [ ] V8.2 移除 Angular 生命周期，改为 `init()`/`destroy()`
- [ ] V8.3 替换 `@ViewChild` 为 DOM 查询
- [ ] V8.4 替换 `MatDialog` 为回调
- [ ] V8.5 保留所有核心方法

**验收**: 可加载 SVG 视图，响应数据变化

**>>> 里程碑 M1 达成: 最小可用 View <<<**

---

### TODO V9: TB 主题适配 (0.5天)

**目标**: 实现 TB 主题集成

**任务**:
- [ ] V9.1 创建 `theme-manager.ts`
- [ ] V9.2 创建 `theme-styles.css` (使用 TB CSS 变量)
- [ ] V9.3 实现明/暗主题自动切换
- [ ] V9.4 Widget Settings 添加主题配置

**验收**: Widget 跟随 TB 主题切换

---

### TODO V10: TB Widget 集成 (1天)

**目标**: 创建 TB Widget 适配器

**任务**:
- [ ] V10.1 创建 `TBDataAdapter` 数据适配器
- [ ] V10.2 创建 `TBRpcAdapter` RPC 适配器
- [ ] V10.3 创建 `scada-viewer` Widget 入口
- [ ] V10.4 实现 `onInit`, `onDataUpdated`, `onDestroy`

**验收**: Widget 可在 TB 中加载和运行

---

### TODO V11: View 测试验证 (1天)

**任务**:
- [ ] V11.1 创建本地测试页面 `dev/view-test.html`
- [ ] V11.2 测试所有 21 种图元
- [ ] V11.3 测试动画系统
- [ ] V11.4 测试事件系统
- [ ] V11.5 测试变量映射
- [ ] V11.6 TB 端到端测试

**>>> 里程碑 M2 达成: 完整 View + TB 集成 <<<**

---

## 四、Edit 模式 TODO 列表

### TODO E1: 编辑器库集成 (0.5天)

**目标**: 集成 FUXA SVG 编辑器库

**任务**:
- [ ] E1.1 复制编辑器库到 `src/fuxa-editor/lib/`
  - fuxa-editor.min.js (286KB)
  - svg.js (150KB)
  - jquery.min.js (92KB)
  - jquery-ui.min.js (38KB)
  - shapes/*.json
- [ ] E1.2 创建全局类型声明 `globals.d.ts`
- [ ] E1.3 验证库加载

**验收**: 所有库加载成功，无控制台错误

---

### TODO E2: 编辑器核心类 (1天)

**目标**: 创建编辑器核心逻辑

**任务**:
- [ ] E2.1 创建 `FuxaEditorCore` 类
- [ ] E2.2 实现 SVG 编辑器初始化和回调
- [ ] E2.3 实现 `loadView()`, `saveView()`, `setMode()`
- [ ] E2.4 实现 `getGaugeSettings()` 图元设置管理
- [ ] E2.5 创建 `ClipboardManager` 剪贴板管理

**验收**: 可初始化编辑器，切换绘图模式

---

### TODO E3: MDC Web 集成 (0.5天)

**目标**: 集成 Material Components Web

**任务**:
- [ ] E3.1 添加 MDC Web CSS/JS 依赖
- [ ] E3.2 创建 MDC 组件初始化工具类
- [ ] E3.3 配置 TB 主题变量映射
- [ ] E3.4 创建通用样式覆盖

**MDC 组件使用列表**:
```html
<!-- 按钮 -->
<button class="mdc-button mdc-button--raised">
  <span class="mdc-button__label">保存</span>
</button>

<!-- 输入框 -->
<label class="mdc-text-field mdc-text-field--outlined">
  <span class="mdc-notched-outline">...</span>
  <input type="text" class="mdc-text-field__input">
</label>

<!-- 对话框 -->
<div class="mdc-dialog">...</div>

<!-- 抽屉 -->
<aside class="mdc-drawer mdc-drawer--dismissible">...</aside>
```

**验收**: MDC 组件正常渲染，风格与 TB 一致

---

### TODO E4: 编辑器 UI 框架 (1.5天)

**目标**: 创建编辑器基础布局

**任务**:
- [ ] E4.1 创建主布局 `EditorLayout` (三栏结构)
- [ ] E4.2 创建顶部工具栏 `EditorToolbar`
  - 绘图模式切换按钮
  - 撤销/重做按钮
  - 对齐按钮
  - 颜色选择器
- [ ] E4.3 创建左侧边栏容器 (使用 `mdc-drawer`)
- [ ] E4.4 创建右侧属性面板容器
- [ ] E4.5 创建状态栏

**验收**: 三栏布局正常显示，工具栏可切换绘图模式

**>>> 里程碑 M3 达成: 最小可用 Editor <<<**

---

### TODO E5: 控件面板 (1天)

**目标**: 实现左侧控件选择面板

**任务**:
- [ ] E5.1 创建折叠面板组件 (使用 `mdc-list`)
- [ ] E5.2 创建控件列表 (12 种常用控件)
- [ ] E5.3 实现点击添加控件
- [ ] E5.4 实现拖拽添加控件

**验收**: 可从面板添加控件到画布

---

### TODO E6: 图形面板 (0.5天)

**目标**: 实现图形库选择面板

**任务**:
- [ ] E6.1 加载图形库 JSON (geometry, proc-eng, ape)
- [ ] E6.2 显示图形缩略图
- [ ] E6.3 实现点击/拖拽添加

**验收**: 可添加预设图形到画布

---

### TODO E7: 属性面板 (2天)

**目标**: 实现右侧属性编辑面板

**任务**:
- [ ] E7.1 创建基础属性面板 (名称、类型、位置)
- [ ] E7.2 创建数据绑定配置 (变量地址)
- [ ] E7.3 创建样式配置 (填充、描边、字体)
- [ ] E7.4 创建高级属性对话框 (使用 `mdc-dialog`)
- [ ] E7.5 为不同图元类型创建专用编辑器

**验收**: 选中元素后可编辑属性

---

### TODO E8: 视图管理 (1天)

**目标**: 实现多视图管理

**任务**:
- [ ] E8.1 创建视图列表面板
- [ ] E8.2 实现新建/删除/切换视图
- [ ] E8.3 实现视图属性编辑 (名称、尺寸、背景色)
- [ ] E8.4 实现导入/导出 JSON

**验收**: 可管理多个视图

---

### TODO E9: TB Editor Widget 集成 (1天)

**目标**: 创建 TB Editor Widget

**任务**:
- [ ] E9.1 创建 `scada-editor` Widget 入口
- [ ] E9.2 实现 Widget Settings Schema
- [ ] E9.3 实现保存到 TB 资源
- [ ] E9.4 实现从 TB 资源加载

**验收**: Editor Widget 可在 TB 中使用

---

### TODO E10: Editor 测试验证 (1天)

**任务**:
- [ ] E10.1 创建本地测试页面 `dev/editor-test.html`
- [ ] E10.2 测试所有绘图工具
- [ ] E10.3 测试控件添加
- [ ] E10.4 测试属性编辑
- [ ] E10.5 测试保存/加载
- [ ] E10.6 TB 端到端测试

**>>> 里程碑 M4 达成: 完整 Editor + TB 集成 <<<**

---

## 五、完整时间估算

### View 模式 (11 天)

| TODO | 内容 | 时间 | 累计 |
|------|------|------|------|
| V1 | 事件系统 | 0.5 天 | 0.5 天 |
| V2 | 数据模型层 | 0.5 天 | 1 天 |
| V3 | 工具函数层 | 0.5 天 | 1.5 天 |
| V4 | 图元基类 | 0.5 天 | 2 天 |
| V5 | 21种图元 | 2 天 | 4 天 |
| V6 | 图元管理器 | 1.5 天 | 5.5 天 |
| V7 | HMI 服务 | 1 天 | 6.5 天 |
| V8 | 视图渲染器 | 2 天 | **8.5 天 (M1)** |
| V9 | TB 主题适配 | 0.5 天 | 9 天 |
| V10 | TB Widget 集成 | 1 天 | 10 天 |
| V11 | 测试验证 | 1 天 | **11 天 (M2)** |

### Edit 模式 (10 天)

| TODO | 内容 | 时间 | 累计 |
|------|------|------|------|
| E1 | 编辑器库集成 | 0.5 天 | 0.5 天 |
| E2 | 编辑器核心类 | 1 天 | 1.5 天 |
| E3 | MDC Web 集成 | 0.5 天 | 2 天 |
| E4 | 编辑器 UI 框架 | 1.5 天 | **3.5 天 (M3*)** |
| E5 | 控件面板 | 1 天 | 4.5 天 |
| E6 | 图形面板 | 0.5 天 | 5 天 |
| E7 | 属性面板 | 2 天 | 7 天 |
| E8 | 视图管理 | 1 天 | 8 天 |
| E9 | TB Editor Widget | 1 天 | 9 天 |
| E10 | 测试验证 | 1 天 | **10 天 (M4)** |

*注: M3 需要先完成 V1-V6，实际累计时间为 8 + 3.5 = 11.5 天*

---

## 六、依赖关系图

```
View 模式                              Edit 模式
─────────────────────────────────      ─────────────────────────────
V1: 事件系统 ◄──────────────────────── E2: 编辑器核心类
      │
      ▼
V2: 数据模型 ◄──────────────────────── E2, E7: 属性面板
      │
      ▼
V3: 工具函数 ◄──────────────────────── E2: 编辑器核心类
      │
      ▼
V4: 图元基类 ◄──────────────────────── E5: 控件面板
      │
      ▼
V5: 图元组件 ◄──────────────────────── E5, E7: 控件/属性
      │
      ▼
V6: 图元管理器 ◄────────────────────── E2: 编辑器核心类
      │
      ├─────────────────────────────── E1-E4: 最小 Editor
      ▼
V7: HMI 服务
      │
      ▼
V8: 视图渲染器 ──────── 里程碑 M1 ────
      │
      ▼
V9: TB 主题适配
      │
      ▼
V10: TB Widget 集成
      │
      ▼
V11: 测试验证 ─────── 里程碑 M2 ─────
```

---

## 七、推荐执行顺序

### 第一阶段: 核心基础 (第 1-2 周)

```
Day 1-2:   V1 → V2 → V3 → V4 (基础设施)
Day 3-4:   V5 (图元组件 - 先做 shapes, value)
Day 5:     V5 (图元组件 - 继续)
Day 6-7:   V6 (图元管理器)
Day 8:     V7 (HMI 服务)
Day 9-10:  V8 (视图渲染器)

>>> 里程碑 M1: 本地 View 可验证 <<<
```

### 第二阶段: View 完善 (第 3 周前半)

```
Day 11:    V9 (TB 主题适配)
Day 12:    V10 (TB Widget 集成)
Day 13:    V11 (View 测试)

>>> 里程碑 M2: TB View Widget 完成 <<<
```

### 第三阶段: Editor 基础 (第 3 周后半 - 第 4 周)

```
Day 14:    E1 (编辑器库集成)
Day 15:    E2 (编辑器核心类)
Day 16:    E3 + E4 (MDC + UI 框架)
Day 17:    E4 (UI 框架继续)

>>> 里程碑 M3: 本地 Editor 可验证 <<<
```

### 第四阶段: Editor 完善 (第 4 周)

```
Day 18:    E5 (控件面板)
Day 19:    E6 + E7 (图形 + 属性面板)
Day 20:    E7 + E8 (属性面板 + 视图管理)
Day 21:    E9 + E10 (TB 集成 + 测试)

>>> 里程碑 M4: TB Editor Widget 完成 <<<
```

---

## 八、第一步要完成的 TODO

**要达到 M1（最小可用 View，本地验证），需要完成**:

| TODO | 内容 | 必要性 |
|------|------|--------|
| **V1** | 事件系统 | 必需 - 组件通信基础 |
| **V2** | 数据模型 | 必需 - 类型定义 |
| **V3** | 工具函数 | 必需 - 渲染依赖 |
| **V4** | 图元基类 | 必需 - 图元基础 |
| **V5** | 图元组件 | 必需 - 至少 shapes + value |
| **V6** | 图元管理器 | 必需 - 核心调度 |
| **V7** | HMI 服务 | 必需 - 信号管理 |
| **V8** | 视图渲染器 | 必需 - 主入口 |

**共 8 个 TODO，预计 8.5 天**

---

## 九、文件清单

### View 模式文件

```
src/fuxa-core/
├── lib/
│   ├── event-emitter.ts         # V1
│   └── index.ts
├── models/
│   ├── hmi.ts                   # V2
│   ├── device.ts                # V2
│   └── index.ts
├── helpers/
│   ├── utils.ts                 # V3
│   ├── svg-utils.ts             # V3
│   └── index.ts
├── gauges/
│   ├── gauge-base.ts            # V4
│   ├── gauges-manager.ts        # V6
│   └── controls/                # V5
│       ├── shapes.ts
│       ├── value.ts
│       ├── html-button.ts
│       └── ... (21 个)
├── services/
│   ├── hmi-service.ts           # V7
│   └── index.ts
├── renderer/
│   ├── fuxa-view.ts             # V8
│   └── index.ts
├── theme/
│   ├── theme-manager.ts         # V9
│   └── theme-styles.css         # V9
└── index.ts

src/tb-adapter/
├── data-adapter.ts              # V10
├── rpc-adapter.ts               # V10
└── index.ts

src/widgets/scada-viewer/
├── controller.ts                # V10
└── template.html
```

### Edit 模式文件

```
src/fuxa-editor/
├── lib/                         # E1
│   ├── fuxa-editor.min.js
│   ├── svg.js
│   ├── jquery.min.js
│   ├── jquery-ui.min.js
│   └── shapes/
├── types/
│   └── globals.d.ts             # E1
├── core/
│   ├── editor-core.ts           # E2
│   ├── clipboard.ts             # E2
│   └── index.ts
├── ui/
│   ├── mdc-utils.ts             # E3
│   ├── editor-layout.ts         # E4
│   ├── toolbar/
│   │   └── toolbar.ts           # E4
│   ├── sidebar/
│   │   ├── left-sidebar.ts      # E4
│   │   └── right-sidebar.ts     # E4
│   ├── panels/
│   │   ├── controls-panel.ts    # E5
│   │   ├── shapes-panel.ts      # E6
│   │   ├── property-panel.ts    # E7
│   │   └── views-panel.ts       # E8
│   └── dialogs/
│       ├── modal.ts             # E7
│       └── gauge-property-dialog.ts
├── styles/
│   ├── editor.css
│   ├── mdc-overrides.css        # E3
│   └── theme.css
└── index.ts

src/widgets/scada-editor/
├── controller.ts                # E9
└── template.html
```

---

## 十、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| MDC Web 学习曲线 | 可能拖慢进度 | 只使用核心组件，参考 TB 源码 |
| fuxa-editor.min.js 是混淆代码 | 难以调试 | 只用公开 API，不修改内部 |
| 图表组件依赖复杂 | html-chart/graph 可能有额外依赖 | 先跳过，后续单独处理 |
| jQuery 与现代框架冲突 | 可能有命名冲突 | 使用 jQuery.noConflict() |

---

**文档版本**: 1.0  
**最后更新**: 2025-12-23  
**状态**: 完整规划
