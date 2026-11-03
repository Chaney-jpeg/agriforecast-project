import type { Bi, CropId, Maturity } from '../types';
import { bi } from '../types';

// PLACEHOLDER PARAMETERS. Rough, rounded values to make the prototype run.
// Every number here must be reviewed and replaced with KALRO / extension-office
// recommendations for the target county before real farmers rely on it.

export interface Crop {
  id: CropId;
  name: Bi;
  elevMin: number; // metres
  elevMax: number;
  tMeanMin: number; // acceptable mean temperature window, deg C
  tMeanMax: number;
  maturityDays: Record<Maturity, number>;
  highlandSlowdownPer100m: number; // extra days to maturity per 100 m above 1500 m
}

export const CROPS: Record<CropId, Crop> = {
  maize: {
    id: 'maize', name: bi('Maize', 'Mahindi'),
    elevMin: 0, elevMax: 2400, tMeanMin: 15, tMeanMax: 30,
    maturityDays: { early: 90, medium: 120, late: 150 }, highlandSlowdownPer100m: 4,
  },
  beans: {
    id: 'beans', name: bi('Beans', 'Maharagwe'),
    elevMin: 500, elevMax: 2200, tMeanMin: 15, tMeanMax: 27,
    maturityDays: { early: 70, medium: 85, late: 100 }, highlandSlowdownPer100m: 3,
  },
  potato: {
    id: 'potato', name: bi('Potato', 'Viazi'),
    elevMin: 1200, elevMax: 3000, tMeanMin: 10, tMeanMax: 20,
    maturityDays: { early: 90, medium: 110, late: 130 }, highlandSlowdownPer100m: 0,
  },
  sorghum: {
    id: 'sorghum', name: bi('Sorghum', 'Mtama'),
    elevMin: 0, elevMax: 1800, tMeanMin: 20, tMeanMax: 32,
    maturityDays: { early: 90, medium: 110, late: 130 }, highlandSlowdownPer100m: 3,
  },
};

export const CROP_IDS = Object.keys(CROPS) as CropId[];

export function maturityDays(crop: Crop, variety: Maturity | undefined, elevation: number | undefined): number {
  const base = crop.maturityDays[variety ?? 'medium'];
  const extra = elevation && elevation > 1500 ? ((elevation - 1500) / 100) * crop.highlandSlowdownPer100m : 0;
  return Math.round(base + extra);
}

export function suitability(crop: Crop, elevation: number | undefined, meanTempC: number): { ok: boolean; issues: Bi[] } {
  const issues: Bi[] = [];
  if (elevation != null && (elevation < crop.elevMin || elevation > crop.elevMax)) {
    issues.push(bi(
      `${crop.name.en} is usually grown between about ${crop.elevMin} and ${crop.elevMax} m; this location is at ${Math.round(elevation)} m.`,
      `${crop.name.sw} kwa kawaida hulimwa kati ya mita ${crop.elevMin} na ${crop.elevMax}; eneo hili liko mita ${Math.round(elevation)}.`,
    ));
  }
  if (Number.isFinite(meanTempC) && (meanTempC < crop.tMeanMin || meanTempC > crop.tMeanMax)) {
    issues.push(bi(
      `Average temperature over the next two weeks (${meanTempC.toFixed(1)}°C) is outside the ${crop.tMeanMin}–${crop.tMeanMax}°C range this crop prefers.`,
      `Wastani wa joto wiki mbili zijazo (${meanTempC.toFixed(1)}°C) uko nje ya kiwango cha ${crop.tMeanMin}–${crop.tMeanMax}°C kinachofaa zao hili.`,
    ));
  }
  return { ok: issues.length === 0, issues };
}
