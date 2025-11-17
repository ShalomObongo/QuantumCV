import { adminDb as db } from './admin';
import { UserProfile, Document, ResumeData } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// User Profile Operations
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('users').doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) return null;

      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('users').doc(uid);
    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const updateUserTheme = async (
  uid: string,
  theme: 'light' | 'dark'
): Promise<void> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('users').doc(uid);
    await docRef.update({
      'preferences.theme': theme,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    throw error;
  }
};

export const saveResumeData = async (
  uid: string,
  resumeData: ResumeData
): Promise<void> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('users').doc(uid);
    await docRef.update({
      resumeData,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving resume data:', error);
    throw error;
  }
};

// Document Operations
export const createDocument = async (
  documentData: Omit<Document, 'id' | 'createdAt'>
): Promise<string> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('documents').doc();
    await docRef.set({
      ...documentData,
      createdAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const getDocument = async (documentId: string): Promise<Document | null> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('documents').doc(documentId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) return null;

      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Document;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const getUserDocuments = async (
  userId: string,
  limitCount: number = 50
): Promise<Document[]> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const querySnapshot = await db
      .collection('documents')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const documents: Document[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Document);
    });

    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    await db.collection('documents').doc(documentId).delete();
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const updateDocument = async (
  documentId: string,
  updates: Partial<Document>
): Promise<void> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const docRef = db.collection('documents').doc(documentId);
    await docRef.update(updates);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};
