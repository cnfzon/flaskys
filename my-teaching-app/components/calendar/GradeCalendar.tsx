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
  // 修正：初始化 selectedDate
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [highlightDays, setHighlightDays] = useState<string[]>([]);

  // 輔助函式：統一日期格式為 M/D (避免 02/05 這種格式導致比對失敗)
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      // 學生端或老師端都需要 courseId 才能撈取同班同學的成績
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

  const isDateHighlighted = (date: Date) => {
    return highlightDays.includes(formatDate(date));
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
          // 使用修正後的格式化函式傳入日期字串
          selectedDate={formatDate(selectedDate)}
          enrollments={allEnrollments}
          userRole={userRole}
          currentUserUid={currentUserUid}
        />
      </div>
    </div>
  );
}