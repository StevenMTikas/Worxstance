/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase config - support both naming conventions
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_APP_FIREBASE_API_KEY?: string;
  readonly VITE_APP_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_APP_FIREBASE_PROJECT_ID?: string;
  readonly VITE_APP_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_APP_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_APP_FIREBASE_APP_ID?: string;
  readonly VITE_APP_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_APP_ID: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ADZUNA_APP_ID?: string;
  readonly VITE_ADZUNA_APP_KEY?: string;
  readonly VITE_JOOBLE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

