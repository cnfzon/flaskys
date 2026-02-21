'use client';

import { useState } from 'react';
import { Plus, Trash2, X, Copy, Check } from 'lucide-react';
import { createCourse, deleteCourse } from '@/lib/firebase/courses';

export default function ManageCoursesModal({ isOpen, onClose, teacherId, courses, onUpdate }: any) {
  const [newCourseName, setNewCourseName] = useState('');
  const [customInviteCode, setCustomInviteCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newCourseName.trim() || !customInviteCode.trim()) {
      alert("請填寫課程名稱與邀請碼");
      return;
    }
    
    try {
      await createCourse(teacherId, newCourseName, customInviteCode);
      setNewCourseName('');
      setCustomInviteCode('');
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a222c] w-full max-w-md rounded-4xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black dark:text-white">課程管理</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6 dark:text-white" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* 課程名稱輸入框 */}
          <input 
            type="text" 
            placeholder="課程名稱 (例如: 電路學 電子二乙)" 
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
          />
          
          <div className="flex gap-2">
            {/* 邀請碼自定義輸入框 */}
            <input 
              type="text" 
              placeholder="自定義邀請碼 (建議課號：348354)" 
              value={customInviteCode}
              onChange={(e) => setCustomInviteCode(e.target.value)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button 
              onClick={handleCreate} 
              className="bg-primary text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {courses.map((course: any) => (
            <div key={course.id} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent dark:border-gray-700 hover:border-primary/30 transition-all">
              <div className="flex flex-col gap-1">
                <span className="font-black dark:text-white leading-tight">{course.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-primary font-mono font-bold tracking-widest uppercase">
                    Code: {course.inviteCode}
                  </span>
                  <button onClick={() => copyToClipboard(course.inviteCode)} className="text-gray-400 hover:text-primary transition-colors">
                    {copiedId === course.inviteCode ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => window.confirm('確定要刪除此課程？') && deleteCourse(course.id).then(onUpdate)}
                className="text-gray-300 hover:text-[#FF5B59] p-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {courses.length === 0 && <p className="text-center py-10 text-gray-400 text-sm italic">尚無課程。</p>}
        </div>
      </div>
    </div>
  );
}