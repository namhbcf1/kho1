import React, { ReactNode, useMemo } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { ResponsiveContainerProps } from '../types';

const defaultBreakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1600,
  xxl: 1920,
};

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  breakpoints = {},
  className = '',
}) => {
  const finalBreakpoints = { ...defaultBreakpoints, ...breakpoints };
  
  const isXs = useMediaQuery(`(max-width: ${finalBreakpoints.xs - 1}px)`);
  const isSm = useMediaQuery(`(min-width: ${finalBreakpoints.xs}px) and (max-width: ${finalBreakpoints.md - 1}px)`);
  const isMd = useMediaQuery(`(min-width: ${finalBreakpoints.md}px) and (max-width: ${finalBreakpoints.lg - 1}px)`);
  const isLg = useMediaQuery(`(min-width: ${finalBreakpoints.lg}px) and (max-width: ${finalBreakpoints.xl - 1}px)`);
  const isXl = useMediaQuery(`(min-width: ${finalBreakpoints.xl}px)`);

  const currentBreakpoint = useMemo(() => {
    if (isXs) return 'xs';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    if (isXl) return 'xl';
    return 'md';
  }, [isXs, isSm, isMd, isLg, isXl]);

  const containerClass = useMemo(() => {
    const baseClass = 'responsive-container';
    const breakpointClass = `responsive-container--${currentBreakpoint}`;
    return `${baseClass} ${breakpointClass} ${className}`.trim();
  }, [currentBreakpoint, className]);

  return (
    <div className={containerClass} data-breakpoint={currentBreakpoint}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;