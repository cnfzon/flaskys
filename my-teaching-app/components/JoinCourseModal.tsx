'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';

interface JoinCourseModalProps {
  user: any;
  onJoined: () => void;
  onClose: () => void;
}

export default function JoinCourseModal({ user, onJoined, onClose }: JoinCourseModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (inviteCode.length !== 6) {
      alert('請輸入正確的 6 位數課號');
      return;
    }

    setLoading(true);
    try {
      // 1. 檢查課號是否存在於 courses 集合
      const courseQuery = query(collection(db, 'courses'), where('inviteCode', '==', inviteCode));
      const courseSnap = await getDocs(courseQuery);

      if (courseSnap.empty) {
        alert('找不到此課號，請重新確認');
        return;
      }

      const courseDoc = courseSnap.docs[0];
      const courseId = courseDoc.id;

      // 2. 建立選課紀錄 (enrollments)
      await addDoc(collection(db, 'enrollments'), {
        courseId: courseId,
        courseName: courseDoc.data().name || '未命名課程',
        studentUid: user.uid,
        studentId: user.studentId || user.email.split('@')[0], // 優先使用學號
        totalPoints: 0,
        createdAt: serverTimestamp()
      });

      alert('加選成功！');
      onJoined(); // 成功後通知父組件重新整理
    } catch (error) {
      console.error('加選失敗:', error);
      alert('加選時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white dark:bg-[#1a2027] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-bold dark:text-white">加選新課程</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">請輸入教師提供的 6 位數課程代碼以加入班級。</p>
          <input 
            type="text" 
            placeholder="例如: 348354" 
            maxLength={6}
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-6 text-center text-2xl font-mono tracking-[0.5em] focus:border-primary focus:outline-none dark:text-white"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button 
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? '加選中...' : '確認加入'}
          </button>
        </div>
      </div>
    </div>
  );
}