import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  isAuthReady: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check for initial auth token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('__initial_auth_token');

    if (token) {
      // Attempt custom token sign-in first
      signInWithCustomToken(auth, token)
        .catch((error) => {
          console.error("Custom token sign-in failed:", error);
          // Fallback will happen in onAuthStateChanged if this fails
        });
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      // No longer auto-signing in anonymously - user must explicitly log in
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
    // After logout, user will be redirected to login/landing page
  };

  const value: AuthContextValue = {
    user,
    userId: user ? user.uid : null,
    isAuthReady,
    login,
    register,
    logout,
    signInAsGuest
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
