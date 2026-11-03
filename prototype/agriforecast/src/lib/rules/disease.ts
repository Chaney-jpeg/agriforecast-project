import type { Advice, Bi, CropId, FarmContext, Level, MissingInput, WeatherBundle } from '../types';
import { bi, RULE_VERSION } from '../types';
import { CROPS } from './crops';
import { nextDays, toConfidence } from './util';

// Weather-based favourability screens. These report conditions that FAVOUR disease,
// not confirmed infection. Thresholds are placeholders pending validation.
//
// potato: Hutton-style late blight screen. A "favourable day" has minimum temp >= 10 C
//         and at least 6 hours with relative humidity >= 90%. Two favourable days in a row
//         is a "blight period".
// others: simple warm/cool + long-humidity proxy for foliar diseases (rust, leaf spots).

interface Screen {
  disease: Bi;
  minTmin?: number;
  tmaxRange?: [number, number];
  minHoursRh90: number;
  consecutive: number;
}

const SCREENS: Record<CropId, Screen> = {
  potato: { disease: bi('late blight', 'ugonjwa wa baka (late blight)'), minTmin: 10, minHoursRh90: 6, consecutive: 2 },
  maize: { disease: bi('foliar diseases such as grey leaf spot and rust', 'magonjwa ya majani kama grey leaf spot na kutu'), tmaxRange: [22, 30], minHoursRh90: 8, consecutive: 3 },
  beans: { disease: bi('foliar diseases such as angular leaf spot and rust', 'magonjwa ya majani kama angular leaf spot na kutu'), tmaxRange: [18, 27], minHoursRh90: 8, consecutive: 3 },
  sorghum: { disease: bi('foliar diseases such as anthracnose and leaf blight', 'magonjwa ya majani kama anthracnose na leaf blight'), tmaxRange: [24, 32], minHoursRh90: 8, consecutive: 3 },
};

export function diseaseAdvice(ctx: FarmContext, w: WeatherBundle): Advice {
  const sources = ['Open-Meteo hourly humidity and temperature', 'Hutton-criteria style screen for late blight; proxies for other crops', 'CABI / PlantVillage / KALRO disease guides (to be linked)'];
  const assumptions: Bi[] = [
    bi('Rules flag weather conditions that favour disease. They do not confirm infection in your field.', 'Kanuni zinaonyesha hali ya hewa inayopendelea magonjwa. Hazithibitishi kuwa shamba lako lina ugonjwa.'),
    bi('Thresholds are placeholders pending validation by KALRO plant pathologists.', 'Vigezo ni vya majaribio hadi vithibitishwe na wataalamu wa magonjwa ya mimea wa KALRO.'),
  ];
  if (w.source === 'demo') assumptions.unshift(bi('DEMO weather data is being used.', 'Data ya hali ya hewa ni ya MFANO.'));

  if (!ctx.crop) {
    return {
      topic: 'disease', level: 'info',
      headline: bi('Choose a crop to check disease conditions', 'Chagua zao ili kuangalia hali ya magonjwa'),
      reasons: [bi('Each crop has different diseases and weather triggers.', 'Kila zao lina magonjwa na vichocheo tofauti vya hali ya hewa.')],
      actions: [], confidence: 'low',
      confidenceNote: bi('No crop selected.', 'Hakuna zao lililochaguliwa.'),
      assumptions, missing: [{ field: 'crop', why: bi('Needed to pick the right disease screen.', 'Inahitajika kuchagua kipimo sahihi cha ugonjwa.') }],
      wouldChange: [], ruleVersion: RULE_VERSION, sources,
    };
  }

  const screen = SCREENS[ctx.crop];
  const week = nextDays(w, 7);
  const favourable = week.map((d) => {
    const tOk = screen.minTmin != null ? d.tmin >= screen.minTmin : d.tmax >= screen.tmaxRange![0] && d.tmax <= screen.tmaxRange![1];
    return tOk && d.hoursRh90 >= screen.minHoursRh90;
  });

  let run = 0;
  let longest = 0;
  for (const f of favourable) {
    run = f ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const count = favourable.filter(Boolean).length;

  let level: Level;
  let headline: Bi;
  const actions: Bi[] = [];
  if (longest >= screen.consecutive) {
    level = 'high';
    headline = bi(`Conditions favour ${screen.disease.en} in the coming week`, `Hali ya hewa inapendelea ${screen.disease.sw} wiki ijayo`);
    actions.push(bi('Scout your field every 2–3 days, especially the lower leaves and wet spots. Ask your extension officer or agrovet about locally recommended protection options.', 'Kagua shamba kila siku 2–3, hasa majani ya chini na sehemu zenye unyevu. Uliza afisa ugani au duka la pembejeo kuhusu njia za kinga zinazopendekezwa eneo lako.'));
    actions.push(bi('Improve airflow (spacing, weeding) and avoid working in the field when leaves are wet.', 'Boresha mzunguko wa hewa (nafasi, palizi) na epuka kufanya kazi shambani majani yakiwa na unyevu.'));
  } else if (count >= 1) {
    level = 'moderate';
    headline = bi(`Some days favour ${screen.disease.en}`, `Baadhi ya siku zinapendelea ${screen.disease.sw}`);
    actions.push(bi('Keep scouting and watch the next forecast update.', 'Endelea kukagua shamba na fuatilia utabiri unaofuata.'));
  } else {
    level = 'low';
    headline = bi(`Weather is not strongly favouring ${screen.disease.en} this week`, `Hali ya hewa haipendelei sana ${screen.disease.sw} wiki hii`);
    actions.push(bi('Routine scouting is still wise; disease can come from other sources such as infected seed or neighbouring fields.', 'Ukaguzi wa kawaida bado ni muhimu; ugonjwa unaweza kutoka vyanzo vingine kama mbegu iliyoambukizwa au mashamba jirani.'));
  }

  const missing: MissingInput[] = [];
  if (!ctx.plantingDate) {
    missing.push({ field: 'plantingDate', why: bi('Crop stage matters: some stages are far more susceptible than others.', 'Hatua ya zao ni muhimu: hatua zingine huathirika zaidi kuliko zingine.') });
  }
  if (!ctx.variety) {
    missing.push({ field: 'variety', why: bi('Variety resistance can change the risk a lot. Ask your seed supplier.', 'Ustahimilivu wa mbegu unaweza kubadilisha hatari sana. Uliza muuzaji wa mbegu.') });
  }

  const reasons: Bi[] = [
    bi(
      `${count} of the next 7 days meet the favourable-weather screen for ${CROPS[ctx.crop].name.en.toLowerCase()} (longest run: ${longest} day${longest === 1 ? '' : 's'}).`,
      `Siku ${count} kati ya 7 zijazo zinakidhi kipimo cha hali ya hewa inayopendelea ugonjwa kwa ${CROPS[ctx.crop].name.sw.toLowerCase()} (mfululizo mrefu zaidi: siku ${longest}).`,
    ),
  ];

  let penalty = 1 + missing.length * 0.5; // disease risk is inherently a rough screen
  if (w.source === 'demo') penalty += 2;

  return {
    topic: 'disease', level, headline, reasons, actions,
    confidence: toConfidence(3 - penalty),
    confidenceNote: bi(
      'A weather-only screen. Field history, variety and crop stage are not yet included.',
      'Ni kipimo cha hali ya hewa pekee. Historia ya shamba, aina ya mbegu na hatua ya zao bado hazijajumuishwa.',
    ),
    assumptions, missing,
    wouldChange: [
      bi('Observed symptoms in your field would override this weather screen: report them to an extension officer.', 'Dalili ulizoziona shambani zinatangulia kipimo hiki cha hali ya hewa: ziripoti kwa afisa ugani.'),
      bi('A dry, sunny change in the forecast would lower the risk.', 'Mabadiliko ya hali kavu na jua kwenye utabiri yangepunguza hatari.'),
    ],
    ruleVersion: RULE_VERSION, sources,
  };
}
