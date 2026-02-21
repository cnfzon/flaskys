'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  const router = useRouter();

  /*useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.email?.endsWith('.org.tw')) {
          await auth.signOut();
          alert("請使用 .org.tw 的教育帳號登入");
          return;
        }

        const userData = await getUserData(user.uid);
        if (userData) {
          if (userData.role === 'teacher') {
            router.push('/dashboard/teacher');
          } else {
            router.push('/dashboard/student');
          }
        } else {
          console.error("找不到該使用者的角色資料");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);*/
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          if (userData) {
            router.push(userData.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student');
          } else {
            console.warn("帳號已建立但 Firestore 中無對應的角色資料");
          }
        } catch (err) {
          console.error("讀取資料庫失敗：", err);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);


  const handleSuccess = async () => {
    const user = auth.currentUser;
    if (user) {
      if (!user.email?.endsWith('.org.tw')) {
        await auth.signOut();
        alert("登入失敗：僅限 .org.tw 帳號");
        return;
      }

      const userData = await getUserData(user.uid);
      if (userData) {
        if (userData.role === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/student');
        }
      } else {
        console.log("正在初始化使用者資料...");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background-light dark:bg-background-dark font-display antialiased text-gray-900 dark:text-white min-h-screen">
      {/* 登入成功呼叫 */}
      <AuthForm onSuccess={handleSuccess} />
    </div>
  );
}