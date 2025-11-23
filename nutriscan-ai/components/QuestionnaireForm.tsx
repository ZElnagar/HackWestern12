import React, { useState } from "react";
import { QuestionnaireData, WearableData } from "../types";
import {
  ChevronRight,
  Activity,
  Wallet,
  Watch,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { connectToWearable } from "../services/wearableService";

interface Props {
  onSubmit: (data: QuestionnaireData) => void;
  initialData?: QuestionnaireData;
}

const QuestionnaireForm: React.FC<Props> = ({ onSubmit, initialData }) => {
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");

  const [formData, setFormData] = useState<any>({
    age: initialData?.age || 30,
    sex: initialData?.sex || "female",
    weightKg: initialData?.weight || (initialData as any)?.weightKg || 70,
    heightCm: initialData?.height || (initialData as any)?.heightCm || 170,
    activityLevel: initialData?.activityLevel || "moderate",
    pregnancyStatus: "not_pregnant", // These might not be in QuestionnaireData based on types.ts, so keep defaults if missing
    breastfeedingStatus: "not_breastfeeding",
    allergies: initialData?.allergies || "",
    religiousRestrictions: initialData?.religiousRestrictions || "",
    dietPreferences: "omnivore", // This might be missing in types.ts too
    dislikedFoods: "",
    medications: initialData?.medications || "",
    weeklyBudget: initialData?.weeklyBudget || 120,
  });

  // Separate state for imperial display values
  const [imperialData, setImperialData] = useState({
    weightLbs: Math.round((initialData?.weight || 70) * 2.20462),
    heightFt: Math.floor((initialData?.height || 170) / 2.54 / 12),
    heightIn: Math.round(((initialData?.height || 170) / 2.54) % 12),
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [wearableData, setWearableData] = useState<WearableData | undefined>(
    undefined
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "age" || name === "weeklyBudget") {
      // Only allow positive integers for age
      if (name === "age") {
        if (value !== "" && (!/^\d+$/.test(value) || Number(value) < 0)) return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
      return;
    }

    // Handle metric inputs
    if (unitSystem === "metric") {
      if (name === "weightKg" || name === "heightCm") {
        // Only allow positive numbers (integer or decimal)
        if (value !== "" && (!/^\d*\.?\d*$/.test(value) || Number(value) < 0)) return;
        
        setFormData((prev) => ({
          ...prev,
          [name]: value === "" ? "" : Number(value),
        }));

        // Keep imperial values in sync roughly for switching
        if (value !== "") {
          const val = Number(value);
          if (name === "weightKg") {
            setImperialData((prev) => ({
              ...prev,
              weightLbs: Math.round(val * 2.20462),
            }));
          } else if (name === "heightCm") {
            const totalInches = val / 2.54;
            setImperialData((prev) => ({
              ...prev,
              heightFt: Math.floor(totalInches / 12),
              heightIn: Math.round(totalInches % 12),
            }));
          }
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      // Generic non-measurement inputs
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImperialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Only allow positive numbers for imperial inputs
    if (value !== "" && (!/^\d*\.?\d*$/.test(value) || Number(value) < 0)) return;

    const numValue = value === "" ? "" : Number(value);

    setImperialData((prev) => {
      const newData = { ...prev, [name]: numValue };

      // Update main formData (Metric) immediately
      if (name === "weightLbs" && numValue !== "") {
        setFormData((f) => ({
          ...f,
          weightKg: Math.round(Number(numValue) / 2.20462),
        }));
      } else if (
        (name === "heightFt" || name === "heightIn") &&
        newData.heightFt !== "" &&
        newData.heightIn !== ""
      ) {
        const totalInches =
          Number(newData.heightFt) * 12 + Number(newData.heightIn);
        setFormData((f) => ({
          ...f,
          heightCm: Math.round(totalInches * 2.54),
        }));
      }

      return newData;
    });
  };

  const handleSyncWearable = async () => {
    setIsSyncing(true);
    try {
      const data = await connectToWearable("google_fit");
      setWearableData(data);
      setFormData((prev) => ({
        ...prev,
        wearableData: data,
        // Update activity level display (though AI will prioritize real data)
        activityLevel: "synced_device",
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

    // Final consistency check before submit
    let finalData = { ...formData };

    // Ensure numeric values are clean numbers
    finalData.age = Number(finalData.age);
    finalData.weeklyBudget = Number(finalData.weeklyBudget);

    // If in imperial mode, ensure the metric conversion is authoritative
    if (unitSystem === "imperial") {
      const lbs = Number(imperialData.weightLbs);
      const ft = Number(imperialData.heightFt);
      const inches = Number(imperialData.heightIn);

      finalData.weightKg = Math.round(lbs / 2.20462);
      finalData.heightCm = Math.round((ft * 12 + inches) * 2.54);
    } else {
      finalData.weightKg = Number(formData.weightKg);
      finalData.heightCm = Number(formData.heightCm);
    }

    // Map internal state (weightKg/heightCm) to external API (weight/height)
    const submittedData = {
      ...finalData,
      weight: finalData.weightKg,
      height: finalData.heightCm,
    };

    // Clean up internal keys if desired, but keeping them doesn't hurt unless strict validation
    // We'll keep them for now or just rely on the mapped ones.

    onSubmit(submittedData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-teal-600" />
          Health Profile
        </h2>
        <p className="text-slate-500 mt-1">
          Help the AI personalize your nutrition plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Biometrics */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
                1
              </div>
              Biometrics
            </h3>

            {/* Unit Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setUnitSystem("metric")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  unitSystem === "metric"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem("imperial")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  unitSystem === "imperial"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Imperial (lbs/ft)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                disabled={!!initialData}
                className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 ${
                  !!initialData ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                }`}
                required
              />
              {!!initialData && (
                <p className="text-xs text-slate-400 mt-1">
                  Cannot be changed in settings.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sex
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                disabled={!!initialData}
                className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 ${
                  !!initialData ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                }`}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            {unitSystem === "metric" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weightKg"
                    value={formData.weightKg}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="heightCm"
                    value={formData.heightCm}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    name="weightLbs"
                    value={imperialData.weightLbs}
                    onChange={handleImperialChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      name="heightFt"
                      value={imperialData.heightFt}
                      onChange={handleImperialChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      (in)
                    </label>
                    <input
                      type="number"
                      name="heightIn"
                      value={imperialData.heightIn}
                      onChange={handleImperialChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {formData.sex === "female" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pregnancy Status
                </label>
                <select
                  name="pregnancyStatus"
                  value={formData.pregnancyStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                >
                  <option value="not_pregnant">Not Pregnant</option>
                  <option value="pregnant_t1">First Trimester</option>
                  <option value="pregnant_t2">Second Trimester</option>
                  <option value="pregnant_t3">Third Trimester</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Breastfeeding
                </label>
                <select
                  name="breastfeedingStatus"
                  value={formData.breastfeedingStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                >
                  <option value="not_breastfeeding">No</option>
                  <option value="breastfeeding_exclusive">Exclusive</option>
                  <option value="breastfeeding_partial">Partial</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Activity Level
            </label>

            {!wearableData ? (
              <div className="space-y-3">
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
                >
                  <option value="sedentary">
                    Sedentary (Little or no exercise)
                  </option>
                  <option value="light">
                    Lightly Active (Light exercise 1-3 days/week)
                  </option>
                  <option value="moderate">
                    Moderately Active (Exercise 3-5 days/week)
                  </option>
                  <option value="active">
                    Active (Exercise 6-7 days/week)
                  </option>
                  <option value="very_active">
                    Very Active (Physical job or hard exercise)
                  </option>
                </select>

                <div className="flex items-center gap-4 my-2">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs text-slate-400 font-medium uppercase">
                    Or Sync Device
                  </span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <button
                  type="button"
                  disabled={true}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 cursor-not-allowed bg-slate-50"
                >
                  <Watch size={20} />
                  Connect Google Fit / Apple Health (Coming Soon)
                </button>
              </div>
            ) : (
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-2 rounded-full text-teal-700">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-teal-900">
                      Device Synced
                    </div>
                    <div className="text-xs text-teal-700">
                      Avg Steps: {wearableData.dailySteps.toLocaleString()} •
                      Sleep: {wearableData.averageSleepHours}h
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWearableData(undefined);
                    setFormData((prev) => ({
                      ...prev,
                      wearableData: undefined,
                      activityLevel: "moderate",
                    }));
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
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
              2
            </div>
            Weekly Budget (Ontario, CA Pricing)
          </h3>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Weekly Grocery Budget (CAD)
              </label>
              <span className="text-lg font-bold text-teal-700">
                ${formData.weeklyBudget}
              </span>
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
              AI will select ingredients (e.g., frozen vs. fresh, cuts of meat)
              to fit this limit.
            </p>
          </div>
        </section>

        {/* Diet & Health */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
              3
            </div>
            Restrictions & Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Allergies & Intolerances
              </label>
              <input
                type="text"
                name="allergies"
                placeholder="e.g., Peanuts, Gluten, Shellfish"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Religious or Ethical Restrictions
              </label>
              <input
                type="text"
                name="religiousRestrictions"
                placeholder="e.g., Halal, Kosher, No Pork, Vegan"
                value={formData.religiousRestrictions}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Medications
              </label>
              <input
                type="text"
                name="medications"
                placeholder="e.g., Warfarin, Metformin, Statins (Optional)"
                value={formData.medications}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Used to check for food-drug interactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dietary Preference
                </label>
                <select
                  name="dietPreferences"
                  value={formData.dietPreferences}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Disliked Foods
                </label>
                <input
                  type="text"
                  name="dislikedFoods"
                  placeholder="e.g., Mushrooms, Cilantro"
                  value={formData.dislikedFoods}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 bg-white"
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
