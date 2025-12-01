import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { MasterProfile } from '../lib/types';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from './AuthContext';

interface MasterProfileContextValue {
  profile: MasterProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (profile: MasterProfile) => Promise<void>;
}

export const MasterProfileContext = createContext<MasterProfileContextValue | undefined>(undefined);

export const MasterProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthReady, userId } = useAuth();
  const { subscribeToDocument, setDocument } = useFirestore();

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to the primary master profile document
    // Path: /artifacts/{APP_ID}/users/{userId}/master_profiles/primary
    const unsubscribe = subscribeToDocument(
      'master_profiles', 
      'primary', 
      (data) => {
        setProfile(data as MasterProfile);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, userId, subscribeToDocument]);

  const updateProfile = useCallback(async (newProfile: MasterProfile) => {
    if (!isAuthReady || !userId) {
      throw new Error('Cannot update profile: User not authenticated');
    }

    try {
      setError(null);
      // We use setDocument with 'primary' ID to ensure singleton per user
      await setDocument('master_profiles', 'primary', newProfile);
      // Local state update happens automatically via subscription
    } catch (err: any) {
      console.error('Failed to update master profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  }, [isAuthReady, userId, setDocument]);

  const value: MasterProfileContextValue = {
    profile,
    loading,
    error,
    updateProfile
  };

  return (
    <MasterProfileContext.Provider value={value}>
      {children}
    </MasterProfileContext.Provider>
  );
};

export const useMasterProfile = (): MasterProfileContextValue => {
  const ctx = useContext(MasterProfileContext);
  if (!ctx) {
    throw new Error('useMasterProfile must be used within a MasterProfileProvider');
  }
  return ctx;
};
