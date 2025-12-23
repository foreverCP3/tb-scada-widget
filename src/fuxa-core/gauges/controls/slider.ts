/**
 * V5: Slider 图元 - 滑块
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    Event,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export class SliderComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-slider';
    static LabelTag = 'Slider';
    static prefix = 'R-SLI_';

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
        return GaugeDialogType.Slider;
    }

    static initElement(ga: GaugeSettings, callback?: (event: Event) => void): HTMLElement {
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
            let sliderContainer = Utils.searchTreeStartWith(ele, this.prefix);
            if (sliderContainer) {
                // 创建滑块
                const slider = SliderComponent.createSlider(ga, sliderContainer, callback);
                return slider;
            }
        }
        return ele!;
    }

    /**
     * 创建滑块 UI
     */
    static createSlider(ga: GaugeSettings, container: HTMLElement, callback?: (event: Event) => void): HTMLElement {
        container.innerHTML = '';

        const options = ga.property?.options || {};
        const min = options.min ?? 0;
        const max = options.max ?? 100;
        const step = options.step ?? 1;
        const orientation = options.orientation || 'horizontal';
        const height = container.clientHeight || 30;
        const width = container.clientWidth || 200;

        // 创建 input range
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min.toString();
        slider.max = max.toString();
        slider.step = step.toString();
        slider.value = options.defaultValue?.toString() ?? min.toString();

        if (orientation === 'vertical') {
            slider.style.cssText = `
                width: ${height}px;
                height: ${width}px;
                transform: rotate(-90deg);
                transform-origin: ${height/2}px ${height/2}px;
            `;
        } else {
            slider.style.cssText = `
                width: ${width}px;
                height: ${height}px;
            `;
        }

        slider.style.cursor = 'pointer';
        container.appendChild(slider);

        // 存储获取值的方法
        (container as any)['getValue'] = () => parseFloat(slider.value);
        (container as any)['setValue'] = (val: number) => {
            slider.value = val.toString();
        };

        // 绑定事件
        if (callback) {
            slider.addEventListener('input', (e) => {
                let event = new Event();
                event.ga = ga;
                event.value = parseFloat((e.target as HTMLInputElement).value);
                event.type = 'slide';
                callback(event);
            });

            slider.addEventListener('change', (e) => {
                let event = new Event();
                event.ga = ga;
                event.value = parseFloat((e.target as HTMLInputElement).value);
                event.type = 'change';
                callback(event);
            });
        }

        return container;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, slider?: any) {
        try {
            if (slider && slider['setValue']) {
                let value = parseFloat(sig.value);
                if (!Number.isNaN(value)) {
                    slider['setValue'](value);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}
