# FUXA 源码深度分析报告

> 更新日期: 2025-12-23

## 一、项目概述

FUXA 是一个开源的工业 SCADA/HMI 解决方案，支持多种工业协议和数据源。采用前后端分离架构，前端使用 Angular，后端使用 Node.js。

**核心特点**:
- 完整的 HMI 组态系统（SCADA 画面编辑和预览）
- 支持多种工业设备协议（OPC-UA, Modbus, S7, MQTT 等）
- 动态 SVG 渲染引擎
- 基于事件的交互系统
- 可视化数据分析（图表、表格）

---

## 二、项目结构

### 2.1 顶级目录

```
FUXA/
├── client/                    # 前端应用 (Angular)
├── server/                    # 后端应用 (Node.js)
├── app/                       # 桌面应用 (Electron)
├── node-red/                  # Node-RED 集成
├── odbc/                      # ODBC 驱动支持
└── wiki/                      # 文档
```

### 2.2 前端核心架构 (client/src/app/)

**共 259 个 TypeScript 文件**

```
client/src/app/
├── _helpers/              # 工具函数库 (12 files)
│   ├── define.ts          # 图标和常量定义
│   ├── utils.ts           # 通用工具函数 (25KB)
│   ├── svg-utils.ts       # SVG 处理工具
│   ├── calc.ts            # 计算函数
│   ├── event-utils.ts     # 事件工具
│   └── json-utils.ts      # JSON 工具
│
├── _models/               # 数据模型定义 (19 files)
│   ├── hmi.ts             # 核心 HMI 数据模型 (17KB) ⭐⭐⭐
│   ├── device.ts          # 设备模型 (26KB)
│   ├── chart.ts           # 图表模型
│   ├── graph.ts           # 图形模型
│   ├── alarm.ts           # 报警模型
│   └── project.ts         # 项目模型
│
├── _services/             # 业务服务层 (23 files)
│   ├── hmi.service.ts     # HMI 核心服务 (45KB) ⭐⭐⭐
│   ├── project.service.ts # 项目管理服务 (45KB)
│   ├── auth.service.ts    # 认证服务
│   └── script.service.ts  # 脚本执行服务
│
├── fuxa-view/             # 视图渲染组件 ⭐⭐⭐
│   ├── fuxa-view.component.ts      # 核心渲染器 (51KB, 1221行)
│   ├── fuxa-view.component.html
│   └── fuxa-view-dialog/           # 对话框组件
│
├── gauges/                # 图元系统 ⭐⭐⭐⭐⭐
│   ├── gauges.component.ts         # 图元管理器 (45KB, 1012行)
│   ├── gauge-base/                 # 基础图元类
│   │   └── gauge-base.component.ts # 基类 (10KB)
│   ├── controls/                   # 所有控制图元 (20种)
│   │   ├── value/                  # 数值显示
│   │   ├── html-button/            # HTML 按钮
│   │   ├── html-input/             # HTML 输入框
│   │   ├── html-select/            # HTML 下拉选择
│   │   ├── html-switch/            # HTML 开关
│   │   ├── gauge-progress/         # 进度条
│   │   ├── gauge-semaphore/        # 信号灯
│   │   ├── html-chart/             # 曲线图表
│   │   ├── html-graph/             # 柱状图/饼图
│   │   ├── html-table/             # 数据表格
│   │   ├── slider/                 # 滑块
│   │   ├── pipe/                   # 管道
│   │   ├── panel/                  # 面板
│   │   ├── html-image/             # 图像
│   │   ├── html-video/             # 视频
│   │   ├── html-iframe/            # IFrame
│   │   ├── html-scheduler/         # 计划调度
│   │   └── html-bag/               # 仪表盘
│   ├── shapes/                     # SVG 形状组件
│   │   ├── shapes.component.ts     # 基础形状
│   │   ├── ape-shapes/             # APE 形状库
│   │   └── proc-eng/               # 工程流程形状
│   └── gauge-property/             # 图元属性编辑面板
│
├── editor/                # 组态编辑器 (18 directories)
│   ├── editor.component.ts         # 编辑器主组件 (64KB)
│   ├── editor.component.html       # 编辑器 UI (81KB)
│   ├── svg-selector/               # SVG 元素选择器
│   ├── layout-property/            # 布局属性
│   └── chart-config/               # 图表配置
│
└── assets/lib/            # 第三方库
    ├── svg/               # SVG.js 库
    └── svgeditor/         # SVG 编辑器库
        ├── fuxa-editor.min.js
        └── shapes/        # 图形定义
```

### 2.3 后端架构 (server/)

```
server/
├── runtime/               # 运行时核心
│   ├── devices/           # 设备驱动
│   │   ├── modbus/        # Modbus 协议
│   │   ├── s7/            # Siemens S7
│   │   ├── opcua/         # OPC-UA
│   │   ├── mqtt/          # MQTT
│   │   └── bacnet/        # BACnet
│   ├── storage/           # 数据存储
│   │   ├── sqlite/
│   │   ├── influxdb/
│   │   └── tdengine/
│   ├── scripts/           # 脚本执行引擎
│   ├── alarms/            # 报警系统
│   └── scheduler/         # 任务调度
├── api/                   # REST API
└── main.js                # 应用入口
```

---

## 三、核心渲染系统

### 3.1 渲染流程总览

```
┌─────────────────────────────────────────────────────────────┐
│                    FuxaViewComponent                         │
│                    (视图渲染主组件)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ngAfterViewInit()
                         │
                         ▼
              ┌──────────────────────┐
              │   loadHmi(view)      │
              │   加载 HMI 视图       │
              └──────────┬───────────┘
                         │
          ┌──────────────┴──────────────┐
          │                              │
          ▼                              ▼
   注入 SVG 到 DOM                 loadWatch(view)
   innerHTML = svgcontent          初始化图元绑定
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                         ▼                               ▼
              initElementAdded()                  bindGauge()
              初始化图元                          绑定信号和事件
                         │                               │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                              订阅 onchange 事件
                              监听信号变化
                                         │
                                         ▼
                    ┌────────────────────────────────────┐
                    │      handleSignal(sig)             │
                    │      处理信号变化                    │
                    └────────────────┬───────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │      processValue()                │
                    │      更新 SVG 元素                  │
                    │      执行动画/动作                  │
                    └────────────────────────────────────┘
```

### 3.2 核心组件职责

#### FuxaViewComponent (fuxa-view.component.ts)
**职责**: 视图渲染主控制器

```typescript
关键属性:
- dataContainer: ElementRef      // SVG 容器
- view: View                     // 当前视图
- hmi: Hmi                       // HMI 配置
- variablesMapping: any[]        // 变量映射（TB适配关键）
- mapGaugeStatus: {}             // 图元状态缓存

关键方法:
- loadHmi(view)                  // 加载视图，注入 SVG
- loadWatch(view)                // 初始化所有图元绑定
- handleSignal(sig)              // 处理信号变化
- onBindMouseEvents(ga)          // 绑定鼠标事件
- onBindHtmlEvent(event)         // 绑定 HTML 事件
- runEvents(events)              // 执行事件动作
- clearGaugeStatus()             // 清理动画和定时器
```

#### GaugesManager (gauges.component.ts)
**职责**: 图元管理器，协调所有图元类型

```typescript
关键属性:
- onchange: EventEmitter         // 信号变化事件
- onevent: EventEmitter          // 用户交互事件
- eventGauge: MapGaugesSetting   // 有事件的图元映射
- memorySigGauges: {}            // 信号 → 图元映射
- mapChart: {}                   // 图表实例缓存
- mapGauges: {}                  // 图元实例缓存
- mapTable: {}                   // 表格实例缓存

静态属性:
- Gauges: ComponentClass[]       // 所有图元类型列表（21种）

关键方法:
- createSettings(id, type)       // 创建图元配置
- initElementAdded(gauge, ...)   // 初始化图元
- bindGauge(gauge, ...)          // 绑定图元到信号/事件
- unbindGauge(gauge)             // 解绑图元
- processValue(ga, svgele, sig, status)  // 处理值更新
- getBindSignals(property)       // 获取绑定的信号列表
```

### 3.3 SVG 加载和绑定流程

```
1. SVG 获取
   └── view.svgcontent 包含完整的 SVG XML 字符串

2. SVG 注入 DOM
   └── dataContainer.nativeElement.innerHTML = view.svgcontent

3. SVG 元素查询
   └── document.getElementById(gaugeId)
   └── SVG.adopt(svgElement)  // SVG.js 库包装

4. 元素绑定
   ├── 添加 id（如果不存在）
   ├── 添加 type 属性（如 'svg-ext-html_button'）
   └── 关联到图元配置

5. 事件绑定
   └── svgElement.click()
   └── svgElement.mouseover()
   └── 等等

6. 样式更新
   ├── 修改 fill 属性（填充色）
   ├── 修改 stroke 属性（边框色）
   ├── 修改 text content（文本内容）
   ├── 应用变换（旋转、移动）
   └── 应用动画（闪烁）
```

---

## 四、数据模型 (hmi.ts)

### 4.1 核心类结构

```typescript
// ===== HMI 项目顶层 =====
export class Hmi {
    layout: LayoutSettings;      // 布局配置
    views: View[] = [];          // 所有视图列表
}

// ===== 单个视图 =====
export class View {
    id: string;                           // 视图 ID
    name: string;                         // 视图名称
    profile: DocProfile;                  // 尺寸、背景色、对齐
    items: DictionaryGaugeSettings = {};  // 图元集合（字典）
    variables: DictionaryVariables = {};  // 变量列表
    svgcontent: string;                   // SVG 内容（XML字符串）
    type: ViewType;                       // svg | cards | maps
    property: ViewProperty;               // 视图属性（事件脚本）
}

// ===== 单个图元配置 =====
export class GaugeSettings {
    id: string;                   // 图元 ID（对应 SVG 中的 id）
    type: string;                 // 图元类型（如 'svg-ext-html_button'）
    name: string;                 // 图元名称
    label: string;                // 图元标签（如 'HtmlButton'）
    property: GaugeProperty;      // 图元属性配置
    hide: boolean;
    lock: boolean;
}

// ===== 图元属性 =====
export class GaugeProperty {
    variableId: string;           // 绑定的变量 ID
    variableValue: string;        // 变量默认值
    bitmask: number;              // 位掩码（位操作）
    permission: number;           // 权限控制
    ranges: GaugeRangeProperty[]; // 范围样式映射
    events: GaugeEvent[] = [];    // 事件列表
    actions: GaugeAction[] = [];  // 动作列表
    options: any;                 // 图元特定选项
    readonly: boolean;
    text: string;                 // 文本内容
}

// ===== 范围属性（条件样式）=====
export class GaugeRangeProperty {
    min: number;           // 最小值
    max: number;           // 最大值
    text: string;          // 显示文本
    color: string;         // 填充色
    stroke: string;        // 边框色
}

// ===== 事件配置 =====
export class GaugeEvent {
    type: string;          // 事件类型（click, dblclick 等）
    action: string;        // 动作类型（onpage, onSetValue 等）
    actparam: string;      // 动作参数
    actoptions: any;       // 动作选项
}

// ===== 动作配置 =====
export class GaugeAction {
    variableId: string;    // 触发变量 ID
    range: GaugeRangeProperty; // 触发范围
    type: string;          // 动作类型（hide, blink, rotate 等）
    options: any;          // 动作选项
}

// ===== 变量 =====
export class Variable {
    id: string;            // 变量 ID
    name: string;          // 变量名
    value: any;            // 当前值
    timestamp: number;     // 时间戳
}
```

### 4.2 图元在 SVG 中的标记方式

```xml
<!-- 管道示例 -->
<g id="pump_1" type="svg-ext-pipe">
  <path id="PIE_1" d="M10,10 L100,10"></path>
  <path id="cPIE_1" d="M10,10 L100,10" 
        style="stroke-dasharray: 1000; stroke-dashoffset: 0;"></path>
</g>

<!-- 通用形状示例 -->
<rect id="rect_1" type="svg-ext-shapes" 
      x="10" y="10" width="100" height="50" fill="#3498db"></rect>

<!-- 按钮示例 -->
<g id="btn_1" type="svg-ext-html_button">
  <rect ... />
  <text>Click Me</text>
</g>
```

---

## 五、图元系统 (Gauges)

### 5.1 图元分类一览

#### 5.1.1 值类图元
| 图元 | TypeTag | 功能 |
|------|---------|------|
| Value | `svg-ext-value` | 只读数值显示 |
| HtmlInput | `svg-ext-html_input` | 输入框 |
| HtmlButton | `svg-ext-html_button` | 按钮 |
| HtmlSelect | `svg-ext-html_select` | 下拉框 |
| HtmlSwitch | `svg-ext-html_switch` | 开关 |

#### 5.1.2 指示类图元
| 图元 | TypeTag | 功能 |
|------|---------|------|
| GaugeProgress | `svg-ext-gauge_progress` | 进度条 |
| GaugeSemaphore | `svg-ext-gauge_semaphore` | 信号灯 |
| Slider | `svg-ext-slider` | 滑块 |
| Pipe | `svg-ext-pipe` | 管道流动 |

#### 5.1.3 形状图元
| 图元 | TypeTag | 功能 |
|------|---------|------|
| Shapes | `svg-ext-shapes-*` | SVG 基础形状 |
| ProcEng | `svg-ext-shapes-proc-eng` | 工程形状 |
| ApeShapes | `svg-ext-shapes-ape` | APE 形状库 |

#### 5.1.4 数据展示图元
| 图元 | TypeTag | 功能 |
|------|---------|------|
| HtmlChart | `svg-ext-html_chart` | 曲线图 |
| HtmlGraph | `svg-ext-html_graph` | 柱状/饼图 |
| HtmlTable | `svg-ext-html_table` | 数据表格 |
| HtmlBag | `svg-ext-html_bag` | 仪表盘 |

#### 5.1.5 多媒体和容器
| 图元 | TypeTag | 功能 |
|------|---------|------|
| HtmlImage | `svg-ext-html_image` | 图像 |
| HtmlVideo | `svg-ext-html_video` | 视频 |
| HtmlIframe | `svg-ext-html_iframe` | 内嵌网页 |
| HtmlScheduler | `svg-ext-html_scheduler` | 计划调度 |
| Panel | `svg-ext-panel` | 动态面板容器 |

### 5.2 图元标准接口

所有图元都继承 `GaugeBaseComponent`，实现以下静态方法：

```typescript
export class XXXComponent extends GaugeBaseComponent {
    // 图元标识
    static TypeTag = 'svg-ext-xxx';
    static LabelTag = 'XXX';
    
    // 支持的动作类型
    static actionsType = {
        hide: GaugeActionsType.hide,
        show: GaugeActionsType.show,
        blink: GaugeActionsType.blink,
        // ...
    };
    
    // 获取绑定的信号列表
    static getSignals(property: GaugeProperty): string[] {
        let res: string[] = [];
        if (property.variableId) res.push(property.variableId);
        if (property.actions) {
            property.actions.forEach(act => res.push(act.variableId));
        }
        return res;
    }
    
    // 处理值变化，更新 SVG 元素（核心方法）
    static processValue(
        ga: GaugeSettings,
        svgele: any,
        sig: Variable,
        gaugeStatus: GaugeStatus
    ): void {
        // 1. 获取元素
        // 2. 解析值
        // 3. 更新显示
        // 4. 执行动作
    }
    
    // 获取事件列表
    static getEvents(property: GaugeProperty, eventType?: GaugeEventType): GaugeEvent[]
    
    // 获取属性对话框类型
    static getDialogType(): GaugeDialogType
    
    // 获取支持的动作
    static getActions(type: string): any
    
    // 初始化元素
    static initElement(ga: GaugeSettings): HTMLElement
}
```

---

## 六、事件系统

### 6.1 事件类型枚举

```typescript
export enum GaugeEventType {
    click = 'shapes.event-click',
    dblclick = 'shapes.event-dblclick',
    mousedown = 'shapes.event-mousedown',
    mouseup = 'shapes.event-mouseup',
    mouseover = 'shapes.event-mouseover',
    mouseout = 'shapes.event-mouseout',
    enter = 'shapes.event-enter',           // HtmlInput 按 Enter
    select = 'shapes.event-select',         // HtmlSelect 选项变化
    onLoad = 'shapes.event-onLoad',         // 图元加载完成
}
```

### 6.2 事件动作类型

```typescript
export enum GaugeEventActionType {
    onpage = 'shapes.event-onpage',              // 切换视图
    onwindow = 'shapes.event-onwindow',          // 打开浮窗
    ondialog = 'shapes.event-ondialog',          // 打开对话框
    onSetValue = 'shapes.event-onsetvalue',      // 设置变量值
    onToggleValue = 'shapes.event-ontogglevalue', // 切换变量值
    onSetInput = 'shapes.event-onsetinput',      // 从输入框读值
    oniframe = 'shapes.event-oniframe',          // 打开 iframe
    oncard = 'shapes.event-oncard',              // 打开卡片窗口
    onclose = 'shapes.event-onclose',            // 关闭视图
    onRunScript = 'shapes.event-onrunscript',    // 执行脚本
    onViewToPanel = 'shapes.event-onViewToPanel', // 设置面板内容
    onMonitor = 'shapes.event-onmonitor',        // 打开摄像头预览
    onOpenTab = 'shapes.event-onopentab',        // 打开外部链接
}
```

### 6.3 事件处理流程

```
鼠标事件绑定 (onBindMouseEvents)
         │
         ▼
SVG Element 注册事件监听
- click, dblclick
- mousedown, mouseup
- mouseover, mouseout
         │
         ▼
用户触发事件
         │
         ▼
runEvents(ga, ev, events)
         │
         ▼
根据 action 类型执行：
├── onpage      → loadPage()      切换视图
├── onwindow    → onOpenCard()    打开浮窗
├── ondialog    → openDialog()    打开对话框
├── onSetValue  → onSetValue()    设置变量值
├── onToggleValue → onToggleValue() 切换变量值
├── onSetInput  → onSetInput()    从输入读值
├── oniframe    → openIframe()    打开 iframe
├── oncard      → openWindow()    打开新窗口
├── onclose     → onClose()       关闭视图
├── onRunScript → onRunScript()   执行脚本
└── onOpenTab   → onOpenTab()     打开外部链接
```

---

## 七、动画系统

### 7.1 动作类型枚举

```typescript
export enum GaugeActionsType {
    hide = 'shapes.action-hide',            // 隐藏
    show = 'shapes.action-show',            // 显示
    blink = 'shapes.action-blink',          // 闪烁
    stop = 'shapes.action-stop',            // 停止
    clockwise = 'shapes.action-clockwise',  // 顺时针旋转
    anticlockwise = 'shapes.action-anticlockwise', // 逆时针旋转
    rotate = 'shapes.action-rotate',        // 旋转到指定角度
    move = 'shapes.action-move',            // 移动
    downup = 'shapes.action-downup',        // 上下运动
}
```

### 7.2 动画实现原理

#### Hide/Show
```typescript
static runActionHide(element, type, gaugeStatus: GaugeStatus) {
    let actionRef = { type: type, animr: element.hide() };
    gaugeStatus.actionRef = actionRef;
}

static runActionShow(element, type, gaugeStatus: GaugeStatus) {
    let actionRef = { type: type, animr: element.show() };
    gaugeStatus.actionRef = actionRef;
}
```

#### Blink（闪烁）
```typescript
static checkActionBlink(element, act, gaugeStatus, toEnable, dom) {
    if (toEnable) {
        // 保存原始颜色
        gaugeStatus.actionRef.spool = {
            bk: element.style.backgroundColor,
            clr: element.style.color
        };
        
        // 启动定时器交替闪烁
        gaugeStatus.actionRef.timer = setInterval(() => {
            blinkStatus = !blinkStatus;
            if (blinkStatus) {
                element.style.backgroundColor = act.options.fillA;
                element.style.color = act.options.strokeA;
            } else {
                element.style.backgroundColor = act.options.fillB;
                element.style.color = act.options.strokeB;
            }
        }, act.options.interval);
    } else {
        // 恢复原始颜色
        clearInterval(gaugeStatus.actionRef.timer);
        element.style.backgroundColor = gaugeStatus.actionRef.spool.bk;
    }
}
```

#### Rotate（旋转）
```typescript
static processRotate(act, element, value, gaugeStatus) {
    if (act.range.min <= value && act.range.max >= value) {
        let angle = act.options.minAngle + 
            (value - act.range.min) * 
            (act.options.maxAngle - act.options.minAngle) / 
            (act.range.max - act.range.min);
        
        element.transform(`rotate(${angle})`);
    }
}
```

### 7.3 动画状态管理

```typescript
export class GaugeActionStatus {
    type: string;           // 动画类型
    timer?: any = null;     // setInterval 句柄
    animr?: any = null;     // SVG.js 动画对象
    spool?: any;            // 原始值存储（用于恢复）
}

export class GaugeStatus {
    variablesValue = {};              // 变量值缓存
    onlyChange = false;               // 仅在变化时处理
    takeValue = false;                // 从图元获取值比较
    actionRef: GaugeActionStatus;     // 当前动画状态
}
```

### 7.4 动画清理

```typescript
private clearGaugeStatus() {
    Object.values(this.mapGaugeStatus).forEach((gs: GaugeStatus) => {
        if (gs.actionRef) {
            // 清理定时器
            if (gs.actionRef.timer) {
                clearTimeout(gs.actionRef.timer);
            }
            // 重置动画
            if (gs.actionRef.animr?.reset) {
                gs.actionRef.animr.reset();
            }
        }
    });
}
```

---

## 八、数据流架构

### 8.1 完整数据流

```
┌─────────────────────────────────────────────────────────────┐
│                     后端（Server）                            │
│  设备驱动 → 数据读取 → 存储 → Socket.io 广播                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                    Socket.io
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  HmiService 监听                              │
│  onVariableChanged.emit(variable)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                   EventEmitter
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            GaugesManager 转发                                │
│  onchange.emit(variable)                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                   Observable
                       │
┌──────────────────────▼──────────────────────────────────────┐
│        FuxaViewComponent 处理                                │
│  subscriptionOnChange = gaugesManager.onchange.subscribe()  │
│  handleSignal(sig) → processValue()                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                   processValue()
                       │
       ┌───────────────┴───────────────┐
       │                               │
   updateSVG              executeDynamicAction
       │                               │
   Text Update            Color/Animation
   Attribute Update       Show/Hide
   Style Change          Rotate/Move
```

### 8.2 信号绑定映射

```typescript
// HmiService 中的视图-信号-图元映射
viewSignalGaugeMap = {
    'viewId1': {
        'signalId1': [
            { id: 'gauge1', ...GaugeSettings },
            { id: 'gauge2', ...GaugeSettings },
        ],
        'signalId2': [
            { id: 'gauge3', ...GaugeSettings },
        ],
    },
};

// GaugesManager 中的信号-图元映射
memorySigGauges = {
    'signalId1': {
        'gauge1': <ComponentInstance>,
        'gauge2': true,
    },
};
```

### 8.3 变化检测优化

```typescript
// 变化检测逻辑
private checkStatusValue(gaugeId, gaugeStatus, signal) {
    let result = true;
    if (gaugeStatus.onlyChange) {
        // 值未变化则跳过处理
        if (gaugeStatus.variablesValue[signal.id] === signal.value) {
            result = false;
        }
    }
    // 更新缓存
    gaugeStatus.variablesValue[signal.id] = signal.value;
    return result;
}
```

---

## 九、依赖分析

### 9.1 第三方库依赖

| 库 | 用途 | 是否必需 | 替代方案 |
|----|------|----------|----------|
| **SVG.js** | SVG 操作和动画 | ✅ 必需 | 无 |
| **jQuery** | DOM 操作 | ⚠️ 编辑器需要 | 可用原生 API |
| **Socket.io** | 实时通信 | ❌ 可替换 | TB 数据订阅 |
| **Chart.js/UPlot** | 图表 | ⚠️ 按需 | TB 图表 |
| **Numeral.js** | 数值格式化 | ⚠️ 按需 | 原生 Intl |

### 9.2 Angular 耦合度分析

| 模块 | 耦合度 | 迁移难度 | 说明 |
|------|--------|----------|------|
| `_models/hmi.ts` | **低** | 简单 | 纯 TS 类，直接复用 |
| 图元静态方法 | **低** | 简单 | processValue 等可独立使用 |
| `GaugesManager` | **中** | 中等 | 需重构 DI 部分 |
| `FuxaViewComponent` | **高** | 较难 | 深度使用 Angular 生命周期 |
| `EditorComponent` | **高** | 困难 | 深度使用 Angular + Material |
| `HmiService` | **中** | 中等 | 主要是 EventEmitter |

---

## 十、关键文件速查

| 文件 | 大小 | 行数 | 功能 |
|------|------|------|------|
| `fuxa-view.component.ts` | 51KB | 1221 | 视图渲染主组件 |
| `gauges.component.ts` | 45KB | 1012 | 图元管理器 |
| `hmi.service.ts` | 45KB | 777 | HMI 核心服务 |
| `_models/hmi.ts` | 17KB | 765 | HMI 数据模型 |
| `_models/device.ts` | 26KB | - | 设备模型 |
| `_helpers/utils.ts` | 26KB | - | 通用工具函数 |
| `gauge-base.component.ts` | 10KB | 265 | 图元基类 |
| `editor.component.ts` | 64KB | 1000+ | 编辑器主组件 |

---

## 十一、总结

### 核心架构特点

1. **事件驱动**: 基于 Observable/EventEmitter，信号变化通过事件流传播
2. **图元插件化**: 所有图元遵循统一接口，易于扩展
3. **双向绑定**: 后端 → 前端 (processValue)，前端 → 后端 (putEvent)
4. **性能优化**: 映射表、缓存、变化检测

### 迁移到 TB Widget 的关键点

1. **提取渲染核心**: FuxaViewComponent + GaugesManager 的核心逻辑
2. **适配数据源**: 用 TB 订阅替换 Socket.io
3. **保留事件系统**: 事件处理逻辑可复用
4. **图元系统复用**: processValue 逻辑可直接复用
