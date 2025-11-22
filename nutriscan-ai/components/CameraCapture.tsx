import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCcw, CheckCircle, ChevronRight, AlertCircle, SkipForward } from 'lucide-react';
import { ImageCaptureSet } from '../types';

interface CameraCaptureProps {
  onComplete: (images: ImageCaptureSet) => void;
}

const CAPTURE_STEPS = [
  { id: 'front', label: 'Front Face', instruction: 'Look directly at the camera. Ensure good lighting.' },
  { id: 'left', label: 'Left Profile', instruction: 'Turn your head slowly to the RIGHT (showing your left profile).' },
  { id: 'right', label: 'Right Profile', instruction: 'Turn your head slowly to the LEFT (showing your right profile).' },
];

const CameraCapture: React.FC<CameraCaptureProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<ImageCaptureSet>({ front: null, left: null, right: null });
  const [error, setError] = useState<string>('');
  const [videoReady, setVideoReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setVideoReady(false);
      // Request generic video access first to avoid overconstrained errors
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          // Using ideal values allows the browser to pick the best available resolution
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setError('');
    } catch (err) {
      console.error("Camera Error:", err);
      setError('Unable to access camera. Please ensure permissions are granted and another app is not using it.');
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CRITICAL FIX: Re-attach stream to video element whenever the video element re-appears
  // (i.e., when moving from an image preview back to live camera view)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Explicitly play to ensure stream starts on some browsers
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }
  }, [stream, currentStep, captures]); // Re-run when step changes or captures change (toggling the video view)

  const handleVideoCanPlay = () => {
    setVideoReady(true);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Double check video actually has data
    if (video.videoWidth === 0 || video.videoHeight === 0) {
       console.warn("Video dimensions are 0, cannot capture");
       return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror the capture to match the preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Use JPEG to ensure consistent mime type for the API
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      const stepId = CAPTURE_STEPS[currentStep].id;
      setCaptures(prev => ({ ...prev, [stepId]: dataUrl }));
      
      // Auto advance removed to allow user to review and click next manually
    }
  };

  const handleSkip = () => {
    const stepId = CAPTURE_STEPS[currentStep].id;
    // Explicitly set to null to indicate skipped
    setCaptures(prev => ({ ...prev, [stepId]: null }));
    
    if (currentStep < CAPTURE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setVideoReady(false);
    } else {
      // If skipping the last step, we can finish
      // However, handleFinish needs at least front to be present, which is step 0 (unskippable in UI below)
      if (captures.front) {
        // Need to defer calling onComplete to state update
        // But here we just update step, the user will see "Complete" button if front is there.
      }
    }
  };

  const handleRetake = () => {
    const stepId = CAPTURE_STEPS[currentStep].id;
    setCaptures(prev => ({ ...prev, [stepId]: null }));
    setVideoReady(false);
  };

  const handleFinish = () => {
    // Only front face is strictly required
    if (captures.front) {
      onComplete(captures);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-100 rounded-xl p-8 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4 text-red-600">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Camera Error</h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <button 
          onClick={startCamera}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currentCapture = captures[CAPTURE_STEPS[currentStep].id as keyof ImageCaptureSet];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Visual Health Scan</h2>
        <span className="text-sm font-medium px-3 py-1 bg-teal-100 text-teal-700 rounded-full">
          Step {currentStep + 1} of 3: {CAPTURE_STEPS[currentStep].label}
        </span>
      </div>

      <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3] shadow-lg border-4 border-slate-200">
        {/* Instructions Overlay */}
        <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in">
                {CAPTURE_STEPS[currentStep].instruction}
            </div>
        </div>

        {currentCapture ? (
          <img src={currentCapture} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            onCanPlay={handleVideoCanPlay}
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading State when video isn't ready */}
        {!currentCapture && !videoReady && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        )}

        {/* Guide Grid */}
        {!currentCapture && videoReady && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
                {/* Face Oval Guide */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[45%] h-[65%] border-2 border-dashed border-white/70 rounded-[50%] box-border shadow-[0_0_15px_rgba(0,0,0,0.3)]"></div>
                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-0 right-0 border-t border-white/20"></div>
                <div className="absolute top-0 bottom-0 left-1/2 border-l border-white/20"></div>
            </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {currentCapture ? (
          <>
            <button 
              onClick={handleRetake}
              className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition"
            >
              <RotateCcw size={20} />
              Retake
            </button>
            {currentStep < CAPTURE_STEPS.length - 1 ? (
               <button 
               onClick={() => {
                   setCurrentStep(prev => prev + 1);
                   setVideoReady(false);
               }}
               className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition shadow-md hover:shadow-lg"
             >
               Next Angle
               <ChevronRight size={20} />
             </button>
            ) : (
                <button 
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg animate-pulse-subtle"
              >
                Complete Scan
                <CheckCircle size={20} />
              </button>
            )}
          </>
        ) : (
          <div className="flex gap-3">
            {currentStep > 0 && (
                 <button 
                 onClick={handleSkip}
                 className="flex items-center gap-2 px-6 py-4 bg-slate-200 text-slate-600 font-semibold rounded-full transition hover:bg-slate-300"
               >
                 Skip
                 <SkipForward size={20} />
               </button>
            )}
            <button 
                onClick={captureImage}
                disabled={!videoReady}
                className={`flex items-center gap-2 px-8 py-4 font-semibold rounded-full transition shadow-lg hover:shadow-xl transform active:scale-95 ${videoReady ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-400 text-slate-200 cursor-not-allowed'}`}
            >
                <Camera size={24} />
                Capture {CAPTURE_STEPS[currentStep].label}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-4">
          {CAPTURE_STEPS.map((step, idx) => (
              <div 
                key={step.id} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-teal-600' : (captures[step.id as keyof ImageCaptureSet] ? 'w-2 bg-green-500' : 'w-2 bg-slate-300')}`}
              />
          ))}
      </div>
    </div>
  );
};

export default CameraCapture;