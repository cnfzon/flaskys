'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { 
  writeBatch, 
  serverTimestamp,
  doc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

import { getCoursesByTeacher } from '@/lib/firebase/courses';
import { parseCSV } from '@/lib/utils/csvParser';
import Header from '@/components/Header';

import {
  Upload,
  Search,
  TrendingUp,
  MoreHorizontal,
  ChevronDown,
  Users,
  AlertTriangle,
  BarChart3,
  Loader2
} from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Course } from '@/types';

type SortOption = 'totalPoints' | 'studentId';

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('totalPoints');

  // 1. 監聽登入並獲取該老師的課程
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const teacherCourses = await getCoursesByTeacher(user.uid);
          setCourses(teacherCourses);
          if (teacherCourses.length > 0) setSelectedCourse(teacherCourses[0].id);
        } catch (error) {
          console.error("載入課程失敗:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. 核心修正：直接在組件內執行 Firestore 查詢，確保資料獲取與狀態同步
  const fetchClassData = async (courseId: string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      // 直接查詢 enrollments 集合中 courseId 匹配的資料
      const q = query(collection(db, 'enrollments'), where('courseId', '==', courseId));
      const querySnapshot = await getDocs(q);
      
      const studentList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // 強制轉為數字以利後續計算
          totalPoints: Number(data.totalPoints || 0),
          studentId: data.studentId || "Unknown"
        };
      });
      
      setStudents(studentList);
    } catch (error) {
      console.error("抓取學生數據失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) fetchClassData(selectedCourse);
  }, [selectedCourse]);

  // --- 統計計算 ---
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { avg: "0.0", total: 0, risk: 0 };
    const sum = students.reduce((acc, s) => acc + s.totalPoints, 0);
    const risk = students.filter(s => s.totalPoints < 60).length;
    return { avg: (sum / total).toFixed(1), total, risk };
  }, [students]);

  const distribution = useMemo(() => {
    const bins = [
      { range: '0-20', count: 0 }, { range: '21-40', count: 0 },
      { range: '41-60', count: 0 }, { range: '61-80', count: 0 }, { range: '81-100', count: 0 }
    ];
    students.forEach(s => {
      const p = s.totalPoints;
      if (p <= 20) bins[0].count++;
      else if (p <= 40) bins[1].count++;
      else if (p <= 60) bins[2].count++;
      else if (p <= 80) bins[3].count++;
      else bins[4].count++;
    });
    return bins;
  }, [students]);

  const sortedStudents = useMemo(() => {
    const filtered = students.filter(s => s.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (sortBy === 'totalPoints') return b.totalPoints - a.totalPoints;
      return a.studentId.localeCompare(b.studentId);
    });
  }, [students, searchTerm, sortBy]);

  // 3. 上傳 CSV 邏輯
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selectedCourse || !file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const rawRows = parseCSV(text);
      const headers = rawRows[0].map(h => h.trim());
      const batch = writeBatch(db);

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length < 3) continue;
        const studentId = row[2]?.trim();
        
        let accumulated = 0;
        let finalVal = 0;
        const history: any[] = [];

        headers.forEach((header, idx) => {
          const val = parseFloat(row[idx]?.trim()) || 0;
          if (header.includes('/') || header.toLowerCase().includes('midterm')) {
            accumulated += val;
            history.push({ date: header, points: val });
          } else if (header === 'Final') {
            finalVal = val;
          }
        });

        const earnedFinal = (100 - accumulated) * (finalVal / 100);
        const docRef = doc(db, 'enrollments', `${selectedCourse}_${studentId}`);
        batch.set(docRef, {
          courseId: selectedCourse,
          studentId: studentId,
          totalPoints: Number((accumulated + earnedFinal).toFixed(1)),
          preFinalTotal: Number(earnedFinal.toFixed(2)),
          weeklyHistory: [...history, { date: "Final", points: Number(earnedFinal.toFixed(2)) }],
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }
      await batch.commit();
      alert("匯入成功！");
      fetchClassData(selectedCourse);
    } catch (error: any) { alert("匯入失敗: " + error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-[#121517] min-h-screen transition-colors duration-300">
      <Header title="Teacher Dashboard" userRole="teacher" />
      <main className="max-w-7xl mx-auto p-6 flex flex-col gap-8">
        
        {/* 操作區域 */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-black dark:text-white">班級成績管理</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
              Course: {courses.find(c => c.id === selectedCourse)?.name || "Loading..."}
            </p>
          </div>
          <div className="flex gap-3">
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold dark:text-white outline-none">
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 transition-all active:scale-95 shadow-lg">
              <Upload size={18} /> Import CSV
              <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 font-black uppercase text-[10px] tracking-widest">
              <TrendingUp size={16} /> Class Average
            </div>
            <p className="text-4xl font-black text-primary">{stats.avg}</p>
          </div>
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 font-black uppercase text-[10px] tracking-widest">
              <Users size={16} /> Total Students
            </div>
            <p className="text-4xl font-black dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-2xl shadow-sm border-l-4 border-l-[#FF5B59] border-y border-r border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-[#FF5B59] mb-2 font-black uppercase text-[10px] tracking-widest">
              <AlertTriangle size={16} /> At-Risk Students
            </div>
            <p className="text-4xl font-black dark:text-white">{stats.risk}</p>
          </div>
        </div>

        {/* 成績分布圖 */}
        
        <div className="bg-white dark:bg-[#1a222c] p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-8 text-gray-400">
            <BarChart3 size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Progress Distribution (20pt Bins)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="range" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)'}} />
                <Bar dataKey="count" fill="#6BA6DA" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Roster */}
        <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
            <h3 className="text-xs font-black uppercase tracking-widest dark:text-white">Student Roster</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Search ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs outline-none dark:text-white w-48 focus:ring-2 focus:ring-primary/20" />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-[10px] font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl px-3 outline-none dark:text-white">
                <option value="totalPoints">Sort by Rank</option>
                <option value="studentId">Sort by ID</option>
              </select>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400">
              <tr>
                <th className="px-8 py-5">Rank</th>
                <th className="px-8 py-5">Student ID</th>
                <th className="px-8 py-5 text-center">Current Score</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {sortedStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="px-8 py-5 font-black text-xs text-gray-300">{idx + 1}</td>
                  <td className="px-8 py-5 font-bold dark:text-white">{s.studentId}</td>
                  <td className="px-8 py-5 text-center font-black text-primary text-xl">{s.totalPoints}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black ${s.totalPoints < 60 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {s.totalPoints < 60 ? 'CRITICAL' : 'STABLE'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <MoreHorizontal className="w-5 h-5 text-gray-300 cursor-pointer ml-auto group-hover:text-gray-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-gray-200 animate-spin" />
              <p className="text-gray-400 text-sm font-medium italic">Waiting for data synchronization...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}