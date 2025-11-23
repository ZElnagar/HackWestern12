import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

interface AuthScreenProps {
  onComplete: (user: User) => void;
  defaultMode?: 'login' | 'signup';
  onBack?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete, defaultMode = 'signup', onBack }) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!email || !password) {
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
          setError('Email already in use. Please sign in.');
        } else {
          const newUser: User = {
            uid: Date.now().toString(),
            email,
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
      <div className="bg-white rounded-2xl shadow-xl p-8 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={24} className="rotate-360" />
          </button>
        )}
        <div className="text-center mb-8">
          <div className="bg-teal-100 p-3 rounded-full inline-flex mb-4">
            <UserIcon className="text-teal-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isLogin 
              ? 'Sign in to view your assessment results' 
              : 'Sign up to save your health profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
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
          {/* Only allow switching if we are in signup mode (meaning we came from assessment) 
              OR if we are in login mode but want to switch to signup? 
              User said: "Dont allow users to create an accout by preessing login thne "sign up""
              So if defaultMode is login, we hide the switch to signup.
          */}
          {defaultMode === 'signup' && (
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          )}
          
          {defaultMode === 'login' && !isLogin && (
             // If somehow we are in signup mode but default was login (shouldn't happen with logic above but for safety)
             <button
             onClick={() => setIsLogin(true)}
             className="text-teal-600 hover:text-teal-700 font-medium text-sm"
           >
             Already have an account? Sign in
           </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
