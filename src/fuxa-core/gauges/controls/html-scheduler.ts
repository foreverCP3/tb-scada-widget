/**
 * HTML Scheduler Component - Migrated from FUXA
 * Time-based scheduler/calendar component
 * Note: Original uses Angular SchedulerComponent,
 * this version provides a vanilla JS implementation
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  recurring?: boolean;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  data?: any;
}

export interface SchedulerOptions {
  view?: 'day' | 'week' | 'month';
  startHour?: number;
  endHour?: number;
  slotDuration?: number; // minutes
  accentColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  headerBackground?: string;
  readonly?: boolean;
}

export class HtmlSchedulerComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-own_ctrl-scheduler';
  static LabelTag = 'HtmlScheduler';
  static PREFIX = 'D-OXC_';

  // Instance properties
  private container: HTMLElement | null = null;
  private options: SchedulerOptions = {};
  private events: ScheduleEvent[] = [];
  private currentDate: Date = new Date();
  private isEditor: boolean = false;

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
    return GaugeDialogType.Scheduler;
  }

  /**
   * Process value update for scheduler
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, schedulerInstance?: HtmlSchedulerComponent): HtmlSchedulerComponent | undefined {
    try {
      // Scheduler typically doesn't process variable values directly
      // Events are loaded from configuration or API
      return schedulerInstance;
    } catch (err) {
      console.error('HtmlSchedulerComponent.processValue error:', err);
      return schedulerInstance;
    }
  }

  /**
   * Initialize scheduler element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HtmlSchedulerComponent | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    // Set default fill color for the scheduler shape
    const rect = ele.querySelector('rect');
    if (rect && !rect.hasAttribute('data-initialized')) {
      if (!rect.getAttribute('fill') || rect.getAttribute('fill') === '#FFFFFF' || rect.getAttribute('fill') === 'rgb(255, 255, 255)') {
        rect.setAttribute('fill', '#f9f9f9ff');
      }
      rect.setAttribute('data-initialized', 'true');
    }

    const htmlScheduler = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlScheduler) return null;

    // Create scheduler instance
    const schedulerInstance = new HtmlSchedulerComponent();
    schedulerInstance.container = htmlScheduler;
    schedulerInstance.isEditor = !isView;

    // Set default options
    schedulerInstance.options = {
      view: 'week',
      startHour: 0,
      endHour: 24,
      slotDuration: 60,
      accentColor: '#556e82',
      backgroundColor: '#f0f0f0',
      borderColor: '#cccccc',
      textColor: '#505050',
      secondaryTextColor: '#ffffff',
      headerBackground: '#e0e0e0',
      readonly: isView
    };

    // Apply property options
    if (ga.property) {
      if (ga.property.accentColor) schedulerInstance.options.accentColor = ga.property.accentColor;
      if (ga.property.backgroundColor) schedulerInstance.options.backgroundColor = ga.property.backgroundColor;
      if (ga.property.borderColor) schedulerInstance.options.borderColor = ga.property.borderColor;
      if (ga.property.textColor) schedulerInstance.options.textColor = ga.property.textColor;
      if (ga.property.secondaryTextColor) schedulerInstance.options.secondaryTextColor = ga.property.secondaryTextColor;

      if (ga.property.options) {
        Object.assign(schedulerInstance.options, ga.property.options);
      }

      // Load events from property
      if (ga.property.events) {
        schedulerInstance.events = ga.property.events.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end)
        }));
      }
    }

    // Create scheduler UI
    schedulerInstance.createScheduler();

    return schedulerInstance;
  }

  /**
   * Create scheduler UI
   */
  private createScheduler(): void {
    if (!this.container) return;

    // Clear container
    this.container.innerHTML = '';

    // Create main wrapper
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.backgroundColor = this.options.backgroundColor || '#f0f0f0';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.fontSize = '12px';
    wrapper.style.overflow = 'hidden';

    // Create header with navigation
    const header = this.createHeader();
    wrapper.appendChild(header);

    // Create calendar grid
    const grid = this.createGrid();
    wrapper.appendChild(grid);

    this.container.appendChild(wrapper);
  }

  /**
   * Create header with navigation
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '8px 12px';
    header.style.backgroundColor = this.options.headerBackground || '#e0e0e0';
    header.style.borderBottom = `1px solid ${this.options.borderColor || '#cccccc'}`;

    // Navigation buttons
    const navLeft = document.createElement('div');
    navLeft.style.display = 'flex';
    navLeft.style.gap = '8px';

    const prevBtn = this.createButton('<', () => this.navigate(-1));
    const nextBtn = this.createButton('>', () => this.navigate(1));
    const todayBtn = this.createButton('Today', () => this.goToToday());

    navLeft.appendChild(prevBtn);
    navLeft.appendChild(nextBtn);
    navLeft.appendChild(todayBtn);

    // Current date display
    const dateDisplay = document.createElement('span');
    dateDisplay.className = 'scheduler-date-display';
    dateDisplay.style.fontWeight = 'bold';
    dateDisplay.style.color = this.options.textColor || '#505050';
    dateDisplay.textContent = this.formatDateRange();

    // View selector
    const viewSelector = document.createElement('div');
    viewSelector.style.display = 'flex';
    viewSelector.style.gap = '4px';

    ['day', 'week', 'month'].forEach(view => {
      const btn = this.createButton(view.charAt(0).toUpperCase() + view.slice(1), () => this.setView(view as any));
      if (this.options.view === view) {
        btn.style.backgroundColor = this.options.accentColor || '#556e82';
        btn.style.color = this.options.secondaryTextColor || '#ffffff';
      }
      viewSelector.appendChild(btn);
    });

    header.appendChild(navLeft);
    header.appendChild(dateDisplay);
    header.appendChild(viewSelector);

    return header;
  }

  /**
   * Create a button element
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.padding = '4px 8px';
    btn.style.border = `1px solid ${this.options.borderColor || '#cccccc'}`;
    btn.style.borderRadius = '4px';
    btn.style.backgroundColor = '#ffffff';
    btn.style.color = this.options.textColor || '#505050';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '11px';
    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = this.options.accentColor || '#556e82';
      btn.style.color = this.options.secondaryTextColor || '#ffffff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = '#ffffff';
      btn.style.color = this.options.textColor || '#505050';
    });
    return btn;
  }

  /**
   * Create calendar grid
   */
  private createGrid(): HTMLElement {
    const gridWrapper = document.createElement('div');
    gridWrapper.style.flex = '1';
    gridWrapper.style.overflow = 'auto';

    switch (this.options.view) {
      case 'day':
        gridWrapper.appendChild(this.createDayView());
        break;
      case 'month':
        gridWrapper.appendChild(this.createMonthView());
        break;
      case 'week':
      default:
        gridWrapper.appendChild(this.createWeekView());
        break;
    }

    return gridWrapper;
  }

  /**
   * Create week view
   */
  private createWeekView(): HTMLElement {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '50px repeat(7, 1fr)';
    grid.style.height = '100%';
    grid.style.minHeight = '400px';

    // Get week start
    const weekStart = this.getWeekStart(this.currentDate);

    // Header row with day names
    grid.appendChild(this.createCell('', true));
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = day.getDate();
      const isToday = this.isSameDay(day, new Date());
      grid.appendChild(this.createCell(`${dayName} ${dayNum}`, true, isToday));
    }

    // Time slots
    const startHour = this.options.startHour || 0;
    const endHour = this.options.endHour || 24;

    for (let hour = startHour; hour < endHour; hour++) {
      // Time label
      grid.appendChild(this.createCell(`${hour.toString().padStart(2, '0')}:00`, false, false, true));

      // Day cells
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(weekStart);
        cellDate.setDate(cellDate.getDate() + day);
        cellDate.setHours(hour, 0, 0, 0);

        const cell = this.createCell('', false);
        cell.style.minHeight = '40px';
        cell.style.position = 'relative';

        // Add events for this cell
        const cellEvents = this.getEventsForTimeSlot(cellDate, hour);
        cellEvents.forEach(event => {
          const eventEl = this.createEventElement(event);
          cell.appendChild(eventEl);
        });

        grid.appendChild(cell);
      }
    }

    return grid;
  }

  /**
   * Create day view
   */
  private createDayView(): HTMLElement {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '50px 1fr';
    grid.style.height = '100%';
    grid.style.minHeight = '400px';

    const startHour = this.options.startHour || 0;
    const endHour = this.options.endHour || 24;

    for (let hour = startHour; hour < endHour; hour++) {
      grid.appendChild(this.createCell(`${hour.toString().padStart(2, '0')}:00`, false, false, true));

      const cellDate = new Date(this.currentDate);
      cellDate.setHours(hour, 0, 0, 0);

      const cell = this.createCell('', false);
      cell.style.minHeight = '40px';
      cell.style.position = 'relative';

      const cellEvents = this.getEventsForTimeSlot(cellDate, hour);
      cellEvents.forEach(event => {
        const eventEl = this.createEventElement(event);
        cell.appendChild(eventEl);
      });

      grid.appendChild(cell);
    }

    return grid;
  }

  /**
   * Create month view
   */
  private createMonthView(): HTMLElement {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.height = '100%';

    // Day name headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(name => {
      grid.appendChild(this.createCell(name, true));
    });

    // Get month start
    const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const startDay = monthStart.getDay();
    const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();

    // Previous month padding
    for (let i = 0; i < startDay; i++) {
      grid.appendChild(this.createCell('', false));
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
      const isToday = this.isSameDay(date, new Date());

      const cell = this.createCell(day.toString(), false, isToday);
      cell.style.minHeight = '60px';
      cell.style.position = 'relative';
      cell.style.verticalAlign = 'top';

      // Add events for this day
      const dayEvents = this.getEventsForDay(date);
      dayEvents.slice(0, 3).forEach(event => {
        const eventEl = this.createEventElement(event, true);
        cell.appendChild(eventEl);
      });

      if (dayEvents.length > 3) {
        const more = document.createElement('div');
        more.textContent = `+${dayEvents.length - 3} more`;
        more.style.fontSize = '10px';
        more.style.color = this.options.accentColor || '#556e82';
        more.style.marginTop = '2px';
        cell.appendChild(more);
      }

      grid.appendChild(cell);
    }

    return grid;
  }

  /**
   * Create a cell element
   */
  private createCell(content: string, isHeader: boolean, isHighlighted: boolean = false, isTime: boolean = false): HTMLElement {
    const cell = document.createElement('div');
    cell.style.padding = '4px';
    cell.style.border = `1px solid ${this.options.borderColor || '#cccccc'}`;
    cell.style.color = this.options.textColor || '#505050';

    if (isHeader) {
      cell.style.backgroundColor = this.options.headerBackground || '#e0e0e0';
      cell.style.fontWeight = 'bold';
      cell.style.textAlign = 'center';
    }

    if (isHighlighted) {
      cell.style.backgroundColor = this.options.accentColor || '#556e82';
      cell.style.color = this.options.secondaryTextColor || '#ffffff';
    }

    if (isTime) {
      cell.style.fontSize = '10px';
      cell.style.textAlign = 'right';
      cell.style.color = '#888';
    }

    cell.textContent = content;
    return cell;
  }

  /**
   * Create event element
   */
  private createEventElement(event: ScheduleEvent, compact: boolean = false): HTMLElement {
    const el = document.createElement('div');
    el.style.backgroundColor = event.color || this.options.accentColor || '#556e82';
    el.style.color = this.options.secondaryTextColor || '#ffffff';
    el.style.padding = compact ? '1px 4px' : '2px 4px';
    el.style.borderRadius = '2px';
    el.style.fontSize = compact ? '9px' : '10px';
    el.style.marginTop = '2px';
    el.style.overflow = 'hidden';
    el.style.textOverflow = 'ellipsis';
    el.style.whiteSpace = 'nowrap';
    el.textContent = event.title;
    el.title = `${event.title}\n${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`;
    return el;
  }

  /**
   * Get events for a specific time slot
   */
  private getEventsForTimeSlot(date: Date, hour: number): ScheduleEvent[] {
    return this.events.filter(event => {
      const eventStart = event.start;
      return this.isSameDay(eventStart, date) && eventStart.getHours() === hour;
    });
  }

  /**
   * Get events for a specific day
   */
  private getEventsForDay(date: Date): ScheduleEvent[] {
    return this.events.filter(event => this.isSameDay(event.start, date));
  }

  /**
   * Get week start date
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Format current date range for display
   */
  private formatDateRange(): string {
    switch (this.options.view) {
      case 'day':
        return this.currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'month':
        return this.currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'week':
      default:
        const weekStart = this.getWeekStart(this.currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  }

  /**
   * Navigate forward or backward
   */
  navigate(direction: number): void {
    switch (this.options.view) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        break;
      case 'week':
      default:
        this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        break;
    }
    this.createScheduler();
  }

  /**
   * Go to today
   */
  goToToday(): void {
    this.currentDate = new Date();
    this.createScheduler();
  }

  /**
   * Set view type
   */
  setView(view: 'day' | 'week' | 'month'): void {
    this.options.view = view;
    this.createScheduler();
  }

  /**
   * Add an event
   */
  addEvent(event: ScheduleEvent): void {
    this.events.push(event);
    this.createScheduler();
  }

  /**
   * Remove an event
   */
  removeEvent(eventId: string): void {
    this.events = this.events.filter(e => e.id !== eventId);
    this.createScheduler();
  }

  /**
   * Set events
   */
  setEvents(events: ScheduleEvent[]): void {
    this.events = events;
    this.createScheduler();
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HtmlSchedulerComponent | null {
    return HtmlSchedulerComponent.initElement(ga, false);
  }

  /**
   * Destroy the scheduler instance
   */
  destroy(): void {
    this.container = null;
    this.events = [];
  }
}
