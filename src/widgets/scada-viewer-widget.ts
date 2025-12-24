/**
 * V10.3 & V10.4: SCADA Viewer Widget Entry Point
 * 
 * This is the main entry point for the SCADA Viewer widget in ThingsBoard.
 * It handles:
 * - Widget lifecycle (onInit, onDataUpdated, onResize, onDestroy)
 * - Integration with TB data subscriptions
 * - Integration with TB RPC API
 * - Theme management
 * - FUXA View rendering
 */

import { GaugesManager } from '../fuxa-core/gauges/gauges-manager';
import { HmiService } from '../fuxa-core/services/hmi-service';
import { FuxaView, IProjectServiceForView } from '../fuxa-core/views/fuxa-view';
import { View, Hmi, GaugeSettings, GaugeProperty } from '../fuxa-core/models/hmi';
import { Tag } from '../fuxa-core/models/device';
import { ThemeManager, createThemeManager } from '../fuxa-core/theme/theme-manager';
import { TBDataAdapter, TBWidgetContext, createDataAdapter } from '../tb-adapter/tb-data-adapter';
import { TBRpcAdapter, createRpcAdapter, CommonRpcMethods } from '../tb-adapter/tb-rpc-adapter';

/**
 * SCADA View configuration (from widget settings)
 */
export interface ScadaViewConfig {
    /** View ID */
    id?: string;
    /** View name */
    name?: string;
    /** SVG content */
    svgcontent: string;
    /** View type */
    type?: string;
    /** View width */
    width?: number;
    /** View height */
    height?: number;
    /** Background color */
    backgroundColor?: string;
    /** Gauge items configuration */
    items?: { [id: string]: any };
}

/**
 * Widget settings interface
 */
export interface ScadaViewerSettings {
    /** SCADA configuration */
    scadaConfig?: {
        view?: ScadaViewConfig;
        renderOptions?: {
            scaleMode?: 'contain' | 'stretch' | 'none';
            enableAnimation?: boolean;
            enableInteraction?: boolean;
            debug?: boolean;
        };
    };
    /** Theme settings */
    theme?: 'light' | 'dark' | 'auto';
    /** Custom colors */
    customColors?: {
        primary?: string;
        accent?: string;
        [key: string]: string | undefined;
    };
    /** Debug mode */
    debug?: boolean;
}

/**
 * Extended TB Widget Context with our settings
 */
export interface ScadaViewerContext extends TBWidgetContext {
    settings?: ScadaViewerSettings;
}

/**
 * Widget instance state
 */
interface WidgetState {
    initialized: boolean;
    container: HTMLElement | null;
    viewContainer: HTMLElement | null;
    hmiService: HmiService | null;
    gaugesManager: GaugesManager | null;
    fuxaView: FuxaView | null;
    themeManager: ThemeManager | null;
    dataAdapter: TBDataAdapter | null;
    rpcAdapter: TBRpcAdapter | null;
    projectService: IProjectServiceForView | null;
    view: View | null;
    hmi: Hmi | null;
}

/**
 * SCADA Viewer Widget Class
 * 
 * Main widget implementation for ThingsBoard
 */
export class ScadaViewerWidget {
    private ctx: ScadaViewerContext;
    private state: WidgetState;
    private debug: boolean;

    constructor(ctx: ScadaViewerContext) {
        this.ctx = ctx;
        this.debug = ctx.settings?.debug || false;
        
        this.state = {
            initialized: false,
            container: null,
            viewContainer: null,
            hmiService: null,
            gaugesManager: null,
            fuxaView: null,
            themeManager: null,
            dataAdapter: null,
            rpcAdapter: null,
            projectService: null,
            view: null,
            hmi: null
        };
    }

    /**
     * Widget lifecycle: onInit
     * Called when the widget is first initialized
     */
    onInit(): void {
        if (this.debug) {
            console.log('[ScadaViewerWidget] onInit');
        }

        try {
            // Get container element
            this.state.container = this.ctx.$container?.[0] || null;
            if (!this.state.container) {
                throw new Error('Widget container not found');
            }

            // Initialize theme manager
            this.initThemeManager();

            // Initialize services
            this.initServices();

            // Initialize adapters
            this.initAdapters();

            // Load SCADA view
            this.loadScadaView();

            this.state.initialized = true;

            if (this.debug) {
                console.log('[ScadaViewerWidget] Initialization complete');
            }

        } catch (err) {
            console.error('[ScadaViewerWidget] Initialization error:', err);
            this.showError(err instanceof Error ? err.message : 'Initialization failed');
        }
    }

    /**
     * Widget lifecycle: onDataUpdated
     * Called when subscription data is updated
     */
    onDataUpdated(): void {
        if (!this.state.initialized || !this.state.dataAdapter) {
            return;
        }

        if (this.debug) {
            console.log('[ScadaViewerWidget] onDataUpdated');
        }

        // Process data through adapter
        this.state.dataAdapter.processDataUpdate();
    }

    /**
     * Widget lifecycle: onResize
     * Called when the widget is resized
     */
    onResize(): void {
        if (!this.state.initialized) {
            return;
        }

        if (this.debug) {
            console.log('[ScadaViewerWidget] onResize:', this.ctx.width, 'x', this.ctx.height);
        }

        // Notify FuxaView of resize
        if (this.state.fuxaView) {
            this.state.fuxaView.onResize();
        }
    }

    /**
     * Widget lifecycle: onDestroy
     * Called when the widget is destroyed
     */
    onDestroy(): void {
        if (this.debug) {
            console.log('[ScadaViewerWidget] onDestroy');
        }

        // Destroy FuxaView
        if (this.state.fuxaView) {
            this.state.fuxaView.destroy();
            this.state.fuxaView = null;
        }

        // Destroy adapters
        if (this.state.dataAdapter) {
            this.state.dataAdapter.destroy();
            this.state.dataAdapter = null;
        }

        if (this.state.rpcAdapter) {
            this.state.rpcAdapter.destroy();
            this.state.rpcAdapter = null;
        }

        // Destroy theme manager
        if (this.state.themeManager) {
            this.state.themeManager.destroy();
            this.state.themeManager = null;
        }

        // Clear other references
        this.state.hmiService = null;
        this.state.gaugesManager = null;
        this.state.projectService = null;
        this.state.view = null;
        this.state.hmi = null;
        this.state.container = null;
        this.state.viewContainer = null;
        this.state.initialized = false;
    }

    /**
     * Initialize theme manager
     */
    private initThemeManager(): void {
        this.state.themeManager = createThemeManager();
        this.state.themeManager.init(this.ctx, this.state.container!);

        // Add theme class to container
        this.state.container!.classList.add('tb-scada-widget');

        if (this.debug) {
            console.log('[ScadaViewerWidget] Theme initialized, isDark:', this.state.themeManager.isDark);
        }
    }

    /**
     * Initialize FUXA services
     */
    private initServices(): void {
        // Create HmiService
        this.state.hmiService = new HmiService();

        // Create GaugesManager and connect to HmiService
        this.state.gaugesManager = new GaugesManager();
        this.state.gaugesManager.init(this.state.hmiService);

        if (this.debug) {
            console.log('[ScadaViewerWidget] Services initialized');
            console.log('[ScadaViewerWidget] Registered gauges:', GaugesManager.Gauges.length);
        }
    }

    /**
     * Initialize TB adapters
     */
    private initAdapters(): void {
        // Create and initialize data adapter
        this.state.dataAdapter = createDataAdapter({
            autoMap: true,
            debug: this.debug
        });
        this.state.dataAdapter.init(this.ctx, this.state.hmiService!);

        // Create and initialize RPC adapter
        this.state.rpcAdapter = createRpcAdapter({
            debug: this.debug
        });
        this.state.rpcAdapter.init(this.ctx);

        // Connect RPC adapter to GaugesManager for gauge events
        this.connectRpcToGauges();

        if (this.debug) {
            console.log('[ScadaViewerWidget] Adapters initialized');
        }
    }

    /**
     * Connect RPC adapter to handle gauge events
     */
    private connectRpcToGauges(): void {
        if (!this.state.gaugesManager || !this.state.rpcAdapter) return;

        // Listen for gauge events that need RPC
        this.state.gaugesManager.onevent.subscribe((event: any) => {
            if (event && event.type === 'rpc') {
                this.handleGaugeRpcEvent(event);
            }
        });
    }

    /**
     * Handle RPC events from gauges
     */
    private async handleGaugeRpcEvent(event: any): Promise<void> {
        if (!this.state.rpcAdapter?.isAvailable()) {
            console.warn('[ScadaViewerWidget] RPC not available');
            return;
        }

        try {
            const method = event.method || CommonRpcMethods.SET_VALUE;
            const params = event.params || {};

            if (event.twoWay) {
                const response = await this.state.rpcAdapter.sendTwoWay(method, params);
                if (this.debug) {
                    console.log('[ScadaViewerWidget] RPC response:', response);
                }
            } else {
                await this.state.rpcAdapter.sendOneWay(method, params);
            }
        } catch (err) {
            console.error('[ScadaViewerWidget] RPC error:', err);
        }
    }

    /**
     * Load and render SCADA view
     */
    private loadScadaView(): void {
        const settings = this.ctx.settings;
        const scadaConfig = settings?.scadaConfig;

        if (!scadaConfig?.view) {
            this.showEmptyState();
            return;
        }

        // Create View from config
        this.state.view = this.createViewFromConfig(scadaConfig.view);

        // Create HMI container
        this.state.hmi = new Hmi();
        this.state.hmi.views = [this.state.view];

        // Create project service
        this.state.projectService = this.createProjectService();

        // Create view container
        this.state.viewContainer = document.createElement('div');
        this.state.viewContainer.className = 'scada-view-container';
        this.state.viewContainer.style.cssText = 'width:100%;height:100%;position:relative;';
        this.state.container!.innerHTML = '';
        this.state.container!.appendChild(this.state.viewContainer);

        // Create and initialize FuxaView
        this.state.fuxaView = new FuxaView();
        this.state.fuxaView.init(
            this.state.viewContainer,
            this.state.gaugesManager!,
            this.state.hmiService!,
            this.state.projectService
        );

        // Load the view
        this.state.fuxaView.loadHmi(this.state.view);

        if (this.debug) {
            console.log('[ScadaViewerWidget] View loaded:', this.state.view.id);
        }
    }

    /**
     * Create View object from configuration
     */
    private createViewFromConfig(config: ScadaViewConfig): View {
        const view = new View();
        view.id = config.id || `view_${Date.now()}`;
        view.name = config.name || 'SCADA View';
        view.svgcontent = config.svgcontent || '';
        view.type = (config.type as any) || 'svg';

        // Profile settings
        view.profile.width = config.width || 800;
        view.profile.height = config.height || 600;
        view.profile.bkcolor = config.backgroundColor || '#2a323d';

        // Items (gauge settings)
        if (config.items) {
            for (const [id, item] of Object.entries(config.items)) {
                const gs = new GaugeSettings(id, item.type || 'svg-ext-shapes');
                gs.name = item.name || id;

                // Create property
                const prop = new GaugeProperty();
                if (item.property) {
                    prop.variableId = item.property.variableId || '';
                    prop.ranges = item.property.ranges || [];
                    prop.actions = item.property.actions || [];
                    prop.events = item.property.events || [];
                }
                gs.property = prop;

                view.items[id] = gs;
            }
        }

        return view;
    }

    /**
     * Create project service for FuxaView
     */
    private createProjectService(): IProjectServiceForView {
        const hmi = this.state.hmi;
        const dataKeys = this.state.dataAdapter?.getDataKeys() || [];

        // Create tags map from data keys
        const tags: { [id: string]: Tag } = {};
        dataKeys.forEach(key => {
            const tag = new Tag(key.name);
            tag.name = key.name;
            tags[key.name] = tag;
        });

        return {
            getHmi: () => hmi,
            getDeviceFromId: (deviceId: string) => null,
            getTagFromId: (tagId: string) => tags[tagId] || null,
            getScripts: () => []
        };
    }

    /**
     * Show empty state when no configuration
     */
    private showEmptyState(): void {
        if (!this.state.container) return;

        this.state.container.innerHTML = `
            <div class="scada-empty-state">
                <span class="material-icons scada-empty-state-icon">dashboard</span>
                <div class="scada-empty-state-title">No SCADA Configuration</div>
                <div class="scada-empty-state-description">
                    Configure a SCADA view in the widget settings
                </div>
            </div>
        `;
    }

    /**
     * Show error state
     */
    private showError(message: string): void {
        if (!this.state.container) return;

        this.state.container.innerHTML = `
            <div class="scada-empty-state">
                <span class="material-icons scada-empty-state-icon" style="color:var(--tb-error)">error</span>
                <div class="scada-empty-state-title">Error</div>
                <div class="scada-empty-state-description">${message}</div>
            </div>
        `;
    }

    /**
     * Get data adapter for external access
     */
    getDataAdapter(): TBDataAdapter | null {
        return this.state.dataAdapter;
    }

    /**
     * Get RPC adapter for external access
     */
    getRpcAdapter(): TBRpcAdapter | null {
        return this.state.rpcAdapter;
    }

    /**
     * Get theme manager for external access
     */
    getThemeManager(): ThemeManager | null {
        return this.state.themeManager;
    }

    /**
     * Get FuxaView for external access
     */
    getFuxaView(): FuxaView | null {
        return this.state.fuxaView;
    }
}

/**
 * Factory function to create widget instance
 * This is what gets called from the TB widget JavaScript
 */
export function createScadaViewerWidget(ctx: ScadaViewerContext): ScadaViewerWidget {
    return new ScadaViewerWidget(ctx);
}

/**
 * TB Widget self object factory
 * Creates the self object structure expected by ThingsBoard
 */
export function createWidgetSelf(ctx: ScadaViewerContext): {
    onInit: () => void;
    onDataUpdated: () => void;
    onResize: () => void;
    onDestroy: () => void;
} {
    const widget = createScadaViewerWidget(ctx);

    return {
        onInit: () => widget.onInit(),
        onDataUpdated: () => widget.onDataUpdated(),
        onResize: () => widget.onResize(),
        onDestroy: () => widget.onDestroy()
    };
}
