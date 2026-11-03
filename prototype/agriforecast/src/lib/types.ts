// Shared types. The advisory engine is pure: (FarmContext, WeatherBundle) -> Advice.

export type Lang = 'en' | 'sw';
export interface Bi { en: string; sw: string }
export const bi = (en: string, sw: string): Bi => ({ en, sw });

export type Confidence = 'low' | 'medium' | 'high';
export type Topic = 'planting' | 'disease' | 'livestock';
export type CropId = 'maize' | 'beans' | 'potato' | 'sorghum';
export type Soil = 'sandy' | 'loam' | 'clay';
export type Maturity = 'early' | 'medium' | 'late';
export type Species = 'cattle' | 'goat' | 'sheep' | 'poultry';
export type WaterSource = 'reliable' | 'unreliable' | 'far';
export type PastureCondition = 'good' | 'fair' | 'poor';

export interface FarmContext {
  lat: number;
  lon: number;
  elevation?: number; // metres; filled from the weather provider when absent
  crop?: CropId;
  plantingDate?: string; // YYYY-MM-DD, absent = not planted yet
  soil?: Soil;
  variety?: Maturity;
  species?: Species;
  shade?: boolean;
  waterSource?: WaterSource;
  pasture?: PastureCondition;
}

export interface DayWeather {
  date: string;
  isForecast: boolean; // today and later
  rain: number; // mm
  tmax: number;
  tmin: number;
  hoursRh90: number; // hours in the day with relative humidity >= 90%
  maxThi: number; // highest hourly temperature-humidity index
}

export interface WeatherBundle {
  source: 'open-meteo' | 'demo';
  cell: string; // grid cell used for caching, ~10 km
  elevation: number | null;
  todayIndex: number;
  days: DayWeather[];
  fetchedAt: string;
}

export type Level = 'go' | 'prepare' | 'wait' | 'caution' | 'info' | 'low' | 'moderate' | 'high' | 'severe';

export interface MissingInput {
  field: 'crop' | 'plantingDate' | 'soil' | 'variety' | 'species' | 'shade' | 'waterSource' | 'pasture';
  why: Bi;
}

export interface Advice {
  topic: Topic;
  level: Level;
  headline: Bi;
  reasons: Bi[];
  actions: Bi[];
  confidence: Confidence;
  confidenceNote: Bi;
  assumptions: Bi[];
  missing: MissingInput[];
  wouldChange: Bi[];
  ruleVersion: string;
  sources: string[];
}

export const RULE_VERSION = 'prototype-0.1 (placeholder parameters, not yet validated by KALRO)';
