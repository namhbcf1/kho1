// Modern Theme System for Vietnamese POS - Production Ready
import { Theme, lightTheme } from './theme';

export const modernTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    // Enhanced primary colors
    primary: '#2563eb', // Vibrant blue
    primaryHover: '#3b82f6',
    primaryActive: '#1d4ed8',
    secondary: '#8b5cf6', // Purple
    
    // Text colors - improved contrast
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textDisabled: '#9ca3af',
    textWhite: '#ffffff',
    
    // Background colors - more modern
    bgPrimary: '#ffffff',
    bgSecondary: '#f9fafb',
    bgTertiary: '#f3f4f6',
    bgQuaternary: '#e5e7eb',
    
    // Border colors - subtle
    borderPrimary: '#e5e7eb',
    borderSecondary: '#f3f4f6',
    borderLight: '#f9fafb',
    
    // Card colors - enhanced
    cardBg: '#ffffff',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
    cardBorder: '#f3f4f6',
    
    // Vietnamese business colors - more vibrant
    vndGreen: '#10b981',
    vndRed: '#ef4444',
    vndOrange: '#f59e0b',
    vndBlue: '#3b82f6',
    vndPurple: '#8b5cf6',
    
    // Gradients - more modern
    gradientPrimary: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    gradientSuccess: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    gradientWarning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    gradientError: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    gradientInfo: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    
    // Status colors - more vibrant
    statusOnline: '#10b981',
    statusOffline: '#9ca3af',
    statusBusy: '#f59e0b',
    statusError: '#ef4444',
    statusWarning: '#f59e0b',
    statusSuccess: '#10b981',
    
    // Chart colors - more vibrant and distinct
    chartColors: [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
      '#ec4899', '#ef4444', '#84cc16', '#eab308', '#6366f1'
    ]
  },
  
  typography: {
    ...lightTheme.typography,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  
  // Enhanced shadows for more depth
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
  },
  
  // More rounded corners
  borderRadius: {
    ...lightTheme.borderRadius,
    md: '10px',
    lg: '14px',
    xl: '18px',
  },
  
  // Enhanced animations
  animations: {
    ...lightTheme.animations,
    smooth: 'cubic-bezier(0.45, 0, 0.15, 1)',
  }
};

// Dark version of modern theme
export const modernDarkTheme: Theme = {
  ...modernTheme,
  colors: {
    ...modernTheme.colors,
    // Text colors for dark mode
    textPrimary: '#f9fafb',
    textSecondary: '#d1d5db',
    textDisabled: '#6b7280',
    
    // Background colors for dark mode
    bgPrimary: '#111827',
    bgSecondary: '#1f2937',
    bgTertiary: '#374151',
    bgQuaternary: '#4b5563',
    
    // Border colors for dark mode
    borderPrimary: '#374151',
    borderSecondary: '#1f2937',
    borderLight: '#1f2937',
    
    // Card colors for dark mode
    cardBg: '#1f2937',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    cardBorder: '#374151',
  }
};

export default {
  modernTheme,
  modernDarkTheme
}; 