/**
 * TB Industrial Widgets - Main Entry Point
 * 
 * This is the main entry point for the ThingsBoard Industrial Widgets library.
 * It exports all FUXA core functionality for use in ThingsBoard widgets.
 */

// Export all FUXA core modules
export * from './fuxa-core';

// Re-export commonly used types for convenience
export {
    // Models
    View,
    ViewProperty,
    ViewType,
    Hmi,
    GaugeSettings,
    GaugeProperty,
    GaugeStatus,
    GaugeEvent,
    GaugeEventType,
    GaugeEventActionType,
    Variable,
    Event,
    
    // Services
    HmiService,
    ViewSignalGaugeMap,
    
    // Gauges Manager
    GaugesManager,
    
    // View Renderer
    FuxaView,
    CardModel,
    
    // Helpers
    Utils,
    
    // Gauge Components
    GaugeBaseComponent,
    ValueComponent,
    HtmlInputComponent,
    HtmlSelectComponent,
    HtmlButtonComponent,
    HtmlSwitchComponent,
    GaugeSemaphoreComponent,
    
} from './fuxa-core';

/**
 * Version information
 */
export const VERSION = '0.1.0';

/**
 * Library name
 */
export const NAME = 'tb-industrial-widgets';
