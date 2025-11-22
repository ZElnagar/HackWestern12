import React from 'react';
import { ScanFace, Hand, Microscope, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onStartFaceScan: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartFaceScan }) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Assessment Hub</h2>
        <p className="text-xl text-slate-600">Select an assessment type to begin your health analysis</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Face Scan - Active */}
        <div 
          onClick={onStartFaceScan}
          className="bg-white rounded-2xl shadow-lg p-8 border-2 border-teal-100 hover:border-teal-500 cursor-pointer transition-all transform hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
          <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
            <ScanFace className="text-teal-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Face Scan</h3>
          <p className="text-slate-500 mb-6">
            Analyze facial biomarkers for nutritional deficiencies and overall health indicators.
          </p>
          <div className="flex items-center text-teal-600 font-semibold group-hover:gap-2 transition-all">
            Start Scan <ArrowRight size={20} className="ml-1" />
          </div>
        </div>

        {/* Hand Scan - Coming Soon */}
        <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-100 opacity-75 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">
            COMING SOON
          </div>
          <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Hand className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-3">Hand Scan</h3>
          <p className="text-slate-500 mb-6">
            Detect nail and skin health indicators related to vitamin and mineral levels.
          </p>
          <div className="flex items-center text-slate-400 font-semibold cursor-not-allowed">
            Unavailable
          </div>
        </div>

        {/* Specific Scan - Coming Soon */}
        <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-100 opacity-75 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">
            COMING SOON
          </div>
          <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Microscope className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-3">Specific Scan</h3>
          <p className="text-slate-500 mb-6">
            Targeted analysis of specific areas or symptoms for detailed nutritional insights.
          </p>
          <div className="flex items-center text-slate-400 font-semibold cursor-not-allowed">
            Unavailable
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
