/**
 * V10.1: ThingsBoard Data Adapter
 * 
 * Converts ThingsBoard data format to FUXA signal format.
 * Handles:
 * - Telemetry data subscription
 * - Attribute data subscription
 * - Data key mapping
 * - Value transformation
 */

import { Variable } from '../fuxa-core/models/hmi';
import { HmiService } from '../fuxa-core/services/hmi-service';
import { EventEmitter } from '../fuxa-core/lib/event-emitter';

/**
 * ThingsBoard data key structure
 */
export interface TBDataKey {
    name: string;
    type: 'timeseries' | 'attribute' | 'function' | 'alarm';
    label?: string;
    color?: string;
    settings?: any;
    _hash?: number;
    aggregationType?: string;
    units?: string;
    decimals?: number;
}

/**
 * ThingsBoard data entry (single key data)
 */
export interface TBDataEntry {
    dataKey: TBDataKey;
    data: Array<[number, any]>;  // [timestamp, value][]
}

/**
 * ThingsBoard subscription data
 */
export interface TBSubscriptionData {
    data: TBDataEntry[];
}

/**
 * ThingsBoard Widget Context (partial interface)
 */
export interface TBWidgetContext {
    $container?: HTMLElement[];
    $scope?: any;
    width?: number;
    height?: number;
    settings?: {
        scadaConfig?: any;
        [key: string]: any;
    };
    datasources?: any[];
    data?: TBDataEntry[];
    defaultSubscription?: TBSubscriptionData;
    subscriptions?: { [id: string]: TBSubscriptionData };
    timewindowFunctions?: any;
    controlApi?: any;
    actionsApi?: any;
    stateController?: any;
    detectChanges?: () => void;
    updateWidgetParams?: () => void;
    dashboard?: {
        isDarkTheme?: boolean;
    };
}

/**
 * Data mapping configuration
 */
export interface DataMappingConfig {
    /** ThingsBoard data key name */
    tbKey: string;
    /** FUXA variable ID */
    fuxaVariableId: string;
    /** Optional value transformation function */
    transform?: (value: any) => any;
    /** Default value when data is not available */
    defaultValue?: any;
}

/**
 * Adapter options
 */
export interface TBDataAdapterOptions {
    /** Data mapping configurations */
    mappings?: DataMappingConfig[];
    /** Auto-map TB keys to FUXA variables with same name */
    autoMap?: boolean;
    /** Debug mode - log all data updates */
    debug?: boolean;
}

/**
 * ThingsBoard Data Adapter
 * 
 * Bridges ThingsBoard data subscriptions to FUXA HmiService signals
 */
export class TBDataAdapter {
    // Events
    onDataReceived: EventEmitter<TBDataEntry[]> = new EventEmitter();
    onError: EventEmitter<Error> = new EventEmitter();

    // State
    private hmiService: HmiService | null = null;
    private ctx: TBWidgetContext | null = null;
    private options: TBDataAdapterOptions;
    private mappings: Map<string, DataMappingConfig> = new Map();
    private lastValues: Map<string, any> = new Map();
    private initialized: boolean = false;

    constructor(options: TBDataAdapterOptions = {}) {
        this.options = {
            autoMap: true,
            debug: false,
            ...options
        };

        // Initialize mappings from options
        if (options.mappings) {
            options.mappings.forEach(mapping => {
                this.mappings.set(mapping.tbKey, mapping);
            });
        }
    }

    /**
     * Initialize the adapter with TB context and HmiService
     */
    init(ctx: TBWidgetContext, hmiService: HmiService): void {
        this.ctx = ctx;
        this.hmiService = hmiService;
        this.initialized = true;

        if (this.options.debug) {
            console.log('[TBDataAdapter] Initialized');
        }
    }

    /**
     * Add a data mapping
     */
    addMapping(mapping: DataMappingConfig): void {
        this.mappings.set(mapping.tbKey, mapping);
    }

    /**
     * Remove a data mapping
     */
    removeMapping(tbKey: string): void {
        this.mappings.delete(tbKey);
    }

    /**
     * Get all current mappings
     */
    getMappings(): DataMappingConfig[] {
        return Array.from(this.mappings.values());
    }

    /**
     * Process data update from ThingsBoard
     * Call this from widget's onDataUpdated()
     */
    processDataUpdate(data?: TBDataEntry[]): void {
        if (!this.initialized || !this.hmiService) {
            console.warn('[TBDataAdapter] Not initialized');
            return;
        }

        // Use provided data or get from context
        const dataEntries = data || this.ctx?.defaultSubscription?.data || [];

        if (this.options.debug) {
            console.log('[TBDataAdapter] Processing', dataEntries.length, 'data entries');
        }

        // Emit raw data event
        this.onDataReceived.emit(dataEntries);

        // Process each data entry
        dataEntries.forEach(entry => {
            this.processDataEntry(entry);
        });
    }

    /**
     * Process a single data entry
     */
    private processDataEntry(entry: TBDataEntry): void {
        if (!entry.dataKey || !entry.data || entry.data.length === 0) {
            return;
        }

        const keyName = entry.dataKey.name;
        const latestData = entry.data[entry.data.length - 1];
        const timestamp = latestData[0];
        let value = latestData[1];

        // Check for explicit mapping
        const mapping = this.mappings.get(keyName);
        
        if (mapping) {
            // Apply transformation if defined
            if (mapping.transform) {
                try {
                    value = mapping.transform(value);
                } catch (err) {
                    console.error('[TBDataAdapter] Transform error for', keyName, err);
                    if (mapping.defaultValue !== undefined) {
                        value = mapping.defaultValue;
                    }
                }
            }

            // Send to FUXA with mapped variable ID
            this.sendSignal(mapping.fuxaVariableId, value, timestamp);
        } else if (this.options.autoMap) {
            // Auto-map: use TB key name as FUXA variable ID
            this.sendSignal(keyName, value, timestamp);
        }
    }

    /**
     * Send signal to HmiService
     */
    private sendSignal(variableId: string, value: any, timestamp?: number): void {
        if (!this.hmiService) return;

        // Check if value has changed (optional optimization)
        const lastValue = this.lastValues.get(variableId);
        if (lastValue === value) {
            return; // Skip if value hasn't changed
        }
        this.lastValues.set(variableId, value);

        // Create FUXA Variable
        const signal = new Variable(variableId, variableId, undefined);
        signal.value = value;
        signal.timestamp = timestamp || Date.now();

        if (this.options.debug) {
            console.log('[TBDataAdapter] Signal:', variableId, '=', value);
        }

        // Send to HmiService
        this.hmiService.setSignalValue(signal);
    }

    /**
     * Get latest value for a TB key
     */
    getLatestValue(tbKey: string): any {
        const mapping = this.mappings.get(tbKey);
        const variableId = mapping?.fuxaVariableId || tbKey;
        return this.lastValues.get(variableId);
    }

    /**
     * Get all latest values
     */
    getAllLatestValues(): Map<string, any> {
        return new Map(this.lastValues);
    }

    /**
     * Manually set a value (for testing or manual override)
     */
    setValue(variableId: string, value: any): void {
        this.sendSignal(variableId, value, Date.now());
    }

    /**
     * Get data keys from TB context
     */
    getDataKeys(): TBDataKey[] {
        const keys: TBDataKey[] = [];
        
        if (this.ctx?.defaultSubscription?.data) {
            this.ctx.defaultSubscription.data.forEach(entry => {
                if (entry.dataKey) {
                    keys.push(entry.dataKey);
                }
            });
        }

        return keys;
    }

    /**
     * Check if a data key exists in the subscription
     */
    hasDataKey(keyName: string): boolean {
        return this.getDataKeys().some(key => key.name === keyName);
    }

    /**
     * Get historical data for a key
     */
    getHistoricalData(keyName: string): Array<[number, any]> {
        if (!this.ctx?.defaultSubscription?.data) {
            return [];
        }

        const entry = this.ctx.defaultSubscription.data.find(
            e => e.dataKey?.name === keyName
        );

        return entry?.data || [];
    }

    /**
     * Clear all cached values
     */
    clearCache(): void {
        this.lastValues.clear();
    }

    /**
     * Destroy the adapter
     */
    destroy(): void {
        this.clearCache();
        this.mappings.clear();
        this.onDataReceived.unsubscribeAll();
        this.onError.unsubscribeAll();
        this.hmiService = null;
        this.ctx = null;
        this.initialized = false;

        if (this.options.debug) {
            console.log('[TBDataAdapter] Destroyed');
        }
    }
}

/**
 * Create a data adapter with common configurations
 */
export function createDataAdapter(options?: TBDataAdapterOptions): TBDataAdapter {
    return new TBDataAdapter(options);
}

/**
 * Helper function to extract value from TB data entry
 */
export function extractLatestValue(entry: TBDataEntry): any {
    if (!entry.data || entry.data.length === 0) {
        return undefined;
    }
    return entry.data[entry.data.length - 1][1];
}

/**
 * Helper function to extract timestamp from TB data entry
 */
export function extractLatestTimestamp(entry: TBDataEntry): number | undefined {
    if (!entry.data || entry.data.length === 0) {
        return undefined;
    }
    return entry.data[entry.data.length - 1][0];
}
