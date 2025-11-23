import React from 'react';
import { User, PastAssessment } from '../types';
import {
  User as UserIcon,
  Calendar,
  ChevronRight,
  Activity,
  LogOut,
  LayoutDashboard,
  ScanFace,
  Hand,
  CheckCircle,
  XCircle
} from "lucide-react";

interface ProfileHubProps {
  user: User;
  onViewAssessment: (assessment: PastAssessment) => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
  isDailyDone: boolean;
  onStartDailyScan: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ 
  user, 
  onViewAssessment, 
  onLogout, 
  onBackToDashboard, 
  isDailyDone, 
  onStartDailyScan 
}) => {
  // Get last 7 days for calendar
  const getDaysArray = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const last7Days = getDaysArray();

  const isDayCompleted = (date: Date) => {
    return user.history.some(a => 
      a.type === 'daily' && 
      new Date(a.date).toDateString() === date.toDateString()
    );
  };

  const calculateStreak = () => {
    const dailyDates = new Set(
      user.history
        .filter(a => a.type === 'daily')
        .map(a => new Date(a.date).toDateString())
    );

    let streak = 0;
    let date = new Date();

    // If today is not done, check if yesterday was done to maintain streak
    if (!dailyDates.has(date.toDateString())) {
       date.setDate(date.getDate() - 1);
       if (!dailyDates.has(date.toDateString())) {
         return 0;
       }
    }

    while (dailyDates.has(date.toDateString())) {
      streak++;
      date.setDate(date.getDate() - 1);
    }
    return streak;
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Navigation */}
      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-medium"
      >
        <LayoutDashboard size={20} />
        Assessment Hub
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="bg-teal-100 p-6 rounded-full">
          <UserIcon className="text-teal-600" size={48} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            My Health Hub
          </h2>
          <p className="text-slate-500 mb-4">{user.email}</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-400 uppercase font-bold block">
                Member Since
              </span>
              <span className="text-slate-700 font-medium">
                {new Date(user.joinedDate).toLocaleDateString()}
              </span>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-400 uppercase font-bold block">
                Assessments
              </span>
              <span className="text-slate-700 font-medium">
                {user.history.length}
              </span>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-400 uppercase font-bold block">Current Streak</span>
              <span className="text-slate-700 font-medium">{calculateStreak()} Days</span>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Current Profile Summary */}
        <div className="md:col-span-1 space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="text-teal-600" />
              Current Profile
            </h3>
            {user.currentProfile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Physical Stats</p>
                  <p className="text-slate-700 font-medium">
                    {user.currentProfile.age} yrs • {user.currentProfile.sex}
                  </p>
                  <p className="text-slate-700">
                    {user.currentProfile.heightCm}cm •{" "}
                    {user.currentProfile.weightKg}kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Dietary Preferences</p>
                  <p className="text-slate-700">
                    {user.currentProfile.dietPreferences || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Allergies</p>
                  <p className="text-slate-700">
                    {user.currentProfile.allergies || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Goal</p>
                  <p className="text-slate-700 capitalize">
                    {user.currentProfile.activityLevel.replace("_", " ")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">
                No profile data available yet.
              </p>
            )}
          </div>

          {/* Daily Streak Calendar */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
             <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="text-orange-500" />
              Daily Streak
            </h3>
            <div className="flex justify-between items-center">
              {last7Days.map((date, idx) => {
                const dailyAssessment = user.history.find(a => 
                  a.type === 'daily' && 
                  new Date(a.date).toDateString() === date.toDateString()
                );
                const completed = !!dailyAssessment;
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <button 
                    key={idx} 
                    onClick={() => dailyAssessment && onViewAssessment(dailyAssessment)}
                    disabled={!dailyAssessment}
                    className={`flex flex-col items-center gap-1 transition-transform ${dailyAssessment ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      completed 
                        ? 'bg-orange-100 border-orange-500 text-orange-700' 
                        : isToday 
                          ? 'bg-slate-100 border-slate-300 text-slate-400 border-dashed'
                          : 'bg-slate-50 border-slate-100 text-slate-300'
                    }`}>
                      {completed ? <CheckCircle size={14} /> : date.getDate()}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 text-center">
               <p className="text-sm text-slate-500">
                 {isDailyDone 
                   ? "Great job! You've completed today's scan." 
                   : "Don't forget your daily scan today!"}
               </p>
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="text-teal-600" />
              Assessment History
            </h3>
            {user.history.filter(h => h.type === 'full').length > 0 ? (
              <div className="space-y-4">
                {user.history
                  .filter(h => h.type === 'full')
                  .slice()
                  .reverse()
                  .map((assessment) => (
                    <button
                      key={assessment.id}
                      onClick={() => onViewAssessment(assessment)}
                      className="w-full text-left bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 p-4 rounded-xl transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${
                            assessment.scanType === "hands"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-teal-100 text-teal-600"
                          }`}
                        >
                          {assessment.scanType === "hands" ? (
                            <Hand size={20} />
                          ) : (
                            <ScanFace size={20} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                                assessment.scanType === "hands"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-teal-100 text-teal-700"
                              }`}
                            >
                              {assessment.scanType === "hands"
                                ? "Hand Scan"
                                : "Face Scan"}
                            </span>
                            <span className="font-bold text-slate-800">
                              {new Date(assessment.date).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {(assessment.results as any).summary}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                    </button>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No full assessments completed yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Reminder Banner */}
      {!isDailyDone && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-400 text-white p-4 shadow-lg z-40 animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-bold text-lg">Have you done your daily face scan today?</p>
                <p className="text-orange-100 text-sm">Keep your streak alive and track your daily progress.</p>
              </div>
            </div>
            <button 
              onClick={onStartDailyScan}
              className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold hover:bg-orange-50 transition-colors shadow-md"
            >
              Start Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHub;
