'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import { getStudentData, getLeaderboard } from '@/lib/firebase/students';
import { calculatePRValue, anonymizeStudentId } from '@/lib/utils/calculations';
import Header from '@/components/Header';
import {
  School,
  Download,
  Plus,
  Trophy,
  TrendingUp,
  Scale,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Student } from '@/types';

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [leaderboard, setLeaderboard] = useState<Student[]>([]);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== 'student') {
        router.push('/login');
        return;
      }

      // Fetch student data
      const studentData = await getStudentData(user.uid);
      if (studentData) {
        setStudent(studentData);
        // Fetch leaderboard with current student ID
        const lb = await getLeaderboard('default-course', leaderboardLimit, studentData.id);
        setLeaderboard(lb);
      } else {
        // Fetch leaderboard without current student
        const lb = await getLeaderboard('default-course', leaderboardLimit);
        setLeaderboard(lb);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, leaderboardLimit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No student data found</div>
      </div>
    );
  }

  const totalPoints = student.totalPoints || 0;
  const maxPoints = 1000;
  const finalExamWeight = Math.max(0, 100 - (totalPoints / maxPoints) * 100);
  const currentPR = student.prValue || 0;

  // Prepare chart data
  const chartData = student.scores.map((score) => ({
    week: `Week ${score.week}`,
    points: score.cumulativePoints,
    weekNum: score.week,
  }));

  // Calculate all students' points for PR calculation
  const allPoints = leaderboard.map((s) => s.totalPoints);
  const prValue = calculatePRValue(totalPoints, allPoints);

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#121517] font-display min-h-screen flex flex-col overflow-x-hidden">
      <Header userRole="student" />
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <a
            className="text-[#677683] text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            href="#"
          >
            Courses
          </a>
          <span className="text-[#677683] text-sm font-medium">/</span>
          <span className="text-[#121517] dark:text-white text-sm font-medium">Circuit Theory</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#121517] dark:text-white text-4xl md:text-5xl font-black tracking-[-0.033em] drop-shadow-sm">
              Circuit Theory
            </h1>
            <p className="text-[#677683] text-base font-normal">Fall Semester 2023 - EE 201</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] text-[#121517] dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5" />
              <span>Syllabus</span>
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Submit Assignment</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-16 h-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="text-[#677683] w-5 h-5" />
              <p className="text-[#677683] text-sm font-medium uppercase tracking-wider">
                Total Points
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-primary text-5xl font-bold leading-tight">{totalPoints}</p>
              <p className="text-[#677683] text-lg font-medium">/ {maxPoints}</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[#677683] bg-background-light dark:bg-[#252b36] w-fit px-2 py-1 rounded">
              <span>Top {Math.round(100 - prValue)}% of class</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-gray-500" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-[#677683] w-5 h-5" />
              <p className="text-[#677683] text-sm font-medium uppercase tracking-wider">
                Current PR Value
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[#121517] dark:text-white text-4xl font-bold leading-tight">
                {prValue.toFixed(1)}
              </p>
            </div>
            <p className="text-[#1F2937] text-sm font-bold mt-2">
              You are in the Top {Math.round(100 - prValue)}% of your class
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Scale className="w-16 h-16 text-[#FF5B59]" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="text-[#677683] w-5 h-5" />
              <p className="text-[#677683] text-sm font-medium uppercase tracking-wider">
                Final Exam Weight
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[#FF5B59] text-4xl font-bold leading-tight">
                {finalExamWeight.toFixed(1)}%
              </p>
            </div>
            <p className="text-[#677683] text-sm font-medium mt-1">
              Decreased by <span className="text-[#078838] font-bold">4.5%</span> due to point
              accumulation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[#121517] dark:text-white text-lg font-bold">
                  Cumulative Progress
                </h3>
                <p className="text-[#677683] text-sm">Points accumulated over the semester</p>
              </div>
              <select className="bg-[#f6f7f8] dark:bg-[#252b36] border-none text-sm font-medium text-[#121517] dark:text-white rounded px-3 py-1 cursor-pointer outline-none focus:ring-2 focus:ring-primary/20">
                <option>This Semester</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="relative w-full h-[320px] pt-4 pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ca7da" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#6ca7da" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="week"
                    stroke="#677683"
                    fontSize={12}
                    tick={{ fill: '#677683' }}
                  />
                  <YAxis
                    stroke="#677683"
                    fontSize={12}
                    tick={{ fill: '#677683' }}
                    domain={[0, maxPoints]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121517',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="points"
                    stroke="#6ca7da"
                    strokeWidth={3}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col bg-white dark:bg-[#1a2027] border border-[#e5e7eb] dark:border-[#2d3748] rounded-xl shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#121517] dark:text-white text-lg font-bold">
                Anonymous Rankings
              </h3>
              <span
                className="text-[#677683] cursor-help text-lg"
                title="IDs are obfuscated for privacy"
              >
                ℹ️
              </span>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setLeaderboardLimit(3)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  leaderboardLimit === 3
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Top 3
              </button>
              <button
                onClick={() => setLeaderboardLimit(10)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  leaderboardLimit === 10
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Top 10
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="pb-3 text-xs font-bold text-[#677683] uppercase tracking-wider pl-2">
                      Rank
                    </th>
                    <th className="pb-3 text-xs font-bold text-[#677683] uppercase tracking-wider">
                      ID
                    </th>
                    <th className="pb-3 text-xs font-bold text-[#677683] uppercase tracking-wider text-right pr-2">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {leaderboard.map((lbStudent, index) => {
                    const isCurrentStudent = lbStudent.id === student.id;
                    return (
                      <tr
                        key={lbStudent.id}
                        className={`group hover:bg-[#f6f7f8] dark:hover:bg-[#252b36] transition-colors border-b border-[#f1f2f4] dark:border-[#2d3748] ${
                          isCurrentStudent
                            ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary'
                            : ''
                        }`}
                      >
                        <td
                          className={`py-3 pl-2 font-bold ${
                            isCurrentStudent
                              ? 'text-primary'
                              : 'text-[#121517] dark:text-gray-200'
                          }`}
                        >
                          {lbStudent.rank || index + 1}
                        </td>
                        <td
                          className={`py-3 font-mono ${
                            isCurrentStudent
                              ? 'text-primary font-bold'
                              : 'text-[#677683]'
                          }`}
                        >
                          {isCurrentStudent ? 'YOU' : anonymizeStudentId(lbStudent.studentId)}
                        </td>
                        <td
                          className={`py-3 pr-2 text-right font-medium ${
                            isCurrentStudent
                              ? 'font-bold text-primary'
                              : 'text-[#121517] dark:text-gray-200'
                          }`}
                        >
                          {lbStudent.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#2d3748] text-center">
              <button className="text-sm text-primary font-medium hover:underline">
                View Full Leaderboard
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
