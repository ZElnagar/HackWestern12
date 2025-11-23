import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuestionnaireData, ImageCaptureSet, DietPlanResponse, ChatMessage, DailyCheckinData, DailyInsightResponse } from "../types";
import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from "../constants";

// Define a local Schema type compatible with @google/generative-ai
// This is necessary because constants.ts uses @google/genai types which are slightly different
// but structure is compatible if we cast it
interface GenerativeAISchema {
  type: string; // Assuming simple string type or enum
  properties?: Record<string, GenerativeAISchema>;
  items?: GenerativeAISchema;
  enum?: string[];
  required?: string[];
  description?: string;
}

const extractImagePart = (dataUrl: string) => {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    
    if (match && match.length === 3) {
      return {
        inlineData: {
          mimeType: match[1], 
          data: match[2] 
        }
      };
    } else if (dataUrl.includes(',')) {
       const [header, data] = dataUrl.split(',');
       const mimeMatch = header.match(/:(.*?);/);
       return {
         inlineData: {
           mimeType: mimeMatch ? mimeMatch[1] : "image/jpeg",
           data: data
         }
       };
    }
  } catch (e) {
    console.error("Error parsing image data URL:", e);
  }
  throw new Error("Invalid image format. Please retake the photo.");
};

export const generateDietPlan = async (
  images: ImageCaptureSet,
  data: QuestionnaireData,
  scanMode: 'full' | 'face' | 'hands' = 'face'
): Promise<DietPlanResponse> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env file and ensure GEMINI_API_KEY is set.");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA as any, // Cast to any to bypass strict type check between @google/genai and @google/generative-ai schemas
      temperature: 0.4,
    }
  });

  const visualAnalysisPrompt = scanMode === 'hands' ? `
    I have attached images of the patient's hands (Fingernails, Palms, Skin Texture).
    
    PART 1: DEEP VISUAL SCAN & ANALYSIS (HANDS)
    Analyze the hands for nutritional deficiencies:
    - **Nails**: Look for Koilonychia (spoon nails - Iron deficiency), Leukonychia (white spots - Zinc deficiency), Beau's lines, longitudinal ridges (B-vitamins/Age), or brittleness (Biotin/Thyroid).
    - **Skin**: Check for dryness/xerosis (Vitamin A/E/Omega-3), pallor (Anemia), or yellowing (Carotenemia/Jaundice).
    - **Palms**: Check for Palmar Erythema (Liver/Hormonal) or pallor in creases (Anemia).
  ` : `
    I have attached available images of the patient (Front is mandatory, Profile views are optional) for a comprehensive nutritional assessment.
    
    PART 1: DEEP VISUAL SCAN & ANALYSIS (FACE)
    Perform a highly detailed analysis of the provided images. You are looking for subtle and overt physiological markers of nutritional status.
    
    Please explicitly analyze and comment on:
    - **Facial Structure & Fat Loss**: Temporal wasting, sunken cheeks, or puffiness/edema (moon face).
    - **Skin Health**: 
       - Pallor (anemia) vs. flushing.
       - Acne locations (chin/jawline for hormonal, forehead for digestive).
       - Dryness, flakiness, or seborrheic dermatitis (zinc/B-vitamin links).
       - Hyperpigmentation (acanthosis nigricans) or yellowing (jaundice).
    - **Eyes**: 
       - Periorbital dark circles (allergic shiners vs. fatigue vs. iron deficiency).
       - Xanthelasma (cholesterol deposits).
       - Conjunctival pallor.
       - Ptosis (droopy eyelids) or signs of sleep deprivation.
    - **Mouth & Lips**: 
       - Angular cheilitis (cracks at corners - B2/Iron deficiency).
       - Lip dryness/cracking or pale color.
    - **Expression & Posture**: 
       - Signs of apathy, fatigue, or pain.
       - Head posture (slouching/drooping which may indicate muscle weakness or fatigue).
  `;

  // Enhanced Prompt for detailed multi-angle analysis with BUDGET constraints
  const userPrompt = `
    ${visualAnalysisPrompt}
    
    PART 2: CLINICAL SYNTHESIS & BUDGET PLANNING
    Combine your visual findings with the questionnaire data below.
    
    Questionnaire Data:
    ${JSON.stringify(data, null, 2)}

    **WEARABLE DATA INTEGRATION (IMPORTANT)**:
    ${data.wearableData ? `
      - The patient has provided real-time data from a wearable device.
      - **Daily Steps:** ${data.wearableData.dailySteps}
      - **Avg Sleep:** ${data.wearableData.averageSleepHours} hours
      - **Resting HR:** ${data.wearableData.restingHeartRate || 'N/A'} bpm
      
      **INSTRUCTION:**
      1. Use 'dailySteps' to calculate caloric needs MORE ACCURATELY than the self-reported activity level.
      2. If 'averageSleepHours' is < 7, prioritize magnesium-rich foods or foods that support sleep hygiene in the meal plan.
      3. If facial analysis shows 'dark circles' AND sleep data is low, attribute the dark circles primarily to lack of sleep in your rationale.
    ` : '- No wearable data provided; rely on self-reported activity level.'}

    **CALORIC CALCULATION INSTRUCTION**:
    - **STEP 1: Calculate BMR** using the **Mifflin-St Jeor Equation**:
      - Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
      - Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    - **STEP 2: Apply Activity Multiplier** (TDEE):
      - Sedentary (little/no exercise): BMR x 1.2
      - Lightly active (light exercise 1-3 days/week): BMR x 1.375
      - Moderately active (moderate exercise 3-5 days/week): BMR x 1.55
      - Active (hard exercise 6-7 days/week): BMR x 1.725
      - Very active (physical job or hard exercise): BMR x 1.9
    - **STEP 3: Weight Management Adjustment**:
      - Calculate the patient's BMI (Weight kg / Height m^2).
      - **If Overweight (BMI 25-29.9) or Obese (BMI > 30)**: SUBTRACT 250-500 kcal from TDEE to support gradual, safe weight loss.
      - **If Underweight (BMI < 18.5)**: ADD 250-500 kcal to TDEE to support healthy weight gain.
      - **If Normal Weight**: Maintain TDEE.
      - **CRITICAL**: Return the FINAL adjusted value as the 'calories' target in the JSON.

    **MACRO CALCULATION INSTRUCTION**:
    - Once the target calories are determined, calculate the macro targets:
      - **Protein**:
        - For Men: 0.8g per pound of body weight (approx 1.76g per kg).
        - For Women: 0.65g per pound of body weight (approx 1.4g per kg).
        - Calculation: (Weight in kg * 1.76) = grams of protein.
      - **Fats**: 30% of Total Calories. ((Total Calories * 0.30) / 9) = grams of fat.
      - **Carbohydrates**: Remaining calories. ((Total Calories - (Protein_g * 4) - (Fat_g * 9)) / 4) = grams of carbs.
    - Return these calculated gram values in the 'nutrientTargets' object.

    **BUDGET CONSTRAINT (CRITICAL)**:
    - The patient has a strict weekly grocery budget of **$${data.weeklyBudget} CAD**.
    - **Use CURRENT ESTIMATED PRICING for ONTARIO, CANADA.**
    - If the budget is Low (<$80 CAD): Rely heavily on pulses (lentils/beans), frozen vegetables, eggs, seasonal produce, and bulk grains (rice/oats). Avoid expensive cuts of meat or out-of-season berries.
    - If the budget is Moderate ($80-$150 CAD): Include fresh meats, more fresh produce, and some convenience items.
    - If the budget is High (>$150 CAD): Can include organic items, premium protein cuts (salmon/steak), and specialty health foods.
    - **The Meal Plan MUST be realistic for this budget.**

    Task:
    1. **Interpretation**: Identify up to 3 key visual findings that correlate with potential nutritional deficits. State the specific visual evidence.
       - **CRITICAL**: For EACH finding, provide a specific, actionable recommendation in the 'recommendedLabsOrReferral' field. 
       - If the finding is minor (e.g., dry lips), recommend a lifestyle change (e.g., "Increase water intake to 2.5L/day").
       - If the finding is medical/severe, recommend a lab test or doctor visit.
       - Do NOT leave 'recommendedLabsOrReferral' empty or say "None indicated".

    2. **Nutrition Score**: Assign a score out of 100 for overall health based on visual signs and questionnaire data. Also provide breakdown scores (0-100) for:
       - **Protein**: Based on muscle mass signs (temporal wasting) vs healthy structure.
       - **Vitamins**: Based on skin/eye health (pallor, dryness, etc).
       - **Hydration**: Based on skin turgor/dryness signs.
       - **Calories**: Based on weight/BMI and facial fat levels.
       
       **Scoring Guide:**
       - 80-100 (Optimal): No visible deficits, healthy BMI, good skin tone.
       - 60-79 (Needs Improvement): Minor signs (e.g. mild circles, slight dryness) or slightly suboptimal BMI.
       - <60 (At Risk): Clear signs of deficiencies (pallor, wasting, cheilitis) or concerning BMI.

    3. **Plan**: Using the questionnaire constraints (allergies, religiousRestrictions, medications), produce:
       ${scanMode === 'hands' ? `
       - A nutrient-target summary. Focus on the specific micronutrients identified as deficient (e.g. Iron, Zinc, Biotin).
       - **Shopping List**: Generate a list of **RECOMMENDED SUPPLEMENTS** (e.g., "Zinc Picolinate 30mg", "Biotin 5000mcg") organized into a "Supplements" category.
       - **Meal Plan**: Provide a simple "Supplement Schedule" (Morning/Noon/Night) in the meal plan structure. You can leave calories/macros as 0 or estimates.
       - **estimatedWeeklyCost**: Estimate the cost of these supplements.
       ` : `
       - A nutrient-target summary. **CRITICAL: Calculate specific daily targets (RDAs/DRIs) for ALL listed nutrients (Calories, Protein, Carbs, Fats) based on the patient's age, sex, and biometrics. Do NOT return null.**
       - **PROTEIN TARGET RULE**: You MUST calculate the protein target as AT LEAST **1.76g per kg** of body weight (equivalent to 0.8g per lb). Use the patient's weight from the data.
       - A 7-day meal plan. **ENSURE the 7-day plan averages out to meet the daily nutrient targets AND fits within the $${data.weeklyBudget} CAD budget.**
       - Substitutions for restrictions.
       - A categorized shopping list optimized for the budget (e.g., specifying "Frozen Spinach" instead of "Fresh" if budget is tight).
       - **Calculate and return 'estimatedWeeklyCost'**: The approximate total cost of the shopping list in CAD based on Ontario pricing.
       `}

    4. **Action**: Provide an implementation checklist and follow-up questions.
    5. **Sources**: Provide 3 evidence-based sources.

    **CRITICAL - MEAL PORTION FORMAT**:
    When generating the meal plan, the 'portions' field MUST be specific and measurement-based. 
    - BAD: "1 serving of chicken salad"
    - GOOD: "6oz (170g) grilled chicken breast, 2 cups mixed greens, 1 tbsp olive oil dressing"
    - GOOD: "1.5 cups cooked quinoa, 1/2 cup black beans, 1/4 avocado"
    Do NOT use generic "serving" language. Use cups, ounces, grams, tablespoons, pieces, etc.

    **SHOPPING LIST FORMAT**:
    Organize the shopping list into logical categories (e.g., "Produce", "Proteins", "Grains", "Pantry" OR "Supplements" if applicable).

    Constraints:
    - **Safety First**: If findings are severe (e.g., severe jaundice, cachexia), recommend immediate medical referral with High confidence.
    - **Restrictions**: Strictly honor allergies (${data.allergies || 'None'}) and religious rules (${data.religiousRestrictions || 'None'}).
    - Output strictly as JSON.
  `;

  const parts = [];
  if (images.front) parts.push(extractImagePart(images.front));
  if (images.left) parts.push(extractImagePart(images.left));
  if (images.right) parts.push(extractImagePart(images.right));
  parts.push({ text: userPrompt });

  try {
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as DietPlanResponse;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const sendChatMessage = async (
    history: ChatMessage[], 
    currentMessage: string,
    contextData: { questionnaire: QuestionnaireData, results: DietPlanResponse }
): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        return "Error: API Key is missing.";
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const systemInstruction = `
        You are the NutriScan AI Assistant. You have just completed a visual health analysis and diet plan generation for a user.
        
        Here is the User's Context:
        - Questionnaire: ${JSON.stringify(contextData.questionnaire)}
        - Analysis & Diet Plan Results: ${JSON.stringify(contextData.results)}
        - **Location Context**: Ontario, Canada.
        - **Budget**: $${contextData.questionnaire.weeklyBudget} CAD / week.
        
        Your Goal:
        Answer the user's follow-up questions regarding their results, the specific food recommendations, or general nutrition.
        - Explain *why* specific foods were recommended based on their scan (e.g., "I recommended spinach because the scan showed pallor indicating potential low iron").
        - If they ask about prices, quote estimates based on Ontario, Canada grocery prices.
        - Be encouraging, evidence-based, and concise.
        - If they ask about medical diagnoses, remind them you are an AI assistant and they should see a doctor.
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    // Reconstruct history for the API
    const historyForApi = history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));
    
    try {
        const chat = model.startChat({
            history: historyForApi
        });

        const result = await chat.sendMessage(currentMessage);
        return result.response.text();
    } catch (e) {
        console.error("Chat Error", e);
        return "I'm having trouble connecting right now. Please try again.";
    }
};

export const swapMeal = async (
  mealDescription: string,
  currentCalories: number,
  dietaryRestrictions: string,
  allergies: string
): Promise<{ description: string; portions: string; reason: string; ingredientsToAdd: string[] }> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    The user wants to swap a meal in their diet plan.
    
    **Original Meal:** "${mealDescription}"
    **Caloric Target:** ~${currentCalories} calories
    **Constraints:**
    - Dietary Restrictions: ${dietaryRestrictions || 'None'}
    - Allergies: ${allergies || 'None'}
    
    **Task:**
    Generate ONE alternative meal option that:
    1. Has similar caloric value (~${currentCalories}).
    2. Offers similar macro-nutrient profile (Protein/Carbs/Fat).
    3. Is distinct from the original (e.g., if original is chicken, suggest fish or tofu).
    4. Strictly adheres to the restrictions/allergies.
    
    **Output Format (JSON only):**
    {
      "description": "Name and detailed description of the new meal (e.g., 'Grilled Salmon with Quinoa and Asparagus')",
      "portions": "Precise serving details (e.g., '6oz (approx. 170g) Atlantic salmon fillet, 1.25 cups cooked quinoa, 1 cup roasted asparagus spears, prepared with 1.5 tbsp olive oil')",
      "reason": "Brief explanation of why this is a good swap (e.g. 'Similar protein content but lower sodium')",
      "ingredientsToAdd": ["List", "of", "ingredients", "for", "shopping", "list"]
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as { description: string; portions: string; reason: string; ingredientsToAdd: string[] };
  } catch (error) {
    console.error("Meal Swap Failed:", error);
    throw error;
  }
};

export const generateDailyInsight = async (
  images: ImageCaptureSet,
  checkin: DailyCheckinData,
  userProfile?: QuestionnaireData
): Promise<DailyInsightResponse> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env file.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const userPrompt = `
    Perform a quick daily visual check-up based on the attached face images.
    
    User Context:
    - Mood (1-4): ${checkin.mood}
    - Sleep: ${checkin.sleep}
    ${userProfile ? `- Known Profile: ${userProfile.age}yo ${userProfile.sex}, Goal: ${userProfile.activityLevel}` : ''}

    Task:
    1. Analyze the face for daily fluctuations (hydration, fatigue signs under eyes, skin pallor).
    2. Combine visual signs with their reported sleep and mood.
    3. Recommend 3 specific vitamins to target TODAY.
    4. Recommend 3 "superfoods" to add to their diet TODAY to boost/stabilize energy.

    Return JSON only:
    {
      "note": "A short, encouraging summary of what you see and how to tackle the day (max 2 sentences).",
      "targetVitamins": [
        { "name": "Vitamin C", "reason": "To combat the dullness seen in skin tone and boost immunity." },
        ... 3 items
      ],
      "superfoods": [
        { "name": "Chia Seeds", "benefit": "High in omega-3s to support brain function after low sleep." },
        ... 3 items
      ]
    }
  `;

  const imageParts = [];
  if (images.front) imageParts.push(extractImagePart(images.front));
  if (images.left) imageParts.push(extractImagePart(images.left));
  if (images.right) imageParts.push(extractImagePart(images.right));

  try {
    const result = await model.generateContent([
      userPrompt,
      ...imageParts
    ]);

    const response = result.response;
    const text = response.text();
    
    if (!text) throw new Error("Empty response from AI");

    return JSON.parse(text) as DailyInsightResponse;
  } catch (error) {
    console.error("Daily Insight Error:", error);
    throw new Error("Failed to generate daily insights. Please try again.");

  }
};