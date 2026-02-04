'use client';

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';

export default function DailyRoster({ selectedDate, enrollments, userRole, currentUserUid }: any) {
  const dailyData = useMemo(() => {
    if (!enrollments) return [];
    const list = enrollments.map((enroll: any) => {
      const record = enroll.weeklyHistory?.find((h: any) => h.date === selectedDate);
      return {
        uid: enroll.studentUid,
        studentId: enroll.studentId,
        score: record ? record.points : 0,
      };
    })
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

    return list;
  }, [selectedDate, enrollments]);

  return (
    <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
          <div className="bg-yellow-400/20 p-2 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          評量詳情: <span className="text-primary">{selectedDate || "請選擇日期"}</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto max-h-125 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          {/* 修正：thead 內部必須是 tr */}
          <thead className="bg-gray-50/50 dark:bg-gray-800/10 sticky top-0 z-10">
            <tr>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-gray-400 tracking-widest">Rank</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-gray-400 tracking-widest">User Identity</th>
              <th className="px-8 py-5 text-right text-[10px] uppercase font-black text-gray-400 tracking-widest">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {dailyData.map((item: any, idx: number) => {
              const isMe = item.uid === currentUserUid;
              const displayName = userRole === 'teacher' 
                ? item.studentId 
                : (isMe ? "YOU" : "匿名用戶");

              return (
                <tr key={idx} className={`group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all ${isMe ? 'bg-primary/5' : ''}`}>
                  <td className="px-8 py-5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className={`px-8 py-5 font-bold text-sm ${isMe ? 'text-primary' : 'dark:text-white'}`}>
                    {displayName}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-primary italic text-lg">
                    +{item.score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {dailyData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <p className="text-sm font-bold italic">該日期尚無評量數據或無人拿分</p>
          </div>
        )}
      </div>
    </div>
  );
}