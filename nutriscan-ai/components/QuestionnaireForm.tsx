import React, { useState } from 'react';
import { QuestionnaireData, WearableData } from '../types';
import { ChevronRight, Activity, Wallet, Watch, CheckCircle, Loader2 } from 'lucide-react';
import { connectToWearable } from '../services/wearableService';

interface Props {
  onSubmit: (data: QuestionnaireData) => void;
}

const QuestionnaireForm: React.FC<Props> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<QuestionnaireData>({
    age: 30,
    sex: 'female',
    weightKg: 70,
    heightCm: 170,
    activityLevel: 'moderate',
    pregnancyStatus: 'not_pregnant',
    breastfeedingStatus: 'not_breastfeeding',
    allergies: '',
    religiousRestrictions: '',
    dietPreferences: 'omnivore',
    dislikedFoods: '',
    medications: '',
    weeklyBudget: 120,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [wearableData, setWearableData] = useState<WearableData | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'weightKg' || name === 'heightCm' || name === 'weeklyBudget' ? Number(value) : value
    }));
  };

  const handleSyncWearable = async () => {
    setIsSyncing(true);
    try {
      const data = await connectToWearable('google_fit');
      setWearableData(data);
      setFormData(prev => ({
        ...prev,
        wearableData: data,
        // Update activity level display (though AI will prioritize real data)
        activityLevel: 'synced_device'
      }));
    } catch (error) {
      console.error("Failed to sync", error);
      alert("Could not sync with wearable device.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-teal-600" />
          Health Profile
        </h2>
        <p className="text-slate-500 mt-1">Help the AI personalize your nutrition plan.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Biometrics */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">1</div>
            Biometrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          {formData.sex === 'female' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pregnancy Status</label>
                <select
                  name="pregnancyStatus"
                  value={formData.pregnancyStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="not_pregnant">Not Pregnant</option>
                  <option value="pregnant_t1">First Trimester</option>
                  <option value="pregnant_t2">Second Trimester</option>
                  <option value="pregnant_t3">Third Trimester</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Breastfeeding</label>
                <select
                  name="breastfeedingStatus"
                  value={formData.breastfeedingStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="not_breastfeeding">No</option>
                  <option value="breastfeeding_exclusive">Exclusive</option>
                  <option value="breastfeeding_partial">Partial</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-6">
             <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
             
             {!wearableData ? (
                <div className="space-y-3">
                  <select
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="sedentary">Sedentary (Little or no exercise)</option>
                    <option value="light">Lightly Active (Light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderately Active (Exercise 3-5 days/week)</option>
                    <option value="active">Active (Exercise 6-7 days/week)</option>
                    <option value="very_active">Very Active (Physical job or hard exercise)</option>
                  </select>
                  
                  <div className="flex items-center gap-4 my-2">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs text-slate-400 font-medium uppercase">Or Sync Device</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncWearable}
                    disabled={isSyncing}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
                  >
                    {isSyncing ? <Loader2 className="animate-spin" /> : <Watch size={20} />}
                    {isSyncing ? "Syncing Health Data..." : "Connect Google Fit / Apple Health"}
                  </button>
                </div>
             ) : (
               <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-teal-100 p-2 rounded-full text-teal-700">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-teal-900">Device Synced</div>
                      <div className="text-xs text-teal-700">
                        Avg Steps: {wearableData.dailySteps.toLocaleString()} • Sleep: {wearableData.averageSleepHours}h
                      </div>
                    </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => {
                     setWearableData(undefined);
                     setFormData(prev => ({ ...prev, wearableData: undefined, activityLevel: 'moderate' }));
                   }}
                   className="text-xs text-teal-600 underline hover:text-teal-800"
                 >
                   Disconnect
                 </button>
               </div>
             )}
          </div>
        </section>

        {/* Budget Section */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">2</div>
            Budget (Ontario, CA Pricing)
          </h3>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Weekly Grocery Budget (CAD)</label>
                <span className="text-lg font-bold text-teal-700">${formData.weeklyBudget}</span>
            </div>
            <input 
                type="range" 
                name="weeklyBudget"
                min="50" 
                max="300" 
                step="10" 
                value={formData.weeklyBudget}
                onChange={handleChange}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>$50 (Thrifty)</span>
                <span>$175 (Comfortable)</span>
                <span>$300+ (Premium)</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                <Wallet size={12} />
                AI will select ingredients (e.g., frozen vs. fresh, cuts of meat) to fit this limit.
            </p>
          </div>
        </section>

        {/* Diet & Health */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">3</div>
            Restrictions & Preferences
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergies & Intolerances</label>
              <input
                type="text"
                name="allergies"
                placeholder="e.g., Peanuts, Gluten, Shellfish"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Religious or Ethical Restrictions</label>
              <input
                type="text"
                name="religiousRestrictions"
                placeholder="e.g., Halal, Kosher, No Pork, Vegan"
                value={formData.religiousRestrictions}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medications</label>
              <input
                type="text"
                name="medications"
                placeholder="e.g., Warfarin, Metformin, Statins (Optional)"
                value={formData.medications}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Used to check for food-drug interactions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Preference</label>
                <select
                  name="dietPreferences"
                  value={formData.dietPreferences}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="omnivore">No Preference (Omnivore)</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Disliked Foods</label>
                  <input
                    type="text"
                    name="dislikedFoods"
                    placeholder="e.g., Mushrooms, Cilantro"
                    value={formData.dislikedFoods}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition shadow-lg hover:shadow-xl"
          >
            Generate Analysis
            <ChevronRight />
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm;