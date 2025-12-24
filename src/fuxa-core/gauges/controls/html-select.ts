/**
 * V5: HtmlSelect 图元 - HTML 下拉选择框
 * 
 * 支持两种模式：
 * 1. 原生 select（默认）- 简单场景
 * 2. 自定义下拉（useCustomDropdown=true）- 完全主题支持
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeProperty,
    Event,
    GaugeEvent,
    GaugeEventType,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

// 自定义下拉组件的 CSS 类名
const CUSTOM_SELECT_CLASS = 'scada-custom-select';
const CUSTOM_SELECT_TRIGGER_CLASS = 'scada-custom-select-trigger';
const CUSTOM_SELECT_DROPDOWN_CLASS = 'scada-custom-select-dropdown';
const CUSTOM_SELECT_OPTION_CLASS = 'scada-custom-select-option';

export class HtmlSelectComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-html_select';
    static LabelTag = 'HtmlSelect';
    static prefix = 'S-HXS_';

    // 是否使用自定义下拉组件（解决原生 select 样式问题）
    static useCustomDropdown = true;

    constructor() {
        super();
    }

    static getSignals(pro: any): string[] {
        let res: string[] = [];
        if (pro.variableId) {
            res.push(pro.variableId);
        }
        return res;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Step;
    }

    /**
     * Get events from property by event type
     */
    static getEvents(property: GaugeProperty, eventType: GaugeEventType): GaugeEvent[] {
        if (property?.events) {
            const eventTypeKey = Utils.getEnumKey(GaugeEventType, eventType);
            return property.events.filter((ev: GaugeEvent) => ev.type === eventTypeKey);
        }
        return [];
    }

    static getHtmlEvents(ga: GaugeSettings): Event | null {
        let ele = document.getElementById(ga.id);
        if (ele) {
            let select = Utils.searchTreeStartWith(ele, this.prefix);
            if (select) {
                let event = new Event();
                event.dom = select;
                event.type = 'change';
                event.ga = ga;
                return event;
            }
        }
        return null;
    }

    /**
     * 注入自定义下拉组件的 CSS 样式
     */
    private static injectCustomSelectStyles(): void {
        const styleId = 'scada-custom-select-styles';
        if (document.getElementById(styleId)) {
            return; // 已注入
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .${CUSTOM_SELECT_CLASS} {
                position: relative;
                display: inline-block;
                width: 100%;
                font-family: inherit;
            }
            
            .${CUSTOM_SELECT_CLASS} select {
                position: absolute;
                opacity: 0;
                pointer-events: none;
                width: 100%;
                height: 100%;
            }
            
            .${CUSTOM_SELECT_TRIGGER_CLASS} {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background-color: var(--tb-surface, #323c49);
                border: 1px solid var(--tb-border, rgba(255,255,255,0.23));
                border-radius: 4px;
                color: var(--tb-text-primary, #fff);
                cursor: pointer;
                user-select: none;
                min-height: 36px;
                box-sizing: border-box;
            }
            
            .${CUSTOM_SELECT_TRIGGER_CLASS}:hover {
                border-color: var(--tb-primary, #4a7cb0);
            }
            
            .${CUSTOM_SELECT_TRIGGER_CLASS}::after {
                content: '';
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid currentColor;
                margin-left: 8px;
                transition: transform 0.2s ease;
            }
            
            .${CUSTOM_SELECT_CLASS}.open .${CUSTOM_SELECT_TRIGGER_CLASS}::after {
                transform: rotate(180deg);
            }
            
            .${CUSTOM_SELECT_DROPDOWN_CLASS} {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 4px;
                background-color: var(--tb-surface, #323c49);
                border: 1px solid var(--tb-border, rgba(255,255,255,0.23));
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                max-height: 200px;
                overflow-y: auto;
                display: none;
            }
            
            .${CUSTOM_SELECT_CLASS}.open .${CUSTOM_SELECT_DROPDOWN_CLASS} {
                display: block;
            }
            
            .${CUSTOM_SELECT_OPTION_CLASS} {
                padding: 10px 12px;
                color: var(--tb-text-primary, #fff);
                cursor: pointer;
                transition: background-color 0.15s ease;
            }
            
            .${CUSTOM_SELECT_OPTION_CLASS}:hover {
                background-color: var(--tb-primary, #4a7cb0);
            }
            
            .${CUSTOM_SELECT_OPTION_CLASS}.selected {
                background-color: var(--tb-primary-dark, #305680);
            }
            
            .${CUSTOM_SELECT_OPTION_CLASS}.selected::before {
                content: '✓ ';
            }
            
            /* 禁用状态 */
            .${CUSTOM_SELECT_CLASS}.disabled .${CUSTOM_SELECT_TRIGGER_CLASS} {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            /* 滚动条样式 */
            .${CUSTOM_SELECT_DROPDOWN_CLASS}::-webkit-scrollbar {
                width: 6px;
            }
            
            .${CUSTOM_SELECT_DROPDOWN_CLASS}::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .${CUSTOM_SELECT_DROPDOWN_CLASS}::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }
            
            .${CUSTOM_SELECT_DROPDOWN_CLASS}::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 创建自定义下拉组件
     */
    private static createCustomSelect(
        nativeSelect: HTMLSelectElement,
        ranges: any[],
        readonly: boolean
    ): HTMLElement {
        // 注入样式
        this.injectCustomSelectStyles();

        // 创建容器
        const container = document.createElement('div');
        container.className = CUSTOM_SELECT_CLASS;
        if (readonly) {
            container.classList.add('disabled');
        }

        // 保留原生 select（用于表单提交和事件触发）
        nativeSelect.style.position = 'absolute';
        nativeSelect.style.opacity = '0';
        nativeSelect.style.pointerEvents = 'none';

        // 创建触发器
        const trigger = document.createElement('div');
        trigger.className = CUSTOM_SELECT_TRIGGER_CLASS;
        trigger.textContent = ranges.length > 0 ? (ranges[0].text || ranges[0].min) : 'Choose...';

        // 创建下拉列表
        const dropdown = document.createElement('div');
        dropdown.className = CUSTOM_SELECT_DROPDOWN_CLASS;

        // 添加选项
        ranges.forEach((range, index) => {
            const option = document.createElement('div');
            option.className = CUSTOM_SELECT_OPTION_CLASS;
            option.textContent = range.text || range.min;
            option.dataset.value = range.min;
            
            if (index === 0) {
                option.classList.add('selected');
            }

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 更新选中状态
                dropdown.querySelectorAll(`.${CUSTOM_SELECT_OPTION_CLASS}`).forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                
                // 更新触发器文本
                trigger.textContent = option.textContent;
                
                // 更新原生 select 值并触发事件
                nativeSelect.value = range.min;
                nativeSelect.dispatchEvent(new window.Event('change', { bubbles: true }));
                
                // 关闭下拉
                container.classList.remove('open');
            });

            dropdown.appendChild(option);

            // 同步添加到原生 select
            const nativeOption = document.createElement('option');
            nativeOption.value = range.min;
            nativeOption.text = range.text || range.min;
            nativeSelect.appendChild(nativeOption);
        });

        // 点击触发器切换下拉
        if (!readonly) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.toggle('open');
            });

            // 点击外部关闭下拉
            document.addEventListener('click', () => {
                container.classList.remove('open');
            });
        }

        // 组装组件
        container.appendChild(nativeSelect);
        container.appendChild(trigger);
        container.appendChild(dropdown);

        return container;
    }

    static initElement(ga: GaugeSettings, isView: boolean = false): HTMLElement | null {
        let select: HTMLSelectElement | null = null;
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
            select = Utils.searchTreeStartWith(ele, this.prefix) as HTMLSelectElement;
            if (select) {
                const readonly = ga.property?.readonly && isView;
                
                if (ga.property) {
                    if (readonly) {
                        select.disabled = true;
                        select.style.appearance = 'none';
                        select.style.borderWidth = '0px';
                    } else {
                        select.style.appearance = 'menulist';
                    }
                    let align = select.style.textAlign;
                    if (align) {
                        (select.style as any)['text-align-last'] = align;
                    }
                }
                select.innerHTML = '';

                // 在 view 模式下使用自定义下拉
                if (isView && this.useCustomDropdown && ga.property?.ranges?.length) {
                    const customSelect = this.createCustomSelect(
                        select,
                        ga.property.ranges,
                        !!readonly
                    );
                    
                    // 替换原生 select
                    const parent = select.parentElement;
                    if (parent) {
                        parent.insertBefore(customSelect, select);
                        customSelect.appendChild(select);
                    }
                    
                    return customSelect;
                }

                // 原生 select 模式
                if (!isView) {
                    let option = document.createElement('option');
                    option.disabled = true;
                    option.selected = true;
                    option.innerHTML = 'Choose...';
                    select.appendChild(option);
                } else {
                    ga.property?.ranges?.forEach((element: any) => {
                        let option = document.createElement('option');
                        option.value = element.min;
                        if (element.text) {
                            option.text = element.text;
                        }
                        // Apply theme-aware styling to options
                        this.applyOptionStyle(option);
                        select!.appendChild(option);
                    });
                }
            }
        }
        return select;
    }

    /**
     * Apply theme-aware styling to select options
     * Note: Native select options have limited CSS support
     * This provides best-effort styling for browsers that support it
     */
    private static applyOptionStyle(option: HTMLOptionElement): void {
        // Get computed styles from CSS variables or use defaults
        const isDarkTheme = document.body.classList.contains('theme-dark') ||
                           document.body.getAttribute('data-theme') === 'dark' ||
                           document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (isDarkTheme) {
            option.style.backgroundColor = '#323c49';
            option.style.color = '#ffffff';
        }
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            let container: HTMLElement | undefined;
            if (svgele instanceof HTMLElement) {
                container = svgele;
            } else if (svgele.node) {
                container = svgele.node;
            }

            if (!container || !ga.property) return;

            // 查找 select 元素
            let select = Utils.searchTreeStartWith(container, this.prefix) as HTMLSelectElement;
            if (!select) {
                // 可能在自定义容器中
                const customContainer = container.querySelector(`.${CUSTOM_SELECT_CLASS}`);
                if (customContainer) {
                    select = customContainer.querySelector('select') as HTMLSelectElement;
                }
            }

            if (select) {
                // 解析值
                let val = parseFloat(sig.value);
                if (Number.isNaN(val)) {
                    val = Number(sig.value);
                } else {
                    val = parseFloat(val.toFixed(5));
                }
                
                select.value = val.toString();

                // 根据 FUXA 实现：基于 range 设置背景色和文字颜色
                if (ga.property.ranges) {
                    const range = ga.property.ranges.find((r: any) => r.min == val);
                    if (range) {
                        if (range.color) {
                            select.style.background = range.color;
                        }
                        if (range.stroke) {
                            select.style.color = range.stroke;
                        }
                    }
                }

                // 如果使用自定义下拉，同步更新 UI
                const customContainer = select.closest(`.${CUSTOM_SELECT_CLASS}`);
                if (customContainer) {
                    const trigger = customContainer.querySelector(`.${CUSTOM_SELECT_TRIGGER_CLASS}`) as HTMLElement;
                    const options = customContainer.querySelectorAll(`.${CUSTOM_SELECT_OPTION_CLASS}`);
                    const value = val.toString();
                    
                    options.forEach(opt => {
                        const optEl = opt as HTMLElement;
                        opt.classList.remove('selected');
                        if (optEl.dataset.value === value) {
                            opt.classList.add('selected');
                            if (trigger) {
                                trigger.textContent = optEl.textContent;
                                // 同步 range 颜色到 trigger
                                if (ga.property?.ranges) {
                                    const range = ga.property.ranges.find((r: any) => r.min == val);
                                    if (range) {
                                        if (range.color) trigger.style.backgroundColor = range.color;
                                        if (range.stroke) trigger.style.color = range.stroke;
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static initElementColor(bkcolor: string, color: string, ele: HTMLElement) {
        let select = Utils.searchTreeStartWith(ele, this.prefix) as HTMLSelectElement;
        if (select) {
            if (bkcolor) {
                select.style.backgroundColor = bkcolor;
            }
            if (color) {
                select.style.color = color;
            }
            
            // 同步到自定义下拉
            const customContainer = select.closest(`.${CUSTOM_SELECT_CLASS}`);
            if (customContainer) {
                const trigger = customContainer.querySelector(`.${CUSTOM_SELECT_TRIGGER_CLASS}`) as HTMLElement;
                const dropdown = customContainer.querySelector(`.${CUSTOM_SELECT_DROPDOWN_CLASS}`) as HTMLElement;
                if (trigger) {
                    if (bkcolor) trigger.style.backgroundColor = bkcolor;
                    if (color) trigger.style.color = color;
                }
                if (dropdown) {
                    if (bkcolor) dropdown.style.backgroundColor = bkcolor;
                    if (color) dropdown.style.color = color;
                }
            }
        }
    }

    static getFillColor(ele: HTMLElement): string {
        let select = Utils.searchTreeStartWith(ele, this.prefix) as HTMLSelectElement;
        if (select) {
            return select.style.backgroundColor || '';
        }
        return '';
    }

    static getStrokeColor(ele: HTMLElement): string {
        let select = Utils.searchTreeStartWith(ele, this.prefix) as HTMLSelectElement;
        if (select) {
            return select.style.color || '';
        }
        return '';
    }
}
