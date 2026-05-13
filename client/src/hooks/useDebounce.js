import { useCallback, useRef } from 'react';

/**
 * useDebounce Hook
 * Returns a debounced version of the provided callback.
 * Useful for limiting the frequency of API calls or socket emits (e.g. search, typing).
 */
export const useDebounce = (callback, delay) => {
  const timer = useRef(null);

  const debouncedFunction = useCallback((...args) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  return debouncedFunction;
};
