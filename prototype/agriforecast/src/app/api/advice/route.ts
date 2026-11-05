import { NextResponse } from 'next/server';
import { advise } from '../../../lib/advisory';
import { demoWeather, getWeather, type DemoScenario } from '../../../lib/weather';
import type { FarmContext, Topic } from '../../../lib/types';

export const dynamic = 'force-dynamic';

const TOPICS: Topic[] = ['planting', 'disease', 'livestock'];
const SCENARIOS: DemoScenario[] = ['onset', 'dry', 'falsestart', 'humid', 'hot'];
const CROPS = ['maize', 'beans', 'potato', 'sorghum'];
const SOILS = ['sandy', 'loam', 'clay'];
const MATURITY = ['early', 'medium', 'late'];
const SPECIES = ['cattle', 'goat', 'sheep', 'poultry'];
const WATER = ['reliable', 'unreliable', 'far'];
const PASTURE = ['good', 'fair', 'poor'];

const pick = <T extends string>(v: unknown, allowed: string[]): T | undefined =>
  typeof v === 'string' && allowed.includes(v) ? (v as T) : undefined;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const topic = pick<Topic>(body.topic, TOPICS);
  const c = (body.context ?? {}) as Record<string, unknown>;
  const lat = Number(c.lat);
  const lon = Number(c.lon);
  if (!topic) return NextResponse.json({ error: 'Unknown topic' }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'A valid location is required' }, { status: 400 });
  }

  const plantingDateRaw = typeof c.plantingDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.plantingDate) ? c.plantingDate : undefined;
  // Validate calendar correctness (e.g. reject 2026-02-30).
  const plantingDate = plantingDateRaw && !isNaN(Date.parse(plantingDateRaw + 'T00:00:00Z')) ? plantingDateRaw : undefined;
  const ctx: FarmContext = {
    lat, lon,
    elevation: Number.isFinite(Number(c.elevation)) && c.elevation !== '' && c.elevation != null ? Number(c.elevation) : undefined,
    crop: pick(c.crop, CROPS),
    plantingDate,
    soil: pick(c.soil, SOILS),
    variety: pick(c.variety, MATURITY),
    species: pick(c.species, SPECIES),
    shade: typeof c.shade === 'boolean' ? c.shade : undefined,
    waterSource: pick(c.waterSource, WATER),
    pasture: pick(c.pasture, PASTURE),
  };

  const scenario = pick<DemoScenario>(body.demo, SCENARIOS);
  let weather;
  try {
    weather = scenario ? demoWeather(scenario, ctx.elevation ?? 1800) : await getWeather(lat, lon);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'weather_unavailable', detail: message }, { status: 502 });
  }

  try {
    const advice = advise(topic, ctx, weather);

    // Keep the response small for low-bandwidth users: send only what the chart needs.
    const horizon = weather.days.slice(Math.max(0, weather.todayIndex - 7), weather.todayIndex + 14);
    const outsideKenya = lat < -4.9 || lat > 5.5 || lon < 33.8 || lon > 42;
    return NextResponse.json({
      advice,
      weather: {
        source: weather.source,
        elevation: weather.elevation,
        fetchedAt: weather.fetchedAt,
        todayDate: weather.days[weather.todayIndex]?.date,
        days: horizon.map((d) => ({ date: d.date, rain: Math.round(d.rain * 10) / 10, tmax: Math.round(d.tmax * 10) / 10, tmin: Math.round(d.tmin * 10) / 10, isForecast: d.isForecast })),
      },
      outsideKenya,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'advice_error', detail: message }, { status: 500 });
  }
}
