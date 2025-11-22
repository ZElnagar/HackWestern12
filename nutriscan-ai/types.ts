export enum AppState {
  LANDING = 'LANDING',
  CAMERA = 'CAMERA',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  AUTH = 'AUTH',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  PROFILE = 'PROFILE',
  ERROR = 'ERROR'
}

export interface PastAssessment {
  id: string;
  date: string;
  results: DietPlanResponse;
  questionnaire: QuestionnaireData;
}

export interface User {
  email: string;
  password?: string; // In a real app, don't store this in plain text/state like this
  joinedDate: string;
  currentProfile?: QuestionnaireData;
  history: PastAssessment[];
}

export interface WearableData {
  provider: 'google_fit' | 'apple_health' | 'fitbit' | null;
  dailySteps: number;
  averageSleepHours: number;
  activeCaloriesBurned: number; // Above resting metabolic rate
  restingHeartRate?: number;
  lastSynced: string;
}

export interface QuestionnaireData {
  allergies: string; // comma separated
  religiousRestrictions: string; // comma separated
  dietPreferences: string;
  dislikedFoods: string;
  medications: string;
  age: number;
  sex: string;
  pregnancyStatus: string;
  breastfeedingStatus: string;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  targetCalories?: number;
  weeklyBudget: number; // New field in CAD
  wearableData?: WearableData; // Optional integration data
}

// Matches the JSON Schema provided in the prompt
export interface DietPlanResponse {
  summary: string;
  interpretation: {
    finding: string;
    confidence: "High" | "Medium" | "Low";
    rationale: string;
    recommendedLabsOrReferral?: string;
  }[];
  nutrientTargets: {
    calories: number | null;
    protein_g: number | null;
    iron_mg: number | null;
    vitaminB12_ug: number | null;
    vitaminD_IU: number | null;
    folate_ug: number | null;
    zinc_mg: number | null;
  };
  mealPlan: {
    day: string;
    meals: {
      name: string;
      time: string;
      description: string;
      portions: string;
      substitutions: string;
    }[];
    estimatedNutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
  }[];
  shoppingList: string[];
  estimatedWeeklyCost: number; // New field
  implementationChecklist: string[];
  followUpQuestions: string[];
  sources: {
    title: string;
    url: string;
  }[];
  disclaimer: string;
}

export interface ImageCaptureSet {
  front: string | null;
  left: string | null;
  right: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}