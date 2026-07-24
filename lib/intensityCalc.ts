const SPORT_FRACTIONS: Record<string, number> = {
  football: 0.70, tennis: 0.80, netball: 0.70, volleyball: 0.65,
  golf: 0.50, turbo_touch: 0.78, padel: 0.80, touch_rugby: 0.75,
  basketball: 0.70, cricket: 0.55, badminton: 0.75, rugby: 0.75,
  hockey: 0.72, frisbee: 0.70, table_tennis: 0.70,
  boxing: 0.65, jump_rope: 0.90, dance: 0.80, skateboard: 0.70,
  rock_climbing: 0.75, trampoline: 0.75, martial_arts: 0.75,
  axe_throwing: 0.50, kapa_haka: 0.70, juggling_act: 0.70,
};

const WATER_FRACTIONS: Record<string, number> = {
  kayak: 0.90, rowing: 0.90, sup: 0.88, waka_ama: 0.90,
  surf: 0.75, bodysurfing: 0.80, body_boarding: 0.78,
  windsurfing: 0.80, kitesurfing: 0.80, wakeboarding: 0.75,
  waterskiing: 0.75, sailing: 0.70, diving: 0.85,
  spear_fishing: 0.75, fishing: 0.40, rafting: 0.70,
  canyoning: 0.65, coasteering: 0.75,
};

function getActiveFraction(exerciseType: string, subType: string): number {
  switch (exerciseType) {
    case 'run': return 0.93;
    case 'swim': return 0.95;
    case 'bike': return 0.93;
    case 'walk': return 0.85;
    case 'stretch': return 0.80;
    case 'hiit': return 0.70;
    case 'solo_fitness': return 0.60;
    case 'snow': return 0.75;
    case 'water': return WATER_FRACTIONS[subType] ?? 0.80;
    case 'sport': return SPORT_FRACTIONS[subType] ?? 0.70;
    default: return 0.75;
  }
}

export function effortMultiplier(effort: number | null): number {
  if (!effort || effort <= 3) return 0.5;
  if (effort <= 6) return 1.0;
  return 2.0;
}

export function suggestActivePercent(exerciseType: string, subType: string): number {
  return Math.round(getActiveFraction(exerciseType, subType) * 100);
}

export function calcIntensityMins(
  effort: number | null,
  durationMins: number,
  activePercent: number,
): number {
  return Math.round(durationMins * (activePercent / 100) * effortMultiplier(effort));
}

export function backCalcActivePercent(
  intensityMins: number,
  effort: number | null,
  durationMins: number,
): number {
  if (durationMins <= 0) return 75;
  const pct = Math.round((intensityMins / (durationMins * effortMultiplier(effort))) * 100);
  return Math.max(0, Math.min(100, pct));
}
