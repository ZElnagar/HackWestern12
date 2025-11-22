import { Schema, Type } from "@google/genai";

export const SYSTEM_INSTRUCTION = `You are a conservative, evidence-focused clinical nutrition assistant. Interpret visual signs from a webcam image and combine them with patient questionnaire responses to recommend safe, practical dietary guidance. Always: (1) prioritize patient safety, (2) note uncertainty/confidence, (3) request follow-up questions when data are missing, (4) cite sources for claims or recommendations, and (5) add a clear disclaimer that the output is AI-assisted guidance and not a medical diagnosis—recommend clinician review for moderate/severe findings. When producing a diet plan, respect allergies, religious/ethical rules, and medications.`;

export const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    interpretation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          finding: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          rationale: { type: Type.STRING },
          recommendedLabsOrReferral: { type: Type.STRING }
        },
        required: ["finding", "confidence", "rationale"]
      }
    },
    nutrientTargets: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein_g: { type: Type.NUMBER },
        iron_mg: { type: Type.NUMBER },
        vitaminB12_ug: { type: Type.NUMBER },
        vitaminD_IU: { type: Type.NUMBER },
        folate_ug: { type: Type.NUMBER },
        zinc_mg: { type: Type.NUMBER }
      }
    },
    mealPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                time: { type: Type.STRING },
                description: { type: Type.STRING },
                portions: { type: Type.STRING },
                substitutions: { type: Type.STRING }
              },
              required: ["name", "description", "portions"]
            }
          },
          estimatedNutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein_g: { type: Type.NUMBER },
              carbs_g: { type: Type.NUMBER },
              fat_g: { type: Type.NUMBER }
            }
          }
        },
        required: ["day", "meals"]
      }
    },
    shoppingList: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    estimatedWeeklyCost: { type: Type.NUMBER, description: "Estimated total cost in CAD based on Ontario pricing" },
    implementationChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    followUpQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }
      }
    },
    disclaimer: { type: Type.STRING }
  },
  required: ["summary", "interpretation", "mealPlan", "implementationChecklist", "disclaimer", "estimatedWeeklyCost"]
};