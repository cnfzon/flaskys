// components/JoinCourseModal.tsx
import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function JoinCourseModal({ user, studentId, onJoined }: any) {
  const [inviteCode, setInviteCode] = useState('');

  const handleJoin = async () => {
    // 1. 搜尋課程代碼是否存在
    const q = query(collection(db, 'courses'), where('inviteCode', '==', inviteCode));
    const snap = await getDocs(q);
    
    if (snap.empty) return alert('找不到此課號');

    const courseId = snap.docs[0].id;

    // 2. 建立選課紀錄，這會觸發 Firestore 自動建立 enrollment 文件
    await addDoc(collection(db, 'enrollments'), {
      courseId,
      studentUid: user.uid,
      studentId: studentId,
      totalPoints: 0,
      createdAt: serverTimestamp()
    });

    onJoined(); // 成功後重新整理頁面
  };

  return (
    <div className="p-6 bg-white dark:bg-[#1a2027] rounded-xl">
      <h3 className="text-lg font-bold mb-4 dark:text-white">輸入 6 位數課號</h3>
      <input 
        className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
      />
      <button onClick={handleJoin} className="w-full bg-primary text-white py-2 rounded">確認加入</button>
    </div>
  );
}