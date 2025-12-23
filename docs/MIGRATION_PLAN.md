# FUXA 代码直接复用迁移计划

> 更新日期: 2025-12-23
> 原则: **直接复制 FUXA 源码，仅移除 Angular 依赖，不裁剪任何功能**

---

## 一、核心思路

FUXA 的代码设计良好，大部分核心逻辑是**纯 TypeScript**，与 Angular 的耦合主要在：
- `@Component`、`@Injectable` 等装饰器
- `EventEmitter`、`Input`、`Output` 等属性装饰器
- 依赖注入 (DI)
- 生命周期钩子 (OnInit, AfterViewInit, OnDestroy)

**改造策略**: 保留所有业务逻辑，只替换 Angular 特定的 API。

---

## 二、源码依赖分析

### 2.1 文件复用率统计

| 文件 | 行数 | Angular 依赖 | 可直接复用 | 改造难度 |
|------|------|--------------|------------|----------|
| `_models/hmi.ts` | 765 | 仅 GridType 类型 | **99%** | 极低 |
| `_models/device.ts` | 709 | 无 | **100%** | 无 |
| `_helpers/utils.ts` | 705 | @Injectable, Pipe | **95%** | 低 |
| `_helpers/svg-utils.ts` | 270 | @Injectable | **98%** | 极低 |
| `gauge-base.component.ts` | 264 | @Component, @Input/Output | **93%** | 低 |
| `gauges.component.ts` | 1012 | @Injectable, EventEmitter, DI | **50%** | 中 |
| `fuxa-view.component.ts` | 1220 | 重度 Angular | **30%** | 高 |
| `_services/hmi.service.ts` | 777 | @Injectable, EventEmitter, RxJS | **40%** | 中 |
| **总计** | **5722** | - | **~60%** | - |

### 2.2 Angular 依赖详情

```typescript
// 需要替换的 Angular API
@Component, @Injectable          → 移除装饰器，保留类
@Input(), @Output()              → 改为普通属性
EventEmitter                     → 改为自定义 EventEmitter 或回调
ViewChild, ViewContainerRef      → 改为 DOM 查询
OnInit, AfterViewInit, OnDestroy → 改为显式 init/destroy 方法
ChangeDetectorRef                → 移除（手动触发更新）
ComponentFactoryResolver         → 移除（不需要动态组件）
MatDialog                        → 改为自定义弹窗或 TB 弹窗
TranslateService                 → 改为简单 i18n 函数
ToastrService                    → 改为 console 或 TB 通知
BehaviorSubject, Subscription    → 改为简单回调或自定义实现
```

---

## 三、目录结构规划

```
src/fuxa-core/
│
├── models/                          # 直接复制，极少改动
│   ├── hmi.ts                       ← FUXA/_models/hmi.ts (99%复用)
│   ├── device.ts                    ← FUXA/_models/device.ts (100%复用)
│   └── index.ts
│
├── helpers/                         # 直接复制，移除装饰器
│   ├── utils.ts                     ← FUXA/_helpers/utils.ts (95%复用)
│   ├── svg-utils.ts                 ← FUXA/_helpers/svg-utils.ts (98%复用)
│   └── index.ts
│
├── gauges/                          # 直接复制，移除 Angular 装饰器
│   ├── gauge-base.ts                ← gauge-base.component.ts (93%复用)
│   ├── gauges-manager.ts            ← gauges.component.ts (需适配)
│   │
│   └── controls/                    # 直接复制所有图元
│       ├── value.ts                 ← controls/value/
│       ├── html-button.ts           ← controls/html-button/
│       ├── html-input.ts            ← controls/html-input/
│       ├── html-select.ts           ← controls/html-select/
│       ├── html-switch.ts           ← controls/html-switch/
│       ├── html-chart.ts            ← controls/html-chart/
│       ├── html-graph.ts            ← controls/html-graph/
│       ├── html-table.ts            ← controls/html-table/
│       ├── html-bag.ts              ← controls/html-bag/
│       ├── html-image.ts            ← controls/html-image/
│       ├── html-video.ts            ← controls/html-video/
│       ├── html-iframe.ts           ← controls/html-iframe/
│       ├── html-scheduler.ts        ← controls/html-scheduler/
│       ├── gauge-progress.ts        ← controls/gauge-progress/
│       ├── gauge-semaphore.ts       ← controls/gauge-semaphore/
│       ├── slider.ts                ← controls/slider/
│       ├── pipe.ts                  ← controls/pipe/
│       ├── panel.ts                 ← controls/panel/
│       ├── shapes.ts                ← shapes/shapes.component.ts
│       ├── proc-eng.ts              ← shapes/proc-eng/
│       ├── ape-shapes.ts            ← shapes/ape-shapes/
│       └── index.ts
│
├── services/                        # 适配层
│   ├── hmi-service.ts               ← _services/hmi.service.ts (需适配)
│   └── index.ts
│
├── renderer/                        # 主渲染器
│   ├── fuxa-view.ts                 ← fuxa-view.component.ts (需适配)
│   └── index.ts
│
├── lib/                             # 事件系统替代
│   ├── event-emitter.ts             # 简单 EventEmitter 实现
│   └── index.ts
│
└── index.ts                         # 统一导出
```

---

## 四、分步实施计划

### TODO 1: 基础设施 - 事件系统 (0.5天)

**目标**: 创建 Angular EventEmitter 的替代品

**任务**:
- [ ] 1.1 创建 `src/fuxa-core/lib/event-emitter.ts`
  - 实现 `emit(value)` 方法
  - 实现 `subscribe(callback)` 方法
  - 实现 `unsubscribe()` 方法
  - 兼容 FUXA 原有的 EventEmitter 用法

**代码模板**:
```typescript
// src/fuxa-core/lib/event-emitter.ts
export class EventEmitter<T = any> {
  private listeners: ((value: T) => void)[] = [];

  emit(value: T): void {
    this.listeners.forEach(listener => listener(value));
  }

  subscribe(callback: (value: T) => void): { unsubscribe: () => void } {
    this.listeners.push(callback);
    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(callback);
        if (index > -1) this.listeners.splice(index, 1);
      }
    };
  }
}
```

---

### TODO 2: 数据模型层 - 直接复制 (0.5天)

**目标**: 复制 `_models/` 下的所有文件，仅做最小改动

**任务**:
- [ ] 2.1 复制 `hmi.ts` → `src/fuxa-core/models/hmi.ts`
  - 移除 `import { GridType } from 'angular-gridster2'`
  - 添加本地 GridType 定义: `export type GridType = 'fit' | 'scrollVertical' | 'scrollHorizontal' | 'fixed' | 'verticalFixed' | 'horizontalFixed'`
  - 保留所有类、接口、枚举定义（约 765 行）

- [ ] 2.2 复制 `device.ts` → `src/fuxa-core/models/device.ts`
  - 无需任何改动，直接复制（709 行）

- [ ] 2.3 创建 `src/fuxa-core/models/index.ts` 导出所有模型

**验收**: TypeScript 编译通过，所有类型可正常导入使用

---

### TODO 3: 工具函数层 - 移除装饰器 (0.5天)

**目标**: 复制 `_helpers/` 下的文件，移除 Angular 装饰器

**任务**:
- [ ] 3.1 复制 `utils.ts` → `src/fuxa-core/helpers/utils.ts`
  - 移除 `import { Injectable, Pipe, PipeTransform } from '@angular/core'`
  - 移除 `import { DomSanitizer } from '@angular/platform-browser'`
  - 移除 `@Injectable()` 装饰器
  - 移除末尾的 `EnumToArrayPipe` 和 `EscapeHtmlPipe` 类（约 30 行）
  - 保留 `Utils` 类的所有静态方法（约 670 行）

- [ ] 3.2 复制 `svg-utils.ts` → `src/fuxa-core/helpers/svg-utils.ts`
  - 移除 `import { Injectable } from '@angular/core'`
  - 移除 `@Injectable()` 装饰器
  - 保留所有方法（约 265 行）

- [ ] 3.3 创建 `src/fuxa-core/helpers/index.ts` 导出

**验收**: 所有工具函数可正常调用

---

### TODO 4: 图元基类 - 移除组件装饰器 (0.5天)

**目标**: 复制 `gauge-base.component.ts`，转换为纯 TypeScript 类

**任务**:
- [ ] 4.1 复制 `gauge-base.component.ts` → `src/fuxa-core/gauges/gauge-base.ts`
  - 移除 `import { Component, Input, Output, EventEmitter } from '@angular/core'`
  - 移除 `@Component({...})` 装饰器
  - 移除 `@Input()`, `@Output()` 装饰器，保留属性
  - 使用自定义 EventEmitter 替换 Angular 的
  - 保留所有静态方法（核心逻辑约 240 行）

**改造示例**:
```typescript
// 原始
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'gauge-base',
  templateUrl: './gauge-base.component.html'
})
export class GaugeBaseComponent {
  @Input() data: any;
  @Output() edit: EventEmitter<any> = new EventEmitter();
  
  static pathToAbsolute(...) { ... }
}

// 改造后
import { EventEmitter } from '../lib/event-emitter';

export class GaugeBaseComponent {
  data: any;
  edit: EventEmitter<any> = new EventEmitter();
  
  static pathToAbsolute(...) { ... }  // 保持不变
}
```

**验收**: 所有静态方法可正常调用

---

### TODO 5: 图元组件 - 批量复制 (2天)

**目标**: 复制所有 21 种图元组件，移除 Angular 依赖

**任务**:

#### 5.1 基础形状组件 (Day 1 上午)
- [ ] 5.1.1 复制 `shapes/shapes.component.ts` → `controls/shapes.ts`
- [ ] 5.1.2 复制 `shapes/proc-eng/proc-eng.component.ts` → `controls/proc-eng.ts`
- [ ] 5.1.3 复制 `shapes/ape-shapes/ape-shapes.component.ts` → `controls/ape-shapes.ts`

#### 5.2 值显示组件 (Day 1 上午)
- [ ] 5.2.1 复制 `controls/value/value.component.ts` → `controls/value.ts`

#### 5.3 表单控件 (Day 1 下午)
- [ ] 5.3.1 复制 `controls/html-button/html-button.component.ts` → `controls/html-button.ts`
- [ ] 5.3.2 复制 `controls/html-input/html-input.component.ts` → `controls/html-input.ts`
- [ ] 5.3.3 复制 `controls/html-select/html-select.component.ts` → `controls/html-select.ts`
- [ ] 5.3.4 复制 `controls/html-switch/html-switch.component.ts` → `controls/html-switch.ts`

#### 5.4 指示器组件 (Day 1 下午)
- [ ] 5.4.1 复制 `controls/gauge-progress/gauge-progress.component.ts` → `controls/gauge-progress.ts`
- [ ] 5.4.2 复制 `controls/gauge-semaphore/gauge-semaphore.component.ts` → `controls/gauge-semaphore.ts`
- [ ] 5.4.3 复制 `controls/slider/slider.component.ts` → `controls/slider.ts`
- [ ] 5.4.4 复制 `controls/pipe/pipe.component.ts` → `controls/pipe.ts`

#### 5.5 数据展示组件 (Day 2 上午)
- [ ] 5.5.1 复制 `controls/html-chart/html-chart.component.ts` → `controls/html-chart.ts`
- [ ] 5.5.2 复制 `controls/html-graph/html-graph.component.ts` → `controls/html-graph.ts`
- [ ] 5.5.3 复制 `controls/html-table/html-table.component.ts` → `controls/html-table.ts`
- [ ] 5.5.4 复制 `controls/html-bag/html-bag.component.ts` → `controls/html-bag.ts`

#### 5.6 容器和媒体组件 (Day 2 下午)
- [ ] 5.6.1 复制 `controls/panel/panel.component.ts` → `controls/panel.ts`
- [ ] 5.6.2 复制 `controls/html-image/html-image.component.ts` → `controls/html-image.ts`
- [ ] 5.6.3 复制 `controls/html-video/html-video.component.ts` → `controls/html-video.ts`
- [ ] 5.6.4 复制 `controls/html-iframe/html-iframe.component.ts` → `controls/html-iframe.ts`
- [ ] 5.6.5 复制 `controls/html-scheduler/html-scheduler.component.ts` → `controls/html-scheduler.ts`

**每个图元的通用改造步骤**:
1. 移除 `@Component` 装饰器
2. 移除 Angular 导入
3. 保留 `static TypeTag`, `static LabelTag`
4. 保留 `static getSignals()`, `static getActions()`, `static getDialogType()`
5. 保留 `static processValue()` - 核心渲染逻辑
6. 保留 `static initElement()` - 初始化逻辑

**验收**: 每个图元的 `processValue` 和 `getSignals` 方法可正常调用

---

### TODO 6: 图元管理器 - 核心适配 (1.5天)

**目标**: 复制 `gauges.component.ts`，替换 Angular DI 为显式依赖

**任务**:
- [ ] 6.1 复制 `gauges.component.ts` → `src/fuxa-core/gauges/gauges-manager.ts`

- [ ] 6.2 移除 Angular 特定代码:
  ```typescript
  // 移除
  import { Injectable, Output, EventEmitter } from '@angular/core';
  @Injectable()
  
  // 替换为
  import { EventEmitter } from '../lib/event-emitter';
  ```

- [ ] 6.3 替换依赖注入为显式传递:
  ```typescript
  // 原始 - 构造函数注入
  constructor(
    private hmiService: HmiService,
    private authService: AuthService,
    private winRef: WindowRef
  ) { }
  
  // 改造后 - 显式初始化
  private hmiService: HmiService | null = null;
  
  init(hmiService: HmiService) {
    this.hmiService = hmiService;
  }
  ```

- [ ] 6.4 更新图元注册表，使用新的图元类:
  ```typescript
  static Gauges = [
    ShapesComponent,
    ValueComponent,
    HtmlButtonComponent,
    // ... 所有 21 种图元
  ];
  ```

- [ ] 6.5 保留所有核心方法（约 900 行）:
  - `createSettings()`
  - `createGaugeStatus()`
  - `initElementAdded()`
  - `bindGauge()`
  - `unbindGauge()`
  - `processValue()`
  - `getBindSignals()`
  - `getBindMouseEvent()`
  - `getHtmlEvents()`
  - `emitBindedSignals()`
  - `putEvent()`
  - `putSignalValue()`
  - `clearMemory()`

**验收**: 可以创建 GaugesManager 实例，注册图元，调用 processValue

---

### TODO 7: HMI 服务 - 适配层 (1天)

**目标**: 复制 `hmi.service.ts`，替换通信层

**任务**:
- [ ] 7.1 复制 `hmi.service.ts` → `src/fuxa-core/services/hmi-service.ts`

- [ ] 7.2 移除 Angular 特定代码:
  ```typescript
  // 移除
  import { Injectable, Output, EventEmitter } from '@angular/core';
  import { ToastrService } from 'ngx-toastr';
  import { TranslateService } from '@ngx-translate/core';
  @Injectable()
  ```

- [ ] 7.3 替换 RxJS:
  ```typescript
  // 原始
  import { BehaviorSubject, Subscription } from 'rxjs';
  private _onVariableChanged$ = new BehaviorSubject<Variable>(null);
  
  // 改造后
  import { EventEmitter } from '../lib/event-emitter';
  onVariableChanged = new EventEmitter<Variable>();
  ```

- [ ] 7.4 抽象通信层接口:
  ```typescript
  // 创建通信接口，允许 TB 适配器替换
  export interface IHmiCommunication {
    connect(url: string, token?: string): void;
    disconnect(): void;
    emit(event: string, data: any): void;
    on(event: string, callback: (data: any) => void): void;
  }
  
  // 默认 Socket.io 实现
  export class SocketIoCommunication implements IHmiCommunication { ... }
  
  // TB Widget 适配实现
  export class TBWidgetCommunication implements IHmiCommunication { ... }
  ```

- [ ] 7.5 保留所有核心方法（约 600 行）:
  - `setSignalValue()`
  - `putSignalValue()`
  - `addSignal()`
  - `addSignalGaugeToMap()`
  - `getValueInFunction()`
  - 等等

**验收**: 可以创建 HmiService 实例，设置和获取信号值

---

### TODO 8: 视图渲染器 - 核心适配 (2天)

**目标**: 复制 `fuxa-view.component.ts`，重构为非 Angular 类

**任务**:
- [ ] 8.1 复制 `fuxa-view.component.ts` → `src/fuxa-core/renderer/fuxa-view.ts`

- [ ] 8.2 移除 Angular 特定代码:
  ```typescript
  // 移除所有这些
  import { Component, OnInit, AfterViewInit, OnDestroy, ... } from '@angular/core';
  import { MatDialog } from '@angular/material/legacy-dialog';
  @Component({...})
  @Input(), @Output(), @ViewChild()
  @HostListener()
  ```

- [ ] 8.3 重构生命周期:
  ```typescript
  // 原始 Angular 生命周期
  ngOnInit() { ... }
  ngAfterViewInit() { ... }
  ngOnDestroy() { ... }
  
  // 改造后 - 显式方法
  export class FuxaViewRenderer {
    private container: HTMLElement;
    private gaugesManager: GaugesManager;
    private hmiService: HmiService;
    
    constructor(
      container: HTMLElement,
      gaugesManager: GaugesManager,
      hmiService: HmiService
    ) {
      this.container = container;
      this.gaugesManager = gaugesManager;
      this.hmiService = hmiService;
    }
    
    init(): void { /* ngOnInit + ngAfterViewInit 逻辑 */ }
    destroy(): void { /* ngOnDestroy 逻辑 */ }
  }
  ```

- [ ] 8.4 替换 ViewChild 为 DOM 查询:
  ```typescript
  // 原始
  @ViewChild('dataContainer') dataContainer: ElementRef;
  
  // 改造后
  private dataContainer: HTMLElement;
  
  init() {
    this.dataContainer = this.container.querySelector('.data-container');
  }
  ```

- [ ] 8.5 替换 MatDialog 为简单弹窗:
  ```typescript
  // 原始
  this.dialog.open(FuxaViewDialogComponent, { data: ... });
  
  // 改造后 - 使用回调
  onDialogRequest?: (config: DialogConfig) => void;
  
  openDialog(config: DialogConfig) {
    if (this.onDialogRequest) {
      this.onDialogRequest(config);
    }
  }
  ```

- [ ] 8.6 保留所有核心方法（约 1000 行）:
  - `loadHmi(view)` - 加载视图
  - `loadWatch(view)` - 初始化图元监听
  - `handleSignal(sig)` - 处理信号变化
  - `onBindMouseEvents(ga)` - 绑定鼠标事件
  - `onBindHtmlEvent(event)` - 绑定 HTML 事件
  - `runEvents(ga, ev, events)` - 执行事件
  - `loadPage(viewId)` - 页面导航
  - `onOpenCard()` - 打开浮窗
  - `openDialog()` - 打开对话框
  - `onSetValue()` - 设置值
  - `onToggleValue()` - 切换值
  - `onRunScript()` - 执行脚本
  - `loadVariableMapping()` - 变量映射
  - `applyVariableMapping()` - 应用映射
  - `clearGaugeStatus()` - 清理状态

**验收**: 可以创建 FuxaViewRenderer，加载 SVG 视图，响应数据变化

---

### TODO 9: TB 主题适配 (0.5天)

**目标**: 实现 ThingsBoard 主题系统集成，支持明暗主题切换

**任务**:
- [ ] 9.1 创建 `src/fuxa-core/theme/theme-manager.ts`:
  ```typescript
  export interface ThemeColors {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    divider: string;
  }

  export class ThemeManager {
    private theme: 'light' | 'dark' = 'light';
    private colors: ThemeColors;
    
    // 从 TB Widget 上下文检测主题
    detectTheme(ctx: any): 'light' | 'dark' {
      return ctx.settings?.darkMode || 
             document.body.classList.contains('tb-dark') 
             ? 'dark' : 'light';
    }
    
    // 获取 TB CSS 变量
    getTBColors(): ThemeColors {
      const style = getComputedStyle(document.body);
      return {
        primary: style.getPropertyValue('--tb-primary-color') || '#305680',
        accent: style.getPropertyValue('--tb-accent-color') || '#d97f0d',
        // ...
      };
    }
    
    // 应用主题到 SVG 元素
    applyThemeToSvg(svgElement: SVGElement): void { ... }
  }
  ```

- [ ] 9.2 创建 `src/fuxa-core/theme/theme-styles.css`:
  ```css
  /* TB 主题变量适配 */
  .tb-scada-widget {
    --scada-bg: var(--tb-background-color, #fff);
    --scada-surface: var(--tb-surface-color, #fff);
    --scada-text: var(--tb-text-primary, rgba(0,0,0,0.87));
    --scada-text-secondary: var(--tb-text-secondary, rgba(0,0,0,0.54));
    --scada-primary: var(--tb-primary-color, #305680);
    --scada-accent: var(--tb-accent-color, #d97f0d);
    --scada-success: var(--tb-success-color, #4caf50);
    --scada-warning: var(--tb-warning-color, #ff9800);
    --scada-error: var(--tb-error-color, #f44336);
    --scada-divider: var(--tb-divider-color, rgba(0,0,0,0.12));
  }
  
  /* 容器样式 */
  .tb-scada-widget {
    background-color: var(--scada-bg);
    color: var(--scada-text);
    font-family: Roboto, "Helvetica Neue", sans-serif;
  }
  
  /* SVG 文本默认样式 */
  .tb-scada-widget svg text:not([data-custom-fill]) {
    fill: var(--scada-text);
  }
  
  /* 控件样式 */
  .tb-scada-widget .gauge-button { ... }
  .tb-scada-widget .gauge-input { ... }
  .tb-scada-widget .gauge-select { ... }
  ```

- [ ] 9.3 在 GaugeBaseComponent 中添加主题支持:
  ```typescript
  static applyTheme(element: SVGElement, theme: 'light' | 'dark'): void {
    // 为未自定义颜色的元素应用主题色
  }
  ```

- [ ] 9.4 Widget Settings Schema 添加主题配置:
  ```json
  {
    "theme": {
      "mode": { "type": "string", "enum": ["auto", "light", "dark"] },
      "primaryColor": { "type": "string", "format": "color" },
      "accentColor": { "type": "string", "format": "color" }
    }
  }
  ```

**验收**: Widget 能跟随 TB 主题自动切换，控件样式与 TB 风格一致

---

### TODO 10: TB Widget 集成层 (1天)

**目标**: 创建 ThingsBoard Widget 适配器

**任务**:
- [ ] 10.1 创建 `src/tb-adapter/data-adapter.ts`:
  ```typescript
  export class TBDataAdapter {
    private hmiService: HmiService;
    
    constructor(hmiService: HmiService) {
      this.hmiService = hmiService;
    }
    
    // 将 TB 数据格式转换为 FUXA Variable
    onDataUpdated(data: WidgetSubscriptionData): void {
      data.forEach(item => {
        const variable: Variable = {
          id: item.dataKey.name,
          name: item.dataKey.label,
          value: item.data[0]?.[1],
          timestamp: item.data[0]?.[0]
        };
        this.hmiService.setSignalValue(variable);
      });
    }
  }
  ```

- [ ] 10.2 创建 `src/tb-adapter/rpc-adapter.ts`:
  ```typescript
  export class TBRpcAdapter implements IHmiCommunication {
    private ctx: WidgetContext;
    
    constructor(ctx: WidgetContext) {
      this.ctx = ctx;
    }
    
    emit(event: string, data: any): void {
      if (event === 'set-value') {
        this.ctx.controlApi.sendOneWayCommand(
          data.method,
          data.params
        );
      }
    }
  }
  ```

- [ ] 10.3 创建 `src/widgets/scada-viewer/controller.ts`:
  ```typescript
  // TB Widget 入口
  self.onInit = function() {
    const container = self.ctx.$container[0];
    const settings = self.ctx.settings;
    
    // 初始化 FUXA 核心
    const hmiService = new HmiService();
    const gaugesManager = new GaugesManager();
    gaugesManager.init(hmiService);
    
    const renderer = new FuxaViewRenderer(
      container,
      gaugesManager,
      hmiService
    );
    
    // 加载视图
    const view = settings.view; // 从 Widget 配置获取
    renderer.init();
    renderer.loadHmi(view);
    
    // 设置数据适配器
    self.ctx.dataAdapter = new TBDataAdapter(hmiService);
  };
  
  self.onDataUpdated = function() {
    self.ctx.dataAdapter.onDataUpdated(self.ctx.data);
  };
  
  self.onDestroy = function() {
    self.ctx.renderer.destroy();
  };
  ```

**验收**: Widget 可以在 ThingsBoard 中加载，显示 SVG，响应数据变化

---

### TODO 11: 测试和验证 (1天)

**任务**:
- [ ] 11.1 创建本地测试页面 `dev/index.html`
- [ ] 11.2 测试所有 21 种图元的 processValue
- [ ] 11.3 测试动画系统 (blink, rotate, move, hide/show)
- [ ] 11.4 测试事件系统 (click, dblclick, mousedown/up, mouseover/out)
- [ ] 11.5 测试变量映射功能
- [ ] 11.6 打包构建测试
- [ ] 11.7 在 ThingsBoard 中端到端测试

---

## 五、时间估算

| TODO | 内容 | 预计时间 |
|------|------|----------|
| TODO 1 | 事件系统 | 0.5 天 |
| TODO 2 | 数据模型层 | 0.5 天 |
| TODO 3 | 工具函数层 | 0.5 天 |
| TODO 4 | 图元基类 | 0.5 天 |
| TODO 5 | 21种图元组件 | 2 天 |
| TODO 6 | 图元管理器 | 1.5 天 |
| TODO 7 | HMI 服务 | 1 天 |
| TODO 8 | 视图渲染器 | 2 天 |
| TODO 9 | TB 主题适配 | 0.5 天 |
| TODO 10 | TB 集成层 | 1 天 |
| TODO 11 | 测试验证 | 1 天 |
| **总计** | | **11 天** |

---

## 六、关键验收标准

### 功能完整性
- [ ] 21 种图元全部可用
- [ ] 所有动画类型正常工作 (hide/show/blink/rotate/move/clockwise/anticlockwise)
- [ ] 所有事件类型正常工作 (12 种事件动作)
- [ ] 变量映射功能正常
- [ ] 页面导航功能正常
- [ ] 浮窗/对话框功能正常

### 性能一致性
- [ ] 变化检测优化保留 (onlyChange 逻辑)
- [ ] 信号-图元映射表保留
- [ ] 动画清理机制保留
- [ ] 内存管理正常

### 代码质量
- [ ] TypeScript 编译无错误
- [ ] 所有方法签名与 FUXA 原版一致
- [ ] 无功能裁剪

---

## 七、风险点

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 图表组件依赖复杂 | HtmlChart/HtmlGraph 可能有额外依赖 | 先跳过，后续单独处理 |
| 第三方库缺失 | SVG.js, Numeral.js 等 | 打包时包含，或使用 CDN |
| 编辑器功能缺失 | 无法编辑 SVG | 继续使用 FUXA 编辑器导出 |

---

## 八、执行顺序建议

1. **先做 TODO 1-4** (基础层) - 确保基础设施就绪
2. **再做 TODO 5** (图元) - 先做 Shapes 和 Value，验证流程
3. **然后做 TODO 6-7** (管理器和服务) - 核心逻辑
4. **接着做 TODO 8** (渲染器) - 最复杂的部分
5. **最后做 TODO 9-11** (主题适配、集成和测试) - 收尾工作

每完成一个 TODO，都要确保 TypeScript 编译通过，再进行下一步。
