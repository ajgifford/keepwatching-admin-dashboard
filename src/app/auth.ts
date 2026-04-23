import { FirebaseError } from 'firebase/app';
import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';

import { auth, getFirebaseAuthErrorMessage } from './firebaseConfig';
import { clearUser, SerializableUser, setError, setLoading, setUser } from './slices/authSlice';
import { AppDispatch } from './store';

function toSerializableUser(user: User): SerializableUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
  };
}

export async function signInWithEmail(dispatch: AppDispatch, email: string, password: string): Promise<void> {
  dispatch(setLoading(true));
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    dispatch(setUser(toSerializableUser(result.user)));
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
    dispatch(setUser(user ? toSerializableUser(user) : null));
  });
}
