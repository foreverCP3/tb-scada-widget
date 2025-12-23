/**
 * Animated Process Engineering Shapes Component - Migrated from FUXA
 * SVG shapes with animations for process engineering diagrams
 * Supports animations: clockwise, anticlockwise, downup, hide, show, rotate, move
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, GaugePropertyColor, Variable, GaugeStatus, GaugeAction, GaugeActionsType, GaugeActionStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';
import { ShapesComponent } from '../controls/shapes';

declare var SVG: any;

export class ApeShapesComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-ape';
  static EliType = 'svg-ext-ape-eli';
  static PistonType = 'svg-ext-ape-piston';
  static LabelTag = 'AnimProcEng';
  static PREFIX = '';

  static actionsType: { [key: string]: GaugeActionsType } = {
    stop: GaugeActionsType.stop,
    clockwise: GaugeActionsType.clockwise,
    anticlockwise: GaugeActionsType.anticlockwise,
    downup: GaugeActionsType.downup,
    hide: GaugeActionsType.hide,
    show: GaugeActionsType.show,
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
    if (pro.actions) {
      pro.actions.forEach(act => {
        if (act.variableId) {
          res.push(act.variableId);
        }
      });
    }
    return res;
  }

  /**
   * Get available actions based on shape type
   */
  static getActions(type: string): { [key: string]: GaugeActionsType } {
    const actions = { ...ApeShapesComponent.actionsType };
    
    if (type === ApeShapesComponent.EliType) {
      delete actions.downup;
    } else if (type === ApeShapesComponent.PistonType) {
      delete actions.anticlockwise;
      delete actions.clockwise;
    }
    
    return actions;
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

          if (ga.property.variableId === sig.id && ga.property.ranges) {
            const propertyColor = new GaugePropertyColor();
            
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
                ApeShapesComponent.processAction(act, svgele, value, gaugeStatus);
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('ApeShapesComponent.processValue error:', err);
    }
  }

  /**
   * Process action based on value
   */
  static processAction(act: GaugeAction, svgele: any, value: any, gaugeStatus: GaugeStatus): void {
    const actValue = GaugeBaseComponent.checkBitmask(act.bitmask, value);

    if (this.actionsType[act.type] === GaugeActionsType.hide) {
      if (act.range.min <= actValue && act.range.max >= actValue) {
        if (typeof SVG !== 'undefined') {
          const element = SVG.adopt(svgele.node);
          ApeShapesComponent.clearAnimationTimer(gaugeStatus.actionRef);
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
    } else if (this.actionsType[act.type] === GaugeActionsType.rotate) {
      ShapesComponent.rotateShape(act, svgele, actValue);
    } else if (this.actionsType[act.type] === GaugeActionsType.move) {
      ShapesComponent.moveShape(act, svgele, actValue);
    } else {
      if (act.range.min <= actValue && act.range.max >= actValue) {
        if (typeof SVG !== 'undefined') {
          const element = SVG.adopt(svgele.node);
          ApeShapesComponent.runMyAction(element, act.type, gaugeStatus);
        }
      }
    }
  }

  /**
   * Run animation action
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

    if (ApeShapesComponent.actionsType[type] === GaugeActionsType.clockwise) {
      gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, 360);
    } else if (ApeShapesComponent.actionsType[type] === GaugeActionsType.anticlockwise) {
      gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, -360);
    } else if (ApeShapesComponent.actionsType[type] === GaugeActionsType.downup) {
      const eletoanim = Utils.searchTreeStartWith(element.node, 'pm');
      if (eletoanim) {
        const animElement = SVG.adopt(eletoanim);
        const elebox = eletoanim.getBBox();
        let movefrom = { x: elebox.x, y: elebox.y };
        
        if (gaugeStatus.actionRef && gaugeStatus.actionRef.spool) {
          movefrom = gaugeStatus.actionRef.spool;
        }
        
        const moveto = { x: elebox.x, y: elebox.y - 25 };
        ApeShapesComponent.clearAnimationTimer(gaugeStatus.actionRef);
        
        const timeout = setInterval(() => {
          animElement.animate(1000).ease('-').move(moveto.x, moveto.y)
            .animate(1000).ease('-').move(movefrom.x, movefrom.y);
        }, 2000);
        
        gaugeStatus.actionRef = {
          type: type,
          timer: timeout,
          spool: movefrom
        } as GaugeActionStatus;
      }
    } else if (ApeShapesComponent.actionsType[type] === GaugeActionsType.stop) {
      ShapesComponent.stopAnimationShape(gaugeStatus, type);
    }
  }

  /**
   * Clear animation timer
   */
  static clearAnimationTimer(actionRef: GaugeActionStatus | undefined): void {
    if (actionRef?.timer) {
      clearInterval(actionRef.timer);
      actionRef.timer = undefined;
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
