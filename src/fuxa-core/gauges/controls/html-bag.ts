/**
 * HTML Bag Component - Migrated from FUXA
 * Circular gauge display (bag/circular progress indicator)
 * Note: Original uses NgxGaugeComponent, this version uses canvas-based rendering
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export interface BagGaugeOptions {
  min?: number;
  max?: number;
  value?: number;
  type?: 'full' | 'semi' | 'arch';
  thick?: number;
  cap?: 'round' | 'butt';
  foregroundColor?: string;
  backgroundColor?: string;
  label?: string;
  append?: string;
  prepend?: string;
  duration?: number;
  animate?: boolean;
}

export class HtmlBagComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-html_bag';
  static LabelTag = 'HtmlBag';
  static PREFIX = 'D-BAG_';

  // Instance properties for animation
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: BagGaugeOptions = {};
  private currentValue: number = 0;
  private animationFrame: number | null = null;

  /**
   * Get signals from gauge property
   */
  static getSignals(pro: GaugeProperty): string[] {
    const res: string[] = [];
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    return res;
  }

  static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Gauge;
  }

  /**
   * Process value update for bag gauge
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, bagInstance?: HtmlBagComponent): HtmlBagComponent | undefined {
    try {
      if (ga.property && ga.property.variableId === sig.id && bagInstance) {
        let value = parseFloat(sig.value);
        if (!isNaN(value)) {
          bagInstance.setValue(value);
        }
      }
      return bagInstance;
    } catch (err) {
      console.error('HtmlBagComponent.processValue error:', err);
      return bagInstance;
    }
  }

  /**
   * Initialize bag gauge element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HtmlBagComponent | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    const htmlBag = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlBag) return null;

    // Create bag gauge instance
    const bagInstance = new HtmlBagComponent();

    // Get container dimensions
    const rect = htmlBag.getBoundingClientRect();
    const width = rect.width || 200;
    const height = rect.height || 200;

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Clear container and append canvas
    htmlBag.innerHTML = '';
    htmlBag.appendChild(canvas);

    // Initialize instance
    bagInstance.canvas = canvas;
    bagInstance.ctx = canvas.getContext('2d');

    // Set options from property
    bagInstance.options = {
      min: 0,
      max: 100,
      value: 0,
      type: 'arch',
      thick: 10,
      cap: 'round',
      foregroundColor: '#4CAF50',
      backgroundColor: '#e0e0e0',
      label: '',
      append: '',
      prepend: '',
      duration: 1000,
      animate: true
    };

    if (ga.property) {
      if (ga.property.ranges && ga.property.ranges.length > 0) {
        bagInstance.options.min = ga.property.ranges[0].min ?? 0;
        bagInstance.options.max = ga.property.ranges[0].max ?? 100;
        bagInstance.options.foregroundColor = ga.property.ranges[0].color || '#4CAF50';
      }
      if (ga.property.options) {
        Object.assign(bagInstance.options, ga.property.options);
      }
    }

    // Initial render
    bagInstance.render();

    return bagInstance;
  }

  /**
   * Set gauge value with animation
   */
  setValue(value: number): void {
    const targetValue = Math.max(this.options.min || 0, Math.min(this.options.max || 100, value));
    
    if (this.options.animate && this.options.duration && this.options.duration > 0) {
      this.animateToValue(targetValue);
    } else {
      this.currentValue = targetValue;
      this.render();
    }
  }

  /**
   * Animate to target value
   */
  private animateToValue(targetValue: number): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startValue = this.currentValue;
    const startTime = performance.now();
    const duration = this.options.duration || 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.currentValue = startValue + (targetValue - startValue) * easeOut;
      this.render();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Render the gauge
   */
  private render(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - (this.options.thick || 10);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate angles based on type
    let startAngle: number;
    let endAngle: number;
    let arcLength: number;

    switch (this.options.type) {
      case 'full':
        startAngle = 0;
        endAngle = Math.PI * 2;
        arcLength = Math.PI * 2;
        break;
      case 'semi':
        startAngle = Math.PI;
        endAngle = Math.PI * 2;
        arcLength = Math.PI;
        break;
      case 'arch':
      default:
        startAngle = Math.PI * 0.75;
        endAngle = Math.PI * 2.25;
        arcLength = Math.PI * 1.5;
        break;
    }

    // Draw background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = this.options.backgroundColor || '#e0e0e0';
    ctx.lineWidth = this.options.thick || 10;
    ctx.lineCap = this.options.cap || 'round';
    ctx.stroke();

    // Calculate value arc
    const min = this.options.min || 0;
    const max = this.options.max || 100;
    const percentage = (this.currentValue - min) / (max - min);
    const valueAngle = startAngle + arcLength * percentage;

    // Draw value arc
    if (percentage > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
      ctx.strokeStyle = this.options.foregroundColor || '#4CAF50';
      ctx.lineWidth = this.options.thick || 10;
      ctx.lineCap = this.options.cap || 'round';
      ctx.stroke();
    }

    // Draw value text
    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.floor(radius / 2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const displayValue = (this.options.prepend || '') + 
                         Math.round(this.currentValue).toString() + 
                         (this.options.append || '');
    ctx.fillText(displayValue, centerX, centerY);

    // Draw label if specified
    if (this.options.label) {
      ctx.font = `${Math.floor(radius / 4)}px Arial`;
      ctx.fillText(this.options.label, centerX, centerY + radius / 2);
    }
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HtmlBagComponent | null {
    return HtmlBagComponent.initElement(ga, false);
  }

  /**
   * Resize the gauge
   */
  static resize(ga: GaugeSettings): HtmlBagComponent | null {
    return HtmlBagComponent.initElement(ga, true);
  }

  /**
   * Destroy the gauge instance
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
