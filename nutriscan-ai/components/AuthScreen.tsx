import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

interface AuthScreenProps {
  onComplete: (user: User) => void;
  defaultMode?: 'login' | 'signup';
  onBack?: () => void;
  onDiscardAssessment?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete, defaultMode = 'signup', onBack, onDiscardAssessment }) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExistingAccountOption, setShowExistingAccountOption] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowExistingAccountOption(false);
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const storedUsers = localStorage.getItem('nutriscan_users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      if (isLogin) {
        // Login Logic
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          onComplete(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Signup Logic
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          setError('Account already exists.');
          setShowExistingAccountOption(true);
        } else {
          const newUser: User = {
            uid: Date.now().toString(),
            email,
            name,
            password, // Storing password in local storage is not secure, but requested for this demo
            joinedDate: new Date().toISOString(),
            history: [],
            streak: 0
          };
          
          // Save to "database"
          users.push(newUser);
          localStorage.setItem('nutriscan_users', JSON.stringify(users));
          
          onComplete(newUser);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 relative transition-colors duration-300">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={24} className="rotate-360" />
          </button>
        )}
        <div className="text-center mb-8">
          <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full inline-flex mb-4">
            <UserIcon className="text-teal-600 dark:text-teal-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isLogin 
              ? 'Sign in to view your assessment results' 
              : 'Sign up to save your health profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  className="absolute left-3 top-3 text-slate-400 dark:text-slate-500"
                  size={20}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          {showExistingAccountOption && (
            <button
              type="button"
              onClick={() => {
                if (onDiscardAssessment) onDiscardAssessment();
                setIsLogin(true);
                setError('');
                setShowExistingAccountOption(false);
              }}
              className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              Sign In & Discard Assessment
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {/* Toggle removed as per requirements */}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
