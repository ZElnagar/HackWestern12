export enum TriageLevel {
  RED = 'RED',       // Immediate / Life-threatening
  ORANGE = 'ORANGE', // Very Urgent
  YELLOW = 'YELLOW', // Urgent
  GREEN = 'GREEN'    // Non-urgent
}

export interface MedicalResearch {
  insight: string;
  sources: { title: string; uri: string }[];
}

export interface VisualAnalysisResult {
  distressLevel: string; // Low, Medium, High
  alertness: string; // Alert, Drowsy, Unresponsive
  pallor: string; // Normal, Pale, Flushed
  breathing: string; // Normal, Rapid, Shallow
  observations: string[]; // Specific visible findings (bruises, sweating, etc.)
  research?: MedicalResearch; // AI-researched deficiencies
}

export interface SymptomData {
  complaint: string;
  painLevel: number; // 0-10
  duration: string;
  breathingDifficulty: boolean;
  canWalk: boolean;
}

export interface Patient {
  id: string;
  timestamp: number;
  visuals: VisualAnalysisResult | null;
  symptoms: SymptomData;
  triageLevel: TriageLevel;
  triageReason: string;
  status: 'waiting' | 'seen';
}

export interface AIConfig {
  apiKey: string;
}