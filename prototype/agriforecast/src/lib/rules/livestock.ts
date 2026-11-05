import type { Advice, Bi, FarmContext, Level, MissingInput, Species, WeatherBundle } from '../types';
import { bi, RULE_VERSION } from '../types';
import { nextDays, pastDays, round, sum, toConfidence } from './util';

// Placeholder heat-stress thresholds on the Temperature-Humidity Index (THI).
// Cattle values follow commonly cited bands; goat/sheep/poultry values are rough
// and must be reviewed with a livestock specialist before real use.
const THI_BANDS: Record<Exclude<Species, 'poultry'>, [number, number, number]> = {
  cattle: [72, 79, 89], // mild, moderate, severe start
  goat: [78, 84, 90],
  sheep: [78, 84, 90],
};
// Poultry: use daily maximum temperature instead (deg C).
const POULTRY_TMAX: [number, number, number] = [28, 32, 35];

const SPECIES_NAME: Record<Species, Bi> = {
  cattle: bi('cattle', 'ng\'ombe'),
  goat: bi('goats', 'mbuzi'),
  sheep: bi('sheep', 'kondoo'),
  poultry: bi('poultry', 'kuku'),
};

export function livestockAdvice(ctx: FarmContext, w: WeatherBundle): Advice {
  const sources = ['Open-Meteo temperature, humidity and rainfall', 'Temperature-Humidity Index (THI)', 'NDMA drought bulletins and KMD outlooks (check locally)'];
  const assumptions: Bi[] = [
    bi('Heat thresholds are rough placeholders to be reviewed with a livestock specialist.', 'Vigezo vya joto ni vya majaribio na vinapaswa kukaguliwa na mtaalamu wa mifugo.'),
    bi('The rainfall figures below are not compared with a local normal yet, so drought signals are indicative only.', 'Kiasi cha mvua hakijalinganishwa na wastani wa eneo, kwa hiyo ishara za ukame ni za kukadiria tu.'),
  ];
  if (w.source === 'demo') assumptions.unshift(bi('DEMO weather data is being used.', 'Data ya hali ya hewa ni ya MFANO.'));

  if (!ctx.species) {
    return {
      topic: 'livestock', level: 'info',
      headline: bi('Choose an animal species', 'Chagua aina ya mnyama'),
      reasons: [bi('Cattle, goats, sheep and poultry react differently to heat.', 'Ng\'ombe, mbuzi, kondoo na kuku huathirika tofauti na joto.')],
      actions: [], confidence: 'low', confidenceNote: bi('No species selected.', 'Hakuna aina ya mnyama iliyochaguliwa.'),
      assumptions, missing: [{ field: 'species', why: bi('Heat tolerance differs by species.', 'Uvumilivu wa joto hutofautiana kwa aina ya mnyama.') }],
      wouldChange: [], ruleVersion: RULE_VERSION, sources,
    };
  }

  const species = ctx.species;
  const week = nextDays(w, 7);
  const peakTemp = Math.max(...week.map((d) => d.tmax));
  // Guard against empty array (all maxThi NaN when humidity data is absent):
  // Math.max() with no args returns -Infinity, which would silently report no
  // heat stress regardless of temperature. Fall back to NaN so the THI path
  // explicitly produces idx = 0 only when temperature is also below threshold.
  const thiValues = week.map((d) => d.maxThi).filter(Number.isFinite);
  const peakThi = thiValues.length > 0 ? Math.max(...thiValues) : NaN;

  let idx: number; // 0 = none, 1 mild, 2 moderate, 3 severe
  let measure: Bi;
  if (species === 'poultry') {
    idx = peakTemp >= POULTRY_TMAX[2] ? 3 : peakTemp >= POULTRY_TMAX[1] ? 2 : peakTemp >= POULTRY_TMAX[0] ? 1 : 0;
    measure = bi(`Hottest forecast day this week: ${round(peakTemp, 1)}°C.`, `Siku yenye joto zaidi wiki hii: ${round(peakTemp, 1)}°C.`);
  } else {
    const b = THI_BANDS[species];
    // If peakThi is NaN (no humidity data), fall back to temperature-only
    // assessment using the moderate tmax band so we err on the side of caution.
    if (!Number.isFinite(peakThi)) {
      idx = peakTemp >= 35 ? 3 : peakTemp >= 30 ? 2 : peakTemp >= 26 ? 1 : 0;
      measure = bi(
        `Highest forecast temperature this week: ${round(peakTemp, 1)}°C (humidity data unavailable; THI could not be computed).`,
        `Halijoto ya juu zaidi wiki hii: ${round(peakTemp, 1)}°C (data ya unyevu haipo; THI haijaweza kukokotolewa).`,
      );
    } else {
      idx = peakThi >= b[2] ? 3 : peakThi >= b[1] ? 2 : peakThi >= b[0] ? 1 : 0;
      measure = bi(`Highest forecast heat index (THI) this week: ${round(peakThi)}; hottest day ${round(peakTemp, 1)}°C.`, `Kiwango cha juu cha joto (THI) wiki hii: ${round(peakThi)}; siku yenye joto zaidi ${round(peakTemp, 1)}°C.`);
    }
  }

  const levels: Level[] = ['low', 'low', 'moderate', 'severe'];
  const level = levels[idx];
  const name = SPECIES_NAME[species];
  const headline =
    idx === 0 ? bi(`Heat stress risk for ${name.en} looks low this week`, `Hatari ya joto kwa ${name.sw} inaonekana ndogo wiki hii`)
    : idx === 1 ? bi(`Mild heat stress possible for ${name.en}`, `Joto kidogo linaweza kuathiri ${name.sw}`)
    : idx === 2 ? bi(`Moderate heat stress likely for ${name.en}`, `Joto la wastani linaweza kuathiri ${name.sw}`)
    : bi(`Severe heat stress possible for ${name.en}: act early`, `Joto kali linaweza kuathiri ${name.sw}: chukua hatua mapema`);

  const actions: Bi[] = [];
  if (idx >= 1) {
    actions.push(bi('Provide shade and unrestricted clean water. Water needs rise in hot weather.', 'Toa kivuli na maji safi yasiyo na kikomo. Mahitaji ya maji huongezeka wakati wa joto.'));
    actions.push(bi('Move grazing or feeding to early morning and evening; avoid moving or handling animals in the midday heat.', 'Hamisha malisho au ulishaji hadi asubuhi na jioni; epuka kuhamisha au kushika wanyama wakati wa joto la mchana.'));
  }
  if (idx >= 2) actions.push(bi('Watch for heavy panting, drooling, reduced feeding or milk drop, and call a vet or animal health officer if signs are severe.', 'Angalia kuhema sana, kutoa udenda, kupungua kula au maziwa, na mwite daktari wa mifugo ikiwa dalili ni kali.'));
  if (idx === 0) actions.push(bi('Keep water points clean and working, and keep checking the forecast.', 'Weka sehemu za maji safi na zinazofanya kazi, na endelea kufuatilia utabiri.'));

  // Drought, water and pasture signals from rainfall.
  const rain30 = sum(pastDays(w, 30).map((d) => d.rain));
  const rain14next = sum(nextDays(w, 14).map((d) => d.rain));
  const reasons: Bi[] = [
    measure,
    bi(`Rain in the last 30 days: ${round(rain30)} mm. Forecast for the next 14 days: ${round(rain14next)} mm.`, `Mvua siku 30 zilizopita: mm ${round(rain30)}. Utabiri wa siku 14 zijazo: mm ${round(rain14next)}.`),
  ];

  const dryWatch = rain30 < 30 && rain14next < 20;
  let finalLevel = level;
  if (dryWatch) {
    reasons.push(bi('Recent and forecast rain are both low. Water and pasture could become short.', 'Mvua ya hivi karibuni na inayotabiriwa ni ndogo. Maji na malisho vinaweza kupungua.'));
    actions.push(bi('Plan water and feed now: check water points, consider destocking weaker animals early, and set aside fodder.', 'Panga maji na malisho mapema: kagua vyanzo vya maji, fikiria kuuza wanyama dhaifu mapema, na hifadhi nyasi kavu.'));
    actions.push(bi('Check NDMA and county drought bulletins for your area.', 'Angalia taarifa za ukame za NDMA na kaunti yako.'));
    if (finalLevel === 'low') finalLevel = 'moderate';
  }
  if (ctx.pasture === 'poor' && dryWatch) {
    reasons.push(bi('You reported poor pasture, which adds to the drought concern.', 'Umeripoti malisho duni, jambo linaloongeza wasiwasi wa ukame.'));
    finalLevel = 'severe';
  }
  if (ctx.waterSource === 'far' || ctx.waterSource === 'unreliable') {
    actions.push(bi('Your water source is far or unreliable: arrange backup storage or a second source before dry days begin.', 'Chanzo chako cha maji ni mbali au si cha uhakika: andaa hifadhi mbadala au chanzo cha pili kabla ya siku za ukame.'));
  }
  if (ctx.shade === false && idx >= 1) {
    actions.unshift(bi('You reported no shade: temporary shade (nets, branches, roofing) is the quickest heat protection.', 'Umeripoti hakuna kivuli: kivuli cha muda (wavu, matawi, paa) ndicho kinga ya haraka dhidi ya joto.'));
  }

  const missing: MissingInput[] = [];
  let penalty = 1; // heat and drought rules are coarse
  if (ctx.shade === undefined) { missing.push({ field: 'shade', why: bi('Shade changes how much heat animals feel.', 'Kivuli hubadilisha kiasi cha joto wanyama wanachohisi.') }); penalty += 0.25; }
  if (!ctx.waterSource) { missing.push({ field: 'waterSource', why: bi('Water access decides how well animals cope with heat and dry spells.', 'Upatikanaji wa maji huamua jinsi wanyama wanavyostahimili joto na ukame.') }); penalty += 0.25; }
  if (!ctx.pasture) { missing.push({ field: 'pasture', why: bi('Your own view of pasture condition corrects what rainfall alone suggests.', 'Maoni yako kuhusu hali ya malisho yanarekebisha kile mvua pekee inachoonyesha.') }); penalty += 0.5; }
  if (w.source === 'demo') penalty += 2;

  return {
    topic: 'livestock', level: finalLevel, headline, reasons, actions,
    confidence: toConfidence(3 - penalty),
    confidenceNote: bi(
      'Heat risk comes from forecast temperature and humidity; drought signals use recent rain only, not satellite vegetation yet.',
      'Hatari ya joto inatokana na utabiri wa joto na unyevu; ishara za ukame zinatumia mvua ya hivi karibuni pekee, bado hazitumii picha za setilaiti za uoto.',
    ),
    assumptions, missing,
    wouldChange: [
      bi('Herd size, breed, age, lactation and body condition would all change water and heat needs.', 'Idadi ya mifugo, aina, umri, kunyonyesha na hali ya mwili vingebadilisha mahitaji ya maji na joto.'),
      bi('Observed pasture condition and NDVI satellite data (planned) would sharpen the drought signal.', 'Hali ya malisho uliyoona na data ya NDVI ya setilaiti (inayopangwa) ingeboresha ishara ya ukame.'),
    ],
    ruleVersion: RULE_VERSION, sources,
  };
}
