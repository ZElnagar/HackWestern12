import { WearableData } from "../types";

/**
 * In a production environment, this service would:
 * 1. Initialize the Google Identity Services SDK.
 * 2. Request OAuth 2.0 scopes (https://www.googleapis.com/auth/fitness.activity.read, etc.).
 * 3. Use the Access Token to call the Google Fit REST API.
 */

export const connectToWearable = async (provider: 'google_fit' | 'fitbit'): Promise<WearableData> => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real app, if auth fails, throw error here.

  // MOCK DATA: Simulating a user who is moderately active but sleep deprived
  // This creates interesting data for the AI to analyze alongside the face scan
  return {
    provider: provider,
    dailySteps: 8432,
    activeCaloriesBurned: 450, // Calories burned via movement only
    averageSleepHours: 5.8, // Low sleep! (AI should catch this)
    restingHeartRate: 68,
    lastSynced: new Date().toISOString()
  };
};