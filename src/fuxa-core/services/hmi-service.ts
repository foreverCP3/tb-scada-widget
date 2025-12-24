/**
 * HMI Service - Migrated from FUXA
 * Original: FUXA/client/src/app/_services/hmi.service.ts
 * 
 * This service manages:
 * - Signal-Gauge mapping (ViewSignalGaugeMap)
 * - Variables storage and management
 * - Chart and Graph signal handling
 * - Value processing with functions (add/remove)
 * 
 * Removed from original:
 * - Socket.io communication (ThingsBoard handles data transport)
 * - Angular @Injectable and @Output decorators
 * - ProjectService dependency (replaced with interface)
 * - ToastrService, TranslateService, HttpClient
 * - Device adapter service
 */

import { EventEmitter } from '../lib/event-emitter';
import { Variable, GaugeSettings, DaqQuery, DaqResult, GaugeEventSetValueType } from '../models/hmi';
import { AlarmQuery, AlarmsFilter, AlarmStatus } from '../models/alarm';
import { Tag } from '../models/device';
import { Utils } from '../helpers/utils';

/**
 * Interface for project service dependency
 */
export interface IProjectService {
    getHmi(): any;
    getDeviceFromTagId(tagId: string): any;
    getDeviceFromId(deviceId: string): any;
    getChart(id: string): any;
    getGraph(id: string): any;
    getAlarmsValues(filter?: AlarmsFilter): Promise<any>;
    getAlarmsHistory(query: AlarmQuery): Promise<any>;
    setAlarmAck(alarmName: string): Promise<any>;
    getDaqValues(query: DaqQuery): Promise<DaqResult>;
    getSchedulerData(id: string): Promise<any>;
    setSchedulerData(id: string, data: any): Promise<any>;
    deleteSchedulerData(id: string): Promise<any>;
}

/**
 * Interface for device adapter service
 */
export interface IDeviceAdapterService {
    resolveAdapterTagsId(tagsId: string[]): string[];
    resolveDeviceTagIdForAdapter(tagId: string): string[];
}

/**
 * Script command types
 */
export const ScriptCommandEnum = {
    SETVIEW: 'SETVIEW',
    OPENCARD: 'OPENCARD',
};

/**
 * Script command message structure
 */
export interface ScriptCommandMessage {
    command: string;
    params: any[];
}

/**
 * Script set view parameters
 */
export interface ScriptSetView {
    viewName: string;
    force: boolean;
}

/**
 * Script open card parameters
 */
export interface ScriptOpenCard {
    viewName: string;
    options: {};
}

/**
 * Endpoint settings for device connection
 */
export interface EndPointSettings {
    address: string;
    uid: string;
    pwd: string;
    id?: string;
}

/**
 * IO Event Types - kept for compatibility even though Socket.io is removed
 */
export enum IoEventTypes {
    DEVICE_STATUS = 'device-status',
    DEVICE_PROPERTY = 'device-property',
    DEVICE_VALUES = 'device-values',
    DEVICE_BROWSE = 'device-browse',
    DEVICE_NODE_ATTRIBUTE = 'device-node-attribute',
    DEVICE_WEBAPI_REQUEST = 'device-webapi-request',
    DEVICE_TAGS_REQUEST = 'device-tags-request',
    DEVICE_TAGS_SUBSCRIBE = 'device-tags-subscribe',
    DEVICE_TAGS_UNSUBSCRIBE = 'device-tags-unsubscribe',
    DEVICE_ENABLE = 'device-enable',
    DAQ_QUERY = 'daq-query',
    DAQ_RESULT = 'daq-result',
    DAQ_ERROR = 'daq-error',
    ALARMS_STATUS = 'alarms-status',
    HOST_INTERFACES = 'host-interfaces',
    SCRIPT_CONSOLE = 'script-console',
    SCRIPT_COMMAND = 'script-command',
    ALIVE = 'heartbeat',
    SCHEDULER_UPDATED = 'scheduler:updated',
    SCHEDULER_ACTIVE = 'scheduler:event-active',
    SCHEDULER_REMAINING = 'scheduler:remaining-time'
}

/**
 * Maps views to their signals and gauge settings
 * Used to track which gauges are bound to which signals in each view
 */
export class ViewSignalGaugeMap {
    views: { [domViewId: string]: { [signalId: string]: GaugeSettings[] } } = {};

    /**
     * Add a gauge setting for a signal in a view
     */
    public add(domViewId: string, signalId: string, ga: GaugeSettings): boolean {
        if (!this.views[domViewId]) {
            this.views[domViewId] = {};
        }
        if (!this.views[domViewId][signalId]) {
            this.views[domViewId][signalId] = [];
        }
        this.views[domViewId][signalId].push(ga);
        return true;
    }

    /**
     * Remove all gauge mappings for a view
     */
    public remove(domViewId: string): void {
        delete this.views[domViewId];
    }

    /**
     * Get all gauge settings for a signal in a view
     */
    public signalsGauges(domViewId: string, sigid: string): GaugeSettings[] {
        if (this.views[domViewId] && this.views[domViewId][sigid]) {
            return this.views[domViewId][sigid];
        }
        return [];
    }

    /**
     * Get all signal IDs mapped in a view
     */
    public getSignalIds(domViewId: string): string[] {
        let result: string[] = [];
        if (this.views[domViewId]) {
            result = Object.keys(this.views[domViewId]);
        }
        return result;
    }

    /**
     * Get all signal IDs across all views
     */
    public getAllSignalIds(): string[] {
        let result: string[] = [];
        Object.values(this.views).forEach(evi => {
            Object.keys(evi).forEach(key => {
                if (result.indexOf(key) === -1) {
                    result.push(key);
                }
            });
        });
        return result;
    }
}

/**
 * HMI Service - manages signal-gauge mapping and variable state
 */
export class HmiService {
    // Event emitters
    onVariableChanged: EventEmitter<Variable> = new EventEmitter();
    onDeviceChanged: EventEmitter<boolean> = new EventEmitter();
    onDeviceBrowse: EventEmitter<any> = new EventEmitter();
    onDeviceNodeAttribute: EventEmitter<any> = new EventEmitter();
    onDaqResult: EventEmitter<DaqResult> = new EventEmitter();
    onDeviceProperty: EventEmitter<any> = new EventEmitter();
    onHostInterfaces: EventEmitter<any> = new EventEmitter();
    onAlarmsStatus: EventEmitter<AlarmStatus> = new EventEmitter();
    onDeviceWebApiRequest: EventEmitter<any> = new EventEmitter();
    onDeviceTagsRequest: EventEmitter<any> = new EventEmitter();
    onScriptConsole: EventEmitter<any> = new EventEmitter();
    onGoTo: EventEmitter<ScriptSetView> = new EventEmitter();
    onOpen: EventEmitter<ScriptOpenCard> = new EventEmitter();
    onSchedulerUpdated: EventEmitter<any> = new EventEmitter();
    onSchedulerEventActive: EventEmitter<any> = new EventEmitter();
    onSchedulerRemainingTime: EventEmitter<any> = new EventEmitter();
    onGaugeEvent: EventEmitter<any> = new EventEmitter();
    onServerConnection: EventEmitter<boolean> = new EventEmitter();

    public static separator = '^~^';
    public hmi: any;
    viewSignalGaugeMap = new ViewSignalGaugeMap();
    variables: { [id: string]: Variable } = {};
    alarms = { highhigh: 0, high: 0, low: 0, info: 0 };

    private projectService: IProjectService | null = null;
    private deviceAdapterService: IDeviceAdapterService | null = null;

    private addFunctionType: string;
    private removeFunctionType: string;
    private homeTagsSubscription: string[] = [];
    private viewsTagsSubscription: string[] = [];

    // Function bound by GaugesManager
    getGaugeMapped: ((gaugeName: string) => any) | undefined = undefined;

    constructor() {
        this.addFunctionType = Utils.getEnumKey(GaugeEventSetValueType, GaugeEventSetValueType.add) || 'add';
        this.removeFunctionType = Utils.getEnumKey(GaugeEventSetValueType, GaugeEventSetValueType.remove) || 'remove';
    }

    /**
     * Initialize the service with dependencies
     */
    init(projectService: IProjectService, deviceAdapterService?: IDeviceAdapterService): void {
        this.projectService = projectService;
        this.deviceAdapterService = deviceAdapterService || null;

        // Load HMI from project service
        if (this.projectService) {
            this.hmi = this.projectService.getHmi();
        }
    }

    /**
     * Set signal value in current frontend signal array
     * Called when value comes from backend
     */
    setSignalValue(sig: Variable): void {
        // notify the gui
        this.onVariableChanged.emit(sig);
    }

    /**
     * Set signal value - for sending to backend
     * Value input in frontend
     */
    putSignalValue(sigId: string, value: string, fnc: string | null = null): void {
        // Resolve adapter tags if device adapter service is available
        if (this.deviceAdapterService) {
            sigId = this.deviceAdapterService.resolveAdapterTagsId([sigId])[0];
        }
        
        if (!this.variables[sigId]) {
            this.variables[sigId] = new Variable(sigId, '', undefined);
        }
        this.variables[sigId].value = this.getValueInFunction(this.variables[sigId].value, value, fnc);
        
        // Get device info
        if (this.projectService) {
            let device = this.projectService.getDeviceFromTagId(sigId);
            if (device) {
                (this.variables[sigId] as any)['source'] = device.id;
            }
        }

        // Update timestamp and emit
        this.variables[sigId].timestamp = new Date().getTime();
        this.setSignalValue(this.variables[sigId]);
    }

    /**
     * Get all signals
     */
    public getAllSignals(): { [id: string]: Variable } {
        return this.variables;
    }

    /**
     * Initialize signal values from a map
     */
    public initSignalValues(sigIds: Record<string, string>): void {
        for (const [adapterId, deviceId] of Object.entries(sigIds)) {
            if (!Utils.isNullOrUndefined(this.variables[adapterId])) {
                this.variables[adapterId].value = this.variables[deviceId]?.value ?? '';
            }
        }
    }

    /**
     * Return the value calculated with the function if defined
     */
    private getValueInFunction(current: any, value: string, fnc: string | null): any {
        try {
            if (!fnc) { return value; }
            if (!current) {
                current = 0;
            }
            if (fnc === this.addFunctionType) {
                return parseFloat(current) + parseFloat(value);
            } else if (fnc === this.removeFunctionType) {
                return parseFloat(current) - parseFloat(value);
            }
        } catch (err) {
            console.error(err);
        }
        return value;
    }

    /**
     * Called when device values are received (from ThingsBoard subscription)
     */
    public onDeviceValues(tags: Variable[]): void {
        for (let idx = 0; idx < tags.length; idx++) {
            let varid = tags[idx].id;
            if (!this.variables[varid]) {
                this.variables[varid] = new Variable(varid, '', undefined);
            }
            this.variables[varid].value = tags[idx].value;
            this.variables[varid].error = tags[idx].error;
            this.setSignalValue(this.variables[varid]);
        }
    }

    /**
     * Update a single variable value
     */
    public updateVariable(id: string, value: any, timestamp?: number): void {
        if (Utils.isNullOrUndefined(this.variables[id])) {
            this.variables[id] = new Variable(id, '', undefined);
        }
        this.variables[id].value = value;
        this.variables[id].timestamp = timestamp || new Date().getTime();
        this.setSignalValue(this.variables[id]);

        // Handle adapter resolution
        if (this.deviceAdapterService) {
            const adapterIds = this.deviceAdapterService.resolveDeviceTagIdForAdapter(id);
            if (adapterIds?.length) {
                adapterIds.forEach(adapterId => {
                    if (Utils.isNullOrUndefined(this.variables[adapterId])) {
                        this.variables[adapterId] = new Variable(adapterId, '', undefined);
                    }
                    this.variables[adapterId].value = value;
                    this.variables[adapterId].timestamp = timestamp || new Date().getTime();
                    this.setSignalValue(this.variables[adapterId]);
                });
            }
        }
    }

    /**
     * Emit all mapped signals for a view
     */
    public emitMappedSignalsGauge(domViewId: string): void {
        let sigsToEmit = this.viewSignalGaugeMap.getSignalIds(domViewId);
        for (let idx = 0; idx < sigsToEmit.length; idx++) {
            if (this.variables[sigsToEmit[idx]]) {
                this.setSignalValue(this.variables[sigsToEmit[idx]]);
            }
        }
    }

    //#region Signals Gauges Mapping

    /**
     * Add a signal to the variables list
     */
    addSignal(signalId: string): void {
        if (!this.variables[signalId]) {
            let device = this.projectService ? this.projectService.getDeviceFromTagId(signalId) : null;
            this.variables[signalId] = new Variable(signalId, '', device || undefined);
        }
    }

    /**
     * Map the dom view with signal and gauge settings
     */
    addSignalGaugeToMap(domViewId: string, signalId: string, ga: GaugeSettings): void {
        this.viewSignalGaugeMap.add(domViewId, signalId, ga);
        // add to variable list
        if (!this.variables[signalId]) {
            let device = this.projectService ? this.projectService.getDeviceFromTagId(signalId) : null;
            this.variables[signalId] = new Variable(signalId, '', device || undefined);
        }
    }

    /**
     * Remove mapped dom view Gauges
     * @returns the removed gauge settings id list with signal id binded
     */
    removeSignalGaugeFromMap(domViewId: string): { [sigid: string]: string[] } {
        let sigsIdremoved = this.viewSignalGaugeMap.getSignalIds(domViewId);
        let result: { [sigid: string]: string[] } = {};
        sigsIdremoved.forEach(sigid => {
            let gaugesSettings: GaugeSettings[] = this.viewSignalGaugeMap.signalsGauges(domViewId, sigid);
            if (gaugesSettings) {
                result[sigid] = gaugesSettings.map(gs => gs.id);
            }
        });
        this.viewSignalGaugeMap.remove(domViewId);
        return result;
    }

    /**
     * Get the gauges settings list of mapped dom view with the signal
     */
    getMappedSignalsGauges(domViewId: string, sigid: string): GaugeSettings[] {
        return this.viewSignalGaugeMap.signalsGauges(domViewId, sigid);
    }

    /**
     * Get all signals property mapped in all dom views
     * @param fulltext a copy with item name and source
     */
    getMappedVariables(fulltext: boolean): Variable[] {
        let result: Variable[] = [];
        this.viewSignalGaugeMap.getAllSignalIds().forEach(sigid => {
            if (this.variables[sigid]) {
                let toadd = this.variables[sigid];
                if (fulltext && this.projectService) {
                    toadd = Object.assign({}, this.variables[sigid]);
                    let device = this.projectService.getDeviceFromTagId(toadd.id);
                    if (device) {
                        (toadd as any)['source'] = device.name;
                        if (device.tags && device.tags[toadd.id]) {
                            (toadd as any)['name'] = this.getTagLabel(device.tags[toadd.id]);
                        }
                    }
                }
                result.push(toadd);
            }
        });
        return result;
    }

    /**
     * Get signal property, complete the signal property with device tag property
     */
    getMappedVariable(sigid: string, fulltext: boolean): Variable | null {
        if (!this.variables[sigid]) { return null; }

        let result = this.variables[sigid];
        if (fulltext && this.projectService) {
            result = Object.assign({}, this.variables[sigid]);
            let device = this.projectService.getDeviceFromTagId(result.id);
            if (device) {
                (result as any)['source'] = device.name;
                if (device.tags && device.tags[result.id]) {
                    (result as any)['name'] = this.getTagLabel(device.tags[result.id]);
                }
            }
        }
        return result;
    }

    /**
     * Get tag label - prefer label over name
     */
    private getTagLabel(tag: Tag): string {
        if (tag.label) {
            return tag.label;
        } else {
            return tag.name;
        }
    }

    //#endregion

    //#region Chart and Graph functions

    /**
     * Get chart by ID
     */
    getChart(id: string): any {
        return this.projectService ? this.projectService.getChart(id) : null;
    }

    /**
     * Get chart signal IDs
     */
    getChartSignal(id: string): string[] | undefined {
        let chart = this.projectService ? this.projectService.getChart(id) : null;
        if (chart) {
            let varsId: string[] = [];
            chart.lines.forEach((line: any) => {
                varsId.push(line.id);
            });
            return varsId;
        }
        return undefined;
    }

    /**
     * Get graph by ID
     */
    getGraph(id: string): any {
        return this.projectService ? this.projectService.getGraph(id) : null;
    }

    /**
     * Get graph signal IDs
     */
    getGraphSignal(id: string): string[] | undefined {
        let graph = this.projectService ? this.projectService.getGraph(id) : null;
        if (graph) {
            let varsId: string[] = [];
            graph.sources.forEach((source: any) => {
                varsId.push(source.id);
            });
            return varsId;
        }
        return undefined;
    }

    //#endregion

    //#region Current Alarms functions

    /**
     * Get current alarm values
     */
    getAlarmsValues(alarmFilter?: AlarmsFilter): Promise<any> | null {
        return this.projectService ? this.projectService.getAlarmsValues(alarmFilter) : null;
    }

    /**
     * Get alarm history
     */
    getAlarmsHistory(query: AlarmQuery): Promise<any> | null {
        return this.projectService ? this.projectService.getAlarmsHistory(query) : null;
    }

    /**
     * Set alarm acknowledgement
     */
    setAlarmAck(alarmName: string): Promise<any> | null {
        return this.projectService ? this.projectService.setAlarmAck(alarmName) : null;
    }

    //#endregion

    //#region DAQ functions served from project service

    /**
     * Query DAQ values - sends request and emits result via onDaqResult
     */
    queryDaqValues(query: DaqQuery): void {
        if (this.projectService) {
            this.projectService.getDaqValues(query).then((result: DaqResult) => {
                this.onDaqResult.emit(result);
            }).catch((err: any) => {
                console.error('queryDaqValues error:', err);
            });
        }
    }

    /**
     * Get DAQ values - returns promise
     */
    getDaqValues(query: DaqQuery): { subscribe: (success: (result: any) => void, error: (err: any) => void) => void } {
        const self = this;
        return {
            subscribe: (success: (result: any) => void, error: (err: any) => void) => {
                if (self.projectService) {
                    self.projectService.getDaqValues(query).then(success).catch(error);
                } else {
                    error(new Error('Project service not initialized'));
                }
            }
        };
    }

    //#endregion

    //#region Scheduler functions served from project service

    /**
     * Ask scheduler data
     */
    askSchedulerData(id: string): Promise<any> | null {
        return this.projectService ? this.projectService.getSchedulerData(id) : null;
    }

    /**
     * Set scheduler data
     */
    setSchedulerData(id: string, data: any): Promise<any> | null {
        return this.projectService ? this.projectService.setSchedulerData(id, data) : null;
    }

    /**
     * Delete scheduler data
     */
    deleteSchedulerData(id: string): Promise<any> | null {
        return this.projectService ? this.projectService.deleteSchedulerData(id) : null;
    }

    //#endregion

    //#region Tag subscription management (for ThingsBoard integration)

    /**
     * Get all subscribed tags
     */
    public getSubscribedTags(): string[] {
        const mergedArray = this.viewsTagsSubscription.concat(this.homeTagsSubscription);
        if (this.deviceAdapterService) {
            return this.deviceAdapterService.resolveAdapterTagsId(mergedArray);
        }
        return [...new Set(mergedArray)];
    }

    /**
     * Set views tags subscription
     */
    public viewsTagsSubscribe(tagsId: string[]): void {
        this.viewsTagsSubscription = tagsId;
    }

    /**
     * Set home tags subscription
     */
    public homeTagsSubscribe(tagsId: string[]): void {
        this.homeTagsSubscription = tagsId;
    }

    //#endregion

    //#region Script command handling

    /**
     * Handle script command
     */
    public onScriptCommand(message: ScriptCommandMessage): void {
        if (message.params && message.params.length) {
            switch (message.command) {
                case ScriptCommandEnum.SETVIEW:
                    this.onGoTo.emit({ viewName: message.params[0], force: message.params[1] } as ScriptSetView);
                    break;
                case ScriptCommandEnum.OPENCARD:
                    this.onOpen.emit({ viewName: message.params[0], options: message.params[1] } as ScriptOpenCard);
                    break;
                default:
                    break;
            }
        }
    }

    //#endregion

    //#region Static functions

    /**
     * Create a variable ID from source and name
     */
    public static toVariableId(src: string, name: string): string {
        return src + HmiService.separator + name;
    }

    //#endregion

    /**
     * Clear all variables and mappings
     */
    public clear(): void {
        this.variables = {};
        this.viewSignalGaugeMap = new ViewSignalGaugeMap();
        this.homeTagsSubscription = [];
        this.viewsTagsSubscription = [];
    }

    /**
     * Get variable value by ID
     */
    public getVariableValue(sigId: string): any {
        if (this.variables[sigId]) {
            return this.variables[sigId].value;
        }
        return null;
    }

    /**
     * Check if variable exists
     */
    public hasVariable(sigId: string): boolean {
        return !!this.variables[sigId];
    }
}
