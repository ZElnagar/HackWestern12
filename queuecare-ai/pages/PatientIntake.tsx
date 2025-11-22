import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { analyzePatientVisuals, calculateTriageLevel, researchVisualSymptoms } from '../services/geminiService';
import { SymptomData, VisualAnalysisResult, TriageLevel } from '../types';
import { useQueue } from '../contexts/QueueContext';

enum Step {
  CAMERA = 1,
  SYMPTOMS = 2,
  PROCESSING = 3,
  RESULT = 4
}

export const PatientIntake: React.FC = () => {
  const navigate = useNavigate();
  const { addPatient } = useQueue();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState<Step>(Step.CAMERA);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [visualAnalysis, setVisualAnalysis] = useState<VisualAnalysisResult | null>(null);
  const [isAnalyzingVisuals, setIsAnalyzingVisuals] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  
  const [symptoms, setSymptoms] = useState<SymptomData>({
    complaint: '',
    painLevel: 0,
    duration: '',
    breathingDifficulty: false,
    canWalk: true
  });

  const [assignedLevel, setAssignedLevel] = useState<TriageLevel | null>(null);
  const [assignedId, setAssignedId] = useState<string>("");
  const [triageReason, setTriageReason] = useState<string>("");

  // Camera Handling
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
    }
  }, []);

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());

        // Start analysis
        setIsAnalyzingVisuals(true);
        setIsResearching(true);
        setStep(Step.SYMPTOMS); 

        try {
          // 1. Visual Analysis (JSON)
          const result = await analyzePatientVisuals(dataUrl);
          setVisualAnalysis(result);
          setIsAnalyzingVisuals(false);

          // 2. Web Research for Deficiencies (Text + Grounding)
          // Only search if there are interesting findings
          if (result.observations.length > 0 || result.pallor !== 'Normal') {
             const research = await researchVisualSymptoms(result.observations, result.pallor);
             setVisualAnalysis(prev => prev ? { ...prev, research } : null);
          } else {
             // Default empty research if nothing visual found to save API tokens
             setVisualAnalysis(prev => prev ? { ...prev, research: { insight: "No significant visual anomalies detected requiring deficiency research.", sources: [] } } : null);
          }
        } catch (error) {
          console.error("Analysis failed", error);
        } finally {
          setIsAnalyzingVisuals(false);
          setIsResearching(false);
        }
      }
    }
  };

  // Step 1: Camera Effect
  React.useEffect(() => {
    if (step === Step.CAMERA) {
      startCamera();
    }
  }, [step, startCamera]);

  // Step 3: Processing Logic
  React.useEffect(() => {
    if (step === Step.PROCESSING) {
      const processTriage = async () => {
        const { level, reason } = await calculateTriageLevel(visualAnalysis, symptoms);
        const newId = `E${Math.floor(Math.random() * 9000) + 1000}`;
        
        setAssignedLevel(level);
        setAssignedId(newId);
        setTriageReason(reason);

        // Add to global queue
        addPatient({
          id: newId,
          timestamp: Date.now(),
          visuals: visualAnalysis,
          symptoms: symptoms,
          triageLevel: level,
          triageReason: reason,
          status: 'waiting'
        });

        // Artificial delay for "Processing" UX
        setTimeout(() => {
          setStep(Step.RESULT);
        }, 1500);
      };
      processTriage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Render Helpers
  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
      <div 
        className="bg-red-600 h-2 rounded-full transition-all duration-500 ease-in-out" 
        style={{ width: `${(step / 4) * 100}%` }} 
      />
    </div>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {renderProgressBar()}

        {/* STEP 1: CAMERA */}
        {step === Step.CAMERA && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Visual Scan</h2>
            <p className="text-gray-500">Please remove hats or sunglasses and look at the camera.</p>
            
            <div className="relative mx-auto w-full max-w-md aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg border-4 border-gray-100">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              <canvas ref={canvasRef} width={640} height={480} className="hidden" />
              
              {/* Overlay Guide */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-dashed border-white/50 rounded-full"></div>
              </div>
            </div>

            <button 
              onClick={captureImage}
              className="w-full max-w-md bg-red-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               Capture & Continue
            </button>
          </div>
        )}

        {/* STEP 2: SYMPTOMS */}
        {step === Step.SYMPTOMS && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Symptoms</h2>
            
            {/* Visual Analysis Feedback Block */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm transition-all duration-500">
              <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                AI Visual Scan Feedback
              </h3>
              
              {isAnalyzingVisuals ? (
                <div className="flex items-center gap-3 text-blue-600 text-sm py-2">
                   <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                   <span>Scanning features...</span>
                </div>
              ) : visualAnalysis ? (
                <div className="animate-fade-in">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold 
                      ${visualAnalysis.pallor !== 'Normal' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-white text-blue-700 border-blue-100'}`}>
                      Skin: {visualAnalysis.pallor}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold 
                      ${visualAnalysis.alertness !== 'Alert' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-white text-blue-700 border-blue-100'}`}>
                      {visualAnalysis.alertness}
                    </span>
                     {visualAnalysis.observations?.map((obs, i) => (
                        <span key={i} className="px-2.5 py-1 bg-yellow-50 rounded-lg border border-yellow-200 text-xs font-semibold text-yellow-800">
                          {obs}
                        </span>
                     ))}
                  </div>

                  {/* Medical Research / Deficiencies Section */}
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Potential Deficiencies (Web Research)</h4>
                      {isResearching && <span className="text-xs text-blue-500 animate-pulse">Searching web...</span>}
                    </div>
                    
                    {visualAnalysis.research ? (
                      <div className="text-sm text-blue-800 bg-white/50 p-3 rounded-lg">
                        <div className="markdown-prose text-xs leading-relaxed mb-3">
                          {visualAnalysis.research.insight}
                        </div>
                        {visualAnalysis.research.sources.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[10px] text-blue-400 font-semibold">SOURCES:</div>
                            <div className="flex flex-wrap gap-2">
                              {visualAnalysis.research.sources.map((src, idx) => (
                                <a 
                                  key={idx} 
                                  href={src.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-100 rounded-md text-[10px] text-blue-600 hover:bg-blue-50 hover:underline truncate max-w-[150px]"
                                >
                                  <span className="truncate">{src.title}</span>
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      !isResearching && <p className="text-xs text-blue-400 italic">No specific deficiency data found.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-blue-500 mt-1">Unable to analyze image clearly.</p>
              )}
            </div>

            <div className="space-y-4">
              {/* Common Symptoms */}
              <label className="block text-sm font-medium text-gray-700">Select Main Complaint</label>
              <div className="grid grid-cols-2 gap-3">
                {['Chest Pain', 'Breathing Difficulty', 'Head Injury', 'Fever', 'Bleeding', 'Stomach Pain'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSymptoms(prev => ({...prev, complaint: s}))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      symptoms.complaint === s 
                      ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input 
                   type="text" 
                   placeholder="Or type other symptom..." 
                   className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-red-500 focus:border-red-500"
                   value={symptoms.complaint}
                   onChange={e => setSymptoms(prev => ({...prev, complaint: e.target.value}))}
                />
              </div>

              {/* Pain Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pain Level (0 - 10): <span className="text-red-600 font-bold text-lg">{symptoms.painLevel}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="1" 
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  value={symptoms.painLevel}
                  onChange={e => setSymptoms(prev => ({...prev, painLevel: parseInt(e.target.value)}))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                   <span>No Pain</span>
                   <span>Severe</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                   <span className="text-gray-700 font-medium">Breathing Difficulty?</span>
                   <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setSymptoms(prev => ({...prev, breathingDifficulty: true}))}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${symptoms.breathingDifficulty ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                      >Yes</button>
                      <button 
                         onClick={() => setSymptoms(prev => ({...prev, breathingDifficulty: false}))}
                         className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${!symptoms.breathingDifficulty ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                      >No</button>
                   </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                   <span className="text-gray-700 font-medium">Able to Walk?</span>
                   <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setSymptoms(prev => ({...prev, canWalk: true}))}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${symptoms.canWalk ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                      >Yes</button>
                      <button 
                         onClick={() => setSymptoms(prev => ({...prev, canWalk: false}))}
                         className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${!symptoms.canWalk ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                      >No</button>
                   </div>
                </div>
              </div>
              
              {/* Duration */}
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How long has this been happening?</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  value={symptoms.duration}
                  onChange={e => setSymptoms(prev => ({...prev, duration: e.target.value}))}
                >
                  <option value="">Select duration...</option>
                  <option value="Just now">Just now (&lt; 1 hour)</option>
                  <option value="Today">Today (1-12 hours)</option>
                  <option value="Few days">A few days</option>
                  <option value="Long time">Chronic / Long time</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => setStep(Step.PROCESSING)}
              disabled={!symptoms.complaint || !symptoms.duration}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Analyze & Check-In
            </button>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === Step.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
             <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">Analyzing Data</h3>
               <p className="text-gray-500">AI is reviewing your vitals and symptoms...</p>
             </div>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === Step.RESULT && assignedLevel && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="bg-green-50 border border-green-200 rounded-full px-4 py-2 inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-800 text-sm font-medium">Check-in Complete</span>
            </div>

            <div>
               <h2 className="text-4xl font-bold text-gray-900 mb-2">Please Take a Seat</h2>
               <p className="text-gray-600 text-lg">Your ticket number is:</p>
            </div>

            <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-xl p-8 max-w-xs mx-auto transform rotate-1">
               <div className="text-6xl font-mono font-bold text-gray-800 tracking-widest mb-4">#{assignedId}</div>
               <div className={`inline-block px-4 py-1 rounded-lg font-bold text-white uppercase tracking-wide text-sm
                 ${assignedLevel === TriageLevel.RED ? 'bg-red-600' : 
                   assignedLevel === TriageLevel.ORANGE ? 'bg-orange-500' :
                   assignedLevel === TriageLevel.YELLOW ? 'bg-yellow-500' : 'bg-green-500'
                 }`}>
                 Priority: {assignedLevel}
               </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto">
               <h4 className="font-semibold text-gray-900 mb-2">AI Triage Assessment</h4>
               <p className="text-gray-600 text-sm leading-relaxed">{triageReason}</p>
               {visualAnalysis && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                     <div className="flex justify-between"><span>Distress:</span> <span className="font-medium">{visualAnalysis.distressLevel}</span></div>
                     <div className="flex justify-between"><span>Alertness:</span> <span className="font-medium">{visualAnalysis.alertness}</span></div>
                     <div className="flex justify-between"><span>Pallor:</span> <span className="font-medium">{visualAnalysis.pallor}</span></div>
                     {visualAnalysis.observations && visualAnalysis.observations.length > 0 && (
                       <div className="pt-2 mt-2 border-t border-gray-100">
                         <span className="block text-gray-400 mb-1">Key Observations:</span>
                         <div className="flex flex-wrap gap-1">
                           {visualAnalysis.observations.map((obs, i) => (
                             <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{obs}</span>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
               )}
            </div>

            <button 
               onClick={() => navigate('/')}
               className="text-red-600 hover:text-red-800 font-medium"
            >
               Return to Home
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};