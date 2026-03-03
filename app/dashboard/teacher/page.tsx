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
  getDocs,
  increment 
} from 'firebase/firestore';

import { getCoursesByTeacher } from '@/lib/firebase/courses';
import { parseCSV } from '@/lib/utils/csvParser';
import Header from '@/components/Header';
import ManageCoursesModal from '@/components/ManageCoursesModal';

import {
  Upload,
  Search,
  TrendingUp,
  MoreHorizontal,
  ChevronDown,
  Users,
  AlertTriangle,
  BarChart3,
  Loader2,
  Settings
} from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Course } from '@/types';

type SortOption = 'totalPoints' | 'studentId';

export default function TeacherDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]); 
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('totalPoints');

  const refreshCourses = async (userId: string) => {
    try {
      const teacherCourses = await getCoursesByTeacher(userId);
      setCourses(teacherCourses);
      if (teacherCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(teacherCourses[0].id);
      }
    } catch (error) {
      console.error("載入課程失敗:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await refreshCourses(user.uid);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchClassData = async (courseId: string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'enrollments'), where('courseId', '==', courseId));
      const querySnapshot = await getDocs(q);
      const studentList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          totalPoints: Number(data.totalPoints || 0),
          studentId: data.studentId || "Unknown",
          name: data.name || data.studentId
        };
      });
      setStudents(studentList);
    } catch (error) {
      console.error("抓取數據失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) fetchClassData(selectedCourse);
  }, [selectedCourse]);

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
    const filtered = students.filter(s => 
      String(s.studentId).toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.name && String(s.name).toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'totalPoints') return b.totalPoints - a.totalPoints;
      return String(a.studentId).localeCompare(String(b.studentId));
    });
  }, [students, searchTerm, sortBy]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selectedCourse || !file) return;

    const dateInput = prompt("請輸入本次上傳日期 (例如 0304):", 
      new Date().toLocaleDateString('zh-TW', {month:'2-digit', day:'2-digit'}).replace(/\//g,'')
    );
    if (!dateInput) return;

    setLoading(true);
    try {
      const text = await file.text();
      const rawRows = parseCSV(text);
      if (rawRows.length < 2) throw new Error("檔案格式錯誤或內容為空");

      const headers = rawRows[0].map(h => h.trim());
      const batch = writeBatch(db);

      const idIdx = headers.findIndex(h => ['ID', 'studentId', '學號'].includes(h));
      const nameOrScoreIdx = headers.findIndex(h => ['Name', '姓名', '分數'].includes(h));
      const classIdx = headers.findIndex(h => ['Class', '班級', 'className'].includes(h));

      if (idIdx === -1) throw new Error("找不到學號欄位 (ID/學號)");

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length < 1) continue;

        const studentId = row[idIdx]?.trim() || "";
        if (!studentId) continue;

        // 修正重點：嚴格處理 Name 欄位，確保不出現 undefined
        const rawNameValue = (nameOrScoreIdx !== -1 && row[nameOrScoreIdx]) ? row[nameOrScoreIdx].trim() : "";
        const className = (classIdx !== -1 && row[classIdx]) ? row[classIdx].trim() : "";

        const numericValue = parseFloat(rawNameValue);
        const isNum = !isNaN(numericValue) && rawNameValue !== "";
        
        let finalName = "";
        let pointsToAdd = 0;

        // 如果 Name 是數字或是空的，統一預設名字為學號
        if (isNum || rawNameValue === "") {
          finalName = studentId; 
          pointsToAdd = isNum ? numericValue : 0;
        } else {
          finalName = rawNameValue;
          pointsToAdd = 0;
        }

        const docRef = doc(db, 'enrollments', `${selectedCourse}_${studentId}`);
        
        batch.set(docRef, {
          courseId: selectedCourse,
          studentId: studentId,
          name: finalName, // 確保這裡絕對不是 undefined
          className: className,
          totalPoints: increment(pointsToAdd),
          [`history.date_${dateInput}`]: pointsToAdd,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }

      await batch.commit();
      alert(`匯入成功！日期: ${dateInput}`);
      fetchClassData(selectedCourse);
    } catch (error: any) {
      console.error("Batch error:", error);
      alert("匯入失敗: " + error.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-[#121517] min-h-screen transition-colors duration-300">
      <Header title="Teacher Dashboard" userRole="teacher" />

      <ManageCoursesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        teacherId={auth.currentUser?.uid} 
        courses={courses} 
        onUpdate={() => auth.currentUser && refreshCourses(auth.currentUser.uid)} 
      />

      <main className="max-w-7xl mx-auto p-6 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-black dark:text-white">班級成績管理</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
              Course: <span className="text-primary">{courses.find(c => c.id === selectedCourse)?.name || "Loading..."}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)} 
                className="appearance-none bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl pl-5 pr-10 py-3 text-sm font-bold dark:text-white outline-none shadow-sm cursor-pointer"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <button onClick={() => setIsModalOpen(true)} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-primary border dark:border-gray-700">
              <Settings size={20} />
            </button>

            <label className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-lg transition-transform active:scale-95">
              <Upload size={18} /> Import CSV
              <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* 數據指標 */}
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
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-2xl shadow-sm border-l-4 border-l-[#FF5B59] border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-[#FF5B59] mb-2 font-black uppercase text-[10px] tracking-widest">
              <AlertTriangle size={16} /> At-Risk Students
            </div>
            <p className="text-4xl font-black dark:text-white">{stats.risk}</p>
          </div>
        </div>

        {/* 圖表 */}
        <div className="bg-white dark:bg-[#1a222c] p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="range" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="count" fill="#6BA6DA" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
            <h3 className="text-xs font-black uppercase tracking-widest dark:text-white">Student Roster</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs outline-none dark:text-white w-48 focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400">
              <tr>
                <th className="px-8 py-4">Rank</th>
                <th className="px-8 py-4">Student Info</th>
                <th className="px-8 py-4 text-center">Current Score</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {sortedStudents.map((s, idx) => {
                const isAtRisk = s.totalPoints < 60;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-8 py-5 font-black text-xs text-gray-300">{idx + 1}</td>
                    <td className="px-8 py-5 font-bold dark:text-white">
                      <div className="flex flex-col">
                        <span>{s.studentId}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-xl">
                      <span className={isAtRisk ? 'text-[#FF5B59]' : 'text-primary'}>{s.totalPoints}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black ${isAtRisk ? 'bg-red-100 text-[#FF5B59]' : 'bg-green-100 text-green-600'}`}>
                        {isAtRisk ? 'CRITICAL' : 'STABLE'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <MoreHorizontal className="w-5 h-5 text-gray-300 cursor-pointer ml-auto group-hover:text-gray-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && !loading && (
            <div className="p-20 text-center">
              <p className="text-gray-400 text-sm font-medium italic">Waiting for data synchronization...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}