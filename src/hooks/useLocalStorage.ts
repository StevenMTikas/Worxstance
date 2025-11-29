export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = (): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  };

  let value = readValue();

  const setValue = (newValue: T) => {
    value = newValue;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(newValue));
    }
  };

  return [value, setValue] as const;
}


