import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DietPlanResponse, QuestionnaireData } from "../types";
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
  Save,
  Pill,
  RefreshCw,
  Loader2,
  Edit2,
  X,
  Download,
  Share2,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import ChatAssistant from "./ChatAssistant";
import HealthRing from "./HealthRing";
import { swapMeal } from "../services/geminiService";

interface Props {
  data: DietPlanResponse;
  questionnaire?: QuestionnaireData | null;
  onSave: (data?: DietPlanResponse) => void;
  isSaved: boolean;
  scanMode?: "full" | "face" | "hands";
  onDone: () => void;
}

const NUTRIENT_DISPLAY_CONFIG: Record<
  string,
  {
    label: string;
    unit: string;
    colorClass: string;
    icon?: React.ReactNode;
    step?: number;
  }
> = {
  calories: {
    label: "Target Calories",
    unit: "kcal",
    colorClass: "bg-teal-50 border-teal-100 text-teal-800",
    step: 10,
  },
  protein_g: {
    label: "Protein",
    unit: "g",
    colorClass: "bg-blue-50 border-blue-100 text-blue-800",
    step: 1,
  },
  carbs_g: {
    label: "Carbs",
    unit: "g",
    colorClass: "bg-orange-50 border-orange-100 text-orange-800",
  },
  fats_g: {
    label: "Fats",
    unit: "g",
    colorClass: "bg-yellow-50 border-yellow-100 text-yellow-800",
  },
  iron_mg: {
    label: "Iron",
    unit: "mg",
    colorClass: "bg-red-50 border-red-100 text-red-800",
    step: 0.1,
  },
  vitaminB12_ug: {
    label: "Vitamin B12",
    unit: "µg",
    colorClass: "bg-purple-50 border-purple-100 text-purple-800",
    step: 0.1,
  },
  vitaminD_IU: {
    label: "Vitamin D",
    unit: "IU",
    colorClass: "bg-yellow-50 border-yellow-100 text-yellow-800",
    step: 10,
  },
  folate_ug: {
    label: "Folate",
    unit: "µg",
    colorClass: "bg-green-50 border-green-100 text-green-800",
    step: 10,
  },
  zinc_mg: {
    label: "Zinc",
    unit: "mg",
    colorClass: "bg-slate-100 border-slate-200 text-slate-700",
    step: 0.1,
  },
};

const formatText = (text: string) => {
  if (!text) return "";
  return text.replace(/m\^2/g, "m²");
};

const getMealLabel = (index: number) => {
  const labels = ["Breakfast", "Lunch", "Dinner", "Snack"];
  return labels[index] || `Meal ${index + 1}`;
};

const ResultsView: React.FC<Props> = ({
  data: initialData,
  questionnaire,
  onSave,
  isSaved,
  scanMode,
  onDone,
}) => {
  const [data, setData] = useState<DietPlanResponse>(initialData);
  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "shopping">(
    "overview"
  );
  const [swappingState, setSwappingState] = useState<{
    dayIndex: number;
    mealIndex: number;
  } | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // New state for editing goals
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editedTargets, setEditedTargets] = useState(
    initialData.nutrientTargets
  );

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
    onSave(data);
    setShowUnsavedModal(false);
  };

  const handleSwapMeal = async (
    dayIndex: number,
    mealIndex: number,
    currentMeal: { description: string; portions: string }
  ) => {
    if (swappingState) return; // Prevent multiple swaps at once

    setSwappingState({ dayIndex, mealIndex });

    try {
      // Estimate calories per meal (roughly total / 3 for now, or improve later)
      const dailyCals = data.mealPlan[dayIndex].estimatedNutrition.calories;
      const estimatedMealCals = Math.round(dailyCals / 3);

      const newMeal = await swapMeal(
        currentMeal.description,
        estimatedMealCals,
        questionnaire?.dietaryRestrictions || "",
        questionnaire?.allergies || ""
      );

      // Update state deeply
      setData((prevData) => {
        const newData = { ...prevData };
        const updatedDay = { ...newData.mealPlan[dayIndex] };
        const updatedMeals = [...updatedDay.meals];

        updatedMeals[mealIndex] = {
          ...updatedMeals[mealIndex],
          description: newMeal.description,
          portions: newMeal.portions,
          substitutions: `Swapped: ${newMeal.reason}`, // Add swap reason as a note
        };

        updatedDay.meals = updatedMeals;
        newData.mealPlan[dayIndex] = updatedDay;

        // Update Shopping List
        if (newMeal.ingredientsToAdd && newMeal.ingredientsToAdd.length > 0) {
          // Check if a "Swapped Items" category already exists
          const swappedCategoryIndex = newData.shoppingList.findIndex(
            (cat) => cat.category === "Swapped Items"
          );

          if (swappedCategoryIndex >= 0) {
            // Append to existing category
            const updatedCategory = {
              ...newData.shoppingList[swappedCategoryIndex],
              items: [
                ...newData.shoppingList[swappedCategoryIndex].items,
                ...newMeal.ingredientsToAdd,
              ],
            };
            const newShoppingList = [...newData.shoppingList];
            newShoppingList[swappedCategoryIndex] = updatedCategory;
            newData.shoppingList = newShoppingList;
          } else {
            // Create new category
            newData.shoppingList = [
              ...newData.shoppingList,
              { category: "Swapped Items", items: newMeal.ingredientsToAdd },
            ];
          }
        }

        return newData;
      });
    } catch (error) {
      console.error("Failed to swap meal", error);
      alert("Could not swap meal at this time. Please try again.");
    } finally {
      setSwappingState(null);
    }
  };

  // Edit Goals Handlers
  const handleEditGoals = () => {
    setEditedTargets(data.nutrientTargets);
    setIsEditingGoals(true);
  };

  const handleSaveGoals = () => {
    setData((prev) => ({
      ...prev,
      nutrientTargets: editedTargets,
    }));
    setIsEditingGoals(false);
  };

  const handleCancelEditGoals = () => {
    setEditedTargets(data.nutrientTargets);
    setIsEditingGoals(false);
  };

  const handleTargetChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue < 0) return; // Prevent negative numbers
    setEditedTargets((prev) => ({
      ...prev,
      [key]: isNaN(numValue) ? null : numValue,
    }));
  };

  // Export Functions
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Helper to escape CSV values
    const escapeCSV = (value: string | number | null): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // If contains comma, newline, or quote, wrap in quotes and escape quotes
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Header Section
    csvContent += "===========================================================\n";
    csvContent += "NUTRISCAN AI - COMPREHENSIVE NUTRITION PLAN\n";
    csvContent += "===========================================================\n";
    csvContent += `Generated: ${new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })}\n`;
    if (data.nutritionScore) {
      csvContent += `Health Score: ${data.nutritionScore.total}/100\n`;
    }
    csvContent += `Estimated Weekly Cost: $${data.estimatedWeeklyCost} CAD\n`;
    csvContent += "\n";

    // Nutrient Targets Section
    csvContent += "-----------------------------------------------------------\n";
    csvContent += "DAILY NUTRIENT TARGETS\n";
    csvContent += "-----------------------------------------------------------\n";
    csvContent += "Nutrient,Target,Unit\n";

    Object.entries(data.nutrientTargets).forEach(([key, value]) => {
      const config = NUTRIENT_DISPLAY_CONFIG[key];
      if (config) {
        csvContent += `${escapeCSV(config.label)},${escapeCSV(value as number | null)},${escapeCSV(config.unit)}\n`;
      }
    });
    csvContent += "\n";

    // Meal Plan Section
    if (data.mealPlan && data.mealPlan.length > 0) {
      csvContent += "-----------------------------------------------------------\n";
      csvContent += "7-DAY MEAL PLAN\n";
      csvContent += "-----------------------------------------------------------\n";
      
      data.mealPlan.forEach((day, dayIdx) => {
        csvContent += `\n${escapeCSV(day.day.toUpperCase())}\n`;
        csvContent += `Daily Totals: ${day.estimatedNutrition.calories} kcal | Protein: ${day.estimatedNutrition.protein_g}g | Carbs: ${day.estimatedNutrition.carbs_g}g | Fats: ${day.estimatedNutrition.fats_g || day.estimatedNutrition.fat_g || 0}g\n`;
        csvContent += "Meal,Time,Description,Portions,Substitutions\n";
        
        day.meals.forEach((meal, mealIdx) => {
          const mealLabel = getMealLabel(mealIdx);
          csvContent += `${escapeCSV(mealLabel)},${escapeCSV(meal.time || "")},${escapeCSV(meal.description)},${escapeCSV(meal.portions)},${escapeCSV(meal.substitutions || "")}\n`;
        });
        
        if (dayIdx < data.mealPlan.length - 1) {
          csvContent += "\n";
        }
      });
      csvContent += "\n";
    }

    // Shopping List Section
    if (data.shoppingList && data.shoppingList.length > 0) {
      csvContent += "-----------------------------------------------------------\n";
      csvContent += "SHOPPING LIST\n";
      csvContent += "-----------------------------------------------------------\n";
      csvContent += "Category,Item\n";
      
      data.shoppingList.forEach((category) => {
        if (category.items && category.items.length > 0) {
          category.items.forEach((item) => {
            csvContent += `${escapeCSV(category.category)},${escapeCSV(item)}\n`;
          });
        }
      });
      csvContent += "\n";
    }

    // Implementation Checklist
    if (data.implementationChecklist && data.implementationChecklist.length > 0) {
      csvContent += "-----------------------------------------------------------\n";
      csvContent += "IMPLEMENTATION CHECKLIST\n";
      csvContent += "-----------------------------------------------------------\n";
      csvContent += "Action Item\n";
      data.implementationChecklist.forEach((item) => {
        csvContent += `${escapeCSV(item)}\n`;
      });
      csvContent += "\n";
    }

    // Summary
    if (data.summary) {
      csvContent += "-----------------------------------------------------------\n";
      csvContent += "SUMMARY\n";
      csvContent += "-----------------------------------------------------------\n";
      csvContent += `${escapeCSV(data.summary)}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nutriscan_plan_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NutriScan AI Results",
          text: `Check out my nutrition plan! Health Score: ${data.nutritionScore.total}/100`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      alert("Sharing is not supported on this browser/device.");
    }
  };

  const renderNutrientCard = (
    key: string,
    value: number | null,
    isMain: boolean = false
  ) => {
    // We now render even if value is present, as per new requirement to show required amounts regardless of health
    // We still handle null just in case API fails, but prompt enforces it.
    const displayValue = value !== null ? value : "N/A";

    const config = NUTRIENT_DISPLAY_CONFIG[key] || {
      label: key,
      unit: "",
      colorClass: "bg-gray-50 text-gray-800",
      step: 1,
    };

    return (
      <div
        key={key}
        className={`flex flex-col justify-between p-4 rounded-xl border shadow-sm ${
          config.colorClass
        } ${isMain ? "md:col-span-2" : ""}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-semibold opacity-80 uppercase tracking-wider">
            {config.label}
          </span>
          {isMain && <CheckCircle size={16} className="opacity-50" />}
        </div>

        {isEditingGoals ? (
          <div className="flex items-end gap-1">
            <input
              type="number"
              min="0"
              step={config.step || 1}
              value={editedTargets[key as keyof typeof editedTargets] || ""}
              onChange={(e) => handleTargetChange(key, e.target.value)}
              className="w-full bg-white/50 border border-black/10 rounded px-2 py-1 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm font-medium opacity-60 mb-2">
              {config.unit}
            </span>
          </div>
        ) : (
          <div className="text-3xl font-bold tracking-tight">
            {displayValue}
            <span className="text-lg font-medium ml-1 opacity-60">
              {config.unit}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Safe check for nutritionScore existence in case of older cached data or partial API response
  const hasScore = data.nutritionScore && data.nutritionScore.breakdown;

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 relative">
      {/* Chat Assistant Integration */}
      <ChatAssistant results={data} questionnaire={questionnaire || null} />

      {/* Nutrition Score Section */}
      {hasScore && (
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Your Nutrition Health Score
            </h2>
            <p className="text-slate-500">
              Based on your visual scan and health questionnaire
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Main Score Ring */}
            <div className="flex flex-col items-center">
              <HealthRing
                score={data.nutritionScore.total}
                label="Overall Score"
                size="large"
              />
              <div className="mt-4 text-center">
                <div
                  className={`text-lg font-bold ${
                    data.nutritionScore.total >= 80
                      ? "text-green-600"
                      : data.nutritionScore.total >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {data.nutritionScore.total >= 80
                    ? "Optimal"
                    : data.nutritionScore.total >= 60
                    ? "Needs Improvement"
                    : "At Risk"}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-32 bg-slate-200"></div>

            {/* Mini Rings Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <HealthRing
                score={data.nutritionScore.breakdown.protein}
                label="Protein"
                color="#3b82f6" // Blue
              />
              <HealthRing
                score={data.nutritionScore.breakdown.vitamins}
                label="Vitamins"
                color="#8b5cf6" // Purple
              />
              <HealthRing
                score={data.nutritionScore.breakdown.hydration}
                label="Hydration"
                color="#06b6d4" // Cyan
              />
              <HealthRing
                score={data.nutritionScore.breakdown.calories}
                label="Calories"
                color="#f97316" // Orange
              />
            </div>
          </div>
        </div>
      )}

      {/* Header Summary */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 text-white mb-8 shadow-xl relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-3xl font-bold">Analysis Complete</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all border border-white/20"
              title="Export Macros CSV"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
        <p className="text-lg opacity-90 leading-relaxed">{formatText(data.summary)}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {data.implementationChecklist.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20"
            >
              <CheckCircle size={16} />
              {formatText(item)}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
            activeTab === "overview"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-slate-500 hover:text-teal-500"
          }`}
        >
          Clinical Findings
        </button>
        {scanMode !== "hands" && (
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === "plan"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-slate-500 hover:text-teal-500"
            }`}
          >
            Meal Plan & Macros
          </button>
        )}
        <button
          onClick={() => setActiveTab("shopping")}
          className={`px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
            activeTab === "shopping"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-slate-500 hover:text-teal-500"
          }`}
        >
          {scanMode === "hands" ? "Recommended Supplements" : "Shopping List"}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Visual Findings */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.interpretation.map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-6 rounded-xl shadow-md border-t-4 ${
                    item.confidence === "High"
                      ? "border-red-500"
                      : item.confidence === "Medium"
                      ? "border-orange-500"
                      : "border-yellow-400"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-800">{formatText(item.finding)}</h3>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        item.confidence === "High"
                          ? "bg-red-100 text-red-700"
                          : item.confidence === "Medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.confidence} Conf.
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    {formatText(item.rationale)}
                  </p>
                  {item.recommendedLabsOrReferral && (
                    <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-200">
                      <strong className="text-slate-700 block mb-1 flex items-center gap-1">
                        <AlertTriangle size={14} /> Recommendation:
                      </strong>
                      {formatText(item.recommendedLabsOrReferral)}
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Nutrient Targets */}
            <section className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <PieChartIcon className="text-teal-600" />
                  Daily Nutrient Targets
                </h3>
                {isEditingGoals ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEditGoals}
                      className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveGoals}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditGoals}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                  >
                    <Edit2 size={14} />
                    Edit Goals
                  </button>
                )}
              </div>
              <p className="text-slate-500 mb-6 text-sm">
                These targets are calculated based on your biometrics (Age, Sex,
                Activity). The meal plan below averages to meet these goals over
                7 days.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Main Macros (Always First) - Hidden for Hand Scan */}
                {scanMode !== "hands" && (
                  <>
                    {renderNutrientCard(
                      "calories",
                      data.nutrientTargets.calories,
                      false
                    )}
                    {renderNutrientCard(
                      "protein_g",
                      data.nutrientTargets.protein_g,
                      false
                    )}
                     {renderNutrientCard(
                      "carbs_g",
                      data.nutrientTargets.carbs_g,
                      false
                    )}
                     {renderNutrientCard(
                      "fats_g",
                      data.nutrientTargets.fats_g,
                      false
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-8">
            {/* Removed Macro Graph per user request */}

            {/* Meal Cards */}
            <div className="space-y-6">
              {data.mealPlan.map((day, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar size={18} className="text-teal-600" /> {day.day}
                    </h4>
                    <div className="text-xs text-slate-500">
                      {day.estimatedNutrition.calories} kcal • P:{" "}
                      {day.estimatedNutrition.protein_g}g
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {day.meals.map((meal, mIdx) => (
                      <div
                        key={mIdx}
                        className="flex flex-col md:flex-row md:items-start gap-4 border-b border-slate-100 last:border-0 pb-4 last:pb-0 group"
                      >
                        <div className="w-24 text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                          {getMealLabel(mIdx)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="font-semibold text-slate-800">
                              {meal.description}
                            </div>
                            <button
                              onClick={() => handleSwapMeal(i, mIdx, meal)}
                              disabled={swappingState !== null}
                              className={`ml-4 px-3 py-1.5 rounded-md border transition-all flex items-center gap-2 text-sm font-medium ${
                                swappingState?.dayIndex === i &&
                                swappingState?.mealIndex === mIdx
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300 shadow-sm"
                              }`}
                              title="Swap this meal for an alternative"
                            >
                              {swappingState?.dayIndex === i &&
                              swappingState?.mealIndex === mIdx ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                              {swappingState?.dayIndex === i &&
                              swappingState?.mealIndex === mIdx
                                ? "Swapping..."
                                : "Swap"}
                            </button>
                          </div>
                          <div className="text-sm text-teal-600 mt-1 font-medium">
                            {meal.portions}
                          </div>
                          {meal.substitutions && (
                            <div className="text-xs text-slate-500 mt-1 italic">
                              {meal.substitutions}
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

        {activeTab === "shopping" && (
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-full text-teal-600">
                  {scanMode === "hands" ? (
                    <Pill size={32} />
                  ) : (
                    <ShoppingBag size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {scanMode === "hands"
                      ? "Supplement Protocol"
                      : "Shopping List"}
                  </h3>
                  <p className="text-slate-500">
                    {scanMode === "hands"
                      ? "Recommended vitamins & minerals based on analysis."
                      : "Recommended items for your 7-day plan."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Estimated Cost</div>
                <div className="text-2xl font-bold text-teal-700">
                  ~${data.estimatedWeeklyCost} CAD
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-1">
                  <Wallet size={12} />
                  Your Budget: ${questionnaire?.weeklyBudget}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.shoppingList.map((category, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid"
                >
                  <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 text-lg">
                    {category.category}
                  </h4>
                  <div className="space-y-3">
                    {category.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 bg-white"
                        />
                        <span className="text-slate-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Grocery Store Integration */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag size={20} className="text-teal-600" />
                Shop Ingredients Online
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="https://www.walmart.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    W
                  </div>
                  <span className="font-bold text-slate-700">Walmart</span>
                  <span className="text-xs text-slate-500 mt-1">
                    Find at nearest store
                  </span>
                </a>

                <a
                  href="https://www.instacart.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    I
                  </div>
                  <span className="font-bold text-slate-700">Instacart</span>
                  <span className="text-xs text-slate-500 mt-1">
                    Delivery available
                  </span>
                </a>

                <a
                  href="https://www.loblaws.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    L
                  </div>
                  <span className="font-bold text-slate-700">Loblaws</span>
                  <span className="text-xs text-slate-500 mt-1">
                    Price Match Guarantee
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer Footer */}
      <div className="mt-12 p-6 bg-slate-100 rounded-xl border border-slate-200 text-sm text-slate-500 text-center">
        <strong className="block text-slate-700 mb-1 uppercase tracking-wide text-xs">
          Medical Disclaimer
        </strong>
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
      {showUnsavedModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={32} />
              <h3 className="text-2xl font-bold text-slate-800">
                Unsaved Assessment
              </h3>
            </div>
            <p className="text-slate-600 mb-8">
              You haven't saved your assessment results yet. Would you like to
              save them to your profile before exiting?
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default ResultsView;
