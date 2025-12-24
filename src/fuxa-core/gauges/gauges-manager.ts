/**
 * V6: GaugesManager - 图元管理器
 * 从 FUXA 复制，移除 Angular 依赖 (@Injectable, @Output 装饰器)
 * 使用自定义 EventEmitter 替代 Angular 的 EventEmitter
 * 
 * 原则：不要精简，不要漏功能
 */

import { EventEmitter } from '../lib/event-emitter';
import { Utils } from '../helpers/utils';
import {
    GaugeSettings,
    Variable,
    Event,
    GaugeEvent,
    GaugeEventType,
    GaugeStatus,
    Size,
    DaqQuery,
    TableType,
    GaugeVideoProperty,
    GaugeDialogType,
    Hmi
} from '../models/hmi';
import { ChartRangeType, ChartViewType } from '../models/chart';
import { DevicesUtils, Tag } from '../models/device';

// Import all gauge components
import { GaugeBaseComponent } from './gauge-base';
import { ValueComponent } from './controls/value';
import { HtmlInputComponent } from './controls/html-input';
import { HtmlButtonComponent } from './controls/html-button';
import { HtmlSelectComponent } from './controls/html-select';
import { HtmlChartComponent } from './controls/html-chart';
import { HtmlGraphComponent } from './controls/html-graph';
import { HtmlBagComponent } from './controls/html-bag';
import { HtmlSwitchComponent } from './controls/html-switch';
import { GaugeProgressComponent } from './controls/gauge-progress';
import { GaugeSemaphoreComponent } from './controls/gauge-semaphore';
import { ShapesComponent } from './controls/shapes';
import { ProcEngComponent } from './shapes/proc-eng';
import { ApeShapesComponent } from './shapes/ape-shapes';
import { PipeComponent } from './controls/pipe';
import { SliderComponent } from './controls/slider';
import { HtmlIframeComponent } from './controls/html-iframe';
import { HtmlTableComponent } from './controls/html-table';
import { HtmlImageComponent } from './controls/html-image';
import { PanelComponent } from './controls/panel';
import { HtmlVideoComponent } from './controls/html-video';
import { HtmlSchedulerComponent } from './controls/html-scheduler';

/**
 * Interface for mapped gauges settings
 */
interface MapGaugesSetting {
    [x: string]: GaugeSettings;
}

/**
 * Interface for HMI Service abstraction
 * This allows the manager to work with different implementations
 */
export interface IHmiService {
    variables: { [id: string]: Variable };
    hmi: Hmi | any;
    onVariableChanged: EventEmitter<Variable>;
    onDaqResult: EventEmitter<any>;
    getGaugeMapped?: (name: string) => any;
    addSignal(signalId: string): void;
    addSignalGaugeToMap(domViewId: string, signalId: string, ga: GaugeSettings): void;
    removeSignalGaugeFromMap(domViewId: string): { [sid: string]: string[] };
    emitMappedSignalsGauge(domViewId: string): void;
    getMappedSignalsGauges(domViewId: string, sigid: string): GaugeSettings[];
    getMappedVariables(fulltext: boolean): any;
    getMappedVariable(sigId: string, fulltext: boolean): Variable | null;
    putSignalValue(sigId: string, value: string, fnc?: string | null): void;
    getChartSignal(chartId: string): string[] | undefined;
    getGraphSignal(graphId: string): string[] | undefined;
    getChart(chartId: string): any;
    getGraph(graphId: string): any;
    queryDaqValues(query: DaqQuery): void;
    getDaqValues(query: DaqQuery): { subscribe: (success: (result: any) => void, error: (err: any) => void) => void };
}

/**
 * Interface for Auth Service abstraction
 */
export interface IAuthService {
    checkPermission(permission: number, roles?: any): boolean;
}

/**
 * Interface for Window Reference abstraction
 */
export interface IWindowRef {
    nativeWindow: Window;
}

/**
 * Interface for FuxaView component abstraction
 */
export interface IFuxaViewComponent {
    getGaugeStatus(ga: GaugeSettings): GaugeStatus;
}

/**
 * GaugesManager - 管理所有图元组件
 * 
 * 主要功能：
 * 1. 注册和管理所有图元类型
 * 2. 创建图元设置和状态
 * 3. 绑定/解绑图元与信号
 * 4. 处理图元值变化
 * 5. 管理图元事件
 */
export class GaugesManager {
    // Event emitters (替代 Angular @Output 装饰器)
    onchange: EventEmitter<Variable> = new EventEmitter();
    onevent: EventEmitter<Event> = new EventEmitter();

    // map of gauges that have a click/html event
    eventGauge: MapGaugesSetting = {};
    // map of gauges with views
    mapGaugeView: { [id: string]: { [viewId: string]: GaugeSettings } } = {};
    // map of all signals and binded gauges of current view
    memorySigGauges: { [sigId: string]: { [gaugeId: string]: any } } = {};

    mapChart: { [id: string]: any } = {};
    mapGauges: { [id: string]: any } = {};
    mapTable: { [id: string]: any } = {};

    // Services (通过 init() 方法注入，替代构造函数注入)
    private hmiService: IHmiService | null = null;
    private authService: IAuthService | null = null;
    private winRef: IWindowRef | null = null;

    // list of gauges tags to speed up the check
    static gaugesTags: string[] = [];

    // list of gauges with input
    static GaugeWithProperty = [HtmlInputComponent.prefix, HtmlSelectComponent.prefix, HtmlSwitchComponent.prefix];

    // list of gauges tags to check who has events like mouse click
    static GaugeWithEvents = [
        HtmlButtonComponent.TypeTag,
        GaugeSemaphoreComponent.TypeTag,
        ShapesComponent.TypeTag,
        ProcEngComponent.TypeTag,
        ApeShapesComponent.TypeTag,
        HtmlImageComponent.TypeTag,
        HtmlInputComponent.TypeTag,
        PanelComponent.TypeTag,
        HtmlSelectComponent.TypeTag,
        HtmlSwitchComponent.TypeTag
    ];

    // list of gauges tags to check who has events like mouse click
    static GaugeWithActions: any[] = [
        ApeShapesComponent,
        PipeComponent,
        ProcEngComponent,
        ShapesComponent,
        HtmlButtonComponent,
        HtmlSelectComponent,
        ValueComponent,
        HtmlInputComponent,
        GaugeSemaphoreComponent,
        HtmlImageComponent,
        PanelComponent,
        HtmlVideoComponent
    ];

    // list of gauges components
    static Gauges: any[] = [
        ValueComponent,
        HtmlInputComponent,
        HtmlButtonComponent,
        HtmlBagComponent,
        HtmlSelectComponent,
        HtmlChartComponent,
        GaugeProgressComponent,
        GaugeSemaphoreComponent,
        ShapesComponent,
        ProcEngComponent,
        ApeShapesComponent,
        PipeComponent,
        SliderComponent,
        HtmlSwitchComponent,
        HtmlGraphComponent,
        HtmlIframeComponent,
        HtmlTableComponent,
        HtmlImageComponent,
        PanelComponent,
        HtmlVideoComponent,
        HtmlSchedulerComponent
    ];

    constructor() {
        // make the list of gauges tags to speed up the check
        GaugesManager.Gauges.forEach(g => {
            GaugesManager.gaugesTags.push(g.TypeTag);
        });
    }

    /**
     * Initialize the manager with required services
     * 替代 Angular 的构造函数依赖注入
     */
    init(hmiService: IHmiService, authService?: IAuthService, winRef?: IWindowRef): void {
        this.hmiService = hmiService;
        this.authService = authService || null;
        this.winRef = winRef || null;

        // subscription to the change of variable value, then emit to the gauges of fuxa-view
        this.hmiService.onVariableChanged.subscribe((sig: Variable) => {
            try {
                this.onchange.emit(sig);
            } catch (err) {
                // silent error
            }
        });

        // subscription to DAQ values, then emit to charts gauges of fuxa-view
        this.hmiService.onDaqResult.subscribe((message: any) => {
            try {
                if (this.mapChart[message.gid]) {
                    let gauge = this.mapChart[message.gid];
                    if (typeof gauge.setValues === 'function') {
                        gauge.setValues(message.result, message.chunk);
                    }
                } else if (this.mapTable[message.gid]) {
                    let gauge = this.mapTable[message.gid];
                    if (typeof gauge.setValues === 'function') {
                        gauge.setValues(message.result);
                    }
                }
            } catch (err) {
                // silent error
            }
        });

        this.hmiService.getGaugeMapped = this.getGaugeFromName.bind(this);
    }

    /**
     * Create gauge settings for a given type
     */
    createSettings(id: string, type: string): GaugeSettings | null {
        let gs: GaugeSettings | null = null;
        if (type) {
            for (let i = 0; i < GaugesManager.Gauges.length; i++) {
                if (type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                    gs = new GaugeSettings(id, type);
                    gs.label = GaugesManager.Gauges[i].LabelTag;
                    return gs;
                }
            }
        }
        return gs;
    }

    /**
     * Create gauge status for a given gauge settings
     */
    createGaugeStatus(ga: GaugeSettings): GaugeStatus {
        let result = new GaugeStatus();
        if (!ga.type.startsWith(HtmlChartComponent.TypeTag) &&
            !ga.type.startsWith(HtmlGraphComponent.TypeTag) &&
            !ga.type.startsWith(HtmlTableComponent.TypeTag) &&
            !ga.type.startsWith(HtmlSchedulerComponent.TypeTag)) {
            result.onlyChange = true;
        }
        if (ga.type.startsWith(SliderComponent.TypeTag)) {
            result.takeValue = true;
        }
        return result;
    }

    /**
     * Check if gauge type has events
     */
    isWithEvents(type: string): boolean {
        if (type) {
            for (let i = 0; i < GaugesManager.GaugeWithEvents.length; i++) {
                if (type.startsWith(GaugesManager.GaugeWithEvents[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if gauge type has actions
     */
    isWithActions(type: string): any {
        if (type) {
            for (let i = 0; i < GaugesManager.GaugeWithActions.length; i++) {
                if (type.startsWith(GaugesManager.GaugeWithActions[i].TypeTag)) {
                    if (typeof GaugesManager.GaugeWithActions[i].getActions === 'function') {
                        return GaugesManager.GaugeWithActions[i].getActions!(type);
                    }
                }
            }
        }
        return false;
    }

    /**
     * Return if is a gauge by check the svg attribute 'type' = 'svg-ext-...'
     */
    static isGauge(type: string): boolean {
        for (let tag in GaugesManager.gaugesTags) {
            if (type.startsWith(GaugesManager.gaugesTags[tag])) {
                return true;
            }
        }
        return false;
    }

    /**
     * gauges to update in editor after changed property (GaugePropertyComponent, ChartPropertyComponent)
     */
    initInEditor(ga: GaugeSettings, res: any, ref: any, elementWithLanguageText?: any): any {
        if (ga.type.startsWith(GaugeProgressComponent.TypeTag)) {
            GaugeProgressComponent.initElement(ga);
        } else if (ga.type.startsWith(HtmlButtonComponent.TypeTag)) {
            HtmlButtonComponent.initElement(ga);
        } else if (ga.type.startsWith(HtmlChartComponent.TypeTag)) {
            delete this.mapGauges[ga.id];
            let gauge = HtmlChartComponent.detectChange(ga);
            this.setChartProperty(gauge, ga.property);
            this.mapGauges[ga.id] = gauge;
        } else if (ga.type.startsWith(HtmlGraphComponent.TypeTag)) {
            delete this.mapGauges[ga.id];
            let gauge = HtmlGraphComponent.detectChange(ga);
            this.setGraphProperty(gauge, ga.property);
            this.mapGauges[ga.id] = gauge;
        } else if (ga.type.startsWith(HtmlBagComponent.TypeTag)) {
            this.mapGauges[ga.id] = HtmlBagComponent.detectChange(ga);
        } else if (ga.type.startsWith(PipeComponent.TypeTag)) {
            this.mapGauges[ga.id] = (PipeComponent as any).detectChange?.(ga, this.winRef) || PipeComponent.initElement(ga, false);
            return this.mapGauges[ga.id];
        } else if (ga.type.startsWith(SliderComponent.TypeTag)) {
            return this.mapGauges[ga.id] = (SliderComponent as any).detectChange?.(ga) || (SliderComponent as any).initElement?.(ga, false);
        } else if (ga.type.startsWith(HtmlSwitchComponent.TypeTag)) {
            return this.mapGauges[ga.id] = (HtmlSwitchComponent as any).detectChange?.(ga) || (HtmlSwitchComponent as any).initElement?.(ga);
        } else if (ga.type.startsWith(HtmlIframeComponent.TypeTag)) {
            (HtmlIframeComponent as any).detectChange?.(ga) || (HtmlIframeComponent as any).initElement?.(ga, false);
        } else if (ga.type.startsWith(HtmlTableComponent.TypeTag)) {
            delete this.mapGauges[ga.id];
            let gauge = HtmlTableComponent.detectChange(ga);
            this.setTableProperty(gauge, ga.property);
            this.mapGauges[ga.id] = gauge;
        } else if (ga.type.startsWith(HtmlSchedulerComponent.TypeTag)) {
            delete this.mapGauges[ga.id];
            let gauge = HtmlSchedulerComponent.detectChange(ga);
            this.mapGauges[ga.id] = gauge;
        } else if (ga.type.startsWith(HtmlImageComponent.TypeTag)) {
            (HtmlImageComponent as any).detectChange?.(ga, true) || HtmlImageComponent.initElement(ga, false);
        } else if (ga.type.startsWith(HtmlVideoComponent.TypeTag)) {
            HtmlVideoComponent.initElement(ga);
        } else if (elementWithLanguageText) {
            GaugeBaseComponent.setLanguageText(elementWithLanguageText, ga.property?.text);
        } else if (ga.type.startsWith(HtmlInputComponent.TypeTag)) {
            HtmlInputComponent.initElement(ga);
        }
        return false;
    }

    /**
     * emit the signal value to the frontend, used for user_defined variable to make logic in frontend
     */
    setSignalValue(sigId: string, value: any): void {
        let variable = new Variable(sigId, null as any, null as any);
        variable.value = value;
        this.onchange.emit(variable);
    }

    /**
     * Initialize gauges map
     */
    initGaugesMap(): void {
        this.eventGauge = {};
        this.mapGaugeView = {};
        this.memorySigGauges = {};
        this.mapChart = {};
        this.mapGauges = {};
        this.mapTable = {};
    }

    /**
     * called from fuxa-view, is used to emit message for a refresh of all signals values and the gauges of view
     */
    emitBindedSignals(domViewId: string): void {
        if (this.hmiService) {
            this.hmiService.emitMappedSignalsGauge(domViewId);
        }
    }

    /**
     * called from fuxa-view, bind dom view, gauge with signal (for animation) and event
     */
    bindGauge(
        gauge: any,
        domViewId: string,
        ga: GaugeSettings,
        sourceDeviceTags: Tag[],
        bindMouseEvent: (ga: GaugeSettings) => void,
        bindhtmlevent: (event: Event) => void
    ): void {
        let sigsId: string[] | null = this.getBindSignals(ga, sourceDeviceTags);
        if (sigsId && this.hmiService) {
            for (let i = 0; i < sigsId.length; i++) {
                this.hmiService.addSignalGaugeToMap(domViewId, sigsId[i], ga);
                // check for special gauge to save in memory binded to sigid (chart-html)
                if (gauge) {
                    if (!this.memorySigGauges[sigsId[i]]) {
                        this.memorySigGauges[sigsId[i]] = {};
                        this.memorySigGauges[sigsId[i]][ga.id] = gauge;
                    } else if (!this.memorySigGauges[sigsId[i]][ga.id]) {
                        this.memorySigGauges[sigsId[i]][ga.id] = gauge;
                    }
                }
            }
        }
        let mouseEvents: GaugeEvent[] | null = this.getBindMouseEvent(ga, null as any);
        if (mouseEvents && mouseEvents.length > 0) {
            this.eventGauge[ga.id] = ga;
            if (!this.mapGaugeView[ga.id]) {
                this.mapGaugeView[ga.id] = {};
                this.mapGaugeView[ga.id][domViewId] = ga;
                bindMouseEvent(ga);
            } else if (!this.mapGaugeView[ga.id][domViewId]) {
                this.mapGaugeView[ga.id][domViewId] = ga;
                bindMouseEvent(ga);
            }
            // add pointer
            let ele = document.getElementById(ga.id);
            if (ele) {
                ele.style.cursor = 'pointer';
            }
        }
        let htmlEvents = this.getHtmlEvents(ga);
        if (htmlEvents) {
            this.eventGauge[htmlEvents.dom.id] = ga;
            bindhtmlevent(htmlEvents);
        }
        this.bindGaugeEventToSignal(ga);
        this.checkElementToInit(ga);
    }

    /**
     * called from fuxa-view, remove bind of dom view gauge
     */
    unbindGauge(domViewId: string): void {
        if (!this.hmiService) return;

        // first remove special gauge like chart from memorySigGauges
        let sigGaugeSettingsIdremoved = this.hmiService.removeSignalGaugeFromMap(domViewId);
        Object.keys(sigGaugeSettingsIdremoved).forEach(sid => {
            if (this.memorySigGauges[sid]) {
                for (let i = 0; i < sigGaugeSettingsIdremoved[sid].length; i++) {
                    let gsId = sigGaugeSettingsIdremoved[sid][i];
                    if (this.memorySigGauges[sid][gsId]) {
                        let g = this.memorySigGauges[sid][gsId];
                        try {
                            if (g.myComRef && typeof g.myComRef.destroy === 'function') {
                                g.myComRef.destroy();
                            }
                            delete this.memorySigGauges[sid][gsId];
                            if (this.mapChart[g.id]) {
                                delete this.mapChart[g.id];
                            }
                            if (this.mapGauges[g.id]) {
                                delete this.mapGauges[g.id];
                            }
                            if (this.mapTable[g.id]) {
                                delete this.mapTable[g.id];
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                }
            }
        });

        // remove mapped gauge for events of this view
        Object.values(this.mapGaugeView).forEach((val: any) => {
            if (val[domViewId]) {
                let g = val[domViewId];
                if (g.myComRef && typeof g.myComRef.destroy === 'function') {
                    g.myComRef.destroy();
                }
                delete val[domViewId];
            }
        });
    }

    /**
     * init element of fuxa-view
     */
    checkElementToInit(ga: GaugeSettings): any {
        if (ga.type.startsWith(HtmlSelectComponent.TypeTag)) {
            return HtmlSelectComponent.initElement(ga, true);
        }
        return null;
    }

    /**
     * Check element to resize
     */
    checkElementToResize(ga: GaugeSettings, res: any, ref: any, size: Size): any {
        if (ga && this.mapGauges[ga.id]) {
            if (typeof this.mapGauges[ga.id].resize === 'function') {
                let height: number | undefined, width: number | undefined;
                if (size) {
                    height = size.height;
                    width = size.width;
                }
                this.mapGauges[ga.id].resize(height, width);
            } else {
                for (let i = 0; i < GaugesManager.Gauges.length; i++) {
                    if (ga.type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                        if (typeof GaugesManager.Gauges[i].resize === 'function') {
                            let options: any;
                            if (this.mapGauges[ga.id].options) {
                                options = this.mapGauges[ga.id].options;
                            }
                            return GaugesManager.Gauges[i].resize!(ga, res, ref, options);
                        }
                        return;
                    }
                }
            }
        }
    }

    /**
     * Get gauge from name
     */
    getGaugeFromName(gaugeName: string): any {
        let gauge = Object.values(this.mapGauges).find((g: any) => g?.name === gaugeName);
        if (!gauge && this.mapGaugeView) {
            gauge = Object.values(this.mapGaugeView).find((g: any) => g?.name === gaugeName);
        }
        return gauge;
    }

    /**
     * Get gauge value
     */
    getGaugeValue(gaugeId: string): any {
        if (this.mapGauges[gaugeId] && typeof this.mapGauges[gaugeId].currentValue === 'function') {
            return this.mapGauges[gaugeId].currentValue();
        }
    }

    /**
     * get all gauge settings binded to dom view with the signal
     */
    getGaugeSettings(domViewId: string, sigid: string): GaugeSettings[] {
        if (!this.hmiService) return [];
        let gslist = this.hmiService.getMappedSignalsGauges(domViewId, sigid);
        return gslist;
    }

    /**
     * get all signals mapped in all dom views, used from LabComponent
     */
    getMappedGaugesSignals(fulltext: boolean): any {
        if (!this.hmiService) return null;
        return this.hmiService.getMappedVariables(fulltext);
    }

    /**
     * return all signals binded to the gauge
     */
    getBindSignals(gaugeSettings: GaugeSettings, sourceDeviceTags?: Tag[]): string[] | null {
        if (gaugeSettings.property) {
            for (let i = 0; i < GaugesManager.Gauges.length; i++) {
                if (gaugeSettings.type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                    if (gaugeSettings.type.startsWith(HtmlChartComponent.TypeTag)) {
                        if (!this.hmiService) return null;
                        let sigsId = this.hmiService.getChartSignal(gaugeSettings.property.id);
                        if (!sigsId) return null;
                        if (sourceDeviceTags) {
                            sigsId = sigsId.map(signalId => {
                                const tag = DevicesUtils.placeholderToTag(signalId, sourceDeviceTags);
                                return tag?.id ?? signalId;
                            });
                        }
                        return sigsId;
                    } else if (gaugeSettings.type.startsWith(HtmlGraphComponent.TypeTag)) {
                        if (!this.hmiService) return null;
                        let sigsId = this.hmiService.getGraphSignal(gaugeSettings.property.id);
                        if (!sigsId) return null;
                        if (sourceDeviceTags) {
                            sigsId = sigsId.map(signalId => {
                                const tag = DevicesUtils.placeholderToTag(signalId, sourceDeviceTags);
                                return tag?.id ?? signalId;
                            });
                        }
                        return sigsId;
                    } else if (typeof GaugesManager.Gauges[i].getSignals === 'function') {
                        return GaugesManager.Gauges[i].getSignals!(gaugeSettings.property);
                    } else {
                        return null;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get bind signals value
     */
    getBindSignalsValue(ga: GaugeSettings): Variable[] {
        let signals = this.getBindSignals(ga);
        let result: Variable[] = [];
        if (signals && this.hmiService) {
            signals.forEach(sigId => {
                let variable = this.hmiService!.getMappedVariable(sigId, false);
                if (variable && !Utils.isNullOrUndefined(variable.value)) {
                    result.push(variable);
                }
            });
        }
        return result;
    }

    /**
     * return all events binded to the gauge with mouse event
     */
    getBindMouseEvent(ga: GaugeSettings, evType: GaugeEventType): GaugeEvent[] | null {
        for (let i = 0; i < GaugesManager.Gauges.length; i++) {
            if (ga.type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                if (typeof GaugesManager.Gauges[i].getEvents === 'function') {
                    return GaugesManager.Gauges[i].getEvents!(ga.property, evType);
                } else {
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * return all events binded to the html gauge ('key-enter' of input, 'change' of select)
     */
    getHtmlEvents(ga: GaugeSettings): Event | null {
        if (ga.type.startsWith(HtmlInputComponent.TypeTag)) {
            return HtmlInputComponent.getHtmlEvents(ga);
        } else if (ga.type.startsWith(HtmlSelectComponent.TypeTag)) {
            return HtmlSelectComponent.getHtmlEvents(ga);
        }
        return null;
    }

    /**
     * Bind gauge event to signal
     */
    bindGaugeEventToSignal(ga: GaugeSettings): void {
        if (ga.type.startsWith(SliderComponent.TypeTag)) {
            let self = this;
            (SliderComponent as any).bindEvents?.(ga, this.mapGauges[ga.id], (event: Event) => {
                self.putEvent(event);
            });
        } else if (ga.type.startsWith(HtmlSwitchComponent.TypeTag)) {
            let self = this;
            (HtmlSwitchComponent as any).bindEvents?.(ga, this.mapGauges[ga.id], (event: Event) => {
                self.putEvent(event);
            });
        } else if (ga.type.startsWith(HtmlImageComponent.TypeTag)) {
            let self = this;
            (HtmlImageComponent as any).bindEvents?.(ga, (event: Event) => {
                self.putEvent(event);
            });
        }
    }

    /**
     * manage to which gauge to forward the process function
     */
    processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus): void {
        (gaugeStatus.variablesValue as any)[sig.id] = sig.value;
        for (let i = 0; i < GaugesManager.Gauges.length; i++) {
            if (ga.type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                if (ga.type.startsWith(HtmlChartComponent.TypeTag)) {
                    if (ga.property.type === ChartViewType.realtime1 && this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                HtmlChartComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(HtmlGraphComponent.TypeTag)) {
                    if (ga.property.type !== 'history' && this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                HtmlGraphComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(HtmlBagComponent.TypeTag)) {
                    if (this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                HtmlBagComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(SliderComponent.TypeTag)) {
                    if (this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                SliderComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(HtmlSwitchComponent.TypeTag)) {
                    if (this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                HtmlSwitchComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(HtmlTableComponent.TypeTag)) {
                    if ((ga.property.type === TableType.data || ga.property.options?.realtime) && this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                HtmlTableComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(HtmlSchedulerComponent.TypeTag)) {
                    if (this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                HtmlSchedulerComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (ga.type.startsWith(PanelComponent.TypeTag)) {
                    if (this.memorySigGauges[sig.id]) {
                        Object.keys(this.memorySigGauges[sig.id]).forEach(k => {
                            if (k === ga.id && this.mapGauges[k]) {
                                PanelComponent.processValue(ga, svgele, sig, gaugeStatus, this.mapGauges[k]);
                            }
                        });
                    }
                    break;
                } else if (typeof GaugesManager.Gauges[i].processValue === 'function') {
                    GaugesManager.Gauges[i].processValue!(ga, svgele, sig, gaugeStatus);
                    break;
                } else {
                    break;
                }
            }
        }
    }

    /**
     * Toggle signal value
     */
    toggleSignalValue(sigid: string, bitmask?: number): void {
        if (!this.hmiService) return;
        if (this.hmiService.variables.hasOwnProperty(sigid)) {
            let currentValue: any = this.hmiService.variables[sigid].value;
            if (currentValue === null || currentValue === undefined) {
                return;
            } else {
                if (!Utils.isNullOrUndefined(bitmask)) {
                    const value = GaugeBaseComponent.toggleBitmask(parseFloat(currentValue), bitmask!);
                    this.putSignalValue(sigid, value.toString());
                } else if (currentValue === 0 || currentValue === '0' || currentValue === false || currentValue === 'false') {
                    this.putSignalValue(sigid, '1');
                } else if (currentValue === 1 || currentValue === '1' || currentValue === true || currentValue === 'true') {
                    this.putSignalValue(sigid, '0');
                } else {
                    // 其他情况，尝试转为数值后切换
                    const numVal = parseFloat(currentValue);
                    this.putSignalValue(sigid, numVal ? '0' : '1');
                }
            }
        }
    }

    /**
     * called from fuxa-view to emit and send signal value from a gauge event ('key-enter' of input, 'change' of select)
     */
    putEvent(event: Event): void {
        if (!this.hmiService) return;

        if (event.type === (HtmlImageComponent as any).propertyWidgetType) {
            const value = GaugeBaseComponent.valueBitmask(
                event.ga.property.bitmask,
                event.value,
                parseFloat(this.hmiService.variables[event.variableId]?.value || '0')
            );
            this.hmiService.putSignalValue(event.variableId, String(value));
            event.dbg = 'put ' + event.variableId + ' ' + event.value;
        } else if (event.ga.property && event.ga.property.variableId) {
            const value = GaugeBaseComponent.valueBitmask(
                event.ga.property.bitmask,
                event.value,
                parseFloat(this.hmiService.variables[event.ga.property.variableId]?.value || '0')
            );
            this.hmiService.putSignalValue(event.ga.property.variableId, String(value));
            event.dbg = 'put ' + event.ga.property.variableId + ' ' + event.value;
        }
        this.onevent.emit(event);
    }

    /**
     * called from fuxa-view to emit and send signal value from a gauge event (click)
     */
    putSignalValue(sigid: string, val: string, fnc: string | null = null): void {
        if (this.hmiService) {
            this.hmiService.putSignalValue(sigid, val, fnc || undefined);
        }
    }

    /**
     * Get edit dialog type to use
     */
    static getEditDialogTypeToUse(type: string): GaugeDialogType | null {
        for (let i = 0; i < GaugesManager.Gauges.length; i++) {
            if (type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                if (typeof GaugesManager.Gauges[i].getDialogType === 'function') {
                    return GaugesManager.Gauges[i].getDialogType!();
                } else {
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Check if bitmask is supported for gauge type
     */
    static isBitmaskSupported(type: string): boolean {
        for (let i = 0; i < GaugesManager.Gauges.length; i++) {
            if (type.startsWith(GaugesManager.Gauges[i].TypeTag)) {
                if (typeof GaugesManager.Gauges[i].isBitmaskSupported === 'function') {
                    return GaugesManager.Gauges[i].isBitmaskSupported!();
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * used from controls in editor to get default value of edit gauge property
     */
    static getDefaultValue(type: string): any {
        if (type.startsWith(GaugeProgressComponent.TypeTag)) {
            return GaugeProgressComponent.getDefaultValue();
        }
        return null;
    }

    /**
     * used from controls in editor, to set the colorpicker of selected control
     */
    static checkGaugeColor(ele: any, eles: any, colors: any): boolean {
        if (ele && ele.type && eles && (eles.length <= 1 || !eles[1]) && colors) {
            if (ele.type.startsWith(GaugeProgressComponent.TypeTag)) {
                colors.fill = GaugeProgressComponent.getFillColor(eles[0]);
                colors.stroke = GaugeProgressComponent.getStrokeColor(eles[0]);
                return true;
            } else if (ele.type.startsWith(GaugeSemaphoreComponent.TypeTag)) {
                colors.fill = (GaugeSemaphoreComponent as any).getFillColor?.(eles[0]) || '';
                colors.stroke = (GaugeSemaphoreComponent as any).getStrokeColor?.(eles[0]) || '';
                return true;
            } else if (ele.type.startsWith(HtmlButtonComponent.TypeTag)) {
                colors.fill = HtmlButtonComponent.getFillColor(eles[0]);
                colors.stroke = HtmlButtonComponent.getStrokeColor(eles[0]);
                return true;
            } else if (ele.type.startsWith(HtmlInputComponent.TypeTag)) {
                colors.fill = HtmlInputComponent.getFillColor(eles[0]);
                colors.stroke = HtmlInputComponent.getStrokeColor(eles[0]);
                return true;
            } else if (ele.type.startsWith(HtmlSelectComponent.TypeTag)) {
                colors.fill = HtmlSelectComponent.getFillColor(eles[0]);
                colors.stroke = HtmlSelectComponent.getStrokeColor(eles[0]);
                return true;
            }
        }
        return false;
    }

    /**
     * used from controls in editor to change fill and stroke colors
     */
    static initElementColor(bkcolor: string, color: string, elements: any[]): void {
        let elems = elements.filter(el => !!el);
        for (let i = 0; i < elems.length; i++) {
            let type = elems[i].getAttribute('type');
            if (type) {
                if (type.startsWith(GaugeProgressComponent.TypeTag)) {
                    GaugeProgressComponent.initElementColor(bkcolor, color, elems[i]);
                } else if (type.startsWith(HtmlButtonComponent.TypeTag)) {
                    HtmlButtonComponent.initElementColor(bkcolor, color, elems[i]);
                } else if (type.startsWith(HtmlInputComponent.TypeTag)) {
                    HtmlInputComponent.initElementColor(bkcolor, color, elems[i]);
                } else if (type.startsWith(HtmlSelectComponent.TypeTag)) {
                    HtmlSelectComponent.initElementColor(bkcolor, color, elems[i]);
                }
            }
        }
    }

    /**
     * Return the default prefix of gauge name
     */
    static getPrefixGaugeName(type: string): string {
        if (type.startsWith(GaugeProgressComponent.TypeTag)) {
            return 'progress_';
        } else if (type.startsWith(HtmlButtonComponent.TypeTag)) {
            return 'button_';
        } else if (type.startsWith(HtmlInputComponent.TypeTag)) {
            return 'input_';
        } else if (type.startsWith(HtmlSelectComponent.TypeTag)) {
            return 'select_';
        } else if (type.startsWith(GaugeSemaphoreComponent.TypeTag)) {
            return 'led_';
        } else if (type.startsWith(SliderComponent.TypeTag)) {
            return 'slider_';
        } else if (type.startsWith(PipeComponent.TypeTag)) {
            return 'pipe_';
        } else if (type.startsWith(HtmlChartComponent.TypeTag)) {
            return 'chart_';
        } else if (type.startsWith(HtmlGraphComponent.TypeTag)) {
            return 'graph_';
        } else if (type.startsWith(HtmlBagComponent.TypeTag)) {
            return 'gauge_';
        } else if (type.startsWith(HtmlSwitchComponent.TypeTag)) {
            return 'switch_';
        } else if (type.startsWith(HtmlIframeComponent.TypeTag)) {
            return 'iframe_';
        } else if (type.startsWith(ValueComponent.TypeTag)) {
            return 'output_';
        } else if (type.startsWith(HtmlTableComponent.TypeTag)) {
            return 'table_';
        } else if (type.startsWith(HtmlSchedulerComponent.TypeTag)) {
            return 'scheduler_';
        }
        return 'shape_';
    }

    /**
     * initialize the gauge element found in svg view and editor, like ngx-uplot, ngx-gauge
     * in svg is only a 'div' that have to be dynamic build and render from angular
     */
    initElementAdded(
        ga: GaugeSettings,
        res: any,
        ref: any,
        isview: boolean,
        parent?: IFuxaViewComponent,
        textTranslation?: string,
        sourceDeviceTags?: Tag[]
    ): any {
        if (!ga || !ga.type) {
            console.error('!TOFIX', ga);
            return null;
        }
        var targetSignalsId: Record<string, string> = {};
        // add variable to hmi service and map placeholder targetSignalsId
        let signalsId: string[] | null = this.getBindSignals(ga);
        if (signalsId && this.hmiService) {
            signalsId.forEach(signalId => {
                if (isview) {
                    const tag = DevicesUtils.placeholderToTag(signalId, sourceDeviceTags || []);
                    targetSignalsId[signalId] = tag?.id ?? signalId;
                    this.hmiService!.addSignal(targetSignalsId[signalId]);
                } else {
                    this.hmiService!.addSignal(signalId);
                }
            });
        }
        if (isview && ga.hide) {
            let ele = document.getElementById(ga.id);
            if (ele) {
                ele.style.display = 'none';
            }
        }
        if (ga.type.startsWith(HtmlChartComponent.TypeTag)) {
            // prepare attribute
            let gauge: any = HtmlChartComponent.initElement(ga, isview);
            if (gauge) {
                this.setChartProperty(gauge, ga.property, targetSignalsId);
                this.mapChart[ga.id] = gauge;
                if (gauge.onTimeRange) {
                    gauge.onTimeRange.subscribe((data: DaqQuery) => {
                        if (this.hmiService) {
                            this.hmiService.queryDaqValues(data);
                        }
                    });
                }
                if (isview && typeof gauge.setInitRange === 'function') {
                    gauge.setInitRange();
                }
                this.mapGauges[ga.id] = gauge;
            }
            return gauge;
        } else if (ga.type.startsWith(HtmlGraphComponent.TypeTag)) {
            let gauge: any = HtmlGraphComponent.initElement(ga, isview);
            if (gauge) {
                this.setGraphProperty(gauge, ga.property, targetSignalsId);
                if (gauge.onReload) {
                    gauge.onReload.subscribe((query: DaqQuery) => {
                        if (this.hmiService) {
                            this.hmiService.getDaqValues(query).subscribe(
                                (result: any) => {
                                    if (typeof gauge.setValues === 'function') {
                                        gauge.setValues(query.sids, result);
                                    }
                                },
                                (err: any) => {
                                    if (typeof gauge.setValues === 'function') {
                                        gauge.setValues(query.sids, null);
                                    }
                                    console.error('get DAQ values err: ' + err);
                                }
                            );
                        }
                    });
                }
                this.mapGauges[ga.id] = gauge;
            }
            return gauge;
        } else if (ga.type.startsWith(HtmlBagComponent.TypeTag)) {
            let gauge = HtmlBagComponent.initElement(ga, isview);
            this.mapGauges[ga.id] = gauge;
            return gauge;
        } else if (ga.type.startsWith(SliderComponent.TypeTag)) {
            let gauge = (SliderComponent as any).initElement?.(ga, isview);
            this.mapGauges[ga.id] = gauge;
            return gauge;
        } else if (ga.type.startsWith(HtmlInputComponent.TypeTag)) {
            let gauge = HtmlInputComponent.initElement(ga, isview);
            return gauge || true;
        } else if (ga.type.startsWith(HtmlSelectComponent.TypeTag)) {
            let gauge = HtmlSelectComponent.initElement(ga, isview);
            return gauge || true;
        } else if (ga.type.startsWith(GaugeProgressComponent.TypeTag)) {
            let gauge = GaugeProgressComponent.initElement(ga);
            return gauge || true;
        } else if (ga.type.startsWith(HtmlSwitchComponent.TypeTag)) {
            let gauge = (HtmlSwitchComponent as any).initElement?.(ga);
            this.mapGauges[ga.id] = gauge;
            return gauge;
        } else if (ga.type.startsWith(HtmlTableComponent.TypeTag)) {
            let gauge: any = HtmlTableComponent.initElement(ga, isview);
            if (gauge) {
                this.setTableProperty(gauge, ga.property, targetSignalsId);
                this.mapTable[ga.id] = gauge;
                if (gauge.onTimeRange$) {
                    gauge.onTimeRange$.subscribe((data: DaqQuery | null) => {
                        if (data && this.hmiService) {
                            this.hmiService.queryDaqValues(data);
                        }
                    });
                }
                this.mapGauges[ga.id] = gauge;
            }
            return gauge;
        } else if (ga.type.startsWith(HtmlSchedulerComponent.TypeTag)) {
            let gauge = HtmlSchedulerComponent.initElement(ga, isview);
            if (gauge) {
                this.mapGauges[ga.id] = gauge;
            }
            return gauge;
        } else if (ga.type.startsWith(HtmlIframeComponent.TypeTag)) {
            let gauge = (HtmlIframeComponent as any).initElement?.(ga, isview);
            return gauge || true;
        } else if (ga.type.startsWith(HtmlImageComponent.TypeTag)) {
            let gauge = HtmlImageComponent.initElement(ga, isview);
            this.mapGauges[ga.id] = gauge;
            return gauge;
        } else if (ga.type.startsWith(PanelComponent.TypeTag)) {
            let gauge = (PanelComponent as any).initElement?.(ga, this, this.hmiService?.hmi, isview, parent);
            this.mapGauges[ga.id] = gauge;
            return gauge;
        } else if (ga.type.startsWith(HtmlButtonComponent.TypeTag)) {
            let gauge = HtmlButtonComponent.initElement(ga, textTranslation);
            return gauge || true;
        } else if (ga.type.startsWith(PipeComponent.TypeTag)) {
            let gauge = (PipeComponent as any).initElement?.(ga, isview, parent?.getGaugeStatus(ga));
            this.mapGauges[ga.id] = gauge;
            return gauge || true;
        } else if (ga.type.startsWith(HtmlVideoComponent.TypeTag)) {
            let gauge = HtmlVideoComponent.initElement(ga, isview);
            this.mapGauges[ga.id] = gauge;
            return gauge || true;
        } else {
            let ele = document.getElementById(ga.id);
            ele?.setAttribute('data-name', ga.name);
            GaugeBaseComponent.setLanguageText(ele, textTranslation!);
            return ele || true;
        }
    }

    /**
     * Check set mode param to added gauge
     */
    checkSetModeParamToAddedGauge(ga: GaugeSettings, param: string | any): void {
        if (!param) {
            return;
        }
        if (ga?.type === HtmlVideoComponent.TypeTag) {
            ga.property = ga.property || new GaugeVideoProperty();
            ga.property.options = ga.property.options || {};
            ga.property.options.address = param;
        }
    }

    /**
     * add the chart settings (line) and property options to the gauge
     */
    private setChartProperty(gauge: any, property: any, targetSignalsId?: Record<string, string>): void {
        if (!gauge || !property || !this.hmiService) return;

        if (property.id) {
            let chart = this.hmiService.getChart(property.id);
            if (chart) {
                const opt = { ...property.options, title: chart.name, id: chart.name, scales: { x: { time: true } } };
                if (typeof gauge.setOptions === 'function') {
                    gauge.setOptions(opt, true);
                }
                let yaxisNotOne = chart.lines?.find((line: any) => line.yaxis > 1);
                if (chart.lines) {
                    for (let i = 0; i < chart.lines.length; i++) {
                        let line = chart.lines[i];
                        // check for placeholder
                        let sigid = targetSignalsId?.[line.id] ?? line.id;
                        let sigProperty = this.hmiService.getMappedVariable(sigid, true);
                        if (sigProperty && typeof gauge.addLine === 'function') {
                            gauge.addLine(sigid, sigProperty.name, line, yaxisNotOne ? true : false);
                        }
                    }
                }
                if (typeof gauge.redraw === 'function') {
                    gauge.redraw();
                }
            }
        } else if (typeof gauge.setOptions === 'function') {
            gauge.setOptions(property.options, true);
        }
    }

    /**
     * Set graph property
     */
    private setGraphProperty(gauge: any, property: any, targetSignalsId?: Record<string, string>): void {
        if (!gauge || !property || !this.hmiService) return;

        if (property.id) {
            let graph = this.hmiService.getGraph(property.id);
            if (graph && typeof gauge.init === 'function') {
                gauge.init(graph.name, graph.property, graph.sources);
                // check for placeholder
                if ('sourceMap' in gauge && targetSignalsId) {
                    const updatedSourceMap: Record<string, any> = {};
                    for (const [key, index] of Object.entries(gauge.sourceMap)) {
                        const newKey = targetSignalsId[key] ?? key;
                        updatedSourceMap[newKey] = index;
                    }
                    gauge.sourceMap = updatedSourceMap;
                }
            }
        }
        if (property.options && typeof gauge.setOptions === 'function') {
            gauge.setOptions(property.options);
        }
    }

    /**
     * Set table property
     */
    private setTableProperty(table: any, property: any, targetSignalsId?: Record<string, string>): void {
        if (!table || !property) return;

        if (property.options) {
            if (typeof table.remapVariableIds === 'function') {
                table.remapVariableIds(property.options, targetSignalsId);
            }
            if (typeof table.setOptions === 'function') {
                table.setOptions(property.options);
            }
        }
    }

    /**
     * clear memory object used from view, some reset
     */
    clearMemory(): void {
        this.memorySigGauges = {};
    }

    /**
     * Returns list of signals id (tag) that are binded to a gauge
     */
    getBindedSignalsId(): string[] {
        return Object.keys(this.memorySigGauges);
    }

    /**
     * Destroy the manager and clean up resources
     */
    destroy(): void {
        this.onchange.unsubscribeAll();
        this.onevent.unsubscribeAll();
        this.initGaugesMap();
        this.hmiService = null;
        this.authService = null;
        this.winRef = null;
    }
}
