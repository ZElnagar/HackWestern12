import React, { useState } from 'react';
import { DailyCheckinData } from '../types';
import { Moon, Smile, Frown, Meh, ArrowRight } from 'lucide-react';

interface Props {
  onSubmit: (data: DailyCheckinData) => void;
}

const DailyCheckinForm: React.FC<Props> = ({ onSubmit }) => {
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState<string | null>(null);

  const sleepOptions = [
    "Less than 5 hours",
    "5-6 hours",
    "7-8 hours",
    "More than 8 hours"
  ];

  const handleSubmit = () => {
    if (mood && sleep) {
      onSubmit({ mood, sleep });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Daily Check-in</h2>
        <p className="text-slate-500 text-center mb-8">How are you feeling today?</p>

        <div className="space-y-8">
          {/* Mood Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4 text-center">Overall Feeling (1-4)</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4].map((val) => (
                <button
                  key={val}
                  onClick={() => setMood(val)}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    mood === val 
                      ? 'border-teal-500 bg-teal-50 text-teal-700' 
                      : 'border-slate-200 hover:border-teal-200 text-slate-500'
                  }`}
                >
                  {val === 1 && <Frown size={32} />}
                  {val === 2 && <Meh size={32} />}
                  {val === 3 && <Smile size={32} />}
                  {val === 4 && <Smile size={32} />}
                  <span className="font-bold text-lg">{val}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-2">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Sleep Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4 text-center flex items-center justify-center gap-2">
              <Moon size={16} />
              Last Night's Sleep
            </label>
            <div className="grid grid-cols-1 gap-3">
              {sleepOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSleep(option)}
                  className={`py-3 px-4 rounded-lg border text-left transition-all ${
                    sleep === option
                      ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!mood || !sleep}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              mood && sleep
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Get Daily Insights
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckinForm;
