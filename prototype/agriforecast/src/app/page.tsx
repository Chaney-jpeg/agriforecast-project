'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Advice, Bi, Lang, Level, Topic } from '../lib/types';
import { COUNTIES, t } from '../lib/ui';

interface ApiDay { date: string; rain: number; tmax: number; tmin: number; isForecast: boolean }
interface ApiResult {
  advice: Advice;
  weather: { source: string; elevation: number | null; fetchedAt: string; todayDate?: string; days: ApiDay[] };
  outsideKenya: boolean;
}
interface Saved { savedAt: string; result: ApiResult }

const LEVEL_LABEL: Record<Level, Bi> = {
  go: { en: 'Go', sw: 'Endelea' },
  prepare: { en: 'Prepare', sw: 'Jiandae' },
  wait: { en: 'Wait', sw: 'Subiri' },
  caution: { en: 'Caution', sw: 'Tahadhari' },
  info: { en: 'Info', sw: 'Taarifa' },
  low: { en: 'Low risk', sw: 'Hatari ndogo' },
  moderate: { en: 'Moderate risk', sw: 'Hatari ya wastani' },
  high: { en: 'High risk', sw: 'Hatari kubwa' },
  severe: { en: 'Severe risk', sw: 'Hatari kali' },
};

const SCENARIOS = ['onset', 'dry', 'falsestart', 'humid', 'hot'] as const;
const STORAGE_KEY = 'agriforecast:last';

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [county, setCounty] = useState('');
  const [topic, setTopic] = useState<Topic>('planting');

  const [crop, setCrop] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [soil, setSoil] = useState('');
  const [variety, setVariety] = useState('');
  const [species, setSpecies] = useState('');
  const [shade, setShade] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [pasture, setPasture] = useState('');
  const [demo, setDemo] = useState('');

  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [savedFrom, setSavedFrom] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('weather');

  const T = (k: string) => t(k, lang);
  const L = (b: Bi) => b[lang];

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    try {
      const l = localStorage.getItem('agriforecast:lang');
      if (l === 'sw' || l === 'en') setLang(l);
    } catch { /* storage can be unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('agriforecast:lang', lang); } catch { /* ignore */ }
  }, [lang]);

  function chooseCounty(name: string) {
    setCounty(name);
    const c = COUNTIES.find((x) => x.name === name);
    if (c) { setLat(String(c.lat)); setLon(String(c.lon)); }
  }

  function useGps() {
    if (!navigator.geolocation) { setMessage({ kind: 'error', text: T('gpsFail') }); return; }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setCounty('');
        setGpsBusy(false);
        setMessage(null);
      },
      () => { setGpsBusy(false); setMessage({ kind: 'error', text: T('gpsFail') }); },
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  async function submit() {
    if (!lat || !lon) { setMessage({ kind: 'error', text: T('needLocation') }); return; }
    setBusy(true);
    setMessage(null);
    setSavedFrom(null);
    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          demo: demo || undefined,
          context: {
            lat: Number(lat), lon: Number(lon),
            crop: crop || undefined,
            plantingDate: plantingDate || undefined,
            soil: soil || undefined,
            variety: variety || undefined,
            species: species || undefined,
            shade: shade === '' ? undefined : shade === 'yes',
            waterSource: waterSource || undefined,
            pasture: pasture || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ApiResult;
      setResult(data);
      try {
        const saved: Saved = { savedAt: new Date().toISOString(), result: data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch { /* ignore */ }
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch {
      let restored = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Saved;
          setResult(saved.result);
          setSavedFrom(saved.savedAt);
          restored = true;
        }
      } catch { /* ignore */ }
      setMessage({ kind: 'error', text: T('weatherDown') + (restored ? '' : '') });
    } finally {
      setBusy(false);
    }
  }

  function focusField(field: string) {
    const el = document.getElementById(`f-${field}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus();
    }
  }

  const needsCrop = topic === 'planting' || topic === 'disease';

  const primaryNav = [
    { id: 'dashboard', icon: '▦', label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'cycles', icon: '♧', label: lang === 'sw' ? 'Mizunguko' : 'Cycles' },
    { id: 'fields', icon: '⌖', label: lang === 'sw' ? 'Mashamba' : 'Fields' },
    { id: 'equipment', icon: '⚙', label: lang === 'sw' ? 'Vifaa' : 'Equipment' },
    { id: 'workers', icon: '♙', label: lang === 'sw' ? 'Wafanyakazi' : 'Workers' },
    { id: 'warehouse', icon: '▤', label: lang === 'sw' ? 'Ghala' : 'Warehouse' },
    { id: 'dictionaries', icon: '▣', label: lang === 'sw' ? 'Orodha za rejea' : 'Dictionaries' },
    { id: 'reports', icon: '▥', label: lang === 'sw' ? 'Ripoti' : 'Reports' },
  ];
  const farmTools = [
    { id: 'general', icon: 'ⓘ', label: lang === 'sw' ? 'Taarifa za jumla' : 'General information' },
    { id: 'tasks', icon: '☷', label: lang === 'sw' ? 'Kazi' : 'Tasks' },
    { id: 'guidance', icon: '☰', label: lang === 'sw' ? 'Mwongozo wa kilimo' : 'Farm guidance' },
    { id: 'weather', icon: '☼', label: lang === 'sw' ? 'Hali ya hewa' : 'Weather' },
    { id: 'satellite', icon: '⌁', label: lang === 'sw' ? 'Picha za satelaiti' : 'Satellite images' },
    { id: 'soil-analysis', icon: '♧', label: lang === 'sw' ? 'Uchambuzi wa udongo' : 'Soil analysis' },
    { id: 'prescription-maps', icon: '▧', label: lang === 'sw' ? 'Ramani za mapendekezo' : 'Prescription maps' },
    { id: 'application-maps', icon: '▨', label: lang === 'sw' ? 'Ramani za matumizi' : 'Application maps' },
    { id: 'yield-maps', icon: '▧', label: lang === 'sw' ? 'Ramani za mavuno' : 'Yield maps' },
    { id: 'compare-maps', icon: '▤', label: lang === 'sw' ? 'Linganisha ramani' : 'Compare maps' },
    { id: 'notes', icon: '▤', label: lang === 'sw' ? 'Vidokezo' : 'Notes' },
    { id: 'farm-report', icon: '▥', label: lang === 'sw' ? 'Ripoti ya shamba' : 'Farm report' },
  ];
  const sectionLabel = [...primaryNav, ...farmTools].find((item) => item.id === activeSection)?.label ?? 'Weather';

  return (
    <main className="farm-workspace">
      <aside className="primary-sidebar" aria-label="Main navigation">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">a</div>
          <div className="brand-name">Agri<span>Forecast</span></div>
          <button className="icon-button menu-toggle" aria-label="Menu" onClick={() => setActiveSection(activeSection === 'weather' ? 'dashboard' : 'weather')}>☰</button>
        </div>
        <button className="farm-switcher" onClick={() => setActiveSection('general')}>
          <span className="farm-avatar">AF</span><span>{lang === 'sw' ? 'Shamba la majaribio' : 'Demo training farm'}</span><span className="chevron">⌄</span>
        </button>
        <nav className="main-nav">
          {primaryNav.map((item) => <button key={item.id} className={`nav-item ${activeSection === item.id ? 'selected' : ''}`} onClick={() => setActiveSection(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setActiveSection('search')}><span className="nav-icon">⌕</span>{lang === 'sw' ? 'Tafuta' : 'Search'}</button>
          <button className="nav-item" onClick={() => setActiveSection('support')}><span className="nav-icon">?</span>{lang === 'sw' ? 'Usaidizi' : 'Support'}</button>
          <button className="nav-item" onClick={() => setActiveSection('notifications')}><span className="nav-icon">♧</span>{lang === 'sw' ? 'Arifa' : 'Notifications'}</button>
          <button className="nav-item" onClick={() => setActiveSection('profile')}><span className="nav-icon">♙</span>{lang === 'sw' ? 'Wasifu' : 'Profile'}</button>
          <div className="lang lang-sidebar" role="group" aria-label="Language">
            <span className="nav-icon">◎</span>
            <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
            <button aria-pressed={lang === 'sw'} onClick={() => setLang('sw')}>Kiswahili</button>
          </div>
        </div>
      </aside>

      <aside className="farm-sidebar" aria-label="Farm tools">
        <div className="farm-heading"><div><strong>Demo training farm</strong><small>{county || (lang === 'sw' ? 'Ongeza kaunti' : 'Add a county')}</small></div><span className="chevron">⌄</span></div>
        <nav className="tool-nav">
          {farmTools.map((item) => <button key={item.id} className={`tool-item ${activeSection === item.id ? 'selected' : ''}`} onClick={() => setActiveSection(item.id)}><span className="tool-icon">{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="farm-sidebar-footer"><button aria-label="Collapse farm menu">‹</button><button aria-label="More farm options">⋮</button></div>
      </aside>

      <section className="workspace-content">
        <header className="content-header">
          <div><p className="eyebrow">AGRI FORECAST · {county || (lang === 'sw' ? 'SHAMBA LA MAJARIBIO' : 'DEMO FARM')}</p><h1>{activeSection === 'weather' ? (lang === 'sw' ? 'Hali ya hewa' : 'Weather') : sectionLabel}</h1></div>
          <div className="header-actions">
            <div className="lang lang-top" role="group" aria-label="Language">
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
              <button aria-pressed={lang === 'sw'} onClick={() => setLang('sw')}>SW</button>
            </div>
            <span className="status-pill"><i />{lang === 'sw' ? 'Mfano' : 'Prototype'}</span>
          </div>
        </header>

        {message && <div className={`notice ${message.kind === 'error' ? 'error' : ''}`} role="alert">{message.text}</div>}

        {activeSection === 'weather' || activeSection === 'dashboard' ? (
          <WeatherWorkspace
            lang={lang} county={county} lat={lat} lon={lon} gpsBusy={gpsBusy} busy={busy} result={result}
            onCounty={chooseCounty} onGps={useGps} onLat={(value) => { setLat(value); setCounty(''); }}
            onLon={(value) => { setLon(value); setCounty(''); }} onLoad={submit}
          />
        ) : activeSection === 'guidance' ? (
          <div className="guidance-layout">
            <div className="prototype-banner">{T('prototype')}</div>
            <section className="card">
              <h2>{T('step1')}</h2>
              <label htmlFor="county">{T('pickCounty')}</label>
              <select id="county" value={county} onChange={(e) => chooseCounty(e.target.value)}>
                <option value="">—</option>
                {COUNTIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <button type="button" className="secondary" onClick={useGps} disabled={gpsBusy}>{gpsBusy ? T('locating') : '📍 ' + T('useGps')}</button>
              <div className="row"><div><label htmlFor="lat">{T('lat')}</label><input id="lat" type="number" step="any" inputMode="decimal" value={lat} onChange={(e) => { setLat(e.target.value); setCounty(''); }} /></div><div><label htmlFor="lon">{T('lon')}</label><input id="lon" type="number" step="any" inputMode="decimal" value={lon} onChange={(e) => { setLon(e.target.value); setCounty(''); }} /></div></div>
            </section>
            <section className="card"><h2>{T('step2')}</h2><div className="chips">{(['planting', 'disease', 'livestock'] as Topic[]).map((tp) => <button key={tp} type="button" className="chip" aria-pressed={topic === tp} onClick={() => setTopic(tp)}>{tp === 'planting' ? '🌱 ' : tp === 'disease' ? '🍃 ' : '🐄 '}{T(tp)}</button>)}</div></section>
            <section className="card">
              <h2>{T('step3')}</h2>
              {needsCrop && <>
                <label htmlFor="f-crop">{T('crop')}</label><select id="f-crop" value={crop} onChange={(e) => setCrop(e.target.value)}><option value="">{T('notSure')}</option>{(['maize', 'beans', 'potato', 'sorghum'] as const).map((c) => <option key={c} value={c}>{lang === 'sw' ? { maize: 'Mahindi', beans: 'Maharagwe', potato: 'Viazi', sorghum: 'Mtama' }[c] : c[0].toUpperCase() + c.slice(1)}</option>)}</select>
                <label htmlFor="f-plantingDate">{T('plantingDate')}</label><input id="f-plantingDate" type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} />
                {topic === 'planting' && <><label htmlFor="f-soil">{T('soil')}</label><select id="f-soil" value={soil} onChange={(e) => setSoil(e.target.value)}><option value="">{T('dontKnow')}</option><option value="sandy">{T('sandy')}</option><option value="loam">{T('loam')}</option><option value="clay">{T('clay')}</option></select></>}
                <label htmlFor="f-variety">{T('variety')}</label><select id="f-variety" value={variety} onChange={(e) => setVariety(e.target.value)}><option value="">{T('dontKnow')}</option><option value="early">{T('early')}</option><option value="medium">{T('medium')}</option><option value="late">{T('late')}</option></select>
              </>}
              {topic === 'livestock' && <>
                <label htmlFor="f-species">{T('species')}</label><select id="f-species" value={species} onChange={(e) => setSpecies(e.target.value)}><option value="">{T('notSure')}</option><option value="cattle">{T('cattle')}</option><option value="goat">{T('goat')}</option><option value="sheep">{T('sheep')}</option><option value="poultry">{T('poultry')}</option></select>
                <label htmlFor="f-shade">{T('shade')}</label><select id="f-shade" value={shade} onChange={(e) => setShade(e.target.value)}><option value="">{T('dontKnow')}</option><option value="yes">{T('yes')}</option><option value="no">{T('no')}</option></select>
                <label htmlFor="f-waterSource">{T('waterSource')}</label><select id="f-waterSource" value={waterSource} onChange={(e) => setWaterSource(e.target.value)}><option value="">{T('dontKnow')}</option><option value="reliable">{T('reliable')}</option><option value="unreliable">{T('unreliable')}</option><option value="far">{T('far')}</option></select>
                <label htmlFor="f-pasture">{T('pasture')}</label><select id="f-pasture" value={pasture} onChange={(e) => setPasture(e.target.value)}><option value="">{T('dontKnow')}</option><option value="good">{T('good')}</option><option value="fair">{T('fair')}</option><option value="poor">{T('poor')}</option></select>
              </>}
              <label htmlFor="demo">{T('demoLabel')}</label><select id="demo" value={demo} onChange={(e) => setDemo(e.target.value)}><option value="">{T('demoOff')}</option>{SCENARIOS.map((s) => <option key={s} value={s}>{T('scenario_' + s)}</option>)}</select>
              <button type="button" className="primary" onClick={submit} disabled={busy}>{busy ? T('loading') : T('getAdvice')}</button>
            </section>
            {result && <ResultCard result={result} lang={lang} savedFrom={savedFrom} onAdd={focusField} />}
            <p className="disclaimer">{T('disclaimer')}</p>
          </div>
        ) : (
          <section className="empty-section card">
            <span className="empty-icon">{farmTools.find((item) => item.id === activeSection)?.icon ?? '▦'}</span>
            <p className="eyebrow">{lang === 'sw' ? 'INAENDELEZWA' : 'PLANNED WORKSPACE'}</p>
            <h2>{sectionLabel}</h2>
            <p>{lang === 'sw' ? 'Sehemu hii bado haijaunganishwa. Kwa sasa unaweza kuona utabiri wa hali ya hewa au kupata mwongozo wa shamba.' : 'This area is not connected yet. For now, view a weather forecast or open farm guidance.'}</p>
            <div className="empty-actions"><button className="secondary" onClick={() => setActiveSection('weather')}>{lang === 'sw' ? 'Fungua hali ya hewa' : 'Open weather'}</button><button className="secondary" onClick={() => setActiveSection('guidance')}>{lang === 'sw' ? 'Mwongozo wa shamba' : 'Farm guidance'}</button></div>
          </section>
        )}
      </section>
    </main>
  );
}

function WeatherWorkspace({ lang, county, lat, lon, gpsBusy, busy, result, onCounty, onGps, onLat, onLon, onLoad }: {
  lang: Lang; county: string; lat: string; lon: string; gpsBusy: boolean; busy: boolean; result: ApiResult | null;
  onCounty: (name: string) => void; onGps: () => void; onLat: (value: string) => void; onLon: (value: string) => void; onLoad: () => void;
}) {
  const sw = lang === 'sw';
  const days = result?.weather.days ?? [];
  const dayName = (date: string) => new Intl.DateTimeFormat(sw ? 'sw-KE' : 'en-KE', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));
  const weatherIcon = (rain: number) => rain >= 5 ? '☂' : rain > 0 ? '☁' : '☀';

  return <div className="weather-dashboard">
    <section className="weather-toolbar card">
      <div className="location-picker"><span className="location-symbol">⌖</span><div><strong>{county || (sw ? 'Chagua eneo la shamba' : 'Set your farm location')}</strong><small>{lat && lon ? `${Number(lat).toFixed(3)}°, ${Number(lon).toFixed(3)}°` : (sw ? 'Eneo lako linatumika kwa utabiri' : 'Location is used to request a forecast')}</small></div></div>
      <div className="location-controls"><select aria-label={sw ? 'Chagua kaunti' : 'Choose county'} value={county} onChange={(e) => onCounty(e.target.value)}><option value="">{sw ? 'Chagua kaunti' : 'Choose county'}</option>{COUNTIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select><button className="secondary gps-button" onClick={onGps} disabled={gpsBusy}>{gpsBusy ? '…' : '⌖'} <span>{gpsBusy ? (sw ? 'Inatafuta' : 'Locating') : (sw ? 'Tumia GPS' : 'Use GPS')}</span></button></div>
    </section>

    {!result && <section className="forecast-empty card"><div className="cloud-mark">☁</div><div><strong>{sw ? 'Utabiri wako utaonekana hapa' : 'Your local forecast will appear here'}</strong><p>{sw ? 'Chagua kaunti au tumia GPS, kisha upakie utabiri wa siku 7.' : 'Choose a county or use GPS, then load a 7-day forecast for this farm.'}</p></div><button className="primary load-weather" onClick={onLoad} disabled={busy || (!lat && !county)}>{busy ? (sw ? 'Inapakia…' : 'Loading…') : (sw ? 'Pakia utabiri' : 'Load forecast')}</button></section>}

    {result && <>
      {result.weather.source === 'demo' && <div className="notice">{sw ? 'Data ya hali ya hewa ni ya MFANO.' : 'DEMO weather data: not a real forecast.'}</div>}
      {result.outsideKenya && <div className="notice">{sw ? 'Eneo hili liko nje ya Kenya.' : 'This location is outside Kenya.'}</div>}
      <section className="forecast-strip card" aria-label={sw ? 'Utabiri wa siku saba' : 'Seven day forecast'}>
        <div className="section-title"><div><p className="eyebrow">{sw ? 'UTABIRI WA SIKU 7' : '7-DAY OUTLOOK'}</p><h2>{sw ? 'Hali ya hewa inayokuja' : 'Upcoming weather'}</h2></div><span className="source-chip">{result.weather.source}</span></div>
        <div className="forecast-days">{days.map((day) => <article className="forecast-day" key={day.date}><small>{dayName(day.date)}</small><span className="day-icon" aria-hidden="true">{weatherIcon(day.rain)}</span><span className="condition">{day.rain >= 5 ? (sw ? 'Mvua' : 'Rain') : day.rain > 0 ? (sw ? 'Mawingu' : 'Cloudy') : (sw ? 'Kavu' : 'Mostly clear')}</span><strong>{Math.round(day.tmax)}° <i>/</i> {Math.round(day.tmin)}°</strong><small className="rain-amount">{day.rain.toFixed(1)} mm</small></article>)}</div>
      </section>
      <section className="history-card card"><div className="section-title"><div><p className="eyebrow">{sw ? 'MUHTASARI' : 'WEATHER SUMMARY'}</p><h2>{sw ? 'Mwelekeo wa utabiri' : 'Forecast trends'}</h2></div><span className="date-range">{days.length ? `${dayName(days[0].date)} – ${dayName(days[days.length - 1].date)}` : ''}</span></div><div className="chart-panel"><h3>{sw ? 'Mvua na halijoto' : 'Rainfall and temperature'}</h3><WeatherChart days={days} today={result.weather.todayDate} lang={lang} /><div className="chart-legend"><span><i className="legend-rain" />{sw ? 'Mvua (mm)' : 'Rain (mm)'}</span><span><i className="legend-temp" />{sw ? 'Halijoto ya juu' : 'Maximum temperature'}</span></div></div></section>
      <WeatherAdvicePreview result={result} lang={lang} />
    </>}

    <section className="location-edit card"><div><strong>{sw ? 'Mipangilio ya eneo' : 'Location settings'}</strong><p>{sw ? 'Unaweza kuingiza viwianishi mwenyewe.' : 'You can also enter farm coordinates manually.'}</p></div><div className="coordinates"><label>{sw ? 'Latitudo' : 'Latitude'}<input type="number" step="any" value={lat} onChange={(e) => onLat(e.target.value)} placeholder="-1.286" /></label><label>{sw ? 'Longitudo' : 'Longitude'}<input type="number" step="any" value={lon} onChange={(e) => onLon(e.target.value)} placeholder="36.817" /></label><button className="secondary" onClick={onLoad} disabled={busy || !lat || !lon}>{busy ? '…' : (sw ? 'Sasisha' : 'Update')}</button></div></section>
  </div>;
}

function WeatherAdvicePreview({ result, lang }: { result: ApiResult; lang: Lang }) {
  const advice = result.advice;
  const headline = advice.headline[lang];
  const reason = advice.reasons[0]?.[lang];
  return <section className="advice-preview card"><div className="advice-symbol">✦</div><div><p className="eyebrow">{lang === 'sw' ? 'USHAURI WA SHAMBA' : 'FARM ADVISORY'}</p><h2>{headline}</h2>{reason && <p>{reason}</p>}</div><span className={`badge lvl-${advice.level}`}>{advice.level}</span></section>;
}

function ResultCard({ result, lang, savedFrom, onAdd }: { result: ApiResult; lang: Lang; savedFrom: string | null; onAdd: (f: string) => void }) {
  const a = result.advice;
  const T = (k: string) => t(k, lang);
  const L = (b: Bi) => b[lang];
  const confRank = a.confidence === 'high' ? 3 : a.confidence === 'medium' ? 2 : 1;
  const confLabel = a.confidence === 'high' ? T('high') : a.confidence === 'medium' ? T('mediumC') : T('low');
  const fieldLabel = (f: string) => T(f);

  return (
    <section className="card result" id="result" aria-live="polite">
      {savedFrom && <div className="notice">{T('savedResult')} {new Date(savedFrom).toLocaleString()}</div>}
      {result.weather.source === 'demo' && <div className="notice">{lang === 'sw' ? 'Data ya hali ya hewa ni ya MFANO.' : 'DEMO weather data: not a real forecast.'}</div>}
      {result.outsideKenya && <div className="notice">{T('outsideKenya')}</div>}

      <span className={`badge lvl-${a.level}`}>{LEVEL_LABEL[a.level][lang]}</span>
      <h3>{L(a.headline)}</h3>

      <div className="conf">
        <strong>{T('confidence')}:</strong> {confLabel}
        <span className="meter" aria-hidden="true">
          {[1, 2, 3].map((i) => <span key={i} className={i <= confRank ? 'on' : ''} />)}
        </span>
      </div>
      <p className="confnote">{L(a.confidenceNote)}</p>

      {a.reasons.length > 0 && (
        <>
          <h4>{T('why')}</h4>
          <ul>{a.reasons.map((r, i) => <li key={i}>{L(r)}</li>)}</ul>
        </>
      )}

      {a.actions.length > 0 && (
        <>
          <h4>{T('whatToDo')}</h4>
          <ul>{a.actions.map((r, i) => <li key={i}>{L(r)}</li>)}</ul>
        </>
      )}

      {a.missing.length > 0 && (
        <div className="missing">
          <h4>{T('missingTitle')}</h4>
          <ul>
            {a.missing.map((m) => (
              <li key={m.field}>
                <strong>{fieldLabel(m.field)}:</strong> {L(m.why)}
                <button type="button" onClick={() => onAdd(m.field)}>{T('addThis')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.wouldChange.length > 0 && (
        <>
          <h4>{T('wouldChange')}</h4>
          <ul>{a.wouldChange.map((r, i) => <li key={i}>{L(r)}</li>)}</ul>
        </>
      )}

      <h4>{T('forecast')}</h4>
      <WeatherChart days={result.weather.days} today={result.weather.todayDate} lang={lang} />

      <details>
        <summary>{T('details')}</summary>
        <h4>{T('assumptions')}</h4>
        <ul>{a.assumptions.map((r, i) => <li key={i}>{L(r)}</li>)}</ul>
        <p className="small"><strong>{T('rules')}:</strong> {a.ruleVersion}</p>
        <p className="small"><strong>{T('sources')}:</strong> {a.sources.join('; ')}</p>
        <p className="small"><strong>{T('source')}:</strong> {result.weather.source} ({new Date(result.weather.fetchedAt).toLocaleString()})</p>
      </details>
    </section>
  );
}

function WeatherChart({ days, today, lang }: { days: ApiDay[]; today?: string; lang: Lang }) {
  const W = 660, H = 190, padL = 30, padR = 30, padT = 14, padB = 34;
  const n = days.length;
  const maxRain = Math.max(10, ...days.map((d) => d.rain));
  const temps = days.flatMap((d) => [d.tmax, d.tmin]).filter(Number.isFinite);
  const tMin = Math.floor(Math.min(...temps, 10)), tMax = Math.ceil(Math.max(...temps, 30));
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const bw = plotW / n;
  const yR = (v: number) => padT + plotH - (v / maxRain) * plotH;
  const yT = (v: number) => padT + plotH - ((v - tMin) / (tMax - tMin)) * plotH;
  const x = (i: number) => padL + i * bw + bw / 2;
  const line = days.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yT(d.tmax).toFixed(1)}`).join(' ');
  const t = (k: string) => (lang === 'sw' ? t0[k].sw : t0[k].en);
  const t0: Record<string, Bi> = {
    rain: { en: 'Rain (mm)', sw: 'Mvua (mm)' },
    temp: { en: 'Max °C', sw: 'Joto la juu °C' },
    today: { en: 'today', sw: 'leo' },
  };
  const todayIdx = today ? days.findIndex((d) => d.date === today) : -1;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('rain') + ', ' + t('temp')}>
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={padL} x2={W - padR} y1={padT + plotH * (1 - f)} y2={padT + plotH * (1 - f)} stroke="#e1e9d8" />
      ))}
      {days.map((d, i) => (
        <rect key={d.date} x={x(i) - bw * 0.35} y={yR(d.rain)} width={bw * 0.7} height={Math.max(0, padT + plotH - yR(d.rain))} fill={d.isForecast ? '#7fb3e6' : '#2f6fb0'} rx={2}>
          <title>{`${d.date}: ${d.rain} mm, ${d.tmin}–${d.tmax}°C`}</title>
        </rect>
      ))}
      <path d={line} fill="none" stroke="#c2410c" strokeWidth={2} />
      {todayIdx >= 0 && (
        <g>
          <line x1={x(todayIdx) - bw / 2} x2={x(todayIdx) - bw / 2} y1={padT} y2={padT + plotH} stroke="#1d2a1d" strokeDasharray="4 3" />
          <text x={x(todayIdx) - bw / 2 + 4} y={padT + 10} fontSize="11" fill="#1d2a1d">{t('today')}</text>
        </g>
      )}
      <text x={4} y={padT + 10} fontSize="10" fill="#2f6fb0">{maxRain.toFixed(0)}</text>
      <text x={W - padR + 3} y={padT + 10} fontSize="10" fill="#c2410c">{tMax}°</text>
      <text x={W - padR + 3} y={padT + plotH} fontSize="10" fill="#c2410c">{tMin}°</text>
      <g fontSize="11">
        <rect x={padL} y={H - 16} width={10} height={10} fill="#2f6fb0" />
        <text x={padL + 14} y={H - 7} fill="#1d2a1d">{t('rain')}</text>
        <line x1={padL + 120} x2={padL + 136} y1={H - 11} y2={H - 11} stroke="#c2410c" strokeWidth={2} />
        <text x={padL + 140} y={H - 7} fill="#1d2a1d">{t('temp')}</text>
      </g>
    </svg>
  );
}
