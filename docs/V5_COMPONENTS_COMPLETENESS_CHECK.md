# V5 图元组件完整性检查报告

完成日期: 2025-12-23

## 概述

对比 FUXA 源码与当前实现的 16 个 V5 图元组件，检查以下关键方法的实现:
- `getDialogType()` - 返回图元编辑对话框类型
- `isBitmaskSupported()` - 是否支持位掩码
- `getSignals()` - 获取绑定的信号 ID
- `processValue()` - 处理值更新
- `initElement()` - 初始化元素

---

## 各组件详细检查结果

### 1. html-input (HTML 输入框)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Input
- ✓ `isBitmaskSupported()` → true
- ✓ `getSignals()` - 包含 variableId 和 actions
- ✓ `processValue()` - 完整的输入处理，支持多种类型(date/time/number/textarea)
- ✓ `initElement()` - 复杂的初始化，包括 textarea 转换、datetime button 等
- ✓ 额外方法: `validateValue()`, `checkInputType()`, `getHtmlEvents()`

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ⚠️ `processValue()` 极度简化 (仅设置 value)
- ⚠️ `initElement()` 严重不完整
  - 缺少 textarea 动态转换
  - 缺少 datetime picker button
  - 缺少 numeric 类型验证和 min/max tooltip
  - 缺少 autocomplete 处理
  - 缺少 getHtmlEvents() 方法
- ❌ `validateValue()` 未实现
- ❌ `checkInputType()` 未实现

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Input;
}

// 支持 textarea 类型
static initElement(ga: GaugeSettings, callback?: (event: Event) => void): HTMLElement {
    // 1. 处理 textarea vs input 转换
    // 2. 处理 datetime 类型的日期选择器按钮
    // 3. 处理 numeric 类型的 min/max 验证
    // 4. 处理 autocomplete 设置
}

static validateValue(value: any, ga: GaugeSettings): InputValueValidation {
    // 验证输入值范围和类型
}
```

---

### 2. html-select (HTML 下拉框)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Step
- ✓ `getSignals()` - 包含 variableId 和 actions
- ✓ `processValue()` - 处理值，设置对应的颜色
- ✓ `initElement()` - 创建 option 元素，支持编辑/视图模式
- ✓ 额外方法: `getHtmlEvents()`, `processAction()`

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ⚠️ `initElement()` 不完整
  - 缺少 disabled 和 appearance 设置逻辑
  - 缺少 text-align 映射到 text-align-last
  - 缺少区分编辑/视图模式的选项创建逻辑
- ❌ `getHtmlEvents()` 未实现
- ❌ `processAction()` 未实现

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Step;
}

static getHtmlEvents(ga: GaugeSettings): Event {
    // 返回 'change' 事件处理器
}

static processAction(act: GaugeAction, svgele: any, select: any, value: any, gaugeStatus: GaugeStatus) {
    // 处理隐藏/显示动作
}
```

---

### 3. html-switch (HTML 开关)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Switch
- ✓ `isBitmaskSupported()` → true
- ✓ `getSignals()` - 包含 variableId, alarmId, actions
- ✓ `processValue()` - 处理位掩码和 onValue/offValue 映射
- ✓ `initElement()` - 使用 Angular 的 NgxSwitchComponent

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ⚠️ `initElement()` 实现了自定义开关，但缺少与 NgxSwitchComponent 兼容的接口
- ⚠️ `processValue()` 逻辑正确，但样式可能不完整

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Switch;
}

// 实现与 NgxSwitchComponent 兼容的接口
static bindEvents(ga: GaugeSettings, slider?: NgxSwitchComponent, callback?: any): Event {
    // 绑定更新事件
}
```

---

### 4. gauge-progress (进度条)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Range
- ✓ `getSignals()` - 仅 variableId
- ✓ `processValue()` - 计算进度条高度和位置
- ✓ `initElement()` - 初始化标签显示

**当前实现:**
- ✓ 基本完整，缺少 `getDialogType()`

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Range;
}
```

---

### 5. gauge-semaphore (信号灯)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Range
- ✓ `isBitmaskSupported()` → true
- ✓ `getSignals()` - 包含 variableId 和 actions
- ✓ `processValue()` - 根据值范围改变灯的颜色
- ✓ `getActions()` - 支持 hide/show/blink 动作
- ✓ `processAction()` - 处理三种动作

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ❌ `isBitmaskSupported()` 未实现
- ⚠️ `processValue()` 使用了不同的逻辑 (childrenStartWith)
- ⚠️ `processAction()` 缺少 blink 和 SVG 边界处理

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Range;
}

static isBitmaskSupported(): boolean {
    return true;
}

static processAction(act: GaugeAction, svgele: any, value: any, gaugeStatus: GaugeStatus) {
    // 完整的 hide/show/blink 动作处理
}
```

---

### 6. slider (滑块)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Slider
- ✓ `getSignals()` - 包含 variableId, alarmId, actions
- ✓ `processValue()` - 更新滑块值
- ✓ `initElement()` - 使用 NgxNouisliderComponent 创建滑块
- ✓ `bindEvents()` - 绑定更新事件
- ✓ 额外方法: `resize()`, `detectChange()`

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ⚠️ `initElement()` 简化实现，缺少 NgxNouisliderComponent 支持
- ❌ `bindEvents()` 未实现
- ❌ `resize()` 未实现

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Slider;
}

static bindEvents(ga: GaugeSettings, slider?: any, callback?: any): Event {
    if (slider) {
        slider.bindUpdate((val) => {
            let event = new Event();
            event.type = 'on';
            event.ga = ga;
            event.value = val;
            callback(event);
        });
    }
    return null;
}
```

---

### 7. pipe (管道)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Pipe
- ✓ `isBitmaskSupported()` → true
- ✓ `getSignals()` - 包含 variableId, alarmId, actions
- ✓ `processValue()` - 处理值和动作
- ✓ `getActions()` - stop/clockwise/anticlockwise/hidecontent/blink
- ✓ `processAction()` - 复杂的流动动画处理
- ✓ 额外方法: `runMyAction()`, `runImageAction()`, `runMyActionBlink()`

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ❌ `isBitmaskSupported()` 未实现
- ⚠️ `processAction()` 缺少 `hidecontent` 和复杂的 blink 处理
- ⚠️ 缺少 `runImageAction()` 和 SVG 动画支持
- ❌ `bindEvents()` 未实现

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Pipe;
}

static isBitmaskSupported(): boolean {
    return true;
}

// 需要补充 SVG 动画支持和 ImageInPath 类
```

---

### 8. panel (面板/嵌入视图)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Panel
- ✓ `getSignals()` - 仅 variableId
- ✓ `processValue()` - 根据变量值加载对应视图
- ✓ `initElement()` - 创建 FuxaViewComponent 实例

**当前实现缺失:**
- ❌ `getDialogType()` 未实现
- ⚠️ `initElement()` 简化实现，缺少 FuxaViewComponent 集成
- ⚠️ `processValue()` 缺少视图加载回调支持

**需要添加的关键代码:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Panel;
}

static getActions(type: string) {
    return this.actionsType; // hide/show
}
```

---

### 9. html-image (图片)

**FUXA 源码特性:**
- ✓ `getDialogType()` 未定义 (本身不需要对话框)
- ✓ `isBitmaskSupported()` → true
- ✓ `getSignals()` - 包含 variableId, alarmId, actions, varsToBind
- ✓ `processValue()` - 处理图片刷新和小部件值
- ✓ `getActions()` - hide/show/blink/stop/clockwise/anticlockwise/rotate/move/refreshImage
- ✓ `bindEvents()` - 绑定小部件事件
- ✓ `initElement()` - 支持 SVG 和图片加载

**当前实现缺失:**
- ✓ 相对完整，但缺少一些动作支持
- ⚠️ `getActions()` 缺少 rotate/move
- ❌ `processWebcamValue()` 未实现
- ❌ `bindEvents()` 未实现

**需要添加的关键代码:**
```typescript
static getActions(type: string) {
    return this.actionsType; // 包含 rotate/move/refreshImage
}

static bindEvents(ga: GaugeSettings, callback?: any): Event {
    // 绑定小部件事件
}
```

---

### 10. html-video (视频)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Video
- ✓ `getSignals()` - 包含 variableId 和 actions
- ✓ `processValue()` - 处理视频源更新
- ✓ `getActions()` - stop/start/pause/reset
- ✓ `initElement()` - 创建视频元素

**当前实现:**
- ⚠️ 缺少 `getDialogType()`
- ⚠️ `getActions()` 未实现

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Video;
}

static getActions(type: string) {
    return this.actionsType;
}
```

---

### 11. html-iframe (嵌入式窗口)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Iframe
- ✓ `getSignals()` - 仅 variableId
- ✓ `processValue()` - 更新 iframe 源
- ✓ `initElement()` - 创建 iframe

**当前实现:**
- ⚠️ 缺少 `getDialogType()`
- ⚠️ `initElement()` 缺少一些细节

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Iframe;
}
```

---

### 12. html-table (表格)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Table
- ✓ `getSignals()` - 复杂逻辑，支持多种表格类型
- ✓ `processValue()` - 处理数据和告警表格
- ✓ `initElement()` - 使用 DataTableComponent

**当前实现:**
- ⚠️ 缺少 `getDialogType()`
- ⚠️ 可能缺少某些表格类型的支持

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Table;
}
```

---

### 13. html-chart (图表)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Chart
- ✓ `getSignals()` - pro.variableIds
- ✓ `processValue()` - 添加数据点
- ✓ `initElement()` - 使用 ChartUplotComponent

**当前实现:**
- ⚠️ 缺少 `getDialogType()`

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Chart;
}
```

---

### 14. html-graph (复杂图形/图表)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Graph
- ✓ `getSignals()` - 包含 variableIds
- ✓ `processValue()` - 处理多个数据系列
- ✓ `initElement()` - 创建复杂图形

**当前实现:**
- ⚠️ 缺少 `getDialogType()`

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Graph;
}
```

---

### 15. html-bag (仪表盘/指示器集合)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Gauge
- ✓ `getSignals()` - 仅 variableId
- ✓ `processValue()` - 设置值到 NgxGaugeComponent
- ✓ `initElement()` - 创建 NgxGaugeComponent

**当前实现:**
- ⚠️ 缺少 `getDialogType()`

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Gauge;
}
```

---

### 16. html-scheduler (日程表)

**FUXA 源码特性:**
- ✓ `getDialogType()` → GaugeDialogType.Scheduler
- ✓ `getSignals()` - 转发到 SchedulerComponent
- ✓ `processValue()` - (占位符)
- ✓ `initElement()` - 创建 SchedulerComponent

**当前实现:**
- ⚠️ 缺少 `getDialogType()`

**需要添加:**
```typescript
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Scheduler;
}
```

---

## 汇总表格

| 组件 | 行数对比 | getDialogType | isBitmaskSupported | processValue | initElement | 其他缺失 |
|------|---------|---|---|---|---|---|
| html-input | 143→126 | ❌ | ✓ | ⚠️ 简化 | ⚠️ 不完整 | validateValue, checkInputType |
| html-select | 187→107 | ❌ | - | ⚠️ 基础 | ⚠️ 不完整 | getHtmlEvents, processAction |
| html-switch | 154→158 | ❌ | ✓ | ✓ | ⚠️ 自定义 | bindEvents |
| gauge-progress | 174→192 | ❌ | - | ✓ | ✓ | getDialogType |
| gauge-semaphore | 115→122 | ❌ | ❌ | ⚠️ 异步处理 | ✓ | getDialogType, isBitmaskSupported |
| slider | 134→125 | ❌ | - | ✓ | ⚠️ 简化 | getDialogType, bindEvents, resize |
| pipe | 273→155 | ❌ | ❌ | ⚠️ 基础 | ✓ | getDialogType, isBitmaskSupported, runImageAction |
| panel | 98→157 | ❌ | - | ⚠️ 基础 | ⚠️ 不完整 | getDialogType, getActions |
| html-image | 268→126 | - | ⚠️ 实现但缺少 | ⚠️ 简化 | ⚠️ 简化 | processWebcamValue, bindEvents |
| html-video | 175→201 | ❌ | - | ✓ | ✓ | getDialogType, getActions |
| html-iframe | 85→112 | ❌ | - | ✓ | ✓ | getDialogType |
| html-table | 114→359 | ❌ | - | ✓ | ✓ | getDialogType |
| html-chart | 73→508 | ❌ | - | ✓ | ✓ | getDialogType |
| html-graph | 86→512 | ❌ | - | ✓ | ✓ | getDialogType |
| html-bag | 96→287 | ❌ | - | ✓ | ✓ | getDialogType |
| html-scheduler | 108→606 | ❌ | - | ⚠️ 占位符 | ✓ | getDialogType |

---

## 关键发现

### 1. 普遍缺失的方法
**所有 16 个组件都缺少 `getDialogType()` 方法** - 这是编辑器属性对话框类型的标识
- 影响范围: 编辑器无法为组件显示正确的属性面板

### 2. `isBitmaskSupported()` 缺失
以下组件在 FUXA 中支持位掩码，但当前实现缺失:
- gauge-semaphore (信号灯)
- pipe (管道)

### 3. 复杂方法实现不完整

#### html-input (优先级最高)
- 缺少 `validateValue()` 方法
- `initElement()` 没有处理:
  - textarea 的动态创建/转换
  - datetime 类型的日期选择器按钮
  - numeric 类型的 min/max 验证
  - autocomplete 设置

#### html-select
- `initElement()` 缺少:
  - disabled 状态处理
  - appearance 样式处理
  - 编辑模式 vs 视图模式的选项创建逻辑

#### html-switch
- 缺少与 Angular 组件的适配接口 (bindEvents)

#### pipe (管道)
- 缺少 SVG 动画支持 (ImageInPath, ImageInPathAnimation)
- 缺少 hidecontent 动作
- 缺少复杂的 blink 处理

#### gauge-semaphore (信号灯)
- 缺少 `isBitmaskSupported()` 方法
- processValue 逻辑与 FUXA 不同

### 4. 简化过度的实现
- **html-image**: processValue 缺少支持小部件 (widget) 的逻辑
- **panel**: initElement 缺少与 FuxaViewComponent 的完整集成
- **slider**: initElement 缺少与 NgxNouisliderComponent 的完整集成

---

## 优先级建议

### P0 (关键 - 影响编辑器功能)
1. 所有 16 个组件添加 `getDialogType()` 方法
2. html-input: 完整 `initElement()` 和 `validateValue()`
3. html-select: 完整 `initElement()` 和事件处理

### P1 (重要 - 影响组件功能)
1. gauge-semaphore: 添加 `isBitmaskSupported()`
2. pipe: 添加 `isBitmaskSupported()` 和 SVG 动画支持
3. slider: bindEvents() 和 resize() 方法
4. html-switch: bindEvents() 方法

### P2 (优化 - 增强功能)
1. html-image: processWebcamValue() 和 bindEvents()
2. 各组件的 processAction() 方法完善
3. 颜色和样式处理优化

---

## 实现建议

### 快速修复模板

```typescript
// 所有缺少 getDialogType 的组件添加:
static getDialogType(): GaugeDialogType {
    return GaugeDialogType.XXX; // 对应的对话框类型
}

// 支持位掩码的组件添加:
static isBitmaskSupported(): boolean {
    return true;
}

// 添加 GaugeDialogType 导入
import { GaugeDialogType } from '../../models/hmi';
```

### 重点修复 (html-input)

参考 FUXA 源码实现以下功能:
1. Textarea 类型动态转换
2. DateTime 类型选择器按钮
3. Numeric 类型验证
4. Input 类型映射

