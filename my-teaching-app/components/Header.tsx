'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { School, Bell, LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/firebase/auth';

interface HeaderProps {
  title?: string;
  userRole?: 'student' | 'teacher';
}

export default function Header({ title = 'EduTrack Admin', userRole = 'student' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  // 根據角色定義 Dashboard 的連結路徑
  const dashboardHref = userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e5e7eb] bg-white dark:bg-[#1a2027] dark:border-[#2d3748] px-10 py-3 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 text-[#121517] dark:text-white">
        <div className="size-8 flex items-center justify-center text-primary">
          <School className="w-8 h-8" />
        </div>
        <h2 className="text-[#121517] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          {userRole === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
        </h2>
      </div>

      <div className="flex flex-1 justify-end gap-8">
        <nav className="hidden md:flex items-center gap-9">
          <Link
            className={`text-sm font-medium transition-colors ${
              isActive(dashboardHref) ? 'text-primary font-bold' : 'text-[#121517] dark:text-gray-300 hover:text-primary'
            }`}
            href={dashboardHref}
          >
            Dashboard
          </Link>

          <Link
            className={`text-sm font-medium transition-colors ${
              isActive('/dashboard/calendar') ? 'text-primary font-bold' : 'text-[#121517] dark:text-gray-300 hover:text-primary'
            }`}
            href="/dashboard/calendar"
          >
            Calendar
          </Link>

          {/* Grades 已根據您的需求，針對老師與學生全面移除 */}

          <Link
            className={`text-sm font-medium transition-colors ${
              isActive('/methodology') ? 'text-primary font-bold' : 'text-[#121517] dark:text-gray-300 hover:text-primary'
            }`}
            href="/methodology"
          >
            Methodology
          </Link>
        </nav>

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