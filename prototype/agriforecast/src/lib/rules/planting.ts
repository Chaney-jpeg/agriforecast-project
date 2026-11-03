import type { Advice, Bi, FarmContext, Level, MissingInput, WeatherBundle } from '../types';
import { bi, RULE_VERSION } from '../types';
import { CROPS, CROP_IDS, maturityDays, suitability } from './crops';
import { daysBetween, longestDrySpell, meanTemp, nextDays, pastDays, round, sum, toConfidence } from './util';

const SOURCES = [
  'Open-Meteo forecast and recent observations',
  'KALRO crop recommendations (to be integrated and validated)',
];

// Placeholder thresholds. Tune per county with KALRO / KMD guidance.
const ONSET_PAST7_MM = 15;
const ONSET_NEXT7_MM = 20;
const WATERLOG_NEXT7_MM = 120;

export function plantingAdvice(ctx: FarmContext, w: WeatherBundle, todayIso?: string): Advice {
  const today = todayIso ?? w.days[w.todayIndex]?.date ?? new Date().toISOString().slice(0, 10);
  const elevation = ctx.elevation ?? w.elevation ?? undefined;
  const next14 = nextDays(w, 14);
  const t14 = meanTemp(next14);

  const assumptions: Bi[] = [
    bi(
      `Elevation used: ${elevation != null ? Math.round(elevation) + ' m' : 'unknown'}${ctx.elevation == null && w.elevation != null ? ' (from the weather provider, approximate)' : ''}.`,
      `Mwinuko uliotumika: ${elevation != null ? 'mita ' + Math.round(elevation) : 'haujulikani'}${ctx.elevation == null && w.elevation != null ? ' (kutoka kwa mtoa data ya hali ya hewa, takriban)' : ''}.`,
    ),
    bi(
      'Rule thresholds are placeholders pending validation by KALRO or county extension officers.',
      'Vigezo vya kanuni ni vya majaribio hadi vithibitishwe na KALRO au maafisa ugani wa kaunti.',
    ),
  ];
  if (w.source === 'demo') {
    assumptions.unshift(bi('DEMO weather data is being used, not a real forecast.', 'Data ya hali ya hewa ni ya MFANO, si utabiri halisi.'));
  }

  // ---- No crop chosen: suggest what fits, and ask. -------------------------
  if (!ctx.crop) {
    const fits = CROP_IDS.filter((id) => suitability(CROPS[id], elevation, t14).ok);
    const names = fits.map((id) => CROPS[id].name);
    return {
      topic: 'planting',
      level: 'info',
      headline: bi('Tell us which crop you are considering', 'Tuambie zao unalofikiria kupanda'),
      reasons: [
        fits.length
          ? bi(
              `Based only on elevation and expected temperature, these crops are plausible here: ${names.map((n) => n.en).join(', ')}. Soil, rainfall reliability and market are not yet considered.`,
              `Kwa kuzingatia mwinuko na joto pekee, mazao haya yanaweza kufaa: ${names.map((n) => n.sw).join(', ')}. Udongo, uhakika wa mvua na soko bado havijazingatiwa.`,
            )
          : bi('None of the crops in this prototype fit the local elevation and temperature.', 'Hakuna zao katika mfumo huu linalofaa mwinuko na joto la eneo hili.'),
      ],
      actions: [bi('Choose a crop to get a planting-window assessment.', 'Chagua zao ili upate tathmini ya wakati wa kupanda.')],
      confidence: 'low',
      confidenceNote: bi('No crop selected, so this is only a rough shortlist.', 'Hakuna zao lililochaguliwa, kwa hiyo hii ni orodha ya awali tu.'),
      assumptions,
      missing: [{ field: 'crop', why: bi('Needed to judge the planting window.', 'Inahitajika ili kutathmini wakati wa kupanda.') }],
      wouldChange: [],
      ruleVersion: RULE_VERSION,
      sources: SOURCES,
    };
  }

  const crop = CROPS[ctx.crop];
  const fit = suitability(crop, elevation, t14);
  const missing: MissingInput[] = [];
  let penalty = 0;
  if (!ctx.soil) {
    missing.push({ field: 'soil', why: bi('Sandy soils dry out faster and clay soils hold water, which changes how long a dry spell you can risk.', 'Udongo wa mchanga hukauka haraka na wa mfinyanzi hushikilia maji, jambo linalobadilisha kiasi cha ukame unaoweza kuvumilia.') });
    penalty += 0.5;
  }
  if (!ctx.variety) {
    missing.push({ field: 'variety', why: bi('Early, medium and late varieties need different season lengths.', 'Mbegu za mapema, kati na za kuchelewa zinahitaji urefu tofauti wa msimu.') });
    penalty += 0.5;
  }
  if (w.source === 'demo') penalty += 2;
  if (!fit.ok) penalty += 1;

  // ---- Already planted: stage-aware advice. --------------------------------
  if (ctx.plantingDate && ctx.plantingDate <= today) {
    const dap = daysBetween(ctx.plantingDate, today);
    const mat = maturityDays(crop, ctx.variety, elevation);
    const f = dap / mat;
    const stage: Bi =
      f < 0.15 ? bi('emergence and early establishment', 'kuota na kuimarika mapema')
      : f < 0.45 ? bi('vegetative growth', 'ukuaji wa majani')
      : f < 0.65 ? bi('flowering (the most moisture-sensitive stage)', 'kuchanua (hatua inayohitaji unyevu zaidi)')
      : f < 0.9 ? bi('grain or pod filling', 'kujaza nafaka au maganda')
      : bi('maturity and harvest', 'kukomaa na kuvuna');

    const rain7 = sum(nextDays(w, 7).map((d) => d.rain));
    const dry = longestDrySpell(nextDays(w, 7));
    const reasons: Bi[] = [
      bi(
        `About ${dap} days since planting. Estimated stage: ${stage.en} (assuming a ${ctx.variety ?? 'medium'} variety of roughly ${mat} days at this elevation).`,
        `Takriban siku ${dap} tangu kupanda. Hatua inayokadiriwa: ${stage.sw} (kwa mbegu ya ${ctx.variety ?? 'kati'} ya takriban siku ${mat} katika mwinuko huu).`,
      ),
      bi(`Forecast rain in the next 7 days: ${round(rain7)} mm; longest dry run: ${dry} days.`, `Mvua inayotabiriwa siku 7 zijazo: mm ${round(rain7)}; kipindi kirefu zaidi cha ukame: siku ${dry}.`),
    ];
    const actions: Bi[] = [];
    let level: Level = 'info';
    let headline = bi('Crop is on track on the weather side', 'Zao linaendelea vizuri kwa upande wa hali ya hewa');
    const wouldChange: Bi[] = [bi('A different planting date or variety would shift the estimated stage and this advice.', 'Tarehe tofauti ya kupanda au aina tofauti ya mbegu ingebadilisha hatua inayokadiriwa na ushauri huu.')];

    if (dap > mat * 1.3) {
      level = 'caution';
      headline = bi('Check the planting date or variety', 'Hakiki tarehe ya kupanda au aina ya mbegu');
      reasons.push(bi('The crop should have matured by now. Either the date, the variety or the elevation assumption may be off.', 'Zao lingekuwa limekomaa sasa. Tarehe, aina ya mbegu au dhana ya mwinuko huenda si sahihi.'));
    } else if (f >= 0.4 && f < 0.7 && (dry >= 5 || rain7 < 10)) {
      level = 'caution';
      headline = bi('Dry spell likely during a sensitive stage', 'Ukame unaweza kutokea wakati wa hatua nyeti');
      actions.push(bi('If possible, mulch or irrigate, and avoid extra stress such as heavy weeding or late top-dressing.', 'Ikiwezekana, weka matandazo au umwagilie, na epuka mkazo wa ziada kama palizi nzito au mbolea ya kukuzia ya kuchelewa.'));
      wouldChange.push(bi('Rain arriving earlier than forecast would lower the risk.', 'Mvua ikija mapema kuliko ilivyotabiriwa ingepunguza hatari.'));
    } else if (f >= 0.85 && rain7 >= 30) {
      level = 'caution';
      headline = bi('Rain forecast near harvest time', 'Mvua inatabiriwa karibu na wakati wa mavuno');
      actions.push(bi('Plan harvesting and drying around the wet days to limit losses and mould.', 'Panga uvunaji na ukaushaji kuzunguka siku za mvua ili kupunguza hasara na ukungu.'));
    } else {
      actions.push(bi('Keep scouting your field; confirm the stage by looking at the crop, not only the calendar.', 'Endelea kukagua shamba; thibitisha hatua kwa kuliangalia zao, si kalenda pekee.'));
    }
    if (!fit.ok) reasons.push(...fit.issues);

    return {
      topic: 'planting', level, headline, reasons, actions,
      confidence: toConfidence(3 - penalty),
      confidenceNote: bi('Stage is estimated from the planting date, not observed.', 'Hatua imekadiriwa kutoka tarehe ya kupanda, haijaonekana shambani.'),
      assumptions, missing, wouldChange, ruleVersion: RULE_VERSION, sources: SOURCES,
    };
  }

  // ---- Not yet planted: planting window. ----------------------------------
  const past7 = sum(pastDays(w, 7).map((d) => d.rain));
  const next7 = sum(nextDays(w, 7).map((d) => d.rain));
  const dry10 = longestDrySpell(nextDays(w, 10));
  const maxDry = ctx.soil === 'sandy' ? 5 : ctx.soil === 'clay' ? 8 : 7;
  const soilNote = ctx.soil ?? 'unknown (treated as loam)';

  const reasons: Bi[] = [
    bi(
      `Rain in the last 7 days: ${round(past7)} mm. Forecast for the next 7 days: ${round(next7)} mm. Longest dry run in the next 10 days: ${dry10} days.`,
      `Mvua siku 7 zilizopita: mm ${round(past7)}. Utabiri wa siku 7 zijazo: mm ${round(next7)}. Kipindi kirefu zaidi cha ukame siku 10 zijazo: siku ${dry10}.`,
    ),
  ];
  assumptions.push(bi(
    `Planting window rule: at least ${ONSET_PAST7_MM} mm in the past week, at least ${ONSET_NEXT7_MM} mm forecast, and no dry run longer than ${maxDry} days (soil: ${soilNote}).`,
    `Kanuni ya kupanda: angalau mm ${ONSET_PAST7_MM} wiki iliyopita, angalau mm ${ONSET_NEXT7_MM} zinazotabiriwa, na hakuna ukame zaidi ya siku ${maxDry}.`,
  ));

  const pastOk = past7 >= ONSET_PAST7_MM;
  const nextOk = next7 >= ONSET_NEXT7_MM;
  const dryOk = dry10 <= maxDry;
  const borderline = Math.abs(past7 - ONSET_PAST7_MM) < 5 || Math.abs(next7 - ONSET_NEXT7_MM) < 5 || Math.abs(dry10 - maxDry) <= 1;
  if (borderline) penalty += 0.5;

  let level: Level;
  let headline: Bi;
  const actions: Bi[] = [];
  const wouldChange: Bi[] = [];

  if (pastOk && nextOk && dryOk) {
    level = 'go';
    headline = bi('Planting window looks open', 'Dirisha la kupanda linaonekana wazi');
    actions.push(bi('Check that the soil is moist about 10–15 cm down before planting.', 'Hakikisha udongo una unyevu kina cha sentimita 10–15 kabla ya kupanda.'));
    wouldChange.push(bi('A new dry spell appearing in updated forecasts would turn this into a wait.', 'Ukame mpya ukionekana kwenye utabiri uliosasishwa, ushauri ungebadilika kuwa kusubiri.'));
  } else if (!pastOk && nextOk && dryOk) {
    level = 'prepare';
    headline = bi('Rains are coming: prepare now, plant once the soil is wet', 'Mvua zinakuja: jiandae sasa, panda udongo ukilowa');
    actions.push(bi('Prepare the land and organise seed and inputs. Plant after the first good soaking rains.', 'Andaa shamba na upange mbegu na pembejeo. Panda baada ya mvua nzuri za kwanza.'));
    wouldChange.push(bi('If the forecast rain does not arrive, keep waiting.', 'Mvua ikichelewa kuliko ilivyotabiriwa, endelea kusubiri.'));
  } else if (pastOk && (!nextOk || !dryOk)) {
    level = 'caution';
    headline = bi('Risk of a false start: some rain, but a dry spell may follow', 'Hatari ya kuanza mapema: mvua kidogo, lakini ukame unaweza kufuata');
    actions.push(bi('Consider waiting for more reliable rains, or plant a small area first.', 'Fikiria kusubiri mvua za uhakika zaidi, au panda eneo dogo kwanza.'));
    wouldChange.push(bi('Stronger rain in updated forecasts, or moisture deep in the soil, would favour planting.', 'Mvua zaidi kwenye utabiri mpya, au unyevu kina kirefu ardhini, vingependelea kupanda.'));
  } else {
    level = 'wait';
    headline = bi('Too dry to plant now', 'Kavu mno kupanda sasa');
    actions.push(bi('Wait for sustained rain. Use the time to prepare land and source certified seed.', 'Subiri mvua za kutosha. Tumia muda huu kuandaa shamba na kupata mbegu zilizothibitishwa.'));
    wouldChange.push(bi('Forecast rain above about 20 mm in the coming week would change this.', 'Mvua inayotabiriwa zaidi ya mm 20 wiki ijayo ingebadilisha ushauri huu.'));
  }

  if (ctx.soil === 'clay' && next7 > WATERLOG_NEXT7_MM) {
    reasons.push(bi('Very heavy rain is forecast and clay soils can waterlog. Make sure fields drain.', 'Mvua nyingi sana zinatabiriwa na udongo wa mfinyanzi unaweza kujaa maji. Hakikisha shamba linatoka maji.'));
    if (level === 'go') level = 'caution';
  }
  if (!fit.ok) {
    reasons.push(...fit.issues);
    actions.unshift(bi('Check with your extension officer whether this crop suits your area before investing.', 'Wasiliana na afisa ugani kuhakikisha zao hili linafaa eneo lako kabla ya kuwekeza.'));
    if (level === 'go') level = 'caution';
    headline = bi(`${headline.en} (but the crop may be a poor fit here)`, `${headline.sw} (lakini zao linaweza lisifae eneo hili)`);
  }
  reasons.push(bi(
    'Forecasts beyond about a week are uncertain, especially in highland and Rift Valley terrain.',
    'Utabiri wa zaidi ya wiki moja si wa uhakika, hasa maeneo ya miinuko na Bonde la Ufa.',
  ));

  return {
    topic: 'planting', level, headline, reasons, actions,
    confidence: toConfidence(3 - penalty),
    confidenceNote: bi(
      missing.length
        ? 'Confidence is held down because some farm details are missing. Adding them can raise it.'
        : 'Based on the details you gave. Weather forecasts still carry uncertainty.',
      missing.length
        ? 'Uhakika umepunguzwa kwa sababu baadhi ya taarifa za shamba hazipo. Kuziongeza kunaweza kuuongeza.'
        : 'Inatokana na taarifa ulizotoa. Utabiri wa hali ya hewa bado una kiwango cha kutokuwa na uhakika.',
    ),
    assumptions, missing, wouldChange, ruleVersion: RULE_VERSION, sources: SOURCES,
  };
}
