/**
 * V5: HtmlSwitch 图元 - HTML 开关
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    Event,
    GaugeProperty,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export class HtmlSwitchComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-html_switch';
    static LabelTag = 'HtmlSwitch';
    static prefix = 'T-HXT_';

    constructor() {
        super();
    }

    static getSignals(pro: any): string[] {
        let res: string[] = [];
        if (pro.variableId) {
            res.push(pro.variableId);
        }
        if (pro.alarmId) {
            res.push(pro.alarmId);
        }
        if (pro.actions) {
            pro.actions.forEach((act: any) => {
                res.push(act.variableId);
            });
        }
        return res;
    }

    static isBitmaskSupported(): boolean {
        return true;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Switch;
    }

    static initElement(ga: GaugeSettings, callback?: (event: Event) => void): HTMLElement {
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
            let switchContainer = Utils.searchTreeStartWith(ele, this.prefix) as HTMLElement;
            if (switchContainer) {
                // 创建自定义开关
                const switcher = HtmlSwitchComponent.createSwitch(ga, switchContainer, callback);
                return switcher;
            }
        }
        return ele!;
    }

    /**
     * 创建开关 UI
     */
    static createSwitch(ga: GaugeSettings, container: HTMLElement, callback?: (event: Event) => void): HTMLElement {
        container.innerHTML = '';
        
        const options = ga.property?.options || {};
        const height = container.clientHeight || 30;
        const width = container.clientWidth || 60;

        // 创建开关容器
        const switchWrapper = document.createElement('div');
        switchWrapper.className = 'fuxa-switch';
        switchWrapper.style.cssText = `
            position: relative;
            width: ${width}px;
            height: ${height}px;
            background-color: ${options.offColor || '#ccc'};
            border-radius: ${height / 2}px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;

        // 创建开关滑块
        const slider = document.createElement('div');
        slider.className = 'fuxa-switch-slider';
        slider.style.cssText = `
            position: absolute;
            top: 2px;
            left: 2px;
            width: ${height - 4}px;
            height: ${height - 4}px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        switchWrapper.appendChild(slider);
        container.appendChild(switchWrapper);

        // 存储状态
        let isOn = false;
        (switchWrapper as any)['getValue'] = () => isOn ? 1 : 0;
        (switchWrapper as any)['setValue'] = (val: number) => {
            isOn = val > 0;
            switchWrapper.style.backgroundColor = isOn ? (options.onColor || '#4CAF50') : (options.offColor || '#ccc');
            slider.style.transform = isOn ? `translateX(${width - height}px)` : 'translateX(0)';
        };

        // 绑定点击事件
        switchWrapper.addEventListener('click', () => {
            isOn = !isOn;
            (switchWrapper as any)['setValue'](isOn ? 1 : 0);
            
            if (callback) {
                let event = new Event();
                event.ga = ga;
                event.type = 'on';
                
                // 处理 onValue/offValue
                if (options.onValue !== undefined && options.offValue !== undefined) {
                    event.value = isOn ? options.onValue : options.offValue;
                } else {
                    event.value = isOn ? 1 : 0;
                }
                
                callback(event);
            }
        });

        return switchWrapper;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, switcher?: any) {
        try {
            if (switcher && switcher['setValue']) {
                let value = parseFloat(sig.value);
                if (Number.isNaN(value)) {
                    value = Number(sig.value);
                } else {
                    value = parseFloat(value.toFixed(5));
                }

                if (typeof sig.value !== 'boolean' && ga.property) {
                    value = GaugeBaseComponent.checkBitmaskAndValue(
                        (ga.property as GaugeProperty).bitmask,
                        value,
                        (ga.property as GaugeProperty).options?.offValue || 0,
                        (ga.property as GaugeProperty).options?.onValue || 1
                    );
                }

                switcher['setValue'](value);
            }
        } catch (err) {
            console.error(err);
        }
    }
}
