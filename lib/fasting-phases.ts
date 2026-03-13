export interface FastingPhase {
  name: string;
  minHours: number;
  maxHours: number;
  description: string;
  color: string;
  icon: string;
}

export const FASTING_PHASES: FastingPhase[] = [
  {
    name: "Fed State",
    minHours: 0,
    maxHours: 4,
    description: "Your body is digesting and absorbing nutrients from your last meal.",
    color: "#8B8BA7",
    icon: "restaurant",
  },
  {
    name: "Early Fasting",
    minHours: 4,
    maxHours: 8,
    description: "Insulin levels are dropping. Your body begins tapping into stored energy.",
    color: "#FFD93D",
    icon: "trending-down",
  },
  {
    name: "Fasting State",
    minHours: 8,
    maxHours: 12,
    description: "Blood sugar stabilizes. Growth hormone begins to increase.",
    color: "#FF6B35",
    icon: "flash",
  },
  {
    name: "Fat Burning",
    minHours: 12,
    maxHours: 18,
    description: "Glycogen stores are depleting. Fat is becoming the primary fuel source.",
    color: "#FF6B35",
    icon: "flame",
  },
  {
    name: "Ketosis",
    minHours: 18,
    maxHours: 24,
    description: "Your body is producing ketones. Mental clarity often improves here.",
    color: "#00D4AA",
    icon: "brain",
  },
  {
    name: "Deep Ketosis",
    minHours: 24,
    maxHours: 48,
    description: "Significant ketone production. Autophagy processes are ramping up.",
    color: "#7C5CFC",
    icon: "star",
  },
  {
    name: "Autophagy",
    minHours: 48,
    maxHours: Infinity,
    description: "Cellular cleanup is in full effect. Your body is recycling damaged components.",
    color: "#00B4D8",
    icon: "sparkles",
  },
];

export function getCurrentPhase(hoursElapsed: number): FastingPhase {
  return (
    FASTING_PHASES.find(
      (p) => hoursElapsed >= p.minHours && hoursElapsed < p.maxHours
    ) ?? FASTING_PHASES[FASTING_PHASES.length - 1]
  );
}

export function getPhaseProgress(hoursElapsed: number): number {
  const phase = getCurrentPhase(hoursElapsed);
  if (phase.maxHours === Infinity) return 1;
  const range = phase.maxHours - phase.minHours;
  return Math.min((hoursElapsed - phase.minHours) / range, 1);
}

export const FAST_PRESETS = [
  { label: "12:12", hours: 12, description: "Beginner" },
  { label: "16:8", hours: 16, description: "Popular" },
  { label: "18:6", hours: 18, description: "Intermediate" },
  { label: "20:4", hours: 20, description: "Warrior" },
  { label: "OMAD", hours: 23, description: "One Meal a Day" },
  { label: "36h", hours: 36, description: "Extended" },
  { label: "48h", hours: 48, description: "Extended+" },
  { label: "72h", hours: 72, description: "Autophagy" },
] as const;
