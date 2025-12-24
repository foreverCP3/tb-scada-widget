/**
 * V10.2: ThingsBoard RPC Adapter
 * 
 * Handles RPC commands between FUXA widgets and ThingsBoard devices.
 * Supports:
 * - One-way RPC commands (fire and forget)
 * - Two-way RPC commands (request/response)
 * - Command queue management
 * - Timeout handling
 * - Response callbacks
 */

import { EventEmitter } from '../fuxa-core/lib/event-emitter';

/**
 * RPC command types
 */
export type RpcCommandType = 'oneWay' | 'twoWay';

/**
 * RPC command structure
 */
export interface RpcCommand {
    /** RPC method name */
    method: string;
    /** RPC parameters */
    params: any;
    /** Command type */
    type: RpcCommandType;
    /** Timeout in milliseconds (default: 5000) */
    timeout?: number;
    /** Target device ID (optional, for multi-device scenarios) */
    targetDeviceId?: string;
}

/**
 * RPC response structure
 */
export interface RpcResponse {
    /** Whether the command succeeded */
    success: boolean;
    /** Response data */
    data?: any;
    /** Error message if failed */
    error?: string;
    /** Original command */
    command: RpcCommand;
    /** Response timestamp */
    timestamp: number;
}

/**
 * Pending RPC request tracking
 */
interface PendingRequest {
    command: RpcCommand;
    resolve: (response: RpcResponse) => void;
    reject: (error: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * ThingsBoard Control API interface (from widget context)
 */
export interface TBControlApi {
    sendOneWayCommand: (method: string, params?: any, timeout?: number) => Promise<void>;
    sendTwoWayCommand: (method: string, params?: any, timeout?: number) => Promise<any>;
    completedCommand?: () => void;
}

/**
 * ThingsBoard Widget Context (partial, RPC-related)
 */
export interface TBWidgetContextForRpc {
    controlApi?: TBControlApi;
    actionsApi?: {
        handleWidgetAction: (event: any, descriptor: any, ...args: any[]) => void;
    };
}

/**
 * Adapter options
 */
export interface TBRpcAdapterOptions {
    /** Default timeout for RPC commands (ms) */
    defaultTimeout?: number;
    /** Maximum number of concurrent pending requests */
    maxPendingRequests?: number;
    /** Retry failed commands automatically */
    autoRetry?: boolean;
    /** Number of retry attempts */
    retryCount?: number;
    /** Debug mode */
    debug?: boolean;
}

/**
 * ThingsBoard RPC Adapter
 * 
 * Provides a clean interface for sending RPC commands to devices
 */
export class TBRpcAdapter {
    // Events
    onCommandSent: EventEmitter<RpcCommand> = new EventEmitter();
    onResponseReceived: EventEmitter<RpcResponse> = new EventEmitter();
    onError: EventEmitter<{ command: RpcCommand; error: Error }> = new EventEmitter();

    // State
    private ctx: TBWidgetContextForRpc | null = null;
    private options: Required<TBRpcAdapterOptions>;
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private commandCounter: number = 0;
    private initialized: boolean = false;

    constructor(options: TBRpcAdapterOptions = {}) {
        this.options = {
            defaultTimeout: 5000,
            maxPendingRequests: 10,
            autoRetry: false,
            retryCount: 3,
            debug: false,
            ...options
        };
    }

    /**
     * Initialize the adapter with TB widget context
     */
    init(ctx: TBWidgetContextForRpc): void {
        this.ctx = ctx;
        this.initialized = true;

        if (!ctx.controlApi) {
            console.warn('[TBRpcAdapter] No controlApi found in context');
        }

        if (this.options.debug) {
            console.log('[TBRpcAdapter] Initialized');
        }
    }

    /**
     * Check if RPC is available
     */
    isAvailable(): boolean {
        return this.initialized && !!this.ctx?.controlApi;
    }

    /**
     * Send a one-way RPC command (no response expected)
     */
    async sendOneWay(method: string, params?: any, timeout?: number): Promise<void> {
        const command: RpcCommand = {
            method,
            params: params || {},
            type: 'oneWay',
            timeout: timeout || this.options.defaultTimeout
        };

        await this.executeCommand(command);
    }

    /**
     * Send a two-way RPC command (response expected)
     */
    async sendTwoWay<T = any>(method: string, params?: any, timeout?: number): Promise<T> {
        const command: RpcCommand = {
            method,
            params: params || {},
            type: 'twoWay',
            timeout: timeout || this.options.defaultTimeout
        };

        const response = await this.executeCommand(command);
        return response.data as T;
    }

    /**
     * Send a generic RPC command
     */
    async send(command: RpcCommand): Promise<RpcResponse> {
        return this.executeCommand(command);
    }

    /**
     * Execute an RPC command
     */
    private async executeCommand(command: RpcCommand): Promise<RpcResponse> {
        if (!this.isAvailable()) {
            const error = new Error('RPC not available - controlApi not found');
            this.onError.emit({ command, error });
            throw error;
        }

        // Check pending request limit
        if (this.pendingRequests.size >= this.options.maxPendingRequests) {
            const error = new Error('Too many pending RPC requests');
            this.onError.emit({ command, error });
            throw error;
        }

        const commandId = this.generateCommandId();
        const timeout = command.timeout || this.options.defaultTimeout;

        if (this.options.debug) {
            console.log('[TBRpcAdapter] Sending command:', command.method, command.params);
        }

        // Emit command sent event
        this.onCommandSent.emit(command);

        try {
            let result: any;

            if (command.type === 'oneWay') {
                await this.ctx!.controlApi!.sendOneWayCommand(
                    command.method,
                    command.params,
                    timeout
                );
                result = undefined;
            } else {
                result = await this.ctx!.controlApi!.sendTwoWayCommand(
                    command.method,
                    command.params,
                    timeout
                );
            }

            const response: RpcResponse = {
                success: true,
                data: result,
                command,
                timestamp: Date.now()
            };

            if (this.options.debug) {
                console.log('[TBRpcAdapter] Response:', response);
            }

            this.onResponseReceived.emit(response);
            return response;

        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            
            const response: RpcResponse = {
                success: false,
                error: error.message,
                command,
                timestamp: Date.now()
            };

            if (this.options.debug) {
                console.error('[TBRpcAdapter] Error:', error);
            }

            this.onError.emit({ command, error });
            this.onResponseReceived.emit(response);

            throw error;
        }
    }

    /**
     * Generate unique command ID
     */
    private generateCommandId(): string {
        return `rpc_${Date.now()}_${++this.commandCounter}`;
    }

    /**
     * Cancel all pending requests
     */
    cancelAll(): void {
        this.pendingRequests.forEach((request, id) => {
            clearTimeout(request.timeoutId);
            request.reject(new Error('Request cancelled'));
        });
        this.pendingRequests.clear();
    }

    /**
     * Get number of pending requests
     */
    getPendingCount(): number {
        return this.pendingRequests.size;
    }

    /**
     * Create a command builder for common operations
     */
    createCommandBuilder(): RpcCommandBuilder {
        return new RpcCommandBuilder(this);
    }

    /**
     * Destroy the adapter
     */
    destroy(): void {
        this.cancelAll();
        this.onCommandSent.unsubscribeAll();
        this.onResponseReceived.unsubscribeAll();
        this.onError.unsubscribeAll();
        this.ctx = null;
        this.initialized = false;

        if (this.options.debug) {
            console.log('[TBRpcAdapter] Destroyed');
        }
    }
}

/**
 * RPC Command Builder - Fluent API for building RPC commands
 */
export class RpcCommandBuilder {
    private adapter: TBRpcAdapter;
    private _method: string = '';
    private _params: any = {};
    private _timeout?: number;
    private _type: RpcCommandType = 'twoWay';

    constructor(adapter: TBRpcAdapter) {
        this.adapter = adapter;
    }

    /**
     * Set RPC method
     */
    method(name: string): this {
        this._method = name;
        return this;
    }

    /**
     * Set RPC parameters
     */
    params(data: any): this {
        this._params = data;
        return this;
    }

    /**
     * Add a single parameter
     */
    param(key: string, value: any): this {
        this._params[key] = value;
        return this;
    }

    /**
     * Set timeout
     */
    timeout(ms: number): this {
        this._timeout = ms;
        return this;
    }

    /**
     * Set as one-way command
     */
    oneWay(): this {
        this._type = 'oneWay';
        return this;
    }

    /**
     * Set as two-way command
     */
    twoWay(): this {
        this._type = 'twoWay';
        return this;
    }

    /**
     * Build and send the command
     */
    async send<T = any>(): Promise<RpcResponse> {
        const command: RpcCommand = {
            method: this._method,
            params: this._params,
            type: this._type,
            timeout: this._timeout
        };

        return this.adapter.send(command);
    }
}

/**
 * Create an RPC adapter with default options
 */
export function createRpcAdapter(options?: TBRpcAdapterOptions): TBRpcAdapter {
    return new TBRpcAdapter(options);
}

/**
 * Common RPC method names used in industrial automation
 */
export const CommonRpcMethods = {
    // Value control
    SET_VALUE: 'setValue',
    GET_VALUE: 'getValue',
    TOGGLE_VALUE: 'toggleValue',
    
    // Device control
    START: 'start',
    STOP: 'stop',
    RESET: 'reset',
    ENABLE: 'enable',
    DISABLE: 'disable',
    
    // Valve control
    OPEN_VALVE: 'openValve',
    CLOSE_VALVE: 'closeValve',
    SET_VALVE_POSITION: 'setValvePosition',
    
    // Motor/Pump control
    START_MOTOR: 'startMotor',
    STOP_MOTOR: 'stopMotor',
    SET_SPEED: 'setSpeed',
    
    // Setpoint control
    SET_SETPOINT: 'setSetpoint',
    GET_SETPOINT: 'getSetpoint',
    
    // Alarm control
    ACK_ALARM: 'ackAlarm',
    CLEAR_ALARM: 'clearAlarm',
    
    // General
    GET_STATE: 'getState',
    GET_STATUS: 'getStatus',
    EXECUTE_COMMAND: 'executeCommand'
} as const;
