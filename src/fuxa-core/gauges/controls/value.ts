/**
 * V5: Value 图元 - 数值显示
 * 用于显示变量值和单位
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeAction,
    GaugeActionsType,
    GaugeRangeProperty,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

declare var SVG: any;

export class ValueComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-value';
    static LabelTag = 'Value';

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
        if (pro.actions && pro.actions.length) {
            pro.actions.forEach((act: any) => {
                res.push(act.variableId);
            });
        }
        if (pro.ranges) {
            pro.ranges.forEach((range: GaugeRangeProperty) => {
                if (range.textId) {
                    res.push(range.textId);
                }
                if ((range as any)['fractionDigitsId']) {
                    res.push((range as any)['fractionDigitsId']);
                }
            });
        }
        if (pro.variableId) {
            res.push(pro.variableId);
        }
        return res;
    }

    static getActions(type: string) {
        return this.actionsType;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.ValueAndUnit;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            if (svgele.node && svgele.node.children && svgele.node.children.length <= 1) {
                let g = svgele.node.children[0];
                let val: any = parseFloat(sig.value);
                
                switch (typeof sig.value) {
                    case 'undefined':
                        break;
                    case 'boolean':
                        val = Number(sig.value);
                        break;
                    case 'number':
                        val = parseFloat(val.toFixed(5));
                        break;
                    case 'string':
                        val = sig.value;
                        break;
                    default:
                        break;
                }

                if (ga.property) {
                    let unit = GaugeBaseComponent.getUnit(ga.property, gaugeStatus);
                    let digit = GaugeBaseComponent.getDigits(ga.property, gaugeStatus);

                    if (!Utils.isNullOrUndefined(digit) && Utils.isNumeric(val)) {
                        val = parseFloat(sig.value).toFixed(digit ?? undefined);
                    }

                    if (ga.property.variableId === sig.id) {
                        try {
                            g.textContent = val;
                            if (unit) {
                                g.textContent += ' ' + unit;
                            }
                        } catch (err) {
                            console.error(ga, sig, err);
                        }
                    }

                    // 检查动作
                    if (ga.property.actions) {
                        ga.property.actions.forEach((act: GaugeAction) => {
                            if (act.variableId === sig.id) {
                                ValueComponent.processAction(act, svgele, parseFloat(val), gaugeStatus);
                            }
                        });
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static processAction(act: GaugeAction, svgele: any, value: any, gaugeStatus: GaugeStatus) {
        const actType = act.type as keyof typeof ValueComponent.actionsType;
        if (this.actionsType[actType] === this.actionsType.hide) {
            if (act.range.min <= value && act.range.max >= value) {
                let element = SVG.adopt(svgele.node);
                this.runActionHide(element, act.type, gaugeStatus);
            }
        } else if (this.actionsType[actType] === this.actionsType.show) {
            if (act.range.min <= value && act.range.max >= value) {
                let element = SVG.adopt(svgele.node);
                this.runActionShow(element, act.type, gaugeStatus);
            }
        } else if (this.actionsType[actType] === this.actionsType.blink) {
            let element = SVG.adopt(svgele.node.children[0]);
            let inRange = (act.range.min <= value && act.range.max >= value);
            this.checkActionBlink(element, act, gaugeStatus, inRange, false);
        }
    }
}

export class ValueProperty {
    signalid = '';
    format = '##.##';
}
