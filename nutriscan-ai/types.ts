import { Schema, Type } from "@google/genai";

export enum AppState {
  LANDING = 'LANDING',
  CAMERA = 'CAMERA',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  AUTH = 'AUTH',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  PROFILE = 'PROFILE',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}

export interface DailyCheckinData {
  mood: number; // 1-4
  sleep: string; // 4 options
}

export interface DailyInsightResponse {
  note: string;
  targetVitamins: {
    name: string;
    reason: string;
  }[];
  superfoods: {
    name: string;
    benefit: string;
  }[];
}

export interface PastAssessment {
  id: string;
  date: string;
  type: 'full' | 'daily';
  results: DietPlanResponse | DailyInsightResponse;
  questionnaire: QuestionnaireData | DailyCheckinData;
  scanType?: 'face' | 'hands';
}

export interface User {
  uid: string;
  email: string;
  password?: string;
  joinedDate: string;
  currentProfile?: QuestionnaireData;
  history: PastAssessment[];
  streak?: number;
}

export interface WearableData {
  provider: 'google_fit' | 'fitbit' | 'apple_health';
  dailySteps: number;
  activeCaloriesBurned: number;
  averageSleepHours: number;
  restingHeartRate?: number;
  lastSynced: string;
}

export interface QuestionnaireData {
  age: number;
  sex: string;
  weight: number;
  height: number;
  activityLevel: string;
  dietaryRestrictions: string;
  allergies: string;
  religiousRestrictions: string; // New field
  medications: string;
  primaryGoal: string;
  weeklyBudget: number; // New field for budget
  wearableData?: WearableData | null; // Optional integration data
}

export interface ShoppingItem {
  item: string;
  checked?: boolean; // Optional for UI state
}

export interface ShoppingCategory {
  category: string;
  items: string[];
}

// Matches the JSON Schema provided in the prompt
export interface DietPlanResponse {
  summary: string;
  // New Score Fields
  nutritionScore: {
    total: number; // 0-100
    breakdown?: {
      protein: number; // 0-100
      vitamins: number; // 0-100
      hydration: number; // 0-100
      calories: number; // 0-100
    };
    handBreakdown?: {
      keratinStrength: number;
      hydrationLevel: number;
      vitaminIndicators: number;
      circulation: number;
    };
  };
  interpretation: {
    finding: string;
    confidence: "High" | "Medium" | "Low";
    rationale: string;
    recommendedLabsOrReferral?: string;
  }[];
  nutrientTargets: {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fats_g: number | null;
    iron_mg?: number | null;
    vitaminB12_ug?: number | null;
    vitaminD_IU?: number | null;
    folate_ug?: number | null;
    zinc_mg?: number | null;
    vitaminC_mg?: number | null;
    biotin_ug?: number | null;
    magnesium_mg?: number | null;
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
  shoppingList: ShoppingCategory[];
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

export interface SwappedMeal {
  description: string;
  portions: string;
  reason: string;
}
