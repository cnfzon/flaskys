export type UserRole = 'student' | 'teacher';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Date;
}

export interface Student {
  id: string;
  studentId: string;
  displayName?: string;
  email?: string;
  scores: ScoreRecord[];
  totalPoints: number;
  currentGrade?: string;
  finalExamWeight: number;
  prValue?: number;
  rank?: number;
}

export interface ScoreRecord {
  week: number;
  points: number;
  cumulativePoints: number;
  timestamp: Date;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  teacherId: string;
  students: string[]; // Student IDs
  createdAt: Date;
}

export interface GradeDistribution {
  range: string;
  count: number;
}
