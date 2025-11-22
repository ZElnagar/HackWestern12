import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const Home: React.FC = () => {
  return (
    <Layout>
      <div className="relative min-h-[80vh] flex items-center justify-center bg-gray-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
           <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-100 opacity-50 mix-blend-multiply blur-3xl animate-pulse-soft"></div>
           <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-blue-100 opacity-50 mix-blend-multiply blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-md w-full px-6 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Emergency Check-In
          </h1>
          <p className="text-lg text-gray-600 mb-12">
            AI-assisted triage system. Please check in to receive your priority number.
          </p>
          
          <Link 
            to="/check-in" 
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all shadow-xl transform hover:-translate-y-1"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-6 w-6 text-red-500 group-hover:text-red-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </span>
            Start Check-In
          </Link>

          <div className="mt-8">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Secure • Private • Fast</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};