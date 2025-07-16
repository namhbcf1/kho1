// Theme Context - Vietnamese POS System 2025
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTheme, generateCSSVariables, ThemeMode, Theme } from '../styles/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: Theme;
  isDark: boolean;
  isVietnamese: boolean;
  toggleTheme: () => void;
  setVietnameseTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultTheme);
  const [theme, setTheme] = useState<Theme>(() => getTheme(defaultTheme));

  // Apply theme changes to DOM
  const applyTheme = (mode: ThemeMode) => {
    const newTheme = getTheme(mode);
    const cssVariables = generateCSSVariables(newTheme);
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Set theme attribute for CSS selectors
    root.setAttribute('data-theme', mode);
    
    // Store theme preference
    localStorage.setItem('kho-theme', mode);
    
    // Update state
    setTheme(newTheme);
    setThemeModeState(mode);
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('kho-theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'vietnamese'].includes(savedTheme)) {
      applyTheme(savedTheme);
    } else {
      applyTheme(defaultTheme);
    }
  }, [defaultTheme]);

  // Theme mode setter with DOM updates
  const setThemeMode = (mode: ThemeMode) => {
    applyTheme(mode);
  };

  // Computed properties
  const isDark = themeMode === 'dark';
  const isVietnamese = themeMode === 'vietnamese';

  // Theme toggle functions
  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
  };

  const setVietnameseTheme = () => setThemeMode('vietnamese');
  const setLightTheme = () => setThemeMode('light');
  const setDarkTheme = () => setThemeMode('dark');

  const contextValue: ThemeContextType = {
    themeMode,
    setThemeMode,
    theme,
    isDark,
    isVietnamese,
    toggleTheme,
    setVietnameseTheme,
    setLightTheme,
    setDarkTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;