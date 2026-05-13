import { useEffect, useRef } from 'react';

/**
 * USE INTERSECTION OBSERVER HOOK
 * Detects when an element enters or leaves the viewport.
 * Used for scroll-triggered entrance animations on the landing page.
 */
export const useIntersectionObserver = (callback, options = { threshold: 0.1 }) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          // Unobserve after first intersection if we only want one-time animation
          if (elementRef.current) observer.unobserve(elementRef.current);
        }
      });
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) observer.unobserve(elementRef.current);
    };
  }, [callback, options]);

  return elementRef;
};
