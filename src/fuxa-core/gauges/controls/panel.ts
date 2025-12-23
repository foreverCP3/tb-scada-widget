/**
 * V5: Panel 图元 - 面板（嵌入视图）
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeActionsType,
    Hmi,
    View,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export class PanelComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-own_ctrl-panel';
    static LabelTag = 'Panel';
    static prefixD = 'D-OXC_';

    static actionsType = {
        hide: GaugeActionsType.hide,
        show: GaugeActionsType.show
    };

    // 存储 HMI 引用，用于查找视图
    static hmi: Hmi;

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

    static getActions(type: string) {
        return this.actionsType;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Panel;
    }

    /**
     * 初始化面板元素
     * @param ga 图元设置
     * @param hmi HMI 配置
     * @param loadViewFn 加载视图的回调函数
     * @param isview 是否是视图模式
     */
    static initElement(
        ga: GaugeSettings,
        hmi: Hmi,
        loadViewFn?: (view: View, container: HTMLElement) => void,
        isview: boolean = false
    ): HTMLElement {
        if (hmi) {
            PanelComponent.hmi = hmi;
        }

        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
            let panelContainer = Utils.searchTreeStartWith(ele, this.prefixD);
            if (panelContainer) {
                panelContainer.innerHTML = '';

                if (!isview) {
                    // 编辑模式 - 显示占位符
                    let span = document.createElement('span');
                    span.innerHTML = 'Panel';
                    span.style.cssText = `
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.1);
                        color: #666;
                        font-size: 14px;
                    `;
                    panelContainer.appendChild(span);
                    return ele;
                }

                // 视图模式 - 加载嵌入视图
                if (ga.property?.viewName && loadViewFn && hmi) {
                    const view = hmi.views?.find(v => v.name === ga.property.viewName);
                    if (view) {
                        // 创建视图容器
                        const viewContainer = document.createElement('div');
                        viewContainer.className = 'panel-view-container';
                        viewContainer.style.cssText = `
                            width: 100%;
                            height: 100%;
                            overflow: hidden;
                        `;
                        panelContainer.appendChild(viewContainer);

                        // 调用加载视图的回调
                        loadViewFn(view, viewContainer);

                        // 处理缩放模式
                        if (ga.property.scaleMode) {
                            Utils.resizeViewExt('.view-container', ga.id, ga.property.scaleMode);
                        }
                    }
                }

                // 存储面板容器引用，供 processValue 使用
                (ele as any)['panelContainer'] = panelContainer;
            }
        }
        return ele!;
    }

    static processValue(
        ga: GaugeSettings,
        svgele: any,
        sig: Variable,
        gaugeStatus: GaugeStatus,
        loadViewFn?: (view: View, container: HTMLElement) => void
    ) {
        try {
            // 根据变量值切换视图
            if (PanelComponent.hmi && loadViewFn) {
                const view = PanelComponent.hmi.views?.find(v => v.name === sig.value);
                if (view) {
                    let ele = document.getElementById(ga.id);
                    let panelContainer = (ele as any)?.['panelContainer'] || Utils.searchTreeStartWith(ele, this.prefixD);
                    
                    if (panelContainer) {
                        panelContainer.innerHTML = '';
                        const viewContainer = document.createElement('div');
                        viewContainer.className = 'panel-view-container';
                        viewContainer.style.cssText = `
                            width: 100%;
                            height: 100%;
                            overflow: hidden;
                        `;
                        panelContainer.appendChild(viewContainer);
                        
                        loadViewFn(view, viewContainer);

                        if (ga.property?.scaleMode) {
                            Utils.resizeViewExt('.view-container', ga.id, ga.property.scaleMode);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}
