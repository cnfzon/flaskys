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
  const [accumulatedScore, setAccumulatedScore] = useState(70);

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

  if (loading) return <div className="p-10 text-center dark:text-white font-bold text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-[#121517] dark:text-white">
      <Header title="EduTrack Methodology" userRole={userRole} />

      <main className="max-w-6xl mx-auto p-12 flex flex-col gap-12">
        <header className="flex flex-col gap-4 text-center md:text-left">
          <div className="text-primary font-black text-base tracking-[0.2em] uppercase">Academic Strategy</div>
          {/* 放大主標題 */}
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
            Understanding Your <span className="text-primary">Grade Methodology</span>
          </h1>
          {/* 放大副標題說明文字 */}
          <p className="text-xl md:text-2xl text-[#677683] dark:text-[#9ba8b6] max-w-3xl leading-relaxed">
            The strategic path to passing: The more you earn during the term, the less weight your final exam carries.
          </p>
        </header>

        {/* 成績組成區塊 - 放大內容字體 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MethodCard 
            icon={<BookOpen className="w-8 h-8" />}
            title="Midterm Exams (40%)"
            desc="Two major evaluations covering the first half of the material. These form the bulk of your foundational score."
          />
          <MethodCard 
            icon={<FileText className="w-8 h-8" />}
            title="Quizzes (20%)"
            desc="Weekly quick checks to ensure you are keeping up with the content. Consistent effort here pays off."
          />
          <MethodCard 
            icon={<Zap className="w-8 h-8" />}
            title="Activities (30%)"
            desc="Daily participation, homework, and in-class group exercises. Active engagement is key."
          />
        </section>

        {/* 策略說明區塊 - 強化視覺對比與字級 */}
        <section className="bg-white dark:bg-[#1a222c] rounded-[40px] p-12 border border-gray-100 dark:border-gray-700 shadow-2xl flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col gap-6 flex-1">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl text-primary">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black">The Final Exam Strategy</h3>
              </div>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
                Visualize your path: If you accumulate <span className="text-primary font-black text-2xl px-1">{accumulatedScore} points</span> now, your final exam only needs to cover the remaining <span className="text-primary font-black text-2xl px-1">{100 - accumulatedScore}%</span>.
              </p>
            </div>
            
            <div className="w-full md:w-80 flex flex-col gap-4">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest text-center md:text-left">Simulate Current Score</label>
              <input 
                type="range" min="0" max="90" value={accumulatedScore} 
                onChange={(e) => setAccumulatedScore(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-xl appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* 圓柱進度條 - 放大標籤字體 */}
          <div className="space-y-6">
            <div className="flex justify-between text-xs md:text-sm font-black uppercase tracking-wider text-gray-500">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Accumulated Score ({accumulatedScore}%)
              </span>
              <span className="flex items-center gap-2 text-yellow-500">
                Final Exam Weight ({100 - accumulatedScore}%)
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </span>
            </div>
            <div className="h-20 w-full bg-gray-100 dark:bg-gray-800/50 rounded-3xl overflow-hidden flex p-2 border-2 border-gray-200 dark:border-gray-700/50 shadow-inner">
              <div 
                className="h-full bg-primary rounded-2xl transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center text-white text-sm font-black tracking-widest shadow-xl shadow-primary/20"
                style={{ width: `${accumulatedScore}%` }}
              >
                {accumulatedScore >= 15 && 'EARNED'}
              </div>
              <div 
                className="h-full bg-yellow-400/10 rounded-2xl transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) border-2 border-dashed border-yellow-400/30 ml-2 flex items-center justify-center text-yellow-500 text-xs font-black tracking-tighter"
                style={{ width: `${100 - accumulatedScore}%` }}
              >
                {100 - accumulatedScore >= 20 && 'REMAINING GOAL'}
              </div>
            </div>
          </div>

          {/* 公式區塊 - 放大並加強強調 */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-10 rounded-4xl font-mono text-center border-2 border-dashed border-gray-200 dark:border-gray-700/50 relative group">
            <div className="text-[#677683] dark:text-gray-500 text-base md:text-lg mb-2 uppercase font-black tracking-widest">Grading Formula</div>
            <div className="text-xl md:text-2xl">
              <span className="text-gray-400">Base Score + (Final Score * </span>
              <span className="text-primary font-black underline decoration-primary/30 underline-offset-8">Final Weight</span>
              <span className="text-gray-400"> / 100) =</span> 
              <span className="text-primary font-black text-3xl md:text-4xl ml-4 tracking-tighter italic">Final Grade</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MethodCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white dark:bg-[#1a222c] p-10 rounded-[36px] border border-gray-100 dark:border-gray-700 shadow-lg flex flex-col gap-6 hover:shadow-2xl hover:border-primary/40 transition-all duration-500 group cursor-default">
      <div className="w-16 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-[22px] text-primary shadow-inner group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h4 className="text-2xl font-black">{title}</h4>
      <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}