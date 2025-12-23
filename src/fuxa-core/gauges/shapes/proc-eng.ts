/**
 * Process Engineering Shapes Component - Migrated from FUXA
 * SVG shapes for process engineering diagrams
 * Supports animations: clockwise, anticlockwise, hide, show, blink, rotate, move
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, GaugePropertyColor, Variable, GaugeStatus, GaugeAction, GaugeActionsType, GaugeActionStatus, GaugeDialogType } from '../../models/hmi';
import { ShapesComponent } from '../controls/shapes';

declare var SVG: any;

export class ProcEngComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-proceng';
  static LabelTag = 'Proc-Eng';
  static PREFIX = '';

  static actionsType: { [key: string]: GaugeActionsType } = {
    hide: GaugeActionsType.hide,
    show: GaugeActionsType.show,
    blink: GaugeActionsType.blink,
    stop: GaugeActionsType.stop,
    clockwise: GaugeActionsType.clockwise,
    anticlockwise: GaugeActionsType.anticlockwise,
    rotate: GaugeActionsType.rotate,
    move: GaugeActionsType.move
  };

  /**
   * Get signals from gauge property
   */
  static getSignals(pro: GaugeProperty): string[] {
    const res: string[] = [];
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    if (pro.alarmId) {
      res.push(pro.alarmId);
    }
    if (pro.actions && pro.actions.length) {
      pro.actions.forEach(act => {
        if (act.variableId) {
          res.push(act.variableId);
        }
      });
    }
    return res;
  }

  /**
   * Get available actions for this shape type
   */
  static getActions(type: string): { [key: string]: GaugeActionsType } {
    return this.actionsType;
  }

  static getDialogType(): GaugeDialogType {
    return GaugeDialogType.RangeWithAlarm;
  }

  /**
   * Check if bitmask is supported
   */
  static isBitmaskSupported(): boolean {
    return true;
  }

  /**
   * Process value update
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus): void {
    try {
      if (svgele.node) {
        let value = parseFloat(sig.value);
        if (Number.isNaN(value)) {
          // maybe boolean
          value = Number(sig.value);
        } else {
          value = parseFloat(value.toFixed(5));
        }

        if (ga.property) {
          const propValue = GaugeBaseComponent.checkBitmask((ga.property as GaugeProperty).bitmask, value);
          const propertyColor = new GaugePropertyColor();

          if (ga.property.variableId === sig.id && ga.property.ranges) {
            for (let idx = 0; idx < ga.property.ranges.length; idx++) {
              if (ga.property.ranges[idx].min <= propValue && ga.property.ranges[idx].max >= propValue) {
                propertyColor.fill = ga.property.ranges[idx].color;
                propertyColor.stroke = ga.property.ranges[idx].stroke;
              }
            }
            if (propertyColor.fill) {
              GaugeBaseComponent.walkTreeNodeToSetAttribute(svgele.node, 'fill', propertyColor.fill);
            }
            if (propertyColor.stroke) {
              GaugeBaseComponent.walkTreeNodeToSetAttribute(svgele.node, 'stroke', propertyColor.stroke);
            }
          }

          // Check actions
          if (ga.property.actions) {
            ga.property.actions.forEach((act: any) => {
              if (act.variableId === sig.id) {
                ProcEngComponent.processAction(act, svgele, value, gaugeStatus, propertyColor);
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('ProcEngComponent.processValue error:', err);
    }
  }

  /**
   * Process action based on value
   */
  static processAction(act: GaugeAction, svgele: any, value: any, gaugeStatus: GaugeStatus, propertyColor?: GaugePropertyColor): void {
    const actValue = GaugeBaseComponent.checkBitmask(act.bitmask, value);

    if (this.actionsType[act.type] === GaugeActionsType.hide) {
      if (act.range.min <= actValue && act.range.max >= actValue) {
        if (typeof SVG !== 'undefined') {
          const element = SVG.adopt(svgele.node);
          this.runActionHide(element, act.type, gaugeStatus);
        }
      }
    } else if (this.actionsType[act.type] === GaugeActionsType.show) {
      if (act.range.min <= actValue && act.range.max >= actValue) {
        if (typeof SVG !== 'undefined') {
          const element = SVG.adopt(svgele.node);
          this.runActionShow(element, act.type, gaugeStatus);
        }
      }
    } else if (this.actionsType[act.type] === GaugeActionsType.blink) {
      if (typeof SVG !== 'undefined') {
        const element = SVG.adopt(svgele.node);
        const inRange = (act.range.min <= actValue && act.range.max >= actValue);
        this.checkActionBlink(element, act, gaugeStatus, inRange, false, propertyColor);
      }
    } else if (this.actionsType[act.type] === GaugeActionsType.rotate) {
      ShapesComponent.rotateShape(act, svgele, actValue);
    } else if (this.actionsType[act.type] === GaugeActionsType.move) {
      ShapesComponent.moveShape(act, svgele, actValue);
    } else {
      if (act.range.min <= actValue && act.range.max >= actValue) {
        if (typeof SVG !== 'undefined') {
          const element = SVG.adopt(svgele.node);
          ProcEngComponent.runMyAction(element, act.type, gaugeStatus);
        }
      }
    }
  }

  /**
   * Run rotation animation action
   */
  static runMyAction(element: any, type: string, gaugeStatus: GaugeStatus): void {
    if (gaugeStatus.actionRef && gaugeStatus.actionRef.type === type) {
      return;
    }

    if (element.timeline) {
      element.timeline().stop();
    }

    if (gaugeStatus.actionRef?.animr?.unschedule) {
      gaugeStatus.actionRef.animr.unschedule();
    }

    if (ProcEngComponent.actionsType[type] === GaugeActionsType.clockwise) {
      gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, 360);
    } else if (ProcEngComponent.actionsType[type] === GaugeActionsType.anticlockwise) {
      gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, -360);
    } else if (ProcEngComponent.actionsType[type] === GaugeActionsType.stop) {
      ShapesComponent.stopAnimationShape(gaugeStatus, type);
    }
  }

  /**
   * Initialize element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): any {
    const ele = document.getElementById(ga.id);
    if (ele) {
      ele.setAttribute('data-name', ga.name);
    }
    return ele;
  }
}
