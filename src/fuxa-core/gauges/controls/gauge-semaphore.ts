/**
 * V5: GaugeSemaphore 图元 - 信号灯
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeActionsType,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

declare var SVG: any;

export class GaugeSemaphoreComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-gauge_semaphore';
    static LabelTag = 'HtmlSemaphore';
    static prefix = 'L-GXS_';

    static actionsType = {
        hide: GaugeActionsType.hide,
        show: GaugeActionsType.show,
        blink: GaugeActionsType.blink
    };

    constructor() {
        super();
    }

    static getSignals(pro: any): string[] {
        let res: string[] = [];
        if (pro.variableId) {
            res.push(pro.variableId);
        }
        if (pro.actions) {
            pro.actions.forEach((act: any) => {
                res.push(act.variableId);
            });
        }
        return res;
    }

    static getActions(type: string) {
        return this.actionsType;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Range;
    }

    static isBitmaskSupported(): boolean {
        return true;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            let value = parseFloat(sig.value);
            if (Number.isNaN(value)) {
                value = Number(sig.value);
            }

            if (ga.property?.ranges) {
                // 遍历所有灯
                const lights = Utils.childrenStartWith(svgele.node, this.prefix);
                
                // 重置所有灯为灰色
                lights.forEach((light: HTMLElement) => {
                    light.setAttribute('fill', '#808080');
                    light.setAttribute('opacity', '0.3');
                });

                // 根据值点亮对应的灯
                ga.property.ranges.forEach((range: any, idx: number) => {
                    if (value >= range.min && value <= range.max) {
                        if (lights[idx]) {
                            lights[idx].setAttribute('fill', range.color || '#00FF00');
                            lights[idx].setAttribute('opacity', '1');
                        }
                    }
                });
            }

            // 处理动作
            if (ga.property?.actions) {
                ga.property.actions.forEach((act: any) => {
                    if (act.variableId === sig.id) {
                        GaugeSemaphoreComponent.processAction(act, svgele, value, gaugeStatus);
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    static processAction(act: any, svgele: any, value: any, gaugeStatus: GaugeStatus) {
        const actType = act.type as keyof typeof GaugeSemaphoreComponent.actionsType;
        if (this.actionsType[actType] === this.actionsType.hide) {
            if (act.range.min <= value && act.range.max >= value) {
                if (typeof SVG !== 'undefined') {
                    let element = SVG.adopt(svgele.node);
                    this.runActionHide(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.show) {
            if (act.range.min <= value && act.range.max >= value) {
                if (typeof SVG !== 'undefined') {
                    let element = SVG.adopt(svgele.node);
                    this.runActionShow(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.blink) {
            const lights = Utils.childrenStartWith(svgele.node, this.prefix);
            let inRange = (act.range.min <= value && act.range.max >= value);
            if (lights.length > 0 && typeof SVG !== 'undefined') {
                let element = SVG.adopt(lights[0]);
                this.checkActionBlink(element, act, gaugeStatus, inRange, false);
            }
        }
    }

    static initElement(ga: GaugeSettings, isview: boolean = false): HTMLElement {
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
        }
        return ele!;
    }
}
