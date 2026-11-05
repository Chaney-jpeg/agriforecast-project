'use client';

import { useEffect, useState } from 'react';
import type { Advice, Bi, Lang, Level, Topic } from '../lib/types';
import { COUNTIES, fieldLabel, t } from '../lib/ui';
import {
  APPLICATION_MAPS, CYCLES, DICTIONARIES, EQUIPMENT, FARM,
  FARM_REPORT, FIELDS, INVENTORY, NOTES, NOTIFICATIONS,
  PRESCRIPTION_MAPS, SATELLITE_IMAGES, SOIL_ANALYSIS, TASKS, WORKERS, YIELD_MAPS,
  type AppNotification, type Cycle, type InventoryItem,
  type Note, type Task, type Worker,
} from '../lib/seed';

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
  const [notifications, setNotifications] = useState<AppNotification[]>(NOTIFICATIONS);
  const [noteText, setNoteText] = useState('');

  const T = (k: string) => t(k, lang);
  const sw = lang === 'sw';

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    try {
      const l = localStorage.getItem('agriforecast:lang');
      if (l === 'sw' || l === 'en') setLang(l as Lang);
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
      setMessage({
        kind: 'error',
        text: T('weatherDown') + (restored ? '' : ' ' + T('noSavedAdvice')),
      });
    } finally {
      setBusy(false);
    }
  }

  function focusField(field: string) {
    setActiveSection('guidance');
    setTimeout(() => {
      const el = document.getElementById(`f-${field}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLElement).focus();
      }
    }, 50);
  }

  const needsCrop = topic === 'planting' || topic === 'disease';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const primaryNav = [
    { id: 'dashboard', icon: '▦', label: sw ? 'Dashibodi' : 'Dashboard' },
    { id: 'cycles', icon: '↻', label: sw ? 'Mizunguko' : 'Cycles' },
    { id: 'fields', icon: '⌖', label: sw ? 'Mashamba' : 'Fields' },
    { id: 'equipment', icon: '⚙', label: sw ? 'Vifaa' : 'Equipment' },
    { id: 'workers', icon: '♙', label: sw ? 'Wafanyakazi' : 'Workers' },
    { id: 'warehouse', icon: '▤', label: sw ? 'Ghala' : 'Warehouse' },
    { id: 'dictionaries', icon: '▣', label: sw ? 'Orodha za rejea' : 'Dictionaries' },
    { id: 'reports', icon: '▥', label: sw ? 'Ripoti' : 'Reports' },
  ];
  const farmTools = [
    { id: 'general', icon: 'ⓘ', label: sw ? 'Taarifa za jumla' : 'General information' },
    { id: 'tasks', icon: '☷', label: sw ? 'Kazi' : 'Tasks' },
    { id: 'guidance', icon: '☰', label: sw ? 'Mwongozo wa kilimo' : 'Farm guidance' },
    { id: 'weather', icon: '☼', label: sw ? 'Hali ya hewa' : 'Weather' },
    { id: 'satellite', icon: '⌁', label: sw ? 'Picha za satelaiti' : 'Satellite images' },
    { id: 'soil-analysis', icon: '♧', label: sw ? 'Uchambuzi wa udongo' : 'Soil analysis' },
    { id: 'prescription-maps', icon: '▧', label: sw ? 'Ramani za mapendekezo' : 'Prescription maps' },
    { id: 'application-maps', icon: '▨', label: sw ? 'Ramani za matumizi' : 'Application maps' },
    { id: 'yield-maps', icon: '▧', label: sw ? 'Ramani za mavuno' : 'Yield maps' },
    { id: 'compare-maps', icon: '▤', label: sw ? 'Linganisha ramani' : 'Compare maps' },
    { id: 'notes', icon: '✎', label: sw ? 'Vidokezo' : 'Notes' },
    { id: 'farm-report', icon: '▥', label: sw ? 'Ripoti ya shamba' : 'Farm report' },
  ];
  const sectionLabel = [...primaryNav, ...farmTools].find((item) => item.id === activeSection)?.label
    ?? (activeSection === 'notifications' ? (sw ? 'Arifa' : 'Notifications')
      : activeSection === 'profile' ? (sw ? 'Wasifu' : 'Profile')
      : activeSection === 'support' ? (sw ? 'Usaidizi' : 'Support')
      : 'Weather');

  function renderSection() {
    switch (activeSection) {
      case 'weather':
        return (
          <WeatherWorkspace
            lang={lang} county={county} lat={lat} lon={lon} gpsBusy={gpsBusy} busy={busy} result={result}
            onCounty={chooseCounty} onGps={useGps} onLat={(v) => { setLat(v); setCounty(''); }}
            onLon={(v) => { setLon(v); setCounty(''); }} onLoad={submit}
          />
        );

      case 'dashboard':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano — itabadilishwa na data halisi.' : 'Seed data — will be replaced by live data.'}</div>
            <div className="dash-kpis">
              <div className="kpi"><span className="kpi-val">{FARM_REPORT.summary.totalActiveCycles}</span><span className="kpi-label">{sw ? 'Mizunguko inayoendelea' : 'Active cycles'}</span></div>
              <div className="kpi"><span className="kpi-val">{FARM_REPORT.summary.plantedHa} ha</span><span className="kpi-label">{sw ? 'Aina ya kupanda' : 'Planted'}</span></div>
              <div className="kpi"><span className="kpi-val">{FARM_REPORT.summary.openTasks}</span><span className="kpi-label">{sw ? 'Kazi wazi' : 'Open tasks'}</span></div>
              <div className="kpi kpi-warn"><span className="kpi-val">{FARM_REPORT.summary.lowStockItems.length}</span><span className="kpi-label">{sw ? 'Hisa chini' : 'Low stock'}</span></div>
            </div>
            <div className="dash-cols">
              <section className="card seed-card">
                <h3>{sw ? 'Kazi za hivi karibuni' : 'Recent tasks'}</h3>
                <table className="seed-table">
                  <tbody>
                    {TASKS.slice(0, 5).map((task) => (
                      <tr key={task.id}>
                        <td><span className={`pill pill-${task.status}`}>{task.status}</span></td>
                        <td>{task.title}</td>
                        <td className="muted">{task.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="link-btn" onClick={() => setActiveSection('tasks')}>{sw ? 'Ona kazi zote →' : 'See all tasks →'}</button>
              </section>
              <section className="card seed-card">
                <h3>{sw ? 'Hisa za dharura' : 'Stock alerts'}</h3>
                {INVENTORY.filter((i) => i.quantity <= i.minStock).map((item) => (
                  <div key={item.id} className="alert-row">
                    <span className="pill pill-overdue">⚠ Low</span>
                    <div><strong>{item.name}</strong><br /><span className="muted">{item.quantity} {item.unit} (min {item.minStock})</span></div>
                  </div>
                ))}
                <button className="link-btn" onClick={() => setActiveSection('warehouse')}>{sw ? 'Fungua ghala →' : 'Open warehouse →'}</button>
              </section>
            </div>
            {result && (
              <>
                <ResultCard result={result} lang={lang} savedFrom={savedFrom} onAdd={focusField} />
                <p className="disclaimer">{T('disclaimer')}</p>
              </>
            )}
            {!result && (
              <div className="dash-hint card">
                <span>☼</span>
                <div>
                  <strong>{sw ? 'Pata ushauri wa hali ya hewa' : 'Get a weather advisory'}</strong>
                  <p>{sw ? 'Nenda kwenye Hali ya hewa au Mwongozo wa kilimo kupata ushauri maalum.' : 'Go to Weather or Farm guidance to get a crop or livestock advisory.'}</p>
                </div>
                <button className="secondary" onClick={() => setActiveSection('guidance')}>{sw ? 'Mwongozo' : 'Guidance'}</button>
              </div>
            )}
          </div>
        );

      case 'cycles':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <section className="card seed-card">
              <div className="seed-card-header"><h3>{sw ? 'Mizunguko ya kilimo' : 'Crop cycles'}</h3><span className="muted">{CYCLES.length} {sw ? 'jumla' : 'total'}</span></div>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Shamba' : 'Field'}</th><th>{sw ? 'Zao' : 'Crop'}</th><th>{sw ? 'Msimu' : 'Season'}</th><th>{sw ? 'Kupanda' : 'Planted'}</th><th>{sw ? 'Mavuno' : 'Harvest'}</th><th>{sw ? 'Mazao (kg)' : 'Yield (kg)'}</th><th>{sw ? 'Hali' : 'Status'}</th></tr></thead>
                <tbody>
                  {CYCLES.map((c: Cycle) => (
                    <tr key={c.id}>
                      <td>{c.fieldName}</td>
                      <td>{c.crop} — {c.variety}</td>
                      <td>{c.season}</td>
                      <td>{c.plantedDate}</td>
                      <td>{c.harvestDate ?? '—'}</td>
                      <td>{c.yieldKg != null ? c.yieldKg.toLocaleString() : '—'}</td>
                      <td><span className={`pill pill-${c.status}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        );

      case 'fields':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <div className="fields-grid">
              {FIELDS.map((f) => (
                <section key={f.id} className="card field-card">
                  <div className="field-icon">⌖</div>
                  <div>
                    <strong>{f.name}</strong>
                    <span className="muted"> · {f.ha} ha · {f.soil}</span>
                  </div>
                  <table className="seed-table">
                    <tbody>
                      <tr><td className="muted">{sw ? 'Zao la sasa' : 'Current crop'}</td><td>{f.currentCrop || '—'}</td></tr>
                      <tr><td className="muted">{sw ? 'Tarehe ya kupanda' : 'Planted'}</td><td>{f.plantedDate ?? '—'}</td></tr>
                      <tr><td className="muted">{sw ? 'Mavuno yanayotarajiwa' : 'Expected harvest'}</td><td>{f.expectedHarvestDate ?? '—'}</td></tr>
                    </tbody>
                  </table>
                  {f.notes && <p className="muted small" style={{ marginTop: 6 }}>📝 {f.notes}</p>}
                </section>
              ))}
            </div>
          </div>
        );

      case 'equipment':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <section className="card seed-card">
              <div className="seed-card-header"><h3>{sw ? 'Vifaa vya shamba' : 'Farm equipment'}</h3><span className="muted">{EQUIPMENT.length} {sw ? 'vipande' : 'items'}</span></div>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Jina' : 'Name'}</th><th>{sw ? 'Aina' : 'Type'}</th><th>{sw ? 'Hali' : 'Status'}</th><th>{sw ? 'Huduma ya mwisho' : 'Last service'}</th><th>{sw ? 'Huduma ijayo' : 'Next service'}</th><th>{sw ? 'Maelezo' : 'Notes'}</th></tr></thead>
                <tbody>
                  {EQUIPMENT.map((eq) => (
                    <tr key={eq.id}>
                      <td><strong>{eq.name}</strong></td>
                      <td>{eq.type}</td>
                      <td><span className={`pill pill-${eq.status}`}>{eq.status}</span></td>
                      <td>{eq.lastServiceDate}</td>
                      <td>{eq.nextServiceDate}</td>
                      <td className="muted small">{eq.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        );

      case 'workers':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <section className="card seed-card">
              <div className="seed-card-header"><h3>{sw ? 'Wafanyakazi' : 'Workers'}</h3><span className="muted">{WORKERS.filter((w: Worker) => w.status === 'active').length} {sw ? 'wanaofanya kazi' : 'active'}</span></div>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Jina' : 'Name'}</th><th>{sw ? 'Wajibu' : 'Role'}</th><th>{sw ? 'Simu' : 'Phone'}</th><th>{sw ? 'Kazi ya sasa' : 'Current task'}</th><th>{sw ? 'Hali' : 'Status'}</th></tr></thead>
                <tbody>
                  {WORKERS.map((w: Worker) => (
                    <tr key={w.id}>
                      <td><strong>{w.name}</strong></td>
                      <td>{w.role}</td>
                      <td className="muted">{w.phone}</td>
                      <td>{w.currentTask ?? '—'}</td>
                      <td><span className={`pill pill-${w.status}`}>{w.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        );

      case 'warehouse':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <section className="card seed-card">
              <div className="seed-card-header"><h3>{sw ? 'Hisa za ghala' : 'Warehouse inventory'}</h3><span className="muted">{INVENTORY.length} {sw ? 'bidhaa' : 'items'}</span></div>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Bidhaa' : 'Item'}</th><th>{sw ? 'Aina' : 'Category'}</th><th>{sw ? 'Kiasi' : 'Qty'}</th><th>{sw ? 'Kiwango cha chini' : 'Min'}</th><th>{sw ? 'Eneo' : 'Location'}</th><th>{sw ? 'Muda wa kuisha' : 'Expiry'}</th></tr></thead>
                <tbody>
                  {INVENTORY.map((item: InventoryItem) => (
                    <tr key={item.id} className={item.quantity <= item.minStock ? 'row-warn' : ''}>
                      <td><strong>{item.name}</strong>{item.quantity <= item.minStock && <span className="pill pill-overdue" style={{ marginLeft: 6 }}>⚠ Low</span>}</td>
                      <td>{item.category}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td className="muted">{item.minStock} {item.unit}</td>
                      <td className="muted">{item.location}</td>
                      <td className="muted">{item.expiryDate ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        );

      case 'dictionaries':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya kumbukumbu.' : 'Reference data.'}</div>
            <section className="card seed-card">
              <h3>{sw ? 'Mazao' : 'Crops'}</h3>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Jina' : 'Name'}</th><th>{sw ? 'Familia' : 'Family'}</th><th>{sw ? 'Ukomavu' : 'Maturity'}</th><th>{sw ? 'Wadudu wakuu' : 'Main pests'}</th><th>{sw ? 'Magonjwa makuu' : 'Main diseases'}</th></tr></thead>
                <tbody>
                  {DICTIONARIES.crops.map((c) => (
                    <tr key={c.name}><td><strong>{c.name}</strong><br /><span className="muted">{c.swName}</span></td><td>{c.family}</td><td>{c.typicalMaturity}</td><td>{c.mainPests}</td><td>{c.mainDiseases}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card seed-card">
              <h3>{sw ? 'Mwongozo wa mbolea' : 'Fertiliser guide'}</h3>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Virutubisho' : 'Nutrient'}</th><th>{sw ? 'Kazi' : 'Role'}</th><th>{sw ? 'Upungufu' : 'Deficiency signs'}</th><th>{sw ? 'Vyanzo' : 'Sources'}</th></tr></thead>
                <tbody>
                  {DICTIONARIES.fertilizerGuide.map((f) => (
                    <tr key={f.nutrient}><td><strong>{f.nutrient}</strong></td><td>{f.role}</td><td>{f.deficiency}</td><td>{f.source}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card seed-card">
              <h3>{sw ? 'Wadudu wa kawaida' : 'Common pests'}</h3>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Mdudu' : 'Pest'}</th><th>{sw ? 'Mazao' : 'Crops'}</th><th>{sw ? 'Dalili' : 'Signs'}</th><th>{sw ? 'Udhibiti' : 'Control'}</th></tr></thead>
                <tbody>
                  {DICTIONARIES.pests.map((p) => (
                    <tr key={p.name}><td><strong>{p.name}</strong></td><td>{p.affectedCrops}</td><td>{p.signs}</td><td>{p.control}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        );

      case 'reports':
        return <FarmReportSection lang={lang} onNav={setActiveSection} />;

      case 'general':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <section className="card seed-card">
              <h3>{sw ? 'Taarifa za shamba' : 'Farm details'}</h3>
              <table className="seed-table">
                <tbody>
                  <tr><td className="muted">{sw ? 'Jina' : 'Name'}</td><td><strong>{FARM.name}</strong></td></tr>
                  <tr><td className="muted">{sw ? 'Mmiliki' : 'Owner'}</td><td>{FARM.owner}</td></tr>
                  <tr><td className="muted">{sw ? 'Kaunti' : 'County'}</td><td>{FARM.county}</td></tr>
                  <tr><td className="muted">{sw ? 'Mwinuko' : 'Elevation'}</td><td>{FARM.elevationM} m</td></tr>
                  <tr><td className="muted">{sw ? 'Eneo' : 'Location'}</td><td>{FARM.lat}°, {FARM.lon}°</td></tr>
                  <tr><td className="muted">{sw ? 'Jumla ya hekta' : 'Total area'}</td><td>{FARM.totalHa} ha</td></tr>
                  <tr><td className="muted">{sw ? 'Alisajiliwa' : 'Registered'}</td><td>{FARM.registeredAt}</td></tr>
                </tbody>
              </table>
            </section>
            <section className="card seed-card">
              <h3>{sw ? 'Muhtasari wa msimu' : 'Season at a glance'}</h3>
              <div className="dash-kpis">
                <div className="kpi"><span className="kpi-val">{FARM_REPORT.summary.totalActiveCycles}</span><span className="kpi-label">{sw ? 'Mizunguko' : 'Active cycles'}</span></div>
                <div className="kpi"><span className="kpi-val">{FARM_REPORT.summary.plantedHa} ha</span><span className="kpi-label">{sw ? 'Imepandwa' : 'Planted'}</span></div>
                <div className="kpi"><span className="kpi-val">{FARM_REPORT.summary.fallowHa} ha</span><span className="kpi-label">{sw ? 'Mapumziko' : 'Fallow'}</span></div>
                <div className="kpi"><span className="kpi-val">{WORKERS.filter((w: Worker) => w.status === 'active').length}</span><span className="kpi-label">{sw ? 'Wafanyakazi' : 'Workers'}</span></div>
              </div>
              {FARM_REPORT.notes && <p className="muted small" style={{ marginTop: 8 }}>📝 {FARM_REPORT.notes}</p>}
            </section>
          </div>
        );

      case 'tasks':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with database.'}</div>
            <section className="card seed-card">
              <div className="seed-card-header"><h3>{sw ? 'Kazi' : 'Tasks'}</h3><span className="muted">{TASKS.filter((tk: Task) => tk.status !== 'done').length} {sw ? 'wazi' : 'open'}</span></div>
              {(['high', 'medium', 'low'] as const).map((pri) => {
                const group = TASKS.filter((tk: Task) => tk.priority === pri);
                if (!group.length) return null;
                return (
                  <div key={pri}>
                    <p className="group-heading">{pri === 'high' ? (sw ? '🔴 Kipaumbele cha juu' : '🔴 High priority') : pri === 'medium' ? (sw ? '🟡 Wastani' : '🟡 Medium priority') : (sw ? '🟢 Chini' : '🟢 Low priority')}</p>
                    <table className="seed-table full">
                      <tbody>
                        {group.map((task: Task) => (
                          <tr key={task.id} className={task.status === 'done' ? 'row-done' : ''}>
                            <td><span className={`pill pill-${task.status}`}>{task.status}</span></td>
                            <td><strong>{task.title}</strong>{task.fieldName && <><br /><span className="muted small">{task.fieldName}</span></>}</td>
                            <td className="muted">{task.assignedTo}</td>
                            <td className="muted">{task.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </section>
          </div>
        );

      case 'satellite':
        return (
          <div className="seed-layout">
            <div className="seed-banner api-banner">🔑 {sw ? 'Picha halisi zinahitaji ufunguo wa API wa Planet au Sentinel. Data hapa ni ya mfano.' : 'Real imagery requires a Planet or Sentinel API key. Data shown is placeholder.'}</div>
            {SATELLITE_IMAGES.map((img) => (
              <section key={img.id} className="card seed-card">
                <div className="seed-card-header">
                  <h3>{img.fieldName}</h3>
                  <span className="source-chip">{img.source}</span>
                  <span className="muted">{img.date}</span>
                </div>
                <div className="ndvi-bar-group">
                  <NdviBar label="Min NDVI" value={img.ndviMin} />
                  <NdviBar label="Mean NDVI" value={img.ndviMean} />
                  <NdviBar label="Max NDVI" value={img.ndviMax} />
                </div>
                <div className="img-placeholder">
                  <span>🛰</span>
                  <p>{sw ? 'Picha itaonekana hapa baada ya ufunguo wa API kuunganishwa.' : 'Satellite image will display here once an API key is connected.'}</p>
                </div>
                {img.notes && <p className="muted small" style={{ marginTop: 6 }}>📝 {img.notes}</p>}
              </section>
            ))}
          </div>
        );

      case 'soil-analysis':
        return (
          <div className="seed-layout">
            <div className="seed-banner api-banner">🔑 {sw ? 'Data halisi inahitaji ufunguo wa API wa iSDAsoil. Data hapa ni ya mfano.' : 'Live data requires an iSDAsoil API key. Values shown are illustrative.'}</div>
            {SOIL_ANALYSIS.fields.map((f) => (
              <section key={f.fieldId} className="card seed-card">
                <div className="seed-card-header"><h3>{f.fieldName}</h3></div>
                {f.ph == null ? (
                  <p className="muted">{sw ? 'Sampuli inasubiriwa.' : 'Sample pending.'}</p>
                ) : (
                  <div className="soil-grid">
                    <div className="soil-stat"><span className="soil-val">{f.ph}</span><span className="soil-label">pH</span></div>
                    <div className="soil-stat"><span className="soil-val">{f.om}%</span><span className="soil-label">OM</span></div>
                    <div className="soil-stat"><span className="soil-val">{f.nitrogen}%</span><span className="soil-label">N</span></div>
                    <div className="soil-stat"><span className="soil-val">{f.phosphorus} ppm</span><span className="soil-label">P</span></div>
                    <div className="soil-stat"><span className="soil-val">{f.potassium} ppm</span><span className="soil-label">K</span></div>
                    <div className="soil-stat"><span className="soil-val">{f.cec}</span><span className="soil-label">CEC</span></div>
                  </div>
                )}
                <p className="muted small"><strong>{sw ? 'Muundo' : 'Texture'}:</strong> {f.texture ?? '—'}</p>
                {f.notes && <p className="muted small">📝 {f.notes}</p>}
              </section>
            ))}
          </div>
        );

      case 'prescription-maps':
        return (
          <div className="seed-layout">
            <div className="seed-banner api-banner">🔑 {sw ? 'Ramani halisi zinahitaji injini ya VRA na data ya hali ya hewa/NDVI.' : 'Live maps require a VRA engine and weather/NDVI data. Zones shown are illustrative.'}</div>
            {PRESCRIPTION_MAPS.map((pr) => (
              <section key={pr.id} className="card seed-card">
                <div className="seed-card-header"><h3>{pr.fieldName} — {pr.type}</h3><span className={`pill pill-${pr.status}`}>{pr.status}</span><span className="muted">{pr.date}</span></div>
                <table className="seed-table full">
                  <thead><tr><th>{sw ? 'Ukanda' : 'Zone'}</th><th>{sw ? 'Kiwango' : 'Rate'}</th><th>% {sw ? 'ya eneo' : 'of area'}</th></tr></thead>
                  <tbody>
                    {pr.zones.map((z, i) => (
                      <tr key={i}><td>{z.zone}</td><td><strong>{z.rate}</strong></td><td>{z.areaPct}%</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="map-placeholder"><span>🗺</span><p>{sw ? 'Ramani ya jiografia itaonekana hapa baada ya API kuunganishwa.' : 'Georeferenced map will appear here once APIs are connected.'}</p></div>
                {pr.notes && <p className="muted small">📝 {pr.notes}</p>}
              </section>
            ))}
          </div>
        );

      case 'application-maps':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Kumbukumbu za matumizi ya pembejeo.' : 'Input application records.'}</div>
            {APPLICATION_MAPS.map((ap) => (
              <section key={ap.id} className="card seed-card">
                <div className="seed-card-header"><h3>{ap.fieldName} — {ap.product}</h3><span className="muted">{ap.date}</span></div>
                <table className="seed-table">
                  <tbody>
                    <tr><td className="muted">{sw ? 'Opereta' : 'Operator'}</td><td>{ap.operator}</td></tr>
                    <tr><td className="muted">{sw ? 'Kiwango' : 'Rate'}</td><td>{ap.rate}</td></tr>
                    <tr><td className="muted">{sw ? 'Jumla iliyotumika' : 'Total used'}</td><td>{ap.totalUsed}</td></tr>
                    <tr><td className="muted">{sw ? 'Vifaa' : 'Equipment'}</td><td>{ap.equipment}</td></tr>
                    <tr><td className="muted">{sw ? 'Hali ya hewa' : 'Weather'}</td><td>{ap.weatherAtTime}</td></tr>
                  </tbody>
                </table>
                {ap.notes && <p className="muted small">📝 {ap.notes}</p>}
              </section>
            ))}
          </div>
        );

      case 'yield-maps':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mavuno ya misimu iliyopita.' : 'Historical yield data from past seasons.'}</div>
            {YIELD_MAPS.map((ym) => (
              <section key={ym.id} className="card seed-card">
                <div className="seed-card-header">
                  <h3>{ym.fieldName} — {ym.crop} ({ym.season})</h3>
                  <span className={ym.yieldKgHa >= ym.avgYieldBenchmarkKgHa ? 'pill pill-active' : 'pill pill-maintenance'}>
                    {ym.yieldKgHa} kg/ha vs {ym.avgYieldBenchmarkKgHa} benchmark
                  </span>
                </div>
                <div className="dash-kpis" style={{ marginBottom: 12 }}>
                  <div className="kpi"><span className="kpi-val">{ym.yieldKg.toLocaleString()} kg</span><span className="kpi-label">{sw ? 'Jumla' : 'Total yield'}</span></div>
                  <div className="kpi"><span className="kpi-val">{ym.yieldKgHa} kg/ha</span><span className="kpi-label">{sw ? 'Kwa hekta' : 'Per hectare'}</span></div>
                </div>
                <table className="seed-table full">
                  <thead><tr><th>{sw ? 'Ukanda' : 'Zone'}</th><th>kg/ha</th><th>% {sw ? 'ya eneo' : 'of area'}</th></tr></thead>
                  <tbody>
                    {ym.zones.map((z, i) => <tr key={i}><td>{z.zone}</td><td><strong>{z.yieldKgHa}</strong></td><td>{z.areaPct}%</td></tr>)}
                  </tbody>
                </table>
                {ym.notes && <p className="muted small">📝 {ym.notes}</p>}
              </section>
            ))}
          </div>
        );

      case 'compare-maps':
        return (
          <div className="seed-layout">
            <div className="seed-banner api-banner">🔑 {sw ? 'Ulinganisho wa ramani unahitaji data ya NDVI na mavuno kutoka kwa API.' : 'Map comparison requires NDVI and yield data from connected APIs.'}</div>
            <section className="card seed-card">
              <h3>{sw ? 'Ulinganisho wa NDVI na mavuno' : 'NDVI vs. yield comparison'}</h3>
              <table className="seed-table full">
                <thead><tr><th>{sw ? 'Shamba' : 'Field'}</th><th>NDVI {sw ? 'wastani' : 'mean'}</th><th>{sw ? 'Mavuno (kg/ha)' : 'Yield (kg/ha)'}</th><th>{sw ? 'Msimu' : 'Season'}</th></tr></thead>
                <tbody>
                  {SATELLITE_IMAGES.map((img) => {
                    const ym = YIELD_MAPS.find((y) => y.fieldId === img.fieldId);
                    return (
                      <tr key={img.id}>
                        <td>{img.fieldName}</td>
                        <td>{img.ndviMean.toFixed(2)}</td>
                        <td>{ym ? ym.yieldKgHa : '—'}</td>
                        <td>{ym?.season ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="map-placeholder"><span>📊</span><p>{sw ? 'Mchoro wa ulinganisho utaonekana hapa.' : 'Comparison chart will appear here once APIs are connected.'}</p></div>
            </section>
          </div>
        );

      case 'notes':
        return (
          <div className="seed-layout">
            <section className="card seed-card">
              <h3>{sw ? 'Vidokezo vya shamba' : 'Farm notes'}</h3>
              <div className="note-compose">
                <textarea
                  placeholder={sw ? 'Andika kidokezo kipya...' : 'Write a new note...'}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <button
                  className="primary"
                  style={{ width: 'auto', marginTop: 6 }}
                  onClick={() => {
                    if (!noteText.trim()) return;
                    alert(sw ? 'Kidokezo kimehifadhiwa (mfano tu — hifadhi halisi itahitaji API ya hifadhidata).' : 'Note saved (prototype only — real persistence requires a database API).');
                    setNoteText('');
                  }}
                >{sw ? 'Hifadhi' : 'Save note'}</button>
              </div>
            </section>
            {NOTES.map((note: Note) => (
              <section key={note.id} className="card seed-card note-card">
                <div className="note-meta"><strong>{note.author}</strong><span className="muted"> · {note.date}</span>{note.fieldName && <span className="pill pill-active" style={{ marginLeft: 6 }}>{note.fieldName}</span>}</div>
                <p style={{ margin: '6px 0 0' }}>{note.text}</p>
              </section>
            ))}
          </div>
        );

      case 'farm-report':
        return <FarmReportSection lang={lang} onNav={setActiveSection} />;

      case 'notifications':
        return (
          <div className="seed-layout">
            <section className="card seed-card">
              <div className="seed-card-header">
                <h3>{sw ? 'Arifa' : 'Notifications'}</h3>
                <button className="link-btn" onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}>{sw ? 'Zifanye zote zimesomwa' : 'Mark all as read'}</button>
              </div>
              {notifications.length === 0 && <p className="muted">{sw ? 'Hakuna arifa.' : 'No notifications.'}</p>}
              {notifications.map((n) => (
                <div key={n.id} className={`notif-row ${n.read ? 'notif-read' : ''}`} onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}>
                  <span className={`notif-dot ${n.type}`} />
                  <div>
                    <strong>{n.title}</strong>
                    <p className="muted small" style={{ margin: '2px 0 0' }}>{n.body}</p>
                    <span className="muted small">{new Date(n.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        );

      case 'profile':
        return (
          <div className="seed-layout">
            <div className="seed-banner">{sw ? 'Data ya mfano.' : 'Seed data — replace with auth system.'}</div>
            <section className="card seed-card">
              <div className="profile-header">
                <div className="profile-avatar">{FARM.owner.split(' ').map((n) => n[0]).join('')}</div>
                <div><h3 style={{ margin: 0 }}>{FARM.owner}</h3><p className="muted small">{FARM.name} · {FARM.county}</p></div>
              </div>
              <table className="seed-table" style={{ marginTop: 12 }}>
                <tbody>
                  <tr><td className="muted">{sw ? 'Kaunti' : 'County'}</td><td>{FARM.county}</td></tr>
                  <tr><td className="muted">{sw ? 'Mwinuko' : 'Elevation'}</td><td>{FARM.elevationM} m asl</td></tr>
                  <tr><td className="muted">{sw ? 'Lugha' : 'Language'}</td><td>{lang === 'sw' ? 'Kiswahili' : 'English'}</td></tr>
                  <tr><td className="muted">{sw ? 'Toleo' : 'App version'}</td><td>prototype-0.1</td></tr>
                </tbody>
              </table>
              <p className="muted small" style={{ marginTop: 12 }}>🔑 {sw ? 'Usimamizi wa akaunti na uthibitishaji utaongezwa baadaye.' : 'Account management and authentication will be added in a future release.'}</p>
            </section>
          </div>
        );

      case 'support':
        return (
          <div className="seed-layout">
            <section className="card seed-card">
              <h3>{sw ? 'Usaidizi' : 'Support'}</h3>
              <p>{sw ? 'Hii ni toleo la majaribio la AgriForecast. Kwa maswali, wasiliana na timu ya mradi.' : 'This is a prototype version of AgriForecast. For questions, contact the project team.'}</p>
              <table className="seed-table" style={{ marginTop: 12 }}>
                <tbody>
                  <tr><td className="muted">{sw ? 'Toleo' : 'Version'}</td><td>prototype-0.1</td></tr>
                  <tr><td className="muted">{sw ? 'Hali ya hewa' : 'Weather data'}</td><td>Open-Meteo (free tier)</td></tr>
                  <tr><td className="muted">{sw ? 'Udongo' : 'Soil data'}</td><td>iSDAsoil (API key needed)</td></tr>
                  <tr><td className="muted">{sw ? 'Picha za satelaiti' : 'Satellite imagery'}</td><td>Sentinel-2 / Planet (API key needed)</td></tr>
                  <tr><td className="muted">{sw ? 'Kanuni za ushauri' : 'Advisory rules'}</td><td>Placeholder — pending KALRO validation</td></tr>
                </tbody>
              </table>
              <div className="notice" style={{ marginTop: 12 }}>
                {sw ? '⚠ Usitegemee ushauri huu kwa maamuzi halisi ya shamba mpaka kanuni zithibitishwe na KALRO na wataalam wa ugani.' : '⚠ Do not rely on this advisory for real farm decisions until rules are validated by KALRO and extension experts.'}
              </div>
            </section>
          </div>
        );

      case 'guidance':
        return (
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
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <section className="card">
                <h2>{T('step3')}</h2>
                {needsCrop && <>
                  <label htmlFor="f-crop">{T('crop')}</label><select id="f-crop" value={crop} onChange={(e) => setCrop(e.target.value)}><option value="">{T('notSure')}</option>{(['maize', 'beans', 'potato', 'sorghum'] as const).map((c) => <option key={c} value={c}>{sw ? { maize: 'Mahindi', beans: 'Maharagwe', potato: 'Viazi', sorghum: 'Mtama' }[c] : c[0].toUpperCase() + c.slice(1)}</option>)}</select>
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
                <button type="submit" className="primary" disabled={busy}>{busy ? T('loading') : T('getAdvice')}</button>
              </section>
            </form>
            {result && <ResultCard result={result} lang={lang} savedFrom={savedFrom} onAdd={focusField} />}
            <p className="disclaimer">{T('disclaimer')}</p>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <main className="farm-workspace">
      <aside className="primary-sidebar" aria-label="Main navigation">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">a</div>
          <div className="brand-name">Agri<span>Forecast</span></div>
          <button className="icon-button menu-toggle" aria-label="Menu" onClick={() => setActiveSection(activeSection === 'guidance' ? 'weather' : 'guidance')}>☰</button>
        </div>
        <button className="farm-switcher" onClick={() => setActiveSection('general')}>
          <span className="farm-avatar">AF</span><span>{sw ? 'Shamba la majaribio' : 'Demo training farm'}</span><span className="chevron">⌄</span>
        </button>
        <nav className="main-nav">
          {primaryNav.map((item) => (
            <button key={item.id} className={`nav-item ${activeSection === item.id ? 'selected' : ''}`} onClick={() => setActiveSection(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setActiveSection('support')}><span className="nav-icon">?</span>{sw ? 'Usaidizi' : 'Support'}</button>
          <button className="nav-item" onClick={() => setActiveSection('notifications')}>
            <span className="nav-icon">🔔</span>{sw ? 'Arifa' : 'Notifications'}
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <button className="nav-item" onClick={() => setActiveSection('profile')}><span className="nav-icon">♙</span>{sw ? 'Wasifu' : 'Profile'}</button>
          <div className="lang lang-sidebar" role="group" aria-label="Language">
            <span className="nav-icon">◎</span>
            <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
            <button aria-pressed={lang === 'sw'} onClick={() => setLang('sw')}>Kiswahili</button>
          </div>
        </div>
      </aside>

      <aside className="farm-sidebar" aria-label="Farm tools">
        <div className="farm-heading">
          <div><strong>{sw ? 'Shamba la majaribio' : 'Demo training farm'}</strong><small>{county || (sw ? 'Ongeza kaunti' : 'Add a county')}</small></div>
          <span className="chevron">⌄</span>
        </div>
        <nav className="tool-nav">
          {farmTools.map((item) => (
            <button key={item.id} className={`tool-item ${activeSection === item.id ? 'selected' : ''}`} onClick={() => setActiveSection(item.id)}>
              <span className="tool-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="farm-sidebar-footer">
          <button aria-label="Collapse farm menu">‹</button>
          <button aria-label="More farm options">⋮</button>
        </div>
      </aside>

      <section className="workspace-content">
        <header className="content-header">
          <div>
            <p className="eyebrow">AGRI FORECAST · {county || (sw ? 'SHAMBA LA MAJARIBIO' : 'DEMO FARM')}</p>
            <h1>{sectionLabel}</h1>
          </div>
          <div className="header-actions">
            <div className="lang lang-top" role="group" aria-label="Language">
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
              <button aria-pressed={lang === 'sw'} onClick={() => setLang('sw')}>SW</button>
            </div>
            <span className="status-pill"><i />{sw ? 'Mfano' : 'Prototype'}</span>
          </div>
        </header>

        {message && <div className={`notice ${message.kind === 'error' ? 'error' : ''}`} role="alert">{message.text}</div>}

        {renderSection()}
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Farm report section (shared by 'reports' and 'farm-report')
// ---------------------------------------------------------------------------
function FarmReportSection({ lang, onNav }: { lang: Lang; onNav: (s: string) => void }) {
  const sw = lang === 'sw';
  const r = FARM_REPORT;
  return (
    <div className="seed-layout">
      <div className="seed-banner">{sw ? 'Ripoti ya msimu wa sasa.' : 'Current season farm report.'}</div>
      <section className="card seed-card">
        <div className="seed-card-header"><h3>{sw ? `Ripoti — ${r.season}` : `Report — ${r.season}`}</h3><span className="muted">{sw ? 'Imetolewa' : 'Generated'}: {new Date(r.generatedAt).toLocaleDateString()}</span></div>
        <div className="dash-kpis">
          <div className="kpi"><span className="kpi-val">{r.summary.totalActiveCycles}</span><span className="kpi-label">{sw ? 'Mizunguko' : 'Active cycles'}</span></div>
          <div className="kpi"><span className="kpi-val">{r.summary.plantedHa} ha</span><span className="kpi-label">{sw ? 'Imepandwa' : 'Planted'}</span></div>
          <div className="kpi"><span className="kpi-val">{r.summary.fallowHa} ha</span><span className="kpi-label">{sw ? 'Mapumziko' : 'Fallow'}</span></div>
          <div className="kpi"><span className="kpi-val">{r.summary.openTasks}</span><span className="kpi-label">{sw ? 'Kazi wazi' : 'Open tasks'}</span></div>
        </div>
      </section>
      <div className="dash-cols">
        <section className="card seed-card">
          <h3>{sw ? 'Vifaa vinavyohitaji umakini' : 'Equipment needing attention'}</h3>
          <ul className="simple-list">{r.summary.equipmentNeedingAttention.map((e, i) => <li key={i}>⚠ {e}</li>)}</ul>
          <button className="link-btn" onClick={() => onNav('equipment')}>{sw ? 'Ona vifaa →' : 'View equipment →'}</button>
        </section>
        <section className="card seed-card">
          <h3>{sw ? 'Hisa chini' : 'Low stock items'}</h3>
          <ul className="simple-list">{r.summary.lowStockItems.map((s, i) => <li key={i}>⚠ {s}</li>)}</ul>
          <button className="link-btn" onClick={() => onNav('warehouse')}>{sw ? 'Fungua ghala →' : 'Open warehouse →'}</button>
        </section>
      </div>
      <section className="card seed-card">
        <h3>{sw ? 'Mavuno ya mwaka uliopita (kg/ha)' : 'Last season yield (kg/ha)'}</h3>
        <table className="seed-table">
          <tbody>
            {Object.entries(r.lastYearYieldKgHa).map(([crop, val]) => (
              <tr key={crop}><td className="muted">{crop[0].toUpperCase() + crop.slice(1)}</td><td><strong>{val} kg/ha</strong></td></tr>
            ))}
          </tbody>
        </table>
        <button className="link-btn" onClick={() => onNav('yield-maps')}>{sw ? 'Ona ramani za mavuno →' : 'View yield maps →'}</button>
      </section>
      {r.notes && <p className="muted small">📝 {r.notes}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NDVI bar helper
// ---------------------------------------------------------------------------
function NdviBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const colour = value >= 0.6 ? '#2f6b2f' : value >= 0.4 ? '#8a6d00' : '#b42318';
  return (
    <div className="ndvi-row">
      <span className="ndvi-label">{label}</span>
      <div className="ndvi-track"><div className="ndvi-fill" style={{ width: `${pct}%`, background: colour }} /></div>
      <span className="ndvi-val">{value.toFixed(2)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WeatherWorkspace
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// WeatherAdvicePreview
// ---------------------------------------------------------------------------
function WeatherAdvicePreview({ result, lang }: { result: ApiResult; lang: Lang }) {
  const advice = result.advice;
  const headline = advice.headline[lang];
  const reason = advice.reasons[0]?.[lang];
  return <section className="advice-preview card"><div className="advice-symbol">✦</div><div><p className="eyebrow">{lang === 'sw' ? 'USHAURI WA SHAMBA' : 'FARM ADVISORY'}</p><h2>{headline}</h2>{reason && <p>{reason}</p>}</div><span className={`badge lvl-${advice.level}`}>{advice.level}</span></section>;
}

// ---------------------------------------------------------------------------
// ResultCard
// ---------------------------------------------------------------------------
function ResultCard({ result, lang, savedFrom, onAdd }: { result: ApiResult; lang: Lang; savedFrom: string | null; onAdd: (f: string) => void }) {
  const a = result.advice;
  const T = (k: string) => t(k, lang);
  const L = (b: Bi) => b[lang];
  const confRank = a.confidence === 'high' ? 3 : a.confidence === 'medium' ? 2 : 1;
  const confLabel = a.confidence === 'high' ? T('high') : a.confidence === 'medium' ? T('mediumC') : T('low');
  const fLabel = (f: string) => fieldLabel(f, lang);

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

      {a.reasons.length > 0 && (<><h4>{T('why')}</h4><ul>{a.reasons.map((r, i) => <li key={i}>{L(r)}</li>)}</ul></>)}
      {a.actions.length > 0 && (<><h4>{T('whatToDo')}</h4><ul>{a.actions.map((r, i) => <li key={i}>{L(r)}</li>)}</ul></>)}

      {a.missing.length > 0 && (
        <div className="missing">
          <h4>{T('missingTitle')}</h4>
          <ul>
            {a.missing.map((m) => (
              <li key={m.field}>
                <strong>{fLabel(m.field)}:</strong> {L(m.why)}
                <button type="button" onClick={() => onAdd(m.field)}>{T('addThis')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.wouldChange.length > 0 && (<><h4>{T('wouldChange')}</h4><ul>{a.wouldChange.map((r, i) => <li key={i}>{L(r)}</li>)}</ul></>)}

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

// ---------------------------------------------------------------------------
// WeatherChart
// ---------------------------------------------------------------------------
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
  const chartLabels: Record<string, Bi> = {
    rain: { en: 'Rain (mm)', sw: 'Mvua (mm)' },
    temp: { en: 'Max °C', sw: 'Joto la juu °C' },
    today: { en: 'today', sw: 'leo' },
  };
  const tChart = (k: string) => chartLabels[k]?.[lang] ?? k;
  const todayIdx = today ? days.findIndex((d) => d.date === today) : -1;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tChart('rain') + ', ' + tChart('temp')}>
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
          <text x={x(todayIdx) - bw / 2 + 4} y={padT + 10} fontSize="11" fill="#1d2a1d">{tChart('today')}</text>
        </g>
      )}
      <text x={4} y={padT + 10} fontSize="10" fill="#2f6fb0">{maxRain.toFixed(0)}</text>
      <text x={W - padR + 3} y={padT + 10} fontSize="10" fill="#c2410c">{tMax}°</text>
      <text x={W - padR + 3} y={padT + plotH} fontSize="10" fill="#c2410c">{tMin}°</text>
      <g fontSize="11">
        <rect x={padL} y={H - 16} width={10} height={10} fill="#2f6fb0" />
        <text x={padL + 14} y={H - 7} fill="#1d2a1d">{tChart('rain')}</text>
        <line x1={padL + 120} x2={padL + 136} y1={H - 11} y2={H - 11} stroke="#c2410c" strokeWidth={2} />
        <text x={padL + 140} y={H - 7} fill="#1d2a1d">{tChart('temp')}</text>
      </g>
    </svg>
  );
}
