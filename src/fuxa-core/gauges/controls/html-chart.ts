/**
 * HTML Chart Component - Migrated from FUXA
 * Time-series chart display using canvas
 * Note: Original uses ChartUplotComponent (uPlot library), 
 * this version provides a canvas-based implementation with similar API
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  data: [number, number][]; // [timestamp, value][]
  visible?: boolean;
  lineWidth?: number;
  fill?: boolean;
  fillOpacity?: number;
}

export interface ChartOptions {
  title?: string;
  backgroundColor?: string;
  gridColor?: string;
  textColor?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yMin?: number;
  yMax?: number;
  autoScale?: boolean;
  maxPoints?: number;
  realtime?: boolean;
  timeRange?: number; // milliseconds
  series?: ChartSeries[];
}

export class HtmlChartComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-own_ctrl-chart';
  static LabelTag = 'HtmlChart';
  static PREFIX = 'D-HXC_';

  // Instance properties
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: ChartOptions = {};
  private seriesMap: Map<string, ChartSeries> = new Map();
  private animationFrame: number | null = null;

  /**
   * Get signals from gauge property
   */
  static getSignals(pro: GaugeProperty): string[] {
    const res: string[] = [];
    if (pro.variableIds && Array.isArray(pro.variableIds)) {
      return pro.variableIds;
    }
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    return res;
  }

  static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Chart;
  }

  /**
   * Process value update for chart
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, chartInstance?: HtmlChartComponent): HtmlChartComponent | undefined {
    try {
      if (ga.property && chartInstance) {
        const timestamp = sig.timestamp || Date.now();
        const value = parseFloat(sig.value);
        if (!isNaN(value)) {
          chartInstance.addValue(sig.id, timestamp, value);
        }
      }
      return chartInstance;
    } catch (err) {
      console.error('HtmlChartComponent.processValue error:', err);
      return chartInstance;
    }
  }

  /**
   * Initialize chart element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HtmlChartComponent | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    const htmlChart = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlChart) return null;

    // Create chart instance
    const chartInstance = new HtmlChartComponent();
    chartInstance.container = htmlChart;

    // Set default options
    chartInstance.options = {
      backgroundColor: '#ffffff',
      gridColor: '#e0e0e0',
      textColor: '#333333',
      showLegend: true,
      showGrid: true,
      showXAxis: true,
      showYAxis: true,
      autoScale: true,
      maxPoints: 500,
      realtime: true,
      timeRange: 60000 // 1 minute default
    };

    // Apply property options
    if (ga.property?.options) {
      Object.assign(chartInstance.options, ga.property.options);
    }

    // Initialize series from property
    if (ga.property?.variableIds) {
      const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
      ga.property.variableIds.forEach((varId: string, index: number) => {
        chartInstance.seriesMap.set(varId, {
          id: varId,
          label: varId,
          color: colors[index % colors.length],
          data: [],
          visible: true,
          lineWidth: 2,
          fill: false
        });
      });
    }

    // Create canvas
    chartInstance.createCanvas();

    // Start render loop for realtime mode
    if (chartInstance.options.realtime) {
      chartInstance.startRenderLoop();
    }

    return chartInstance;
  }

  /**
   * Create canvas element
   */
  private createCanvas(): void {
    if (!this.container) return;

    // Clear container
    this.container.innerHTML = '';

    // Get container dimensions
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 300;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.position = 'relative';
    wrapper.style.backgroundColor = this.options.backgroundColor || '#ffffff';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    wrapper.appendChild(this.canvas);
    this.container.appendChild(wrapper);

    // Initial render
    this.render();
  }

  /**
   * Add data point to series
   */
  addValue(seriesId: string, timestamp: number, value: number): void {
    let series = this.seriesMap.get(seriesId);
    
    if (!series) {
      // Auto-create series if not exists
      const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
      series = {
        id: seriesId,
        label: seriesId,
        color: colors[this.seriesMap.size % colors.length],
        data: [],
        visible: true,
        lineWidth: 2
      };
      this.seriesMap.set(seriesId, series);
    }

    series.data.push([timestamp, value]);

    // Limit data points
    const maxPoints = this.options.maxPoints || 500;
    if (series.data.length > maxPoints) {
      series.data.shift();
    }

    // Remove old data outside time range
    if (this.options.timeRange) {
      const cutoff = Date.now() - this.options.timeRange;
      series.data = series.data.filter(point => point[0] >= cutoff);
    }

    // Render if not in realtime mode
    if (!this.options.realtime) {
      this.render();
    }
  }

  /**
   * Start render loop
   */
  private startRenderLoop(): void {
    const loop = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  /**
   * Render the chart
   */
  private render(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    // Padding for axes
    const padding = {
      top: 20,
      right: 20,
      bottom: this.options.showXAxis ? 40 : 20,
      left: this.options.showYAxis ? 60 : 20
    };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = this.options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate data bounds
    const { xMin, xMax, yMin, yMax } = this.calculateBounds();

    if (xMin === xMax || yMin === yMax) {
      // No data to display
      ctx.fillStyle = this.options.textColor || '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data', width / 2, height / 2);
      return;
    }

    // Draw grid
    if (this.options.showGrid) {
      this.drawGrid(ctx, padding, plotWidth, plotHeight, xMin, xMax, yMin, yMax);
    }

    // Draw axes
    if (this.options.showXAxis) {
      this.drawXAxis(ctx, padding, plotWidth, plotHeight, xMin, xMax);
    }
    if (this.options.showYAxis) {
      this.drawYAxis(ctx, padding, plotWidth, plotHeight, yMin, yMax);
    }

    // Draw series
    this.seriesMap.forEach(series => {
      if (series.visible && series.data.length > 1) {
        this.drawSeries(ctx, series, padding, plotWidth, plotHeight, xMin, xMax, yMin, yMax);
      }
    });

    // Draw legend
    if (this.options.showLegend && this.seriesMap.size > 0) {
      this.drawLegend(ctx, padding);
    }
  }

  /**
   * Calculate data bounds
   */
  private calculateBounds(): { xMin: number; xMax: number; yMin: number; yMax: number } {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = this.options.autoScale ? Infinity : (this.options.yMin || 0);
    let yMax = this.options.autoScale ? -Infinity : (this.options.yMax || 100);

    this.seriesMap.forEach(series => {
      series.data.forEach(([x, y]) => {
        xMin = Math.min(xMin, x);
        xMax = Math.max(xMax, x);
        if (this.options.autoScale) {
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      });
    });

    // Use time range if specified
    if (this.options.timeRange && this.options.realtime) {
      xMax = Date.now();
      xMin = xMax - this.options.timeRange;
    }

    // Add padding to y range
    if (this.options.autoScale && yMin !== Infinity) {
      const yPadding = (yMax - yMin) * 0.1;
      yMin -= yPadding;
      yMax += yPadding;
    }

    return { xMin, xMax, yMin, yMax };
  }

  /**
   * Draw grid lines
   */
  private drawGrid(ctx: CanvasRenderingContext2D, padding: any, plotWidth: number, plotHeight: number, xMin: number, xMax: number, yMin: number, yMax: number): void {
    ctx.strokeStyle = this.options.gridColor || '#e0e0e0';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (plotHeight * i / ySteps);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (plotWidth * i / xSteps);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + plotHeight);
      ctx.stroke();
    }
  }

  /**
   * Draw X axis
   */
  private drawXAxis(ctx: CanvasRenderingContext2D, padding: any, plotWidth: number, plotHeight: number, xMin: number, xMax: number): void {
    ctx.fillStyle = this.options.textColor || '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (plotWidth * i / xSteps);
      const timestamp = xMin + (xMax - xMin) * i / xSteps;
      const date = new Date(timestamp);
      const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      ctx.fillText(label, x, padding.top + plotHeight + 20);
    }
  }

  /**
   * Draw Y axis
   */
  private drawYAxis(ctx: CanvasRenderingContext2D, padding: any, plotWidth: number, plotHeight: number, yMin: number, yMax: number): void {
    ctx.fillStyle = this.options.textColor || '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (plotHeight * i / ySteps);
      const value = yMax - (yMax - yMin) * i / ySteps;
      ctx.fillText(value.toFixed(1), padding.left - 8, y + 4);
    }
  }

  /**
   * Draw series line
   */
  private drawSeries(ctx: CanvasRenderingContext2D, series: ChartSeries, padding: any, plotWidth: number, plotHeight: number, xMin: number, xMax: number, yMin: number, yMax: number): void {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    ctx.strokeStyle = series.color;
    ctx.lineWidth = series.lineWidth || 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    let started = false;

    series.data.forEach(([timestamp, value]) => {
      const x = padding.left + ((timestamp - xMin) / xRange) * plotWidth;
      const y = padding.top + plotHeight - ((value - yMin) / yRange) * plotHeight;

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under line if enabled
    if (series.fill && series.data.length > 1) {
      const firstPoint = series.data[0];
      const lastPoint = series.data[series.data.length - 1];
      const xFirst = padding.left + ((firstPoint[0] - xMin) / xRange) * plotWidth;
      const xLast = padding.left + ((lastPoint[0] - xMin) / xRange) * plotWidth;
      const yBottom = padding.top + plotHeight;

      ctx.lineTo(xLast, yBottom);
      ctx.lineTo(xFirst, yBottom);
      ctx.closePath();

      ctx.fillStyle = series.color + Math.round((series.fillOpacity || 0.2) * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  /**
   * Draw legend
   */
  private drawLegend(ctx: CanvasRenderingContext2D, padding: any): void {
    ctx.font = '12px Arial';
    let x = padding.left + 10;
    let y = padding.top + 15;

    this.seriesMap.forEach(series => {
      // Draw color indicator
      ctx.fillStyle = series.color;
      ctx.fillRect(x, y - 8, 12, 12);

      // Draw label
      ctx.fillStyle = this.options.textColor || '#333';
      ctx.textAlign = 'left';
      ctx.fillText(series.label, x + 16, y + 2);

      x += ctx.measureText(series.label).width + 40;
    });
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.seriesMap.forEach(series => {
      series.data = [];
    });
    this.render();
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HtmlChartComponent | null {
    return HtmlChartComponent.initElement(ga, false);
  }

  /**
   * Resize the chart
   */
  static resize(ga: GaugeSettings): HtmlChartComponent | null {
    return HtmlChartComponent.initElement(ga, true);
  }

  /**
   * Destroy the chart instance
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.seriesMap.clear();
  }
}
