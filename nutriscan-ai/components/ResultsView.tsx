import React, { useState } from 'react';
import { DietPlanResponse, QuestionnaireData } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ShoppingBag, 
  Calendar, 
  PieChart as PieChartIcon,
  ExternalLink,
  FileText,
  ArrowRight,
  Wallet,
  Save
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import ChatAssistant from './ChatAssistant';

interface Props {
  data: DietPlanResponse;
  questionnaire?: QuestionnaireData | null;
  onSave: () => void;
  isSaved: boolean;
  onDone: () => void;
}

const NUTRIENT_DISPLAY_CONFIG: Record<string, { label: string; unit: string; colorClass: string; icon?: React.ReactNode }> = {
  calories: { label: 'Target Calories', unit: 'kcal', colorClass: 'bg-teal-50 border-teal-100 text-teal-800' },
  protein_g: { label: 'Protein', unit: 'g', colorClass: 'bg-blue-50 border-blue-100 text-blue-800' },
  iron_mg: { label: 'Iron', unit: 'mg', colorClass: 'bg-red-50 border-red-100 text-red-800' },
  vitaminB12_ug: { label: 'Vitamin B12', unit: 'µg', colorClass: 'bg-purple-50 border-purple-100 text-purple-800' },
  vitaminD_IU: { label: 'Vitamin D', unit: 'IU', colorClass: 'bg-yellow-50 border-yellow-100 text-yellow-800' },
  folate_ug: { label: 'Folate', unit: 'µg', colorClass: 'bg-green-50 border-green-100 text-green-800' },
  zinc_mg: { label: 'Zinc', unit: 'mg', colorClass: 'bg-slate-100 border-slate-200 text-slate-700' },
};

const ResultsView: React.FC<Props> = ({ data, questionnaire, onSave, isSaved, onDone }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'shopping'>('overview');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleDoneClick = () => {
    if (!isSaved) {
      setShowUnsavedModal(true);
    } else {
      onDone();
    }
  };

  const handleConfirmExit = () => {
    setShowUnsavedModal(false);
    onDone();
  };

  const handleSaveAndExit = () => {
    onSave();
    setShowUnsavedModal(false);
    // We rely on the parent to handle navigation after save, or we can call onDone after a delay
    // But typically onSave in App.tsx handles navigation or state updates.
    // However, the user prompt implies "save OR continue without saving".
    // If we save, we should probably wait for save to complete then exit.
    // Since onSave is void, we'll assume it triggers the save action.
    // Let's just call onDone immediately after onSave for "Save & Exit" behavior if onSave is synchronous enough or handles its own feedback.
    // Actually, looking at App.tsx, handleSaveAssessment sets a notification and then navigates after 2 seconds.
    // So we should just call onSave() and close the modal. The App.tsx logic will take over.
  };

  const macroData = data.mealPlan.map((day, index) => ({
    name: `Day ${index + 1}`,
    protein: day.estimatedNutrition.protein_g,
    carbs: day.estimatedNutrition.carbs_g,
    fat: day.estimatedNutrition.fat_g,
    calories: day.estimatedNutrition.calories
  }));

  const renderNutrientCard = (key: string, value: number | null, isMain: boolean = false) => {
    // We now render even if value is present, as per new requirement to show required amounts regardless of health
    // We still handle null just in case API fails, but prompt enforces it.
    const displayValue = value !== null ? value : 'N/A';
    
    const config = NUTRIENT_DISPLAY_CONFIG[key] || { label: key, unit: '', colorClass: 'bg-gray-50 text-gray-800' };
    
    return (
      <div key={key} className={`flex flex-col justify-between p-4 rounded-xl border shadow-sm ${config.colorClass} ${isMain ? 'md:col-span-2' : ''}`}>
         <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold opacity-80 uppercase tracking-wider">{config.label}</span>
            {isMain && <CheckCircle size={16} className="opacity-50"/>}
         </div>
         <div className="text-3xl font-bold tracking-tight">
            {displayValue}
            <span className="text-lg font-medium ml-1 opacity-60">{config.unit}</span>
         </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 relative">
      {/* Chat Assistant Integration */}
      <ChatAssistant results={data} questionnaire={questionnaire || null} />

      {/* Header Summary */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 text-white mb-8 shadow-xl relative">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold">Analysis Complete</h2>
          <button
            onClick={onSave}
            disabled={isSaved}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isSaved 
                ? 'bg-white/20 text-white/80 cursor-default' 
                : 'bg-white text-teal-700 hover:bg-teal-50 shadow-lg'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle size={20} />
                Saved to Profile
              </>
            ) : (
              <>
                <Save size={20} />
                Save Result
              </>
            )}
          </button>
        </div>
        <p className="text-lg opacity-90 leading-relaxed">{data.summary}</p>
        
        <div className="mt-6 flex flex-wrap gap-3">
            {data.implementationChecklist.slice(0,3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
                    <CheckCircle size={16} />
                    {item}
                </div>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'overview' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-teal-500'}`}
        >
          Clinical Findings
        </button>
        <button 
          onClick={() => setActiveTab('plan')}
          className={`px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'plan' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-teal-500'}`}
        >
          Meal Plan & Macros
        </button>
        <button 
          onClick={() => setActiveTab('shopping')}
          className={`px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'shopping' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-teal-500'}`}
        >
          Shopping List
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Visual Findings */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.interpretation.map((item, idx) => (
                <div key={idx} className={`bg-white p-6 rounded-xl shadow-md border-t-4 ${item.confidence === 'High' ? 'border-red-500' : item.confidence === 'Medium' ? 'border-orange-500' : 'border-yellow-400'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-800">{item.finding}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                      item.confidence === 'High' ? 'bg-red-100 text-red-700' :
                      item.confidence === 'Medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.confidence} Conf.
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{item.rationale}</p>
                  {item.recommendedLabsOrReferral && (
                    <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-200">
                      <strong className="text-slate-700 block mb-1 flex items-center gap-1">
                        <AlertTriangle size={14} /> Recommendation:
                      </strong>
                      {item.recommendedLabsOrReferral}
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Nutrient Targets */}
            <section className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="text-teal-600" />
                Daily Nutrient Targets (Recommended Daily Allowance)
              </h3>
              <p className="text-slate-500 mb-6 text-sm">
                  These targets are calculated based on your biometrics (Age, Sex, Activity). The meal plan below averages to meet these goals over 7 days.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Main Macros (Always First) */}
                {renderNutrientCard('calories', data.nutrientTargets.calories, false)}
                {renderNutrientCard('protein_g', data.nutrientTargets.protein_g, false)}

                {/* Micros - Now showing all of them regardless of 'null' status since prompt ensures data */}
                {Object.entries(data.nutrientTargets)
                  .filter(([key]) => key !== 'calories' && key !== 'protein_g')
                  .map(([key, value]) => renderNutrientCard(key, value as number | null, false))
                }
              </div>
            </section>

            {/* Sources & Questions */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Info size={18} className="text-blue-500"/> Follow-up Questions
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                        {data.followUpQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <ExternalLink size={18} className="text-blue-500"/> References
                    </h4>
                    <ul className="space-y-2 text-sm">
                        {data.sources.map((s, i) => (
                            <li key={i}>
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline flex items-center gap-1">
                                    {s.title} <ExternalLink size={12} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'plan' && (
            <div className="space-y-8">
                 {/* Charts */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold mb-4 text-slate-700">Macro Distribution (7 Days)</h3>
                    <p className="text-sm text-slate-500 mb-4">Showing daily caloric and macro breakdown. The average across these 7 days meets your targets.</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={macroData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="protein" name="Protein (g)" fill="#0d9488" stackId="a" />
                                <Bar dataKey="carbs" name="Carbs (g)" fill="#94a3b8" stackId="a" />
                                <Bar dataKey="fat" name="Fat (g)" fill="#cbd5e1" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Meal Cards */}
                <div className="space-y-6">
                    {data.mealPlan.map((day, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={18} className="text-teal-600"/> {day.day}
                                </h4>
                                <div className="text-xs text-slate-500">
                                    {day.estimatedNutrition.calories} kcal • P: {day.estimatedNutrition.protein_g}g
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {day.meals.map((meal, mIdx) => (
                                    <div key={mIdx} className="flex flex-col md:flex-row md:items-start gap-4 border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                                        <div className="w-24 text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">{meal.name}</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-800">{meal.description}</div>
                                            <div className="text-sm text-teal-600 mt-1 font-medium">{meal.portions}</div>
                                            {meal.substitutions && (
                                                <div className="text-xs text-slate-500 mt-1 italic">
                                                    Note: {meal.substitutions}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'shopping' && (
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                   <div className="flex items-center gap-4">
                        <div className="bg-teal-100 p-3 rounded-full text-teal-600">
                            <ShoppingBag size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">Shopping List</h3>
                            <p className="text-slate-500">Recommended items for your 7-day plan.</p>
                        </div>
                   </div>
                   <div className="text-right">
                        <div className="text-sm text-slate-500">Estimated Cost</div>
                        <div className="text-2xl font-bold text-teal-700">~${data.estimatedWeeklyCost} CAD</div>
                        <div className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-1">
                           <Wallet size={12}/> 
                           Your Budget: ${questionnaire?.weeklyBudget}
                        </div>
                   </div>
                </div>
                <div className="columns-1 md:columns-2 gap-8 space-y-4">
                    {data.shoppingList.map((item, i) => (
                         <div key={i} className="flex items-start gap-3 break-inside-avoid">
                            <input type="checkbox" className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                            <span className="text-slate-700">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Disclaimer Footer */}
      <div className="mt-12 p-6 bg-slate-100 rounded-xl border border-slate-200 text-sm text-slate-500 text-center">
        <strong className="block text-slate-700 mb-1 uppercase tracking-wide text-xs">Medical Disclaimer</strong>
        {data.disclaimer}
      </div>

      {/* Done Button */}
      <div className="mt-8">
        <button 
          onClick={handleDoneClick}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          Done
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={32} />
              <h3 className="text-2xl font-bold text-slate-800">Unsaved Assessment</h3>
            </div>
            <p className="text-slate-600 mb-8">
              You haven't saved your assessment results yet. Would you like to save them to your profile before exiting?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSaveAndExit}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save & Exit
              </button>
              <button
                onClick={handleConfirmExit}
                className="w-full bg-white border-2 border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600 font-bold py-3 rounded-xl transition-colors"
              >
                Exit Without Saving
              </button>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full text-slate-400 hover:text-slate-600 font-medium py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;