import React, { useEffect } from 'react';
import { DailyInsightResponse } from '../types';
import { CheckCircle, Zap, Pill, Leaf, ArrowRight } from 'lucide-react';

interface Props {
  data: DailyInsightResponse;
  onDone: () => void;
}

const DailyResultsView: React.FC<Props> = ({ data, onDone }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header Summary */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-2xl p-8 text-white mb-8 shadow-xl relative">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold">Daily Insights</h2>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
            <CheckCircle size={16} />
            Saved to Profile
          </div>
        </div>
        <p className="text-lg opacity-90 leading-relaxed font-medium">{data.note}</p>
      </div>

      <div className="space-y-6">
        {/* Target Vitamins */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Pill className="text-teal-600 dark:text-teal-400" />
            Target Vitamins Today
          </h3>
          <div className="grid gap-4">
            {data.targetVitamins.map((vit, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-100 dark:border-teal-800">
                <div className="bg-white dark:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 shadow-sm shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{vit.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{vit.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Superfoods */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Leaf className="text-green-600 dark:text-green-400" />
            Superfood Boosters
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Mix these into your diet today to stabilize energy.</p>
          <div className="grid gap-4">
            {data.superfoods.map((food, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800">
                <div className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm">
                  <Zap size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{food.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{food.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Done Button */}
        <button 
          onClick={onDone}
          className="w-full bg-slate-900 dark:bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
        >
          Done
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DailyResultsView;
