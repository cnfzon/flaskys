// lib/firebase/courses.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc, // 修改為 addDoc 以便自動產生 ID
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Course } from '@/types';

// 產生隨機 6 位數邀請碼
const generateInviteCode = () => Math.floor(100000 + Math.random() * 900000).toString();

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

// 修正：支援自動產生邀請碼與建立課程
export const createCourse = async (teacherId: string, courseName: string): Promise<string> => {
  const courseRef = collection(db, 'courses');
  const newCourse = {
    name: courseName,
    teacherId: teacherId,
    inviteCode: generateInviteCode(),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(courseRef, newCourse);
  return docRef.id;
};

// 新增：刪除課程功能
export const deleteCourse = async (courseId: string) => {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    console.error("刪除課程失敗:", error);
    throw error;
  }
};