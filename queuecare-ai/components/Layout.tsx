import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isStaff = location.pathname.includes('/staff');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
      <header className={`${isStaff ? 'bg-slate-800' : 'bg-white'} border-b border-gray-200 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isStaff ? 'bg-blue-500' : 'bg-red-500'}`}>
                  <span className="text-white font-bold text-lg">Q</span>
                </div>
                <span className={`font-bold text-xl tracking-tight ${isStaff ? 'text-white' : 'text-gray-900'}`}>
                  QueueCare<span className="font-light opacity-70">AI</span>
                </span>
              </Link>
            </div>
            <nav className="flex space-x-4">
              {isStaff ? (
                <Link to="/" className="text-gray-300 hover:text-white text-sm font-medium">Exit Staff Mode</Link>
              ) : (
                <Link to="/staff" className="text-gray-500 hover:text-gray-900 text-sm font-medium">Staff Login</Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-xs">
          QueueCare AI © 2024 • Virtual Triage Simulator • Not for real medical use
        </div>
      </footer>
    </div>
  );
};