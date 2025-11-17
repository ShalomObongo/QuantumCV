import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await createUserProfile(user.uid, email, displayName);

    return user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message);
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message);
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth || !db) throw new Error('Firebase not initialized');

  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Check if user profile exists, if not create one
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await createUserProfile(
        user.uid,
        user.email!,
        user.displayName || 'User'
      );
    }

    return user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message);
  }
};

export const signOut = async (): Promise<void> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message);
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message);
  }
};

const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string
): Promise<void> => {
  if (!db) throw new Error('Firebase Firestore not initialized');

  try {
    const userProfile: Partial<UserProfile> = {
      uid,
      email,
      displayName,
      preferences: {
        theme: 'light',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};
