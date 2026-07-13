import type { Activity, ExerciseType, RunType } from '@/types';
import { EXERCISE_TYPE_LABELS, REST_BREAK_RUN_TYPES } from '@/types';

export const DISTANCE_PB_KM = [0.1, 0.2, 0.4, 0.8, 1, 1.6, 2, 3, 5, 10, 15, 20, 21.1, 25, 30, 40, 42.2, 50];
export const DISTANCE_LABELS: Record<number, string> = {
  0.1: '100m', 0.2: '200m', 0.4: '400m', 0.8: '800m', 1: '1km',
  1.6: '1.6km', 2: '2km', 3: '3km', 5: '5km', 10: '10km',
  15: '15km', 20: '20km', 21.1: 'Half Marathon', 25: '25km',
  30: '30km', 40: '40km', 42.2: 'Marathon', 50: '50km',
};

type PriorFields = Pick<Activity, 'exercise_type' | 'distance_km' | 'pace_min_km' | 'duration_minutes' | 'run_type'>;
type NewFields = Pick<Activity, 'exercise_type' | 'distance_km' | 'pace_min_km' | 'duration_minutes' | 'run_type'>;

const hasRestBreaks = (a: { run_type?: RunType }) => !!a.run_type && REST_BREAK_RUN_TYPES.includes(a.run_type);

/**
 * Auto-detected "new PB" reasons for an activity, comparing it against every
 * PRIOR activity (the new one must not be included in `prior`). Mirrors the
 * PB categories shown on the PBs page: fastest pace at a race distance,
 * longest distance for the exercise type, longest duration, and best pace
 * for the exercise type. Returns an empty array if nothing qualifies.
 *
 * Pace-based categories exclude interval-style runs (sprint reps, hill reps, long
 * intervals) on both sides of the comparison — their total elapsed pace is diluted by
 * scripted rest between reps, so it isn't a real continuous-effort pace either way.
 */
export function detectAutoPBs(activity: NewFields, prior: PriorFields[]): string[] {
  const reasons: string[] = [];
  const typeLabel = EXERCISE_TYPE_LABELS[activity.exercise_type as ExerciseType] ?? activity.exercise_type;
  const activityHasRestBreaks = hasRestBreaks(activity);

  // Fastest pace at a recognised race distance (within 2% — matches the PBs page).
  if (activity.distance_km && activity.pace_min_km && !activityHasRestBreaks) {
    const bucket = DISTANCE_PB_KM.find(km => Math.abs(activity.distance_km! - km) / km < 0.02);
    if (bucket) {
      const priorPaces = prior
        .filter(a => a.distance_km && a.pace_min_km && !hasRestBreaks(a) && Math.abs(a.distance_km - bucket) / bucket < 0.02)
        .map(a => a.pace_min_km!);
      if (priorPaces.length > 0 && activity.pace_min_km < Math.min(...priorPaces)) {
        reasons.push(`Fastest ${DISTANCE_LABELS[bucket]}`);
      }
    }
  }

  const sameType = prior.filter(a => a.exercise_type === activity.exercise_type);

  // Longest distance for this exercise type — unaffected by rest breaks, the distance covered is real.
  if (activity.distance_km) {
    const priorDists = sameType.filter(a => a.distance_km).map(a => a.distance_km!);
    if (priorDists.length > 0 && activity.distance_km > Math.max(...priorDists)) {
      reasons.push(`Longest ${typeLabel} distance`);
    }
  }

  // Longest duration for this exercise type — also unaffected by rest breaks.
  if (activity.duration_minutes) {
    const priorDurs = sameType.map(a => a.duration_minutes).filter((d): d is number => d != null);
    if (priorDurs.length > 0 && activity.duration_minutes > Math.max(...priorDurs)) {
      reasons.push(`Longest ${typeLabel} session`);
    }
  }

  // Best (fastest) pace for this exercise type overall.
  if (activity.pace_min_km && !activityHasRestBreaks) {
    const priorPaces = sameType.filter(a => a.pace_min_km && !hasRestBreaks(a)).map(a => a.pace_min_km!);
    if (priorPaces.length > 0 && activity.pace_min_km < Math.min(...priorPaces)) {
      reasons.push(`Best ${typeLabel} pace`);
    }
  }

  return reasons;
}
