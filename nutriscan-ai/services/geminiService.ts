import { GoogleGenAI } from "@google/genai";
import { QuestionnaireData, ImageCaptureSet, DietPlanResponse, ChatMessage } from "../types";
import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from "../constants";

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
  data: QuestionnaireData
): Promise<DietPlanResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const userPrompt = `
    I have attached available images of the patient (Front is mandatory, Profile views are optional) for a comprehensive nutritional assessment.
    
    PART 1: DEEP VISUAL SCAN & ANALYSIS
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

    **BUDGET CONSTRAINT (CRITICAL)**:
    - The patient has a strict weekly grocery budget of **$${data.weeklyBudget} CAD**.
    - **Use CURRENT ESTIMATED PRICING for ONTARIO, CANADA.**
    - If the budget is Low (<$80 CAD): Rely heavily on pulses (lentils/beans), frozen vegetables, eggs, seasonal produce, and bulk grains (rice/oats). Avoid expensive cuts of meat or out-of-season berries.
    - If the budget is Moderate ($80-$150 CAD): Include fresh meats, more fresh produce, and some convenience items.
    - If the budget is High (>$150 CAD): Can include organic items, premium protein cuts (salmon/steak), and specialty health foods.
    - **The Meal Plan MUST be realistic for this budget.**

    Task:
    1. **Interpretation**: Identify up to 3 key visual findings that correlate with potential nutritional deficits. State the specific visual evidence.
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
       - A nutrient-target summary. **CRITICAL: Calculate specific daily targets (RDAs/DRIs) for ALL listed nutrients (Calories, Protein, Iron, B12, D, Folate, Zinc) based on the patient's age, sex, and biometrics. Do NOT return null.**
       - A 7-day meal plan. **ENSURE the 7-day plan averages out to meet the daily nutrient targets AND fits within the $${data.weeklyBudget} CAD budget.**
       - Substitutions for restrictions.
       - A categorized shopping list optimized for the budget (e.g., specifying "Frozen Spinach" instead of "Fresh" if budget is tight).
       - **Calculate and return 'estimatedWeeklyCost'**: The approximate total cost of the shopping list in CAD based on Ontario pricing.
    4. **Action**: Provide an implementation checklist and follow-up questions.
    5. **Sources**: Provide 3 evidence-based sources.

    **CRITICAL - MEAL PORTION FORMAT**:
    When generating the meal plan, the 'portions' field MUST be specific and measurement-based. 
    - BAD: "1 serving of chicken salad"
    - GOOD: "6oz (170g) grilled chicken breast, 2 cups mixed greens, 1 tbsp olive oil dressing"
    - GOOD: "1.5 cups cooked quinoa, 1/2 cup black beans, 1/4 avocado"
    Do NOT use generic "serving" language. Use cups, ounces, grams, tablespoons, pieces, etc.

    **SHOPPING LIST FORMAT**:
    Organize the shopping list into logical categories (e.g., "Produce", "Proteins", "Grains", "Pantry").

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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
      }
    });

    const text = response.text;
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    const historyForApi = history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                ...historyForApi,
                { role: 'user', parts: [{ text: currentMessage }] }
            ],
            config: {
                systemInstruction: systemInstruction
            }
        });

        return response.text || "I'm sorry, I couldn't generate a response.";
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as { description: string; portions: string; reason: string; ingredientsToAdd: string[] };
  } catch (error) {
    console.error("Meal Swap Failed:", error);
    throw error;
  }
};
