# FUXA 前端源码分析报告

## 一、项目结构概览

### 1.1 文件统计

| 模块 | 文件数 | 大小 | 说明 |
|------|--------|------|------|
| Gauges (图元/控件) | 41 个 TS | ~1.2MB | 核心图元系统 |
| Editor (编辑器) | 17 个 TS | ~480KB | 可视化编辑器 |
| Services (服务层) | 20 个 TS | ~204KB | 业务逻辑 |
| Models (数据模型) | 19 个 TS | - | 数据结构定义 |
| Helpers (工具库) | - | ~112KB | 工具函数 |
| **总计** | **259 个 TS** | - | - |

### 1.2 核心目录结构

```
FUXA/client/src/app/
├── _models/                    # 数据模型定义
│   ├── hmi.ts                 # 核心数据模型 (765 行) ⭐
│   ├── device.ts              # 设备/标签定义
│   └── ...
│
├── _services/                  # 业务逻辑服务
│   ├── hmi.service.ts         # HMI 数据绑定与通信 (777 行) ⭐
│   ├── project.service.ts     # 项目管理
│   └── ...
│
├── gauges/                     # 图元系统 (1.2MB) ⭐⭐⭐
│   ├── gauge-base/            # 基础组件
│   ├── gauges.component.ts    # 图元管理器 (1012 行) ⭐⭐
│   ├── controls/              # HTML 控件类
│   │   ├── pipe/              # 管道图元
│   │   ├── slider/            # 滑块
│   │   ├── html-input/        # 输入框
│   │   ├── html-button/       # 按钮
│   │   ├── html-select/       # 下拉框
│   │   ├── html-chart/        # 图表
│   │   ├── html-table/        # 表格
│   │   └── ...
│   └── shapes/                # SVG 图形
│       ├── shapes.component.ts    # 通用图形
│       ├── proc-eng/              # 过程工程图形
│       └── ape-shapes/            # APE 图形库
│
├── fuxa-view/                  # SVG 渲染引擎 ⭐⭐⭐
│   └── fuxa-view.component.ts # 主渲染组件 (1220 行)
│
├── editor/                     # 可视化编辑器
│   ├── editor.component.ts    # 编辑器主组件
│   ├── view-property/         # 视图属性
│   └── svg-selector/          # SVG 选择器
│
├── _helpers/                   # 工具库
│   ├── svg-utils.ts           # SVG 处理工具
│   └── utils.ts               # 通用工具
│
└── assets/lib/                 # 第三方库
    ├── svg/                    # SVG.js 库
    └── svgeditor/              # SVG 编辑器库 (169 个文件)
        ├── fuxa-editor.min.js
        └── shapes/             # 图形定义
            ├── shapes.js
            ├── proc-shapes.js
            ├── proc-eng.js
            └── ape-shapes.js
```

## 二、SVG 渲染核心

### 2.1 依赖的第三方库

```typescript
declare var SVG: any;         // SVG.js - 主要 SVG 操作库
declare var Raphael: any;     // Raphael - 兼容库
declare var $: any;           // jQuery - DOM 操作
```

**关键库文件：**
- `/assets/lib/svg/svg.js` - SVG 绘制引擎
- `/assets/lib/svgeditor/fuxa-editor.min.js` - 自定义编辑器
- `/assets/lib/svgeditor/shapes/*.js` - 工业图形定义

### 2.2 渲染流程

```
FuxaViewComponent (主渲染组件)
        │
        ▼
loadHmi(view: View)
        │
        ├── view.svgcontent (SVG 字符串)
        │
        ├── 注入到 DOM
        │   dataContainer.nativeElement.innerHTML = view.svgcontent
        │
        └── loadWatch(view) 初始化图元绑定
                │
                ▼
        GaugesManager.initElementAdded()
                │
                ├── 创建图元实例 (Controls/Shapes)
                ├── 绑定数据源 (Variable/Signal)
                └── 订阅数据变化
                        │
                        ▼
        HmiService.onVariableChanged (Socket.io 或 Bridge)
                        │
                        ▼
        processValue() 更新 SVG 属性
                │
                └── 执行动画 (Blink, Rotate, Move)
```

### 2.3 核心渲染代码 (FuxaViewComponent)

**文件：** `fuxa-view/fuxa-view.component.ts`

```typescript
@Component({
  selector: 'app-fuxa-view',
  templateUrl: './fuxa-view.component.html',
})
export class FuxaViewComponent implements OnInit, OnDestroy {
  
  @ViewChild('dataContainer') dataContainer: ElementRef;
  @Input() view: View;
  @Input() hmi: Hmi;
  @Input() variablesMapping: any = [];  // 变量映射 (用于 TB 适配)
  
  // 加载 HMI 视图
  loadHmi(view: View) {
    // 1. 注入 SVG 内容
    this.dataContainer.nativeElement.innerHTML = view.svgcontent;
    
    // 2. 初始化图元绑定
    this.loadWatch(view);
  }
  
  // 初始化图元监听
  private loadWatch(view: View) {
    // 遍历所有图元配置
    for (let key in view.items) {
      let gauge = view.items[key];
      // 通过 GaugesManager 初始化
      this.gaugesManager.initElementAdded(gauge, this.resolver, ...);
    }
  }
  
  // 数据变化处理
  private onGaugeValueChanged(sig: Variable) {
    // 更新对应图元
    this.gaugesManager.processValue(sig, this.hmi);
  }
}
```

## 三、数据模型

### 3.1 核心数据结构 (hmi.ts)

**文件：** `_models/hmi.ts` (765 行)

```typescript
// ===== HMI 项目 =====
export class Hmi {
  views: View[];              // 视图列表
  devices: Device[];          // 设备列表
  // ...
}

// ===== View 视图 =====
export class View {
  id: string;                               // 视图 ID
  name: string;                             // 视图名称
  svgcontent: string;                       // SVG 代码字符串 ⭐
  items: DictionaryGaugeSettings = {};      // 图元配置字典 ⭐
  variables: DictionaryVariables = {};      // 变量字典
  type: ViewType;                           // svg | cards | maps
}

// ===== GaugeSettings 图元配置 =====
export class GaugeSettings {
  id: string;                    // 图元 ID (对应 SVG 中的 id 属性)
  type: string;                  // 图元类型 (svg-ext-pipe, svg-ext-shapes...)
  name: string;                  // 显示名称
  label: string;                 // 标签
  property: GaugeProperty;       // 属性配置 ⭐
}

// ===== GaugeProperty 图元属性 =====
export class GaugeProperty {
  variableId: string;            // 绑定的变量 ID ⭐
  ranges: GaugeRangeProperty[];  // 数值范围 → 颜色映射 ⭐
  events: GaugeEvent[];          // 事件配置
  actions: GaugeAction[];        // 动画/交互动作 ⭐
  options: any;                  // 控件特定选项
}

// ===== 数值范围映射 =====
export class GaugeRangeProperty {
  min: number;                   // 最小值
  max: number;                   // 最大值
  color: string;                 // 填充颜色
  stroke: string;                // 边框颜色
  text: string;                  // 显示文本
}

// ===== 动画动作 =====
export class GaugeAction {
  type: string;                  // 动作类型
  range: GaugeRangeProperty;     // 触发范围
  options: any;                  // 动作选项
}

// ===== 变量 =====
export class Variable {
  id: string;                    // 变量 ID
  name: string;                  // 变量名
  value: any;                    // 当前值
  timestamp: number;             // 时间戳
}
```

### 3.2 图元在 SVG 中的标记方式

图元通过 SVG 元素的 `id` 和 `type` 属性标识：

```xml
<!-- 管道示例 -->
<g id="pump_1" type="svg-ext-pipe">
  <path id="PIE_1" d="M10,10 L100,10"></path>
  <path id="cPIE_1" d="M10,10 L100,10" 
        style="stroke-dasharray: 1000; stroke-dashoffset: 0;"></path>
</g>

<!-- 通用图形示例 -->
<rect id="rect_1" type="svg-ext-shapes" 
      x="10" y="10" width="100" height="50" fill="#3498db"></rect>
```

## 四、图元系统

### 4.1 图元类型列表

| 图元类型 | TypeTag | 文件位置 | 功能 |
|---------|---------|---------|------|
| **Shapes** | `svg-ext-shapes` | `gauges/shapes/shapes.component.ts` | 通用 SVG 图形 |
| **Pipe** | `svg-ext-pipe` | `gauges/controls/pipe/pipe.component.ts` | 管道流动动画 |
| **ProcEng** | `svg-ext-proc-eng` | `gauges/shapes/proc-eng/` | 过程工程图形 |
| **ApeShapes** | `svg-ext-ape` | `gauges/shapes/ape-shapes/` | APE 库图形 |
| **Value** | `svg-ext-value` | `gauges/controls/value/` | 数值显示 |
| **HtmlInput** | `html-input` | `gauges/controls/html-input/` | 输入框 |
| **HtmlButton** | `html-button` | `gauges/controls/html-button/` | 按钮 |
| **HtmlSelect** | `html-select` | `gauges/controls/html-select/` | 下拉列表 |
| **Slider** | `slider` | `gauges/controls/slider/` | 滑块 |
| **GaugeProgress** | `gauge-progress` | `gauges/controls/gauge-progress/` | 进度条 |
| **HtmlChart** | `html-chart` | `gauges/controls/html-chart/` | 图表 |
| **HtmlTable** | `html-table` | `gauges/controls/html-table/` | 数据表 |

### 4.2 图元类接口

每个图元类都实现以下静态接口：

```typescript
export class PipeComponent {
  // ===== 标识 =====
  static TypeTag = 'svg-ext-pipe';           // 唯一类型标识
  static LabelTag = 'Pipe';                  // 显示名称
  
  // ===== SVG 元素前缀 =====
  static prefixB = 'PIE_';                   // 主元素前缀
  static prefixAnimation = 'aPIE_';          // 动画元素前缀
  
  // ===== 支持的动画类型 =====
  static actionsType = {
    stop: GaugeActionsType.stop,
    clockwise: GaugeActionsType.clockwise,
    anticlockwise: GaugeActionsType.anticlockwise,
    blink: GaugeActionsType.blink
  };
  
  // ===== 核心方法 =====
  
  /** 提取绑定的所有变量 ID */
  static getSignals(pro: GaugeProperty): string[] {
    let res: string[] = [];
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    // ...收集 actions 中的变量
    return res;
  }
  
  /** 获取支持的动画类型 */
  static getActions(type: string): any {
    return this.actionsType;
  }
  
  /** 处理数据值变化 ⭐ 核心渲染逻辑 */
  static processValue(
    gaugeSettings: GaugeSettings,
    svgElement: any,
    signal: Variable,
    gaugeStatus: GaugeStatus
  ) {
    // 根据值更新 SVG 属性
    // 执行动画
  }
}
```

### 4.3 GaugesManager (图元管理器)

**文件：** `gauges/gauges.component.ts` (1012 行)

```typescript
@Injectable()
export class GaugesManager {
  
  // 注册的图元类型列表
  static Gauges = [
    ShapesComponent,
    PipeComponent,
    ProcEngComponent,
    ApeShapesComponent,
    ValueComponent,
    HtmlInputComponent,
    HtmlButtonComponent,
    // ...
  ];
  
  /** 创建图元配置 */
  createSettings(id: string, type: string): GaugeSettings {
    for (let i = 0; i < GaugesManager.Gauges.length; i++) {
      if (type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
        let gs = new GaugeSettings(id, type);
        gs.label = GaugesManager.Gauges[i].LabelTag;
        return gs;
      }
    }
    return null;
  }
  
  /** 初始化图元 */
  initElementAdded(
    gauge: GaugeSettings, 
    resolver: ComponentFactoryResolver,
    viewContainerRef: ViewContainerRef,
    isEditor: boolean
  ) {
    // 根据类型创建对应的图元实例
    // 绑定数据源
    // 设置事件处理
  }
  
  /** 处理数据变化 */
  processValue(sig: Variable, hmi: Hmi) {
    // 找到绑定该变量的所有图元
    // 调用对应图元类的 processValue 方法
  }
}
```

## 五、动画引擎

### 5.1 动画类型枚举

```typescript
export enum GaugeActionsType {
  hide = 'shapes.action-hide',                   // 隐藏
  show = 'shapes.action-show',                   // 显示
  blink = 'shapes.action-blink',                 // 闪烁
  stop = 'shapes.action-stop',                   // 停止
  clockwise = 'shapes.action-clockwise',         // 顺时针旋转
  anticlockwise = 'shapes.action-anticlockwise', // 逆时针旋转
  rotate = 'shapes.action-rotate',               // 旋转到指定角度
  move = 'shapes.action-move',                   // 移动
  downup = 'shapes.action-downup',               // 上下移动
}
```

### 5.2 动画实现原理

**SVG.js 动画 API：**

```typescript
// 旋转动画 (Shapes)
element.animate(3000)           // 3000ms 动画时长
  .ease('-')                    // 线性缓动
  .rotate(angle)                // 旋转角度
  .loop()                       // 无限循环

// 移动动画
element.animate(200)
  .ease('-')
  .transform({tx: moveX, ty: moveY})

// 管道流动动画 (通过 CSS)
eletoanim.style.strokeDashoffset = len;  // stroke-dashoffset 实现流动
```

### 5.3 动画状态管理

```typescript
export class GaugeActionStatus {
  type: string;           // 动画类型
  timer?: any = null;     // setInterval 定时器句柄
  animr?: any = null;     // SVG.js 动画对象
  spool?: any;            // 存储原始值用于恢复
}

export class GaugeStatus {
  variablesValue = {};              // 当前变量值缓存
  actionRef: GaugeActionStatus;     // 当前运行的动画状态
}
```

## 六、数据绑定与通信

### 6.1 数据流架构

```
后端 (Socket.io / REST API)
        │
        ▼
HmiService.onVariableChanged (EventEmitter)
        │
        ▼
GaugesManager.onchange (订阅回调)
        │
        ▼
FuxaViewComponent.subscriptionOnChange
        │
        ▼
各图元类.processValue() 更新 SVG
```

### 6.2 HmiService 关键代码

**文件：** `_services/hmi.service.ts`

```typescript
@Injectable()
export class HmiService {
  
  // 变量变化事件
  @Output() onVariableChanged: EventEmitter<Variable> = new EventEmitter();
  
  // 变量缓存
  variables = {};
  
  /** 设置变量值 (内部调用) */
  setSignalValue(sig: Variable) {
    this.variables[sig.id] = sig;
    this.onVariableChanged.emit(sig);  // 发出变化事件
  }
  
  /** 写入变量值到后端 */
  putSignalValue(sigId: string, value: string, fnc: string = null) {
    this.socket.emit(IoEventTypes.DEVICE_VALUES, {
      cmd: 'set',
      var: this.variables[sigId],
      fnc: [fnc, value]
    });
  }
}
```

### 6.3 变量映射机制 (TB 适配关键)

FUXA 已内置变量映射功能，可用于 ThingsBoard 适配：

```typescript
// FuxaViewComponent 中的变量映射
@Input() variablesMapping: any = [];  // 从父组件传入映射配置

private loadVariableMapping(variablesMapped?: any) {
  this.variablesMapping?.forEach(variableMapping => {
    // 建立映射关系: FUXA变量ID → 外部数据源
    this.plainVariableMapping[variableMapping.from.variableId] = 
      variableMapping.to;
  });
}

// 应用映射
let items = this.applyVariableMapping(view.items, sourceTags);
```

## 七、编辑器实现

### 7.1 编辑器主组件

**文件：** `editor/editor.component.ts`

```typescript
@Component({...})
export class EditorComponent implements OnInit, AfterViewInit, OnDestroy {
  
  currentView: View = null;           // 当前视图
  hmi: Hmi = new Hmi();               // HMI 数据
  selectedElement: SelElement;         // 选中的元素
  
  // 面板状态
  panelsState = {
    panelView: true,       // 视图列表面板
    panelGeneral: true,    // 通用属性面板
    panelC: true,          // 颜色面板
    panelD: true,          // 属性面板
    panelS: true,          // 大小面板
    panelWidgets: true,    // 图元面板
  };
  
  // 保存项目
  onSaveProject() { ... }
  
  // 编辑元素
  onEditElement(element) { ... }
  
  // 编辑图元属性
  onEditPropertyGauge(gaugeSettings: GaugeSettings) { ... }
}
```

### 7.2 编辑器依赖的库

- **fuxa-editor.min.js** - 自定义 SVG 编辑器 (基于 jQuery)
- **shapes/*.js** - 图形定义库
  - `shapes.js` - 基础图形
  - `proc-shapes.js` - 工业流程图
  - `proc-eng.js` - 过程工程
  - `ape-shapes.js` - APE 图形

## 八、依赖分析

### 8.1 Angular 依赖

```json
{
  "@angular/core": "16.2.12",
  "@angular/material": "16.2.13",
  "@angular/animations": "16.2.12",
  "angular-gridster2": "^16.0.0",
  "angular2-draggable": "^16.0.0",
  "@ngx-translate/core": "^14.0.0"
}
```

### 8.2 核心第三方库

| 库 | 用途 | 是否必需 |
|----|------|----------|
| **SVG.js** | SVG 绑制和动画 | ✅ 必需 |
| **jQuery** | DOM 操作 | ✅ 必需 (编辑器) |
| **Socket.io** | 实时通信 | ❌ 可替换 |
| **Chart.js** | 图表 | ⚠️ 按需 |
| **Numeral.js** | 数值格式化 | ⚠️ 按需 |

### 8.3 Angular 耦合程度评估

| 模块 | 耦合程度 | 说明 |
|------|----------|------|
| 数据模型 (hmi.ts) | **低** | 纯 TypeScript 类，可直接复用 |
| 图元类 (静态方法) | **低** | processValue 等静态方法可独立使用 |
| GaugesManager | **中** | 需要重构 DI 部分 |
| FuxaViewComponent | **高** | 深度使用 Angular 生命周期 |
| EditorComponent | **高** | 深度使用 Angular + Material |
| HmiService | **中** | 主要是 EventEmitter，可替换 |

## 九、关键文件清单

### 9.1 必须提取的文件 (Top 15)

| 优先级 | 文件 | 行数 | 用途 |
|--------|------|------|------|
| P0 | `_models/hmi.ts` | 765 | 核心数据模型 |
| P0 | `fuxa-view/fuxa-view.component.ts` | 1220 | SVG 渲染引擎 |
| P0 | `gauges/gauges.component.ts` | 1012 | 图元管理器 |
| P0 | `gauges/gauge-base/gauge-base.component.ts` | 400+ | 图元基类 |
| P1 | `_services/hmi.service.ts` | 777 | 数据绑定服务 |
| P1 | `gauges/shapes/shapes.component.ts` | 200+ | 通用图形 |
| P1 | `gauges/controls/pipe/pipe.component.ts` | 300+ | 管道图元 |
| P1 | `_helpers/svg-utils.ts` | 200+ | SVG 工具库 |
| P2 | `gauges/shapes/proc-eng/proc-eng.component.ts` | 200+ | 工程图形 |
| P2 | `gauges/shapes/ape-shapes/ape-shapes.component.ts` | 300+ | APE 图形 |
| P2 | `_models/device.ts` | 500+ | 设备模型 |
| P2 | `gauge-property/gauge-property.component.ts` | 400+ | 属性编辑器 |
| P3 | `editor/editor.component.ts` | 1000+ | 可视化编辑器 |
| P3 | `assets/lib/svg/svg.js` | 3000+ | SVG 库 |
| P3 | `assets/lib/svgeditor/` | - | 编辑器库 |

## 十、集成方案建议

### 方案 A：直接嵌入 FUXA Angular 模块 (推荐)

**原理：** ThingsBoard 本身基于 Angular，可以直接集成 FUXA 的 Angular 模块。

**优点：**
- 最小改动，保持 FUXA 完整功能
- 可利用 TB 现有的 Angular 基础设施
- 编辑器功能完整保留

**实现：**
```typescript
// TB Widget 中引入 FUXA 模块
import { FuxaViewModule } from '@fuxa/view';
import { FuxaEditorModule } from '@fuxa/editor';

@NgModule({
  imports: [
    FuxaViewModule,
    FuxaEditorModule,
  ]
})
export class ScadaWidgetModule { }
```

### 方案 B：提取核心 + 重写适配层

**原理：** 提取 FUXA 的核心渲染逻辑，重写 Angular 部分。

**优点：**
- 更轻量
- 完全控制代码

**缺点：**
- 工作量大
- 编辑器需要重写

### 方案 C：iframe 嵌入

**原理：** 将 FUXA 作为独立应用，通过 iframe 嵌入 TB。

**优点：**
- 零改动
- 完全隔离

**缺点：**
- 数据交互复杂
- 样式不统一

---

## 十一、下一步行动

1. **验证方案 A 可行性** - 测试 FUXA Angular 模块在 TB Widget 中的集成
2. **实现数据桥接** - 将 TB 数据源连接到 FUXA 的 HmiService
3. **配置持久化** - 将 View 配置存储到 TB Widget Settings
4. **编辑器适配** - 在 TB 中集成 FUXA 编辑器
