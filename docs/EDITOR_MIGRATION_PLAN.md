# FUXA Editor 迁移计划

> 更新日期: 2025-12-23
> UI 框架: **Material Components Web (MDC Web)** - 与 ThingsBoard Angular Material 风格完全一致
> 原则: **直接复用 FUXA 编辑器库，最小化改造，保留完整功能**

---

## 一、核心策略

### 1.1 关键发现

FUXA 编辑器的核心渲染逻辑**不依赖 Angular**，而是使用：

| 组件 | 技术 | 大小 | Angular 依赖 |
|------|------|------|--------------|
| SVG 绘制引擎 | `fuxa-editor.min.js` | 286KB | **无** |
| SVG 操作库 | `svg.js` | 150KB | **无** |
| 拖拽系统 | `jquery-ui` | 38KB | **无** |
| DOM 操作 | `jquery` | 92KB | **无** |

**Angular 只负责**：
- UI 框架 (MatDrawer, MatDialog, MatExpansionPanel)
- 状态管理 (Services, DI)
- 表单控件 (MatInput, MatSelect)

### 1.2 迁移策略

```
┌─────────────────────────────────────────────────────────────┐
│                    FUXA 编辑器架构                           │
├─────────────────────────────────────────────────────────────┤
│  Angular UI Layer (需要替换)                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │MatDrawer│ │MatDialog│ │MatPanel │ │MatInput │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│       ▼           ▼           ▼           ▼                 │
├─────────────────────────────────────────────────────────────┤
│  SVG Editor Core (直接复用)                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  fuxa-editor.min.js + svg.js + jquery + jquery-ui    │   │
│  │  • 绘图模式 (rect, circle, line, path, text)         │   │
│  │  • 选择/变换 (move, resize, rotate)                  │   │
│  │  • 撤销/重做                                         │   │
│  │  • 复制/粘贴                                         │   │
│  │  • 对齐/分布                                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**策略**：
1. **直接复用** SVG Editor 核心库（无需改造）
2. **重写 UI 层**：用纯 HTML/CSS/JS 替换 Angular Material
3. **复制业务逻辑**：从 `editor.component.ts` 提取核心方法

---

## 二、文件复用分析

### 2.1 可直接复用（无需改动）

| 文件 | 大小 | 用途 |
|------|------|------|
| `assets/lib/svgeditor/fuxa-editor.min.js` | 286KB | 核心编辑器引擎 |
| `assets/lib/svg/svg.js` | 150KB | SVG 操作库 |
| `assets/lib/svgeditor/jquery.min.js` | 92KB | DOM 操作 |
| `assets/lib/svgeditor/jquery-ui-1.8.17.custom.min.js` | 38KB | 拖拽/缩放 |
| `assets/lib/svgeditor/jquery-plugin.min.js` | 71KB | UI 插件 |
| `assets/lib/svgeditor/ext-bundle.min.js` | 50KB | 编辑器扩展 |
| `assets/lib/svgeditor/shapes/*.json` | ~200KB | 图形库 |
| **总计** | **~887KB** | |

### 2.2 需要提取的业务逻辑

从 `editor.component.ts` (1,679 行) 提取：

| 方法 | 行数 | 用途 | 复用率 |
|------|------|------|--------|
| `myInit()` | ~50 | 初始化编辑器回调 | 95% |
| `getGaugeSettings()` | ~15 | 获取图元配置 | 100% |
| `checkGaugeAdded()` | ~30 | 图元添加处理 | 100% |
| `onRemoveElement()` | ~20 | 图元删除处理 | 100% |
| `onCopyAndPaste()` | ~45 | 复制粘贴逻辑 | 100% |
| `checkSvgElementsMap()` | ~20 | SVG 元素追踪 | 100% |
| `setMode()` | ~10 | 设置绘图模式 | 100% |
| `onAlignSelected()` | ~5 | 对齐操作 | 100% |
| `loadView()` / `saveView()` | ~40 | 视图加载保存 | 90% |
| **总计** | **~235** | | **~95%** |

### 2.3 需要重写的 UI 组件

| Angular 组件 | 替代方案 | 工作量 |
|--------------|----------|--------|
| `MatDrawer` (侧边栏) | HTML `<aside>` + CSS | 0.5 天 |
| `MatExpansionPanel` (折叠面板) | HTML `<details>` | 0.5 天 |
| `MatDialog` (属性对话框) | 自定义 Modal | 1 天 |
| `MatInput/Select` (表单) | HTML5 表单元素 | 1 天 |
| `MatIcon` (图标) | Material Icons CDN | 0.1 天 |
| `MatButton` (按钮) | HTML `<button>` + CSS | 0.2 天 |
| `MatColorPicker` | 原生 `<input type="color">` | 0.2 天 |

---

## 三、目录结构规划

```
src/
├── fuxa-core/                    # View 模式 (已规划)
│   ├── models/
│   ├── helpers/
│   ├── gauges/
│   ├── services/
│   ├── renderer/
│   └── lib/
│
├── fuxa-editor/                  # Edit 模式 (新增)
│   │
│   ├── lib/                      # 直接复制，不改动
│   │   ├── fuxa-editor.min.js
│   │   ├── svg.js
│   │   ├── jquery.min.js
│   │   ├── jquery-ui.min.js
│   │   ├── jquery-plugin.min.js
│   │   ├── ext-bundle.min.js
│   │   └── shapes/               # 图形库 JSON
│   │       ├── ape-shapes.json
│   │       ├── proc-eng.json
│   │       └── ...
│   │
│   ├── core/                     # 编辑器核心逻辑
│   │   ├── editor-core.ts        # 从 editor.component.ts 提取
│   │   ├── editor-callbacks.ts   # SVG 编辑器回调
│   │   ├── clipboard.ts          # 复制粘贴
│   │   ├── history.ts            # 撤销重做（如需扩展）
│   │   └── index.ts
│   │
│   ├── ui/                       # UI 组件 (纯 HTML/CSS/JS)
│   │   ├── toolbar/
│   │   │   ├── toolbar.ts        # 顶部工具栏
│   │   │   └── toolbar.css
│   │   ├── sidebar/
│   │   │   ├── left-sidebar.ts   # 左侧边栏 (工具/图形)
│   │   │   ├── right-sidebar.ts  # 右侧边栏 (属性)
│   │   │   └── sidebar.css
│   │   ├── panels/
│   │   │   ├── views-panel.ts    # 视图列表
│   │   │   ├── tools-panel.ts    # 绘图工具
│   │   │   ├── controls-panel.ts # 控件面板
│   │   │   ├── shapes-panel.ts   # 图形面板
│   │   │   └── properties-panel.ts # 属性面板
│   │   ├── dialogs/
│   │   │   ├── modal.ts          # 通用弹窗
│   │   │   ├── gauge-property-dialog.ts
│   │   │   ├── chart-config-dialog.ts
│   │   │   └── view-property-dialog.ts
│   │   └── index.ts
│   │
│   ├── property-editors/         # 图元属性编辑器
│   │   ├── base-property.ts
│   │   ├── shape-property.ts
│   │   ├── value-property.ts
│   │   ├── button-property.ts
│   │   ├── input-property.ts
│   │   ├── chart-property.ts
│   │   └── index.ts
│   │
│   ├── styles/                   # 样式
│   │   ├── editor.css            # 主样式
│   │   ├── toolbar.css
│   │   ├── sidebar.css
│   │   ├── panels.css
│   │   ├── dialogs.css
│   │   └── theme.css             # TB 主题适配
│   │
│   └── index.ts                  # 统一导出
│
└── widgets/
    ├── scada-viewer/             # View Widget
    └── scada-editor/             # Edit Widget (新增)
        ├── controller.ts
        └── template.html
```

---

## 四、分步实施计划

### TODO E1: 编辑器库集成 (0.5天)

**目标**: 将 FUXA SVG 编辑器库集成到项目中

**任务**:
- [ ] E1.1 复制编辑器库文件到 `src/fuxa-editor/lib/`
  ```
  fuxa-editor.min.js
  svg.js
  jquery.min.js
  jquery-ui-1.8.17.custom.min.js
  jquery-plugin.min.js
  ext-bundle.min.js
  shapes/*.json
  ```

- [ ] E1.2 创建全局类型声明 `src/fuxa-editor/types/globals.d.ts`:
  ```typescript
  declare var $: any;
  declare var SVG: any;
  declare var mysvgeditor: {
    initSvgEditor($: any, ...callbacks: Function[]): void;
  };
  declare var svgEditor: {
    setSvgString(svg: string): void;
    getSvgString(): string;
    clickToSetMode(mode: string): void;
    selectOnly(elements: any[], scroll?: boolean): void;
    clearSelection(): void;
    setColor(color: string, alpha: number, type: 'fill' | 'stroke'): void;
    alignSelectedElements(type: string): void;
    undo(): void;
    redo(): void;
    resetUndoStack(): void;
    setDocProperty(name: string, w: number, h: number, color: string): void;
  };
  ```

- [ ] E1.3 验证库加载:
  ```typescript
  // dev/editor-test.html
  <script src="lib/jquery.min.js"></script>
  <script src="lib/svg.js"></script>
  <script src="lib/fuxa-editor.min.js"></script>
  <script>
    console.log('jQuery:', typeof $);
    console.log('SVG:', typeof SVG);
    console.log('svgEditor:', typeof mysvgeditor);
  </script>
  ```

**验收**: 所有库加载成功，无控制台错误

---

### TODO E2: 编辑器核心类 (1天)

**目标**: 创建编辑器核心类，封装与 SVG 编辑器的交互

**任务**:
- [ ] E2.1 创建 `src/fuxa-editor/core/editor-core.ts`:
  ```typescript
  import { GaugesManager } from '../../fuxa-core/gauges/gauges-manager';
  import { HmiService } from '../../fuxa-core/services/hmi-service';
  import { View, GaugeSettings, GaugeProperty } from '../../fuxa-core/models';

  export interface EditorCallbacks {
    onElementSelected?: (element: any) => void;
    onElementAdded?: (element: any) => void;
    onElementRemoved?: (element: any) => void;
    onElementResized?: (element: any) => void;
    onCopyPaste?: (data: CopiedAndPasted) => void;
    onColorChanged?: (type: 'fill' | 'stroke', color: string) => void;
  }

  export class FuxaEditorCore {
    private container: HTMLElement;
    private gaugesManager: GaugesManager;
    private currentView: View | null = null;
    private svgElements: ISvgElement[] = [];
    private callbacks: EditorCallbacks;

    // 颜色状态
    colorFill: string = '#FFFFFF';
    colorStroke: string = '#000000';
    
    constructor(
      container: HTMLElement,
      gaugesManager: GaugesManager,
      callbacks: EditorCallbacks = {}
    ) {
      this.container = container;
      this.gaugesManager = gaugesManager;
      this.callbacks = callbacks;
    }

    /**
     * 初始化 SVG 编辑器
     * 对应 editor.component.ts myInit() 方法
     */
    init(): void {
      mysvgeditor.initSvgEditor(
        $,
        // Callback 1: 元素选中
        (selected: any) => {
          this.onElementSelected(selected);
        },
        // Callback 2: 扩展加载
        (type: string, args: any) => {
          this.onExtensionLoaded(type, args);
        },
        // Callback 3: 颜色变化
        (type: 'fill' | 'stroke', color: string) => {
          if (type === 'fill') this.colorFill = color;
          if (type === 'stroke') this.colorStroke = color;
          this.callbacks.onColorChanged?.(type, color);
        },
        // Callback 4: 元素添加
        (eleAdded: any) => {
          this.onElementAdded(eleAdded);
        },
        // Callback 5: 元素删除
        (eleRemoved: any) => {
          this.onElementRemoved(eleRemoved);
        },
        // Callback 6: 元素缩放
        (eleResized: any) => {
          this.onElementResized(eleResized);
        },
        // Callback 7: 复制粘贴
        (copiedPasted: CopiedAndPasted) => {
          this.onCopyAndPaste(copiedPasted);
        },
        // Callback 8: 分组变化
        () => {
          this.checkSvgElementsMap(true);
        }
      );
    }

    /**
     * 加载视图到编辑器
     */
    loadView(view: View): void {
      this.currentView = view;
      if (view.svgcontent) {
        svgEditor.setSvgString(view.svgcontent);
      }
      this.checkSvgElementsMap(true);
    }

    /**
     * 获取当前 SVG 内容
     */
    getSvgContent(): string {
      return svgEditor.getSvgString();
    }

    /**
     * 保存当前视图
     */
    saveView(): View | null {
      if (!this.currentView) return null;
      this.currentView.svgcontent = this.getSvgContent();
      return this.currentView;
    }

    /**
     * 设置绘图模式
     */
    setMode(mode: DrawMode): void {
      svgEditor.clickToSetMode(mode);
    }

    /**
     * 对齐选中元素
     */
    alignSelected(type: AlignType): void {
      svgEditor.alignSelectedElements(type);
    }

    /**
     * 获取图元设置
     * 对应 editor.component.ts getGaugeSettings()
     */
    getGaugeSettings(ele: any, initParams?: any): GaugeSettings | null {
      if (ele && this.currentView) {
        if (this.currentView.items[ele.id]) {
          return this.currentView.items[ele.id];
        }
        const gs = this.gaugesManager.createSettings(ele.id, ele.type);
        if (initParams) {
          gs.property = new GaugeProperty();
          gs.property.address = initParams;
        }
        this.currentView.items[ele.id] = gs;
        return gs;
      }
      return null;
    }

    /**
     * 更新 SVG 元素映射
     * 对应 editor.component.ts checkSvgElementsMap()
     */
    private checkSvgElementsMap(loadSvgElement = false): void {
      if (loadSvgElement) {
        this.svgElements = Array.from(
          document.querySelectorAll('g, text, line, rect, image, path, circle, ellipse')
        ).filter((svg: any) => 
          svg.attributes?.type?.value?.startsWith('svg-ext') ||
          (svg.id?.startsWith('svg_') && !svg.parentNode?.attributes?.type?.value?.startsWith('svg-ext'))
        ).map(ele => ({
          id: ele.id,
          name: this.currentView?.items[ele.id]?.name
        }));
      }
    }

    // ... 更多方法
  }

  export type DrawMode = 'select' | 'rect' | 'circle' | 'ellipse' | 'line' | 'path' | 'text' | 'fhpath' | 'image';
  export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  ```

- [ ] E2.2 创建剪贴板管理 `src/fuxa-editor/core/clipboard.ts`:
  ```typescript
  export interface CopiedAndPasted {
    srcId: string;
    destId: string;
  }

  export class ClipboardManager {
    private copiedElements: Map<string, GaugeSettings> = new Map();

    /**
     * 处理复制粘贴
     * 对应 editor.component.ts onCopyAndPaste()
     */
    handleCopyPaste(
      copiedPasted: CopiedAndPasted,
      currentView: View
    ): void {
      const srcSettings = currentView.items[copiedPasted.srcId];
      if (srcSettings) {
        // 深拷贝设置
        const newSettings = JSON.parse(JSON.stringify(srcSettings));
        newSettings.id = copiedPasted.destId;
        newSettings.name = `${srcSettings.name}_copy`;
        
        // 更新视图
        currentView.items[copiedPasted.destId] = newSettings;
      }
    }
  }
  ```

**验收**: EditorCore 可以初始化编辑器，加载/保存视图，切换绘图模式

---

### TODO E3: MDC Web 集成 (0.5天)

**目标**: 集成 Material Components Web，确保与 ThingsBoard 风格完全一致

**任务**:
- [ ] E3.1 添加 MDC Web 依赖:
  ```html
  <!-- CSS -->
  <link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet">
  <!-- JS -->
  <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"></script>
  <!-- Material Icons -->
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  ```

- [ ] E3.2 创建 MDC 组件初始化工具 `src/fuxa-editor/ui/mdc-utils.ts`:
  ```typescript
  /**
   * MDC 组件初始化工具
   * 用于动态创建的元素初始化 MDC 组件
   */
  export class MDCUtils {
    /**
     * 初始化容器内所有 MDC 组件
     */
    static initAll(container: HTMLElement): void {
      // 按钮涟漪效果
      container.querySelectorAll('.mdc-button, .mdc-icon-button').forEach(el => {
        mdc.ripple.MDCRipple.attachTo(el);
      });
      
      // 文本输入框
      container.querySelectorAll('.mdc-text-field').forEach(el => {
        mdc.textField.MDCTextField.attachTo(el);
      });
      
      // 下拉选择
      container.querySelectorAll('.mdc-select').forEach(el => {
        mdc.select.MDCSelect.attachTo(el);
      });
      
      // 对话框
      container.querySelectorAll('.mdc-dialog').forEach(el => {
        mdc.dialog.MDCDialog.attachTo(el);
      });
      
      // 抽屉
      container.querySelectorAll('.mdc-drawer').forEach(el => {
        mdc.drawer.MDCDrawer.attachTo(el);
      });
      
      // 列表
      container.querySelectorAll('.mdc-deprecated-list').forEach(el => {
        mdc.list.MDCList.attachTo(el);
      });
    }

    /**
     * 创建 MDC 按钮
     */
    static createButton(label: string, icon?: string, raised = false): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.className = `mdc-button ${raised ? 'mdc-button--raised' : ''}`;
      btn.innerHTML = `
        ${icon ? `<i class="material-icons mdc-button__icon">${icon}</i>` : ''}
        <span class="mdc-button__label">${label}</span>
      `;
      mdc.ripple.MDCRipple.attachTo(btn);
      return btn;
    }

    /**
     * 创建 MDC 图标按钮
     */
    static createIconButton(icon: string, title: string): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.className = 'mdc-icon-button material-icons';
      btn.textContent = icon;
      btn.title = title;
      mdc.ripple.MDCRipple.attachTo(btn).unbounded = true;
      return btn;
    }

    /**
     * 创建 MDC 文本输入框
     */
    static createTextField(label: string, value = ''): HTMLElement {
      const wrapper = document.createElement('label');
      wrapper.className = 'mdc-text-field mdc-text-field--outlined';
      wrapper.innerHTML = `
        <span class="mdc-notched-outline">
          <span class="mdc-notched-outline__leading"></span>
          <span class="mdc-notched-outline__notch">
            <span class="mdc-floating-label">${label}</span>
          </span>
          <span class="mdc-notched-outline__trailing"></span>
        </span>
        <input type="text" class="mdc-text-field__input" value="${value}">
      `;
      mdc.textField.MDCTextField.attachTo(wrapper);
      return wrapper;
    }

    /**
     * 创建 MDC 对话框
     */
    static createDialog(title: string, content: string | HTMLElement): mdc.dialog.MDCDialog {
      const dialog = document.createElement('div');
      dialog.className = 'mdc-dialog';
      dialog.innerHTML = `
        <div class="mdc-dialog__container">
          <div class="mdc-dialog__surface">
            <h2 class="mdc-dialog__title">${title}</h2>
            <div class="mdc-dialog__content"></div>
            <div class="mdc-dialog__actions">
              <button class="mdc-button mdc-dialog__button" data-mdc-dialog-action="cancel">
                <span class="mdc-button__label">取消</span>
              </button>
              <button class="mdc-button mdc-dialog__button" data-mdc-dialog-action="accept">
                <span class="mdc-button__label">确定</span>
              </button>
            </div>
          </div>
        </div>
        <div class="mdc-dialog__scrim"></div>
      `;
      
      const contentEl = dialog.querySelector('.mdc-dialog__content')!;
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else {
        contentEl.appendChild(content);
      }
      
      document.body.appendChild(dialog);
      return mdc.dialog.MDCDialog.attachTo(dialog);
    }
  }

  // 声明全局 mdc
  declare var mdc: any;
  ```

- [ ] E3.3 创建 TB 主题变量映射 `src/fuxa-editor/styles/mdc-overrides.css`:
  ```css
  /* 覆盖 MDC 主题变量，使用 TB 变量 */
  :root {
    --mdc-theme-primary: var(--tb-primary-color, #305680);
    --mdc-theme-secondary: var(--tb-accent-color, #d97f0d);
    --mdc-theme-surface: var(--tb-surface-color, #fff);
    --mdc-theme-background: var(--tb-background-color, #fafafa);
    --mdc-theme-on-primary: #fff;
    --mdc-theme-on-secondary: #fff;
    --mdc-theme-on-surface: var(--tb-text-primary, rgba(0,0,0,0.87));
  }

  /* 按钮样式与 TB 一致 */
  .mdc-button--raised {
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* 输入框样式 */
  .mdc-text-field--outlined {
    --mdc-shape-small: 4px;
  }

  /* 对话框样式 */
  .mdc-dialog__surface {
    border-radius: 4px;
  }

  /* 抽屉样式 */
  .mdc-drawer {
    border-color: var(--tb-divider-color, rgba(0,0,0,0.12));
  }
  ```

**验收**: MDC 组件正常渲染，视觉风格与 ThingsBoard 完全一致

---

### TODO E4: 编辑器 UI 框架 (1.5天)

**目标**: 创建编辑器基础 UI 布局，使用 MDC 组件

**任务**:
- [ ] E3.1 创建主布局 `src/fuxa-editor/ui/editor-layout.ts`:
  ```typescript
  export class EditorLayout {
    private container: HTMLElement;
    private leftSidebar: HTMLElement;
    private rightSidebar: HTMLElement;
    private canvas: HTMLElement;
    private toolbar: HTMLElement;

    constructor(container: HTMLElement) {
      this.container = container;
      this.render();
    }

    private render(): void {
      this.container.innerHTML = `
        <div class="fuxa-editor">
          <div class="editor-toolbar" id="editorToolbar"></div>
          <div class="editor-main">
            <aside class="editor-sidebar left" id="leftSidebar"></aside>
            <div class="editor-canvas" id="editorCanvas">
              <div id="svg_editor_container"></div>
            </div>
            <aside class="editor-sidebar right" id="rightSidebar"></aside>
          </div>
          <div class="editor-statusbar" id="editorStatusbar"></div>
        </div>
      `;
      
      this.leftSidebar = this.container.querySelector('#leftSidebar')!;
      this.rightSidebar = this.container.querySelector('#rightSidebar')!;
      this.canvas = this.container.querySelector('#editorCanvas')!;
      this.toolbar = this.container.querySelector('#editorToolbar')!;
    }

    getCanvasContainer(): HTMLElement {
      return this.container.querySelector('#svg_editor_container')!;
    }
  }
  ```

- [ ] E3.2 创建主样式 `src/fuxa-editor/styles/editor.css`:
  ```css
  .fuxa-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--tb-background-color, #fafafa);
    font-family: Roboto, sans-serif;
  }

  .editor-toolbar {
    height: 48px;
    background: var(--tb-surface-color, #fff);
    border-bottom: 1px solid var(--tb-divider-color, rgba(0,0,0,0.12));
    display: flex;
    align-items: center;
    padding: 0 8px;
  }

  .editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .editor-sidebar {
    width: 280px;
    background: var(--tb-surface-color, #fff);
    border-right: 1px solid var(--tb-divider-color, rgba(0,0,0,0.12));
    overflow-y: auto;
  }

  .editor-sidebar.right {
    border-right: none;
    border-left: 1px solid var(--tb-divider-color, rgba(0,0,0,0.12));
  }

  .editor-canvas {
    flex: 1;
    overflow: auto;
    background: #e0e0e0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #svg_editor_container {
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .editor-statusbar {
    height: 24px;
    background: var(--tb-surface-color, #fff);
    border-top: 1px solid var(--tb-divider-color, rgba(0,0,0,0.12));
    padding: 0 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
  }
  ```

- [ ] E3.3 创建折叠面板组件 `src/fuxa-editor/ui/components/collapsible-panel.ts`:
  ```typescript
  export class CollapsiblePanel {
    private element: HTMLElement;
    private isExpanded: boolean = true;

    constructor(
      parent: HTMLElement,
      title: string,
      icon: string,
      content: string | HTMLElement
    ) {
      this.element = document.createElement('div');
      this.element.className = 'collapsible-panel';
      this.element.innerHTML = `
        <div class="panel-header">
          <span class="material-icons">${icon}</span>
          <span class="panel-title">${title}</span>
          <span class="material-icons expand-icon">expand_more</span>
        </div>
        <div class="panel-content"></div>
      `;

      const contentEl = this.element.querySelector('.panel-content')!;
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else {
        contentEl.appendChild(content);
      }

      this.element.querySelector('.panel-header')!.addEventListener('click', () => {
        this.toggle();
      });

      parent.appendChild(this.element);
    }

    toggle(): void {
      this.isExpanded = !this.isExpanded;
      this.element.classList.toggle('collapsed', !this.isExpanded);
    }
  }
  ```

**验收**: 编辑器显示完整的三栏布局（左侧栏 + 画布 + 右侧栏），使用 MDC 抽屉组件

---

### TODO E5: 工具栏实现 (1天)

**目标**: 实现顶部工具栏，使用 MDC 按钮组件

**任务**:
- [ ] E5.1 创建工具栏 `src/fuxa-editor/ui/toolbar/toolbar.ts`:
  ```typescript
  export class EditorToolbar {
    private container: HTMLElement;
    private editor: FuxaEditorCore;

    constructor(container: HTMLElement, editor: FuxaEditorCore) {
      this.container = container;
      this.editor = editor;
      this.render();
    }

    private render(): void {
      this.container.innerHTML = `
        <div class="toolbar-group">
          <button class="mdc-icon-button material-icons" data-action="undo" title="撤销 (Ctrl+Z)">undo</button>
          <button class="mdc-icon-button material-icons" data-action="redo" title="重做 (Ctrl+Y)">redo</button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button class="mdc-icon-button material-icons active" data-mode="select" title="选择">near_me</button>
          <button class="mdc-icon-button material-icons" data-mode="rect" title="矩形">rectangle</button>
          <button class="mdc-icon-button material-icons" data-mode="circle" title="圆形">circle</button>
          <button class="mdc-icon-button material-icons" data-mode="line" title="直线">horizontal_rule</button>
          <button class="mdc-icon-button material-icons" data-mode="path" title="路径">gesture</button>
          <button class="toolbar-btn" data-mode="text" title="文本">
            <span class="material-icons">text_fields</span>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button class="toolbar-btn" data-action="alignLeft" title="左对齐">
            <span class="material-icons">align_horizontal_left</span>
          </button>
          <button class="toolbar-btn" data-action="alignCenter" title="水平居中">
            <span class="material-icons">align_horizontal_center</span>
          </button>
          <button class="toolbar-btn" data-action="alignRight" title="右对齐">
            <span class="material-icons">align_horizontal_right</span>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group colors">
          <label title="填充色">
            <span class="material-icons">format_color_fill</span>
            <input type="color" id="fillColor" value="#ffffff">
          </label>
          <label title="描边色">
            <span class="material-icons">border_color</span>
            <input type="color" id="strokeColor" value="#000000">
          </label>
        </div>
        <div class="toolbar-spacer"></div>
        <div class="toolbar-group">
          <button class="toolbar-btn primary" data-action="save" title="保存">
            <span class="material-icons">save</span>
            <span>保存</span>
          </button>
        </div>
      `;

      this.bindEvents();
    }

    private bindEvents(): void {
      // 绘图模式切换
      this.container.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-mode') as DrawMode;
          this.setActiveMode(btn as HTMLElement);
          this.editor.setMode(mode);
        });
      });

      // 动作按钮
      this.container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          this.handleAction(action!);
        });
      });

      // 颜色选择
      this.container.querySelector('#fillColor')!.addEventListener('change', (e) => {
        const color = (e.target as HTMLInputElement).value;
        svgEditor.setColor(color, 1, 'fill');
      });

      this.container.querySelector('#strokeColor')!.addEventListener('change', (e) => {
        const color = (e.target as HTMLInputElement).value;
        svgEditor.setColor(color, 1, 'stroke');
      });
    }

    private setActiveMode(activeBtn: HTMLElement): void {
      this.container.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.remove('active');
      });
      activeBtn.classList.add('active');
    }

    private handleAction(action: string): void {
      switch (action) {
        case 'undo': svgEditor.undo(); break;
        case 'redo': svgEditor.redo(); break;
        case 'alignLeft': this.editor.alignSelected('left'); break;
        case 'alignCenter': this.editor.alignSelected('center'); break;
        case 'alignRight': this.editor.alignSelected('right'); break;
        case 'save': this.onSave(); break;
      }
    }

    private onSave(): void {
      const view = this.editor.saveView();
      // 触发保存事件
    }
  }
  ```

- [ ] E4.2 创建工具栏样式 `src/fuxa-editor/styles/toolbar.css`

**验收**: 工具栏可切换绘图模式，执行撤销/重做/对齐操作

---

### TODO E5: 左侧边栏 - 控件面板 (1.5天)

**目标**: 实现控件/图形选择面板

**任务**:
- [ ] E5.1 创建控件面板 `src/fuxa-editor/ui/panels/controls-panel.ts`:
  ```typescript
  export class ControlsPanel {
    private container: HTMLElement;
    private editor: FuxaEditorCore;

    private controls = [
      { type: 'html_button', icon: 'smart_button', label: '按钮' },
      { type: 'html_input', icon: 'input', label: '输入框' },
      { type: 'html_select', icon: 'arrow_drop_down_circle', label: '下拉框' },
      { type: 'html_switch', icon: 'toggle_on', label: '开关' },
      { type: 'slider', icon: 'linear_scale', label: '滑块' },
      { type: 'value', icon: 'looks_one', label: '数值' },
      { type: 'gauge_progress', icon: 'data_usage', label: '进度条' },
      { type: 'gauge_semaphore', icon: 'traffic', label: '信号灯' },
      { type: 'html_chart', icon: 'show_chart', label: '图表' },
      { type: 'html_table', icon: 'table_chart', label: '表格' },
      { type: 'html_image', icon: 'image', label: '图片' },
      { type: 'pipe', icon: 'water', label: '管道' },
    ];

    constructor(container: HTMLElement, editor: FuxaEditorCore) {
      this.container = container;
      this.editor = editor;
      this.render();
    }

    private render(): void {
      const grid = document.createElement('div');
      grid.className = 'controls-grid';

      this.controls.forEach(ctrl => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.draggable = true;
        item.innerHTML = `
          <span class="material-icons">${ctrl.icon}</span>
          <span class="control-label">${ctrl.label}</span>
        `;

        item.addEventListener('dragstart', (e) => {
          e.dataTransfer!.setData('control-type', ctrl.type);
        });

        item.addEventListener('click', () => {
          this.insertControl(ctrl.type);
        });

        grid.appendChild(item);
      });

      this.container.appendChild(grid);
    }

    private insertControl(type: string): void {
      // 在画布中央插入控件
      svgEditor.clickExtension(type);
    }
  }
  ```

- [ ] E5.2 创建图形面板 `src/fuxa-editor/ui/panels/shapes-panel.ts`:
  ```typescript
  export class ShapesPanel {
    private container: HTMLElement;
    private categories = [
      { id: 'geometry', label: '几何图形', shapes: [] },
      { id: 'proc-eng', label: '工艺设备', shapes: [] },
      { id: 'ape', label: 'APE 符号', shapes: [] },
    ];

    constructor(container: HTMLElement) {
      this.container = container;
      this.loadShapes();
    }

    private async loadShapes(): Promise<void> {
      // 加载图形库 JSON
      for (const cat of this.categories) {
        try {
          const response = await fetch(`lib/shapes/${cat.id}.json`);
          cat.shapes = await response.json();
        } catch (e) {
          console.warn(`Failed to load shapes: ${cat.id}`);
        }
      }
      this.render();
    }

    private render(): void {
      // 渲染图形分类和缩略图
    }
  }
  ```

**验收**: 左侧边栏显示控件和图形列表，可点击/拖拽添加到画布

---

### TODO E6: 右侧边栏 - 属性面板 (2天)

**目标**: 实现选中元素的属性编辑面板

**任务**:
- [ ] E6.1 创建基础属性面板 `src/fuxa-editor/ui/panels/property-panel.ts`:
  ```typescript
  export class PropertyPanel {
    private container: HTMLElement;
    private editor: FuxaEditorCore;
    private currentElement: any = null;
    private currentSettings: GaugeSettings | null = null;

    constructor(container: HTMLElement, editor: FuxaEditorCore) {
      this.container = container;
      this.editor = editor;

      // 监听元素选中
      editor.onElementSelected = (element) => {
        this.showProperties(element);
      };
    }

    showProperties(element: any): void {
      this.currentElement = element;
      this.currentSettings = this.editor.getGaugeSettings(element);

      if (!this.currentSettings) {
        this.showEmptyState();
        return;
      }

      this.render();
    }

    private render(): void {
      const gs = this.currentSettings!;
      
      this.container.innerHTML = `
        <div class="property-panel">
          <div class="property-header">
            <span class="material-icons">settings</span>
            <span>属性</span>
          </div>
          
          <div class="property-section">
            <div class="property-row">
              <label>名称</label>
              <input type="text" id="propName" value="${gs.name || ''}" />
            </div>
            <div class="property-row">
              <label>类型</label>
              <span class="property-value">${gs.type}</span>
            </div>
          </div>

          <div class="property-section">
            <div class="section-title">数据绑定</div>
            <div class="property-row">
              <label>变量</label>
              <input type="text" id="propAddress" value="${gs.property?.address || ''}" />
            </div>
          </div>

          <div class="property-section">
            <button class="btn-primary" id="btnAdvanced">
              <span class="material-icons">tune</span>
              高级设置
            </button>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    private bindEvents(): void {
      // 名称变更
      this.container.querySelector('#propName')!.addEventListener('change', (e) => {
        if (this.currentSettings) {
          this.currentSettings.name = (e.target as HTMLInputElement).value;
        }
      });

      // 变量绑定
      this.container.querySelector('#propAddress')!.addEventListener('change', (e) => {
        if (this.currentSettings?.property) {
          this.currentSettings.property.address = (e.target as HTMLInputElement).value;
        }
      });

      // 高级设置
      this.container.querySelector('#btnAdvanced')!.addEventListener('click', () => {
        this.openAdvancedDialog();
      });
    }

    private openAdvancedDialog(): void {
      // 打开高级属性弹窗
    }

    private showEmptyState(): void {
      this.container.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">touch_app</span>
          <p>选择一个元素以编辑属性</p>
        </div>
      `;
    }
  }
  ```

- [ ] E6.2 创建高级属性弹窗 `src/fuxa-editor/ui/dialogs/gauge-property-dialog.ts`

- [ ] E6.3 为不同图元类型创建专用属性编辑器

**验收**: 选中元素后右侧显示属性面板，可编辑基本属性和打开高级设置

---

### TODO E7: 弹窗系统 (1天)

**目标**: 实现模态弹窗基础组件

**任务**:
- [ ] E7.1 创建通用弹窗 `src/fuxa-editor/ui/dialogs/modal.ts`:
  ```typescript
  export interface ModalOptions {
    title: string;
    width?: number;
    height?: number;
    content: string | HTMLElement;
    buttons?: ModalButton[];
    onClose?: () => void;
  }

  export interface ModalButton {
    label: string;
    type?: 'primary' | 'default' | 'danger';
    onClick: () => void | boolean; // 返回 false 阻止关闭
  }

  export class Modal {
    private overlay: HTMLElement;
    private dialog: HTMLElement;
    private options: ModalOptions;

    constructor(options: ModalOptions) {
      this.options = options;
      this.create();
    }

    private create(): void {
      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      
      this.dialog = document.createElement('div');
      this.dialog.className = 'modal-dialog';
      this.dialog.style.width = `${this.options.width || 500}px`;
      
      this.dialog.innerHTML = `
        <div class="modal-header">
          <span class="modal-title">${this.options.title}</span>
          <button class="modal-close">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      `;

      // 添加内容
      const body = this.dialog.querySelector('.modal-body')!;
      if (typeof this.options.content === 'string') {
        body.innerHTML = this.options.content;
      } else {
        body.appendChild(this.options.content);
      }

      // 添加按钮
      const footer = this.dialog.querySelector('.modal-footer')!;
      (this.options.buttons || []).forEach(btn => {
        const button = document.createElement('button');
        button.className = `modal-btn ${btn.type || 'default'}`;
        button.textContent = btn.label;
        button.addEventListener('click', () => {
          const result = btn.onClick();
          if (result !== false) this.close();
        });
        footer.appendChild(button);
      });

      // 关闭按钮
      this.dialog.querySelector('.modal-close')!.addEventListener('click', () => {
        this.close();
      });

      // 点击遮罩关闭
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });

      this.overlay.appendChild(this.dialog);
    }

    open(): void {
      document.body.appendChild(this.overlay);
      requestAnimationFrame(() => {
        this.overlay.classList.add('visible');
      });
    }

    close(): void {
      this.overlay.classList.remove('visible');
      setTimeout(() => {
        this.overlay.remove();
        this.options.onClose?.();
      }, 200);
    }

    static confirm(message: string): Promise<boolean> {
      return new Promise(resolve => {
        new Modal({
          title: '确认',
          content: `<p>${message}</p>`,
          buttons: [
            { label: '取消', onClick: () => resolve(false) },
            { label: '确定', type: 'primary', onClick: () => resolve(true) },
          ]
        }).open();
      });
    }
  }
  ```

- [ ] E7.2 创建弹窗样式 `src/fuxa-editor/styles/dialogs.css`

**验收**: 可打开/关闭弹窗，支持自定义内容和按钮

---

### TODO E8: 视图管理 (1天)

**目标**: 实现视图列表的增删改查

**任务**:
- [ ] E8.1 创建视图列表面板 `src/fuxa-editor/ui/panels/views-panel.ts`:
  ```typescript
  export class ViewsPanel {
    private container: HTMLElement;
    private views: View[] = [];
    private currentViewId: string | null = null;
    
    onViewSelect?: (view: View) => void;
    onViewCreate?: () => void;
    onViewDelete?: (view: View) => void;

    constructor(container: HTMLElement) {
      this.container = container;
      this.render();
    }

    setViews(views: View[]): void {
      this.views = views;
      this.renderViewList();
    }

    setCurrentView(viewId: string): void {
      this.currentViewId = viewId;
      this.renderViewList();
    }

    private render(): void {
      this.container.innerHTML = `
        <div class="views-panel">
          <div class="panel-toolbar">
            <button class="icon-btn" id="btnAddView" title="新建视图">
              <span class="material-icons">add</span>
            </button>
          </div>
          <div class="views-list" id="viewsList"></div>
        </div>
      `;

      this.container.querySelector('#btnAddView')!.addEventListener('click', () => {
        this.onViewCreate?.();
      });
    }

    private renderViewList(): void {
      const list = this.container.querySelector('#viewsList')!;
      list.innerHTML = this.views.map(view => `
        <div class="view-item ${view.id === this.currentViewId ? 'active' : ''}" 
             data-id="${view.id}">
          <span class="material-icons">dashboard</span>
          <span class="view-name">${view.name}</span>
          <button class="icon-btn small" data-action="delete">
            <span class="material-icons">delete</span>
          </button>
        </div>
      `).join('');

      // 绑定事件
      list.querySelectorAll('.view-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('[data-action="delete"]')) {
            const view = this.views.find(v => v.id === item.getAttribute('data-id'));
            if (view) this.onViewDelete?.(view);
          } else {
            const view = this.views.find(v => v.id === item.getAttribute('data-id'));
            if (view) this.onViewSelect?.(view);
          }
        });
      });
    }
  }
  ```

- [ ] E8.2 创建视图属性弹窗

**验收**: 可查看视图列表，新建/删除/切换视图

---

### TODO E9: TB Widget 集成 (1天)

**目标**: 将编辑器封装为 ThingsBoard Widget

**任务**:
- [ ] E9.1 创建编辑器 Widget `src/widgets/scada-editor/controller.ts`:
  ```typescript
  import { FuxaEditorCore } from '../../fuxa-editor/core/editor-core';
  import { EditorLayout } from '../../fuxa-editor/ui/editor-layout';
  import { EditorToolbar } from '../../fuxa-editor/ui/toolbar/toolbar';
  import { PropertyPanel } from '../../fuxa-editor/ui/panels/property-panel';
  import { ControlsPanel } from '../../fuxa-editor/ui/panels/controls-panel';
  import { ViewsPanel } from '../../fuxa-editor/ui/panels/views-panel';
  import { GaugesManager } from '../../fuxa-core/gauges/gauges-manager';

  // 加载依赖库
  function loadScripts(): Promise<void> {
    return new Promise((resolve) => {
      const scripts = [
        'lib/jquery.min.js',
        'lib/jquery-ui.min.js',
        'lib/svg.js',
        'lib/fuxa-editor.min.js',
      ];
      
      let loaded = 0;
      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loaded++;
          if (loaded === scripts.length) resolve();
        };
        document.head.appendChild(script);
      });
    });
  }

  self.onInit = async function() {
    const container = self.ctx.$container[0];
    
    // 加载脚本
    await loadScripts();
    
    // 初始化布局
    const layout = new EditorLayout(container);
    
    // 初始化核心
    const gaugesManager = new GaugesManager();
    const editor = new FuxaEditorCore(
      layout.getCanvasContainer(),
      gaugesManager,
      {
        onElementSelected: (el) => propertyPanel.showProperties(el),
      }
    );
    
    // 初始化 UI 组件
    const toolbar = new EditorToolbar(
      container.querySelector('#editorToolbar'),
      editor
    );
    
    const controlsPanel = new ControlsPanel(
      container.querySelector('#leftSidebar'),
      editor
    );
    
    const propertyPanel = new PropertyPanel(
      container.querySelector('#rightSidebar'),
      editor
    );
    
    // 初始化编辑器
    editor.init();
    
    // 加载初始视图
    if (self.ctx.settings.view) {
      editor.loadView(self.ctx.settings.view);
    }
    
    // 保存引用
    self.ctx.editor = editor;
  };

  self.onDestroy = function() {
    // 清理
  };
  ```

- [ ] E9.2 创建 Widget 配置 Schema

**验收**: Widget 可在 ThingsBoard 中加载，显示编辑器界面

---

### TODO E10: 测试与优化 (1天)

**任务**:
- [ ] E10.1 创建本地测试页面 `dev/editor.html`
- [ ] E10.2 测试所有绘图工具
- [ ] E10.3 测试控件添加和属性编辑
- [ ] E10.4 测试保存/加载功能
- [ ] E10.5 测试撤销/重做
- [ ] E10.6 性能优化
- [ ] E10.7 TB 集成测试

---

## 五、时间估算

| TODO | 内容 | 预计时间 |
|------|------|----------|
| TODO E1 | 编辑器库集成 | 0.5 天 |
| TODO E2 | 编辑器核心类 | 1 天 |
| TODO E3 | 基础 UI 框架 | 1.5 天 |
| TODO E4 | 工具栏实现 | 1 天 |
| TODO E5 | 左侧边栏-控件面板 | 1.5 天 |
| TODO E6 | 右侧边栏-属性面板 | 2 天 |
| TODO E7 | 弹窗系统 | 1 天 |
| TODO E8 | 视图管理 | 1 天 |
| TODO E9 | TB Widget 集成 | 1 天 |
| TODO E10 | 测试与优化 | 1 天 |
| **总计** | | **11.5 天** |

---

## 六、依赖关系

```
View 模式 (MIGRATION_PLAN.md)          Edit 模式 (本文档)
─────────────────────────────          ──────────────────
TODO 1: 事件系统          ◄─────────── TODO E2 依赖
TODO 2: 数据模型          ◄─────────── TODO E2, E6 依赖  
TODO 3: 工具函数          ◄─────────── TODO E2 依赖
TODO 4: 图元基类          ◄─────────── TODO E5 依赖
TODO 5: 图元组件          ◄─────────── TODO E5, E6 依赖
TODO 6: 图元管理器        ◄─────────── TODO E2 依赖
TODO 7: HMI 服务          
TODO 8: 视图渲染器        

建议执行顺序:
1. 先完成 View 模式 TODO 1-6 (基础设施)
2. 再开始 Edit 模式 TODO E1-E10
3. 最后完成 View 模式 TODO 7-11 (集成测试)
```

---

## 七、本地验证里程碑

### 里程碑 1: 最小可用编辑器 (TODO E1-E4)
- 可加载 SVG 编辑器
- 可使用基本绘图工具（矩形、圆、线）
- 可选中/移动/缩放元素
- 可撤销/重做

### 里程碑 2: 控件添加 (TODO E5)
- 可添加 FUXA 控件（按钮、输入框等）
- 可从左侧面板拖拽添加

### 里程碑 3: 属性编辑 (TODO E6-E7)
- 可编辑选中元素的属性
- 可配置数据绑定
- 可打开高级设置弹窗

### 里程碑 4: 完整编辑器 (TODO E8-E10)
- 可管理多个视图
- 可保存/加载项目
- 可在 TB 中使用

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| fuxa-editor.min.js 是混淆代码 | 难以调试和修改 | 只使用其公开 API，不修改内部 |
| jQuery 与现代框架冲突 | 可能有命名冲突 | 使用 jQuery.noConflict() |
| 属性编辑器复杂 | 每种图元需要专门的编辑器 | 先做通用编辑器，再逐步添加专用编辑器 |
| 图形库加载慢 | 首次打开慢 | 按需加载，缓存到 localStorage |

---

## 九、与 View 模式的对比

| 方面 | View 模式 | Edit 模式 |
|------|-----------|-----------|
| 核心复杂度 | 中 | 高 |
| Angular 依赖 | 低 (只在渲染层) | 高 (UI 层) |
| 可复用代码 | ~60% | ~40% (主要是库文件) |
| 预计时间 | 11 天 | 11.5 天 |
| 主要工作 | 移除 Angular 装饰器 | 重写 UI 组件 |
