import React from 'react';
import { User, PastAssessment } from '../types';
import { User as UserIcon, Calendar, ChevronRight, Activity, LogOut, LayoutDashboard } from 'lucide-react';

interface ProfileHubProps {
  user: User;
  onViewAssessment: (assessment: PastAssessment) => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ user, onViewAssessment, onLogout, onBackToDashboard }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation */}
      <button 
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-medium"
      >
        <LayoutDashboard size={20} />
        Back to Dashboard
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="bg-teal-100 p-6 rounded-full">
          <UserIcon className="text-teal-600" size={48} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">My Health Hub</h2>
          <p className="text-slate-500 mb-4">{user.email}</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-400 uppercase font-bold block">Member Since</span>
              <span className="text-slate-700 font-medium">{new Date(user.joinedDate).toLocaleDateString()}</span>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-400 uppercase font-bold block">Assessments</span>
              <span className="text-slate-700 font-medium">{user.history.length}</span>
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
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
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
                    {user.currentProfile.heightCm}cm • {user.currentProfile.weightKg}kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Dietary Preferences</p>
                  <p className="text-slate-700">{user.currentProfile.dietPreferences || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Allergies</p>
                  <p className="text-slate-700">{user.currentProfile.allergies || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Goal</p>
                  <p className="text-slate-700 capitalize">{user.currentProfile.activityLevel.replace('_', ' ')}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">No profile data available yet.</p>
            )}
          </div>
        </div>

        {/* Assessment History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="text-teal-600" />
              Assessment History
            </h3>
            
            {user.history.length > 0 ? (
              <div className="space-y-4">
                {user.history.slice().reverse().map((assessment) => (
                  <button
                    key={assessment.id}
                    onClick={() => onViewAssessment(assessment)}
                    className="w-full text-left bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 p-4 rounded-xl transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800 mb-1">
                        {new Date(assessment.date).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {assessment.results.summary.substring(0, 60)}...
                      </p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No assessments completed yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHub;
