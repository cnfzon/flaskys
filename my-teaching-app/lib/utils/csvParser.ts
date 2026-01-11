import Papa from 'papaparse';
import { ScoreRecord } from '@/types';

export interface CSVRow {
  studentId: string;
  week?: string | number;
  points?: string | number;
  totalPoints?: string | number;
  [key: string]: string | number | undefined;
}

export const parseCSV = (file: File): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as CSVRow[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const processStudentData = (rows: CSVRow[]): Map<string, { totalPoints: number; scores: ScoreRecord[] }> => {
  const studentMap = new Map<string, { totalPoints: number; scores: ScoreRecord[] }>();

  rows.forEach((row) => {
    const studentId = String(row.studentId || '').trim();
    if (!studentId) return;

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, { totalPoints: 0, scores: [] });
    }

    const student = studentMap.get(studentId)!;

    // If row has week and points, add to scores
    if (row.week !== undefined && row.points !== undefined) {
      const week = Number(row.week) || 0;
      const points = Number(row.points) || 0;
      const cumulativePoints = student.totalPoints + points;

      student.scores.push({
        week,
        points,
        cumulativePoints,
        timestamp: new Date(),
      });

      student.totalPoints = cumulativePoints;
    }

    // If row has totalPoints, use that directly
    if (row.totalPoints !== undefined) {
      const totalPoints = Number(row.totalPoints) || 0;
      student.totalPoints = totalPoints;
    }
  });

  return studentMap;
};
