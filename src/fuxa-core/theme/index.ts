/**
 * V9: Theme Module - ThingsBoard Theme Integration
 * 
 * Exports theme management utilities for SCADA widgets
 */

// Theme Manager - Classes and functions
export {
    ThemeManager,
    LIGHT_THEME_COLORS,
    DARK_THEME_COLORS,
    DEFAULT_THEME_CONFIG,
    getThemeManager,
    createThemeManager
} from './theme-manager';

// Theme Manager - Types
export type {
    ThemeType,
    ThemeColors,
    ThemeConfig,
    TBThemeContext
} from './theme-manager';

// CSS styles can be imported directly:
// import 'fuxa-core/theme/theme-styles.css';
