import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Course } from '@/types';

export const getCourse = async (courseId: string): Promise<Course | null> => {
  const courseDoc = await getDoc(doc(db, 'courses', courseId));
  if (!courseDoc.exists()) {
    return null;
  }

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

export const createCourse = async (course: Omit<Course, 'id' | 'createdAt'>): Promise<string> => {
  const courseRef = doc(collection(db, 'courses'));
  await setDoc(courseRef, {
    ...course,
    createdAt: serverTimestamp(),
  });
  return courseRef.id;
};
