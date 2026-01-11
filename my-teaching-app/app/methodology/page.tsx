'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import Header from '@/components/Header';
import {
  School,
  BookOpen,
  FileText,
  Zap,
  Target,
  ArrowRight,
  Settings,
  Calendar,
} from 'lucide-react';

export default function MethodologyPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) {
          setAuthenticated(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-[#121517] dark:text-white">
      <div className="relative flex min-h-screen w-full flex-row overflow-hidden">
        <div className="hidden lg:flex w-64 flex-col bg-white dark:bg-[#1e252b] border-r border-[#e5e7eb] dark:border-[#2e363e] h-screen sticky top-0">
          <div className="flex flex-col h-full justify-between p-4">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 px-2">
                <div className="bg-primary/20 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex items-center justify-center text-primary">
                  <School className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-base font-bold leading-normal dark:text-white">
                    Student Portal
                  </h1>
                  <p className="text-[#677683] dark:text-[#9ca3af] text-sm font-normal">
                    Fall Semester 2023
                  </p>
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                <a
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-light dark:hover:bg-[#2a323c] transition-colors"
                  href="/dashboard/student"
                >
                  <School className="w-5 h-5 text-[#677683] dark:text-[#9ca3af]" />
                  <p className="text-[#121517] dark:text-white text-sm font-medium">Dashboard</p>
                </a>
                <a
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
                  href="/methodology"
                >
                  <Target className="w-5 h-5" />
                  <p className="text-sm font-bold">Methodology</p>
                </a>
                <a
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-light dark:hover:bg-[#2a323c] transition-colors"
                  href="#"
                >
                  <FileText className="w-5 h-5 text-[#677683] dark:text-[#9ca3af]" />
                  <p className="text-[#121517] dark:text-white text-sm font-medium">Grades</p>
                </a>
                <a
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-light dark:hover:bg-[#2a323c] transition-colors"
                  href="#"
                >
                  <Calendar className="w-5 h-5 text-[#677683] dark:text-[#9ca3af]" />
                  <p className="text-[#121517] dark:text-white text-sm font-medium">Calendar</p>
                </a>
              </nav>
            </div>
            <div className="flex flex-col gap-2">
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-light dark:hover:bg-[#2a323c] transition-colors"
                href="#"
              >
                <Settings className="w-5 h-5 text-[#677683] dark:text-[#9ca3af]" />
                <p className="text-[#121517] dark:text-white text-sm font-medium">Settings</p>
              </a>
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-8 lg:p-12 gap-8">
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-[#677683] dark:text-[#9ca3af]">
                  <span>Home</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>Methodology</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-[#121517] dark:text-white">
                  Understanding Your Grade Methodology
                </h1>
                <p className="text-base md:text-lg font-normal leading-normal text-[#677683] dark:text-[#9ca3af] max-w-[800px]">
                  The strategic path to passing: The more you earn during the term, the less weight
                  your final exam carries.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#121517] dark:text-white">
                Grade Components
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2e363e] bg-gray-50 dark:bg-[#1e252b] shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#121517] dark:text-white">
                    Midterm Exams (40%)
                  </h3>
                  <p className="text-sm text-[#677683] dark:text-[#9ca3af]">
                    Two major evaluations covering the first half of the material. These form the
                    bulk of your foundational score.
                  </p>
                </div>

                <div className="flex flex-col p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2e363e] bg-gray-50 dark:bg-[#1e252b] shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#121517] dark:text-white">
                    Quizzes (20%)
                  </h3>
                  <p className="text-sm text-[#677683] dark:text-[#9ca3af]">
                    Weekly quick checks to ensure you are keeping up with the content. Consistent
                    effort here pays off.
                  </p>
                </div>

                <div className="flex flex-col p-6 rounded-xl border border-[#e5e7eb] dark:border-[#2e363e] bg-gray-50 dark:bg-[#1e252b] shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#121517] dark:text-white">
                    Activities (30%)
                  </h3>
                  <p className="text-sm text-[#677683] dark:text-[#9ca3af]">
                    Daily participation, homework, and in-class group exercises. Active engagement is
                    key.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-6 mt-4">
              <div className="bg-white dark:bg-[#1e252b] rounded-2xl border border-[#e5e7eb] dark:border-[#2e363e] p-6 md:p-10 shadow-sm">
                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    <div className="flex flex-col gap-2 max-w-[600px]">
                      <h2 className="text-2xl font-bold text-[#121517] dark:text-white flex items-center gap-2">
                        <Target className="w-6 h-6 text-primary" />
                        The Final Exam Strategy
                      </h2>
                      <p className="text-base text-[#677683] dark:text-[#9ca3af]">
                        Visualize your path: If you accumulate{' '}
                        <span className="font-bold text-[#121517] dark:text-white">70 points</span>{' '}
                        now, your final exam only needs to cover the remaining{' '}
                        <span className="font-bold text-[#121517] dark:text-white">30%</span> to
                        reach a perfect score.
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
                        Start Tracking
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-background-light dark:bg-[#2a323c] p-4 rounded-lg border border-[#e5e7eb] dark:border-[#2e363e] mt-2">
                    <p className="text-center text-[#1F2937] dark:text-white text-lg md:text-xl font-bold font-mono">
                      Base Score + (Final Score * Final Weight / 100) = Final Grade
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between text-sm font-bold tracking-wide uppercase text-[#677683] dark:text-[#9ca3af] mb-1">
                    <span>Accumulated Score (90%)</span>
                    <span>Final Exam Weight (10%)</span>
                  </div>
                  <div className="relative w-full h-14 bg-background-light dark:bg-[#2a323c] rounded-full overflow-hidden flex shadow-inner">
                    <div className="h-full bg-[#6BA6DA] flex items-center justify-end px-4 text-white font-bold relative transition-all duration-1000 ease-out w-[70%] group cursor-pointer hover:bg-[#5a95c9]">
                      <span className="absolute left-4 opacity-50 text-xs uppercase tracking-widest">
                        Base Score
                      </span>
                      <span className="text-xl">70 pts</span>
                    </div>
                    <div className="h-full bg-[#FF5B59] flex items-center justify-start px-4 text-white font-bold relative w-[30%] group cursor-pointer hover:bg-[#ff403d] transition-colors">
                      <span className="text-xl">30 pts</span>
                      <span className="absolute right-4 opacity-50 text-xs uppercase tracking-widest hidden sm:inline-block">
                        Remaining
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-[#677683] dark:text-[#9ca3af] mt-2">
                    <p>
                      Current Scenario:{' '}
                      <span className="font-medium text-primary">Passing Zone</span>
                    </p>
                    <p>
                      Required to Pass:{' '}
                      <span className="font-medium text-[#121517] dark:text-white">
                        ~15 pts on Final
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="block md:hidden mt-4">
                <button className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                  Start Tracking
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </section>

            <footer className="mt-8 py-6 border-t border-[#e5e7eb] dark:border-[#2e363e] flex flex-col md:flex-row justify-between items-center text-sm text-[#677683] dark:text-[#9ca3af]">
              <p>© 2023 Student Portal. All rights reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a className="hover:text-primary" href="#">
                  Privacy Policy
                </a>
                <a className="hover:text-primary" href="#">
                  Terms of Service
                </a>
                <a className="hover:text-primary" href="#">
                  Support
                </a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
