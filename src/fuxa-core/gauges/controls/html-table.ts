/**
 * HTML Table Component - Migrated from FUXA
 * Displays data in tabular format with support for different table types
 * Note: Original uses DataTableComponent (Angular), this version creates vanilla HTML tables
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export type HtmlTableType = 'data' | 'alarms' | 'reports';

export interface HtmlTableColumn {
  id: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface HtmlTableRow {
  [key: string]: any;
}

export interface HtmlTableOptions {
  type?: HtmlTableType;
  columns?: HtmlTableColumn[];
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  showHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  headerBackground?: string;
  headerTextColor?: string;
  rowBackground?: string;
  rowTextColor?: string;
  alternateRowBackground?: string;
}

export class HtmlTableComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-own_ctrl-table';
  static LabelTag = 'HtmlTable';
  static PREFIX = 'D-OXC_';

  // Instance properties
  private container: HTMLElement | null = null;
  private tableElement: HTMLTableElement | null = null;
  private options: HtmlTableOptions = {};
  private tableData: HtmlTableRow[] = [];
  private columns: HtmlTableColumn[] = [];

  /**
   * Get signals from gauge property
   */
  static getSignals(pro: GaugeProperty): string[] {
    const res: string[] = [];
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    // Check for row/column variable bindings
    if (pro.options?.rows) {
      pro.options.rows.forEach((row: any) => {
        if (row.variableId) {
          res.push(row.variableId);
        }
      });
    }
    if (pro.options?.columns) {
      pro.options.columns.forEach((col: any) => {
        if (col.variableId) {
          res.push(col.variableId);
        }
      });
    }
    return res;
  }

  static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Table;
  }

  /**
   * Process value update for table
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, tableInstance?: HtmlTableComponent): HtmlTableComponent | undefined {
    try {
      if (ga.property && tableInstance) {
        // Add value to table data
        tableInstance.addValue(sig.id, sig.value, sig.timestamp);
      }
      return tableInstance;
    } catch (err) {
      console.error('HtmlTableComponent.processValue error:', err);
      return tableInstance;
    }
  }

  /**
   * Initialize table element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HtmlTableComponent | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    const htmlTable = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlTable) return null;

    // Create table instance
    const tableInstance = new HtmlTableComponent();
    tableInstance.container = htmlTable;

    // Set default options
    tableInstance.options = {
      type: 'data',
      pageSize: 100,
      sortable: true,
      filterable: false,
      showHeader: true,
      striped: true,
      bordered: true,
      hoverable: true,
      headerBackground: '#f5f5f5',
      headerTextColor: '#333',
      rowBackground: '#fff',
      rowTextColor: '#333',
      alternateRowBackground: '#f9f9f9'
    };

    // Apply property options
    if (ga.property?.options) {
      Object.assign(tableInstance.options, ga.property.options);
    }

    // Setup columns
    if (ga.property?.options?.columns) {
      tableInstance.columns = ga.property.options.columns;
    } else {
      // Default columns based on table type
      tableInstance.columns = tableInstance.getDefaultColumns(tableInstance.options.type || 'data');
    }

    // Create table structure
    tableInstance.createTable();

    return tableInstance;
  }

  /**
   * Get default columns based on table type
   */
  private getDefaultColumns(type: HtmlTableType): HtmlTableColumn[] {
    switch (type) {
      case 'alarms':
        return [
          { id: 'timestamp', label: 'Time', width: '180px' },
          { id: 'name', label: 'Name', width: '200px' },
          { id: 'severity', label: 'Severity', width: '100px' },
          { id: 'status', label: 'Status', width: '100px' },
          { id: 'message', label: 'Message' }
        ];
      case 'reports':
        return [
          { id: 'timestamp', label: 'Time', width: '180px' },
          { id: 'name', label: 'Report', width: '200px' },
          { id: 'value', label: 'Value' }
        ];
      case 'data':
      default:
        return [
          { id: 'timestamp', label: 'Time', width: '180px' },
          { id: 'name', label: 'Name', width: '200px' },
          { id: 'value', label: 'Value' }
        ];
    }
  }

  /**
   * Create table HTML structure
   */
  private createTable(): void {
    if (!this.container) return;

    // Clear container
    this.container.innerHTML = '';

    // Create wrapper for scroll
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.overflow = 'auto';

    // Create table element
    this.tableElement = document.createElement('table');
    this.tableElement.style.width = '100%';
    this.tableElement.style.borderCollapse = 'collapse';
    this.tableElement.style.fontSize = '14px';

    if (this.options.bordered) {
      this.tableElement.style.border = '1px solid #ddd';
    }

    // Create header
    if (this.options.showHeader) {
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = this.options.headerBackground || '#f5f5f5';
      headerRow.style.color = this.options.headerTextColor || '#333';

      this.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        th.style.padding = '10px 8px';
        th.style.textAlign = col.align || 'left';
        th.style.fontWeight = '600';
        if (col.width) {
          th.style.width = col.width;
        }
        if (this.options.bordered) {
          th.style.borderBottom = '2px solid #ddd';
        }
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      this.tableElement.appendChild(thead);
    }

    // Create body
    const tbody = document.createElement('tbody');
    this.tableElement.appendChild(tbody);

    wrapper.appendChild(this.tableElement);
    this.container.appendChild(wrapper);
  }

  /**
   * Add value to table
   */
  addValue(id: string, value: any, timestamp?: number): void {
    const row: HtmlTableRow = {
      id: id,
      name: id,
      value: value,
      timestamp: timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()
    };

    // Add to data array (at beginning for newest first)
    this.tableData.unshift(row);

    // Limit data size
    if (this.tableData.length > (this.options.pageSize || 100)) {
      this.tableData.pop();
    }

    // Update table display
    this.renderRows();
  }

  /**
   * Render table rows
   */
  private renderRows(): void {
    if (!this.tableElement) return;

    const tbody = this.tableElement.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Add data rows
    this.tableData.forEach((rowData, index) => {
      const tr = document.createElement('tr');
      
      // Apply styling
      if (this.options.striped && index % 2 === 1) {
        tr.style.backgroundColor = this.options.alternateRowBackground || '#f9f9f9';
      } else {
        tr.style.backgroundColor = this.options.rowBackground || '#fff';
      }
      tr.style.color = this.options.rowTextColor || '#333';

      if (this.options.hoverable) {
        tr.style.cursor = 'pointer';
        tr.addEventListener('mouseenter', () => {
          tr.style.backgroundColor = '#e3f2fd';
        });
        tr.addEventListener('mouseleave', () => {
          if (this.options.striped && index % 2 === 1) {
            tr.style.backgroundColor = this.options.alternateRowBackground || '#f9f9f9';
          } else {
            tr.style.backgroundColor = this.options.rowBackground || '#fff';
          }
        });
      }

      // Add cells
      this.columns.forEach(col => {
        const td = document.createElement('td');
        let cellValue = rowData[col.id];
        
        if (col.formatter) {
          cellValue = col.formatter(cellValue);
        }
        
        td.textContent = cellValue !== undefined ? String(cellValue) : '';
        td.style.padding = '8px';
        td.style.textAlign = col.align || 'left';
        
        if (this.options.bordered) {
          td.style.borderBottom = '1px solid #ddd';
        }
        
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.tableData = [];
    this.renderRows();
  }

  /**
   * Set data directly
   */
  setData(data: HtmlTableRow[]): void {
    this.tableData = data.slice(0, this.options.pageSize || 100);
    this.renderRows();
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HtmlTableComponent | null {
    return HtmlTableComponent.initElement(ga, false);
  }

  /**
   * Resize the table
   */
  static resize(ga: GaugeSettings): void {
    // Table auto-resizes with CSS
  }

  /**
   * Destroy the table instance
   */
  destroy(): void {
    this.container = null;
    this.tableElement = null;
    this.tableData = [];
  }
}
