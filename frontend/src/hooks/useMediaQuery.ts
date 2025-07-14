import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isXs = useMediaQuery('(max-width: 575px)');
  const isSm = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 991px)');
  const isLg = useMediaQuery('(min-width: 992px) and (max-width: 1199px)');
  const isXl = useMediaQuery('(min-width: 1200px) and (max-width: 1599px)');
  const isXxl = useMediaQuery('(min-width: 1600px)');

  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl || isXxl;

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile,
    isTablet,
    isDesktop,
    current: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : 'xxl',
  };
}