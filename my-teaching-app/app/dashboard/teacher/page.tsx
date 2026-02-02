'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import Papa from 'papaparse';
import { 
  writeBatch, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';

import { getStudentsByCourse } from '@/lib/firebase/students';
import { getCoursesByTeacher } from '@/lib/firebase/courses';
import { getGradeDistribution } from '@/lib/utils/calculations';
import { parseCSV } from '@/lib/utils/csvParser';
import Header from '@/components/Header';

// 修正：補齊所有缺失的圖示匯入
import {
  Upload,
  Search,
  TrendingUp,
  MoreHorizontal,
  ChevronDown,
  Users,
  AlertTriangle,
} from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Student, Course } from '@/types';

type SortOption = 'totalPoints' | 'studentId' | 'points' | 'weight';

export default function TeacherDashboard() {
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('totalPoints');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const teacherCourses = await getCoursesByTeacher(user.uid);
          setCourses(teacherCourses);
          if (teacherCourses.length > 0) {
            setSelectedCourse(teacherCourses[0].id);
          }
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;
      setLoading(true);
      try {
        const studentList = await getStudentsByCourse(selectedCourse);
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedCourse]);

const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!selectedCourse || !file) return;

  setLoading(true);
  try {
    const text = await file.text();
    const rawRows = parseCSV(text);
    if (rawRows.length < 2) throw new Error("CSV 格式錯誤");

    const headers = rawRows[0].map(h => h.trim());
    const batch = writeBatch(db);

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length < 3) continue;

      const studentId = row[2]?.trim();
      if (!studentId) continue;

      let currentAccumulatedPoints = 0;
      let rawFinalGrade = 0;
      let feedbackScore = 0;
      const history: { date: string; points: number }[] = [];

      headers.forEach((header, index) => {
        const rawValue = row[index]?.trim() || "0";
        const score = parseFloat(rawValue) || 0;

        const isWeeklyGrade = header.includes('/') || header.toLowerCase().includes('midterm');
        
        if (isWeeklyGrade) {
          currentAccumulatedPoints += score;
          history.push({ date: header, points: score });
        } else if (header === 'Final') {
          rawFinalGrade = score;
        } else if (header.includes('Course Feedback')) {
          feedbackScore = score;
          history.push({ date: "Course Feedback", points: score });
        }
      });

      const earnedFinalPoints = (100 - currentAccumulatedPoints) * (rawFinalGrade / 100);
      const finalTotalPoints = currentAccumulatedPoints + earnedFinalPoints;

      history.push({ date: "Final", points: Number(earnedFinalPoints.toFixed(2)) });

      const docId = `${selectedCourse}_${studentId}`;
      const docRef = doc(db, 'enrollments', docId);

      batch.set(docRef, {
        courseId: selectedCourse,
        studentId: studentId,
        totalPoints: Number(finalTotalPoints.toFixed(1)),
        final: rawFinalGrade,
        preFinalTotal: Number(earnedFinalPoints.toFixed(2)),
        weeklyHistory: history,
        courseFeedback: feedbackScore,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    alert("成績計算完成並成功導入！");
    const updatedStudents = await getStudentsByCourse(selectedCourse);
    setStudents(updatedStudents);
  } catch (error: any) {
    console.error("上傳失敗:", error);
    alert(`上傳失敗: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleEditScore = async (studentId: string, currentValue: number) => {
    if (editingStudent === studentId) {
      try {
        setLoading(true);
        // enrollment ID
        const studentRef = doc(db, 'enrollments', studentId);
        await updateDoc(studentRef, { totalPoints: editValue, lastUpdated: serverTimestamp() });
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, totalPoints: editValue } : s));
        setEditingStudent(null);
      } catch (error) {
        alert("更新失敗");
      } finally {
        setLoading(false);
      }
    } else {
      setEditingStudent(studentId);
      setEditValue(currentValue);
    }
  };

  const classAverage = useMemo(() => {
    if (students.length === 0) return 0;
    return students.reduce((acc, s) => acc + (s.totalPoints || 0), 0) / students.length;
  }, [students]);

  const atRiskStudents = useMemo(() => {
    return students.filter(s => (s.totalPoints || 0) < 60).length;
  }, [students]);

  const sortedStudents = useMemo(() => {
    const filtered = students.filter(s => s.studentId?.toLowerCase().includes(searchTerm.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (sortBy === 'totalPoints' || sortBy === 'points') return (b.totalPoints || 0) - (a.totalPoints || 0);
      return (a.studentId || '').localeCompare(b.studentId || '');
    });
  }, [students, searchTerm, sortBy]);

  const gradeDistribution = useMemo(() => getGradeDistribution(students), [students]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#121517] min-h-screen flex flex-col overflow-x-hidden">
      <Header title="EduTrack Admin" userRole="teacher" />
      <main className="flex-1 flex flex-col p-6 gap-6 max-w-360 mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[#121517] dark:text-white tracking-tight text-[28px] font-bold leading-tight">
              Class Overview
            </h1>
            <p className="text-[#677683] dark:text-[#9ba8b6] text-sm mt-1">
              Manage student performance and exam weighting
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-40">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-[#dde1e4] dark:border-[#2a343e] bg-white dark:bg-[#1a222c] text-sm font-bold text-[#121517] dark:text-white appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <option key={course.id} value={course.id} className="text-black dark:text-white">
                      {course.name || "未命名課程"}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>無可用課程</option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-[#677683]" />
            </div>

            <label className="flex items-center justify-center rounded-lg h-10 bg-primary hover:bg-[#5b95c6] text-white gap-2 px-4 text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95">
              <Upload className="w-5 h-5" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white dark:bg-[#1a222c] border border-[#dde1e4] dark:border-[#2a343e] shadow-sm">
            <div className="flex items-center gap-2 text-[#677683] dark:text-[#9ba8b6]">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm font-medium">Class Average</p>
            </div>
            <p className="text-[#121517] dark:text-white text-2xl font-bold">
              {classAverage.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>+2.1% from midterm</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white dark:bg-[#1a222c] border border-[#dde1e4] dark:border-[#2a343e] shadow-sm">
            <div className="flex items-center gap-2 text-[#677683] dark:text-[#9ba8b6]">
              <Users className="w-5 h-5" />
              <p className="text-sm font-medium">Total Students</p>
            </div>
            <p className="text-[#121517] dark:text-white text-2xl font-bold">{students.length}</p>
            <div className="flex items-center gap-1 text-xs text-[#677683] dark:text-[#9ba8b6] font-medium">
              <span>Active enrolled</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white dark:bg-[#1a222c] border border-[#dde1e4] dark:border-[#2a343e] shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
            <div className="flex items-center gap-2 text-[#677683] dark:text-[#9ba8b6]">
              <AlertTriangle className="w-5 h-5 text-[#FF5B59]" />
              <p className="text-sm font-medium">At-Risk Students</p>
            </div>
            <p className="text-[#121517] dark:text-white text-2xl font-bold">{atRiskStudents}</p>
            <div className="flex items-center gap-1 text-xs text-[#FF5B59] font-medium">
              <span>High final exam weight</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a222c] rounded-xl border border-[#dde1e4] dark:border-[#2a343e] p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[#121517] dark:text-white text-lg font-bold">
                Progress Distribution
              </h3>
              <p className="text-[#677683] dark:text-[#9ba8b6] text-sm">
                Total learning-progress points across the class
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[#677683] dark:text-[#9ba8b6]">Student Count</span>
              </div>
            </div>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde1e4" />
                <XAxis dataKey="range" stroke="#677683" fontSize={12} />
                <YAxis stroke="#677683" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121517',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#6BA6DA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a222c] rounded-xl border border-[#dde1e4] dark:border-[#2a343e] overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="p-5 border-b border-[#dde1e4] dark:border-[#35414d] flex items-center justify-between">
            <h3 className="text-[#121517] dark:text-white text-lg font-bold">Student Roster</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#677683] w-5 h-5" />
                <input
                  className="pl-8 pr-3 h-8 text-sm rounded border border-[#dde1e4] dark:border-[#35414d] bg-transparent focus:ring-primary focus:border-primary dark:text-white placeholder:text-[#677683]"
                  placeholder="Search ID..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="h-8 px-3 rounded border border-[#dde1e4] dark:border-[#35414d] bg-white dark:bg-[#2a343e] text-sm font-medium text-[#121517] dark:text-white cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                value={sortBy}
                //onChange={(e) => setSortBy(e.target.value as 'points' | 'weight')}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="weight">Sort by Final Exam Weight</option>
                <option value="points">Sort by Points</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] dark:bg-[#1e2732] text-[#677683] dark:text-[#9ba8b6] text-xs font-bold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Current Grade</th>
                  <th className="px-6 py-4">Progress Points</th>
                  <th className="px-6 py-4">Final Exam Weight</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde1e4] dark:divide-[#2a343e]">
                {sortedStudents.map((student: Student) => {
                  const isHighRisk = (student.finalExamWeight || 0) > 50;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#f8fafc] dark:hover:bg-[#1e2732] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            {student.studentId.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-[#121517] dark:text-white">
                            {student.studentId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#121517] dark:text-white font-medium">
                        {student.currentGrade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-[#677683] dark:text-[#9ba8b6]">
                        {editingStudent === student.id ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded text-sm"
                            autoFocus
                          />
                        ) : (
                          `${student.totalPoints} / 100`
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 ${
                          isHighRisk ? 'bg-red-50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-bold ${
                            isHighRisk ? 'text-[#FF5B59]' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {isHighRisk && <AlertTriangle className="w-4 h-4" />}
                          {isHighRisk ? 'Critical' : 'Normal'} ({student.finalExamWeight.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditScore(student.id, student.totalPoints || 0)}
                          className="text-[#677683] hover:text-primary transition-colors p-1"
                        >
                          {editingStudent === student.id ? (
                            <span className="text-sm">Save</span>
                          ) : (
                            <MoreHorizontal className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
