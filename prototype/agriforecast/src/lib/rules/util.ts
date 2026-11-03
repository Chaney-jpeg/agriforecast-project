import type { Confidence, DayWeather, WeatherBundle } from '../types';

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : NaN);
export const round = (n: number, d = 0) => +n.toFixed(d);

/** Observed days before today, most recent last. */
export function pastDays(w: WeatherBundle, n: number): DayWeather[] {
  return w.days.slice(Math.max(0, w.todayIndex - n), w.todayIndex);
}

/** Today and following days. */
export function nextDays(w: WeatherBundle, n: number): DayWeather[] {
  return w.days.slice(w.todayIndex, w.todayIndex + n);
}

export function longestDrySpell(days: DayWeather[], dryBelowMm = 1): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (d.rain < dryBelowMm) {
      run += 1;
      best = Math.max(best, run);
    } else run = 0;
  }
  return best;
}

export const meanTemp = (days: DayWeather[]) => mean(days.map((d) => (d.tmax + d.tmin) / 2).filter(Number.isFinite));

/** Confidence from a score. High is rare by design: weather is never certain. */
export function toConfidence(score: number): Confidence {
  if (score >= 2.5) return 'high';
  if (score >= 1.5) return 'medium';
  return 'low';
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso + 'T00:00:00Z');
  const b = Date.parse(toIso + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}
