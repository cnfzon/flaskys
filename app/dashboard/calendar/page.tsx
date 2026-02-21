'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import { getCoursesByTeacher } from '@/lib/firebase/courses';
import Header from '@/components/Header';
import GradeCalendar from '@/components/calendar/GradeCalendar';

interface UserData {
  uid: string;
  role: 'teacher' | 'student';
  currentCourseId?: string;
  displayName?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        router.push('/login');
        return;
      }
      try {
        const userData = await getUserData(fbUser.uid) as UserData;
        if (userData) {
          setUser(userData);
          if (userData.role === 'teacher') {
            const teacherCourses = await getCoursesByTeacher(fbUser.uid);
            setCourses(teacherCourses);
            if (teacherCourses.length > 0) setSelectedCourse(teacherCourses[0].id);
          } else {
            // 修正：增加判斷以防學生端出錯
            //setSelectedCourse(userData.currentCourseId || '');
            const studentCourseId = userData.currentCourseId || 'circuit-theory'; 
            setSelectedCourse(studentCourseId);
          }
        }
      } catch (error) {
        console.error("Calendar data error:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="p-10 text-center dark:text-white font-bold">Loading Calendar...</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Header userRole={user?.role} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-black dark:text-white tracking-tighter">Academic Calendar</h1>
          {user?.role === 'teacher' && courses.length > 0 && (
            <div className="relative">
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 pr-12 text-sm font-bold dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <GradeCalendar 
          courseId={selectedCourse} 
          userRole={user?.role} 
          currentUserUid={user?.uid} 
        />
      </main>
    </div>
  );
}