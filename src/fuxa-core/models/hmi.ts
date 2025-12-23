/**
 * V2: HMI 数据模型
 * 从 FUXA 复制，移除 Angular 依赖
 */

import { Device, DeviceType, Tag } from './device';
import { WidgetPropertyVariable } from '../helpers/svg-utils';
import { MapsLocation } from './maps';

// 本地定义 GridType（替代 angular-gridster2 依赖）
export enum GridType {
    Fit = 'fit',
    ScrollVertical = 'scrollVertical',
    ScrollHorizontal = 'scrollHorizontal',
    Fixed = 'fixed',
    VerticalFixed = 'verticalFixed',
    HorizontalFixed = 'horizontalFixed'
}

export class Hmi {
    /** Layout for navigation menu, header bar, ...  */
    layout: LayoutSettings = new LayoutSettings();
    /** Views list of hmi project */
    views: View[] = [];
}

export class View {
    /** View id, random number */
    id = '';
    /** View name used as reference in configuration */
    name = '';
    /** View profile size, background color */
    profile: DocProfile = new DocProfile();
    /** Gauges settings list used in the view  */
    items: DictionaryGaugeSettings = {};
    /** Variables (Tags) list used in the view */
    variables: DictionaryVariables = {};
    /** Svg code content of the view  */
    svgcontent = '';
    /** Type of view SVG/CARDS */
    type: ViewType = ViewType.svg;
    /** Property with events of view like Open or Close */
    property: ViewProperty = new ViewProperty();

    constructor(id?: string, type?: ViewType, name?: string) {
        this.id = id ?? '';
        this.name = name ?? '';
        this.type = type ?? ViewType.svg;
    }
}

export enum ViewType {
    svg = 'svg',
    cards = 'cards',
    maps = 'maps'
}

export class LayoutSettings {
    /** Auto resize view */
    autoresize?: boolean = false;
    /** Start view (home) */
    start = '';
    /** Left side navigation menu settings */
    navigation: NavigationSettings = new NavigationSettings();
    /** On top header settings */
    header: HeaderSettings = new HeaderSettings();
    /** Show development blue button (Home, Lab, Editor) */
    showdev = true;
    /** Enable zoom in view */
    zoom: ZoomModeType = ZoomModeType.disabled;
    /** Show input dialog for input field */
    inputdialog = 'false';
    /** Hide navigation Header and sidebarmenu */
    hidenavigation = false;
    /** GUI Theme */
    theme = '';
    /** Show login by start */
    loginonstart?: boolean = false;
    /** Overlay color for login modal */
    loginoverlaycolor?: LoginOverlayColorType = LoginOverlayColorType.none;
    /** Show connection error toast */
    show_connection_error? = true;
    /** Customs Css Styles */
    customStyles = '';
}

export class NavigationSettings {
    /** Side menu mode (over, push, fix) */
    mode: NaviModeType = NaviModeType.over;
    /** Menu item show type (text, icon) */
    type: NaviItemType = NaviItemType.block;
    /** Menu background color */
    bkcolor = '#F4F5F7';
    /** Menu item text and icon color */
    fgcolor = '#1D1D1D';
    /** Menu items */
    items: NaviItem[] = [];
    /** Custom logo resource */
    logo?: boolean = false;
}

export enum LoginOverlayColorType {
    none = 'none',
    black = 'black',
    white = 'white',
}

export enum NaviModeType {
    void = 'item.navsmode-none',
    push = 'item.navsmode-push',
    over = 'item.navsmode-over',
    fix = 'item.navsmode-fix',
}

export enum NaviItemType {
    icon = 'item.navtype-icons',
    text = 'item.navtype-text',
    block = 'item.navtype-icons-text-block',
    inline = 'item.navtype-icons-text-inline',
}

export class NaviItem {
    id?: string = '';
    text: string = '';
    link: string = '';
    view: string = '';
    icon: string = '';
    image: string = '';
    permission: number = 0;
    permissionRoles: PermissionRoles = { show: [], enabled: [] };
    children?: NaviItem[] = [];
}

export class HeaderSettings {
    title: string = '';
    alarms: NotificationModeType = NotificationModeType.hide;
    infos: NotificationModeType = NotificationModeType.hide;
    bkcolor = '#ffffff';
    fgcolor = '#000000';
    fontFamily: string = '';
    fontSize = 13;
    items: HeaderItem[] = [];
    itemsAnchor: AnchorType = 'left';
    loginInfo: LoginInfoType = 'nothing';
    dateTimeDisplay: string = '';
    language: LanguageShowModeType = 'nothing';
}

export interface HeaderItem {
    id: string;
    type: HeaderItemType;
    icon: string;
    image: string;
    bkcolor: string;
    fgcolor: string;
    marginLeft: number;
    marginRight: number;
    property: GaugeProperty;
    status: GaugeStatus;
    element: HTMLElement;
}

export type LoginInfoType = 'nothing' | 'username' | 'fullname' | 'both';

export type HeaderItemType = 'button' | 'label' | 'image';

export type AnchorType = 'left' | 'center' | 'right';

export type LanguageShowModeType = 'nothing' | 'simple' | 'key' | 'fullname';

export enum NotificationModeType {
    hide = 'item.notifymode-hide',
    fix = 'item.notifymode-fix',
    float = 'item.notifymode-float',
}

export enum ZoomModeType {
    disabled = 'item.zoommode-disabled',
    enabled = 'item.zoommode-enabled',
    autoresize = 'item.zoommode-autoresize',
}

export enum InputModeType {
    false = 'item.inputmode-disabled',
    true = 'item.inputmode-enabled',
    keyboard = 'item.inputmode-keyboard',
    keyboardFullScreen = 'item.inputmode-keyboard-full-screen',
}

export enum HeaderBarModeType {
    true = 'item.headerbarmode-hide',
    false = 'item.headerbarmode-show',
}

export class DocProfile {
    width = 1024;
    height = 768;
    bkcolor = '#ffffffff';
    margin = 10;
    align = DocAlignType.topCenter;
    gridType: GridType = GridType.Fixed;
    viewRenderDelay = 0; // delay in ms to render view after load, used to prevent flickering on load view with many gauges
}

export enum DocAlignType {
    topCenter = 'topCenter',
    middleCenter ='middleCenter'
}

export class GaugeSettings {
    name = '';
    property: any = null;   // set to GaugeProperty after upgrate
    label = '';             // Gauge type label
    hide = false;
    lock = false;
    constructor(public id: string = '', public type: string = '') {
    }
}

export class ViewProperty {
    events: GaugeEvent[] = [];
    startLocation?: MapsLocation;
    startZoom?: number;
}

export class GaugeProperty {
    variableId: string = '';
    variableIds: string[] = [];      // Multiple variable IDs (used by chart/graph)
    variableValue: string = '';
    bitmask: number = 0;
    permission: number = 0;
    permissionRoles: PermissionRoles = { show: [], enabled: [] };
    ranges: GaugeRangeProperty[] = [];
    events: GaugeEvent[] = [];
    actions: GaugeAction[] = [];
    options: any = null;
    readonly: boolean = false;
    text: string = '';               // Text property (used by button)
    alarmId: string = '';            // Alarm ID (used by shapes for alarm binding)
}

export interface PermissionRoles {
    show: string[];
    enabled: string[];
}

export class WidgetProperty extends GaugeProperty {
    type: string = '';
    scriptContent?: { moduleId: string, content: string };
    svgContent?: string;
    varsToBind?: WidgetPropertyVariable[] = [];
}

export interface InputOptionsProperty {
    updated: boolean;
    numeric?: boolean;
    min?: number;
    max?: number;
    type?: InputOptionType;
    timeformat?: InputTimeFormatType;
    convertion?: InputConvertionType;
    updatedEsc?: boolean;
    selectOnClick?: boolean;
    actionOnEsc?: InputActionEscType;
    maxlength?: number;
    readonly?: boolean;
}

export enum InputOptionType {
    number = 'number',
    text = 'text',
    date = 'date',
    time = 'time',
    datetime = 'datetime',
    textarea = 'textarea',
    password = 'password'
}

export enum InputTimeFormatType {
    normal = 'normal',
    seconds = 'seconds',
    milliseconds = 'milliseconds',
}

export enum InputConvertionType {
    milliseconds = 'milliseconds',
    string = 'string',
}

export enum InputActionEscType {
    update = 'update',
    enter = 'enter'
}

export interface IPropertyVariable {
    /** Tag id */
    variableId: string;
    // TODO not sure if it is necessary
    variableValue: string;
    /** Bitmask to mask with value */
    bitmask: number;
    /** Reference to tag property, used to propagate to sub component */
    variableRaw: Tag;
}

export class GaugeEvent {
    type: string = '';
    action: string = '';
    actparam: string = '';
    actoptions: any = {};
}

export class ViewEvent {
    type: string = '';
    action: string = '';
    actparam: string = '';
    actoptions: any = {};
}

export enum GaugeActionsType {
    hide = 'shapes.action-hide',
    show = 'shapes.action-show',
    blink = 'shapes.action-blink',
    color = 'shapes.action-color',
    stop = 'shapes.action-stop',
    clockwise = 'shapes.action-clockwise',
    anticlockwise = 'shapes.action-anticlockwise',
    downup = 'shapes.action-downup',
    rotate = 'shapes.action-rotate',
    move = 'shapes.action-move',
    monitor = 'shapes.action-monitor',
    refreshImage = 'shapes.action-refreshImage',
    start = 'shapes.action-start',
    pause = 'shapes.action-pause',
    reset = 'shapes.action-reset',
}

export class GaugeAction {
    variableId: string = '';
    bitmask: number = 0;
    range: GaugeRangeProperty = new GaugeRangeProperty();
    type: any = null;
    options: any = {};
}

export class GaugeActionBlink {
    strokeA: string | null = null;
    strokeB: string | null = null;
    fillA: string | null = null;
    fillB: string | null = null;
    interval = 1000;
}

export class GaugeActionRotate {
    minAngle = 0;
    maxAngle = 90;
    delay = 0;
}

export class GaugeActionMove {
    toX = 0;
    toY = 0;
    duration = 100;
}

export class GaugePropertyColor {
    fill: string = '';
    stroke: string = '';
}

export class GaugeStatus {
    variablesValue: { [key: string]: any } = {};
    onlyChange = false;         // to process value only by change
    takeValue = false;          // to process value by check change with gauge value
    actionRef: GaugeActionStatus = new GaugeActionStatus('');
}

export class GaugeActionStatus {
    type: string;
    timer?: any = null;
    animr?: any = null;
    spool?: any;
    constructor(type: string) {
        this.type = type;
    }
}

/** Gouges and Shapes mouse events */
export enum GaugeEventType {
    click = 'shapes.event-click',
    dblclick = 'shapes.event-dblclick',
    mousedown = 'shapes.event-mousedown',
    mouseup = 'shapes.event-mouseup',
    mouseover = 'shapes.event-mouseover',
    mouseout = 'shapes.event-mouseout',
    enter = 'shapes.event-enter',
    select = 'shapes.event-select',
    onLoad = 'shapes.event-onLoad',
}

export enum GaugeEventActionType {
    onpage = 'shapes.event-onpage',
    onwindow = 'shapes.event-onwindow',
    onOpenTab = 'shapes.event-onopentab',
    ondialog = 'shapes.event-ondialog',
    oniframe = 'shapes.event-oniframe',
    oncard = 'shapes.event-oncard',     // wrong name exchange with 'onwindow'
    onSetValue = 'shapes.event-onsetvalue',
    onToggleValue = 'shapes.event-ontogglevalue',
    onSetInput = 'shapes.event-onsetinput',
    onclose = 'shapes.event-onclose',
    onRunScript = 'shapes.event-onrunscript',
    onViewToPanel = 'shapes.event-onViewToPanel',
    onMonitor = 'shapes.event-onmonitor',
}

export enum ViewEventType {
    onopen = 'shapes.event-onopen',
    onclose = 'shapes.event-onclose'
}

export enum ViewEventActionType {
    onRunScript = 'shapes.event-onrunscript',
}

export enum GaugeEventRelativeFromType {
    window = 'window',
    mouse = 'mouse'
}

export enum GaugeEventSetValueType {
    set = 'shapes.event-setvalue-set',
    add = 'shapes.event-setvalue-add',
    remove = 'shapes.event-setvalue-remove',
}

export class GaugeRangeProperty {
    min: number = 0;
    max: number = 0;
    text: string = '';
    textId: string = '';
    color: string = '';
    type: any = null;
    style: any = null;
    stroke: string = '';
}

export interface GaugeChartProperty {
    id: string;
    type: string;
    options: any;
    events: GaugeEvent[];
}

export interface GaugeGraphProperty {
    id: string;
    type: string;
    options: any;
}

export interface GaugeIframeProperty {
    address: string;
    variableId: string;
}

export interface GaugePanelProperty {
    viewName: string;
    variableId: string;
    scaleMode: PropertyScaleModeType;
}

export enum PropertyScaleModeType {
    none = 'none',
    contain = 'contain',
    stretch = 'stretch'
}

export interface GaugeTableProperty {
    id: string;
    type: TableType;
    options: TableOptions;
    events: GaugeEvent[];
}

export interface GaugeSchedulerProperty {
    id: string;
    devices: SchedulerDevice[];
    deviceActions: SchedulerDeviceAction[];
    permission: number;
    permissionRoles: PermissionRoles;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    secondaryTextColor: string;
    borderColor: string;
    hoverColor: string;
    timeFormat: string;
}

export interface SchedulerDeviceAction {
    deviceName: string;
    action: string;
    actparam?: string;
    actoptions?: any;
    eventTrigger?: 'on' | 'off';
}

export interface SchedulerDevice {
    variableId: string;
    name: string;
    permission?: number;
    permissionRoles?: {
        show: string[];
        enabled: string[];
    };
}

export enum TableType {
    data = 'data',
    history = 'history',
    alarms = 'alarms',
    alarmsHistory = 'alarmsHistory',
    reports = 'reports',
}

export interface TableOptions {
    paginator?: {
        show: boolean;
    };
    filter?: {
        show: boolean;
    };
    daterange: {
        show: boolean;
    };
    realtime?: boolean;
    lastRange?: TableRangeType;
    gridColor?: string;
    header?: {
        show: boolean;
        height: number;
        fontSize?: number;
        color?: string;
        background?: string;
    };
    row?: {
        height: number;
        fontSize?: number;
        color?: string;
        background?: string;
    };
    selection?: {
        fontBold?: boolean;
        color?: string;
        background?: string;
    };
    columns?: TableColumn[];
    alarmsColumns?: TableColumn[];
    alarmFilter: TableFilter;
    reportsColumns?: TableColumn[];
    reportFilter: TableFilter;
    rows?: TableRow[];
}

export interface TableFilter {
    filterA: string[];
    filterB?: string[];
    filterC?: string[];
}

export enum TableCellType {
    label = 'label',
    variable = 'variable',
    timestamp = 'timestamp',
    device = 'device',
}

export class TableCell {
    id: string;
    label: string;
    variableId: string = '';
    valueFormat: string = '';
    timeInterval?: number;
    bitmask: number = 0;
    type: TableCellType;

    constructor(id: string, type?: TableCellType, label?: string) {
        this.id = id;
        this.type = type || TableCellType.label;
        this.label = label ?? '';
    }
}

export class TableColumn extends TableCell {
    align: TableCellAlignType = TableCellAlignType.left;
    width = 100;
    exname: string = '';
    constructor(name: string, type?: TableCellType, label?: string) {
        super(name, type, label);
    }
}

export class TableRow {
    cells: TableCell[];
    constructor(cls: TableCell[]) {
        this.cells = cls;
    }
}

export enum TableCellAlignType {
    left = 'left',
    center = 'center',
    right = 'right',
}

export enum TableRangeType {
    last1h = 'table.rangetype-last1h',
    last1d = 'table.rangetype-last1d',
    last3d = 'table.rangetype-last3d',
}

export class Variable {
    id: string;
    name: string;
    source: string = '';
    value: string = '';
    error: number = 0;
    timestamp: number = 0;
    device?: Device;
    constructor(id: string, name: string, device?: Device) {
        this.id = id;
        this.name = name;
        this.device = device;
        if (device?.type === DeviceType.internal) {
            this.value = '0';
        }
    }
}

export class VariableRange {
    min: number = 0;
    max: number = 0;
}

export class AlarmTag extends Tag {
    group: string = '';
    device: string = '';
}

export class WindowLink {
    name = '';
    title = '';
    type: string = '';
}

export class SelElement {
    type = '';
    id: string = '';
    ele: any = null;
}

export class Event {
    id = '';
    dom: any;
    value: any = null;
    dbg = '';
    type?: string;
    ga: GaugeSettings = new GaugeSettings();
    variableId: string = '';
}

export class DaqQuery {
    gid?: string;
    from: any;
    to: any;
    event?: string;
    sids: string[] = [];
    chunked?: boolean;
}

export interface DaqValue {
    id: string;
    ts: number;
    value: any;
}

export class DaqResult {
    gid: string = '';
    result: any;
    chunk?: DaqChunkType;
}

export interface DaqChunkType {
    index: number;
    of: number;
}

export class HelpData {
    page: string = '';
    tag: string = '';
}

export class Size {
    height: number;
    width: number;
    constructor(h: number, w: number) {
        this.height = h;
        this.width = w;
    }
}

export interface DictionaryGaugeSettings {
    [x: string]: GaugeSettings;
}

export interface DictionaryVariables {
    [id: string]: Variable;
}

export enum DateFormatType {
    YYYY_MM_DD = '1998/03/25',
    MM_DD_YYYY = '03/25/1998',
    DD_MM_YYYY = '25/03/1998',
    MM_DD_YY = '03/25/98',
    DD_MM_YY = '25/03/98',
}

export enum TimeFormatType {
    hh_mm_ss = '16:58:10',
    hh_mm_ss_AA = '04:58:10 PM',
}

export class CardWidget {
    data: string;
    type: string;
    zoom = 1;
    scaleMode: PropertyScaleModeType = PropertyScaleModeType.none;

    constructor(type: string, data: string) {
        this.type = type;
        this.data = data;
    }
}

export enum CardWidgetType {
    view = 'view',
    alarms = 'alarms',
    iframe = 'iframe',
    table = 'table',
}

export enum LinkType {
    address = '[link]',
    alarms = '[alarms]',
}

export const DEVICE_READONLY = 'rodevice';

export interface IDateRange {
    start: any;
    end: any;
}

export interface ISvgElement {
    id: string;
    name: string;
}

export class GaugeVideoProperty extends GaugeProperty {
    constructor() {
        super();
        this.options = { address: '' } as VideoOptions;
    }
}

export interface VideoOptions {
    address: string;
    initImage?: string;
    showControls?: boolean;
}

/**
 * 图元属性对话框类型
 * 用于编辑器中的属性面板选择
 */
export enum GaugeDialogType {
    Range = 0,
    RangeAndText = 1,
    RangeWithAlarm = 2,
    ValueAndUnit = 3,
    ValueWithRef = 4,
    Step = 5,
    MinMax = 6,
    Chart = 7,
    Gauge = 8,
    Pipe = 9,
    Slider = 10,
    Switch = 11,
    Graph = 12,
    Iframe = 13,
    Table = 14,
    Input = 15,
    Panel = 16,
    Video = 17,
    Scheduler = 18
}
