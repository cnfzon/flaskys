'use client';

import { useState, useMemo } from 'react';
import { Trophy, Search, ChevronDown } from 'lucide-react';

export default function DailyRoster({ selectedDate, enrollments, userRole, currentUserUid }: any) {
  const [searchId, setSearchId] = useState('');
  const [sortOrder, setSortOrder] = useState<'rank' | 'score_asc'>('rank');

  // 核心邏輯：過濾搜尋內容並執行排序
  const dailyData = useMemo(() => {
    if (!enrollments) return [];
    
    let list = enrollments.map((enroll: any) => {
      const record = enroll.weeklyHistory?.find((h: any) => h.date === selectedDate);
      return {
        uid: enroll.studentUid,
        studentId: enroll.studentId,
        score: record ? record.points : 0,
      };
    })
    .filter((item: any) => item.score > 0);

    // 搜尋過濾
    if (searchId) {
      list = list.filter((item: any) => 
        item.studentId.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    // 排序邏輯
    list.sort((a: any, b: any) => {
      if (sortOrder === 'rank') return b.score - a.score;
      return a.score - b.score;
    });

    return list;
  }, [selectedDate, enrollments, searchId, sortOrder]);

  return (
    <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden h-full flex flex-col transition-all duration-300">
      {/* 標題與控制器區塊 */}
      <div className="p-8 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
            <div className="bg-yellow-400/20 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            評量詳情: <span className="text-primary">{selectedDate || "請選擇日期"}</span>
          </h3>
        </div>

        {/* 1. 搜尋與排序列 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <select 
              value={sortOrder}
              onChange={(e: any) => setSortOrder(e.target.value)}
              className="appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-5 pr-10 text-sm font-bold dark:text-white cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="rank">Sort by Rank</option>
              <option value="score_asc">Lowest First</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-400 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {sortOrder === 'rank' ? idx + 1 : '-'}
                    </div>
                  </td>
                  <td className={`px-8 py-5 font-bold text-sm ${isMe ? 'text-primary' : 'dark:text-white'}`}>
                    {displayName}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-primary italic text-lg">
                    +{item.score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {dailyData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-2">
            <Search className="w-12 h-12 opacity-10" />
            <p className="text-sm font-bold italic">
              {searchId ? `No results found for "${searchId}"` : '該日期尚無評量數據或無人拿分'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}