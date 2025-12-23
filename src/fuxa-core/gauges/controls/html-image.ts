/**
 * V5: HtmlImage 图元 - 图片
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

export class HtmlImageComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-html_image';
    static LabelTag = 'HtmlImage';
    static prefix = 'I-HXI_';

    static actionsType = {
        hide: GaugeActionsType.hide,
        show: GaugeActionsType.show,
        blink: GaugeActionsType.blink,
        refreshImage: GaugeActionsType.refreshImage
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
        return GaugeDialogType.RangeWithAlarm;
    }

    static initElement(ga: GaugeSettings, isview: boolean = false): HTMLElement {
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
            
            // 设置图片源
            if (ga.property?.options?.address) {
                let img = Utils.searchTreeStartWith(ele, this.prefix) as HTMLImageElement;
                if (img) {
                    img.src = ga.property.options.address;
                }
            }
        }
        return ele!;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            let img: HTMLImageElement | undefined;
            if (svgele instanceof HTMLElement) {
                img = Utils.searchTreeStartWith(svgele, this.prefix) as HTMLImageElement;
            } else if (svgele.node) {
                img = Utils.searchTreeStartWith(svgele.node, this.prefix) as HTMLImageElement;
            }

            let value = parseFloat(sig.value);
            if (Number.isNaN(value)) {
                // 如果值是字符串，可能是图片URL
                if (typeof sig.value === 'string' && sig.value.length > 0) {
                    if (img && ga.property?.variableId === sig.id) {
                        img.src = sig.value;
                    }
                }
                value = Number(sig.value);
            }

            if (ga.property?.actions) {
                ga.property.actions.forEach((act: any) => {
                    if (act.variableId === sig.id) {
                        HtmlImageComponent.processAction(act, svgele, img, value, gaugeStatus);
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    static processAction(act: any, svgele: any, img: HTMLImageElement | undefined, value: any, gaugeStatus: GaugeStatus) {
        const actType = act.type as keyof typeof HtmlImageComponent.actionsType;
        if (this.actionsType[actType] === this.actionsType.hide) {
            if (act.range.min <= value && act.range.max >= value) {
                if (typeof SVG !== 'undefined' && svgele.node) {
                    let element = SVG.adopt(svgele.node);
                    this.runActionHide(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.show) {
            if (act.range.min <= value && act.range.max >= value) {
                if (typeof SVG !== 'undefined' && svgele.node) {
                    let element = SVG.adopt(svgele.node);
                    this.runActionShow(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.blink) {
            let element = img || (typeof SVG !== 'undefined' ? SVG.adopt(svgele.node) : svgele);
            let inRange = (act.range.min <= value && act.range.max >= value);
            this.checkActionBlink(element, act, gaugeStatus, inRange, !!img);
        } else if (this.actionsType[actType] === this.actionsType.refreshImage) {
            // 刷新图片（添加时间戳防止缓存）
            if (act.range.min <= value && act.range.max >= value) {
                if (img && img.src) {
                    const baseUrl = img.src.split('?')[0];
                    img.src = baseUrl + '?t=' + Date.now();
                }
            }
        }
    }
}
