/**
 * V5: Shapes 图元 - 基础形状
 * 用于处理基础 SVG 形状（rect, circle, line, path, ellipse, text）
 * 从 FUXA shapes.component.ts 完整复制，移除 Angular 依赖
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeAction,
    GaugeActionsType,
    GaugePropertyColor,
    GaugeProperty,
    GaugeActionStatus,
    GaugeDialogType,
    GaugeEvent,
    GaugeEventType
} from '../../models/hmi';

declare var SVG: any;

export class ShapesComponent extends GaugeBaseComponent {
    // TypeId = 'shapes';                                   // Standard shapes (General, Shapes)
    static TypeTag = 'svg-ext-shapes'; // 用于标识形状类型，与 svgeditor 库绑定

    static LabelTag = 'Shapes';

    static actionsType = {
        hide: GaugeActionsType.hide,
        show: GaugeActionsType.show,
        blink: GaugeActionsType.blink,
        stop: GaugeActionsType.stop,
        clockwise: GaugeActionsType.clockwise,
        anticlockwise: GaugeActionsType.anticlockwise,
        rotate: GaugeActionsType.rotate,
        move: GaugeActionsType.move
    };

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
        if (pro.actions && pro.actions.length) {
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

    static isBitmaskSupported(): boolean {
        return true;
    }

    /**
     * 获取事件列表 - 用于绑定鼠标事件
     */
    static getEvents(property: GaugeProperty, type: GaugeEventType): GaugeEvent[] | null {
        return GaugeBaseComponent.getEvents(property, type);
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            if (svgele.node) {
                let value: number;
                const sigValue = sig.value as any;
                // 处理各种类型的值
                if (typeof sigValue === 'boolean') {
                    value = sigValue ? 1 : 0;
                } else if (sigValue === 'true' || sigValue === true) {
                    value = 1;
                } else if (sigValue === 'false' || sigValue === false) {
                    value = 0;
                } else {
                    value = parseFloat(sigValue);
                    if (Number.isNaN(value)) {
                        value = 0;
                    } else {
                        value = parseFloat(value.toFixed(5));
                    }
                }
                if (ga.property) {
                    // 位掩码检查
                    let propValue = GaugeBaseComponent.checkBitmask((ga.property as GaugeProperty).bitmask, value);
                    let propertyColor = new GaugePropertyColor();
                    if (ga.property.variableId === sig.id && ga.property.ranges) {
                        for (let idx = 0; idx < ga.property.ranges.length; idx++) {
                            if (ga.property.ranges[idx].min <= propValue && ga.property.ranges[idx].max >= propValue) {
                                propertyColor.fill = ga.property.ranges[idx].color;
                                propertyColor.stroke = ga.property.ranges[idx].stroke;
                            }
                        }
                        // 检查是否是通用形状（line/path/fpath/text）来设置描边
                        if (propertyColor.fill) {
                            GaugeBaseComponent.walkTreeNodeToSetAttribute(svgele.node, 'fill', propertyColor.fill);
                        }
                        if (propertyColor.stroke) {
                            GaugeBaseComponent.walkTreeNodeToSetAttribute(svgele.node, 'stroke', propertyColor.stroke);
                        }
                    }
                    // 检查动作
                    if (ga.property.actions) {
                        ga.property.actions.forEach((act: GaugeAction) => {
                            if (act.variableId === sig.id) {
                                ShapesComponent.processAction(act, svgele, value, gaugeStatus, propertyColor);
                            }
                        });
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static processAction(act: GaugeAction, svgele: any, value: any, gaugeStatus: GaugeStatus, propertyColor?: GaugePropertyColor) {
        let actValue = GaugeBaseComponent.checkBitmask(act.bitmask, value);
        const actType = act.type as keyof typeof ShapesComponent.actionsType;
        if (this.actionsType[actType] === this.actionsType.hide) {
            if (act.range.min <= actValue && act.range.max >= actValue) {
                if (typeof SVG !== 'undefined') {
                    let element = SVG.adopt(svgele.node);
                    this.runActionHide(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.show) {
            if (act.range.min <= actValue && act.range.max >= actValue) {
                if (typeof SVG !== 'undefined') {
                    let element = SVG.adopt(svgele.node);
                    this.runActionShow(element, act.type, gaugeStatus);
                }
            }
        } else if (this.actionsType[actType] === this.actionsType.blink) {
            if (typeof SVG !== 'undefined') {
                let element = SVG.adopt(svgele.node);
                let inRange = (act.range.min <= actValue && act.range.max >= actValue);
                this.checkActionBlink(element, act, gaugeStatus, inRange, false, propertyColor);
            }
        } else if (this.actionsType[actType] === this.actionsType.rotate) {
            ShapesComponent.rotateShape(act, svgele, actValue);
        } else if (ShapesComponent.actionsType[actType] === ShapesComponent.actionsType.move) {
            ShapesComponent.moveShape(act, svgele, actValue);
        } else {
            if (act.range.min <= actValue && act.range.max >= actValue) {
                if (typeof SVG !== 'undefined') {
                    var element = SVG.adopt(svgele.node);
                    ShapesComponent.runMyAction(element, act.type, gaugeStatus);
                }
            }
        }
    }

    static runMyAction(element: any, type: string, gaugeStatus: GaugeStatus) {
        const actionType = type as keyof typeof ShapesComponent.actionsType;
        if (gaugeStatus.actionRef && gaugeStatus.actionRef.type === type) {
            return;
        }
        if (element.timeline) {
            element.timeline().stop();
        }
        if (gaugeStatus.actionRef?.animr) {
            gaugeStatus.actionRef?.animr.unschedule();
        }
        if (ShapesComponent.actionsType[actionType] === ShapesComponent.actionsType.clockwise) {
            gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, 360);
        } else if (ShapesComponent.actionsType[actionType] === ShapesComponent.actionsType.anticlockwise) {
            gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, -360);
        } else if (ShapesComponent.actionsType[actionType] === ShapesComponent.actionsType.stop) {
            ShapesComponent.stopAnimationShape(gaugeStatus, type);
        }
    }

    static startRotateAnimationShape(element: any, type: string, angle: number): GaugeActionStatus {
        // 获取元素的边界框来计算中心点
        const bbox = element.bbox();
        const cx = bbox.cx;
        const cy = bbox.cy;
        
        // 使用中心点作为旋转原点
        return { 
            type: type, 
            animr: element.animate(3000).ease('-').rotate(angle, cx, cy).loop() 
        } as GaugeActionStatus;
    }

    static stopAnimationShape(gaugeStatus: GaugeStatus, type: string) {
        if (gaugeStatus.actionRef) {
            ShapesComponent.clearAnimationTimer(gaugeStatus.actionRef);
            gaugeStatus.actionRef.type = type;
        }
    }

    static rotateShape(act: GaugeAction, svgele: any, actValue: number) {
        if (act.range.min <= actValue && act.range.max >= actValue) {
            if (typeof SVG !== 'undefined') {
                let element = SVG.adopt(svgele.node);
                let valRange = act.range.max - act.range.min;
                if (act.range.max === act.range.min) {
                    valRange = 1;
                }
                let angleRange = act.options.maxAngle - act.options.minAngle;

                // 根据定义的范围和实际值计算旋转角度
                let rotation = valRange > 0 ? act.options.minAngle + (actValue * angleRange / valRange) : 0;

                // 不允许旋转角度超出配置范围
                if (rotation > act.options.maxAngle) {
                    rotation = act.options.maxAngle;
                } else if (rotation < act.options.minAngle) {
                    rotation = act.options.minAngle;
                }
                
                // 获取元素的边界框来计算中心点
                const bbox = element.bbox();
                const cx = bbox.cx;
                const cy = bbox.cy;
                
                element.animate(200).ease('-').transform({
                    rotate: rotation,
                    origin: [cx, cy]
                });
            }
        }
    }

    static moveShape(act: GaugeAction, svgele: any, actValue: number) {
        if (typeof SVG !== 'undefined') {
            let element = SVG.adopt(svgele.node);
            if (act.range.min <= actValue && act.range.max >= actValue) {
                element.animate(act.options.duration || 500).ease('-').move(act.options.toX, act.options.toY);
            }
        }
    }
}
