import { useCallback } from 'react';
import { useFirestore } from './useFirestore';

export interface UsageCounter {
  id: string;
  count: number;
  limit?: number;
  window?: 'daily' | 'monthly' | 'lifetime';
  updatedAt?: string;
  createdAt?: string;
}

export function useUsageCounters() {
  const { getDocument, setDocument, updateDocument } = useFirestore();

  const getCounter = useCallback(async (key: string): Promise<UsageCounter | null> => {
    const doc = await getDocument('usage_counters', key);
    return doc as UsageCounter | null;
  }, [getDocument]);

  const assertWithinLimit = useCallback(async (
    key: string,
    limit: number,
    incrementBy = 1,
    window: 'daily' | 'monthly' | 'lifetime' = 'daily'
  ): Promise<number> => {
    if (incrementBy <= 0) return 0;

    const now = new Date().toISOString();
    const existing = await getCounter(key);
    const currentCount = existing?.count ?? 0;

    if (currentCount + incrementBy > limit) {
      throw new Error(`Usage limit reached for ${key}. Limit: ${limit}`);
    }

    if (existing) {
      const nextCount = currentCount + incrementBy;
      await updateDocument('usage_counters', key, {
        count: nextCount,
        limit,
        window,
        updatedAt: now,
      });
      return nextCount;
    }

    await setDocument('usage_counters', key, {
      id: key,
      count: incrementBy,
      limit,
      window,
      createdAt: now,
      updatedAt: now,
    });
    return incrementBy;
  }, [getCounter, setDocument, updateDocument]);

  return {
    getCounter,
    assertWithinLimit,
  };
}

