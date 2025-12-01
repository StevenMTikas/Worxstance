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
      if (currentUser) {
        setUser(currentUser);
        setIsAuthReady(true);
      } else {
        // No user is signed in.
        // Enforce mandatory sign-in: Fallback to anonymous if no token logic is pending
        // (If we just called signInWithCustomToken, this might fire with null first? 
        //  Actually onAuthStateChanged usually fires with the result if initiated immediately?
        //  Safest to just try anon if null, unless we explicitly want to wait.
        //  But signInAnonymously is idempotent-ish in that it creates a session.)
        
        // However, if we are in the middle of a token sign-in, we might race.
        // But since signInWithCustomToken is async, and we called it *before* setting up the listener?
        // No, we call it in the same tick.
        
        // Let's rely on the fact that if token is present, we try it. 
        // If it fails, or if it succeeds, onAuthStateChanged fires.
        
        // If we are here (user is null), either:
        // 1. Initial load, no persistence, no token.
        // 2. Token sign-in failed.
        // 3. User logged out.
        
        // Check if we should auto-anon-login.
        // If token is present in URL, we assume we tried it.
        // If it failed (still null), we can fall back to anon.
        
        signInAnonymously(auth).catch((err) => {
            console.error("Anonymous sign-in failed", err);
            // Even if failed, we mark auth as ready so the app doesn't hang
            setIsAuthReady(true);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    // Note: signOut will trigger onAuthStateChanged(null), 
    // which will trigger signInAnonymously() again due to our logic above.
    // This effectively resets the user to a new anonymous identity.
  };

  const value: AuthContextValue = {
    user,
    userId: user ? user.uid : null,
    isAuthReady,
    login,
    register,
    logout
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
