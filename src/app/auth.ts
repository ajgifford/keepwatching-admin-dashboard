import { FirebaseError } from 'firebase/app';
import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { auth, getFirebaseAuthErrorMessage } from './firebaseConfig';
import { clearUser, setError, setLoading, setUser } from './slices/authSlice';
import { AppDispatch } from './store';

export async function signInWithEmail(dispatch: AppDispatch, email: string, password: string): Promise<void> {
  dispatch(setLoading(true));
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    dispatch(setUser(result.user));
  } catch (error) {
    const message =
      error instanceof FirebaseError
        ? getFirebaseAuthErrorMessage(error, 'Sign-in failed. Please try again.')
        : 'Sign-in failed. Please try again.';
    dispatch(setError(message));
    throw error;
  }
}

export async function signOut(dispatch: AppDispatch): Promise<void> {
  await firebaseSignOut(auth);
  dispatch(clearUser());
}

export function initAuthListener(dispatch: AppDispatch): () => void {
  return firebaseOnAuthStateChanged(auth, (user) => {
    dispatch(setUser(user));
  });
}
