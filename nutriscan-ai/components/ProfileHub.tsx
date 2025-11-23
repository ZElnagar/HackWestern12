import React, { useState } from "react";
import { User, PastAssessment, QuestionnaireData } from "../types";
import QuestionnaireForm from "./QuestionnaireForm";
import { calculateNutrientTargets } from "../utils/nutrition";
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
  XCircle,
  Settings,
  Save,
  Lock,
  Edit2,
  Smile,
  Ghost,
  Bot,
} from "lucide-react";

interface ProfileHubProps {
  user: User;
  onViewAssessment: (assessment: PastAssessment) => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
  isDailyDone: boolean;
  onStartDailyScan: () => void;
  onUpdateUser: (user: User) => void;
  onStartRescan: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({
  user,
  onViewAssessment,
  onLogout,
  onBackToDashboard,
  isDailyDone,
  onStartDailyScan,
  onUpdateUser,
  onStartRescan,
}) => {
  const [activeView, setActiveView] = useState<"overview" | "settings">(
    "overview"
  );
  const [settingsTab, setSettingsTab] = useState<"profile" | "account" | "preferences">(
    "profile"
  );
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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
    return user.history.some(
      (a) =>
        a.type === "daily" &&
        new Date(a.date).toDateString() === date.toDateString()
    );
  };

  const calculateStreak = () => {
    const dailyDates = new Set(
      user.history
        .filter((a) => a.type === "daily")
        .map((a) => new Date(a.date).toDateString())
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

  const renderAvatar = (avatarName?: string, size = 48) => {
    switch (avatarName) {
      case "smile":
        return <Smile size={size} className="text-teal-600" />;
      case "ghost":
        return <Ghost size={size} className="text-teal-600" />;
      case "bot":
        return <Bot size={size} className="text-teal-600" />;
      default:
        return <UserIcon size={size} className="text-teal-600" />;
    }
  };

  const handleAvatarUpdate = (avatar: string) => {
    const updatedUser = { ...user, avatar };
    onUpdateUser(updatedUser);
    setShowAvatarModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Navigation */}
      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
      >
        <LayoutDashboard size={20} />
        Assessment Hub
      </button>

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center md:items-start gap-6 transition-colors">
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
          <div className="bg-teal-100 p-6 rounded-full transition-all group-hover:bg-teal-200">
            {renderAvatar(user.avatar, 48)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="text-white drop-shadow-md" size={24} />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            My Health Hub
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{user.email}</p>

          <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === "overview"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === "settings"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
          </div>

          {activeView === "overview" && (
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
                <span className="text-xs text-slate-400 uppercase font-bold block">
                  Member Since
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {new Date(user.joinedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
                <span className="text-xs text-slate-400 uppercase font-bold block">
                  Assessments
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {user.history.length}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
                <span className="text-xs text-slate-400 uppercase font-bold block">
                  Current Streak
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {calculateStreak()} Days
                </span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {activeView === "overview" ? (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Current Profile Summary */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 transition-colors">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="text-teal-600" />
                Current Profile
              </h3>
              {user.currentProfile ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Physical Stats</p>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {user.currentProfile.age} yrs • {user.currentProfile.sex}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      {user.currentProfile.height ||
                        (user.currentProfile as any).heightCm}
                      cm •{" "}
                      {user.currentProfile.weight ||
                        (user.currentProfile as any).weightKg}
                      kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">
                      Dietary Preferences
                    </p>
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 transition-colors">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="text-orange-500" />
                Daily Streak
              </h3>
              <div className="flex justify-between items-center">
                {last7Days.map((date, idx) => {
                  const dailyAssessment = user.history.find(
                    (a) =>
                      a.type === "daily" &&
                      new Date(a.date).toDateString() === date.toDateString()
                  );
                  const completed = !!dailyAssessment;
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        dailyAssessment && onViewAssessment(dailyAssessment)
                      }
                      disabled={!dailyAssessment}
                      className={`flex flex-col items-center gap-1 transition-transform ${
                        dailyAssessment
                          ? "hover:scale-110 cursor-pointer"
                          : "cursor-default"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          completed
                            ? "bg-orange-100 border-orange-500 text-orange-700"
                            : isToday
                            ? "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-400 dark:text-slate-300 border-dashed"
                            : "bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-300 dark:text-slate-500"
                        }`}
                      >
                        {completed ? <CheckCircle size={14} /> : date.getDate()}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                        {date.toLocaleDateString("en-US", {
                          weekday: "narrow",
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isDailyDone
                    ? "Great job! You've completed today's scan."
                    : "Don't forget your daily scan today!"}
                </p>
              </div>
            </div>
          </div>

          {/* Assessment History */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 h-full transition-colors">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="text-teal-600" />
                Assessment History
              </h3>
              {user.history.length > 0 ? (
                <div className="space-y-4">
                  {user.history
                    .slice()
                    .reverse()
                    .map((assessment) => (
                      <button
                        key={assessment.id}
                        onClick={() => onViewAssessment(assessment)}
                        className="w-full text-left bg-slate-50 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-500 p-4 rounded-xl transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${
                              assessment.type === "daily"
                                ? "bg-orange-100 text-orange-600"
                                : assessment.scanType === "hands"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-teal-100 text-teal-600"
                            }`}
                          >
                            {assessment.type === "daily" ? (
                              <Calendar size={20} />
                            ) : assessment.scanType === "hands" ? (
                              <Hand size={20} />
                            ) : (
                              <ScanFace size={20} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                                  assessment.type === "daily"
                                    ? "bg-orange-100 text-orange-700"
                                    : assessment.scanType === "hands"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-teal-100 text-teal-700"
                                }`}
                              >
                                {assessment.type === "daily"
                                  ? "Daily Assessment"
                                  : assessment.scanType === "hands"
                                  ? "Hand Scan"
                                  : "Face Scan"}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-white">
                                {new Date(assessment.date).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-1">
                              {(assessment.results as any).summary ||
                                (assessment.results as any).note ||
                                "Assessment completed"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-700 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                  <p className="text-slate-500 dark:text-slate-400">
                    No assessments completed yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-3xl mx-auto transition-colors">
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8">
            <button
              onClick={() => setSettingsTab("profile")}
              className={`px-6 py-3 font-medium text-sm sm:text-base ${
                settingsTab === "profile"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400"
              }`}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setSettingsTab("account")}
              className={`px-6 py-3 font-medium text-sm sm:text-base ${
                settingsTab === "account"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400"
              }`}
            >
              Account Settings
            </button>
            <button
              onClick={() => setSettingsTab("preferences")}
              className={`px-6 py-3 font-medium text-sm sm:text-base ${
                settingsTab === "preferences"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400"
              }`}
            >
              Preferences
            </button>
          </div>

          {settingsTab === "profile" && (
            <QuestionnaireForm
              initialData={user.currentProfile}
              onSubmit={(data) => {
                // Update User with new profile
                onUpdateUser({
                  ...user,
                  currentProfile: data,
                });
                // Trigger rescan immediately
                onStartRescan();
              }}
            />
          )}

          {settingsTab === "account" && (
            <div className="max-w-md mx-auto space-y-6 py-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    disabled
                  />
                  <UserIcon
                    size={18}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Email cannot be changed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  />
                  <Lock
                    size={18}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                </div>
              </div>

              <button className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition shadow-md flex items-center justify-center gap-2">
                <Save size={20} />
                Update Account
              </button>
            </div>
          )}

          {settingsTab === "preferences" && (
            <div className="max-w-md mx-auto space-y-8 py-8">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Dark Mode</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Switch between light and dark themes
                  </p>
                </div>
                <button
                  onClick={() => {
                    const currentPrefs = user.preferences || {};
                    const newDarkMode = !currentPrefs.darkMode;
                    onUpdateUser({
                      ...user,
                      preferences: {
                        ...currentPrefs,
                        darkMode: newDarkMode,
                      },
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    user.preferences?.darkMode ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user.preferences?.darkMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100 relative">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Choose Your Avatar</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['default', 'smile', 'ghost', 'bot'].map((avatarName) => (
                <button
                  key={avatarName}
                  onClick={() => handleAvatarUpdate(avatarName)}
                  className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                    user.avatar === avatarName || (!user.avatar && avatarName === 'default')
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="bg-white p-4 rounded-full shadow-sm">
                    {renderAvatar(avatarName, 40)}
                  </div>
                  <span className="font-medium text-slate-700 capitalize">{avatarName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Reminder Banner */}
      {!isDailyDone && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-400 text-white p-4 shadow-lg z-40 animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-bold text-lg">
                  Have you done your daily face scan today?
                </p>
                <p className="text-orange-100 text-sm">
                  Keep your streak alive and track your daily progress.
                </p>
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
