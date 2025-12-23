/**
 * V2: Maps 数据模型
 * 从 FUXA 复制
 */

import { GaugeAction } from './hmi';

export class MapsLocation {
    id: string;
    name: string = '';
    latitude: number = 0;
    longitude: number = 0;
    description?: string;
    viewId?: string;
    pageId?: string;
    url?: string;
    showMarkerName?: boolean;
    showMarkerIcon?: boolean;
    showMarkerValue?: boolean;
    markerIcon?: string;
    markerBackground?: string;
    markerColor?: string;
    markerTagValueId?: string;
    actions?: GaugeAction[];
    constructor(_id: string) {
        this.id = _id;
    }
}

export const MAPSLOCATION_PREFIX = 'l_';
