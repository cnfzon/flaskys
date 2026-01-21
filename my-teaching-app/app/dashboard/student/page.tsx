'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
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
import JoinCourseModal from '@/components/JoinCourseModal';
import {
  Download,
  Plus,
  Trophy,
  TrendingUp,
  Scale,
  PlusCircle
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
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const maxPoints = 100;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userData = await getUserData(user.uid);
        setCurrentUserData(userData);

        const enrollQuery = query(
          collection(db, 'enrollments'),
          where('studentUid', '==', user.uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        
        if (!enrollSnap.empty) {
          const myEnrollment = enrollSnap.docs[0].data();
          setEnrollment(myEnrollment);

          if (myEnrollment.courseId) {
            const lbQuery = query(
              collection(db, 'enrollments'),
              where('courseId', '==', myEnrollment.courseId),
              orderBy('totalPoints', 'desc'),
              limit(10)
            );
            const lbSnap = await getDocs(lbQuery);
            setLeaderboard(lbSnap.docs.map(doc => doc.data()));
          }
        }
      } catch (error) {
        console.error("資料讀取失敗:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen dark:bg-[#121517] dark:text-white">Loading...</div>;

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header userRole="student" />
        <main className="flex flex-col items-center justify-center py-32 px-4">
          <div className="bg-white dark:bg-[#1a2027] p-10 rounded-3xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-xl text-center max-w-md w-full">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlusCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">尚未加入任何課程</h2>
            <p className="text-[#677683] mb-8">請輸入教師提供的 6 位數課號以追蹤您的學期進度。</p>
            <button 
              onClick={() => setShowJoinModal(true)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
            >
              立即加選課程
            </button>
          </div>
          {showJoinModal && (
            <JoinCourseModal 
              user={currentUserData} 
              onJoined={() => window.location.reload()} 
              onClose={() => setShowJoinModal(false)} 
            />
          )}
        </main>
      </div>
    );
  }

  // --- 關鍵修正：動態轉換圖表數據 ---
  const rawHistory = enrollment.weeklyHistory || [];
  
  // 1. 確保數據依照時間排序
  const sortedHistory = [...rawHistory].sort((a, b) => {
    // 提取日期部分 (例如 "9/15") 並轉換為 Date 物件進行比較
    const parseDate = (d: string) => {
      const parts = d.split('/')[0] + '/' + d.split('/')[1].split(',')[0];
      return new Date(`${new Date().getFullYear()}/${parts.trim()}`).getTime();
    };
    return parseDate(a.date) - parseDate(b.date);
  });

  // 2. 計算累計分數 (Cumulative Points)
  let cumulativeSum = 0;
  const chartData = sortedHistory.map((item) => {
    cumulativeSum += (Number(item.points) || 0); // 逐周累加分數
    return {
      displayDate: item.date,           // X 軸顯示文字 (包含 "part 1" 等備註)
      weeklyPoints: item.points,        // 該周增加的分數
      cumulativePoints: Number(cumulativeSum.toFixed(1)) // 累計總分
    };
  });

  const totalPoints = enrollment.totalPoints || 0;
  const prValue = calculatePRValue(totalPoints, leaderboard.map(s => s.totalPoints));
  const finalExamWeight = Math.max(0, 100 - (totalPoints / maxPoints) * 100);

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#121517] min-h-screen flex flex-col font-sans">
      <Header userRole="student" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[#121517] dark:text-white text-4xl md:text-5xl font-black tracking-tight">
              {enrollment.courseName || 'Circuit Theory'}
            </h1>
            <p className="text-[#677683] text-base">Current Enrolled Course</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] text-[#121517] dark:text-white text-sm font-bold shadow-sm"
            >
              <Plus className="w-5 h-5" /> Enroll New
            </button>
            <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md">
              <Download className="w-5 h-5" /> My Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <Trophy className="w-4 h-4" /> Total Points
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-primary text-5xl font-bold">{totalPoints}</p>
              <p className="text-[#677683] text-lg">/ {maxPoints}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <TrendingUp className="w-4 h-4" /> PR Value
            </div>
            <p className="text-[#121517] dark:text-white text-4xl font-bold">{prValue.toFixed(1)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <Scale className="w-4 h-4" /> Final Exam Weight
            </div>
            <p className="text-[#FF5B59] text-4xl font-bold">{finalExamWeight.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl p-6">
            <h3 className="text-[#121517] dark:text-white text-lg font-bold mb-6">Cumulative Progress</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#677683" 
                    fontSize={11} 
                    tickMargin={10}
                  />
                  <YAxis stroke="#677683" fontSize={12} domain={[0, maxPoints]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-[#1a2027] p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">{data.displayDate}</p>
                            <p className="text-primary text-xs font-semibold">累計得分: {data.cumulativePoints}</p>
                            <p className="text-green-500 text-xs font-semibold">當次增加: +{data.weeklyPoints}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativePoints" 
                    stroke="#6ca7da" 
                    fill="#6ca7da" 
                    fillOpacity={0.1} 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#6ca7da" }} 
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl p-6">
            <h3 className="text-[#121517] dark:text-white text-lg font-bold mb-4">Class Rankings</h3>
            <div className="space-y-4">
              {leaderboard.map((lbStudent, index) => {
                const isCurrent = lbStudent.studentUid === currentUserData?.uid;
                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${isCurrent ? 'bg-primary/10 border border-primary/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm w-4">{index + 1}</span>
                      <span className="text-sm">{isCurrent ? 'YOU' : anonymizeStudentId(lbStudent.studentId)}</span>
                    </div>
                    <span className="font-bold">{lbStudent.totalPoints}</span>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">等待排行數據中...</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {showJoinModal && (
        <JoinCourseModal 
          user={currentUserData} 
          onJoined={() => window.location.reload()} 
          onClose={() => setShowJoinModal(false)} 
        />
      )}
    </div>
  );
}