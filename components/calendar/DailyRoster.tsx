'use client';

import { useState, useMemo } from 'react';
import { Trophy, Search, ChevronDown } from 'lucide-react';

export default function DailyRoster({ selectedDate, enrollments, userRole, currentUserUid }: any) {
  const [searchId, setSearchId] = useState('');
  const [sortOrder, setSortOrder] = useState<'rank' | 'score_asc'>('rank');

  const dailyData = useMemo(() => {
    if (!enrollments) return [];
    
    // 1. 取得當日有分數的清單，並強制先由高到低排序以定出「原始排名」
    const baseList = enrollments.map((enroll: any) => {
      const record = enroll.weeklyHistory?.find((h: any) => h.date === selectedDate);
      return {
        uid: enroll.studentUid,
        studentId: enroll.studentId,
        score: record ? record.points : 0,
      };
    })
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

    const totalStudents = baseList.length;

    // 2. 映射原始排名 (rank) 與 倒數排名 (inverseRank)
    let processed = baseList.map((item: any, idx: number) => ({
      ...item,
      rank: idx + 1,
      inverseRank: totalStudents - idx // 最後一名顯示 1
    }));

    // 3. 搜尋過濾
    if (searchId) {
      processed = processed.filter((item: any) => 
        item.studentId.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    // 4. 根據 UI 選擇執行排序
    processed.sort((a: any, b: any) => {
      if (sortOrder === 'rank') return a.rank - b.rank;
      return a.score - b.score; // Lowest First 排序
    });

    return processed;
  }, [selectedDate, enrollments, searchId, sortOrder]);

  return (
    <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden h-full flex flex-col transition-all duration-300">
      <div className="p-8 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col gap-6">
        <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          評量詳情: <span className="text-primary">{selectedDate || "請選擇日期"}</span>
        </h3>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search ID..." value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold dark:text-white outline-none"
            />
          </div>
          <select 
            value={sortOrder} onChange={(e: any) => setSortOrder(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2.5 px-5 text-sm font-bold dark:text-white cursor-pointer outline-none"
          >
            <option value="rank">Sort by Rank</option>
            <option value="score_asc">Lowest First</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-125">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-800/10 sticky top-0 z-10">
            <tr>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                {sortOrder === 'rank' ? 'Rank' : 'Inverse Rank'}
              </th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-gray-400 tracking-widest">User Identity</th>
              <th className="px-8 py-5 text-right text-[10px] uppercase font-black text-gray-400 tracking-widest">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {dailyData.map((item: any, idx: number) => {
              const isMe = item.uid === currentUserUid;
              const displayRankNum = sortOrder === 'rank' ? item.rank : item.inverseRank;
              const displayName = userRole === 'teacher' ? item.studentId : (isMe ? "YOU" : "匿名用戶");

              return (
                <tr key={idx} className={`group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all ${isMe ? 'bg-primary/5' : ''}`}>
                  <td className="px-8 py-5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                      displayRankNum === 1 ? 'bg-yellow-400 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {displayRankNum}
                    </div>
                  </td>
                  <td className={`px-8 py-5 font-bold text-sm ${isMe ? 'text-primary' : 'dark:text-white'}`}>
                    {displayName}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-primary italic text-lg">+{item.score.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}