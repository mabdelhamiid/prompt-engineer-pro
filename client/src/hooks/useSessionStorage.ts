import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing session state with localStorage persistence
 * Automatically syncs state to localStorage and restores on mount
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
) {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (item) {
        return deserialize(item);
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error writing to localStorage for key "${key}":`, error);
      }
    },
    [key, storedValue, serialize]
  );

  // Clear the stored value
  const clearValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error clearing localStorage for key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Get all stored keys for this namespace
  const getAllKeys = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const keys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) keys.push(k);
        }
        return keys;
      }
      return [];
    } catch (error) {
      console.warn("Error getting localStorage keys:", error);
      return [];
    }
  }, []);

  return [storedValue, setValue, clearValue] as const;
}

/**
 * Hook for managing multiple session values at once
 */
export function useSessionState<T extends Record<string, any>>(
  namespace: string,
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState, clearState] = useSessionStorage<T>(namespace, initialState);

  const updateState = useCallback(
    (updates: Partial<T>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    [setState]
  );

  return [state, updateState, clearState];
}
