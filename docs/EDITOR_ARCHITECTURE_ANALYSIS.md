# FUXA 编辑器架构分析

> 分析日期: 2025-12-23  
> 范围: FUXA 编辑器源码分析，用于 TB SCADA Widget 迁移

---

## 一、概要

本文档详细分析 FUXA 编辑器的架构，为 TB SCADA Widget 的 Edit 模式迁移提供参考。

**核心发现**：
- FUXA 编辑器包含 17 个编辑器相关组件
- 41 个图元控件组件 + 15 个属性编辑组件
- 使用 SVG.js 库（5,572 行）进行 SVG 操作
- 重度依赖 Angular Material（对话框、抽屉、表单）
- 约 286KB 压缩后的 SVG 编辑器 JavaScript 库
- 使用发布/订阅架构进行事件通信

**迁移复杂度**：高（预计 6-8 周完整实现）

---

## 二、编辑器架构概览

### 2.1 核心组件结构

#### A. 主要编辑器组件

| 组件 | 用途 | 行数 | Angular 依赖 |
|------|------|------|--------------|
| `editor.component.ts` | 主编辑器协调器 | 1,679 | 高 |
| `editor-views-list.component.ts` | 视图管理侧边栏 | 150 | 中 |
| `view-property.component.ts` | 视图配置对话框 | 131 | 中 |
| `svg-selector.component.ts` | 元素选择面板 | 65 | 低 |
| `layout-property.component.ts` | 应用布局设置 | 309 | 高 |
| `app-settings.component.ts` | 应用设置 | 164 | 高 |
| `setup.component.ts` | 项目设置向导 | 145 | 中 |
| `plugins.component.ts` | 插件管理 | 76 | 低 |

**文件路径**: `/FUXA/client/src/app/editor/`

#### B. 编辑器对话框和子组件

```
chart-config/                        # 图表配置
├── chart-config.component.ts (283 行)
├── chart-line-property.component.ts (61 行)

graph-config/                        # 图形配置
├── graph-config.component.ts (291 行)
├── graph-source-edit.component.ts (28 行)

layout-property/                     # 布局属性
├── layout-menu-item-property.component.ts (150 行)
├── layout-header-item-property.component.ts (55 行)

card-config/                         # 卡片配置
├── card-config.component.ts (48 行)

tags-ids-config/                     # 标签ID配置
├── tags-ids-config.component.ts (38 行)

client-script-access/                # 客户端脚本
├── client-script-access.component.ts (57 行)
```

#### C. HTML/CSS 模板

- **editor.component.html**: 1,129 行（复杂布局含侧边栏、工具栏）
- **editor.component.css**: 756 行（大量样式）
- **layout-property.html**: 429 行（高级表单布局）

**编辑器 UI 总计**: 约 2,314 行 HTML/CSS

### 2.2 编辑器 DOM 结构

编辑器使用基于 Material 的复杂布局：

```html
<!-- 主容器 -->
<div id="svg_editor_container">
  <mat-drawer-container class="svg-workarea-container">
    
    <!-- 左侧边栏: 工具和视图 -->
    <mat-drawer mode="side" opened="true">
      <mat-accordion multi="true">
        <!-- 视图面板 -->
        <!-- 通用工具 (选择、绘图等) -->
        <!-- 控件面板 (输入框、按钮、进度条等) -->
        <!-- 图形面板 (几何图形、设备、储罐等) -->
        <!-- 属性面板 (填充、描边、字体等) -->
      </mat-accordion>
    </mat-drawer>
    
    <!-- 中央: SVG 画布 -->
    <div id="svg_editor_container">
      <!-- 使用 svg-editor 库的 SVG 画布 -->
    </div>
    
    <!-- 右侧边栏: 元素属性 -->
    <mat-drawer #sidePanel>
      <!-- 选中元素的属性对话框 -->
    </mat-drawer>
  </mat-drawer-container>
</div>
```

---

## 三、图元系统架构

### 3.1 控件组件（共 41 个）

#### A. 基础形状
- `shapes.component.ts` (190 行) - SVG 几何图形
- `ape-shapes.component.ts` (171 行) - APE 形状
- `proc-eng.component.ts` - 工艺工程符号

#### B. HTML 输入控件（7 个）
- `html-input.component.ts` (414 行) - 输入框
- `html-button.component.ts` (182 行) - 按钮
- `html-select.component.ts` (186 行) - 下拉框
- `html-switch.component.ts` (153 行) - 开关
- `value.component.ts` - 数值显示
- `slider.component.ts` - 滑块
- `gauge-progress.component.ts` (173 行) - 进度条

#### C. 复杂数据可视化（6 个）
- `html-chart.component.ts` - 图表显示
- `html-table.component.ts` - 数据表格
- `html-graph.component.ts` - 图形可视化
- `html-iframe.component.ts` - 嵌入内容
- `html-video.component.ts` (175 行) - 视频播放器
- `html-scheduler.component.ts` (2,214 行!!) - 事件调度器

#### D. 专用组件（5 个）
- `html-bag.component.ts` - 容器组件
- `pipe.component.ts` (446 行) - 管道动画
- `panel.component.ts` - 面板容器
- `gauge-semaphore.component.ts` - 信号灯
- `html-image.component.ts` (267 行) - 图片显示

### 3.2 属性编辑器组件（15 个）

这些组件处理每种图元类型的配置编辑：

```
gauge-property/
├── gauge-property.component.ts (224 行) - 主属性编辑器
├── flex-device-tag.component.ts (197 行) - 设备/标签绑定
├── flex-event.component.ts (248 行) - 事件配置
├── flex-action.component.ts - 动作定义
├── flex-input.component.ts (183 行) - 输入配置
├── flex-variable.component.ts (273 行) - 变量映射
├── flex-auth.component.ts - 认证设置
└── ... (另外 8 个子组件)
```

### 3.3 图元基类

```typescript
// 文件: /FUXA/client/src/app/gauges/gauge-base/gauge-base.component.ts
// 大小: 264 行
// 核心功能:
// - static processValue(ga, svgele, sig, gaugeStatus)
// - static initElement(...)
// - static bindElement(...)
// - static removeElement(...)
// - 位掩码处理
// - 数值格式化和动画
```

---

## 四、SVG 编辑器库分析

### 4.1 SVG.js 库

**位置**: `/FUXA/client/src/assets/lib/svg/svg.js`

```
大小: 5,572 行
压缩后: ~150KB
用途: 核心 SVG 操作（绘制、变换、动画）
功能:
- 元素创建 (rect, circle, line, path, text)
- 变换操作 (rotate, scale, skew, translate)
- 动画 (animate, loop, ease, delay)
- 事件处理 (click, drag, hover)
- 分组/图层管理
- 样式/属性操作
```

**编辑器使用的关键方法**:

```typescript
// 变换操作
element.move(x, y)
element.size(width, height)
element.rotate(angle, cx, cy)
element.scale(sx, sy)
element.skew(ax, ay)

// 动画
element.animate(duration).ease(type).rotate(angle).loop()
element.animate(duration).attr({fill: color})

// 样式
element.attr({fill, stroke, 'stroke-width'})
element.style('opacity', value)

// 分组操作
group.add(element)
group.translate(x, y)
```

### 4.2 自定义 SVG 编辑器（压缩版）

**位置**: `/FUXA/client/src/assets/lib/svgeditor/`

| 文件 | 大小 | 用途 |
|------|------|------|
| `fuxa-editor.min.js` | 286KB | 主编辑器（绘制、选择、工具栏） |
| `jquery.min.js` | 92KB | 事件处理 |
| `jquery-ui-1.8.17.custom.min.js` | 38KB | 拖放、调整大小 |
| `jquery-plugin.min.js` | 71KB | 额外 UI 插件 |
| `ext-bundle.min.js` | ~50KB | 编辑器扩展 |

**库总大小**: ~537KB（压缩后）

### 4.3 全局 SVG 编辑器接口

FUXA 编辑器通过 window 对象暴露全局 API：

```typescript
// 在 editor.component.ts 中声明的全局变量:
declare var Gauge: any;
declare var $: any;
declare var mypathseg: any;       // SVG pathseg polyfill
declare var mybrowser: any;        // 浏览器检测
declare var mysvgutils: any;       // SVG 工具
declare var myselect: any;         // 选择处理器
declare var mydraw: any;           // 绘图模式
declare var initContextmenu: any;  // 右键菜单
declare var mysvgcanvas: any;      // 画布管理器
declare var mysvgeditor: any;      // 编辑器主类

// 访问点:
this.winRef.nativeWindow.svgEditor
```

### 4.4 SVG 编辑器主要 API

```typescript
// 初始化
mysvgeditor.initSvgEditor($, callbacks...)

// 画布操作
svgEditor.setSvgString(svgContent)      // 设置 SVG 内容
svgEditor.getSvgString()                 // 获取 SVG 内容
svgEditor.setDocProperty(name, w, h, color)  // 设置文档属性
svgEditor.refreshCanvas()                // 刷新画布

// 选择
svgEditor.selectOnly(elements, scroll)   // 选择元素
svgEditor.getSelectedElements()          // 获取选中元素
svgEditor.clearSelection()               // 清除选择

// 绘图模式
svgEditor.clickToSetMode(mode)  // 'select', 'rect', 'line', 'text' 等

// 元素操作
svgEditor.setColor(color, alpha, type)   // 设置颜色（fill 或 stroke）
svgEditor.setMarker(id, type)            // 设置标记
svgEditor.setStrokeOption(option)        // 设置描边选项
svgEditor.alignSelectedElements(type)    // 对齐选中元素
svgEditor.makeHyperlink(url)             // 创建超链接

// 扩展
svgEditor.clickExtension(name)           // 加载扩展
svgEditor.enableGridSnapping(enabled)    // 启用网格吸附

// 历史记录
svgEditor.resetUndoStack()               // 重置撤销栈
svgEditor.undo()                         // 撤销
svgEditor.redo()                         // 重做
```

---

## 五、Angular 依赖

### 5.1 使用的 Material 组件

| 组件 | 用途 | 使用次数 |
|------|------|----------|
| `MatDialog` | 属性编辑器、确认框 | 12+ |
| `MatDrawer` | 侧边面板 | 3+ |
| `MatExpansionPanel` | 折叠面板 | 5+ |
| `MatTab` | 标签页界面 | 10+ |
| `MatIcon` | 工具栏按钮 | 50+ |
| `MatButton` | 操作按钮 | 30+ |
| `MatInput` | 表单字段 | 20+ |
| `MatSelect` | 下拉框 | 15+ |
| `MatSlider` | 数值滑块 | 5+ |
| `MatCheckbox` | 复选框 | 10+ |
| `MatColorPicker` | 颜色选择器 | 3+ |
| `MatProgressBar` | 加载指示器 | 1+ |

### 5.2 使用的 Angular 服务

```typescript
// editor.component.ts 中的依赖注入
constructor(
  private projectService: ProjectService,       // 项目服务
  private winRef: WindowRef,                    // 窗口引用
  public dialog: MatDialog,                     // 对话框
  private changeDetector: ChangeDetectorRef,    // 变更检测
  private translateService: TranslateService,   // 国际化
  public gaugesManager: GaugesManager,          // 图元管理器
  private viewContainerRef: ViewContainerRef,   // 视图容器
  private resolver: ComponentFactoryResolver,   // 组件工厂
  private resourcesService: ResourcesService,   // 资源服务
  private libWidgetsService: LibWidgetsService  // 组件库服务
)
```

### 5.3 RxJS 模式

```typescript
// Observable 订阅
this.projectService.onSaveCurrent.subscribe((mode) => {...})
this.projectService.onLoadHmi.subscribe((load) => {...})
this.libWidgetsService.svgWidgetSelected$.pipe(
  switchMap(...),
  takeUntil(this.destroy$)
).subscribe(...)

// 用于清理的 Subject
private destroy$ = new Subject<void>()

ngOnDestroy() {
  this.destroy$.next(null)
  this.destroy$.complete()
}
```

---

## 六、编辑器事件流

### 6.1 主要事件处理流程

```
用户操作 → setMode('draw') → 初始化绘图模式
     ↓
编辑器检测用户输入（鼠标/触摸）
     ↓
事件传播到图元管理器
     ↓
元素创建/修改/删除
     ↓
回调到 editor.component
     ↓
UI 更新（侧边栏、属性）
     ↓
项目保存
```

### 6.2 SVG 编辑器回调

在 `myInit()` 方法中注册：

```typescript
mysvgeditor.initSvgEditor($,
  // 回调 1: 元素选中
  (selected) => {
    this.isAnySelected = selected;
    this.onSelectedElement(selected);
    this.getGaugeSettings(selected);
  },
  
  // 回调 2: 扩展加载
  (type, args) => {
    this.onExtensionLoaded(args);
  },
  
  // 回调 3: 颜色变化
  (type, color) => {
    if (type === 'fill') this.colorFill = color;
    if (type === 'stroke') this.colorStroke = color;
  },
  
  // 回调 4: 元素添加
  (eleadded) => {
    let ga = this.getGaugeSettings(eleadded);
    this.checkGaugeAdded(ga);
  },
  
  // 回调 5: 元素删除
  (eleremoved) => {
    this.onRemoveElement(eleremoved);
  },
  
  // 回调 6: 元素缩放
  (eleresized) => {
    let ga = this.getGaugeSettings(eleresized);
    this.gaugesManager.checkElementToResize(ga, ...);
  },
  
  // 回调 7: 复制粘贴
  (copiedPasted) => {
    this.onCopyAndPaste(copiedPasted);
  },
  
  // 回调 8: 分组变化
  () => {
    this.checkSvgElementsMap(true);
  }
);
```

---

## 七、数据模型

### 7.1 HMI 模型

```typescript
// 文件: /FUXA/client/src/app/_models/hmi.ts

class Hmi {
  _id: string;
  name: string;
  views: View[];              // 视图列表
  devices: Device[];          // 设备列表
  charts: any[];              // 图表配置
  graphs: any[];              // 图形配置
  scripts: Script[];          // 脚本列表
  layout: LayoutSettings;     // 布局设置
}

class View {
  id: string;
  type: ViewType;             // 'svg' | 'cards' | 'maps'
  name: string;
  svgcontent: string;         // 完整 SVG XML
  items: { [id: string]: GaugeSettings };  // 图元设置
  profile: DocProfile;        // 文档配置
  property: ViewProperty;     // 视图属性
}

class GaugeSettings {
  id: string;
  type: string;               // 'svg-ext-shapes-rect', 'html_input' 等
  name: string;
  property: GaugeProperty;    // 图元属性
  hide?: boolean;             // 是否隐藏
  lock?: boolean;             // 是否锁定
}

class GaugeProperty {
  address?: string;           // 设备变量 ID
  bitmask?: string;           // 布尔转换的位掩码
  events?: GaugeEvent[];      // 事件列表
  actions?: GaugeAction[];    // 动作列表
  formatValue?: string;       // 数值格式化模式
  rangeMin?: number;          // 最小值
  rangeMax?: number;          // 最大值
  // ... 根据控件类型还有 50+ 其他属性
}
```

### 7.2 SVG 元素结构

```typescript
interface ISvgElement {
  id: string;          // SVG 元素 ID (如 'svg_12345')
  name: string;        // 显示名称 (来自 View.items)
  type?: string;       // 图元类型
}

// SVG 元素属性 (来自 DOM):
{
  id: "svg_12345",
  type: "svg-ext-shapes-rect",
  x: 100,
  y: 150,
  width: 200,
  height: 100,
  fill: "#FFFFFF",
  stroke: "#000000",
  "stroke-width": 2,
  // ... 其他 SVG 属性
}
```

---

## 八、编辑器功能目录

### 8.1 绘图工具（10 种）

```typescript
可用的绘图模式:
1. 'select'      - 元素选择
2. 'fhpath'      - 自由绘制铅笔
3. 'line'        - 直线绘制
4. 'rect'        - 矩形绘制
5. 'circle'      - 圆形绘制
6. 'ellipse'     - 椭圆绘制
7. 'path'        - 路径绘制
8. 'text'        - 文本插入
9. 'image'       - 位图图片
10. 'svg-image'  - SVG 图片
```

### 8.2 属性面板

```
左侧边栏:
├── 视图面板 (添加、克隆、导入/导出)
├── 通用工具 (绘图工具栏)
├── 控件 (HTML 和图元控件)
├── 图形 (几何、工艺等)
└── 属性 (填充、描边、文本、效果)

右侧边栏:
├── 属性编辑器 (选中元素)
├── 图表配置
├── 图形配置
└── Iframe 配置
```

### 8.3 右键菜单操作

```typescript
右键菜单包括:
- 编辑属性（打开对话框）
- 删除元素
- 复制/粘贴
- 分组/取消分组
- 排列（置顶、置底）
- 对齐（左、中、右、上、中、下）
- 翻转（水平、垂直）
- 锁定/解锁元素
- 隐藏/显示元素
```

### 8.4 拖放支持

```
- 在画布上拖动元素
- 从工具箱拖动到画布
- 拖动调整图层面板中的位置
- 拖动重新排序菜单项（布局）
- 元素的缩放手柄
```

### 8.5 键盘快捷键

```typescript
常用快捷键:
Ctrl+Z         - 撤销
Ctrl+Y         - 重做
Ctrl+C         - 复制
Ctrl+X         - 剪切
Ctrl+V         - 粘贴
Delete         - 删除元素
方向键         - 移动选中元素
Shift+方向键   - 网格吸附移动
Ctrl+A         - 全选
Escape         - 取消选择
```

---

## 九、第三方依赖

### 9.1 Angular 框架

```json
"@angular/animations": "16.2.12",
"@angular/cdk": "16.2.13",
"@angular/common": "16.2.12",
"@angular/compiler": "16.2.12",
"@angular/core": "16.2.12",
"@angular/forms": "16.2.12",
"@angular/material": "16.2.13",
"@angular/platform-browser": "16.2.12",
"@angular/platform-browser-dynamic": "16.2.12",
"@angular/router": "16.2.12"
```

### 9.2 UI 库

```json
"angular-gridster2": "^16.0.0",
"angular2-draggable": "^16.0.0",
"ngx-toastr": "^16.2.0",
"ngx-color-picker": "^13.0.0",
"@ngx-translate/core": "^14.0.0"
```

### 9.3 工具库

```json
"chart.js": "^3.9.1",
"ng2-charts": "^4.1.1",
"rxjs": "^7.8.0",
"moment": "^2.29.4",
"leaflet": "^1.9.4",
"panzoom": "^9.4.3",
"file-saver": "2.0.5"
```

### 9.4 表单和代码编辑

```json
"@ctrl/ngx-codemirror": "^5.1.1",
"codemirror": "^5.65.12"
```

---

## 十、性能考虑

### 10.1 重型组件

| 组件 | 影响 | 问题 |
|------|------|------|
| `html-scheduler` | 非常高 | 2,214 行，复杂日历 UI |
| `editor.component` | 高 | 1,679 行，职责过多 |
| `chart-uplot` | 高 | 791 行，数据密集型可视化 |
| `data-table` | 高 | 806 行，大数据集处理 |

### 10.2 内存问题

```typescript
// 如果不妥善管理可能导致内存泄漏:
1. SVG.js 元素引用（5000+ DOM 元素）
2. 图元实例（画布上每个元素一个）
3. 动画循环（持续旋转、闪烁）
4. 事件监听器（鼠标、键盘、触摸）
5. RxJS 订阅
```

### 10.3 渲染优化

```typescript
// FUXA 使用:
- ChangeDetectorRef.detectChanges() 手动更新
- OnPush 变更检测策略（适用时）
- setTimeout() 延迟异步操作
- 表格虚拟滚动（列表中未使用）
```

---

## 十一、文件结构汇总

### 11.1 完整文件列表

**编辑器组件**（共 7,710 行）:

```
/FUXA/client/src/app/editor/
├── editor.component.ts              1,679 行 ★★★
├── editor.component.html            1,129 行
├── editor.component.css               756 行
├── view-property/
│   ├── view-property.component.ts     131 行
│   └── view-property.component.html   105 行
├── layout-property/
│   ├── layout-property.component.ts   309 行
│   ├── layout-property.component.html 429 行
│   └── [子组件]                        205 行
├── chart-config/
│   ├── chart-config.component.ts      283 行
│   └── [子组件]                         61 行
├── graph-config/
│   ├── graph-config.component.ts      291 行
│   └── [子组件]                         28 行
├── editor-views-list/
│   ├── editor-views-list.component.ts 150 行
│   └── editor-views-list.component.html 38 行
├── app-settings.component.ts          164 行
├── setup.component.ts                 145 行
├── plugins.component.ts                76 行
├── svg-selector.component.ts           65 行
├── card-config.component.ts            48 行
├── tags-ids-config.component.ts        38 行
└── client-script-access.component.ts   57 行
```

**图元组件**（共 41 个）:

```
/FUXA/client/src/app/gauges/
├── controls/
│   ├── html-input/
│   │   ├── html-input.component.ts (414 行)
│   │   └── input-property.component.ts (160 行)
│   ├── html-button/ (182 行)
│   ├── html-select/ (186 行)
│   ├── html-switch/ (153 行)
│   ├── html-chart/ (791 行)
│   ├── html-table/ (806 行)
│   ├── html-graph/ (381 行)
│   ├── html-iframe/ (175 行)
│   ├── html-video/ (175 行)
│   ├── html-scheduler/ (2,214 行)
│   ├── html-image/ (267 行)
│   ├── gauge-progress/ (173 行)
│   ├── gauge-semaphore/ (171 行)
│   ├── pipe/ (446 行)
│   ├── slider/ (slider-property: 181 行)
│   ├── value/ (value.component.ts)
│   ├── html-bag/ (331 行)
│   └── panel/ (panel-property: 181 行)
├── gauge-base/
│   └── gauge-base.component.ts (264 行)
└── gauge-property/
    ├── gauge-property.component.ts (224 行)
    ├── flex-device-tag.component.ts (197 行)
    ├── flex-event.component.ts (248 行)
    ├── flex-action.component.ts
    ├── flex-input.component.ts (183 行)
    ├── flex-variable.component.ts (273 行)
    └── [另外 8 个子组件]
```

**SVG 编辑器库**:

```
/FUXA/client/src/assets/lib/
├── svg/
│   ├── svg.js (5,572 行)
│   └── svg.min.js (压缩版)
├── svgeditor/
│   ├── fuxa-editor.min.js (286KB)
│   ├── jquery.min.js (92KB)
│   ├── jquery-ui-1.8.17.custom.min.js (38KB)
│   ├── jquery-plugin.min.js (71KB)
│   ├── ext-bundle.min.js (~50KB)
│   ├── shapes/ (6 个图形库)
│   └── extensions/ (编辑器扩展)
└── gauge/
    └── gauge.js
```

---

## 十二、可复用的关键代码模式

### 12.1 图元设置管理

```typescript
// 来自 editor.component.ts (第 399-412 行)
getGaugeSettings(ele, initParams: any = null): GaugeSettings {
  if (ele && this.currentView) {
    if (this.currentView.items[ele.id]) {
      return this.currentView.items[ele.id];
    }
    let gs = this.gaugesManager.createSettings(ele.id, ele.type);
    if (initParams) {
      gs.property = new GaugeProperty();
      gs.property.address = initParams;
    }
    return gs;
  }
  return null;
}
```

### 12.2 SVG 元素追踪

```typescript
// 来自 editor.component.ts (第 284-291 行)
checkSvgElementsMap(loadSvgElement = false) {
  if (loadSvgElement) {
    this.svgElements = Array.from(
      document.querySelectorAll('g, text, line, rect, image, path, circle, ellipse')
    ).filter((svg: any) => 
      svg.attributes?.type?.value?.startsWith('svg-ext') ||
      (svg.id?.startsWith('svg_') && !svg.parentNode?.attributes?.type?.value?.startsWith('svg-ext'))
    ).map(ele => <ISvgElement>{
      id: ele.id,
      name: this.currentView.items[ele.id]?.name
    });
  }
}
```

### 12.3 复制粘贴与 ID 重映射

```typescript
// 来自 editor.component.ts (第 703-747 行)
private onCopyAndPaste(copiedPasted: CopiedAndPasted) {
  // 复杂逻辑用于:
  // 1. 追踪复制的元素 ID
  // 2. 为粘贴的元素生成新 ID
  // 3. 重映射所有属性引用
  // 4. 保留图元设置和属性
}
```

---

## 十三、参考资源

### 13.1 需要研究的关键文件

1. **编辑器核心**: `/FUXA/client/src/app/editor/editor.component.ts`
2. **图元基类**: `/FUXA/client/src/app/gauges/gauge-base/gauge-base.component.ts`
3. **SVG 工具**: `/FUXA/client/src/app/_helpers/svg-utils.ts` (270 行)
4. **HMI 模型**: `/FUXA/client/src/app/_models/hmi.ts`

### 13.2 库文档

- **SVG.js**: https://svgjs.dev/
- **Angular Material**: https://material.angular.io/
- **RxJS**: https://rxjs.dev/
- **Material Icons**: https://fonts.google.com/icons

### 13.3 相关 FUXA 文件

- **图元管理器**: `gauges.component.ts` (1,012 行)
- **项目服务**: `_services/project.service.ts`
- **形状组件**: `gauges/shapes/shapes.component.ts` (190 行)

---

## 十四、结论

FUXA 编辑器是一个成熟、功能丰富的应用程序，展示了工业 SCADA UI 设计的最佳实践。然而，它与 Angular、Material Design 和 jQuery 的紧密耦合使得直接移植到 ThingsBoard Widget 变得复杂。

**建议方案**:
1. 研究 FUXA 的核心概念（架构、模式）
2. 实现简化的 Web 标准版本（不使用 Angular）
3. 首先关注高价值功能（绘图、属性、控件）
4. 逐步添加高级功能（动画、数据绑定）

**预计工作量**: 6-8 周完成生产就绪的编辑器

---

**文档编写**: CodeBuddy 分析工具  
**最后更新**: 2025-12-23  
**状态**: 分析完成
