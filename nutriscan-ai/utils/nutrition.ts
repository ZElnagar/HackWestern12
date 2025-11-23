import { QuestionnaireData } from "../types";

export const calculateNutrientTargets = (data: QuestionnaireData) => {
  // Mifflin-St Jeor Equation
  // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161

  const weight = data.weight || (data as any).weightKg;
  const height = data.height || (data as any).heightCm;

  let bmr = 10 * weight + 6.25 * height - 5 * data.age;
  if (data.sex.toLowerCase() === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // Activity Multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier =
    activityMultipliers[data.activityLevel] || activityMultipliers.moderate;
  const tdee = Math.round(bmr * multiplier);

  // Protein Rule: 1.76g per kg (approx 0.8g per lb)
  const protein = Math.round(weight * 1.76);

  // Standard RDAs (Simplified for general adult population)
  // These are baselines; individual needs vary
  const iron = data.sex.toLowerCase() === "female" && data.age < 50 ? 18 : 8;
  const b12 = 2.4;
  const vitaminD = 600; // IU
  const folate = 400; // mcg
  const zinc = data.sex.toLowerCase() === "male" ? 11 : 8;

  return {
    calories: tdee,
    protein_g: protein,
    iron_mg: iron,
    vitaminB12_ug: b12,
    vitaminD_IU: vitaminD,
    folate_ug: folate,
    zinc_mg: zinc,
  };
};
