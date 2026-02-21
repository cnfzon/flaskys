'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import { calculatePRValue } from '@/lib/utils/calculations';
import Header from '@/components/Header';
import JoinCourseModal from '@/components/JoinCourseModal';
import {
  Download,
  Plus,
  Trophy,
  TrendingUp,
  Scale,
  PlusCircle,
  ChevronDown
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
  const [rankLimit, setRankLimit] = useState<'3' | '5' | '10' | 'all'>('10');

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
              orderBy('totalPoints', 'desc')
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

  const visibleLeaderboard = useMemo(() => {
    if (rankLimit === 'all') return leaderboard;
    return leaderboard.slice(0, parseInt(rankLimit));
  }, [leaderboard, rankLimit]);

  if (loading) return <div className="flex items-center justify-center min-h-screen dark:bg-[#121517] dark:text-white">Loading...</div>;

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#121517]">
        <Header userRole="student" />
        <main className="flex flex-col items-center justify-center py-32 px-4">
          <div className="bg-white dark:bg-[#1a2027] p-10 rounded-3xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-xl text-center max-w-md w-full">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlusCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">尚未加入任何課程</h2>
            <button onClick={() => setShowJoinModal(true)} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all">
              立即加選課程
            </button>
          </div>
          {showJoinModal && <JoinCourseModal user={currentUserData} onJoined={() => window.location.reload()} onClose={() => setShowJoinModal(false)} />}
        </main>
      </div>
    );
  }

const totalPoints = enrollment.totalPoints || 0;
const rawHistory = enrollment.weeklyHistory || [];

const sumWithoutFinal = rawHistory.reduce((acc: number, item: any) => {
  if (item.date === "Final") return acc;
  return acc + (Number(item.points) || 0);
}, 0);

const finalExamWeight = Math.max(0, 100 - sumWithoutFinal);

const sortedHistory = [...rawHistory].sort((a, b) => {
  const parseToTime = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      const month = parts[0];
      const day = parts[1]?.split(/[\s,]+/)[0]; 
      if (month && day) return new Date(`${new Date().getFullYear()}/${month}/${day}`).getTime();
    }
    const lower = dateStr.toLowerCase();
    if (lower.includes('midterm')) return 9999999999998;
    if (lower.includes('final')) return 9999999999999;
    return 0;
  };
  return parseToTime(a.date) - parseToTime(b.date);
});

let cumulativeSum = 0;
const chartData = sortedHistory.map((item) => {
  cumulativeSum += (Number(item.points) || 0);
  return {
    displayDate: item.date,
    weeklyPoints: item.points,
    cumulativePoints: Number(cumulativeSum.toFixed(1))
  };
});

const prValue = calculatePRValue(totalPoints, leaderboard.map(s => s.totalPoints));
  return (
    <div className="bg-background-light dark:bg-background-dark text-[#121517] min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Header userRole="student" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 標題與課程名稱 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[#121517] dark:text-white text-4xl md:text-5xl font-black tracking-tight">
              {enrollment.courseName || 'Circuit Theory'}
            </h1>
            <p className="text-[#677683] text-base">Current Enrolled Course</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowJoinModal(true)} className="flex items-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] text-[#121517] dark:text-white text-sm font-bold shadow-sm">
              <Plus className="w-5 h-5" /> Enroll New
            </button>
            <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md">
              <Download className="w-5 h-5" /> My Report
            </button>
          </div>
        </div>

        {/* 數據卡片區域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <Trophy className="w-4 h-4" /> Total Points
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-primary text-5xl font-bold">{totalPoints}</p>
              <p className="text-[#677683] text-lg">/ {maxPoints}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <TrendingUp className="w-4 h-4" /> PR Value
            </div>
            <p className="text-[#121517] dark:text-white text-4xl font-bold">{prValue.toFixed(1)}</p>
          </div>

          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest">
              <Scale className="w-4 h-4" /> Final Exam Weight
            </div>
            <p className="text-[#FF5B59] text-4xl font-bold">{finalExamWeight.toFixed(1)}%</p>
          </div>
        </div>

        {/* 圖表與排行榜 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 累積進度圖表 */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl p-6 shadow-sm">
            <h3 className="text-[#121517] dark:text-white text-lg font-bold mb-6">Cumulative Progress</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#677683" fontSize={11} tickMargin={10} />
                  <YAxis stroke="#677683" fontSize={12} domain={[0, maxPoints]} />
                  <Tooltip content={({ active, payload }) => {
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
                  }} />
                  <Area type="monotone" dataKey="cumulativePoints" stroke="#6ca7da" fill="#6ca7da" fillOpacity={0.1} strokeWidth={3} dot={{ r: 4, fill: "#6ca7da" }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 班級排行榜 */}
          <div className="bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl p-6 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#121517] dark:text-white text-lg font-bold">Class Rankings</h3>
              <div className="relative inline-block">
                <select 
                  value={rankLimit} 
                  onChange={(e) => setRankLimit(e.target.value as any)} 
                  className="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 outline-none dark:text-white cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="3">Top 3</option>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="all">All Rank</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-[50px_1fr_100px] px-4 py-2 mb-2 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">
              <span>Rank</span><span className="pl-2">User ID</span><span className="text-right">Score</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-105">
              {visibleLeaderboard.map((lbStudent, index) => {
                const isCurrent = lbStudent.studentUid === currentUserData?.uid;
                const getRankStyle = (idx: number) => {
                  if (idx === 0) return "bg-yellow-400 text-white shadow-sm"; 
                  if (idx === 1) return "bg-gray-300 text-white shadow-sm";   
                  if (idx === 2) return "bg-amber-600 text-white shadow-sm";  
                  return "bg-gray-100 dark:bg-gray-800 text-gray-500";
                };

                return (
                  <div key={index} className={`grid grid-cols-[50px_1fr_100px] items-center p-3 rounded-xl transition-all ${isCurrent ? 'bg-primary/10 border border-primary/20 ring-1 ring-primary/30' : 'bg-transparent border border-transparent'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${getRankStyle(index)}`}>{index + 1}</div>
                    <span className={`pl-2 text-xs ${isCurrent ? 'font-black text-primary' : 'font-medium text-gray-500 dark:text-gray-400'}`}>{isCurrent ? 'YOU' : '匿名用戶'}</span>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`text-sm font-black ${isCurrent ? 'text-primary' : 'dark:text-white'}`}>
                        {lbStudent.totalPoints}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Points</span>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && <div className="text-center py-20 text-xs text-gray-400">數據加載中...</div>}
            </div>
            
            {rankLimit !== 'all' && !visibleLeaderboard.some(s => s.studentUid === currentUserData?.uid) && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[10px] text-gray-400 font-bold italic">Scroll or select 'All Rank' to see your position</p>
              </div>
            )}
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