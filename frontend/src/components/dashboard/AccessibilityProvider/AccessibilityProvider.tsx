import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useKeyboardNavigation, useFocusAnnouncements, useAriaLiveRegion } from '../../../hooks/useKeyboardNavigation';

interface AccessibilityContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  updateLiveRegion: (message: string, priority?: 'off' | 'polite' | 'assertive') => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  keyboardMode: boolean;
  setKeyboardMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { announce, AnnouncementElement } = useFocusAnnouncements();
  const { updateLiveRegion, LiveRegion } = useAriaLiveRegion();
  
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [keyboardMode, setKeyboardMode] = useState(false);

  // Detect high contrast mode
  useEffect(() => {
    const checkHighContrast = () => {
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      setIsHighContrast(highContrastQuery.matches);
    };

    checkHighContrast();
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', checkHighContrast);

    return () => {
      highContrastQuery.removeEventListener('change', checkHighContrast);
    };
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const checkReducedMotion = () => {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(reducedMotionQuery.matches);
    };

    checkReducedMotion();
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', checkReducedMotion);

    return () => {
      reducedMotionQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  // Detect keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardMode(true);
        document.body.classList.add('keyboard-nav');
      }
    };

    const handleMouseDown = () => {
      setKeyboardMode(false);
      document.body.classList.remove('keyboard-nav');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  // Apply accessibility classes
  useEffect(() => {
    const root = document.documentElement;
    
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (isReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [isHighContrast, isReducedMotion]);

  const contextValue: AccessibilityContextType = {
    announce,
    updateLiveRegion,
    isHighContrast,
    isReducedMotion,
    fontSize,
    setFontSize,
    keyboardMode,
    setKeyboardMode,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      <AnnouncementElement />
      <LiveRegion />
      
      {/* Skip Links */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">
          Chuyển đến nội dung chính
        </a>
        <a href="#navigation" className="skip-link">
          Chuyển đến menu điều hướng
        </a>
        <a href="#dashboard" className="skip-link">
          Chuyển đến dashboard
        </a>
      </div>
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Higher-order component for accessible dashboard widgets
interface WithAccessibilityProps {
  title?: string;
  description?: string;
  role?: string;
  landmark?: boolean;
}

export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAccessibilityProps = {}
) {
  const { title, description, role = 'region', landmark = false } = options;

  return React.forwardRef<any, P>((props, ref) => {
    const { announce } = useAccessibility();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      if (title) {
        announce(`${title} đã tải xong`, 'polite');
      }
    }, [announce, title]);

    if (!mounted) {
      return null;
    }

    const accessibilityProps = {
      role: landmark ? 'main' : role,
      'aria-label': title,
      'aria-describedby': description ? `${title}-description` : undefined,
      tabIndex: -1,
    };

    return (
      <div {...accessibilityProps}>
        {description && (
          <div id={`${title}-description`} className="sr-only">
            {description}
          </div>
        )}
        <Component ref={ref} {...props} />
      </div>
    );
  });
}

// Accessible loading component
export const AccessibleLoading: React.FC<{
  message?: string;
  size?: 'small' | 'default' | 'large';
}> = ({ message = 'Đang tải...', size = 'default' }) => {
  const { announce } = useAccessibility();

  useEffect(() => {
    announce(message, 'polite');
  }, [announce, message]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`accessible-loading accessible-loading--${size}`}
    >
      <div className="accessible-loading__spinner" aria-hidden="true" />
      <span className="sr-only">{message}</span>
    </div>
  );
};

// Accessible error component
export const AccessibleError: React.FC<{
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ message, onRetry, retryLabel = 'Thử lại' }) => {
  const { announce } = useAccessibility();

  useEffect(() => {
    announce(`Lỗi: ${message}`, 'assertive');
  }, [announce, message]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="accessible-error"
    >
      <div className="accessible-error__content">
        <span className="accessible-error__message">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="accessible-error__retry"
            aria-label={`${retryLabel} - ${message}`}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
};

// Accessible status indicator
export const AccessibleStatus: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  showIcon?: boolean;
}> = ({ status, message, showIcon = true }) => {
  const statusIcons = {
    success: '✓',
    warning: '⚠',
    error: '✗',
    info: 'ℹ',
  };

  const statusLabels = {
    success: 'Thành công',
    warning: 'Cảnh báo',
    error: 'Lỗi',
    info: 'Thông tin',
  };

  return (
    <div
      role="status"
      aria-label={`${statusLabels[status]}: ${message}`}
      className={`accessible-status accessible-status--${status}`}
    >
      {showIcon && (
        <span className="accessible-status__icon" aria-hidden="true">
          {statusIcons[status]}
        </span>
      )}
      <span className="accessible-status__message">{message}</span>
      <span className="sr-only">{statusLabels[status]}</span>
    </div>
  );
};

export default AccessibilityProvider;