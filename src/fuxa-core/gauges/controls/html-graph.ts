/**
 * HTML Graph Component - Migrated from FUXA
 * Displays pie or bar charts
 * Note: Original uses Angular GraphBarComponent/GraphPieComponent,
 * this version provides canvas-based implementations
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export type GraphType = 'pie' | 'bar';

export interface GraphDataItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface GraphOptions {
  type?: GraphType;
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  animate?: boolean;
  duration?: number;
  // Bar chart specific
  barWidth?: number;
  barGap?: number;
  horizontal?: boolean;
  // Pie chart specific
  donut?: boolean;
  donutWidth?: number;
  startAngle?: number;
}

export class HtmlGraphComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-own_ctrl-graph';
  static LabelTag = 'HtmlGraph';
  static PREFIX = 'D-HXC_';

  // Instance properties
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: GraphOptions = {};
  private graphData: GraphDataItem[] = [];
  private animationFrame: number | null = null;
  private animationProgress: number = 1;

  // Default colors
  private static defaultColors = [
    '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
    '#00BCD4', '#FF5722', '#795548', '#607D8B', '#3F51B5'
  ];

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
    return GaugeDialogType.Graph;
  }

  /**
   * Process value update for graph
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, graphInstance?: HtmlGraphComponent): HtmlGraphComponent | undefined {
    try {
      if (ga.property && graphInstance) {
        const value = parseFloat(sig.value);
        if (!isNaN(value)) {
          graphInstance.updateValue(sig.id, value);
        }
      }
      return graphInstance;
    } catch (err) {
      console.error('HtmlGraphComponent.processValue error:', err);
      return graphInstance;
    }
  }

  /**
   * Initialize graph element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HtmlGraphComponent | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    const htmlGraph = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlGraph) return null;

    // Determine graph type from TypeTag suffix
    let graphType: GraphType = 'bar';
    if (ga.type?.includes('-pie')) {
      graphType = 'pie';
    } else if (ga.type?.includes('-bar')) {
      graphType = 'bar';
    }

    // Create graph instance
    const graphInstance = new HtmlGraphComponent();
    graphInstance.container = htmlGraph;

    // Set default options
    graphInstance.options = {
      type: graphType,
      backgroundColor: '#ffffff',
      textColor: '#333333',
      showLegend: true,
      showLabels: true,
      showValues: true,
      animate: true,
      duration: 500,
      barWidth: 40,
      barGap: 10,
      horizontal: false,
      donut: false,
      donutWidth: 50,
      startAngle: -90
    };

    // Apply property options
    if (ga.property?.options) {
      Object.assign(graphInstance.options, ga.property.options);
    }

    // Initialize data from property
    if (ga.property?.variableIds) {
      ga.property.variableIds.forEach((varId: string, index: number) => {
        graphInstance.data.push({
          id: varId,
          label: varId,
          value: 0,
          color: this.defaultColors[index % this.defaultColors.length]
        });
      });
    }

    // Create canvas
    graphInstance.createCanvas();

    return graphInstance;
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

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.backgroundColor = this.options.backgroundColor || '#ffffff';

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    this.container.appendChild(this.canvas);

    // Initial render
    this.render();
  }

  /**
   * Update value for a data item
   */
  updateValue(id: string, value: number): void {
    const item = this.graphData.find(d => d.id === id);
    if (item) {
      item.value = value;
    } else {
      // Add new item if not exists
      this.graphData.push({
        id: id,
        label: id,
        value: value,
        color: HtmlGraphComponent.defaultColors[this.graphData.length % HtmlGraphComponent.defaultColors.length]
      });
    }

    if (this.options.animate) {
      this.animateRender();
    } else {
      this.render();
    }
  }

  /**
   * Animate render
   */
  private animateRender(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = performance.now();
    const duration = this.options.duration || 500;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);

      this.render();

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationProgress = 0;
    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Render the graph
   */
  private render(): void {
    if (!this.canvas || !this.ctx) return;

    if (this.options.type === 'pie') {
      this.renderPieChart();
    } else {
      this.renderBarChart();
    }
  }

  /**
   * Render pie chart
   */
  private renderPieChart(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    // Clear canvas
    ctx.fillStyle = this.options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate total
    const total = this.graphData.reduce((sum, item) => sum + Math.abs(item.value), 0);
    if (total === 0) {
      ctx.fillStyle = this.options.textColor || '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data', width / 2, height / 2);
      return;
    }

    // Calculate center and radius
    const legendHeight = this.options.showLegend ? 60 : 0;
    const centerX = width / 2;
    const centerY = (height - legendHeight) / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Draw pie slices
    let startAngle = ((this.options.startAngle || -90) * Math.PI) / 180;

    this.graphData.forEach(item => {
      const sliceAngle = (item.value / total) * Math.PI * 2 * this.animationProgress;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw donut hole if enabled
      if (this.options.donut) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - (this.options.donutWidth || 50), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      // Draw label
      if (this.options.showLabels && sliceAngle > 0.1) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.options.showValues) {
          const percentage = ((item.value / total) * 100).toFixed(1);
          ctx.fillText(`${percentage}%`, labelX, labelY);
        }
      }

      startAngle += sliceAngle;
    });

    // Draw legend
    if (this.options.showLegend) {
      this.drawLegend(ctx, 10, height - legendHeight + 10, width - 20);
    }
  }

  /**
   * Render bar chart
   */
  private renderBarChart(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    // Clear canvas
    ctx.fillStyle = this.options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (this.graphData.length === 0) {
      ctx.fillStyle = this.options.textColor || '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data', width / 2, height / 2);
      return;
    }

    // Padding
    const padding = {
      top: 20,
      right: 20,
      bottom: this.options.showLegend ? 80 : 40,
      left: 50
    };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Calculate max value
    const maxValue = Math.max(...this.graphData.map(d => Math.abs(d.value)), 1);

    // Bar dimensions
    const barWidth = this.options.barWidth || Math.min(40, (plotWidth / this.graphData.length) - (this.options.barGap || 10));
    const barGap = this.options.barGap || 10;
    const totalBarWidth = this.graphData.length * barWidth + (this.graphData.length - 1) * barGap;
    const startX = padding.left + (plotWidth - totalBarWidth) / 2;

    // Draw Y axis
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.stroke();

    // Draw Y axis labels
    ctx.fillStyle = this.options.textColor || '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = maxValue * (1 - i / ySteps);
      const y = padding.top + (plotHeight * i / ySteps);
      ctx.fillText(value.toFixed(0), padding.left - 8, y + 4);

      // Grid line
      ctx.strokeStyle = '#eee';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw bars
    this.graphData.forEach((item, index) => {
      const barHeight = (Math.abs(item.value) / maxValue) * plotHeight * this.animationProgress;
      const x = startX + index * (barWidth + barGap);
      const y = padding.top + plotHeight - barHeight;

      // Draw bar
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top
      if (this.options.showValues && barHeight > 15) {
        ctx.fillStyle = this.options.textColor || '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.value.toFixed(1), x + barWidth / 2, y - 5);
      }

      // Draw label below
      if (this.options.showLabels) {
        ctx.fillStyle = this.options.textColor || '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth / 2, padding.top + plotHeight + 15);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(item.label.substring(0, 10), 0, 0);
        ctx.restore();
      }
    });

    // Draw legend
    if (this.options.showLegend) {
      this.drawLegend(ctx, padding.left, height - 25, plotWidth);
    }
  }

  /**
   * Draw legend
   */
  private drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, maxWidth: number): void {
    ctx.font = '11px Arial';
    let currentX = x;

    this.graphData.forEach(item => {
      const labelWidth = ctx.measureText(item.label).width;
      const itemWidth = 20 + labelWidth + 20;

      if (currentX + itemWidth > x + maxWidth) {
        currentX = x;
        y += 20;
      }

      // Color box
      ctx.fillStyle = item.color;
      ctx.fillRect(currentX, y - 8, 12, 12);

      // Label
      ctx.fillStyle = this.options.textColor || '#333';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, currentX + 16, y + 2);

      currentX += itemWidth;
    });
  }

  /**
   * Set data directly
   */
  setData(data: GraphDataItem[]): void {
    this.graphData = data.map((item, index) => ({
      ...item,
      color: item.color || HtmlGraphComponent.defaultColors[index % HtmlGraphComponent.defaultColors.length]
    }));
    this.animateRender();
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.graphData.forEach(item => item.value = 0);
    this.render();
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HtmlGraphComponent | null {
    return HtmlGraphComponent.initElement(ga, false);
  }

  /**
   * Resize the graph
   */
  static resize(ga: GaugeSettings): HtmlGraphComponent | null {
    return HtmlGraphComponent.initElement(ga, true);
  }

  /**
   * Destroy the graph instance
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.graphData = [];
  }
}
