import { 
  doc, 
  collection, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  getDocs,
  DocumentData,
  WithFieldValue,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// App namespace constant - could also come from env
const APP_ID = import.meta.env.VITE_APP_ID || 'worxstance_v1';

export function useFirestore() {
  const { userId, isAuthReady } = useAuth();

  // Helper to construct secure user-specific path
  // Returns: /artifacts/{APP_ID}/users/{userId}/{collectionName}
  const getUserCollectionPath = (collectionName: string) => {
    if (!userId) throw new Error('User not authenticated');
    return `/artifacts/${APP_ID}/users/${userId}/${collectionName}`;
  };

  // Helper for single document path
  // Returns: /artifacts/{APP_ID}/users/{userId}/{collectionName}/{docId}
  const getUserDocumentPath = (collectionName: string, docId: string) => {
    if (!userId) throw new Error('User not authenticated');
    return `/artifacts/${APP_ID}/users/${userId}/${collectionName}/${docId}`;
  };

  // Set (Overwrite or Create)
  const setDocument = async <T extends WithFieldValue<DocumentData>>(
    collectionName: string, 
    docId: string, 
    data: T
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    const docRef = doc(db, path);
    return setDoc(docRef, data);
  };

  // Add (Auto-ID) - effectively setting a new doc reference
  const addDocument = async <T extends WithFieldValue<DocumentData>>(
    collectionName: string,
    data: T
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserCollectionPath(collectionName);
    const newDocRef = doc(collection(db, path)); // Generate ID client-side
    await setDoc(newDocRef, data);
    return newDocRef.id;
  };

  // Get Single Doc
  const getDocument = async (collectionName: string, docId: string) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  };

  // Update
  const updateDocument = async (
    collectionName: string, 
    docId: string, 
    data: Partial<DocumentData>
  ) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    return updateDoc(doc(db, path), data);
  };

  // Delete
  const deleteDocument = async (collectionName: string, docId: string) => {
    if (!isAuthReady || !userId) throw new Error('Auth not ready');
    const path = getUserDocumentPath(collectionName, docId);
    return deleteDoc(doc(db, path));
  };

  // Query Collection
  const queryCollection = async (
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
  };

  return {
    setDocument,
    addDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryCollection,
    isAuthReady,
    userId
  };
}
