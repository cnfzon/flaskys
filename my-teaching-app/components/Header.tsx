'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { School, Bell, LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/config';

interface HeaderProps {
  title?: string;
  userRole?: 'student' | 'teacher';
}

export default function Header({ title = 'University Portal', userRole = 'student' }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

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
          <Link
            className="text-[#121517] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
            href="/dashboard/student"
          >
            Dashboard
          </Link>
          <Link
            className="text-primary text-sm font-bold leading-normal"
            href={userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}
          >
            Courses
          </Link>
          <Link
            className="text-[#121517] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Calendar
          </Link>
          <Link
            className="text-[#121517] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Grades
          </Link>
          <Link
            className="text-[#121517] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
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
