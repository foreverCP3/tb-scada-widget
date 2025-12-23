/**
 * V5: HtmlButton 图元 - HTML 按钮
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeAction,
    GaugeActionsType,
    GaugePropertyColor,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

declare var SVG: any;

export class HtmlButtonComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-html_button';
    static LabelTag = 'HtmlButton';
    static prefixB = 'B-HXB_';
    static prefixRect = 'svg_';

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
        if (pro?.variableId) {
            res.push(pro.variableId);
        }
        if (pro?.actions && pro.actions.length) {
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
        return GaugeDialogType.RangeAndText;
    }

    static initElement(gab: GaugeSettings, textTranslation?: string): HTMLElement {
        let ele = document.getElementById(gab.id);
        if (ele && gab.property) {
            let htmlButton = Utils.searchTreeStartWith(ele, this.prefixB);
            if (htmlButton) {
                let text = textTranslation || gab.property.text || gab.name;
                htmlButton.innerHTML = (text) ? text : '<span>&nbsp;</span>';
            }
        }
        return ele!;
    }

    static initElementColor(bkcolor: string, color: string, ele: HTMLElement) {
        let htmlButton = Utils.searchTreeStartWith(ele, this.prefixB);
        if (htmlButton) {
            ele.setAttribute('fill', 'rgba(0, 0, 0, 0)');
            ele.setAttribute('stroke', 'rgba(0, 0, 0, 0)');
            for (let i = 0; i < ele.children.length; i++) {
                ele.children[i].removeAttribute('fill');
                ele.children[i].removeAttribute('stroke');
            }
            if (bkcolor) {
                htmlButton.style.backgroundColor = bkcolor;
            }
            if (color) {
                htmlButton.style.color = color;
            }
        }
    }

    static processValue(ga: GaugeSettings, element: HTMLElement | any, sig: Variable, gaugeStatus: GaugeStatus, isLabelType = false) {
        try {
            let button: HTMLElement | null = element instanceof HTMLElement ? element : null;
            if (button === null && element.node?.children && element.node.children.length >= 1) {
                button = Utils.searchTreeStartWith(element.node, this.prefixB);
            }
            if (button) {
                if (isLabelType) {
                    button.textContent = sig.value;
                    return;
                }
                let val = parseFloat(sig.value);
                if (Number.isNaN(val)) {
                    val = Number(sig.value);
                }
                if (ga.property) {
                    let propertyColor = new GaugePropertyColor();
                    if (ga.property.ranges) {
                        for (let idx = 0; idx < ga.property.ranges.length; idx++) {
                            if (ga.property.ranges[idx].min <= val && ga.property.ranges[idx].max >= val) {
                                propertyColor.fill = ga.property.ranges[idx].color;
                                propertyColor.stroke = ga.property.ranges[idx].stroke;
                            }
                        }
                        if (propertyColor.fill) {
                            button.style.backgroundColor = propertyColor.fill;
                        }
                        if (propertyColor.stroke) {
                            button.style.color = propertyColor.stroke;
                        }
                    }
                    // 检查动作
                    if (ga.property.actions) {
                        ga.property.actions.forEach((act: GaugeAction) => {
                            if (act.variableId === sig.id) {
                                HtmlButtonComponent.processAction(act, element, button, val, gaugeStatus, propertyColor);
                            }
                        });
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static getFillColor(ele: HTMLElement): string {
        if (ele.children && ele.children[0]) {
            let htmlButton = Utils.searchTreeStartWith(ele, this.prefixB);
            if (htmlButton) {
                let result = htmlButton.style['background-color'];
                if (!result) {
                    result = htmlButton.getAttribute('fill');
                }
                if (result) {
                    return result;
                }
            }
        }
        return ele.getAttribute('fill') ?? '';
    }

    static getStrokeColor(ele: HTMLElement): string {
        if (ele.children && ele.children[0]) {
            let htmlButton = Utils.searchTreeStartWith(ele, this.prefixB);
            if (htmlButton) {
                let result = htmlButton.style['color'];
                if (!result) {
                    result = htmlButton.getAttribute('stroke');
                }
                if (result) {
                    return result;
                }
            }
        }
        return ele.getAttribute('stroke') ?? '';
    }

    static processAction(act: GaugeAction, svgele: any, button: HTMLElement | any, value: any, gaugeStatus: GaugeStatus, propertyColor?: GaugePropertyColor) {
        const actType = act.type as keyof typeof HtmlButtonComponent.actionsType;
        if (this.actionsType[actType] === this.actionsType.hide) {
            if (act.range.min <= value && act.range.max >= value) {
                if (button === svgele) {
                    button.style.display = 'none';
                } else if (typeof SVG !== 'undefined') {
                    let element = SVG.adopt(svgele.node);
                    this.runActionHide(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.show) {
            if (act.range.min <= value && act.range.max >= value) {
                if (button === svgele) {
                    button.style.display = 'unset';
                } else if (typeof SVG !== 'undefined') {
                    let element = SVG.adopt(svgele.node);
                    this.runActionShow(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.blink) {
            let inRange = (act.range.min <= value && act.range.max >= value);
            this.checkActionBlink(button, act, gaugeStatus, inRange, true, propertyColor);
        }
    }
}
