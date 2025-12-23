# TB SCADA Widget

A SCADA/HMI widget for ThingsBoard, powered by FUXA rendering engine.

ThingsBoard 工业组态 SCADA Widget，基于 FUXA 渲染引擎。

## 功能特性

- **SCADA Viewer** - 组态画面实时渲染
  - 40+ 种工业图元（管道、阀门、仪表盘、罐体等）
  - 实时数据绑定
  - 动画效果（流动、闪烁、变色、旋转）
  
- **SCADA Editor** - 可视化组态编辑器
  - 拖拽式设计
  - 图元库
  - 属性配置
  - 数据绑定配置

## 快速开始

### 安装到 ThingsBoard

1. 下载 `dist/tb-industrial-widgets-bundle.json`
2. 登录 ThingsBoard 后台
3. 进入 **Widget Library** → **Import Widget**
4. 选择下载的 JSON 文件
5. 在 Dashboard 中添加 Widget 即可使用

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/foreverCP3/tb-scada-widget.git
cd tb-scada-widget

# 安装依赖
npm install

# 构建
npm run build
```

## 项目结构

```
tb-industrial-widgets/
├── src/
│   ├── fuxa-core/          # FUXA 渲染核心
│   ├── tb-adapter/         # TB 适配层
│   └── widgets/            # Widget 定义
├── FUXA/                   # FUXA 源码参考
├── dist/                   # 构建产物
├── dev/                    # 本地测试
└── docs/                   # 文档
```

## 技术架构

```
┌─────────────────────────────────────┐
│        ThingsBoard Dashboard        │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │      SCADA Widget             │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │    FUXA 渲染引擎        │  │  │
│  │  │    (SVG + 动画)         │  │  │
│  │  └─────────────────────────┘  │  │
│  │             ▲                 │  │
│  │             │                 │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │    TB 数据适配层        │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│                 ▲                   │
│                 │                   │
│  ┌───────────────────────────────┐  │
│  │      TB Widget API            │  │
│  │  (Telemetry / RPC / Settings) │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 文档

- [架构设计](./docs/架构设计.md)
- [FUXA 源码分析](./docs/FUXA源码分析.md)
- [TB Widget 开发指南](./docs/TB-Widget开发指南.md)
- [功能需求清单](./docs/功能需求清单.md)

## 许可证

Apache License 2.0
