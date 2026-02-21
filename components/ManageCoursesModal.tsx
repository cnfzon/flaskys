'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, X } from 'lucide-react';
import { createCourse, deleteCourse } from '@/lib/firebase/courses';

export default function ManageCoursesModal({ isOpen, onClose, teacherId, courses, onUpdate }: any) {
  const [newCourseName, setNewCourseName] = useState('');

  const handleCreate = async () => {
    if (!newCourseName.trim()) return;
    await createCourse(teacherId, newCourseName);
    setNewCourseName('');
    onUpdate(); // 重新讀取課程清單
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a222c] w-full max-w-md rounded-4xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black dark:text-white">課程管理</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X className="w-6 h-6 dark:text-white" />
          </button>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" placeholder="例如：電路學 (A班)" value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button onClick={handleCreate} className="bg-primary text-white p-3 rounded-xl hover:scale-105 transition-transform">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {courses.map((course: any) => (
            <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700">
              <div className="flex flex-col">
                <span className="font-black dark:text-white">{course.name}</span>
                <span className="text-[10px] text-primary font-mono font-bold uppercase tracking-widest">
                  Invite Code: {course.inviteCode}
                </span>
              </div>
              <button onClick={() => deleteCourse(course.id).then(onUpdate)} className="text-red-400 hover:text-red-500 p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}