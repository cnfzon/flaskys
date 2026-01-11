import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Student, ScoreRecord } from '@/types';

export const getStudentData = async (studentId: string): Promise<Student | null> => {
  const studentDoc = await getDoc(doc(db, 'students', studentId));
  if (!studentDoc.exists()) {
    return null;
  }

  const data = studentDoc.data();
  return {
    id: studentDoc.id,
    ...data,
    scores: data.scores?.map((s: any) => ({
      ...s,
      timestamp: s.timestamp?.toDate() || new Date(),
    })) || [],
  } as Student;
};

export const getStudentsByCourse = async (courseId: string): Promise<Student[]> => {
  const studentsRef = collection(db, 'students');
  const q = query(studentsRef, where('courseId', '==', courseId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      scores: data.scores?.map((s: any) => ({
        ...s,
        timestamp: s.timestamp?.toDate() || new Date(),
      })) || [],
    } as Student;
  });
};

export const updateStudentScore = async (
  studentId: string,
  score: ScoreRecord
): Promise<void> => {
  const studentRef = doc(db, 'students', studentId);
  const studentDoc = await getDoc(studentRef);

  if (!studentDoc.exists()) {
    throw new Error('Student not found');
  }

  const currentData = studentDoc.data();
  const scores = currentData.scores || [];
  const newScores = [...scores, { ...score, timestamp: serverTimestamp() }];
  const totalPoints = newScores.reduce((sum, s) => sum + s.points, 0);
  const maxPoints = 1000; // Maximum possible points
  const finalExamWeight = Math.max(0, ((maxPoints - totalPoints) / maxPoints) * 100);

  await updateDoc(studentRef, {
    scores: newScores,
    totalPoints,
    finalExamWeight,
    updatedAt: serverTimestamp(),
  });
};

export const updateStudentTotalPoints = async (
  studentId: string,
  totalPoints: number
): Promise<void> => {
  const studentRef = doc(db, 'students', studentId);
  const maxPoints = 1000; // Maximum possible points
  const finalExamWeight = Math.max(0, ((maxPoints - totalPoints) / maxPoints) * 100);
  await updateDoc(studentRef, {
    totalPoints,
    finalExamWeight,
    updatedAt: serverTimestamp(),
  });
};

export const calculatePRValue = (studentPoints: number, allPoints: number[]): number => {
  const sorted = [...allPoints].sort((a, b) => b - a);
  const rank = sorted.findIndex((p) => p <= studentPoints) + 1;
  const total = sorted.length;
  return ((total - rank + 1) / total) * 100;
};

export const getLeaderboard = async (
  courseId: string,
  limit: number = 10,
  currentStudentId?: string
): Promise<Student[]> => {
  const students = await getStudentsByCourse(courseId);
  const sorted = students
    .map((s) => ({
      ...s,
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const allPoints = sorted.map((s) => s.totalPoints);

  // Get top students
  let topStudents = sorted.slice(0, limit).map((student, index) => ({
    ...student,
    rank: index + 1,
    prValue: calculatePRValue(student.totalPoints, allPoints),
  }));

  // If current student is not in top list, add them
  if (currentStudentId) {
    const currentStudent = sorted.find((s) => s.id === currentStudentId);
    if (currentStudent && !topStudents.find((s) => s.id === currentStudentId)) {
      const currentRank = sorted.findIndex((s) => s.id === currentStudentId) + 1;
      topStudents.push({
        ...currentStudent,
        rank: currentRank,
        prValue: calculatePRValue(currentStudent.totalPoints, allPoints),
      });
      // Sort again to maintain order
      topStudents.sort((a, b) => a.rank - b.rank);
    }
  }

  return topStudents;
};
