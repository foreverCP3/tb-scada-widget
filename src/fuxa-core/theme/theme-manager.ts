/**
 * V9: Theme Manager - ThingsBoard Theme Integration
 * 
 * This module provides theme management for SCADA widgets in ThingsBoard.
 * It supports:
 * - Light/Dark theme detection and switching
 * - ThingsBoard CSS variable integration
 * - Custom theme configuration
 * - Auto-detection of system/TB theme preferences
 */

import { EventEmitter } from '../lib/event-emitter';

/**
 * Theme types supported by the manager
 */
export type ThemeType = 'light' | 'dark' | 'auto';

/**
 * Color palette for a theme
 */
export interface ThemeColors {
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Accent colors
    accent: string;
    accentLight: string;
    
    // Background colors
    background: string;
    surface: string;
    surfaceLight: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textDisabled: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Border and divider
    divider: string;
    border: string;
    
    // Shadow
    shadow: string;
    
    // SCADA specific colors
    scadaBackground: string;
    scadaGridLine: string;
    scadaPipe: string;
    scadaActiveElement: string;
    scadaInactiveElement: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
    type: ThemeType;
    colors: ThemeColors;
    fontFamily: string;
    fontSize: number;
    borderRadius: number;
}

/**
 * Default light theme colors (ThingsBoard style)
 */
export const LIGHT_THEME_COLORS: ThemeColors = {
    // Primary colors
    primary: '#305680',
    primaryLight: '#4a7cb0',
    primaryDark: '#1e3a5f',
    
    // Accent colors
    accent: '#d97f0d',
    accentLight: '#f5a623',
    
    // Background colors
    background: '#fafafa',
    surface: '#ffffff',
    surfaceLight: '#f5f5f5',
    
    // Text colors
    textPrimary: 'rgba(0, 0, 0, 0.87)',
    textSecondary: 'rgba(0, 0, 0, 0.6)',
    textDisabled: 'rgba(0, 0, 0, 0.38)',
    
    // Status colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Border and divider
    divider: 'rgba(0, 0, 0, 0.12)',
    border: 'rgba(0, 0, 0, 0.23)',
    
    // Shadow
    shadow: 'rgba(0, 0, 0, 0.2)',
    
    // SCADA specific colors
    scadaBackground: '#e8e8e8',
    scadaGridLine: '#cccccc',
    scadaPipe: '#607d8b',
    scadaActiveElement: '#4caf50',
    scadaInactiveElement: '#9e9e9e'
};

/**
 * Default dark theme colors (ThingsBoard style)
 */
export const DARK_THEME_COLORS: ThemeColors = {
    // Primary colors
    primary: '#305680',
    primaryLight: '#4a7cb0',
    primaryDark: '#1e3a5f',
    
    // Accent colors
    accent: '#d97f0d',
    accentLight: '#f5a623',
    
    // Background colors
    background: '#2a323d',
    surface: '#323c49',
    surfaceLight: '#3b4654',
    
    // Text colors
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textDisabled: 'rgba(255, 255, 255, 0.5)',
    
    // Status colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Border and divider
    divider: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.23)',
    
    // Shadow
    shadow: 'rgba(0, 0, 0, 0.5)',
    
    // SCADA specific colors
    scadaBackground: '#1e252e',
    scadaGridLine: '#3b4654',
    scadaPipe: '#4a7cb0',
    scadaActiveElement: '#4caf50',
    scadaInactiveElement: '#616161'
};

/**
 * Default theme configuration
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
    type: 'auto',
    colors: DARK_THEME_COLORS,
    fontFamily: "'Roboto', 'Helvetica Neue', sans-serif",
    fontSize: 14,
    borderRadius: 4
};

/**
 * ThingsBoard Widget Context interface (partial, theme-related)
 */
export interface TBThemeContext {
    settings?: {
        darkMode?: boolean;
        theme?: ThemeType;
        customColors?: Partial<ThemeColors>;
    };
    dashboard?: {
        isDarkTheme?: boolean;
    };
    $container?: HTMLElement[];
}

/**
 * Theme Manager class
 * Manages theme state and applies CSS variables to the widget container
 */
export class ThemeManager {
    // Events
    onThemeChange: EventEmitter<ThemeConfig> = new EventEmitter();
    
    // Current theme state
    private _currentTheme: ThemeConfig;
    private _container: HTMLElement | null = null;
    private _styleElement: HTMLStyleElement | null = null;
    private _mediaQuery: MediaQueryList | null = null;
    private _mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
    
    constructor() {
        this._currentTheme = { ...DEFAULT_THEME_CONFIG };
    }
    
    /**
     * Get current theme configuration
     */
    get currentTheme(): ThemeConfig {
        return this._currentTheme;
    }
    
    /**
     * Get current theme colors
     */
    get colors(): ThemeColors {
        return this._currentTheme.colors;
    }
    
    /**
     * Check if current theme is dark
     */
    get isDark(): boolean {
        return this._currentTheme.colors === DARK_THEME_COLORS ||
               this._currentTheme.colors.background === DARK_THEME_COLORS.background;
    }
    
    /**
     * Initialize theme manager with ThingsBoard widget context
     */
    init(ctx?: TBThemeContext, container?: HTMLElement): void {
        this._container = container || ctx?.$container?.[0] || null;
        
        // Determine theme type
        let themeType: ThemeType = 'auto';
        
        if (ctx?.settings?.theme) {
            themeType = ctx.settings.theme;
        } else if (ctx?.settings?.darkMode !== undefined) {
            themeType = ctx.settings.darkMode ? 'dark' : 'light';
        }
        
        // Set initial theme
        this.setTheme(themeType, ctx?.settings?.customColors);
        
        // Setup auto theme detection if needed
        if (themeType === 'auto') {
            this.setupAutoDetection(ctx);
        }
    }
    
    /**
     * Set theme type and optionally custom colors
     */
    setTheme(type: ThemeType, customColors?: Partial<ThemeColors>): void {
        this._currentTheme.type = type;
        
        // Determine base colors
        let baseColors: ThemeColors;
        
        if (type === 'auto') {
            baseColors = this.detectSystemTheme() ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
        } else if (type === 'dark') {
            baseColors = DARK_THEME_COLORS;
        } else {
            baseColors = LIGHT_THEME_COLORS;
        }
        
        // Merge with custom colors
        this._currentTheme.colors = customColors 
            ? { ...baseColors, ...customColors }
            : { ...baseColors };
        
        // Apply theme to container
        this.applyTheme();
        
        // Emit change event
        this.onThemeChange.emit(this._currentTheme);
    }
    
    /**
     * Set custom theme colors
     */
    setCustomColors(colors: Partial<ThemeColors>): void {
        this._currentTheme.colors = { ...this._currentTheme.colors, ...colors };
        this.applyTheme();
        this.onThemeChange.emit(this._currentTheme);
    }
    
    /**
     * Toggle between light and dark theme
     */
    toggle(): void {
        const newType = this.isDark ? 'light' : 'dark';
        this.setTheme(newType);
    }
    
    /**
     * Detect system/browser theme preference
     */
    private detectSystemTheme(): boolean {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    }
    
    /**
     * Setup auto theme detection using media query
     */
    private setupAutoDetection(ctx?: TBThemeContext): void {
        // Check ThingsBoard dashboard theme first
        if (ctx?.dashboard?.isDarkTheme !== undefined) {
            const isDark = ctx.dashboard.isDarkTheme;
            this._currentTheme.colors = isDark ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
            this.applyTheme();
            return;
        }
        
        // Fall back to system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
            this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            this._mediaQueryHandler = (e: MediaQueryListEvent) => {
                if (this._currentTheme.type === 'auto') {
                    this._currentTheme.colors = e.matches ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
                    this.applyTheme();
                    this.onThemeChange.emit(this._currentTheme);
                }
            };
            
            this._mediaQuery.addEventListener('change', this._mediaQueryHandler);
        }
    }
    
    /**
     * Apply theme CSS variables to container
     */
    private applyTheme(): void {
        if (!this._container) return;
        
        const colors = this._currentTheme.colors;
        
        // Set CSS custom properties on the container
        const style = this._container.style;
        
        // Primary colors
        style.setProperty('--tb-primary', colors.primary);
        style.setProperty('--tb-primary-light', colors.primaryLight);
        style.setProperty('--tb-primary-dark', colors.primaryDark);
        
        // Accent colors
        style.setProperty('--tb-accent', colors.accent);
        style.setProperty('--tb-accent-light', colors.accentLight);
        
        // Background colors
        style.setProperty('--tb-background', colors.background);
        style.setProperty('--tb-surface', colors.surface);
        style.setProperty('--tb-surface-light', colors.surfaceLight);
        
        // Text colors
        style.setProperty('--tb-text-primary', colors.textPrimary);
        style.setProperty('--tb-text-secondary', colors.textSecondary);
        style.setProperty('--tb-text-disabled', colors.textDisabled);
        
        // Status colors
        style.setProperty('--tb-success', colors.success);
        style.setProperty('--tb-warning', colors.warning);
        style.setProperty('--tb-error', colors.error);
        style.setProperty('--tb-info', colors.info);
        
        // Border and divider
        style.setProperty('--tb-divider', colors.divider);
        style.setProperty('--tb-border', colors.border);
        
        // Shadow
        style.setProperty('--tb-shadow', colors.shadow);
        
        // SCADA specific
        style.setProperty('--scada-background', colors.scadaBackground);
        style.setProperty('--scada-grid-line', colors.scadaGridLine);
        style.setProperty('--scada-pipe', colors.scadaPipe);
        style.setProperty('--scada-active', colors.scadaActiveElement);
        style.setProperty('--scada-inactive', colors.scadaInactiveElement);
        
        // Font settings
        style.setProperty('--tb-font-family', this._currentTheme.fontFamily);
        style.setProperty('--tb-font-size', `${this._currentTheme.fontSize}px`);
        style.setProperty('--tb-border-radius', `${this._currentTheme.borderRadius}px`);
        
        // Set theme class on container
        this._container.classList.remove('theme-light', 'theme-dark');
        this._container.classList.add(this.isDark ? 'theme-dark' : 'theme-light');
        
        // Inject base styles if not already done
        this.injectBaseStyles();
    }
    
    /**
     * Inject base CSS styles into the document
     */
    private injectBaseStyles(): void {
        if (this._styleElement) return;
        
        const styleId = 'tb-scada-theme-styles';
        
        // Check if already exists
        if (document.getElementById(styleId)) return;
        
        this._styleElement = document.createElement('style');
        this._styleElement.id = styleId;
        this._styleElement.textContent = this.getBaseStyles();
        
        document.head.appendChild(this._styleElement);
    }
    
    /**
     * Get base CSS styles
     */
    private getBaseStyles(): string {
        return `
/* TB SCADA Widget Base Styles */
.tb-scada-widget {
    font-family: var(--tb-font-family, 'Roboto', sans-serif);
    font-size: var(--tb-font-size, 14px);
    color: var(--tb-text-primary);
    background-color: var(--tb-background);
    box-sizing: border-box;
}

.tb-scada-widget * {
    box-sizing: border-box;
}

/* SCADA View Container */
.scada-view-container {
    width: 100%;
    height: 100%;
    background-color: var(--scada-background);
    overflow: hidden;
    position: relative;
}

/* SVG Styling */
.scada-view-container svg {
    width: 100%;
    height: 100%;
}

/* Status Colors */
.status-success { color: var(--tb-success); }
.status-warning { color: var(--tb-warning); }
.status-error { color: var(--tb-error); }
.status-info { color: var(--tb-info); }

.bg-success { background-color: var(--tb-success); }
.bg-warning { background-color: var(--tb-warning); }
.bg-error { background-color: var(--tb-error); }
.bg-info { background-color: var(--tb-info); }

/* Cards and Panels */
.scada-card {
    background-color: var(--tb-surface);
    border-radius: var(--tb-border-radius);
    box-shadow: 0 2px 1px -1px var(--tb-shadow),
                0 1px 1px 0 var(--tb-shadow),
                0 1px 3px 0 var(--tb-shadow);
}

.scada-panel {
    background-color: var(--tb-surface-light);
    border: 1px solid var(--tb-divider);
    border-radius: var(--tb-border-radius);
}

/* Buttons */
.scada-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background-color: var(--tb-primary);
    color: #ffffff;
    border: none;
    border-radius: var(--tb-border-radius);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
}

.scada-btn:hover {
    background-color: var(--tb-primary-light);
}

.scada-btn:active {
    background-color: var(--tb-primary-dark);
}

.scada-btn.accent {
    background-color: var(--tb-accent);
}

.scada-btn.accent:hover {
    background-color: var(--tb-accent-light);
}

/* Inputs */
.scada-input {
    width: 100%;
    padding: 10px 12px;
    background-color: var(--tb-surface);
    border: 1px solid var(--tb-border);
    border-radius: var(--tb-border-radius);
    color: var(--tb-text-primary);
    font-family: inherit;
    font-size: 14px;
    transition: border-color 0.2s;
}

.scada-input:focus {
    outline: none;
    border-color: var(--tb-primary);
}

.scada-input::placeholder {
    color: var(--tb-text-disabled);
}

/* Labels */
.scada-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--tb-text-secondary);
    margin-bottom: 4px;
}

/* Tooltips */
.scada-tooltip {
    position: absolute;
    padding: 6px 10px;
    background-color: var(--tb-surface);
    color: var(--tb-text-primary);
    border-radius: var(--tb-border-radius);
    font-size: 12px;
    box-shadow: 0 2px 8px var(--tb-shadow);
    z-index: 1000;
    pointer-events: none;
}

/* Loading Spinner */
.scada-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.scada-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--tb-divider);
    border-top-color: var(--tb-primary);
    border-radius: 50%;
    animation: scada-spin 1s linear infinite;
}

@keyframes scada-spin {
    to { transform: rotate(360deg); }
}

/* Theme transitions */
.theme-light, .theme-dark {
    transition: background-color 0.3s, color 0.3s;
}

/* Scrollbar styling for dark theme */
.theme-dark ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.theme-dark ::-webkit-scrollbar-track {
    background: transparent;
}

.theme-dark ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.theme-dark ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Scrollbar styling for light theme */
.theme-light ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.theme-light ::-webkit-scrollbar-track {
    background: transparent;
}

.theme-light ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.theme-light ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
}
`;
    }
    
    /**
     * Get CSS variable value for use in SVG or inline styles
     */
    getCSSVariable(name: string): string {
        if (this._container) {
            return getComputedStyle(this._container).getPropertyValue(name).trim();
        }
        return '';
    }
    
    /**
     * Get color value from theme colors by key
     */
    getColor(key: keyof ThemeColors): string {
        return this._currentTheme.colors[key];
    }
    
    /**
     * Update SVG elements with theme colors
     * Call this after theme changes to update SVG content
     */
    updateSVGTheme(svgContainer: HTMLElement): void {
        const colors = this._currentTheme.colors;
        
        // Update elements with data-theme-* attributes
        const elements = svgContainer.querySelectorAll('[data-theme-fill]');
        elements.forEach(el => {
            const colorKey = el.getAttribute('data-theme-fill') as keyof ThemeColors;
            if (colorKey && colors[colorKey]) {
                (el as SVGElement).style.fill = colors[colorKey];
            }
        });
        
        const strokeElements = svgContainer.querySelectorAll('[data-theme-stroke]');
        strokeElements.forEach(el => {
            const colorKey = el.getAttribute('data-theme-stroke') as keyof ThemeColors;
            if (colorKey && colors[colorKey]) {
                (el as SVGElement).style.stroke = colors[colorKey];
            }
        });
    }
    
    /**
     * Destroy theme manager and cleanup
     */
    destroy(): void {
        // Remove media query listener
        if (this._mediaQuery && this._mediaQueryHandler) {
            this._mediaQuery.removeEventListener('change', this._mediaQueryHandler);
            this._mediaQuery = null;
            this._mediaQueryHandler = null;
        }
        
        // Remove style element (optional - keep it if other widgets might use it)
        // if (this._styleElement && this._styleElement.parentNode) {
        //     this._styleElement.parentNode.removeChild(this._styleElement);
        //     this._styleElement = null;
        // }
        
        // Clear container reference
        this._container = null;
        
        // Unsubscribe all event listeners
        this.onThemeChange.unsubscribeAll();
    }
}

/**
 * Global theme manager instance (singleton pattern for shared usage)
 */
let globalThemeManager: ThemeManager | null = null;

/**
 * Get or create global theme manager instance
 */
export function getThemeManager(): ThemeManager {
    if (!globalThemeManager) {
        globalThemeManager = new ThemeManager();
    }
    return globalThemeManager;
}

/**
 * Create a new theme manager instance (for isolated widget usage)
 */
export function createThemeManager(): ThemeManager {
    return new ThemeManager();
}
