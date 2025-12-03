import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Support both naming conventions for environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID ||
    undefined
};

// Validate required Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  const errorMessage = `Missing required Firebase configuration: ${missingFields.join(', ')}. ` +
    `Please set the following environment variables: ${missingFields.map(f => {
      const fieldName = f.replace(/([A-Z])/g, '_$1').toUpperCase();
      return `VITE_FIREBASE_${fieldName} or VITE_APP_FIREBASE_${fieldName}`;
    }).join(', ')}`;
  console.error('Firebase Configuration Error:', errorMessage);
  
  // Show user-friendly error in browser
  if (typeof window !== 'undefined') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px;">
          <h1 style="color: #dc2626; margin-top: 0;">Configuration Error</h1>
          <p style="color: #374151; line-height: 1.6;">
            The application is missing required Firebase configuration. Please check your environment variables.
          </p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">
            Missing: ${missingFields.join(', ')}
          </p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    `;
  }
  
  throw new Error(errorMessage);
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  console.error('Firebase initialization error:', error);
  
  // Show user-friendly error in browser
  if (typeof window !== 'undefined') {
    const errorMessage = error?.message || 'Unknown Firebase error';
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px;">
          <h1 style="color: #dc2626; margin-top: 0;">Firebase Error</h1>
          <p style="color: #374151; line-height: 1.6;">
            ${errorMessage.includes('invalid-api-key') 
              ? 'Invalid Firebase API key. Please check your environment variables.' 
              : 'Failed to initialize Firebase. Please check your configuration.'}
          </p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">
            Error: ${errorMessage}
          </p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    `;
  }
  
  throw error;
}

// Export auth and firestore instances
export const auth = getAuth(app);

// Initialize Firestore with settings (ignoreUndefinedProperties to prevent crashes with optional form fields)
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const perf = getPerformance(app);
export const analyticsPromise =
  typeof window !== 'undefined'
    ? isAnalyticsSupported().then((supported) => (supported ? getAnalytics(app) : null))
    : Promise.resolve(null);

export default app;
