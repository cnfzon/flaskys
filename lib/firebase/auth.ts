import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '@/types';

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.org\.tw$/.test(email);
};

export const registerUser = async (
  email: string,
  password: string,
  requestedRole: UserRole,
  displayName?: string
): Promise<FirebaseUser> => {
  if (!validateEmail(email)) {
    throw new Error('Email must be from @*.org.tw domain');
  }

  let finalRole: UserRole = 'student';

  try {
    const whitelistDoc = await getDoc(doc(db, 'admin_config', 'whitelist'));
    
    if (whitelistDoc.exists()) {
      const data = whitelistDoc.data();
      const teachersList = data.teachers || [];
     
      if (teachersList.includes(email.toLowerCase())) {
        finalRole = 'teacher';
      }
    }
  } catch (error) {
    console.error("無法讀取白名單，預設為學生角色:", error);
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userData: Omit<User, 'uid'> = {
    email,
    role: finalRole, // 白名單校驗
    displayName: displayName || email.split('@')[0],
    createdAt: new Date(),
  };

  await setDoc(doc(db, 'user', user.uid), {
    ...userData,
    uid: user.uid,
    createdAt: serverTimestamp(),
  });

  return user;
};

export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'user', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        uid,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};