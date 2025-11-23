import React from 'react';
import { ScanFace, Hand, Microscope, ArrowRight, Calendar, Zap } from 'lucide-react';

interface DashboardProps {
  onStartFaceScan: () => void;
  onStartHandScan: () => void;
  onStartDailyScan: () => void;
  isDailyDone: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onStartFaceScan, 
  onStartHandScan, 
  onStartDailyScan, 
  isDailyDone 
}) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Assessment Hub
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          Select an assessment type to begin your health analysis
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Daily Assessment - Only visible if not done today */}
        {!isDailyDone && (
          <div 
            onClick={onStartDailyScan}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl shadow-lg p-8 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 cursor-pointer transition-all transform hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
              <Zap size={12} fill="currentColor" /> QUICK
            </div>
            <div className="bg-orange-200 dark:bg-orange-900/50 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-300 dark:group-hover:bg-orange-800 transition-colors">
              <Calendar className="text-orange-600 dark:text-orange-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Daily Check-in</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              A quick daily face scan to track your progress and update your vitals.
            </p>
            <div className="flex items-center text-orange-700 dark:text-orange-400 font-semibold group-hover:gap-2 transition-all">
              Start Daily Scan <ArrowRight size={20} className="ml-1" />
            </div>
          </div>
        )}

        {/* Face Scan - Active */}
        <div
          onClick={onStartFaceScan}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border-2 border-teal-100 dark:border-teal-900 hover:border-teal-500 dark:hover:border-teal-500 cursor-pointer transition-all transform hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            FULL SCAN
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-100 dark:group-hover:bg-teal-800 transition-colors">
            <ScanFace className="text-teal-600 dark:text-teal-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Comprehensive Scan</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Complete analysis of facial biomarkers for nutritional deficiencies and overall health.
          </p>
          <div className="flex items-center text-teal-600 dark:text-teal-400 font-semibold group-hover:gap-2 transition-all">
            Start Scan <ArrowRight size={20} className="ml-1" />
          </div>
        </div>

        {/* Hand Scan - Active */}
        <div
          onClick={onStartHandScan}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border-2 border-blue-100 dark:border-blue-900 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all transform hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            NEW
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
            <Hand className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Hand Scan</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Detect nail and skin health indicators related to vitamin and
            mineral levels.
          </p>
          <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
            Start Scan <ArrowRight size={20} className="ml-1" />
          </div>
        </div>

        {/* Specific Scan - Coming Soon */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border-2 border-slate-100 dark:border-slate-700 opacity-75 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded">
            COMING SOON
          </div>
          <div className="bg-slate-200 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Microscope className="text-slate-400 dark:text-slate-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-400 mb-3">
            Specific Scan
          </h3>
          <p className="text-slate-500 dark:text-slate-500 mb-6">
            Targeted analysis of specific areas or symptoms for detailed
            nutritional insights.
          </p>
          <div className="flex items-center text-slate-400 dark:text-slate-600 font-semibold cursor-not-allowed">
            Unavailable
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
