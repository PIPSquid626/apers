export function toGradePoint(total: number) {
  if (total >= 70) return 5.0;
  if (total >= 60) return 4.0;
  if (total >= 50) return 3.0;
  if (total >= 45) return 2.0;
  if (total >= 40) return 1.0;
  return 0.0;
}

export function toGradeLetter(total: number) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export function classify(total: number) {
  if (total >= 70) return "Excellent";
  if (total >= 60) return "Good";
  if (total >= 50) return "Average";
  return "Poor";
}

export function classOfDegree(gpaNum: number) {
  if (gpaNum >= 4.5) return "First Class";
  if (gpaNum >= 3.5) return "Second Class Upper";
  if (gpaNum >= 2.4) return "Second Class Lower";
  if (gpaNum >= 1.5) return "Third Class";
  if (gpaNum >= 1.0) return "Pass";
  return "Fail";
}

export type CategoryTone = { text: string; bg: string; bar: string; hex: string };

export const CATEGORY_TONE: Record<string, CategoryTone> = {
  Excellent: { text: "text-excellent", bg: "bg-excellent/10", bar: "bg-excellent", hex: "#B8860B" },
  Good: { text: "text-good", bg: "bg-good/10", bar: "bg-good", hex: "#2C5F8A" },
  Average: { text: "text-average", bg: "bg-average/10", bar: "bg-average", hex: "#C1793C" },
  Poor: { text: "text-poor", bg: "bg-poor/10", bar: "bg-poor", hex: "#A6432D" },
};

export const CATEGORY_ORDER = ["Excellent", "Good", "Average", "Poor"] as const;