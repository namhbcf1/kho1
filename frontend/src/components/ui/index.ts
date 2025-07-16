// UI Components Index - Vietnamese POS System 2025
// Enhanced components with Vietnamese business features

// Base Components
export { default as Button } from './Button/Button';
export { default as Card } from './Card/Card';
export { default as Input } from './Input/Input';
export { default as ThemeToggle } from './ThemeToggle/ThemeToggle';

// Legacy exports
export * from './Button';
export * from './Form';
export * from './Table';
export * from './Upload';
export * from './Modal';
export * from './Loading';
export * from './ErrorBoundary';

// Export types
export type { EnhancedButtonProps } from './Button/Button';
export type { EnhancedCardProps } from './Card/Card';
export type { EnhancedInputProps } from './Input/Input';

// Export utilities
export { useTheme } from '../../contexts/ThemeContext';

// Export constants
export const THEME_MODES = ['light', 'dark', 'vietnamese'] as const;
export const UI_VERSION = '2.0.0';
export const BUILD_DATE = '2025-01-16';

// Export default configuration
export const DEFAULT_CONFIG = {
  theme: 'light',
  language: 'vi',
  currency: 'VND',
  dateFormat: 'dd/MM/yyyy',
  phoneFormat: '+84',
  timezone: 'Asia/Ho_Chi_Minh',
  country: 'VN',
  region: 'APAC'
};
