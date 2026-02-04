'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { School, Bell, LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/firebase/auth';

interface HeaderProps {
  title?: string;
  userRole?: 'student' | 'teacher';
}

export default function Header({ title = 'EduTrack Admin', userRole = 'teacher' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  // 輔助函式：判斷該連結是否為目前所在頁面以顯示高亮
  const isActive = (path: string) => pathname === path;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e5e7eb] bg-white dark:bg-[#1a2027] dark:border-[#2d3748] px-10 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-4 text-[#121517] dark:text-white">
        <div className="size-8 flex items-center justify-center text-primary">
          <School className="w-8 h-8" />
        </div>
        <h2 className="text-[#121517] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          {title}
        </h2>
      </div>

      <div className="flex flex-1 justify-end gap-8">
        <nav className="hidden md:flex items-center gap-9">
          {/* Dashboard: 根據角色跳轉 */}
          <Link
            className={`text-sm font-medium transition-colors ${
              isActive(userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')
                ? 'text-primary font-bold'
                : 'text-[#121517] dark:text-gray-300 hover:text-primary'
            }`}
            href={userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}
          >
            Dashboard
          </Link>

          {/* Calendar 連結 */}
          <Link
            className={`text-sm font-medium transition-colors ${
              isActive('/dashboard/calendar') 
                ? 'text-primary font-bold' 
                : 'text-[#121517] dark:text-gray-300 hover:text-primary'
            }`}
            href="/dashboard/calendar"
          >
            Calendar
          </Link>

          {/* 僅學生帳號顯示 Grades */}
          {userRole === 'student' && (
            <Link
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard/grades') 
                  ? 'text-primary font-bold' 
                  : 'text-[#121517] dark:text-gray-300 hover:text-primary'
              }`}
              href="/dashboard/grades"
            >
              Grades
            </Link>
          )}

          {/* Methodology: 修正後的根路徑 */}
          <Link
            className={`text-sm font-medium transition-colors ${
              isActive('/methodology') 
                ? 'text-primary font-bold' 
                : 'text-[#121517] dark:text-gray-300 hover:text-primary'
            }`}
            href="/methodology"
          >
            Methodology
          </Link>
        </nav>

        {/* 右側圖示按鈕 */}
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center text-[#677683] hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center text-[#677683] hover:text-primary transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}