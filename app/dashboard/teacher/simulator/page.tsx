'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { calculatePRValue } from '@/lib/utils/calculations';
import Header from '@/components/Header';
import {
  Download,
  Plus,
  Trophy,
  TrendingUp,
  Scale,
  ChevronDown,
  Users,
  Eye,
  AlertCircle,
  LogOut
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export default function TeacherSimulator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // 修正：新增 3 與 5 的選項
  const [rankLimit, setRankLimit] = useState<'3' | '5' | '10' | 'all'>('10');

  const maxPoints = 100;

  useEffect(() => {
    async function initSimulator() {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'enrollments'),
          where('courseId', '==', courseId),
          orderBy('totalPoints', 'desc')
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as any[];
        
        setAllEnrollments(docs);
        if (docs.length > 0) {
          setSelectedStudentId(docs[0].studentId || docs[0].id);
        }
      } catch (error) {
        console.error("模擬器初始化失敗:", error);
      } finally {
        setLoading(false);
      }
    }
    initSimulator();
  }, [courseId]);

  const enrollment = useMemo(() => {
    return allEnrollments.find(s => (s.studentId || s.id) === selectedStudentId) || null;
  }, [allEnrollments, selectedStudentId]);

  const stats = useMemo(() => {
    if (!enrollment) return { totalPoints: 0, finalExamWeight: 0, chartData: [], prValue: 0 };

    const tp = enrollment.totalPoints || 0;
    const rawHistory = enrollment.weeklyHistory || [];
    
    const sumWithoutFinal = rawHistory.reduce((acc: number, item: any) => {
      if (item.date === "Final") return acc;
      return acc + (Number(item.points) || 0);
    }, 0);
    const fw = Math.max(0, 100 - sumWithoutFinal);

    const sortedHistory = [...rawHistory].sort((a, b) => {
      const parseToTime = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string') return 0;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          return new Date(`${new Date().getFullYear()}/${parts[0]}/${parts[1]?.split(/[\s,]+/)[0]}`).getTime();
        }
        if (dateStr.toLowerCase().includes('midterm')) return 9999999999998;
        if (dateStr.toLowerCase().includes('final')) return 9999999999999;
        return 0;
      };
      return parseToTime(a.date) - parseToTime(b.date);
    });

    let cumulativeSum = 0;
    const cData = sortedHistory.map((item) => {
      cumulativeSum += (Number(item.points) || 0);
      return {
        displayDate: item.date,
        weeklyPoints: item.points,
        cumulativePoints: Number(cumulativeSum.toFixed(1))
      };
    });

    const pr = calculatePRValue(tp, allEnrollments.map(s => s.totalPoints));
    return { totalPoints: tp, finalExamWeight: fw, chartData: cData, prValue: pr };
  }, [enrollment, allEnrollments]);

  const visibleLeaderboard = useMemo(() => {
    if (rankLimit === 'all') return allEnrollments;
    return allEnrollments.slice(0, parseInt(rankLimit));
  }, [allEnrollments, rankLimit]);

  if (loading) return <div className="flex items-center justify-center min-h-screen dark:bg-[#121517] dark:text-white font-mono uppercase tracking-widest text-xs">Initializing Simulator...</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#121517] min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Header userRole="teacher" />

      {/* 教師控制面板 */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2027]/80 backdrop-blur-md border-b border-primary/20 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Eye className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tighter text-primary">Simulator Mode</p>
              <h2 className="text-sm font-bold dark:text-white">正在模擬學生帳號視角</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 離開按鈕 */}
            <button 
              onClick={() => router.push('/dashboard/teacher')}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-black uppercase transition-all hover:bg-red-100"
            >
              <LogOut size={14} /> Leave
            </button>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="pl-3 pr-1 text-[10px] font-black uppercase text-gray-400 tracking-widest">切換學生:</span>
              <select 
                value={selectedStudentId || ''} 
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-sm font-bold py-1.5 px-3 outline-none dark:text-white min-w-37.5 cursor-pointer"
              >
                {allEnrollments.map((std) => (
                  <option key={std.id} value={std.studentId || std.id} className="dark:bg-gray-900">
                     {std.studentName || std.name || std.studentId || '未知學生'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[#121517] dark:text-white text-4xl md:text-5xl font-black tracking-tight">
              {enrollment?.courseName || 'Course Dashboard'}
            </h1>
            <p className="text-[#677683] text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Viewing Student ID: <span className="font-bold text-primary">{selectedStudentId}</span>
            </p>
          </div>
        </div>

        {/* 數據卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-[10px] font-black tracking-widest"><Trophy className="w-4 h-4" /> Total Points</div>
            <div className="flex items-baseline gap-2">
              <p className="text-primary text-5xl font-bold">{stats.totalPoints}</p>
              <p className="text-[#677683] text-lg font-bold">/ {maxPoints}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-[10px] font-black tracking-widest"><TrendingUp className="w-4 h-4" /> PR Value</div>
            <p className="text-[#121517] dark:text-white text-4xl font-black">{stats.prValue.toFixed(1)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a222c] p-6 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-[10px] font-black tracking-widest"><Scale className="w-4 h-4" /> Final Exam Weight</div>
            <p className="text-[#FF5B59] text-4xl font-black">{stats.finalExamWeight.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 圖表 */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a222c] border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-8 shadow-sm">
            <h3 className="text-[#121517] dark:text-white text-lg font-black mb-10 uppercase tracking-tight">Cumulative Progress</h3>
            <div className="h-80 w-full min-h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.1} />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, maxPoints]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="cumulativePoints" stroke="#6ca7da" fill="#6ca7da" fillOpacity={0.1} strokeWidth={3} dot={{r: 4, fill: '#6ca7da', strokeWidth: 0}} activeDot={{r: 6}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Rankings - 修正排名選項與樣式 */}
          <div className="bg-white dark:bg-[#1a222c] border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#121517] dark:text-white text-lg font-black uppercase tracking-tight">Class Rankings</h3>
              <select 
                value={rankLimit} 
                onChange={(e) => setRankLimit(e.target.value as any)}
                className="text-[10px] font-black bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 px-2 py-1 rounded outline-none cursor-pointer uppercase"
              >
                <option value="3">Top 3</option>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="all">All Rank</option>
              </select>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-105 pr-1">
              {visibleLeaderboard.map((lbStudent, index) => {
                const isCurrent = (lbStudent.studentId || lbStudent.id) === selectedStudentId;
                
                // 復刻前三名金銀銅樣式
                const getRankCircleClass = (i: number) => {
                  if (i === 0) return "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20"; 
                  if (i === 1) return "bg-slate-300 text-white shadow-lg shadow-slate-300/20";   
                  if (i === 2) return "bg-amber-600 text-white shadow-lg shadow-amber-600/20";  
                  return "bg-gray-100 dark:bg-gray-800 text-gray-500";
                };

                return (
                  <div key={index} className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${isCurrent ? 'bg-primary/10 border border-primary/20 scale-[1.02]' : 'border border-transparent'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${getRankCircleClass(index)}`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs ${isCurrent ? 'font-black text-primary' : 'font-bold text-gray-700 dark:text-gray-300'}`}>
                          {isCurrent ? (lbStudent.studentName || lbStudent.name || 'YOU') : 'Student'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black ${isCurrent ? 'text-primary' : 'dark:text-white'}`}>{lbStudent.totalPoints}</span>
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Points</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}