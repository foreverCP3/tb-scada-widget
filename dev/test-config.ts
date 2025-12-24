/**
 * V11.2: Complete Gauge Test Configuration
 * 包含所有 21 种 Gauge 组件的完整属性配置
 * 用于测试验证所有 FUXA 功能
 */

import {
    GaugeSettings,
    GaugeProperty,
    GaugeRangeProperty,
    GaugeAction,
    GaugeEvent,
    GaugeActionsType,
    GaugeEventType,
    GaugeEventActionType,
    InputOptionsProperty,
    InputOptionType,
    TableType,
    TableOptions,
    TableColumn,
    TableCellType,
    View,
    Hmi
} from '../src/fuxa-core/models/hmi';

// ============================================
// All 21 Gauge Type Tags
// ============================================
export const GAUGE_TYPE_TAGS = {
    // Controls - Basic shapes
    SHAPES: 'svg-ext-shapes',
    
    // Controls - Value display
    VALUE: 'svg-ext-value',
    
    // Controls - Form controls
    HTML_BUTTON: 'svg-ext-html_button',
    HTML_INPUT: 'svg-ext-html_input',
    HTML_SELECT: 'svg-ext-html_select',
    HTML_SWITCH: 'svg-ext-html_switch',
    
    // Controls - Indicators
    GAUGE_PROGRESS: 'svg-ext-gauge_progress',
    GAUGE_SEMAPHORE: 'svg-ext-gauge_semaphore',
    SLIDER: 'svg-ext-slider',
    PIPE: 'svg-ext-pipe',
    
    // Controls - Data display
    HTML_TABLE: 'svg-ext-html_table',
    HTML_CHART: 'svg-ext-own_ctrl-chart',
    HTML_GRAPH: 'svg-ext-html_graph',
    HTML_BAG: 'svg-ext-html_bag',
    
    // Controls - Container & media
    PANEL: 'svg-ext-panel',
    HTML_IMAGE: 'svg-ext-html_image',
    HTML_VIDEO: 'svg-ext-html_video',
    HTML_IFRAME: 'svg-ext-own_ctrl-iframe',
    HTML_SCHEDULER: 'svg-ext-html_scheduler',
    
    // Shapes - Process engineering
    PROC_ENG: 'svg-ext-proceng',
    APE_SHAPES: 'svg-ext-ape-shapes'
};

// ============================================
// Standard Color Ranges
// ============================================
export const STANDARD_RANGES = {
    // 3-level status (Low/Normal/High)
    threeLevel: [
        { min: 0, max: 30, color: '#f44336', stroke: '#d32f2f', text: 'Low' },
        { min: 30, max: 70, color: '#ff9800', stroke: '#f57c00', text: 'Normal' },
        { min: 70, max: 100, color: '#4caf50', stroke: '#43a047', text: 'High' }
    ],
    
    // Binary status (Off/On)
    binary: [
        { min: 0, max: 0, color: '#808080', stroke: '#616161', text: 'Off' },
        { min: 1, max: 1, color: '#4caf50', stroke: '#43a047', text: 'On' }
    ],
    
    // Traffic light (Red/Yellow/Green)
    trafficLight: [
        { min: 0, max: 0, color: '#f44336', stroke: '#d32f2f', text: 'Red' },
        { min: 1, max: 1, color: '#ff9800', stroke: '#f57c00', text: 'Yellow' },
        { min: 2, max: 2, color: '#4caf50', stroke: '#43a047', text: 'Green' }
    ],
    
    // Alarm levels
    alarmLevels: [
        { min: 0, max: 25, color: '#4caf50', stroke: '#43a047', text: 'Normal' },
        { min: 25, max: 50, color: '#2196f3', stroke: '#1976d2', text: 'Info' },
        { min: 50, max: 75, color: '#ff9800', stroke: '#f57c00', text: 'Warning' },
        { min: 75, max: 100, color: '#f44336', stroke: '#d32f2f', text: 'Critical' }
    ],
    
    // Temperature ranges
    temperature: [
        { min: -50, max: 0, color: '#2196f3', stroke: '#1976d2', text: 'Cold' },
        { min: 0, max: 25, color: '#4caf50', stroke: '#43a047', text: 'Normal' },
        { min: 25, max: 50, color: '#ff9800', stroke: '#f57c00', text: 'Warm' },
        { min: 50, max: 100, color: '#f44336', stroke: '#d32f2f', text: 'Hot' }
    ]
};

// ============================================
// Standard Actions
// ============================================
export const STANDARD_ACTIONS = {
    // Hide when value is 0
    hideOnZero: {
        variableId: 'status',
        type: GaugeActionsType.hide,
        range: { min: 0, max: 0 },
        options: {}
    } as GaugeAction,
    
    // Show when value is 1
    showOnOne: {
        variableId: 'status',
        type: GaugeActionsType.show,
        range: { min: 1, max: 1 },
        options: {}
    } as GaugeAction,
    
    // Blink when value > 80 (alarm)
    blinkOnAlarm: {
        variableId: 'value',
        type: GaugeActionsType.blink,
        range: { min: 80, max: 100 },
        options: {
            fillA: '#f44336',
            fillB: '#b71c1c',
            strokeA: '#d32f2f',
            strokeB: '#7f0000',
            interval: 500
        }
    } as GaugeAction,
    
    // Clockwise rotation when running
    rotateClockwise: {
        variableId: 'running',
        type: GaugeActionsType.clockwise,
        range: { min: 1, max: 1 },
        options: {}
    } as GaugeAction,
    
    // Anticlockwise rotation
    rotateAnticlockwise: {
        variableId: 'running',
        type: GaugeActionsType.anticlockwise,
        range: { min: 1, max: 1 },
        options: {}
    } as GaugeAction,
    
    // Stop rotation
    stopRotation: {
        variableId: 'running',
        type: GaugeActionsType.stop,
        range: { min: 0, max: 0 },
        options: {}
    } as GaugeAction,
    
    // Rotate by value (needle gauge)
    rotateByValue: {
        variableId: 'value',
        type: GaugeActionsType.rotate,
        range: { min: 0, max: 100 },
        options: {
            minAngle: -90,
            maxAngle: 90,
            delay: 0
        }
    } as GaugeAction,
    
    // Move element
    moveOnValue: {
        variableId: 'position',
        type: GaugeActionsType.move,
        range: { min: 50, max: 100 },
        options: {
            toX: 100,
            toY: 0,
            duration: 500
        }
    } as GaugeAction
};

// ============================================
// Standard Events
// ============================================
export const STANDARD_EVENTS = {
    // Click to navigate
    clickNavigate: {
        type: GaugeEventType.click,
        action: GaugeEventActionType.onpage,
        actparam: 'detail-view',
        actoptions: {}
    } as GaugeEvent,
    
    // Click to set value
    clickSetValue: {
        type: GaugeEventType.click,
        action: GaugeEventActionType.onSetValue,
        actparam: '',
        actoptions: {
            variableId: 'control',
            value: '1'
        }
    } as GaugeEvent,
    
    // Click to toggle
    clickToggle: {
        type: GaugeEventType.click,
        action: GaugeEventActionType.onToggleValue,
        actparam: '',
        actoptions: {
            variableId: 'status'
        }
    } as GaugeEvent,
    
    // Click to open dialog
    clickDialog: {
        type: GaugeEventType.click,
        action: GaugeEventActionType.ondialog,
        actparam: 'detail-dialog',
        actoptions: {
            width: 600,
            height: 400
        }
    } as GaugeEvent,
    
    // Double click to open window
    dblclickWindow: {
        type: GaugeEventType.dblclick,
        action: GaugeEventActionType.onwindow,
        actparam: 'popup-view',
        actoptions: {}
    } as GaugeEvent,
    
    // Mouse over highlight
    mouseOverHighlight: {
        type: GaugeEventType.mouseover,
        action: GaugeEventActionType.onSetValue,
        actparam: '',
        actoptions: {
            variableId: 'highlight',
            value: '1'
        }
    } as GaugeEvent,
    
    // Enter key submit
    enterSubmit: {
        type: GaugeEventType.enter,
        action: GaugeEventActionType.onSetValue,
        actparam: '',
        actoptions: {}
    } as GaugeEvent,
    
    // Select change
    selectChange: {
        type: GaugeEventType.select,
        action: GaugeEventActionType.onSetValue,
        actparam: '',
        actoptions: {}
    } as GaugeEvent
};

// ============================================
// Complete Gauge Configurations
// ============================================

/**
 * 1. Shapes Component - Basic SVG shapes
 */
export function createShapesConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.SHAPES);
    gs.name = 'shape_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [...STANDARD_RANGES.threeLevel];
    gs.property.actions = [
        { ...STANDARD_ACTIONS.blinkOnAlarm, variableId },
        { ...STANDARD_ACTIONS.rotateClockwise, variableId: variableId + '_running' },
        { ...STANDARD_ACTIONS.stopRotation, variableId: variableId + '_running' }
    ];
    gs.property.events = [
        { ...STANDARD_EVENTS.clickToggle, actoptions: { variableId } },
        { ...STANDARD_EVENTS.dblclickWindow }
    ];
    return gs;
}

/**
 * 2. Value Component - Text value display
 */
export function createValueConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.VALUE);
    gs.name = 'value_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [
        { min: 0, max: 100, text: '%', color: '', stroke: '', type: null, style: null, textId: '' }
    ];
    gs.property.options = {
        unit: '%',
        digits: 2
    };
    gs.property.actions = [
        { ...STANDARD_ACTIONS.blinkOnAlarm, variableId }
    ];
    return gs;
}

/**
 * 3. HTML Button Component
 */
export function createButtonConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_BUTTON);
    gs.name = 'button_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.text = 'Click Me';
    gs.property.ranges = [...STANDARD_RANGES.binary];
    gs.property.events = [
        { ...STANDARD_EVENTS.clickSetValue, actoptions: { variableId, value: '1' } }
    ];
    gs.property.actions = [
        { ...STANDARD_ACTIONS.blinkOnAlarm, variableId }
    ];
    return gs;
}

/**
 * 4. HTML Input Component
 */
export function createInputConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_INPUT);
    gs.name = 'input_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.options = {
        type: InputOptionType.number,
        min: 0,
        max: 100,
        numeric: true,
        updated: true,
        selectOnClick: true
    } as InputOptionsProperty;
    gs.property.events = [
        { ...STANDARD_EVENTS.enterSubmit }
    ];
    return gs;
}

/**
 * 5. HTML Select Component
 */
export function createSelectConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_SELECT);
    gs.name = 'select_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.options = {
        options: [
            { value: '0', label: 'Off' },
            { value: '1', label: 'Auto' },
            { value: '2', label: 'Manual' }
        ]
    };
    gs.property.events = [
        { ...STANDARD_EVENTS.selectChange }
    ];
    return gs;
}

/**
 * 6. HTML Switch Component
 */
export function createSwitchConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_SWITCH);
    gs.name = 'switch_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.options = {
        onColor: '#4caf50',
        offColor: '#808080',
        onValue: 1,
        offValue: 0
    };
    return gs;
}

/**
 * 7. Gauge Progress Component
 */
export function createProgressConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.GAUGE_PROGRESS);
    gs.name = 'progress_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [...STANDARD_RANGES.threeLevel];
    gs.property.options = {
        showMinMax: true,
        showValue: true,
        orientation: 'vertical'
    };
    return gs;
}

/**
 * 8. Gauge Semaphore Component
 */
export function createSemaphoreConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.GAUGE_SEMAPHORE);
    gs.name = 'led_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [...STANDARD_RANGES.trafficLight];
    gs.property.actions = [
        { ...STANDARD_ACTIONS.blinkOnAlarm, variableId, range: { min: 0, max: 0, text: '', textId: '', color: '', type: null, style: null, stroke: '' } }
    ];
    return gs;
}

/**
 * 9. Slider Component
 */
export function createSliderConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.SLIDER);
    gs.name = 'slider_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.options = {
        min: 0,
        max: 100,
        step: 1,
        orientation: 'horizontal',
        defaultValue: 50
    };
    return gs;
}

/**
 * 10. Pipe Component
 */
export function createPipeConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.PIPE);
    gs.name = 'pipe_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [...STANDARD_RANGES.binary];
    gs.property.actions = [
        {
            variableId: variableId + '_flow',
            type: GaugeActionsType.clockwise,
            range: { min: 1, max: 1, text: '', textId: '', color: '', type: null, style: null, stroke: '' },
            bitmask: 0,
            options: { speed: 50 }
        },
        {
            variableId: variableId + '_flow',
            type: GaugeActionsType.stop,
            range: { min: 0, max: 0, text: '', textId: '', color: '', type: null, style: null, stroke: '' },
            bitmask: 0,
            options: {}
        }
    ];
    return gs;
}

/**
 * 11. HTML Table Component
 */
export function createTableConfig(id: string, variableIds: string[]): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_TABLE);
    gs.name = 'table_' + id;
    gs.property = {
        id: id,
        type: TableType.data,
        options: {
            paginator: { show: true },
            filter: { show: true },
            daterange: { show: true },
            realtime: true,
            header: {
                show: true,
                height: 40,
                fontSize: 12,
                color: '#ffffff',
                background: '#305680'
            },
            row: {
                height: 36,
                fontSize: 12,
                color: '#ffffff',
                background: '#323c49'
            },
            columns: [
                new TableColumn('name', TableCellType.label, 'Name'),
                new TableColumn('value', TableCellType.variable, 'Value'),
                new TableColumn('time', TableCellType.timestamp, 'Timestamp')
            ],
            rows: variableIds.map(vid => ({
                cells: [
                    { id: 'name', type: TableCellType.label, label: vid, variableId: '', valueFormat: '', bitmask: 0 },
                    { id: 'value', type: TableCellType.variable, label: '', variableId: vid, valueFormat: '##.##', bitmask: 0 },
                    { id: 'time', type: TableCellType.timestamp, label: '', variableId: vid, valueFormat: 'HH:mm:ss', bitmask: 0 }
                ]
            })),
            alarmFilter: { filterA: [] },
            reportFilter: { filterA: [] }
        } as TableOptions,
        events: []
    };
    return gs;
}

/**
 * 12. HTML Chart Component
 */
export function createChartConfig(id: string, variableIds: string[]): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_CHART);
    gs.name = 'chart_' + id;
    gs.property = {
        id: id,
        type: 'realtime1',
        options: {
            title: 'Time Series',
            backgroundColor: '#323c49',
            gridColor: 'rgba(255,255,255,0.1)',
            textColor: '#ffffff',
            showLegend: true,
            showGrid: true,
            autoScale: true,
            maxPoints: 100,
            realtime: true,
            timeRange: 60000 // 1 minute
        },
        events: []
    };
    gs.property.variableIds = variableIds;
    return gs;
}

/**
 * 13. HTML Graph Component
 */
export function createGraphConfig(id: string, variableIds: string[]): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_GRAPH);
    gs.name = 'graph_' + id;
    gs.property = {
        id: id,
        type: 'bar',
        options: {
            title: 'Bar Graph',
            backgroundColor: '#323c49',
            gridColor: 'rgba(255,255,255,0.1)',
            textColor: '#ffffff',
            showLegend: true
        }
    };
    gs.property.variableIds = variableIds;
    return gs;
}

/**
 * 14. HTML Bag (Gauge) Component
 */
export function createBagConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_BAG);
    gs.name = 'gauge_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.options = {
        min: 0,
        max: 100,
        type: 'arch',
        thick: 10,
        cap: 'round',
        foregroundColor: '#4caf50',
        backgroundColor: '#3b4654',
        label: 'Value',
        append: '%',
        animate: true,
        duration: 500
    };
    return gs;
}

/**
 * 15. Panel Component
 */
export function createPanelConfig(id: string, viewName: string, variableId?: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.PANEL);
    gs.name = 'panel_' + id;
    gs.property = {
        viewName: viewName,
        variableId: variableId || '',
        scaleMode: 'contain'
    };
    return gs;
}

/**
 * 16. HTML Image Component
 */
export function createImageConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_IMAGE);
    gs.name = 'image_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.options = {
        states: [
            { min: 0, max: 0, image: 'assets/off.png' },
            { min: 1, max: 1, image: 'assets/on.png' }
        ],
        refreshInterval: 0
    };
    gs.property.events = [
        { ...STANDARD_EVENTS.clickToggle, actoptions: { variableId } }
    ];
    return gs;
}

/**
 * 17. HTML Video Component
 */
export function createVideoConfig(id: string, address: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_VIDEO);
    gs.name = 'video_' + id;
    gs.property = {
        variableId: '',
        variableIds: [],
        variableValue: '',
        bitmask: 0,
        permission: 0,
        permissionRoles: { show: [], enabled: [] },
        ranges: [],
        events: [],
        actions: [],
        options: {
            address: address,
            showControls: true,
            initImage: ''
        },
        readonly: false,
        text: '',
        alarmId: ''
    };
    return gs;
}

/**
 * 18. HTML IFrame Component
 */
export function createIframeConfig(id: string, address: string, variableId?: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_IFRAME);
    gs.name = 'iframe_' + id;
    gs.property = {
        address: address,
        variableId: variableId || ''
    };
    return gs;
}

/**
 * 19. HTML Scheduler Component
 */
export function createSchedulerConfig(id: string, devices: Array<{ variableId: string, name: string }>): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.HTML_SCHEDULER);
    gs.name = 'scheduler_' + id;
    gs.property = {
        id: id,
        devices: devices,
        deviceActions: [],
        permission: 0,
        permissionRoles: { show: [], enabled: [] },
        accentColor: '#d97f0d',
        backgroundColor: '#323c49',
        textColor: '#ffffff',
        secondaryTextColor: 'rgba(255,255,255,0.7)',
        borderColor: 'rgba(255,255,255,0.12)',
        hoverColor: 'rgba(255,255,255,0.05)',
        timeFormat: 'HH:mm'
    };
    return gs;
}

/**
 * 20. Process Engineering Component
 */
export function createProcEngConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.PROC_ENG);
    gs.name = 'proceng_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [...STANDARD_RANGES.threeLevel];
    gs.property.actions = [
        { ...STANDARD_ACTIONS.rotateClockwise, variableId: variableId + '_running' },
        { ...STANDARD_ACTIONS.stopRotation, variableId: variableId + '_running' },
        { ...STANDARD_ACTIONS.blinkOnAlarm, variableId: variableId + '_alarm' }
    ];
    gs.property.events = [
        { ...STANDARD_EVENTS.clickDialog }
    ];
    return gs;
}

/**
 * 21. APE Shapes Component
 */
export function createApeShapesConfig(id: string, variableId: string): GaugeSettings {
    const gs = new GaugeSettings(id, GAUGE_TYPE_TAGS.APE_SHAPES);
    gs.name = 'ape_' + id;
    gs.property = new GaugeProperty();
    gs.property.variableId = variableId;
    gs.property.ranges = [...STANDARD_RANGES.threeLevel];
    gs.property.actions = [
        { ...STANDARD_ACTIONS.rotateClockwise, variableId: variableId + '_running' },
        { ...STANDARD_ACTIONS.stopRotation, variableId: variableId + '_running' },
        { ...STANDARD_ACTIONS.blinkOnAlarm, variableId: variableId + '_alarm' }
    ];
    gs.property.events = [
        { ...STANDARD_EVENTS.clickToggle, actoptions: { variableId } }
    ];
    return gs;
}

// ============================================
// Complete Test View Configuration
// ============================================

/**
 * Create a complete test view with all gauge types
 */
export function createCompleteTestView(): View {
    const view = new View('test-all-gauges', undefined, 'Complete Gauge Test');
    view.profile.width = 1600;
    view.profile.height = 900;
    view.profile.bkcolor = '#2a323d';
    
    // Add all gauge configurations
    view.items = {
        // 1. Shapes
        'shape1': createShapesConfig('shape1', 'tank_level'),
        
        // 2. Value
        'value1': createValueConfig('value1', 'temperature'),
        
        // 3. Button
        'button1': createButtonConfig('button1', 'start_cmd'),
        
        // 4. Input
        'input1': createInputConfig('input1', 'setpoint'),
        
        // 5. Select
        'select1': createSelectConfig('select1', 'mode'),
        
        // 6. Switch
        'switch1': createSwitchConfig('switch1', 'enable'),
        
        // 7. Progress
        'progress1': createProgressConfig('progress1', 'level'),
        
        // 8. Semaphore
        'semaphore1': createSemaphoreConfig('semaphore1', 'status'),
        
        // 9. Slider
        'slider1': createSliderConfig('slider1', 'speed'),
        
        // 10. Pipe
        'pipe1': createPipeConfig('pipe1', 'flow'),
        
        // 11. Table
        'table1': createTableConfig('table1', ['temp', 'pressure', 'flow']),
        
        // 12. Chart
        'chart1': createChartConfig('chart1', ['temp', 'pressure']),
        
        // 13. Graph
        'graph1': createGraphConfig('graph1', ['val1', 'val2', 'val3']),
        
        // 14. Bag
        'bag1': createBagConfig('bag1', 'percent'),
        
        // 15. Panel
        'panel1': createPanelConfig('panel1', 'sub-view'),
        
        // 16. Image
        'image1': createImageConfig('image1', 'pump_status'),
        
        // 17. Video
        'video1': createVideoConfig('video1', 'rtsp://example.com/stream'),
        
        // 18. IFrame
        'iframe1': createIframeConfig('iframe1', 'https://example.com'),
        
        // 19. Scheduler
        'scheduler1': createSchedulerConfig('scheduler1', [
            { variableId: 'pump1', name: 'Pump 1' },
            { variableId: 'pump2', name: 'Pump 2' }
        ]),
        
        // 20. Proc-Eng
        'proceng1': createProcEngConfig('proceng1', 'tank1'),
        
        // 21. APE Shapes
        'ape1': createApeShapesConfig('ape1', 'motor1')
    };
    
    // Add variables
    view.variables = {
        'tank_level': { id: 'tank_level', name: 'Tank Level', value: '65', source: '', error: 0, timestamp: Date.now() },
        'temperature': { id: 'temperature', name: 'Temperature', value: '42.5', source: '', error: 0, timestamp: Date.now() },
        'start_cmd': { id: 'start_cmd', name: 'Start Command', value: '0', source: '', error: 0, timestamp: Date.now() },
        'setpoint': { id: 'setpoint', name: 'Setpoint', value: '75', source: '', error: 0, timestamp: Date.now() },
        'mode': { id: 'mode', name: 'Mode', value: '1', source: '', error: 0, timestamp: Date.now() },
        'enable': { id: 'enable', name: 'Enable', value: '1', source: '', error: 0, timestamp: Date.now() },
        'level': { id: 'level', name: 'Level', value: '45', source: '', error: 0, timestamp: Date.now() },
        'status': { id: 'status', name: 'Status', value: '2', source: '', error: 0, timestamp: Date.now() },
        'speed': { id: 'speed', name: 'Speed', value: '50', source: '', error: 0, timestamp: Date.now() },
        'flow': { id: 'flow', name: 'Flow', value: '1', source: '', error: 0, timestamp: Date.now() },
        'temp': { id: 'temp', name: 'Temperature', value: '42.5', source: '', error: 0, timestamp: Date.now() },
        'pressure': { id: 'pressure', name: 'Pressure', value: '101.3', source: '', error: 0, timestamp: Date.now() },
        'percent': { id: 'percent', name: 'Percent', value: '65', source: '', error: 0, timestamp: Date.now() },
        'pump_status': { id: 'pump_status', name: 'Pump Status', value: '1', source: '', error: 0, timestamp: Date.now() },
        'tank1': { id: 'tank1', name: 'Tank 1', value: '55', source: '', error: 0, timestamp: Date.now() },
        'motor1': { id: 'motor1', name: 'Motor 1', value: '1', source: '', error: 0, timestamp: Date.now() }
    };
    
    return view;
}

/**
 * Create test HMI with all views
 */
export function createTestHmi(): Hmi {
    const hmi = new Hmi();
    hmi.views = [createCompleteTestView()];
    return hmi;
}

// Export all configurations
export default {
    GAUGE_TYPE_TAGS,
    STANDARD_RANGES,
    STANDARD_ACTIONS,
    STANDARD_EVENTS,
    createShapesConfig,
    createValueConfig,
    createButtonConfig,
    createInputConfig,
    createSelectConfig,
    createSwitchConfig,
    createProgressConfig,
    createSemaphoreConfig,
    createSliderConfig,
    createPipeConfig,
    createTableConfig,
    createChartConfig,
    createGraphConfig,
    createBagConfig,
    createPanelConfig,
    createImageConfig,
    createVideoConfig,
    createIframeConfig,
    createSchedulerConfig,
    createProcEngConfig,
    createApeShapesConfig,
    createCompleteTestView,
    createTestHmi
};
