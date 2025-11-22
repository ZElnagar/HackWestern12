import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuestionnaireData, ImageCaptureSet, DietPlanResponse, ChatMessage, DailyCheckinData, DailyInsightResponse } from "../types";
import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from "../constants";

const extractImagePart = (dataUrl: string) => {
  // Robustly parse data URLs: data:[<mediatype>][;base64],<data>
  // Example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    
    if (match && match.length === 3) {
      const mimeType = match[1];
      const data = match[2];
      return {
        inlineData: {
          mimeType: mimeType, 
          data: data 
        }
      };
    } else if (dataUrl.includes(',')) {
       // Fallback if regex fails but it looks like a data URL
       const [header, data] = dataUrl.split(',');
       const mimeMatch = header.match(/:(.*?);/);
       const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
       return {
         inlineData: {
           mimeType: mimeType,
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
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4,
    }
  });

  // Enhanced Prompt for detailed multi-angle analysis with BUDGET constraints
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
       - **CRITICAL**: For EACH finding, provide a specific, actionable recommendation in the 'recommendedLabsOrReferral' field. 
       - If the finding is minor (e.g., dry lips), recommend a lifestyle change (e.g., "Increase water intake to 2.5L/day").
       - If the finding is medical/severe, recommend a lab test or doctor visit.
       - Do NOT leave 'recommendedLabsOrReferral' empty or say "None indicated".
    2. **Plan**: Using the questionnaire constraints (allergies, religiousRestrictions, medications), produce:
       - A nutrient-target summary. **CRITICAL: Calculate specific daily targets (RDAs/DRIs) for ALL listed nutrients (Calories, Protein, Iron, B12, D, Folate, Zinc) based on the patient's age, sex, and biometrics. Do NOT return null.**
       - A 7-day meal plan. **ENSURE the 7-day plan averages out to meet the daily nutrient targets AND fits within the $${data.weeklyBudget} CAD budget.**
       - Substitutions for restrictions.
       - A categorized shopping list optimized for the budget (e.g., specifying "Frozen Spinach" instead of "Fresh" if budget is tight).
       - **Calculate and return 'estimatedWeeklyCost'**: The approximate total cost of the shopping list in CAD based on Ontario pricing.
    3. **Action**: Provide an implementation checklist and follow-up questions.
    4. **Sources**: Provide 3 evidence-based sources.

    Constraints:
    - **Safety First**: If findings are severe (e.g., severe jaundice, cachexia), recommend immediate medical referral with High confidence.
    - **Restrictions**: Strictly honor allergies (${data.allergies || 'None'}) and religious rules (${data.religiousRestrictions || 'None'}).
    - Output strictly as JSON.
  `;

  const parts = [];

  if (images.front) parts.push(extractImagePart(images.front));
  if (images.left) parts.push(extractImagePart(images.left));
  if (images.right) parts.push(extractImagePart(images.right));

  parts.push(userPrompt);

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