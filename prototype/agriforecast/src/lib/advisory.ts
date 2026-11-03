import type { Advice, FarmContext, Topic, WeatherBundle } from './types';
import { plantingAdvice } from './rules/planting';
import { diseaseAdvice } from './rules/disease';
import { livestockAdvice } from './rules/livestock';

/** Pure function: same inputs always give the same advice, so results are auditable. */
export function advise(topic: Topic, ctx: FarmContext, weather: WeatherBundle): Advice {
  const filled: FarmContext = { ...ctx, elevation: ctx.elevation ?? weather.elevation ?? undefined };
  switch (topic) {
    case 'planting': return plantingAdvice(filled, weather);
    case 'disease': return diseaseAdvice(filled, weather);
    case 'livestock': return livestockAdvice(filled, weather);
  }
}
