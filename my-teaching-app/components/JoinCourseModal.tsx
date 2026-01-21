'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, // 改用 updateDoc
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { X, Loader2 } from 'lucide-react';

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
    // 1. 先從 user 集合獲取該學生的學號 (如果 props 沒傳進來)
    // 假設 user.email 是 "t113360246@ntut.org.tw"
    const rawStudentId = user.email.split('@')[0]; // 得到 "t113360246"
    const cleanStudentId = rawStudentId.replace('t', ''); // 得到 "113360246"，匹配資料庫格式

    // 2. 檢查課號 (這部分代碼保留)
    const courseQuery = query(collection(db, 'courses'), where('inviteCode', '==', inviteCode));
    const courseSnap = await getDocs(courseQuery);
    if (courseSnap.empty) {
      alert('找不到此課號');
      setLoading(false);
      return;
    }
    const courseId = courseSnap.docs[0].id;

    // 3. 重要修正：使用處理過的 cleanStudentId 搜尋
    const enrollQuery = query(
      collection(db, 'enrollments'),
      where('courseId', '==', courseId),
      where('studentId', '==', cleanStudentId) // 確保這裡不是 undefined
    );
    
    const enrollSnap = await getDocs(enrollQuery);

    if (enrollSnap.empty) {
      alert(`找不到您的成績資料 (學號: ${cleanStudentId})，請確認老師是否已上傳 CSV。`);
      setLoading(false);
      return;
    }

    const enrollmentDoc = enrollSnap.docs[0];
    
    // 4. 綁定 UID 到該成績文件
    await updateDoc(doc(db, 'enrollments', enrollmentDoc.id), {
      studentUid: user.uid, // 這裡的 user.uid 是 "37jUK..."
      joinedAt: serverTimestamp()
    });

    alert('加選成功！');
    onJoined();
    onClose();
  } catch (error) {
    console.error('加選發生錯誤:', error);
    alert('系統錯誤，請查看控制台');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white dark:bg-[#1a2027] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            maxLength={6}
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-6 text-center text-2xl font-mono tracking-[0.5em] focus:border-primary focus:outline-none dark:text-white"
          />
          
          <button
            onClick={handleJoin}
            disabled={loading || inviteCode.length !== 6}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '確認加選'}
          </button>
        </div>
      </div>
    </div>
  );
}