import React, { useState } from 'react';
import { AppState, QuestionnaireData, ImageCaptureSet, DietPlanResponse } from './types';
import CameraCapture from './components/CameraCapture';
import QuestionnaireForm from './components/QuestionnaireForm';
import ResultsView from './components/ResultsView';
import { generateDietPlan } from './services/geminiService';
import { ScanFace, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [images, setImages] = useState<ImageCaptureSet | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [results, setResults] = useState<DietPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCameraComplete = (capturedImages: ImageCaptureSet) => {
    setImages(capturedImages);
    setAppState(AppState.QUESTIONNAIRE);
  };

  const handleQuestionnaireSubmit = async (data: QuestionnaireData) => {
    setQuestionnaire(data);
    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      if (!images) throw new Error("No images captured");
      
      const plan = await generateDietPlan(images, data);
      setResults(plan);
      setAppState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      setError("An error occurred during analysis. Please try again.");
      setAppState(AppState.ERROR);
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
              Advanced visual health screening combined with AI-driven nutrition planning. 
              Detect visible health cues and get a medically-informed diet plan in minutes.
            </p>
            <button 
              onClick={() => setAppState(AppState.CAMERA)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xl font-semibold px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Start Assessment
            </button>
            <p className="mt-6 text-sm text-slate-400">
              Requires camera access • Privacy focused (images processed for session only)
            </p>
          </div>
        );
      
      case AppState.CAMERA:
        return <CameraCapture onComplete={handleCameraComplete} />;

      case AppState.QUESTIONNAIRE:
        return <QuestionnaireForm onSubmit={handleQuestionnaireSubmit} />;

      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="animate-spin text-teal-600 mb-6" size={64} />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Health Data</h2>
            <p className="text-slate-500 text-center max-w-md">
              Our AI is examining your scans for visual biomarkers and synthesizing your personalized nutrition protocol. This may take up to 30 seconds.
            </p>
          </div>
        );

      case AppState.RESULTS:
        return results ? <ResultsView data={results} questionnaire={questionnaire} /> : null;

      case AppState.ERROR:
        return (
           <div className="text-center max-w-md mx-auto mt-20">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Analysis Failed</h2>
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
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(AppState.LANDING)}>
                  <ScanFace className="text-teal-600" />
                  <span className="font-bold text-xl text-slate-900">NutriScan AI</span>
              </div>
              {appState !== AppState.LANDING && (
                  <div className="text-sm font-medium text-slate-500">
                      {appState === AppState.CAMERA && "Step 1: Scan"}
                      {appState === AppState.QUESTIONNAIRE && "Step 2: Profile"}
                      {appState === AppState.ANALYZING && "Step 3: Analysis"}
                      {appState === AppState.RESULTS && "Results"}
                  </div>
              )}
          </div>
       </nav>

       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
       </main>
    </div>
  );
};

export default App;