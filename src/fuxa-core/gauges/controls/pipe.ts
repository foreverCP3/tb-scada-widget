/**
 * V5: Pipe 图元 - 管道
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

export class PipeComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-pipe';
    static LabelTag = 'Pipe';
    static prefix = 'P-PIP_';

    static actionsType = {
        hide: GaugeActionsType.hide,
        show: GaugeActionsType.show,
        blink: GaugeActionsType.blink,
        stop: GaugeActionsType.stop,
        clockwise: GaugeActionsType.clockwise,
        anticlockwise: GaugeActionsType.anticlockwise
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
        return GaugeDialogType.Pipe;
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

            if (ga.property) {
                // 根据值范围设置颜色
                if (ga.property.ranges) {
                    for (let range of ga.property.ranges) {
                        if (value >= range.min && value <= range.max) {
                            if (range.color) {
                                GaugeBaseComponent.walkTreeNodeToSetAttribute(svgele.node, 'fill', range.color);
                            }
                            if (range.stroke) {
                                GaugeBaseComponent.walkTreeNodeToSetAttribute(svgele.node, 'stroke', range.stroke);
                            }
                            break;
                        }
                    }
                }

                // 处理动作
                if (ga.property.actions) {
                    ga.property.actions.forEach((act: any) => {
                        if (act.variableId === sig.id) {
                            PipeComponent.processAction(act, svgele, value, gaugeStatus);
                        }
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static processAction(act: any, svgele: any, value: any, gaugeStatus: GaugeStatus) {
        const actType = act.type as keyof typeof PipeComponent.actionsType;
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
            let element = typeof SVG !== 'undefined' ? SVG.adopt(svgele.node) : svgele;
            let inRange = (act.range.min <= value && act.range.max >= value);
            this.checkActionBlink(element, act, gaugeStatus, inRange, false);
        } else if (this.actionsType[actType] === this.actionsType.clockwise ||
                   this.actionsType[actType] === this.actionsType.anticlockwise) {
            // 管道流动动画
            PipeComponent.processFlowAnimation(svgele, act, value, gaugeStatus,
                this.actionsType[actType] === this.actionsType.clockwise);
        } else if (this.actionsType[actType] === this.actionsType.stop) {
            PipeComponent.stopAnimation(gaugeStatus);
        }
    }

    static processFlowAnimation(svgele: any, act: any, value: any, gaugeStatus: GaugeStatus, forward: boolean) {
        if (act.range.min <= value && act.range.max >= value) {
            if (!gaugeStatus.actionRef || !gaugeStatus.actionRef.timer) {
                const speed = act.options?.speed || 50;
                let offset = 0;
                const dashArray = '10,5';

                gaugeStatus.actionRef = {
                    type: act.type,
                    timer: setInterval(() => {
                        offset += forward ? 1 : -1;
                        try {
                            svgele.node.style.strokeDasharray = dashArray;
                            svgele.node.style.strokeDashoffset = offset;
                        } catch (err) { }
                    }, speed)
                };
            }
        } else {
            PipeComponent.stopAnimation(gaugeStatus);
        }
    }

    static stopAnimation(gaugeStatus: GaugeStatus) {
        if (gaugeStatus.actionRef && gaugeStatus.actionRef.timer) {
            clearInterval(gaugeStatus.actionRef.timer);
            gaugeStatus.actionRef.timer = null;
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
