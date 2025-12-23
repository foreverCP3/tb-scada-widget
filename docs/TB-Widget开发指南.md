# ThingsBoard 自定义 Widget 开发指南

## 一、Widget 是什么？

TB Widget 本质上是一个**带有生命周期的 UI 组件**，运行在 TB Dashboard 中。

```
┌─────────────────────────────────────────────────────────┐
│                   TB Dashboard                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Widget Container (DOM)              │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │          你的 Widget 内容                │    │    │
│  │  │                                          │    │    │
│  │  │   HTML + CSS + JavaScript                │    │    │
│  │  │   (支持 Angular 模板语法)                │    │    │
│  │  │                                          │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              另一个 Widget                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**关键点：**
- Widget 是一个 DOM 容器
- 支持 **Angular 模板语法**（`*ngFor`, `{{}}`, `[(ngModel)]` 等）
- 支持 **Angular Material 组件**（`mat-button`, `mat-input` 等）
- 通过 `self` 和 `ctx` 对象与 TB 平台交互

## 二、Widget 的组成部分

在 TB Widget Editor 中，一个 Widget 包含 4 部分：

```
Widget 定义
├── Resources      # 外部 JS/CSS 资源引用
├── HTML           # 模板代码（支持 Angular 语法）
├── CSS            # 样式代码
├── JavaScript     # 逻辑代码（生命周期、数据处理）
└── Settings Schema # 配置表单定义（JSON Schema）
```

## 三、Widget API

### 3.1 核心对象

| 对象 | 说明 |
|------|------|
| `self` | Widget 实例，用于定义生命周期方法 |
| `self.ctx` | Widget 上下文，包含数据、设置、API 等 |
| `self.ctx.$scope` | Angular 作用域，用于绑定模板变量 |

### 3.2 生命周期方法

```javascript
// 1. 初始化 - Widget 加载完成后调用
self.onInit = function() {
    // DOM 已准备好
    // 可以初始化变量、绑定事件
}

// 2. 数据更新 - 订阅的数据变化时调用
self.onDataUpdated = function() {
    // 获取最新数据并更新视图
    self.ctx.detectChanges();  // 触发 Angular 变更检测
}

// 3. 尺寸变化 - Widget 大小改变时调用
self.onResize = function() {
    // ctx.width 和 ctx.height 已更新
}

// 4. 编辑模式变化
self.onEditModeChanged = function() {
    // ctx.isEdit 已更新
}

// 5. 销毁 - Widget 被移除时调用
self.onDestroy = function() {
    // 清理资源、取消订阅
}
```

### 3.3 ctx 对象属性

```javascript
// 数据相关
self.ctx.data                      // 订阅的数据
self.ctx.datasources               // 数据源配置
self.ctx.defaultSubscription       // 默认订阅对象
self.ctx.defaultSubscription.data  // 订阅的数据数组

// 设置相关
self.ctx.settings                  // Widget 设置（来自 Settings Schema）
self.ctx.widgetConfig              // Widget 配置

// 状态相关
self.ctx.isEdit                    // 是否编辑模式
self.ctx.isMobile                  // 是否移动端
self.ctx.width                     // Widget 宽度
self.ctx.height                    // Widget 高度

// Angular 相关
self.ctx.$scope                    // Angular 作用域
self.ctx.detectChanges()           // 触发变更检测

// RPC 控制相关 (Control Widget)
self.ctx.controlApi.sendOneWayCommand(method, params, timeout)  // 单向命令
self.ctx.controlApi.sendTwoWayCommand(method, params, timeout)  // 双向命令
```

## 四、完整示例

### 4.1 示例 1：最新值显示 Widget

显示设备的最新遥测数据。

**HTML:**
```html
<div fxFlex fxLayout="column" style="height: 100%;" fxLayoutAlign="center stretch">
  <div>My first latest values widget.</div>
  <div fxFlex fxLayout="row" *ngFor="let dataKeyData of data" fxLayoutAlign="space-around center">
    <div>{{dataKeyData.dataKey.label}}</div>
    <div>{{(dataKeyData.data[0] && dataKeyData.data[0][0]) | date:'yyyy-MM-dd HH:mm:ss'}}</div>
    <div>{{dataKeyData.data[0] && dataKeyData.data[0][1]}}</div>
  </div>
</div>
```

**JavaScript:**
```javascript
self.onInit = function() {
    // 将订阅数据绑定到模板
    self.ctx.$scope.data = self.ctx.defaultSubscription.data;
}

self.onDataUpdated = function() {
    // 数据更新时触发视图刷新
    self.ctx.detectChanges();
}
```

### 4.2 示例 2：RPC 控制 Widget

向设备发送 RPC 命令。

**HTML:**
```html
<form #rpcForm="ngForm" (submit)="sendCommand()">
  <div class="mat-content mat-padding" fxLayout="column">
    <!-- RPC 方法输入 -->
    <mat-form-field class="mat-block">
      <mat-label>RPC method</mat-label>
      <input matInput required name="rpcMethod" [(ngModel)]="rpcMethod"/>
    </mat-form-field>
    
    <!-- RPC 参数输入 -->
    <mat-form-field class="mat-block">
      <mat-label>RPC params</mat-label>
      <input matInput required name="rpcParams" [(ngModel)]="rpcParams"/>
    </mat-form-field>
    
    <!-- 发送按钮 -->
    <button mat-raised-button color="primary" type="submit">
      Send RPC command
    </button>
    
    <!-- 响应显示 -->
    <div>
      <label>RPC command response</label>
      <div style="width: 100%; height: 100px; border: solid 2px gray" 
           [innerHTML]="rpcCommandResponse">
      </div>
    </div>
  </div>
</form>
```

**JavaScript:**
```javascript
self.onInit = function() {
    // 初始化变量
    self.ctx.$scope.rpcMethod = '';
    self.ctx.$scope.rpcParams = '{}';
    self.ctx.$scope.rpcCommandResponse = '';
    
    // 定义发送命令方法
    self.ctx.$scope.sendCommand = function() {
        var rpcMethod = self.ctx.$scope.rpcMethod;
        var rpcParams = self.ctx.$scope.rpcParams;
        var timeout = self.ctx.settings.requestTimeout || 5000;
        
        // 发送双向 RPC 命令
        self.ctx.controlApi.sendTwoWayCommand(rpcMethod, rpcParams, timeout)
            .subscribe(
                function(response) {
                    // 成功
                    self.ctx.$scope.rpcCommandResponse = 
                        "Response: " + JSON.stringify(response, null, 2);
                    self.ctx.detectChanges();
                },
                function(error) {
                    // 失败
                    self.ctx.$scope.rpcCommandResponse = 
                        "Error: " + error.status + " - " + error.statusText;
                    self.ctx.detectChanges();
                }
            );
    }
}
```

**Settings Schema:**
```json
{
    "schema": {
        "type": "object",
        "title": "Settings",
        "properties": {
            "requestTimeout": {
                "title": "RPC request timeout (ms)",
                "type": "number",
                "default": 5000
            }
        }
    },
    "form": ["requestTimeout"]
}
```

### 4.3 示例 3：自定义 SVG 渲染 Widget

这是我们 SCADA Viewer 的基础结构。

**HTML:**
```html
<div #scadaContainer class="scada-container" style="width: 100%; height: 100%;">
  <!-- SVG 将被动态注入到这里 -->
</div>
```

**CSS:**
```css
.scada-container {
    overflow: hidden;
    background-color: #1a1a2e;
}

.scada-container svg {
    width: 100%;
    height: 100%;
}
```

**JavaScript:**
```javascript
self.onInit = function() {
    // 获取容器元素
    var container = self.ctx.$container[0];
    
    // 从 settings 加载 SVG 配置
    var svgContent = self.ctx.settings.svgContent || '<svg></svg>';
    
    // 注入 SVG
    container.innerHTML = svgContent;
    
    // 初始化数据绑定
    self.ctx.$scope.variables = {};
    
    // 设置数据更新回调
    setupDataBindings();
}

self.onDataUpdated = function() {
    // 获取最新数据
    var data = self.ctx.defaultSubscription.data;
    
    // 更新 SVG 元素
    data.forEach(function(item) {
        var key = item.dataKey.name;
        var value = item.data[0] ? item.data[0][1] : null;
        
        // 更新绑定的 SVG 元素
        updateSvgElement(key, value);
    });
    
    self.ctx.detectChanges();
}

self.onDestroy = function() {
    // 清理资源
}

function setupDataBindings() {
    // 设置 SVG 元素与数据的绑定关系
}

function updateSvgElement(key, value) {
    // 根据数据更新 SVG 元素属性（颜色、位置、动画等）
    var element = document.getElementById(key);
    if (element) {
        // 更新元素...
    }
}
```

## 五、Widget 类型

| 类型 | 用途 | ctx.controlApi |
|------|------|----------------|
| **Latest Values** | 显示最新遥测/属性值 | ❌ |
| **Time Series** | 显示历史数据图表 | ❌ |
| **Control Widget** | 发送 RPC 命令 | ✅ |
| **Alarm Widget** | 显示告警 | ❌ |
| **Static** | 静态 HTML 内容 | ❌ |

## 六、Angular 语法支持

TB Widget 支持的 Angular 特性：

```html
<!-- 变量插值 -->
{{variableName}}

<!-- 循环 -->
<div *ngFor="let item of items">{{item.name}}</div>

<!-- 条件渲染 -->
<div *ngIf="condition">显示内容</div>

<!-- 双向绑定 -->
<input [(ngModel)]="inputValue"/>

<!-- 事件绑定 -->
<button (click)="handleClick()">点击</button>

<!-- 属性绑定 -->
<div [style.color]="colorValue">文本</div>
<div [innerHTML]="htmlContent"></div>

<!-- 表单 -->
<form #myForm="ngForm" (submit)="onSubmit()">
  <input matInput [(ngModel)]="value" name="fieldName"/>
</form>

<!-- Flex 布局 -->
<div fxLayout="row" fxLayoutAlign="center center">
  <div fxFlex>内容</div>
</div>
```

## 七、Angular Material 组件

可直接使用的 Material 组件：

```html
<!-- 按钮 -->
<button mat-button>普通按钮</button>
<button mat-raised-button color="primary">凸起按钮</button>

<!-- 输入框 -->
<mat-form-field>
  <mat-label>标签</mat-label>
  <input matInput [(ngModel)]="value"/>
</mat-form-field>

<!-- 选择框 -->
<mat-select [(ngModel)]="selected">
  <mat-option value="1">选项1</mat-option>
  <mat-option value="2">选项2</mat-option>
</mat-select>

<!-- 开关 -->
<mat-slide-toggle [(ngModel)]="enabled">启用</mat-slide-toggle>

<!-- 复选框 -->
<mat-checkbox [(ngModel)]="checked">选中</mat-checkbox>
```

## 八、与 FUXA 集成的关键点

基于以上分析，我们的 SCADA Widget 集成策略：

```javascript
// scada-viewer-widget.js

self.onInit = function() {
    // 1. 获取 Widget 容器
    var container = self.ctx.$container[0];
    
    // 2. 从 settings 加载 FUXA View 配置
    var viewConfig = self.ctx.settings.scadaConfig;
    
    // 3. 初始化 FUXA 渲染组件
    //    将 FUXA 的 FuxaViewComponent 嵌入到 container 中
    initFuxaView(container, viewConfig);
    
    // 4. 设置 TB 数据 → FUXA 变量的映射
    setupDataMapping();
}

self.onDataUpdated = function() {
    // 5. TB 数据更新时，推送到 FUXA
    var tbData = self.ctx.defaultSubscription.data;
    var fuxaVariables = transformToFuxaFormat(tbData);
    
    // 6. 更新 FUXA 变量，触发 SVG 更新
    updateFuxaVariables(fuxaVariables);
    
    self.ctx.detectChanges();
}

self.onDestroy = function() {
    // 7. 销毁 FUXA 组件
    destroyFuxaView();
}
```

## 九、数据流总结

```
TB 设备遥测数据
       │
       ▼
TB Subscription (自动订阅)
       │
       ▼
self.onDataUpdated() 触发
       │
       ▼
self.ctx.defaultSubscription.data (获取数据)
       │
       ▼
转换为 FUXA 变量格式
       │
       ▼
FUXA processValue() (更新 SVG)
       │
       ▼
用户看到实时画面
```

## 十、参考资源

- [TB Widget 开发官方文档](https://thingsboard.io/docs/user-guide/contribution/widgets-development/)
- [TB Widget Library](https://thingsboard.io/docs/user-guide/ui/widget-library/)
- [Angular Material 组件](https://material.angular.io/components)
