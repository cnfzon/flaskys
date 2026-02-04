'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import DailyRoster from './DailyRoster';

interface GradeCalendarProps {
  courseId: string;
  userRole: string;
  currentUserUid: string;
}

export default function GradeCalendar({ courseId, userRole, currentUserUid }: GradeCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [highlightDays, setHighlightDays] = useState<string[]>([]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!courseId) return;
      try {
        const q = query(collection(db, 'enrollments'), where('courseId', '==', courseId));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => doc.data());
        setAllEnrollments(data);

        const dates = new Set<string>();
        data.forEach((enroll: any) => {
          enroll.weeklyHistory?.forEach((h: any) => {
            if (h.date) dates.add(h.date);
          });
        });
        setHighlightDays(Array.from(dates));
      } catch (e) {
        console.error("Fetch highlighting error:", e);
      }
    };
    fetchEnrollments();
  }, [courseId]);

  // 修正：明確定義 date 型別為 Date
  const isDateHighlighted = (date: Date) => {
    const formatted = `${date.getMonth() + 1}/${date.getDate()}`;
    return highlightDays.includes(formatted);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-white dark:bg-[#1a222c] p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md mx-auto"
          modifiers={{ highlighted: (date: Date) => isDateHighlighted(date) }}
          modifiersClassNames={{ 
            highlighted: "bg-primary/20 text-primary font-black rounded-full ring-2 ring-primary/30" 
          }}
        />
        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400">
          <div className="w-3 h-3 rounded-full bg-primary/30 ring-1 ring-primary"></div>
          <span>評量發布日期</span>
        </div>
      </div>

      <div className="lg:col-span-2">
        <DailyRoster 
          selectedDate={selectedDate ? `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}` : ''}
          enrollments={allEnrollments}
          userRole={userRole}
          currentUserUid={currentUserUid}
        />
      </div>
    </div>
  );
}