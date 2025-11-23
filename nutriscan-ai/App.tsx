import React, { useState } from "react";
import {
  AppState,
  QuestionnaireData,
  ImageCaptureSet,
  DietPlanResponse,
  User,
  PastAssessment,
  DailyCheckinData,
  DailyInsightResponse,
} from "./types";
import CameraCapture from "./components/CameraCapture";
import QuestionnaireForm from "./components/QuestionnaireForm";
import ResultsView from "./components/ResultsView";
import AuthScreen from "./components/AuthScreen";
import ProfileButton from "./components/ProfileButton";
import ProfileHub from "./components/ProfileHub";
import Dashboard from "./components/Dashboard";
import DailyCheckinForm from "./components/DailyCheckinForm";
import DailyResultsView from "./components/DailyResultsView";
import {
  generateDietPlan,
  generateDailyInsight,
} from "./services/geminiService";
import { ScanFace, Loader2, LogIn } from "lucide-react";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [images, setImages] = useState<ImageCaptureSet | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(
    null
  );
  const [results, setResults] = useState<DietPlanResponse | null>(null);
  const [dailyResults, setDailyResults] = useState<DailyInsightResponse | null>(
    null
  );
  const [dailyCheckin, setDailyCheckin] = useState<DailyCheckinData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  // Merged State
  const [scanMode, setScanMode] = useState<"full" | "face" | "hands">("face");
  const [assessmentType, setAssessmentType] = useState<"full" | "daily">(
    "full"
  );
  const [skipQuestionnaire, setSkipQuestionnaire] = useState(false);
  const [showProfileChoiceModal, setShowProfileChoiceModal] = useState(false);

  const handleCameraComplete = (capturedImages: ImageCaptureSet) => {
    setImages(capturedImages);

    if (assessmentType === "daily") {
      // Go to Daily Checkin Form instead of Questionnaire
      setAppState(AppState.QUESTIONNAIRE);
    } else {
      if (skipQuestionnaire && user?.currentProfile) {
        setQuestionnaire(user.currentProfile);
        performAnalysis(capturedImages, user.currentProfile);
      } else if (user?.currentProfile && !skipQuestionnaire) {
        // If user has profile but didn't explicitly skip, we might want to pre-fill or just show form
        // The logic from HEAD was: if user.currentProfile, use it.
        // The logic from Tristan was: ask user via modal before starting scan.
        // If we are here, we either skipped or not.
        // If not skipped, show form.
        setAppState(AppState.QUESTIONNAIRE);
      } else {
        setAppState(AppState.QUESTIONNAIRE);
      }
    }
  };

  const performAnalysis = async (
    imgs: ImageCaptureSet | null,
    data: QuestionnaireData
  ) => {
    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      if (!imgs) throw new Error("No images captured");

      const plan = await generateDietPlan(imgs, data, scanMode);
      setResults(plan);
      setIsResultSaved(false);

      // Update current profile if user is logged in
      if (user) {
        setUser({
          ...user,
          currentProfile: data,
        });
      }

      setAppState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      setError("An error occurred during analysis. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const performDailyAnalysis = async (
    imgs: ImageCaptureSet | null,
    checkin: DailyCheckinData
  ) => {
    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      if (!imgs) throw new Error("No images captured");

      const insight = await generateDailyInsight(
        imgs,
        checkin,
        user?.currentProfile
      );
      setDailyResults(insight);

      // Auto-save logic
      if (user) {
        const newAssessment: PastAssessment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: "daily",
          results: insight,
          questionnaire: checkin,
        };

        setUser({
          ...user,
          history: [...user.history, newAssessment],
        });
        setIsResultSaved(true);
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 3000);
      }

      setAppState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      setError("An error occurred during daily analysis. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleQuestionnaireSubmit = (data: QuestionnaireData) => {
    setQuestionnaire(data);
    if (user) {
      performAnalysis(images, data);
    } else {
      setAppState(AppState.AUTH);
    }
  };

  const handleDailyCheckinSubmit = (data: DailyCheckinData) => {
    setDailyCheckin(data);
    performDailyAnalysis(images, data);
  };

  const handleAuthComplete = (userData: User) => {
    // Merge questionnaire data into user profile if available from the flow
    const updatedUser = { ...userData };
    if (questionnaire) {
      updatedUser.currentProfile = questionnaire;
    }
    setUser(updatedUser);

    if (images && questionnaire) {
      performAnalysis(images, questionnaire);
    } else {
      // If just logging in without a flow, go to dashboard
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAppState(AppState.LANDING);
    setImages(null);
    setQuestionnaire(null);
    setResults(null);
    setDailyResults(null);
    setIsResultSaved(false);
  };

  const handleSaveAssessment = (updatedResults?: DietPlanResponse) => {
    if (user && !isResultSaved) {
      let newAssessment: PastAssessment;

      if (
        assessmentType === "full" &&
        (updatedResults || results) &&
        questionnaire
      ) {
        newAssessment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: "full",
          results: updatedResults || results!,
          questionnaire: questionnaire,
          scanType: scanMode,
        };
      } else if (assessmentType === "daily" && dailyResults && dailyCheckin) {
        newAssessment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: "daily",
          results: dailyResults,
          questionnaire: dailyCheckin,
        };
      } else {
        return;
      }

      setUser({
        ...user,
        history: [...user.history, newAssessment],
      });
      setIsResultSaved(true);
      setShowSaveNotification(true);

      // Delay navigation to show the notification
      setTimeout(() => {
        setShowSaveNotification(false);
        setAppState(AppState.PROFILE);
        window.scrollTo(0, 0);
      }, 750);
    }
  };

  const handleViewAssessment = (assessment: PastAssessment) => {
    if (assessment.type === "daily") {
      setDailyResults(assessment.results as DailyInsightResponse);
      setDailyCheckin(assessment.questionnaire as DailyCheckinData);
      setAssessmentType("daily");
    } else {
      setResults(assessment.results as DietPlanResponse);
      setQuestionnaire(assessment.questionnaire as QuestionnaireData);
      setAssessmentType("full");
      setScanMode(assessment.scanType || "face");
    }
    setIsResultSaved(true);
    setAppState(AppState.RESULTS);
  };

  const isDailyDoneToday = () => {
    if (!user) return false;
    return user.history.some(
      (a) =>
        a.type === "daily" &&
        new Date(a.date).toDateString() === new Date().toDateString()
    );
  };

  const startDailyScan = () => {
    setAssessmentType("daily");
    setAppState(AppState.CAMERA);
  };

  const startFullScan = () => {
    if (user?.currentProfile) {
      setShowProfileChoiceModal(true);
    } else {
      setAssessmentType("full");
      setSkipQuestionnaire(false);
      setAppState(AppState.CAMERA);
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.LANDING:
        return (
          <div className="text-center max-w-2xl mx-auto mt-12 px-4">
            <div className="bg-white p-4 rounded-full shadow-lg inline-flex mb-8">
              <ScanFace size={64} className="text-teal-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              NutriScan <span className="text-teal-600">AI</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Advanced visual health screening combined with AI-driven nutrition
              planning. Detect visible health cues and get a medically-informed
              diet plan in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={() => {
                  setScanMode("face");
                  startFullScan();
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xl font-semibold px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Start Assessment
              </button>
              <button
                onClick={() => setAppState(AppState.AUTH)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 text-xl font-semibold px-10 py-4 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <LogIn size={24} />
                Log In
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Requires camera access • Privacy focused (images processed for
              session only)
            </p>
          </div>
        );

      case AppState.CAMERA:
        return (
          <CameraCapture onComplete={handleCameraComplete} mode={scanMode} />
        );

      case AppState.QUESTIONNAIRE:
        if (assessmentType === "daily") {
          return <DailyCheckinForm onSubmit={handleDailyCheckinSubmit} />;
        }
        return <QuestionnaireForm onSubmit={handleQuestionnaireSubmit} />;

      case AppState.AUTH:
        // If coming from landing page (no images/questionnaire), default to login
        // Otherwise, default to signup for new users in the flow
        return (
          <AuthScreen
            onComplete={handleAuthComplete}
            defaultMode={!images && !questionnaire ? "login" : "signup"}
          />
        );

      case AppState.DASHBOARD:
        return (
          <Dashboard
            onStartFaceScan={() => {
              setScanMode("face");
              startFullScan();
            }}
            onStartHandScan={() => {
              setScanMode("hands");
              startFullScan();
            }}
            onStartDailyScan={startDailyScan}
            isDailyDone={isDailyDoneToday()}
          />
        );

      case AppState.PROFILE:
        return user ? (
          <ProfileHub
            user={user}
            onViewAssessment={handleViewAssessment}
            onLogout={handleLogout}
            onBackToDashboard={() => setAppState(AppState.DASHBOARD)}
            isDailyDone={isDailyDoneToday()}
            onStartDailyScan={startDailyScan}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onStartRescan={() => {
              // Reset all assessment state to simulate a fresh start
              setImages(null);
              setResults(null);
              setDailyResults(null);
              setDailyCheckin(null);
              setIsResultSaved(false);

              // Configure for a fresh face scan using the updated profile
              setScanMode("face");
              setAssessmentType("full");
              setSkipQuestionnaire(true); // Skip questionnaire since we just updated it in settings
              setAppState(AppState.CAMERA);
            }}
          />
        ) : null;

      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="animate-spin text-teal-600 mb-6" size={64} />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Analyzing Health Data
            </h2>
            <p className="text-slate-500 text-center max-w-md">
              Our AI is examining your scans for visual biomarkers and
              synthesizing your personalized nutrition protocol. This may take
              up to 30 seconds.
            </p>
          </div>
        );

      case AppState.RESULTS:
        if (assessmentType === "daily" && dailyResults) {
          return (
            <DailyResultsView
              data={dailyResults}
              onDone={() => setAppState(AppState.PROFILE)}
            />
          );
        }
        return results ? (
          <ResultsView
            data={results}
            questionnaire={questionnaire}
            onSave={handleSaveAssessment}
            isSaved={isResultSaved}
            scanMode={scanMode}
            onDone={() => setAppState(AppState.PROFILE)}
          />
        ) : null;

      case AppState.ERROR:
        return (
          <div className="text-center max-w-md mx-auto mt-20">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Analysis Failed
            </h2>
            <p className="text-slate-600 mb-6">{error || "Unknown error"}</p>
            <button
              onClick={() => setAppState(AppState.LANDING)}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Return Home
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setAppState(AppState.LANDING)}
          >
            <ScanFace className="text-teal-600" />
            <span className="font-bold text-xl text-slate-900">
              NutriScan AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            {appState !== AppState.LANDING &&
              appState !== AppState.PROFILE &&
              appState !== AppState.DASHBOARD && (
                <div className="text-sm font-medium text-slate-500 hidden md:block">
                  {appState === AppState.CAMERA && "Step 1: Scan"}
                  {appState === AppState.QUESTIONNAIRE && "Step 2: Profile"}
                  {appState === AppState.AUTH && "Step 3: Account"}
                  {appState === AppState.ANALYZING && "Step 4: Analysis"}
                  {appState === AppState.RESULTS && "Results"}
                </div>
              )}
            {user &&
              (appState === AppState.RESULTS ||
                appState === AppState.DASHBOARD ||
                appState === AppState.PROFILE) && (
                <ProfileButton onClick={() => setAppState(AppState.PROFILE)} />
              )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={appState} className="animate-fade-scale">
          {renderContent()}
        </div>
      </main>

      {/* Save Notification Toast */}
      {showSaveNotification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in z-50">
          <div className="bg-teal-500 rounded-full p-1">
            <ScanFace size={16} className="text-white" />
          </div>
          <span className="font-medium">Assessment Saved To Profile Hub</span>
        </div>
      )}

      {/* Profile Choice Modal */}
      {showProfileChoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100 relative">
            <button
              onClick={() => setShowProfileChoiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Use Existing Profile?
            </h3>
            <p className="text-slate-600 mb-6">
              We have your health profile on file. Would you like to use it for
              this assessment, or update it with new information?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSkipQuestionnaire(true);
                  setAssessmentType("full");
                  setAppState(AppState.CAMERA);
                  setShowProfileChoiceModal(false);
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
              >
                Use Current Profile
              </button>
              <button
                onClick={() => {
                  setSkipQuestionnaire(false);
                  setAssessmentType("full");
                  setAppState(AppState.CAMERA);
                  setShowProfileChoiceModal(false);
                }}
                className="w-full bg-white border-2 border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-600 font-bold py-3 rounded-xl transition-colors"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
