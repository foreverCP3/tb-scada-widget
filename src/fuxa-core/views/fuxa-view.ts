/**
 * FUXA View Renderer - Migrated from FUXA
 * Original: FUXA/client/src/app/fuxa-view/fuxa-view.component.ts
 * 
 * This class manages:
 * - SVG content loading and rendering
 * - Gauge initialization and binding
 * - Signal subscription and value processing
 * - Mouse/keyboard event handling
 * - Variable mapping for placeholders
 * 
 * Removed from original:
 * - Angular component decorators and lifecycle hooks
 * - Material Dialog (MatDialog)
 * - Translation service (handled externally)
 * - Touch keyboard directive
 * - Script service (simplified)
 */

import { EventEmitter } from '../lib/event-emitter';
import {
    Event,
    GaugeEvent,
    GaugeEventActionType,
    GaugeSettings,
    GaugeProperty,
    GaugeEventType,
    GaugeRangeProperty,
    GaugeStatus,
    Hmi,
    View,
    ViewType,
    Variable,
    ZoomModeType,
    DictionaryGaugeSettings,
    GaugeEventRelativeFromType,
    ViewEventType,
    IPropertyVariable
} from '../models/hmi';
import { GaugesManager } from '../gauges/gauges-manager';
import { Utils } from '../helpers/utils';
import { HmiService } from '../services/hmi-service';
import { HtmlInputComponent } from '../gauges/controls/html-input';
import { HtmlSelectComponent } from '../gauges/controls/html-select';
import { Tag, DevicesUtils, PlaceholderDevice } from '../models/device';

declare var SVG: any;

/**
 * Variable mapping entry type
 */
export interface VariableMappingType {
    variableId: string;
    variableValue: any;
}

/**
 * Variable mapping dictionary
 */
export interface VariableMappingDictionary {
    [key: string]: VariableMappingType;
}

/**
 * Action options with variable
 */
export interface ActionOptionsVariable {
    variable: IPropertyVariable;
}

/**
 * Extended gauge property
 */
export interface GaugePropertyExt extends GaugeProperty {
    id: string;
    type: string;
}

/**
 * Card model for popup windows
 */
export class CardModel {
    public id: string;
    public name: string = '';
    public link: string = '';
    public x: number = 0;
    public y: number = 0;
    public scale: number = 1;
    public scaleX: number = 1;
    public scaleY: number = 1;
    public width: number = 0;
    public height: number = 0;
    public variablesMapping: any[] = [];
    public view: View | null = null;
    public sourceDeviceId: string = '';
    public disableDefaultClose: boolean = false;
    public zIndex: number = 1000;

    constructor(id: string) {
        this.id = id;
    }
}

/**
 * Dialog modal model
 */
export class DialogModalModel {
    public id: string;
    public name: string = '';
    public width: number = 0;
    public height: number = 0;
    public bkcolor: string = '';
    public view: View | null = null;
    public variablesMapping: any[] = [];
    public disableDefaultClose: boolean = false;

    constructor(id: string) {
        this.id = id;
    }
}

/**
 * Interface for project service
 */
export interface IProjectServiceForView {
    getHmi(): Hmi | null;
    getDeviceFromId(deviceId: string): any;
    getTagFromId(tagId: string): Tag | null;
    getScripts(): any[];
}

/**
 * Interface for script service
 */
export interface IScriptService {
    runScript(script: any): Promise<any>;
}

/**
 * Interface for language service
 */
export interface ILanguageService {
    getTranslation(key: string | undefined): string | undefined;
}

/**
 * FUXA View - Core view rendering class
 */
export class FuxaView {
    // Events
    onclose: EventEmitter<any> = new EventEmitter();
    ongoto: EventEmitter<string> = new EventEmitter();

    // Properties
    id: string = '';
    variablesMapping: any[] = [];
    view: View | null = null;
    hmi: Hmi | null = null;
    child: boolean = false;
    gaugesManager: GaugesManager | null = null;
    parentcards: CardModel[] = [];
    sourceDeviceId: string = '';

    // Internal state
    cards: CardModel[] = [];
    iframes: CardModel[] = [];
    mapGaugeStatus: { [id: string]: GaugeStatus } = {};
    mapControls: { [id: string]: any } = {};
    parent: FuxaView | null = null;
    viewLoaded: boolean = false;

    // Event type constants
    private eventViewToPanel = Utils.getEnumKey(GaugeEventActionType, GaugeEventActionType.onViewToPanel);
    private eventRunScript = Utils.getEnumKey(GaugeEventActionType, GaugeEventActionType.onRunScript);
    private eventOpenTab = Utils.getEnumKey(GaugeEventActionType, GaugeEventActionType.onOpenTab);
    private cardViewType = Utils.getEnumKey(ViewType, ViewType.cards);

    // Private state
    private dataContainer: HTMLElement | null = null;
    private viewRenderDelay: number = 0;
    private subscriptionOnChange: any = null;
    private subscriptionOnGaugeEvent: any = null;
    protected staticValues: { [key: string]: any } = {};
    protected plainVariableMapping: VariableMappingDictionary = {};
    private loadOk: boolean = false;
    private zIndexCounter: number = 1000;

    // Services
    private projectService: IProjectServiceForView | null = null;
    private hmiService: HmiService | null = null;
    private scriptService: IScriptService | null = null;
    private languageService: ILanguageService | null = null;

    constructor() {
    }

    /**
     * Initialize the view with dependencies
     */
    init(
        container: HTMLElement,
        gaugesManager: GaugesManager,
        hmiService: HmiService,
        projectService: IProjectServiceForView,
        options?: {
            scriptService?: IScriptService;
            languageService?: ILanguageService;
        }
    ): void {
        this.dataContainer = container;
        this.gaugesManager = gaugesManager;
        this.hmiService = hmiService;
        this.projectService = projectService;
        this.scriptService = options?.scriptService || null;
        this.languageService = options?.languageService || null;

        this.loadVariableMapping();
    }

    /**
     * Load and render a view
     */
    loadHmi(view: View, legacyProfile?: boolean): void {
        this.viewLoaded = false;
        if (this.loadOk || !view) {
            this.viewLoaded = true;
            return;
        }

        try {
            if (!this.hmi && this.projectService) {
                this.hmi = this.projectService.getHmi();
            }

            if (this.id && this.gaugesManager && this.dataContainer) {
                try {
                    this.gaugesManager.unbindGauge(this.id);
                    this.clearGaugeStatus();
                    this.dataContainer.innerHTML = '';
                } catch (err) {
                    console.error(err);
                }
            }

            if (view?.id && this.dataContainer) {
                this.id = view.id;
                this.view = view;

                if (view.type === this.cardViewType || view.type === ViewType.maps) {
                    this.ongoto.emit(view.id);
                    return;
                } else {
                    this.dataContainer.innerHTML = view.svgcontent.replace('<title>Layer 1</title>', '');
                }

                if (view.profile.bkcolor && (this.child || legacyProfile)) {
                    this.dataContainer.style.backgroundColor = view.profile.bkcolor;
                }

                if (view.profile.align && !this.child) {
                    FuxaView.setAlignStyle(view.profile.align, this.dataContainer);
                }
            }

            this.loadWatch(this.view!);
            this.onResize();

            if (view) {
                // Execute onOpen script for new current view
                view.property?.events?.forEach((event: any) => {
                    if (event.type === Utils.getEnumKey(ViewEventType, ViewEventType.onopen)) {
                        this.onRunScript(event);
                    }
                });
                this.viewRenderDelay = view.profile?.viewRenderDelay || 0;
            }
        } finally {
            setTimeout(() => {
                this.viewLoaded = true;
            }, this.viewRenderDelay);
        }
    }

    /**
     * Destroy the view and clean up resources
     */
    destroy(): void {
        try {
            if (this.gaugesManager) {
                this.gaugesManager.unbindGauge(this.id);
            }
            this.clearGaugeStatus();

            if (this.subscriptionOnChange) {
                this.subscriptionOnChange.unsubscribe();
                this.subscriptionOnChange = null;
            }
            if (this.subscriptionOnGaugeEvent) {
                this.subscriptionOnGaugeEvent.unsubscribe();
                this.subscriptionOnGaugeEvent = null;
            }

            // Execute onClose script
            this.view?.property?.events?.forEach((event: any) => {
                if (event.type === Utils.getEnumKey(ViewEventType, ViewEventType.onclose)) {
                    this.onRunScript(event);
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Handle window resize
     */
    onResize(): void {
        if (!this.dataContainer) return;

        let hmi = this.projectService?.getHmi();
        if (hmi && hmi.layout && (hmi.layout.zoom as string) === 'autoresize' && !this.child) {
            const parent = this.dataContainer.parentElement?.parentElement;
            if (parent) {
                Utils.resizeViewRev(this.dataContainer, parent, 'stretch');
            }
        }
    }

    /**
     * Emit bound signals for this view
     */
    emitBindedSignals(): void {
        try {
            if (this.gaugesManager) {
                this.gaugesManager.emitBindedSignals(this.id);
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Load variable mappings
     */
    private loadVariableMapping(variablesMapped?: any): void {
        try {
            if (variablesMapped) {
                this.variablesMapping = variablesMapped;
            }
            this.variablesMapping?.forEach(variableMapping => {
                this.plainVariableMapping[variableMapping.from.variableId] = variableMapping.to;
            });
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Clear all gauge status timers and animations
     */
    private clearGaugeStatus(): void {
        Object.values(this.mapGaugeStatus).forEach((gs: GaugeStatus) => {
            try {
                if (gs.actionRef) {
                    if (gs.actionRef.timer) {
                        clearTimeout(gs.actionRef.timer);
                        gs.actionRef.timer = null;
                    }
                    if (gs.actionRef.animr) {
                        if (gs.actionRef.animr.reset) {
                            gs.actionRef.animr.reset();
                        }
                        delete gs.actionRef.animr;
                    }
                }
            } catch (err) {
                console.error(err);
            }
        });
        this.mapGaugeStatus = {};
    }

    /**
     * Main function to load all gauge settings and bind signals
     */
    private loadWatch(view: View): void {
        if (!view || !view.items || !this.gaugesManager || !this.projectService) {
            return;
        }

        this.mapControls = {};
        const device = this.projectService.getDeviceFromId(this.sourceDeviceId);
        let sourceTags: Tag[] | null = device?.tags ? Object.values(device.tags) : null;
        let items = this.applyVariableMapping(view.items, sourceTags || undefined);

        // Add mapped placeholder -> variable to sourceTags
        let tagsToAddForPlaceholderMapping: Tag[] = [];
        Object.entries(this.plainVariableMapping ?? {}).forEach(([key, mappingEntry]) => {
            if (mappingEntry?.variableId) {
                const tagFound = this.projectService!.getTagFromId(mappingEntry.variableId);
                if (tagFound) {
                    const tag = new Tag(tagFound.id);
                    const placeholder = DevicesUtils.getPlaceholderContent(key);
                    tag.name = placeholder.firstContent ?? '';
                    tagsToAddForPlaceholderMapping.push(tag);
                }
            }
        });
        sourceTags = Utils.mergeUniqueBy(sourceTags || [], tagsToAddForPlaceholderMapping, 'id');

        for (let key in items) {
            if (!items.hasOwnProperty(key)) {
                continue;
            }
            try {
                // Check language translation
                const textTranslated = this.languageService?.getTranslation(items[key].property?.text);

                // Init gauge and TagId
                let gauge = this.gaugesManager.initElementAdded(
                    items[key],
                    null, // resolver not needed
                    null, // viewContainerRef not needed
                    true,
                    this,
                    textTranslated,
                    sourceTags || undefined
                );
                if (gauge) {
                    this.mapControls[key] = gauge;
                }

                // Bind mouse/key events, signals will be subscribed for notify changes
                this.gaugesManager.bindGauge(
                    gauge,
                    this.id,
                    items[key],
                    sourceTags ?? [],
                    (gaToBindMouseEvents: GaugeSettings) => {
                        this.onBindMouseEvents(gaToBindMouseEvents);
                    },
                    (gaToBindHtmlEvent: Event) => {
                        this.onBindHtmlEvent(gaToBindHtmlEvent);
                    }
                );

                if (items[key].property) {
                    let gaugeSetting = items[key];
                    let gaugeStatus = this.getGaugeStatus(gaugeSetting);
                    let variables: Variable[] = [];

                    // Prepare the start value to process
                    if (items[key].property.variableValue || gaugeSetting.property.variableId) {
                        let variable = {
                            id: gaugeSetting.property.variableId,
                            value: gaugeSetting.property.variableValue
                        } as Variable;
                        if (this.checkStatusValue(gaugeSetting.id, gaugeStatus, variable)) {
                            variables = [variable];
                        }
                    }

                    // Get the last signal value in memory of gauge
                    variables = variables.concat(this.gaugesManager.getBindSignalsValue(items[key]));

                    if (variables.length) {
                        let svgeles = FuxaView.getSvgElements(gaugeSetting.id);
                        for (let y = 0; y < svgeles.length; y++) {
                            variables.forEach(variable => {
                                this.gaugesManager!.processValue(gaugeSetting, svgeles[y], variable, gaugeStatus);
                            });
                        }
                    }

                    // Run load events
                    if (gaugeSetting.property.events) {
                        const loadEventType = Utils.getEnumKey(GaugeEventType, GaugeEventType.onLoad);
                        const loadEvents = gaugeSetting.property.events?.filter(
                            (ev: GaugeEvent) => ev.type === loadEventType
                        );
                        if (loadEvents?.length) {
                            this.runEvents(this, gaugeSetting, null, loadEvents);
                        }
                    }
                }
            } catch (err) {
                console.error('loadWatch: ' + key, err);
            }
        }

        // Subscribe to signal changes
        if (!this.subscriptionOnChange && this.gaugesManager) {
            this.subscriptionOnChange = this.gaugesManager.onchange.subscribe(this.handleSignal.bind(this));
        }

        // Subscribe to gauge events from scheduler
        if (!this.subscriptionOnGaugeEvent && this.hmiService) {
            this.subscriptionOnGaugeEvent = this.hmiService.onGaugeEvent.subscribe((event: any) => {
                if (event && event.action) {
                    const gaugeSettings = { id: 'scheduler-trigger', property: {} } as GaugeSettings;
                    this.runEvents(this, gaugeSettings, null, [event]);
                }
            });
        }

        // Process static values
        for (let variableId in this.staticValues) {
            if (!this.staticValues.hasOwnProperty(variableId)) {
                continue;
            }
            this.handleSignal({
                id: variableId,
                value: this.staticValues[variableId]
            });
        }

        // Set subscription to server
        if (this.hmiService && this.gaugesManager) {
            this.hmiService.viewsTagsSubscribe(this.gaugesManager.getBindedSignalsId());
        }
    }

    /**
     * Handle signal value changes
     */
    protected handleSignal(sig: any): void {
        if (sig.value === undefined || !this.gaugesManager) {
            return;
        }

        try {
            // Take all gauges settings bound to the signal id in this view
            let gas = this.gaugesManager.getGaugeSettings(this.id, sig.id);
            if (gas) {
                for (let i = 0; i < gas.length; i++) {
                    let gaugeSetting = gas[i];
                    let gaugeStatus = this.getGaugeStatus(gaugeSetting);
                    if (this.checkStatusValue(gaugeSetting.id, gaugeStatus, sig)) {
                        let svgeles = FuxaView.getSvgElements(gaugeSetting.id);
                        for (let y = 0; y < svgeles.length; y++) {
                            this.gaugesManager.processValue(gaugeSetting, svgeles[y], sig, gaugeStatus);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('handleSignal error:', err);
        }
    }

    /**
     * Get or create gauge status for a gauge setting
     */
    public getGaugeStatus(ga: GaugeSettings): GaugeStatus {
        if (this.mapGaugeStatus[ga.id]) {
            return this.mapGaugeStatus[ga.id];
        } else if (this.gaugesManager) {
            this.mapGaugeStatus[ga.id] = this.gaugesManager.createGaugeStatus(ga);
            return this.mapGaugeStatus[ga.id];
        }
        return new GaugeStatus();
    }

    /**
     * Apply variable mapping to gauge items
     */
    protected applyVariableMapping(items: DictionaryGaugeSettings, sourceTags?: Tag[]): DictionaryGaugeSettings {
        // Deep clone
        items = JSON.parse(JSON.stringify(items));

        for (let gaId in items) {
            if (!items.hasOwnProperty(gaId)) {
                continue;
            }
            const gaugeSettings = items[gaId];
            let property = gaugeSettings.property as GaugePropertyExt;
            if (!property) {
                continue;
            }

            this.applyVariableMappingTo(property, sourceTags);

            if (property.actions) {
                property.actions.forEach((action: any) => {
                    this.applyVariableMappingTo(action, sourceTags);
                });
            }

            if (property.events) {
                property.events.forEach((event: GaugeEvent) => {
                    if (event.actoptions) {
                        if (Utils.isObject((event.actoptions as any)['variable'])) {
                            this.applyVariableMappingTo((event.actoptions as any)['variable'], sourceTags);
                        } else {
                            this.applyVariableMappingTo(event.actoptions, sourceTags);
                        }
                    }
                });
            }

            if (property.ranges) {
                property.ranges.forEach((range: GaugeRangeProperty) => {
                    if ((range as any).textId) {
                        this.applyVariableMappingTo((range as any).textId, sourceTags);
                    }
                });
            }
        }
        return items;
    }

    /**
     * Apply variable mapping to a single target
     */
    protected applyVariableMappingTo(target: any, tags?: Tag[]): void {
        if (!target || !target['variableId']) {
            return;
        }
        if (this.plainVariableMapping.hasOwnProperty(target.variableId)) {
            target.variableValue = this.plainVariableMapping[target.variableId]?.variableValue;
            target.variableId = this.plainVariableMapping[target.variableId]?.variableId;
            return;
        }
        if (tags) {
            const tag = DevicesUtils.placeholderToTag(target.variableId, tags);
            if (tag) {
                target.variableId = tag.id;
                target.variableValue = tag.value;
            }
        }
    }

    /**
     * Check if value has changed for gauge status
     */
    private checkStatusValue(gaugeId: string, gaugeStatus: GaugeStatus, signal: any): boolean {
        let result = true;
        if (gaugeStatus.onlyChange) {
            if (gaugeStatus.takeValue && this.gaugesManager) {
                let value = this.gaugesManager.getGaugeValue(gaugeId);
                (gaugeStatus.variablesValue as any)[signal.id] = value;
            }
            if ((gaugeStatus.variablesValue as any)[signal.id] === signal.value) {
                result = false;
            }
        }
        (gaugeStatus.variablesValue as any)[signal.id] = signal.value;
        return result;
    }

    /**
     * Bind mouse events to gauge SVG element
     */
    private onBindMouseEvents(ga: GaugeSettings): void {
        let self = this.parent || this;
        let svgele = FuxaView.getSvgElement(ga.id);
        let clickTimeout: any;

        if (!svgele || !self.gaugesManager) return;

        let dblclickEvents = self.gaugesManager.getBindMouseEvent(ga, GaugeEventType.dblclick);
        let clickEvents = self.gaugesManager.getBindMouseEvent(ga, GaugeEventType.click);

        if ((clickEvents?.length ?? 0) > 0) {
            svgele.click(function(ev: any) {
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(function() {
                    self.runEvents(self, ga, ev, clickEvents || []);
                }, (dblclickEvents?.length ?? 0) > 0 ? 200 : 0);
            });
            svgele.touchstart(function(ev: any) {
                self.runEvents(self, ga, ev, clickEvents || []);
                ev.preventDefault();
            });
        } else if ((dblclickEvents?.length ?? 0) > 0) {
            svgele.dblclick(function(ev: any) {
                clearTimeout(clickTimeout);
                self.runEvents(self, ga, ev, dblclickEvents || []);
                ev.preventDefault();
            });
        }

        let mouseDownEvents = self.gaugesManager.getBindMouseEvent(ga, GaugeEventType.mousedown);
        if ((mouseDownEvents?.length ?? 0) > 0) {
            svgele.mousedown(function(ev: any) {
                self.runEvents(self, ga, ev, mouseDownEvents || []);
            });
            svgele.touchstart(function(ev: any) {
                self.runEvents(self, ga, ev, mouseDownEvents || []);
                ev.preventDefault();
            });
        }

        let mouseUpEvents = self.gaugesManager.getBindMouseEvent(ga, GaugeEventType.mouseup);
        if ((mouseUpEvents?.length ?? 0) > 0) {
            svgele.mouseup(function(ev: any) {
                self.runEvents(self, ga, ev, mouseUpEvents || []);
            });
            svgele.touchend(function(ev: any) {
                self.runEvents(self, ga, ev, mouseUpEvents || []);
                ev.preventDefault();
            });
        }

        let mouseOverEvents = self.gaugesManager.getBindMouseEvent(ga, GaugeEventType.mouseover);
        if ((mouseOverEvents?.length ?? 0) > 0) {
            svgele.mouseover(function(ev: any) {
                self.runEvents(self, ga, ev, mouseOverEvents || []);
            });
        }

        let mouseOutEvents = self.gaugesManager.getBindMouseEvent(ga, GaugeEventType.mouseout);
        if ((mouseOutEvents?.length ?? 0) > 0) {
            svgele.mouseout(function(ev: any) {
                self.runEvents(self, ga, ev, mouseOutEvents || []);
            });
        }
    }

    /**
     * Bind HTML input/select events
     */
    private onBindHtmlEvent(htmlevent: Event): void {
        let self = this;

        if (htmlevent.type === 'key-enter') {
            htmlevent.dom.onkeydown = function(ev: KeyboardEvent) {
                if (ev.key === 'Enter') {
                    const isToSkip = HtmlInputComponent.SkipEnterEvent.includes(
                        (htmlevent?.dom?.nodeName ?? '').toLowerCase()
                    );
                    const ctrlOrMeta = ev.ctrlKey || ev.metaKey;
                    if (!ctrlOrMeta && isToSkip) {
                        return;
                    }
                    htmlevent.dbg = 'key pressed ' + htmlevent.dom.id + ' ' + htmlevent.dom.value;
                    htmlevent.id = htmlevent.dom.id;
                    htmlevent.value = htmlevent.dom.value;
                    
                    let res = HtmlInputComponent.validateValue(htmlevent.dom.value, htmlevent.ga);
                    if (res.valid && self.gaugesManager) {
                        htmlevent.value = res.value;
                        self.gaugesManager.putEvent(htmlevent);
                        htmlevent.dom.blur();
                    }

                    if (htmlevent.ga.type === HtmlInputComponent.TypeTag) {
                        const events = JSON.parse(JSON.stringify(
                            HtmlInputComponent.getEvents(htmlevent.ga.property, GaugeEventType.enter)
                        ));
                        self.eventForScript(events, htmlevent.value);
                    }
                } else if (ev.key === 'Escape') {
                    htmlevent.dom.blur();
                }
            };

            htmlevent.dom.onblur = function(ev: any) {
                // Update variable value in case it has changed
                if (self.gaugesManager) {
                    let variables = self.gaugesManager.getBindSignalsValue(htmlevent.ga);
                    let svgeles = FuxaView.getSvgElements(htmlevent.ga.id);
                    if (variables.length && svgeles.length) {
                        if (htmlevent.ga?.type !== HtmlInputComponent.TypeTag) {
                            self.gaugesManager.processValue(htmlevent.ga, svgeles[0], variables[0], new GaugeStatus());
                        }
                    }
                }
                htmlevent.dom.setCustomValidity('');
            };

            htmlevent.dom.oninput = function(ev: any) {
                htmlevent.dom.setCustomValidity('');
            };
        } else if (htmlevent.type === 'change') {
            htmlevent.dom.onchange = function(ev: any) {
                htmlevent.dbg = 'key pressed ' + htmlevent.dom.id + ' ' + htmlevent.dom.value;
                htmlevent.id = htmlevent.dom.id;
                htmlevent.value = htmlevent.dom.value;
                if (self.gaugesManager) {
                    self.gaugesManager.putEvent(htmlevent);
                }
                if (htmlevent.ga.type === HtmlSelectComponent.TypeTag) {
                    const events = JSON.parse(JSON.stringify(
                        HtmlSelectComponent.getEvents(htmlevent.ga.property, GaugeEventType.select)
                    ));
                    self.eventForScript(events, htmlevent.value);
                }
            };
        }
    }

    /**
     * Run gauge events
     */
    public runEvents(self: FuxaView, ga: GaugeSettings, ev: any, events: any[]): void {
        for (let i = 0; i < events.length; i++) {
            const action = events[i].action;
            
            if (action === GaugeEventActionType.onpage) {
                self.loadPage(ev, events[i].actparam, events[i].actoptions);
            } else if (action === GaugeEventActionType.onwindow) {
                self.onOpenCard(ga.id, ev, events[i].actparam, events[i].actoptions);
            } else if (action === GaugeEventActionType.onSetValue) {
                self.onSetValue(ga, events[i]);
            } else if (action === GaugeEventActionType.onToggleValue) {
                self.onToggleValue(ga, events[i]);
            } else if (action === GaugeEventActionType.onSetInput) {
                self.onSetInput(ga, events[i]);
            } else if (action === GaugeEventActionType.onclose) {
                self.onClose(ev);
            } else if (action === GaugeEventActionType.onRunScript || action === this.eventRunScript) {
                self.onRunScript(events[i]);
            } else if (action === GaugeEventActionType.onOpenTab || action === this.eventOpenTab) {
                self.onOpenTab(events[i], events[i].actoptions);
            } else if (action === GaugeEventActionType.onViewToPanel || action === this.eventViewToPanel) {
                self.onSetViewToPanel(events[i]);
            }
        }
    }

    /**
     * Toggle signal value
     */
    onToggleValue(ga: GaugeSettings, event: GaugeEvent): void {
        const actionOptions = event.actoptions as ActionOptionsVariable;
        if (actionOptions?.variable?.variableId && this.gaugesManager) {
            this.gaugesManager.toggleSignalValue(actionOptions.variable.variableId, actionOptions.variable.bitmask);
        } else if (ga.property && ga.property.variableId && this.gaugesManager) {
            this.gaugesManager.toggleSignalValue(ga.property.variableId);
        }
    }

    /**
     * Set a value to signal
     */
    onSetValue(ga: GaugeSettings, event: GaugeEvent): void {
        if (event.actparam && this.gaugesManager) {
            let variableId = this.fetchVariableId(event) || ga.property?.variableId;
            let fnc = this.fetchFunction(event);
            if (variableId) {
                this.gaugesManager.putSignalValue(variableId, event.actparam, fnc);
            }
        }
    }

    /**
     * Set input value to signal
     */
    onSetInput(ga: GaugeSettings, event: GaugeEvent): void {
        if (event.actparam && this.gaugesManager) {
            let ele = document.getElementById(event.actparam);
            if (ele) {
                let input: any = null;
                for (let i = 0; i < GaugesManager.GaugeWithProperty.length; i++) {
                    input = Utils.searchTreeStartWith(ele, GaugesManager.GaugeWithProperty[i]);
                    if (input) break;
                }
                if (input && !Utils.isNullOrUndefined(input.value)) {
                    let variableId = this.fetchVariableId(event) || ga.property?.variableId;
                    if (variableId) {
                        this.gaugesManager.putSignalValue(variableId, input.value);
                    }
                }
            }
        }
    }

    /**
     * Run a script
     */
    onRunScript(event: GaugeEvent): void {
        if (event.actparam && this.scriptService && this.projectService) {
            let scripts = this.projectService.getScripts();
            let torun = Utils.clone(scripts.find((dataScript: any) => dataScript.id === event.actparam));
            if (torun && event.actoptions) {
                torun.parameters = Utils.clone((event.actoptions as any)['PARAMS_MAP'] || []);
                this.scriptService.runScript(torun).catch(err => {
                    console.error(err);
                });
            }
        }
    }

    /**
     * Open a tab/link
     */
    onOpenTab(event: GaugeEvent, options: any): void {
        let link = (event.actoptions as any)?.addressType === 'resource' 
            ? '/' + (event.actoptions as any).resource 
            : event.actparam;
        if (link) {
            window.open(link, options?.newTab ? '_blank' : '_self');
        }
    }

    /**
     * Set view to panel
     */
    onSetViewToPanel(event: GaugeEvent): void {
        if (event.actparam && event.actoptions && this.view) {
            let panelCtrl = this.mapControls[(event.actoptions as any)['panelId']] as FuxaView;
            const panelProperty = this.view.items[(event.actoptions as any)['panelId']]?.property;
            if (panelCtrl) {
                panelCtrl.loadPage(panelProperty, event.actparam, event.actoptions);
            }
        }
    }

    /**
     * Load a page/view
     */
    loadPage(param: any, viewref: string, options: any): void {
        let view = this.getView(viewref);
        this.closeAllCards();
        if (view) {
            if (options?.variablesMapping) {
                this.loadVariableMapping(options.variablesMapping);
            }
            this.sourceDeviceId = options?.sourceDeviceId || '';
            this.loadHmi(view, true);
            if (param?.scaleMode && this.dataContainer) {
                const parent = this.dataContainer.parentElement?.parentElement;
                if (parent) {
                    Utils.resizeViewRev(this.dataContainer, parent, param.scaleMode);
                }
            }
        }
    }

    /**
     * Open a card/window
     */
    onOpenCard(id: string, event: any, viewref: string, options: any = {}): void {
        if (options?.singleCard) {
            this.cards = [];
        }
        let view = this.getView(viewref);
        if (!view) return;

        // Check existing card
        let existingCard = this.cards.find(c => c.id === id);
        if (existingCard) return;

        let card = new CardModel(id);
        card.x = Utils.isNumeric(options.left) ? parseInt(options.left) : 0;
        card.y = Utils.isNumeric(options.top) ? parseInt(options.top) : 0;

        if (event && options.relativeFrom !== GaugeEventRelativeFromType.window) {
            card.x += event.clientX ?? 0;
            card.y += event.clientY ?? 0;
        }

        if (this.hmi?.layout?.hidenavigation) {
            card.y -= 48;
        }

        card.width = view.profile.width;
        card.height = view.profile.height;
        card.view = view;
        card.variablesMapping = options?.variablesMapping;
        card.disableDefaultClose = options?.hideClose;
        card.sourceDeviceId = options?.sourceDeviceId;
        card.zIndex = this.nextZIndex();

        if (this.parentcards) {
            this.parentcards.push(card);
        } else {
            this.cards.push(card);
        }
    }

    /**
     * Close all cards
     */
    private closeAllCards(): void {
        this.cards = [];
    }

    /**
     * Close a specific card
     */
    onCloseCard(card: CardModel): void {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
    }

    /**
     * Handle close event
     */
    private onClose(event: any): void {
        this.onclose.emit(event);
    }

    /**
     * Get next z-index for cards
     */
    private nextZIndex(): number {
        return ++this.zIndexCounter;
    }

    /**
     * Get view by ID
     */
    private getView(viewref: string): View | null {
        const hmi = this.hmi ?? this.hmiService?.hmi;
        if (!hmi?.views) return null;

        for (let i = 0; i < hmi.views.length; i++) {
            if (hmi.views[i]?.id === viewref) {
                return hmi.views[i];
            }
        }
        return null;
    }

    /**
     * Process events for scripts
     */
    private eventForScript(events: GaugeEvent[], value: any): void {
        events?.forEach(ev => {
            if (value && ev.actoptions) {
                let parameters = (ev.actoptions as any)['PARAMS_MAP'] || [];
                parameters.forEach((param: any) => {
                    if (param.type === 'value' && !param.value) {
                        param.value = value;
                    }
                });
            }
            this.onRunScript(ev);
        });
    }

    /**
     * Fetch variable ID from event
     */
    protected fetchVariableId(event: GaugeEvent): string | null {
        if (!event.actoptions) return null;

        const opts = event.actoptions as any;
        if (Utils.isObject(opts['variable']) && opts['variable']['variableId']) {
            return opts['variable']['variableId'];
        }
        if (opts['variableId']) {
            return opts['variableId'];
        }
        return null;
    }

    /**
     * Fetch function from event
     */
    private fetchFunction(event: GaugeEvent): string | null {
        const opts = event.actoptions as any;
        if (opts?.function) {
            return opts.function;
        }
        return null;
    }

    /**
     * Get SVG elements by ID
     */
    public static getSvgElements(svgid: string): any[] {
        let ele = document.getElementsByTagName('svg');
        let result: any[] = [];
        for (let i = 0; i < ele.length; i++) {
            let svgItems = ele[i].getElementById(svgid);
            if (svgItems && typeof SVG !== 'undefined') {
                result.push(SVG.adopt(svgItems));
            }
        }
        return result;
    }

    /**
     * Get single SVG element by ID
     */
    public static getSvgElement(svgid: string): any {
        let ele = document.getElementsByTagName('svg');
        for (let i = 0; i < ele.length; i++) {
            let svgItems = ele[i].getElementById(svgid);
            if (svgItems && typeof SVG !== 'undefined') {
                return SVG.adopt(svgItems);
            }
        }
        return null;
    }

    /**
     * Set alignment style on element
     */
    public static setAlignStyle(align: string, nativeElement: HTMLElement): void {
        if (align === 'middleCenter') {
            nativeElement.style.position = 'absolute';
            nativeElement.style.top = '50%';
            nativeElement.style.left = '50%';
            nativeElement.style.transform = 'translate(-50%, -50%)';
        }
    }

    /**
     * Bring card to front
     */
    bringCardToFront(card: CardModel): void {
        card.zIndex = this.nextZIndex();
    }

    /**
     * Get card height with padding
     */
    getCardHeight(height: number | string): number {
        return parseInt(String(height)) + 4;
    }
}
