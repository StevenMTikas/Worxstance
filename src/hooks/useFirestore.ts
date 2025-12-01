import { 
  doc, 
  collection, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  getDocs,
  onSnapshot,
  DocumentData,
  WithFieldValue,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { useCallback } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// App namespace constant - could also come from env
const APP_ID = import.meta.env.VITE_APP_ID || 'worxstance_v1';

export function useFirestore() {
  const { userId, isAuthReady } = useAuth();

  // Helper to construct secure user-specific path
  // Returns: /artifacts/{APP_ID}/users/{userId}/{collectionName}
  const getUserCollectionPath = useCallback((collectionName: string) => {
    if (!userId) throw new Error('User not authenticated');
    return `/artifacts/${APP_ID}/users/${userId}/${collectionName}`;
  }, [userId]);

  // Helper for single document path
  // Returns: /artifacts/{APP_ID}/users/{userId}/{collectionName}/{docId}
  const getUserDocumentPath = useCallback((collectionName: string, docId: string) => {
    if (!userId) throw new Error('User not authenticated');
    return `/artifacts/${APP_ID}/users/${userId}/${collectionName}/${docId}`;
  }, [userId]);

  // Set (Overwrite or Create)
  const setDocument = useCallback(async <T extends WithFieldValue<DocumentData>>(
    collectionName: string, 
    docId: string, 
    data: T
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    const docRef = doc(db, path);
    return setDoc(docRef, data);
  }, [isAuthReady, userId, getUserDocumentPath]);

  // Add (Auto-ID) - effectively setting a new doc reference
  const addDocument = useCallback(async <T extends WithFieldValue<DocumentData>>(
    collectionName: string,
    data: T
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserCollectionPath(collectionName);
    const newDocRef = doc(collection(db, path)); // Generate ID client-side
    await setDoc(newDocRef, data);
    return newDocRef.id;
  }, [isAuthReady, userId, getUserCollectionPath]);

  // Get Single Doc
  const getDocument = useCallback(async (collectionName: string, docId: string) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }, [isAuthReady, userId, getUserDocumentPath]);

  // Update
  const updateDocument = useCallback(async (
    collectionName: string, 
    docId: string, 
    data: Partial<DocumentData>
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    return updateDoc(doc(db, path), data);
  }, [isAuthReady, userId, getUserDocumentPath]);

  // Delete
  const deleteDocument = useCallback(async (collectionName: string, docId: string) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    return deleteDoc(doc(db, path));
  }, [isAuthReady, userId, getUserDocumentPath]);

  // Query Collection
  const queryCollection = useCallback(async (
    collectionName: string, 
    constraints: QueryConstraint[] = []
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserCollectionPath(collectionName);
    const collRef = collection(db, path);
    const q = query(collRef, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, [isAuthReady, userId, getUserCollectionPath]);

  // Subscribe to Collection
  const subscribeToCollection = useCallback((
    collectionName: string,
    callback: (data: any[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserCollectionPath(collectionName);
    const collRef = collection(db, path);
    const q = query(collRef, ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, (error) => {
      console.error(`Error subscribing to collection ${collectionName}:`, error);
    });
  }, [isAuthReady, userId, getUserCollectionPath]);

  // Subscribe to Document
  const subscribeToDocument = useCallback((
    collectionName: string,
    docId: string,
    callback: (data: any) => void
  ): Unsubscribe => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    
    return onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error subscribing to document ${collectionName}/${docId}:`, error);
    });
  }, [isAuthReady, userId, getUserDocumentPath]);

  return {
    setDocument,
    addDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryCollection,
    subscribeToCollection,
    subscribeToDocument,
    isAuthReady,
    userId
  };
}
