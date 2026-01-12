'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
// 1. 修正導入：補上所有缺失的 Firestore 函數
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import { anonymizeStudentId, calculatePRValue } from '@/lib/utils/calculations';
import Header from '@/components/Header';
import {
  Download,
  Plus,
  Trophy,
  TrendingUp,
  Scale,
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

export default function StudentDashboard() {
  const router = useRouter();
  // 2. 修正狀態定義：補上缺失的狀態
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);

  const maxPoints = 1000;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // 獲取使用者基礎資料
        const userData = await getUserData(user.uid);
        setCurrentUserData(userData);

        // 核心修正：僅讀取該學生的選課紀錄以符合安全性規則
        const enrollQuery = query(
          collection(db, 'enrollments'),
          where('studentUid', '==', user.uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        
        if (!enrollSnap.empty) {
          const myEnrollment = enrollSnap.docs[0].data();
          setEnrollment(myEnrollment);

          // 只有在有選課的情況下，才抓取排行榜
          const lbQuery = query(
            collection(db, 'enrollments'),
            where('courseId', '==', myEnrollment.courseId),
            orderBy('totalPoints', 'desc'),
            limit(leaderboardLimit)
          );
          const lbSnap = await getDocs(lbQuery);
          setLeaderboard(lbSnap.docs.map(doc => doc.data()));
        }
      } catch (error) {
        console.error("資料讀取失敗:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, leaderboardLimit]);

  if (loading) return <div className="flex items-center justify-center min-h-screen dark:text-white">Loading...</div>;

  // 如果找不到選課資料
  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header userRole="student" />
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-bold dark:text-white mb-4">尚未加入任何課程</h2>
          <p className="text-[#677683] mb-6">請聯繫教師獲取課號並加選。</p>
        </div>
      </div>
    );
  }

  const totalPoints = enrollment.totalPoints || 0;
  const prValue = calculatePRValue(totalPoints, leaderboard.map(s => s.totalPoints));
  const finalExamWeight = Math.max(0, 100 - (totalPoints / maxPoints) * 100);

  // 暫時使用單點數據呈現圖表
  const chartData = [{ week: 'Current', points: totalPoints }];

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#121517] min-h-screen flex flex-col overflow-x-hidden font-sans">
      <Header userRole="student" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-[#677683] text-sm font-medium">Courses / </span>
          <span className="text-[#121517] dark:text-white text-sm font-medium">Circuit Theory</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[#121517] dark:text-white text-4xl md:text-5xl font-black tracking-tight">Circuit Theory</h1>
            <p className="text-[#677683] text-base">Fall Semester 2023 - EE 201</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] text-[#121517] dark:text-white text-sm font-bold shadow-sm">
              <Download className="w-5 h-5" /> Syllabus
            </button>
            <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md">
              <Plus className="w-5 h-5" /> Submit Assignment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Points Card */}
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm relative group">
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Trophy className="w-12 h-12 text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <Trophy className="w-4 h-4" /> Total Points
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-primary text-5xl font-bold">{totalPoints}</p>
              <p className="text-[#677683] text-lg">/ {maxPoints}</p>
            </div>
          </div>

          {/* PR Card */}
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm relative">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <TrendingUp className="w-4 h-4" /> Current PR Value
            </div>
            <p className="text-[#121517] dark:text-white text-4xl font-bold">{prValue.toFixed(1)}</p>
            <p className="text-[#1F2937] dark:text-gray-300 text-sm font-bold mt-2">You are in the Top {Math.round(100 - prValue)}%</p>
          </div>

          {/* Exam Weight Card */}
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm relative">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <Scale className="w-4 h-4" /> Final Exam Weight
            </div>
            <p className="text-[#FF5B59] text-4xl font-bold">{finalExamWeight.toFixed(1)}%</p>
            <p className="text-[#677683] text-sm mt-1">Calculated based on current accumulation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl p-6">
            <h3 className="text-[#121517] dark:text-white text-lg font-bold mb-6">Cumulative Progress</h3>
            <div className="h-75 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="week" stroke="#677683" fontSize={12} />
                  <YAxis stroke="#677683" fontSize={12} domain={[0, maxPoints]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="points" stroke="#6ca7da" fill="#6ca7da" fillOpacity={0.1} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl p-6">
            <h3 className="text-[#121517] dark:text-white text-lg font-bold mb-4">Anonymous Rankings</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-[#677683] uppercase border-b border-[#e5e7eb] dark:border-[#2d3748]">
                  <th className="pb-3 pl-2">Rank</th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3 text-right pr-2">Score</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {leaderboard.map((lbStudent, index) => {
                  const isCurrent = lbStudent.studentUid === currentUserData?.uid;
                  return (
                    <tr key={index} className={`border-b border-[#f1f2f4] dark:border-[#2d3748] ${isCurrent ? 'bg-primary/10' : ''}`}>
                      <td className="py-3 pl-2 font-bold">{index + 1}</td>
                      <td className="py-3 font-mono text-[#677683]">{isCurrent ? 'YOU' : anonymizeStudentId(lbStudent.studentId)}</td>
                      <td className="py-3 pr-2 text-right font-bold dark:text-white">{lbStudent.totalPoints}</td>
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