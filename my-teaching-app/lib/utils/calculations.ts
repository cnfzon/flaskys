import { Student } from '@/types';

export const calculateFinalExamWeight = (totalPoints: number, maxPoints: number = 1000): number => {
  return Math.max(0, ((maxPoints - totalPoints) / maxPoints) * 100);
};

export const calculatePRValue = (studentPoints: number, allPoints: number[]): number => {
  if (allPoints.length === 0) return 0;
  const sorted = [...allPoints].sort((a, b) => b - a);
  const rank = sorted.findIndex((p) => p <= studentPoints) + 1;
  const total = sorted.length;
  return total > 0 ? ((total - rank + 1) / total) * 100 : 0;
};

export const getGradeDistribution = (students: Student[]): { range: string; count: number }[] => {
  const ranges = [
    { min: 0, max: 20, label: '0-20' },
    { min: 21, max: 40, label: '21-40' },
    { min: 41, max: 60, label: '41-60' },
    { min: 61, max: 80, label: '61-80' },
    { min: 81, max: 90, label: '81-90' },
    { min: 91, max: 1000, label: '91+' },
  ];

  return ranges.map((range) => ({
    range: range.label,
    count: students.filter(
      (s) => s.totalPoints >= range.min && s.totalPoints <= range.max
    ).length,
  }));
};

export const anonymizeStudentId = (studentId: string): string => {
  if (studentId.length <= 6) return studentId;
  const start = studentId.substring(0, 3);
  const end = studentId.substring(studentId.length - 2);
  return `${start}****${end}`;
};
