import React, { createContext, useContext, useState } from 'react';
import type { MasterProfile } from '../lib/types';

interface MasterProfileContextValue {
  profile: MasterProfile | null;
  updateProfile: (profile: MasterProfile) => void;
}

const MasterProfileContext = createContext<MasterProfileContextValue | undefined>(undefined);

export const MasterProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<MasterProfile | null>(null);

  const value: MasterProfileContextValue = {
    profile,
    updateProfile: setProfile
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


