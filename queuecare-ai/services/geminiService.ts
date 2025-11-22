import { GoogleGenAI, Type } from "@google/genai";
import { TriageLevel, VisualAnalysisResult, SymptomData, MedicalResearch } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing. Please set it in the environment.");
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePatientVisuals = async (base64Image: string): Promise<VisualAnalysisResult> => {
  try {
    const ai = getAiClient();
    
    // Schema for structured output
    const schema = {
      type: Type.OBJECT,
      properties: {
        distressLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        alertness: { type: Type.STRING, enum: ["Alert", "Drowsy", "Unresponsive"] },
        pallor: { type: Type.STRING, enum: ["Normal", "Pale", "Flushed", "Cyanotic", "Jaundiced"] },
        breathing: { type: Type.STRING, enum: ["Normal", "Rapid", "Shallow", "Labored"] },
        observations: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of specific visible physical findings such as 'dark circles under eyes', 'dry skin', 'pale lips', 'bruise on forehead', 'excessive sweating', 'rash', 'yellow eyes'."
        }
      },
      required: ["distressLevel", "alertness", "pallor", "breathing", "observations"],
    };

    const prompt = "Analyze this webcam image of a patient. Identify specific physical details relevant to health, such as skin pallor (anemia?), dark circles (fatigue/dehydration?), dry skin, or jaundice. Be specific about visual blemishes or features.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1], // Remove data:image/jpeg;base64, prefix
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a medical visual assistant. Focus on physical signs that might indicate underlying deficiencies (e.g. pale skin, brittle hair, dark circles).",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as VisualAnalysisResult;

  } catch (error) {
    console.error("Visual Analysis Error:", error);
    // Fallback
    return {
      distressLevel: "Low",
      alertness: "Alert",
      pallor: "Normal",
      breathing: "Normal",
      observations: []
    };
  }
};

export const researchVisualSymptoms = async (observations: string[], pallor: string): Promise<MedicalResearch> => {
  try {
    const ai = getAiClient();
    
    const query = `
      The patient has the following visual attributes: ${pallor !== 'Normal' ? `Skin condition: ${pallor}` : ''}, ${observations.join(', ')}.
      Search for specific nutritional deficiencies (e.g. Iron, Vitamin D, B12, Zinc), hydration issues, or medical conditions that are commonly associated with these specific visual signs. 
      Explain the link between the visual sign and the deficiency.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract sources from grounding metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map(chunk => chunk.web)
      .filter(web => web && web.uri && web.title)
      .map(web => ({ title: web!.title!, uri: web!.uri! }));

    // Dedup sources by URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item] as [string, typeof item])).values());

    return {
      insight: response.text || "No specific research data found.",
      sources: uniqueSources.slice(0, 3) // Top 3 sources
    };

  } catch (error) {
    console.error("Research Error:", error);
    return {
      insight: "Unable to perform web research at this time.",
      sources: []
    };
  }
};

export const calculateTriageLevel = async (
  visuals: VisualAnalysisResult | null,
  symptoms: SymptomData
): Promise<{ level: TriageLevel; reason: string }> => {
  try {
    const ai = getAiClient();

    const schema = {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.STRING, enum: ["RED", "ORANGE", "YELLOW", "GREEN"] },
        reason: { type: Type.STRING },
      },
      required: ["level", "reason"],
    };

    const prompt = `
      Patient Data:
      - Main Complaint: ${symptoms.complaint}
      - Pain Level: ${symptoms.painLevel}
      - Breathing Difficulty: ${symptoms.breathingDifficulty}
      - Able to Walk: ${symptoms.canWalk}
      
      Visual Analysis:
      ${visuals ? JSON.stringify(visuals) : "Not available"}

      Assign a triage priority color (Red/Orange/Yellow/Green) based on ESI.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    return {
      level: result.level as TriageLevel,
      reason: result.reason,
    };

  } catch (error) {
    return {
      level: TriageLevel.YELLOW,
      reason: "AI unavailable, defaulted.",
    };
  }
};