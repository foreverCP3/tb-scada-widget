/**
 * V5: HtmlInput 图元 - HTML 输入框
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
    InputOptionsProperty,
    InputOptionType,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

/**
 * Input value validation result
 */
export interface InputValueValidation {
    valid: boolean;
    value: any;
    errorText: string;
    min: number;
    max: number;
}

export class HtmlInputComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-html_input';
    static LabelTag = 'HtmlInput';
    static prefix = 'I-HXI_';

    /** Elements that should skip Enter key event (e.g. textarea) */
    static SkipEnterEvent = ['textarea'];

    /** Input types that handle date/time */
    static InputDateTimeType = [InputOptionType.datetime, InputOptionType.date, InputOptionType.time];

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

    static isBitmaskSupported(): boolean {
        return true;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Input;
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

    /**
     * Validate input value against gauge settings constraints
     */
    static validateValue(value: any, ga: GaugeSettings): InputValueValidation {
        let result: InputValueValidation = {
            valid: true,
            value: value,
            errorText: '',
            min: 0,
            max: 0
        };

        if (ga.property?.options?.numeric || ga.property?.options?.type === InputOptionType.number) {
            const options = ga.property.options;
            if (!Utils.isNullOrUndefined(options.min) && !Utils.isNullOrUndefined(options.max)) {
                if (Number.isNaN(value) || !(/^-?[\d.]+$/.test(value))) {
                    result.valid = false;
                    result.errorText = 'html-input.invalid-number';
                    return result;
                }
                const numValue = parseFloat(value);
                if (numValue < options.min || numValue > options.max) {
                    result.valid = false;
                    result.errorText = 'html-input.out-of-range';
                    result.min = options.min;
                    result.max = options.max;
                    return result;
                }
            }
        }
        return result;
    }

    /**
     * Check and set input type based on options
     */
    static checkInputType(inputElement: HTMLInputElement, options?: InputOptionsProperty): void {
        if (!inputElement || !options) return;
        
        if (options.numeric || options.type === InputOptionType.number) {
            inputElement.type = 'number';
            inputElement.inputMode = 'decimal';
        }
    }

    static getHtmlEvents(ga: GaugeSettings): Event | null {
        let ele = document.getElementById(ga.id);
        if (ele) {
            let input = Utils.searchTreeStartWith(ele, this.prefix);
            if (input) {
                let event = new Event();
                event.dom = input;
                event.type = 'key-enter';
                event.ga = ga;
                return event;
            }
        }
        return null;
    }

    static initElement(ga: GaugeSettings, isView: boolean = false): HTMLElement | null {
        let ele = document.getElementById(ga.id);
        if (ele && ga.property) {
            ele.setAttribute('data-name', ga.name);
            let input = Utils.searchTreeStartWith(ele, this.prefix) as HTMLInputElement;
            if (input) {
                // 设置输入类型
                if (ga.property?.options) {
                    const options = ga.property.options as InputOptionsProperty;
                    if (options.type === InputOptionType.number) {
                        input.type = 'number';
                        if (options.min !== undefined) input.min = options.min.toString();
                        if (options.max !== undefined) input.max = options.max.toString();
                    } else if (options.type === InputOptionType.password) {
                        input.type = 'password';
                    } else if (options.type === InputOptionType.datetime) {
                        input.type = 'datetime-local';
                    } else if (options.type === InputOptionType.date) {
                        input.type = 'date';
                    } else if (options.type === InputOptionType.time) {
                        input.type = 'time';
                    } else if (options.type === InputOptionType.textarea) {
                        // 转换为 textarea 需要特殊处理
                    } else {
                        input.type = 'text';
                    }
                    if (options.maxlength) {
                        input.maxLength = options.maxlength;
                    }
                    if (options.readonly) {
                        input.readOnly = true;
                    }
                }

                if (isView) {
                    input.value = '';
                    input.setAttribute('autocomplete', 'off');
                    // Adjust the width to better fit the surrounding svg rect
                    input.style.margin = '1px 1px';
                } else {
                    input.value = '#.##';
                }
            }
        }
        return ele;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            let input: HTMLInputElement | undefined;
            if (svgele instanceof HTMLElement) {
                input = Utils.searchTreeStartWith(svgele, this.prefix) as HTMLInputElement;
            } else if (svgele.node) {
                input = Utils.searchTreeStartWith(svgele.node, this.prefix) as HTMLInputElement;
            }

            if (input && ga.property) {
                let value = sig.value;
                
                // 处理位掩码
                if (ga.property.bitmask) {
                    value = GaugeBaseComponent.maskedShiftedValue(value, ga.property.bitmask) as string;
                }

                input.value = value?.toString() ?? '';
            }
        } catch (err) {
            console.error(err);
        }
    }

    static initElementColor(bkcolor: string, color: string, ele: HTMLElement) {
        let input = Utils.searchTreeStartWith(ele, this.prefix) as HTMLInputElement;
        if (input) {
            if (bkcolor) {
                input.style.backgroundColor = bkcolor;
            }
            if (color) {
                input.style.color = color;
            }
        }
    }

    static getFillColor(ele: HTMLElement): string {
        let input = Utils.searchTreeStartWith(ele, this.prefix) as HTMLInputElement;
        if (input) {
            return input.style.backgroundColor || '';
        }
        return '';
    }

    static getStrokeColor(ele: HTMLElement): string {
        let input = Utils.searchTreeStartWith(ele, this.prefix) as HTMLInputElement;
        if (input) {
            return input.style.color || '';
        }
        return '';
    }
}
