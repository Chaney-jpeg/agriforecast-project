import test from 'node:test';
import assert from 'node:assert/strict';
import { advise } from '../src/lib/advisory';
import { demoWeather, normaliseOpenMeteo, thi, cellCentre } from '../src/lib/weather';
import type { FarmContext } from '../src/lib/types';

const base: FarmContext = { lat: -0.3, lon: 36.08 };

test('planting: onset scenario opens the window for maize', () => {
  const a = advise('planting', { ...base, crop: 'maize', soil: 'loam', variety: 'medium' }, demoWeather('onset', 1800));
  assert.equal(a.level, 'go');
  assert.equal(a.missing.length, 0);
});

test('planting: dry scenario says wait', () => {
  const a = advise('planting', { ...base, crop: 'maize', soil: 'loam', variety: 'medium' }, demoWeather('dry', 1800));
  assert.equal(a.level, 'wait');
});

test('planting: early rain then dry spell is flagged as false-start risk', () => {
  const a = advise('planting', { ...base, crop: 'maize', soil: 'loam', variety: 'medium' }, demoWeather('falsestart', 1800));
  assert.equal(a.level, 'caution');
});

test('planting: missing context is reported and lowers confidence', () => {
  const full = advise('planting', { ...base, crop: 'maize', soil: 'loam', variety: 'medium' }, demoWeather('onset', 1800));
  const partial = advise('planting', { ...base, crop: 'maize' }, demoWeather('onset', 1800));
  const fields = partial.missing.map((m) => m.field).sort();
  assert.deepEqual(fields, ['soil', 'variety']);
  const rank = { low: 0, medium: 1, high: 2 } as const;
  assert.ok(rank[partial.confidence] <= rank[full.confidence]);
});

test('planting: demo data can never give high confidence', () => {
  const a = advise('planting', { ...base, crop: 'maize', soil: 'loam', variety: 'medium' }, demoWeather('onset', 1800));
  assert.notEqual(a.confidence, 'high');
  assert.ok(a.assumptions.some((s) => s.en.includes('DEMO')));
});

test('planting: no crop asks for one rather than guessing', () => {
  const a = advise('planting', base, demoWeather('onset', 1800));
  assert.equal(a.level, 'info');
  assert.equal(a.missing[0].field, 'crop');
  assert.equal(a.confidence, 'low');
});

test('planting: crop outside its elevation range is qualified', () => {
  const a = advise('planting', { ...base, crop: 'potato', soil: 'loam', variety: 'medium' }, demoWeather('onset', 600));
  assert.notEqual(a.level, 'go');
  assert.ok(a.reasons.some((r) => r.en.includes('usually grown between')));
});

test('planting: planted long ago flags a date/variety check', () => {
  const w = demoWeather('onset', 1800);
  const old = new Date(Date.parse(w.days[w.todayIndex].date) - 400 * 86400000).toISOString().slice(0, 10);
  const a = advise('planting', { ...base, crop: 'maize', plantingDate: old, variety: 'medium' }, w);
  assert.equal(a.level, 'caution');
  assert.ok(a.headline.en.includes('Check the planting date'));
});

test('planting: dry spell during flowering triggers caution', () => {
  const w = demoWeather('dry', 1800);
  // medium maize at 1800 m matures in ~132 days; flowering is ~40-65% of that
  const d = new Date(Date.parse(w.days[w.todayIndex].date) - 65 * 86400000).toISOString().slice(0, 10);
  const a = advise('planting', { ...base, crop: 'maize', plantingDate: d, variety: 'medium', soil: 'loam' }, w);
  assert.equal(a.level, 'caution');
  assert.ok(a.headline.en.includes('sensitive stage'));
});

test('disease: humid scenario is high for potato late blight; dry is low', () => {
  const hi = advise('disease', { ...base, crop: 'potato' }, demoWeather('humid', 2200));
  assert.equal(hi.level, 'high');
  const lo = advise('disease', { ...base, crop: 'potato' }, demoWeather('dry', 2200));
  assert.equal(lo.level, 'low');
});

test('disease: wording says favourable conditions, not infection', () => {
  const a = advise('disease', { ...base, crop: 'potato' }, demoWeather('humid', 2200));
  assert.ok(a.assumptions.some((s) => s.en.includes('do not confirm infection')));
});

test('livestock: hot scenario raises heat stress for cattle', () => {
  const a = advise('livestock', { ...base, species: 'cattle' }, demoWeather('hot', 1200));
  assert.ok(['moderate', 'severe'].includes(a.level));
  assert.ok(a.actions.length > 0);
});

test('livestock: poor pasture plus dry weather escalates to severe and asks missing questions', () => {
  const w = demoWeather('dry', 1200);
  const a = advise('livestock', { ...base, species: 'goat', pasture: 'poor' }, w);
  assert.equal(a.level, 'severe');
  assert.ok(a.missing.some((m) => m.field === 'waterSource'));
});

test('livestock: no species asks for one', () => {
  const a = advise('livestock', base, demoWeather('hot', 1200));
  assert.equal(a.missing[0].field, 'species');
});

test('every advice item is bilingual and structured', () => {
  const w = demoWeather('onset', 1800);
  for (const topic of ['planting', 'disease', 'livestock'] as const) {
    const a = advise(topic, { ...base, crop: 'maize', species: 'cattle' }, w);
    assert.ok(a.headline.en && a.headline.sw);
    assert.ok(a.reasons.every((r) => r.en && r.sw));
    assert.ok(a.assumptions.every((r) => r.en && r.sw));
    assert.ok(['low', 'medium', 'high'].includes(a.confidence));
    assert.ok(a.ruleVersion.length > 0);
  }
});

test('thi increases with temperature and humidity', () => {
  assert.ok(thi(30, 80) > thi(30, 40));
  assert.ok(thi(34, 60) > thi(28, 60));
});

test('grid cell groups nearby farms to one cache key', () => {
  assert.equal(cellCentre(-0.301, 36.081).key, cellCentre(-0.299, 36.079).key);
  assert.notEqual(cellCentre(-0.3, 36.08).key, cellCentre(-0.5, 36.08).key);
});

test('open-meteo normalisation computes humid hours and THI', () => {
  const times: string[] = [];
  const temps: number[] = [];
  const rhs: number[] = [];
  for (let h = 0; h < 24; h++) {
    times.push(`2026-10-09T${String(h).padStart(2, '0')}:00`);
    temps.push(h >= 12 && h <= 16 ? 33 : 20);
    rhs.push(h < 8 ? 95 : 50);
  }
  const b = normaliseOpenMeteo(
    {
      elevation: 1850,
      utc_offset_seconds: 10800,
      daily: { time: ['2026-10-09'], precipitation_sum: [3], temperature_2m_max: [33], temperature_2m_min: [20] },
      hourly: { time: times, temperature_2m: temps, relative_humidity_2m: rhs },
    },
    'x',
    Date.parse('2026-10-09T09:00:00Z'),
  );
  assert.equal(b.elevation, 1850);
  assert.equal(b.days[0].hoursRh90, 8);
  assert.ok(b.days[0].maxThi > 80);
  assert.equal(b.days[0].isForecast, true);
});
