/**
 * Chart 数据模型
 * 从 FUXA 复制，定义图表相关类型
 */

export enum ChartViewType {
    realtime1 = 'realtime1',
    realtime2 = 'realtime2',
    history = 'history'
}

export enum ChartRangeType {
    last1h = 'chart.rangetype-last1h',
    last1d = 'chart.rangetype-last1d',
    last3d = 'chart.rangetype-last3d',
    last1w = 'chart.rangetype-last1w'
}

export interface ChartLine {
    id: string;
    name: string;
    color: string;
    yaxis: number;
    lineWidth?: number;
    fill?: boolean;
    fillOpacity?: number;
}

export interface Chart {
    id: string;
    name: string;
    lines: ChartLine[];
    type?: ChartViewType;
    rangeType?: ChartRangeType;
    options?: any;
}

export interface Graph {
    id: string;
    name: string;
    property: any;
    sources: any[];
    type?: string;
    options?: any;
}
