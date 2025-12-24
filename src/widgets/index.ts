/**
 * Widgets Module
 * 
 * Contains all ThingsBoard widget implementations.
 */

// SCADA Viewer Widget
export {
    ScadaViewerWidget,
    createScadaViewerWidget,
    createWidgetSelf
} from './scada-viewer-widget';

export type {
    ScadaViewConfig,
    ScadaViewerSettings,
    ScadaViewerContext
} from './scada-viewer-widget';
