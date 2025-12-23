/**
 * V5: HtmlSelect 图元 - HTML 下拉选择框
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

export class HtmlSelectComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-html_select';
    static LabelTag = 'HtmlSelect';
    static prefix = 'S-HXS_';

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

    static initElement(ga: GaugeSettings, isView: boolean = false): HTMLElement | null {
        let select: HTMLSelectElement | null = null;
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);
            select = Utils.searchTreeStartWith(ele, this.prefix) as HTMLSelectElement;
            if (select) {
                if (ga.property) {
                    if (ga.property.readonly && isView) {
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
                        select!.appendChild(option);
                    });
                }
            }
        }
        return select;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            let select: HTMLSelectElement | undefined;
            if (svgele instanceof HTMLElement) {
                select = Utils.searchTreeStartWith(svgele, this.prefix) as HTMLSelectElement;
            } else if (svgele.node) {
                select = Utils.searchTreeStartWith(svgele.node, this.prefix) as HTMLSelectElement;
            }

            if (select && ga.property) {
                select.value = sig.value?.toString() ?? '';
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
