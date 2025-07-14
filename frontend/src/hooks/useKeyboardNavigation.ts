import { useEffect, useRef, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  trapFocus?: boolean;
  escapeKey?: () => void;
  autoFocus?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    trapFocus = false,
    escapeKey,
    autoFocus = false,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const firstFocusableElementRef = useRef<HTMLElement | null>(null);
  const lastFocusableElementRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'details > summary',
      'iframe',
    ].join(', ');

    const elements = Array.from(
      container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    return elements.filter(element => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.hasAttribute('aria-hidden') &&
        element.tabIndex !== -1
      );
    });
  }, []);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    firstFocusableElementRef.current = focusableElements[0] || null;
    lastFocusableElementRef.current = focusableElements[focusableElements.length - 1] || null;
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    switch (event.key) {
      case 'Escape':
        if (escapeKey) {
          event.preventDefault();
          escapeKey();
        }
        break;

      case 'Tab':
        if (trapFocus) {
          const focusableElements = getFocusableElements(containerRef.current);
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
        break;

      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusNext();
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusPrevious();
        break;

      case 'Home':
        event.preventDefault();
        focusFirst();
        break;

      case 'End':
        event.preventDefault();
        focusLast();
        break;
    }
  }, [enabled, trapFocus, escapeKey, getFocusableElements]);

  const focusNext = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const previousIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[previousIndex]?.focus();
  }, [getFocusableElements]);

  const focusFirst = useCallback(() => {
    firstFocusableElementRef.current?.focus();
  }, []);

  const focusLast = useCallback(() => {
    lastFocusableElementRef.current?.focus();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    updateFocusableElements();

    if (autoFocus) {
      requestAnimationFrame(() => {
        firstFocusableElementRef.current?.focus();
      });
    }

    container.addEventListener('keydown', handleKeyDown);
    
    // Update focusable elements when DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-hidden'],
    });

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, [enabled, autoFocus, handleKeyDown, updateFocusableElements]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    updateFocusableElements,
  };
}

// Hook for managing focus announcements
export function useFocusAnnouncements() {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) return;

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;

    // Clear the announcement after a short delay
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  const createAnnouncementElement = useCallback(() => {
    return (
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
    );
  }, []);

  return {
    announce,
    AnnouncementElement: createAnnouncementElement,
  };
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const addSkipLink = useCallback((href: string, label: string) => {
    if (!skipLinksRef.current) return;

    const skipLink = document.createElement('a');
    skipLink.href = href;
    skipLink.className = 'skip-link';
    skipLink.textContent = label;
    
    skipLinksRef.current.appendChild(skipLink);
  }, []);

  const createSkipLinksContainer = useCallback(() => {
    return (
      <div ref={skipLinksRef} className="skip-links" aria-label="Skip navigation links">
        <a href="#main-content" className="skip-link">
          Chuyển đến nội dung chính
        </a>
        <a href="#navigation" className="skip-link">
          Chuyển đến menu điều hướng
        </a>
        <a href="#search" className="skip-link">
          Chuyển đến tìm kiếm
        </a>
      </div>
    );
  }, []);

  return {
    addSkipLink,
    SkipLinksContainer: createSkipLinksContainer,
  };
}

// Hook for managing ARIA live regions
export function useAriaLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateLiveRegion = useCallback((
    message: string,
    priority: 'off' | 'polite' | 'assertive' = 'polite'
  ) => {
    if (!liveRegionRef.current) return;

    liveRegionRef.current.setAttribute('aria-live', priority);
    liveRegionRef.current.textContent = message;

    if (priority === 'off') {
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 100);
    }
  }, []);

  const createLiveRegion = useCallback(() => {
    return (
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
    );
  }, []);

  return {
    updateLiveRegion,
    LiveRegion: createLiveRegion,
  };
}

// Hook for focus trap
export function useFocusTrap(active: boolean = false) {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !trapRef.current) return;

    const trapElement = trapRef.current;
    const focusableElements = trapElement.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Focus should return to the element that triggered the trap
        const triggerElement = document.querySelector('[data-focus-trap-trigger]') as HTMLElement;
        if (triggerElement) {
          triggerElement.focus();
        }
      }
    };

    trapElement.addEventListener('keydown', handleTabKey);
    trapElement.addEventListener('keydown', handleEscapeKey);

    // Focus the first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      trapElement.removeEventListener('keydown', handleTabKey);
      trapElement.removeEventListener('keydown', handleEscapeKey);
    };
  }, [active]);

  return { trapRef };
}

export default {
  useKeyboardNavigation,
  useFocusAnnouncements,
  useSkipLinks,
  useAriaLiveRegion,
  useFocusTrap,
};