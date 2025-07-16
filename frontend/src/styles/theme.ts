// Enhanced Theme System for Vietnamese POS - 2025
export const lightTheme = {
  colors: {
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#fa8c16',
    error: '#ff4d4f',
    info: '#13c2c2',
    
    // Text colors
    textPrimary: '#262626',
    textSecondary: '#8c8c8c',
    textDisabled: '#bfbfbf',
    textWhite: '#ffffff',
    
    // Background colors
    bgPrimary: '#ffffff',
    bgSecondary: '#fafafa',
    bgTertiary: '#f5f5f5',
    bgQuaternary: '#f0f0f0',
    
    // Border colors
    borderPrimary: '#d9d9d9',
    borderSecondary: '#e8e8e8',
    borderLight: '#f0f0f0',
    
    // Card colors
    cardBg: '#ffffff',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    cardBorder: '#e8e8e8',
    
    // Vietnamese business colors
    vndGreen: '#00b96b',
    vndRed: '#ff4d4f',
    vndOrange: '#fa8c16',
    vndBlue: '#1890ff',
    vndPurple: '#722ed1',
    
    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    gradientSuccess: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    gradientWarning: 'linear-gradient(135deg, #fa8c16 0%, #d48806 100%)',
    gradientError: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
    gradientInfo: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
    
    // Status colors
    statusOnline: '#52c41a',
    statusOffline: '#8c8c8c',
    statusBusy: '#fa8c16',
    statusError: '#ff4d4f',
    statusWarning: '#faad14',
    statusSuccess: '#52c41a',
    
    // Chart colors
    chartColors: [
      '#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2',
      '#eb2f96', '#f5222d', '#a0d911', '#fadb14', '#2f54eb'
    ]
  },
  
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    fontSize: {
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '20px',
      xxxl: '24px'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
    full: '9999px'
  },
  
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
    md: '0 4px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.10)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.12)',
    xxl: '0 24px 48px rgba(0, 0, 0, 0.15)'
  },
  
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
    maximum: 9999
  },
  
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px'
  },
  
  animations: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',
    
    // Text colors for dark mode
    textPrimary: '#ffffff',
    textSecondary: '#a6a6a6',
    textDisabled: '#595959',
    textWhite: '#ffffff',
    
    // Background colors for dark mode
    bgPrimary: '#141414',
    bgSecondary: '#1f1f1f',
    bgTertiary: '#262626',
    bgQuaternary: '#303030',
    
    // Border colors for dark mode
    borderPrimary: '#434343',
    borderSecondary: '#303030',
    borderLight: '#262626',
    
    // Card colors for dark mode
    cardBg: '#1f1f1f',
    cardShadow: 'rgba(0, 0, 0, 0.25)',
    cardBorder: '#303030',
    
    // Status colors for dark mode
    statusOnline: '#52c41a',
    statusOffline: '#595959',
    statusBusy: '#fa8c16',
    statusError: '#ff4d4f',
    statusWarning: '#faad14',
    statusSuccess: '#52c41a'
  }
};

// Vietnamese business theme
export const vietnameseTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#d4af37', // Vietnamese gold
    primaryHover: '#e6c757',
    primaryActive: '#b8941f',
    secondary: '#dc143c', // Vietnamese red
    
    // Vietnamese flag colors
    flagRed: '#dc143c',
    flagYellow: '#ffff00',
    
    // Traditional Vietnamese colors
    lacquerRed: '#8b0000',
    bambooGreen: '#7cb342',
    lotusWhite: '#f8f8ff',
    dragonGold: '#d4af37',
    phoenixRed: '#dc143c'
  }
};

// Add blue theme
export const blueTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#1890ff', // Blue primary
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',
    secondary: '#13c2c2', // Cyan secondary
    
    // Blue theme specific colors
    navBg: '#001529',
    headerBg: '#ffffff',
    menuItemBg: '#001529',
    menuItemHover: '#1890ff',
    menuItemActive: '#1890ff',
    
    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    gradientSecondary: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
    
    // Chart colors - use array to match the type in lightTheme
    chartColors: [
      '#1890ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16',
      '#eb2f96', '#f5222d', '#a0d911', '#fadb14', '#2f54eb'
    ]
  }
};

// Import modern theme
import { modernDarkTheme, modernTheme } from './modern-theme';

// Export theme types
export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'vietnamese' | 'blue' | 'modern' | 'modern-dark';

// Theme utilities
export const getTheme = (mode: ThemeMode): Theme => {
  switch (mode) {
    case 'dark':
      return darkTheme;
    case 'vietnamese':
      return vietnameseTheme;
    case 'blue':
      return blueTheme;
    case 'modern':
      return modernTheme;
    case 'modern-dark':
      return modernDarkTheme;
    default:
      return lightTheme;
  }
};

// CSS variables generator
export const generateCSSVariables = (theme: Theme) => {
  const cssVars: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Handle chartColors array specially
    if (key === 'chartColors' && Array.isArray(value)) {
      value.forEach((color, index) => {
        cssVars[`--color-chart-${index}`] = color;
      });
      cssVars[`--color-${key}`] = value.join(', ');
    } else {
      cssVars[`--color-${key}`] = value as string;
    }
  });
  
  // Typography
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value;
  });
  
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = value.toString();
  });
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars[`--border-radius-${key}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });
  
  // Z-index
  Object.entries(theme.zIndex).forEach(([key, value]) => {
    cssVars[`--z-index-${key}`] = value.toString();
  });
  
  // Animations
  Object.entries(theme.animations).forEach(([key, value]) => {
    cssVars[`--animation-${key}`] = value;
  });
  
  return cssVars;
};

// Responsive utilities
export const mediaQueries = {
  xs: `@media (max-width: ${lightTheme.breakpoints.sm})`,
  sm: `@media (min-width: ${lightTheme.breakpoints.sm})`,
  md: `@media (min-width: ${lightTheme.breakpoints.md})`,
  lg: `@media (min-width: ${lightTheme.breakpoints.lg})`,
  xl: `@media (min-width: ${lightTheme.breakpoints.xl})`,
  xxl: `@media (min-width: ${lightTheme.breakpoints.xxl})`,
  
  // Custom breakpoints
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  
  // Orientation
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
  
  // Interaction
  hover: '@media (hover: hover)',
  touch: '@media (hover: none) and (pointer: coarse)',
  
  // Preferences
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)'
};

// Vietnamese specific utilities
export const vietnameseUtils = {
  currency: {
    format: (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },
    
    formatShort: (amount: number) => {
      if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)}B₫`;
      } else if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M₫`;
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K₫`;
      }
      return `${amount}₫`;
    }
  },
  
  date: {
    format: (date: Date) => {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  },
  
  text: {
    normalizeVietnamese: (text: string) => {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
  }
};

export default {
  lightTheme,
  darkTheme,
  vietnameseTheme,
  blueTheme,
  modernTheme,
  modernDarkTheme,
  getTheme,
  generateCSSVariables,
  mediaQueries,
  vietnameseUtils
};