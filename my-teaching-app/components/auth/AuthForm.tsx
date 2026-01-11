'use client';

import { useState } from 'react';
import { School, Mail, ArrowRight, Info } from 'lucide-react';
import { registerUser, loginUser } from '@/lib/firebase/auth';
import { UserRole } from '@/types';

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, role, displayName);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-white dark:bg-[#1E252B] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
      <div className="h-2 w-full bg-primary/80"></div>
      <div className="p-8 sm:p-10 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-2">
            <School className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
              {isLogin
                ? 'Sign in to access your points, grades, and exam weighting dashboard.'
                : 'Sign up to get started with your learning journey.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="displayName">
                  Display Name (Optional)
                </label>
                <input
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary shadow-sm transition-all"
                  id="displayName"
                  name="displayName"
                  placeholder="Your name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="role">
                  Role
                </label>
                <select
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary shadow-sm transition-all"
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
              School Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary shadow-sm transition-all"
                id="email"
                name="email"
                placeholder="studentID@school.org.tw"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
              Password
            </label>
            <input
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary shadow-sm transition-all"
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white text-base font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}</span>
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 px-3 rounded border border-gray-100 dark:border-gray-700 inline-block">
            <Info className="inline w-4 h-4 mr-1 text-gray-400 align-bottom" />
            Please ensure you use your <span className="font-medium text-gray-700 dark:text-gray-300">.org.tw</span> account.
          </p>
        </div>
      </div>
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-400/5 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
