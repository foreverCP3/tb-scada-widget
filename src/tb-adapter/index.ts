/**
 * V10: ThingsBoard Adapter Module
 * 
 * Provides integration between FUXA Core and ThingsBoard widgets.
 */

// Data Adapter
export {
    TBDataAdapter,
    createDataAdapter,
    extractLatestValue,
    extractLatestTimestamp
} from './tb-data-adapter';

export type {
    TBDataKey,
    TBDataEntry,
    TBSubscriptionData,
    TBWidgetContext,
    DataMappingConfig,
    TBDataAdapterOptions
} from './tb-data-adapter';

// RPC Adapter
export {
    TBRpcAdapter,
    RpcCommandBuilder,
    createRpcAdapter,
    CommonRpcMethods
} from './tb-rpc-adapter';

export type {
    RpcCommandType,
    RpcCommand,
    RpcResponse,
    TBControlApi,
    TBWidgetContextForRpc,
    TBRpcAdapterOptions
} from './tb-rpc-adapter';

// Re-export SCADA Viewer Widget from widgets module
export {
    ScadaViewerWidget,
    createScadaViewerWidget,
    createWidgetSelf
} from '../widgets';

export type {
    ScadaViewConfig,
    ScadaViewerSettings,
    ScadaViewerContext
} from '../widgets';
