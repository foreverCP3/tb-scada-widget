# TB SCADA Widget

## 项目概述

A SCADA/HMI widget for ThingsBoard, powered by FUXA rendering engine.

为 ThingsBoard 平台开发的工业组态 SCADA Widget，基于 FUXA 渲染引擎。

## 目录结构

```
tb-industrial-widgets/
├── src/
│   ├── fuxa-core/              # FUXA 渲染核心 (从 FUXA 提取)
│   ├── tb-adapter/             # TB 数据适配层
│   └── widgets/                # Widget 定义
│       ├── scada-viewer/       # 组态查看器
│       │   ├── template.html
│       │   ├── style.css
│       │   ├── controller.js
│       │   └── settings.json
│       └── scada-editor/       # 组态编辑器
│           └── ...
│
├── FUXA/                       # FUXA 源码 (参考/提取用)
│
├── dist/                       # 构建产物
│   └── tb-industrial-widgets-bundle.json
│
├── dev/                        # 本地开发测试
│   └── test-page.html
│
├── docs/                       # 文档
│   ├── 架构设计.md
│   ├── FUXA源码分析.md
│   ├── TB-Widget开发指南.md
│   └── 功能需求清单.md
│
└── scripts/
    └── build.js                # 构建脚本
```

## 开发流程

### 本地开发
```bash
# 安装依赖
npm install

# 打开测试页面进行开发
open dev/test-page.html
```

### 构建
```bash
# 构建 Widget Bundle
npm run build

# 产物: dist/tb-industrial-widgets-bundle.json
```

### 部署到 TB
1. 登录 ThingsBoard 后台
2. 进入 Widget Library
3. 点击 Import Widget
4. 选择 `dist/tb-industrial-widgets-bundle.json`
5. 在 Dashboard 中使用 Widget

## Widget 开发规范

### 文件结构
每个 Widget 包含以下文件：
- `template.html` - HTML 模板 (支持 Angular 语法)
- `style.css` - 样式
- `controller.js` - 逻辑代码
- `settings.json` - 配置 Schema

### TB Widget API
```javascript
// 生命周期
self.onInit = function() { }         // 初始化
self.onDataUpdated = function() { }  // 数据更新
self.onDestroy = function() { }      // 销毁

// 上下文
self.ctx.$container[0]               // DOM 容器
self.ctx.$scope                      // Angular 作用域
self.ctx.settings                    // Widget 设置
self.ctx.defaultSubscription.data    // 订阅的数据
self.ctx.detectChanges()             // 触发视图更新
self.ctx.controlApi                  // RPC API
```

## 技术栈

- **渲染引擎**: FUXA (SVG + SVG.js)
- **目标平台**: ThingsBoard 4.0+
- **UI 语法**: Angular (TB 原生支持)

## 相关文档

- [架构设计](./docs/架构设计.md)
- [FUXA 源码分析](./docs/FUXA源码分析.md)
- [TB Widget 开发指南](./docs/TB-Widget开发指南.md)
- [功能需求清单](./docs/功能需求清单.md)
