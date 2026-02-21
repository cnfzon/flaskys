import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc, 
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Course } from '@/types';

export const getCourse = async (courseId: string): Promise<Course | null> => {
  const courseDoc = await getDoc(doc(db, 'courses', courseId));
  if (!courseDoc.exists()) return null;

  const data = courseDoc.data();
  return {
    id: courseDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as Course;
};

export const getCoursesByTeacher = async (teacherId: string): Promise<Course[]> => {
  const coursesRef = collection(db, 'courses');
  const q = query(coursesRef, where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Course;
  });
};

/**
 * @param teacherId 老師 UID
 * @param courseName 課程名稱
 * @param customCode 老師自定義的邀請碼
 */
export const createCourse = async (teacherId: string, courseName: string, customCode: string): Promise<string> => {
  const courseRef = collection(db, 'courses');

  const q = query(courseRef, where('inviteCode', '==', customCode));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error("此邀請碼已被其他課程使用，請換一個。");
  }

  const newCourseData = {
    name: courseName,
    teacherId: teacherId,
    inviteCode: customCode, 
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(courseRef, newCourseData);
  return docRef.id;
};

export const deleteCourse = async (courseId: string) => {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    console.error("刪除課程失敗:", error);
    throw error;
  }
};