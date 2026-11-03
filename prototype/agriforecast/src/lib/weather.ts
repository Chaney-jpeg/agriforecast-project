import type { DayWeather, WeatherBundle } from './types';

const CELL = 0.1; // degrees, about 11 km. Farmers in the same cell share one forecast call.
const TTL_MS = 3 * 60 * 60 * 1000;
const PAST_DAYS = 30;
const FORECAST_DAYS = 14;

const cache = new Map<string, { at: number; bundle: WeatherBundle }>();

export function cellCentre(lat: number, lon: number): { lat: number; lon: number; key: string } {
  const clat = Math.round(lat / CELL) * CELL;
  const clon = Math.round(lon / CELL) * CELL;
  return { lat: +clat.toFixed(1), lon: +clon.toFixed(1), key: `${clat.toFixed(1)},${clon.toFixed(1)}` };
}

/** Temperature-Humidity Index (Celsius input). Common livestock form. */
export function thi(tC: number, rh: number): number {
  return 1.8 * tC + 32 - (0.55 - 0.0055 * rh) * (1.8 * tC - 26);
}

interface OpenMeteoResponse {
  elevation?: number;
  utc_offset_seconds?: number;
  daily: {
    time: string[];
    precipitation_sum: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
  };
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    relative_humidity_2m: (number | null)[];
  };
}

export function normaliseOpenMeteo(raw: OpenMeteoResponse, cell: string, now = Date.now()): WeatherBundle {
  const offset = (raw.utc_offset_seconds ?? 0) * 1000;
  const today = new Date(now + offset).toISOString().slice(0, 10);

  const byDay = new Map<string, { rh90: number; maxThi: number }>();
  raw.hourly.time.forEach((t, i) => {
    const day = t.slice(0, 10);
    const temp = raw.hourly.temperature_2m[i];
    const rh = raw.hourly.relative_humidity_2m[i];
    if (temp == null || rh == null) return;
    const entry = byDay.get(day) ?? { rh90: 0, maxThi: -Infinity };
    if (rh >= 90) entry.rh90 += 1;
    entry.maxThi = Math.max(entry.maxThi, thi(temp, rh));
    byDay.set(day, entry);
  });

  const days: DayWeather[] = raw.daily.time.map((date, i) => {
    const h = byDay.get(date);
    return {
      date,
      isForecast: date >= today,
      rain: raw.daily.precipitation_sum[i] ?? 0,
      tmax: raw.daily.temperature_2m_max[i] ?? NaN,
      tmin: raw.daily.temperature_2m_min[i] ?? NaN,
      hoursRh90: h?.rh90 ?? 0,
      maxThi: h && Number.isFinite(h.maxThi) ? h.maxThi : NaN,
    };
  });

  const todayIndex = Math.max(0, days.findIndex((d) => d.date >= today));
  return {
    source: 'open-meteo',
    cell,
    elevation: typeof raw.elevation === 'number' ? raw.elevation : null,
    todayIndex,
    days,
    fetchedAt: new Date(now).toISOString(),
  };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherBundle> {
  const c = cellCentre(lat, lon);
  const hit = cache.get(c.key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.bundle;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(c.lat));
  url.searchParams.set('longitude', String(c.lon));
  url.searchParams.set('daily', 'precipitation_sum,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m');
  url.searchParams.set('past_days', String(PAST_DAYS));
  url.searchParams.set('forecast_days', String(FORECAST_DAYS));
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Weather provider returned ${res.status}`);
  const bundle = normaliseOpenMeteo((await res.json()) as OpenMeteoResponse, c.key);
  cache.set(c.key, { at: Date.now(), bundle });
  return bundle;
}

// ---------------------------------------------------------------------------
// Demo weather: deterministic scenarios so the prototype and tests work offline.
// ---------------------------------------------------------------------------
export type DemoScenario = 'onset' | 'dry' | 'falsestart' | 'humid' | 'hot';

export function demoWeather(scenario: DemoScenario, elevation = 1800, now = Date.now()): WeatherBundle {
  const days: DayWeather[] = [];
  const todayIndex = PAST_DAYS;
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - PAST_DAYS);
  const lapse = (1800 - elevation) / 1000 * 6; // warmer when lower, cooler when higher

  for (let i = 0; i < PAST_DAYS + FORECAST_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const rel = i - todayIndex; // negative = past
    let rain = 0;
    let tmax = 25 + lapse;
    let tmin = 12 + lapse;
    let hoursRh90 = 2;

    switch (scenario) {
      case 'onset':
        rain = rel < -9 ? 0 : rel < 0 ? (rel % 2 === 0 ? 6 : 1) : rel < 9 ? (rel % 3 === 1 ? 0 : 7) : 2;
        break;
      case 'dry':
        rain = rel % 11 === 0 ? 1 : 0;
        break;
      case 'falsestart':
        rain = rel < 0 ? (rel > -8 ? 5 : 0) : rel < 10 ? 0 : 8;
        break;
      case 'humid':
        rain = rel < 0 ? 4 : rel < 8 ? 6 : 3;
        tmax = 22 + lapse;
        tmin = 14 + lapse; // mild humid nights, the kind that favour late blight
        hoursRh90 = 10;
        break;
      case 'hot':
        rain = rel % 9 === 0 ? 2 : 0;
        tmax = 34 + lapse;
        tmin = 20 + lapse;
        hoursRh90 = 1;
        break;
    }
    const rhAtPeak = scenario === 'humid' ? 80 : scenario === 'hot' ? 40 : 55;
    days.push({
      date: d.toISOString().slice(0, 10),
      isForecast: rel >= 0,
      rain,
      tmax,
      tmin,
      hoursRh90,
      maxThi: thi(tmax, rhAtPeak),
    });
  }
  return { source: 'demo', cell: 'demo', elevation, todayIndex, days, fetchedAt: new Date(now).toISOString() };
}
