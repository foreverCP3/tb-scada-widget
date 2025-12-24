/**
 * V4: 图元基类
 * 从 FUXA 复制，移除 Angular 装饰器 (@Component, @Input, @Output)
 * 使用自定义 EventEmitter
 */

import { EventEmitter } from '../lib/event-emitter';
import {
    GaugeSettings,
    GaugeProperty,
    GaugeEvent,
    GaugeEventType,
    GaugeStatus,
    GaugeActionStatus,
    GaugePropertyColor,
    GaugeAction
} from '../models/hmi';
import { Utils } from '../helpers/utils';
import { PropertyType } from '../helpers/define';

/**
 * GaugeBaseComponent - 所有图元的基类
 * 提供通用的静态方法用于图元操作
 */
export class GaugeBaseComponent {
    data: any;
    settings!: GaugeSettings;
    edit: EventEmitter<any> = new EventEmitter();

    static GAUGE_TEXT = 'text';

    constructor() { }

    onEdit() {
        this.edit.emit(this.settings);
    }

    /**
     * 将相对路径转换为绝对坐标
     */
    static pathToAbsolute(relativePath: string): number[][] {
        var pattern = /([ml])\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)/ig,
            coords: number[][] = [];

        relativePath.replace(pattern, function(match, command, x, y) {
            var prev;

            x = parseFloat(x);
            y = parseFloat(y);

            if (coords.length === 0 || command.toUpperCase() === command) {
                coords.push([x, y]);
            } else {
                prev = coords[coords.length - 1];
                coords.push([x + prev[0], y + prev[1]]);
            }
            return match;
        });

        return coords;
    }

    /**
     * 获取指定类型的事件
     */
    static getEvents(pro: GaugeProperty, type: GaugeEventType): GaugeEvent[] | null {
        let res: GaugeEvent[] = [];
        if (!pro || !pro.events) {
            return null;
        }
        pro.events.forEach(ev => {
            // 如果 type 为 null/undefined，返回所有事件；否则只返回匹配类型的事件
            if (!type || ev.type === type) {
                res.push(ev);
            }
        });
        return res.length > 0 ? res : null;
    }

    /**
     * 获取单位文本
     */
    static getUnit(pro: GaugeProperty, gaugeStatus: GaugeStatus): string {
        if (pro) {
            if (pro.ranges && pro.ranges.length > 0 && pro.ranges[0].type === PropertyType.output) {
                if (pro.ranges[0].textId && !Utils.isNullOrUndefined((gaugeStatus.variablesValue as any)[pro.ranges[0].textId])) {
                    pro.ranges[0].text = (gaugeStatus.variablesValue as any)[pro.ranges[0].textId];
                }
                return pro.ranges[0].text;
            }
        }
        return '';
    }

    /**
     * 获取小数位数
     */
    static getDigits(pro: GaugeProperty, gaugeStatus: GaugeStatus): number | null {
        if (pro) {
            if (pro.ranges && pro.ranges.length > 0) {
                const range = pro.ranges[0] as any;
                if (range['fractionDigitsId'] && !Utils.isNullOrUndefined((gaugeStatus.variablesValue as any)[range['fractionDigitsId']])) {
                    range['fractionDigits'] = (gaugeStatus.variablesValue as any)[range['fractionDigitsId']];
                }
                // 修复：使用 isNullOrUndefined 而不是 truthy 检查，这样 0 也能正确返回
                if (!Utils.isNullOrUndefined(range['fractionDigits'])) {
                    return range['fractionDigits'];
                }
            }
        }
        return null;
    }

    /**
     * 执行隐藏动作
     */
    static runActionHide(element: any, type: string, gaugeStatus: GaugeStatus): void {
        let actionRef = <GaugeActionStatus>{ type: type, animr: element.hide() };
        if (gaugeStatus.actionRef) {
            actionRef.spool = gaugeStatus.actionRef.spool;
            actionRef.timer = gaugeStatus.actionRef.timer;
        }
        gaugeStatus.actionRef = actionRef;
    }

    /**
     * 执行显示动作
     */
    static runActionShow(element: any, type: string, gaugeStatus: GaugeStatus): void {
        let actionRef = <GaugeActionStatus>{ type: type, animr: element.show() };
        if (gaugeStatus.actionRef) {
            actionRef.spool = gaugeStatus.actionRef.spool;
            actionRef.timer = gaugeStatus.actionRef.timer;
        }
        gaugeStatus.actionRef = actionRef;
    }

    /**
     * 检查并执行闪烁动作
     */
    static checkActionBlink(element: any, act: GaugeAction, gaugeStatus: GaugeStatus, toEnable: boolean, dom: boolean, propertyColor?: GaugePropertyColor): void {
        if (!gaugeStatus.actionRef) {
            gaugeStatus.actionRef = new GaugeActionStatus(act.type);
        }
        gaugeStatus.actionRef.type = act.type;
        if (toEnable) {
            if (gaugeStatus.actionRef.timer &&
                (GaugeBaseComponent.getBlinkActionId(act) === gaugeStatus.actionRef.spool?.actId)) {
                return;
            }
            GaugeBaseComponent.clearAnimationTimer(gaugeStatus.actionRef);
            var blinkStatus = false;
            // save action (dummy) id and colors to restore on break
            try {
                const actId = GaugeBaseComponent.getBlinkActionId(act);
                if (dom) {
                    gaugeStatus.actionRef.spool = { bk: element.style.backgroundColor, clr: element.style.color, actId: actId };
                }
                else {
                    gaugeStatus.actionRef.spool = { bk: element.node.getAttribute('fill'), clr: element.node.getAttribute('stroke'), actId: actId };
                }
            } catch (err) {
                console.error(err);
            }
            gaugeStatus.actionRef.timer = setInterval(() => {
                blinkStatus = (blinkStatus) ? false : true;
                try {
                    if (blinkStatus) {
                        if (dom) {
                            element.style.backgroundColor = act.options.fillA;
                            element.style.color = act.options.strokeA;
                        } else {
                            GaugeBaseComponent.walkTreeNodeToSetAttribute(element.node, 'fill', act.options.fillA);
                            GaugeBaseComponent.walkTreeNodeToSetAttribute(element.node, 'stroke', act.options.strokeA);
                        }
                    } else {
                        if (dom) {
                            element.style.backgroundColor = act.options.fillB;
                            element.style.color = act.options.strokeB;
                        } else {
                            GaugeBaseComponent.walkTreeNodeToSetAttribute(element.node, 'fill', act.options.fillB);
                            GaugeBaseComponent.walkTreeNodeToSetAttribute(element.node, 'stroke', act.options.strokeB);
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            }, act.options.interval);
        } else if (!toEnable) {
            try {
                // restore gauge
                if (!gaugeStatus.actionRef.spool || gaugeStatus.actionRef.spool.actId === GaugeBaseComponent.getBlinkActionId(act)) {
                    if (gaugeStatus.actionRef.timer) {
                        clearInterval(gaugeStatus.actionRef.timer);
                        gaugeStatus.actionRef.timer = null;
                    }
                    // check to overwrite with property color
                    if (propertyColor && gaugeStatus.actionRef.spool) {
                        if (propertyColor.fill) {
                            gaugeStatus.actionRef.spool.bk = propertyColor.fill;
                        }
                        if (propertyColor.stroke) {
                            gaugeStatus.actionRef.spool.clr = propertyColor.stroke;
                        }
                    }
                    if (dom) {
                        element.style.backgroundColor = gaugeStatus.actionRef.spool?.bk;
                        element.style.color = gaugeStatus.actionRef.spool?.clr;
                    } else if (gaugeStatus.actionRef.spool) {
                        GaugeBaseComponent.walkTreeNodeToSetAttribute(element.node, 'fill', gaugeStatus.actionRef.spool.bk);
                        GaugeBaseComponent.walkTreeNodeToSetAttribute(element.node, 'stroke', gaugeStatus.actionRef.spool.clr);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    /**
     * 清除动画定时器
     */
    static clearAnimationTimer(actref: GaugeActionStatus): void {
        if (actref && actref.timer) {
            clearTimeout(actref.timer);
            actref.timer = null;
        }
    }

    /**
     * 检查位掩码
     */
    static checkBitmask(bitmask: number, value: number): number {
        if (bitmask) {
            return (value & bitmask) ? 1 : 0;
        }
        return value;
    }

    /**
     * 检查位掩码和值
     */
    static checkBitmaskAndValue(bitmask: number, value: number, min: number, max: number): number {
        if (bitmask) {
            return (value & max & bitmask) ? 1 : 0;
        }
        return (value == min) ? 0 : 1;
    }

    /**
     * 使用位掩码计算值
     */
    static valueBitmask(bitmask: number, value: number, source: number): number {
        if (bitmask) {
            return (value & bitmask) | (source & ~bitmask);
        }
        return value;
    }

    /**
     * 切换位掩码
     */
    static toggleBitmask(value: number, bitmask: number): number {
        return value ^ bitmask;
    }

    /**
     * 提取掩码值并移位
     * maskedShiftedValue(0b11010110, 0b00011100) // → 5
     */
    static maskedShiftedValue(rawValue: string, bitmask: number): number | string | null {
        if (!bitmask) {
            return rawValue;
        }
        if (rawValue == null) {
            return null;
        }
        const parsed = parseInt(rawValue, 0);
        if (isNaN(parsed)) {
            return null;
        }
        let shift = 0;
        let mask = bitmask;
        while ((mask & 1) === 0) {
            mask >>= 1;
            shift++;
        }
        return (parsed & bitmask) >> shift;
    }

    /**
     * 获取闪烁动作ID
     */
    static getBlinkActionId(act: GaugeAction): string {
        return `${act.variableId}-${act.range.max}-${act.range.min}`;
    }

    /**
     * 遍历节点树设置属性
     */
    static walkTreeNodeToSetAttribute(node: any, attributeName: string, attributeValue: string | number): void {
        node?.setAttribute(attributeName, attributeValue);
        Utils.walkTree(node, (element: any) => {
            // 设置所有子元素的属性（包括 circle, rect, path 等 SVG 形状）
            if (element.id?.startsWith('SHE') || element.id?.startsWith('svg_')) {
                element.setAttribute(attributeName, attributeValue);
            } else if (element.tagName && ['circle', 'rect', 'ellipse', 'path', 'polygon', 'polyline', 'line'].includes(element.tagName.toLowerCase())) {
                // 如果是基本 SVG 形状且有对应属性，也设置它
                if (element.hasAttribute(attributeName)) {
                    element.setAttribute(attributeName, attributeValue);
                }
            }
        });
    }

    /**
     * 设置语言文本
     */
    static setLanguageText(elementWithLanguageText: any, text: string): void {
        if (text) {
            if (elementWithLanguageText?.tagName?.toLowerCase() === GaugeBaseComponent.GAUGE_TEXT) {
                elementWithLanguageText.textContent = text;
            }
        }
    }

    /**
     * 初始化方法 (替代 Angular ngOnInit)
     */
    init(): void {
        // 子类可以覆盖此方法
    }

    /**
     * 销毁方法 (替代 Angular ngOnDestroy)
     */
    destroy(): void {
        this.edit.unsubscribeAll();
    }
}

/**
 * 图元接口 - 定义图元必须实现的方法
 * 注意：TypeTag, LabelTag, PREFIX 是静态属性，不是实例属性
 * 这个接口主要用于类型提示，静态成员不能通过接口强制
 */
export interface IGauge {
    /** 图元类型标识 (静态属性，留作参考) */
    TypeTag?: string;
    /** 图元标签 (静态属性，留作参考) */
    LabelTag?: string;
    /** 前缀 (静态属性，留作参考) */
    PREFIX?: string;
    
    /** 实例数据 - 用于让 IGauge 有实际的实例成员 */
    data?: any;
    
    /**
     * 初始化图元
     */
    initElement?(ga: GaugeSettings, resolver?: any, is498view?: boolean, gaugeStatus?: GaugeStatus): void;
    
    /**
     * 处理值变化
     */
    processValue?(ga: GaugeSettings, svgele: any, sig: any, gaugeStatus: GaugeStatus): any;
    
    /**
     * 获取信号列表
     */
    getSignals?(ga: GaugeSettings): string[];
    
    /**
     * 获取对话框类型（用于属性编辑）
     */
    getDialogType?(gaugeType: string): any;
    
    /**
     * 获取默认设置
     */
    getDefaultValue?(gaugeType: string): any;
}

/**
 * 图元选项接口
 */
export interface GaugeOptions {
    /** 容器元素 */
    container?: HTMLElement;
    /** SVG 元素 */
    svgElement?: SVGSVGElement;
    /** 图元设置 */
    settings?: GaugeSettings;
    /** 是否只读 */
    readonly?: boolean;
}

/**
 * 图元工厂函数类型
 */
export type GaugeFactory = (options: GaugeOptions) => IGauge;
