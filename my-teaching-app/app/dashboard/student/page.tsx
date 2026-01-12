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
import JoinCourseModal from '@/components/JoinCourseModal'; // 確保組件已建立
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
  const [showJoinModal, setShowJoinModal] = useState(false); // 控制加選彈窗

  const maxPoints = 1000;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userData = await getUserData(user.uid);
        setCurrentUserData(userData);

        // 核心修正：精確過濾 studentUid 以符合安全性規則
        const enrollQuery = query(
          collection(db, 'enrollments'),
          where('studentUid', '==', user.uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        
        if (!enrollSnap.empty) {
          const myEnrollment = enrollSnap.docs[0].data();
          setEnrollment(myEnrollment);

          // 只有確定有 courseId 後才抓取排行榜，避免空查詢報錯
          if (myEnrollment.courseId) {
            const lbQuery = query(
              collection(db, 'enrollments'),
              where('courseId', '==', myEnrollment.courseId),
              orderBy('totalPoints', 'desc'), // 這裡必須搭配 orderBy 與安全性規則索引
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

  // 引導畫面：若找不到選課資料時顯示
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

  // 數據運算
  const totalPoints = enrollment.totalPoints || 0;
  const prValue = calculatePRValue(totalPoints, leaderboard.map(s => s.totalPoints));
  const finalExamWeight = Math.max(0, 100 - (totalPoints / maxPoints) * 100);
  const chartData = [{ week: 'Week 1', points: 0 }, { week: 'Current', points: totalPoints }];

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#121517] min-h-screen flex flex-col font-sans">
      <Header userRole="student" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[#121517] dark:text-white text-4xl md:text-5xl font-black tracking-tight">{enrollment.courseName || 'Circuit Theory'}</h1>
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

        {/* 積分與統計卡片區塊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest"><Trophy className="w-4 h-4" /> Total Points</div>
            <div className="flex items-baseline gap-2">
              <p className="text-primary text-5xl font-bold">{totalPoints}</p>
              <p className="text-[#677683] text-lg">/ {maxPoints}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest"><TrendingUp className="w-4 h-4" /> PR Value</div>
            <p className="text-[#121517] dark:text-white text-4xl font-bold">{prValue.toFixed(1)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2027] p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#677683] uppercase text-xs font-bold tracking-widest"><Scale className="w-4 h-4" /> Final Exam Weight</div>
            <p className="text-[#FF5B59] text-4xl font-bold">{finalExamWeight.toFixed(1)}%</p>
          </div>
        </div>

        {/* 圖表與排行榜 */}
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
            </div>
          </div>
        </div>
      </main>

      {/* 渲染彈窗 */}
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