'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import Header from '@/components/Header';
import { BookOpen, FileText, Zap, PlayCircle } from 'lucide-react';

export default function MethodologyPage() {
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('teacher');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) setUserRole(userData.role as 'student' | 'teacher');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center dark:text-white font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans">
      {/* 修正：將側邊導覽換成原本的上側導覽列 */}
      <Header title="EduTrack Methodology" userRole={userRole} />

      <main className="max-w-6xl mx-auto p-10 flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">Academic Strategy</div>
          <h1 className="text-4xl font-black dark:text-white tracking-tighter">Understanding Your Grade Methodology</h1>
          <p className="text-[#677683] dark:text-[#9ba8b6] max-w-2xl">
            The strategic path to passing: The more you earn during the term, the less weight your final exam carries.
          </p>
        </header>

        {/* 成績組成區塊 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MethodCard 
            icon={<BookOpen className="w-6 h-6" />}
            title="Midterm Exams (40%)"
            desc="Two major evaluations covering the first half of the material. These form the bulk of your foundational score."
          />
          <MethodCard 
            icon={<FileText className="w-6 h-6" />}
            title="Quizzes (20%)"
            desc="Weekly quick checks to ensure you are keeping up with the content. Consistent effort here pays off."
          />
          <MethodCard 
            icon={<Zap className="w-6 h-6" />}
            title="Activities (30%)"
            desc="Daily participation, homework, and in-class group exercises. Active engagement is key."
          />
        </section>

        {/* 策略說明區塊 */}
        <section className="bg-white dark:bg-[#1a222c] rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black dark:text-white">The Final Exam Strategy</h3>
              </div>
              <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                Visualize your path: If you accumulate <span className="text-primary font-bold">70 points</span> now, your final exam only needs to cover the remaining <span className="text-primary font-bold">30%</span> to reach a perfect score.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl font-mono text-sm text-center border dark:border-gray-700">
                <span className="text-gray-400">Base Score + (Final Score * Final Weight / 100) =</span> <span className="text-primary font-bold">Final Grade</span>
              </div>
            </div>
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-primary/20">
              Start Tracking →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function MethodCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white dark:bg-[#1a222c] p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-4 hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl text-primary shadow-inner">
        {icon}
      </div>
      <h4 className="text-lg font-black dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}