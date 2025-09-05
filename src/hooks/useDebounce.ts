import { useEffect, useState } from "react";

/**
 * Hook para implementar debounce en búsquedas
 * @param value Valor a debouncer
 * @param delay Tiempo de espera en millisegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
