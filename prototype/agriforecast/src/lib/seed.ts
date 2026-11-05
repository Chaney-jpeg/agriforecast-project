/**
 * Seed data for the AgriForecast prototype.
 *
 * All values here are illustrative placeholders for a fictional "Demo training
 * farm" located near Nakuru, Kenya.  When real APIs are connected (iSDAsoil,
 * satellite imagery, machinery, HR) these objects will be replaced by live
 * responses.  The shape of each object intentionally mirrors what the future
 * backend will return so the UI components need minimal changes.
 */

// ---------------------------------------------------------------------------
// Farm overview
// ---------------------------------------------------------------------------
export const FARM = {
  name: 'Demo Training Farm',
  owner: 'Wanjiku Kamau',
  county: 'Nakuru',
  lat: -0.3031,
  lon: 36.08,
  elevationM: 1890,
  totalHa: 12.5,
  registeredAt: '2024-03-15',
};

// ---------------------------------------------------------------------------
// Fields / plots
// ---------------------------------------------------------------------------
export interface Field {
  id: string;
  name: string;
  ha: number;
  soil: string;
  currentCrop: string;
  plantedDate: string | null;
  expectedHarvestDate: string | null;
  notes: string;
}

export const FIELDS: Field[] = [
  {
    id: 'f1',
    name: 'Upper Hill',
    ha: 3.2,
    soil: 'Loam',
    currentCrop: 'Maize (medium)',
    plantedDate: '2026-09-15',
    expectedHarvestDate: '2027-01-25',
    notes: 'Rocky patch on north edge; avoid heavy machinery.',
  },
  {
    id: 'f2',
    name: 'Valley Floor',
    ha: 4.8,
    soil: 'Clay',
    currentCrop: 'Beans (early)',
    plantedDate: '2026-09-20',
    expectedHarvestDate: '2026-12-10',
    notes: 'Good moisture retention; watch for waterlogging after heavy rain.',
  },
  {
    id: 'f3',
    name: 'South Slope',
    ha: 2.6,
    soil: 'Sandy loam',
    currentCrop: 'Potato (medium)',
    plantedDate: '2026-10-01',
    expectedHarvestDate: '2027-01-15',
    notes: 'Irrigation pipe needs repair at row 14.',
  },
  {
    id: 'f4',
    name: 'Orchard Block',
    ha: 1.9,
    soil: 'Loam',
    currentCrop: 'Fallow / cover crop',
    plantedDate: null,
    expectedHarvestDate: null,
    notes: 'Resting after sorghum. Planned for cabbage next season.',
  },
];

// ---------------------------------------------------------------------------
// Crop cycles
// ---------------------------------------------------------------------------
export interface Cycle {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  variety: string;
  season: string;
  plantedDate: string;
  harvestDate: string | null;
  yieldKg: number | null;
  status: 'planned' | 'active' | 'harvested' | 'failed';
  notes: string;
}

export const CYCLES: Cycle[] = [
  {
    id: 'c1', fieldId: 'f1', fieldName: 'Upper Hill',
    crop: 'Maize', variety: 'DK8031 (medium)', season: 'Long Rains 2026',
    plantedDate: '2026-09-15', harvestDate: null, yieldKg: null,
    status: 'active', notes: 'Good germination, 95% stand count.',
  },
  {
    id: 'c2', fieldId: 'f2', fieldName: 'Valley Floor',
    crop: 'Beans', variety: 'Rosecoco (early)', season: 'Long Rains 2026',
    plantedDate: '2026-09-20', harvestDate: null, yieldKg: null,
    status: 'active', notes: 'Leaf curl noticed on 3 rows — monitoring.',
  },
  {
    id: 'c3', fieldId: 'f3', fieldName: 'South Slope',
    crop: 'Potato', variety: 'Shangi (medium)', season: 'Long Rains 2026',
    plantedDate: '2026-10-01', harvestDate: null, yieldKg: null,
    status: 'active', notes: 'Earthing-up complete.',
  },
  {
    id: 'c4', fieldId: 'f1', fieldName: 'Upper Hill',
    crop: 'Sorghum', variety: 'Gadam', season: 'Short Rains 2025',
    plantedDate: '2025-10-12', harvestDate: '2026-02-28', yieldKg: 1840,
    status: 'harvested', notes: 'Slight lodging from Oct storm; yield still acceptable.',
  },
  {
    id: 'c5', fieldId: 'f2', fieldName: 'Valley Floor',
    crop: 'Maize', variety: 'H614D (late)', season: 'Short Rains 2025',
    plantedDate: '2025-10-05', harvestDate: '2026-03-10', yieldKg: 3240,
    status: 'harvested', notes: 'Best yield on this field so far.',
  },
];

// ---------------------------------------------------------------------------
// Equipment / machinery
// ---------------------------------------------------------------------------
export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'operational' | 'maintenance' | 'repair' | 'retired';
  lastServiceDate: string;
  nextServiceDate: string;
  notes: string;
}

export const EQUIPMENT: Equipment[] = [
  {
    id: 'eq1', name: 'Kubota L3408 Tractor', type: 'Tractor',
    status: 'operational', lastServiceDate: '2026-08-10', nextServiceDate: '2027-02-10',
    notes: 'Oil changed, air filter replaced. Front tyre pressure checked.',
  },
  {
    id: 'eq2', name: '3-Disc Plough', type: 'Tillage',
    status: 'operational', lastServiceDate: '2026-07-20', nextServiceDate: '2027-07-20',
    notes: 'Disc blades sharpened.',
  },
  {
    id: 'eq3', name: 'Boom Sprayer (400 L)', type: 'Crop protection',
    status: 'maintenance', lastServiceDate: '2026-09-01', nextServiceDate: '2026-11-15',
    notes: 'Nozzle set #3 needs replacement before next spray round.',
  },
  {
    id: 'eq4', name: 'Gravity Drip Kit – South Slope', type: 'Irrigation',
    status: 'repair', lastServiceDate: '2026-08-28', nextServiceDate: '2026-11-01',
    notes: 'Main header pipe cracked at field junction. Parts ordered.',
  },
  {
    id: 'eq5', name: 'Hand-held Moisture Meter', type: 'Sensor',
    status: 'operational', lastServiceDate: '2026-10-01', nextServiceDate: '2027-04-01',
    notes: 'Calibrated against oven-dry soil sample.',
  },
];

// ---------------------------------------------------------------------------
// Workers / labour
// ---------------------------------------------------------------------------
export interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  startDate: string;
  status: 'active' | 'inactive';
  currentTask: string | null;
}

export const WORKERS: Worker[] = [
  {
    id: 'w1', name: 'Mwangi Kariuki', role: 'Farm Manager',
    phone: '0712 ••• •••', startDate: '2023-01-10',
    status: 'active', currentTask: 'Supervise earthing-up on South Slope',
  },
  {
    id: 'w2', name: 'Achieng Otieno', role: 'Crop Scout',
    phone: '0733 ••• •••', startDate: '2024-04-01',
    status: 'active', currentTask: 'Weekly disease scouting – all fields',
  },
  {
    id: 'w3', name: 'Kipchoge Rotich', role: 'Tractor Operator',
    phone: '0720 ••• •••', startDate: '2023-06-15',
    status: 'active', currentTask: 'Transport harvested sorghum to store',
  },
  {
    id: 'w4', name: 'Fatuma Hassan', role: 'Irrigation Technician',
    phone: '0741 ••• •••', startDate: '2025-02-01',
    status: 'active', currentTask: 'Drip repair – South Slope',
  },
  {
    id: 'w5', name: 'Samuel Wekesa', role: 'Casual Labourer',
    phone: '—', startDate: '2026-09-01',
    status: 'active', currentTask: 'Weeding – Valley Floor',
  },
];

// ---------------------------------------------------------------------------
// Warehouse / inventory
// ---------------------------------------------------------------------------
export interface InventoryItem {
  id: string;
  name: string;
  category: 'seed' | 'fertiliser' | 'pesticide' | 'produce' | 'equipment' | 'other';
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
  expiryDate: string | null;
  notes: string;
}

export const INVENTORY: InventoryItem[] = [
  {
    id: 'i1', name: 'DK8031 Maize Seed', category: 'seed',
    quantity: 12, unit: 'kg', minStock: 5, location: 'Seed store – shelf A',
    expiryDate: '2027-06-01', notes: 'Keep dry; sealed bags.',
  },
  {
    id: 'i2', name: 'CAN Fertiliser (26-0-0)', category: 'fertiliser',
    quantity: 250, unit: 'kg', minStock: 50, location: 'Input store – bin 1',
    expiryDate: null, notes: 'For top-dressing maize at 6 weeks.',
  },
  {
    id: 'i3', name: 'DAP (18-46-0)', category: 'fertiliser',
    quantity: 80, unit: 'kg', minStock: 50, location: 'Input store – bin 2',
    expiryDate: null, notes: 'Used at planting for beans and potato.',
  },
  {
    id: 'i4', name: 'Ridomil Gold (fungicide)', category: 'pesticide',
    quantity: 2, unit: 'kg', minStock: 1, location: 'Chemical store – shelf B',
    expiryDate: '2027-03-01', notes: 'For potato late blight; follow label rates.',
  },
  {
    id: 'i5', name: 'Emamectin benzoate (insecticide)', category: 'pesticide',
    quantity: 0.5, unit: 'L', minStock: 0.5, location: 'Chemical store – shelf B',
    expiryDate: '2026-12-01', notes: '⚠ At minimum stock — reorder.',
  },
  {
    id: 'i6', name: 'Harvested Sorghum', category: 'produce',
    quantity: 1840, unit: 'kg', minStock: 0, location: 'Main grain store',
    expiryDate: null, notes: 'Moisture: 13.5%. Ready for market or milling.',
  },
  {
    id: 'i7', name: 'Diesel', category: 'other',
    quantity: 120, unit: 'L', minStock: 50, location: 'Fuel tank',
    expiryDate: null, notes: '',
  },
];

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export interface Task {
  id: string;
  title: string;
  fieldId: string | null;
  fieldName: string | null;
  assignedTo: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'done' | 'overdue';
  notes: string;
}

export const TASKS: Task[] = [
  {
    id: 't1', title: 'Repair drip irrigation – South Slope',
    fieldId: 'f3', fieldName: 'South Slope',
    assignedTo: 'Fatuma Hassan', dueDate: '2026-11-01',
    priority: 'high', status: 'in-progress',
    notes: 'Parts expected by Oct 30.',
  },
  {
    id: 't2', title: 'Replace boom sprayer nozzles',
    fieldId: null, fieldName: null,
    assignedTo: 'Kipchoge Rotich', dueDate: '2026-11-10',
    priority: 'high', status: 'pending',
    notes: 'Nozzle set #3 must be replaced before next fungicide application.',
  },
  {
    id: 't3', title: 'Top-dress maize with CAN (Upper Hill)',
    fieldId: 'f1', fieldName: 'Upper Hill',
    assignedTo: 'Mwangi Kariuki', dueDate: '2026-11-05',
    priority: 'medium', status: 'pending',
    notes: 'Apply at 6 weeks — crop is currently at week 7. Do after rain.',
  },
  {
    id: 't4', title: 'Weekly disease scouting – all fields',
    fieldId: null, fieldName: null,
    assignedTo: 'Achieng Otieno', dueDate: '2026-11-08',
    priority: 'medium', status: 'pending',
    notes: 'Pay extra attention to bean leaf curl and potato foliage.',
  },
  {
    id: 't5', title: 'Reorder emamectin benzoate',
    fieldId: null, fieldName: null,
    assignedTo: 'Mwangi Kariuki', dueDate: '2026-11-03',
    priority: 'high', status: 'pending',
    notes: 'Stock at minimum. Order 1 L from AgroChem Nakuru.',
  },
  {
    id: 't6', title: 'Soil sample collection – Orchard Block',
    fieldId: 'f4', fieldName: 'Orchard Block',
    assignedTo: 'Achieng Otieno', dueDate: '2026-11-15',
    priority: 'low', status: 'pending',
    notes: 'Send to soil lab ahead of planned cabbage planting.',
  },
  {
    id: 't7', title: 'Earthing-up – South Slope potatoes',
    fieldId: 'f3', fieldName: 'South Slope',
    assignedTo: 'Samuel Wekesa', dueDate: '2026-10-28',
    priority: 'medium', status: 'done',
    notes: 'Completed on time.',
  },
];

// ---------------------------------------------------------------------------
// Soil analysis (iSDAsoil placeholder — replace with real API response)
// ---------------------------------------------------------------------------
export const SOIL_ANALYSIS = {
  source: 'iSDAsoil (placeholder — connect API key)',
  fetchedAt: '2026-11-05T08:00:00Z',
  fields: [
    {
      fieldId: 'f1', fieldName: 'Upper Hill',
      ph: 6.1, om: 3.2, nitrogen: 0.18, phosphorus: 22, potassium: 180,
      texture: 'Clay loam', cec: 24.5,
      notes: 'pH slightly acidic; lime if below 5.8 on retest.',
    },
    {
      fieldId: 'f2', fieldName: 'Valley Floor',
      ph: 5.8, om: 4.1, nitrogen: 0.22, phosphorus: 18, potassium: 210,
      texture: 'Clay', cec: 31.0,
      notes: 'High OM; reduce N top-dress by 20%. Monitor waterlogging.',
    },
    {
      fieldId: 'f3', fieldName: 'South Slope',
      ph: 6.4, om: 2.1, nitrogen: 0.14, phosphorus: 28, potassium: 145,
      texture: 'Sandy loam', cec: 16.2,
      notes: 'Low OM; consider compost application at land prep.',
    },
    {
      fieldId: 'f4', fieldName: 'Orchard Block',
      ph: null, om: null, nitrogen: null, phosphorus: null, potassium: null,
      texture: null, cec: null,
      notes: 'Sample pending.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Satellite / NDVI (placeholder — replace with real Planet/Sentinel API)
// ---------------------------------------------------------------------------
export const SATELLITE_IMAGES = [
  {
    id: 's1', fieldId: 'f1', fieldName: 'Upper Hill',
    date: '2026-10-28', source: 'Sentinel-2 (placeholder)',
    ndviMin: 0.42, ndviMean: 0.67, ndviMax: 0.81,
    thumbnail: null, // URL will go here when API key is added
    notes: 'NDVI consistent with vegetative growth stage.',
  },
  {
    id: 's2', fieldId: 'f2', fieldName: 'Valley Floor',
    date: '2026-10-28', source: 'Sentinel-2 (placeholder)',
    ndviMin: 0.38, ndviMean: 0.61, ndviMax: 0.74,
    thumbnail: null,
    notes: 'Slight low-NDVI patch in NW corner — possible stress.',
  },
  {
    id: 's3', fieldId: 'f3', fieldName: 'South Slope',
    date: '2026-10-28', source: 'Sentinel-2 (placeholder)',
    ndviMin: 0.35, ndviMean: 0.58, ndviMax: 0.72,
    thumbnail: null,
    notes: 'Lower NDVI near irrigation repair area — expected.',
  },
];

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export interface Note {
  id: string;
  date: string;
  author: string;
  fieldId: string | null;
  fieldName: string | null;
  text: string;
}

export const NOTES: Note[] = [
  {
    id: 'n1', date: '2026-11-04', author: 'Mwangi Kariuki',
    fieldId: 'f2', fieldName: 'Valley Floor',
    text: 'Bean leaf curl affecting ~12% of stand on rows 4–7. Sent photos to extension officer Kamau. Awaiting diagnosis.',
  },
  {
    id: 'n2', date: '2026-11-02', author: 'Achieng Otieno',
    fieldId: 'f3', fieldName: 'South Slope',
    text: 'No signs of late blight despite humid weather last week. Applied Ridomil Gold preventively on Nov 1.',
  },
  {
    id: 'n3', date: '2026-10-31', author: 'Mwangi Kariuki',
    fieldId: null, fieldName: null,
    text: 'Met with NDMA agent. County drought bulletin shows no drought watch for Nakuru currently. Will monitor.',
  },
  {
    id: 'n4', date: '2026-10-25', author: 'Fatuma Hassan',
    fieldId: 'f3', fieldName: 'South Slope',
    text: 'Drip pipe cracked at field junction row 14. Ordered replacement fittings from Nakuru Agri Supplies. ETA Oct 30.',
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export interface AppNotification {
  id: string;
  date: string;
  type: 'alert' | 'info' | 'reminder';
  title: string;
  body: string;
  read: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif1', date: '2026-11-05T07:00:00Z', type: 'alert', read: false,
    title: 'Emamectin at minimum stock',
    body: 'Emamectin benzoate is at 0.5 L — minimum stock level. Reorder before Nov 10 to avoid a gap.',
  },
  {
    id: 'notif2', date: '2026-11-04T06:30:00Z', type: 'reminder', read: false,
    title: 'Top-dress maize reminder',
    body: 'Maize on Upper Hill is at week 7. Top-dressing with CAN is overdue — apply after the next rain.',
  },
  {
    id: 'notif3', date: '2026-11-03T08:15:00Z', type: 'info', read: true,
    title: 'Disease scouting due',
    body: 'Weekly crop scouting round is due. Prioritise Valley Floor beans and South Slope potatoes.',
  },
  {
    id: 'notif4', date: '2026-11-01T09:00:00Z', type: 'info', read: true,
    title: 'Drip irrigation repair in progress',
    body: 'Fatuma Hassan has started the drip pipe repair on South Slope. Expected completion Nov 1.',
  },
];

// ---------------------------------------------------------------------------
// Reference dictionaries
// ---------------------------------------------------------------------------
export const DICTIONARIES = {
  crops: [
    { name: 'Maize', swName: 'Mahindi', family: 'Poaceae', typicalMaturity: '90–150 days', mainPests: 'Stem borer, FAW', mainDiseases: 'Grey leaf spot, Maize streak virus' },
    { name: 'Beans', swName: 'Maharagwe', family: 'Fabaceae', typicalMaturity: '60–90 days', mainPests: 'Bean fly, bruchid', mainDiseases: 'Angular leaf spot, Bean common mosaic virus' },
    { name: 'Potato', swName: 'Viazi', family: 'Solanaceae', typicalMaturity: '80–120 days', mainPests: 'Potato tuber moth, aphids', mainDiseases: 'Late blight, Early blight, BVY' },
    { name: 'Sorghum', swName: 'Mtama', family: 'Poaceae', typicalMaturity: '90–140 days', mainPests: 'Stem borer, shoot fly', mainDiseases: 'Anthracnose, Covered kernel smut' },
  ],
  fertilizerGuide: [
    { nutrient: 'Nitrogen (N)', role: 'Leaf and stem growth', deficiency: 'Yellow older leaves, stunted growth', source: 'CAN, Urea, DAP' },
    { nutrient: 'Phosphorus (P)', role: 'Root development, flowering', deficiency: 'Purple leaves, poor root mass', source: 'DAP, TSP' },
    { nutrient: 'Potassium (K)', role: 'Water regulation, disease resistance', deficiency: 'Leaf scorch on margins', source: 'Muriate of Potash (MOP)' },
  ],
  pests: [
    { name: 'Fall Armyworm (FAW)', affectedCrops: 'Maize, Sorghum', signs: 'Ragged leaf edges, frass in whorl', control: 'Emamectin benzoate, Bt products, early scouting' },
    { name: 'Stem Borer', affectedCrops: 'Maize, Sorghum', signs: 'Dead heart, entry holes in stem', control: 'Carbofuran granules at planting, Bt sprays' },
    { name: 'Potato Tuber Moth', affectedCrops: 'Potato', signs: 'Galleries in tubers, webbing on foliage', control: 'Proper hilling, Bt kurstaki, storage hygiene' },
    { name: 'Bean Fly', affectedCrops: 'Beans', signs: 'Swollen stem base, wilting seedlings', control: 'Seed dressing, early planting, remove infected plants' },
  ],
};

// ---------------------------------------------------------------------------
// Prescription maps (placeholder — will come from VRA / DSS engine)
// ---------------------------------------------------------------------------
export const PRESCRIPTION_MAPS = [
  {
    id: 'pr1', fieldId: 'f1', fieldName: 'Upper Hill', date: '2026-11-01',
    type: 'Fertiliser (CAN top-dress)', status: 'ready',
    zones: [
      { zone: 'A – High NDVI', rate: '80 kg/ha', areaPct: 55 },
      { zone: 'B – Medium NDVI', rate: '100 kg/ha', areaPct: 30 },
      { zone: 'C – Low NDVI', rate: '125 kg/ha', areaPct: 15 },
    ],
    notes: 'API key needed: connect to VRA engine for georeferenced shapefile.',
  },
  {
    id: 'pr2', fieldId: 'f3', fieldName: 'South Slope', date: '2026-11-01',
    type: 'Fungicide (Ridomil Gold)', status: 'ready',
    zones: [
      { zone: 'Full field uniform', rate: '2.5 kg/ha', areaPct: 100 },
    ],
    notes: 'Uniform application; no variable rate zone defined yet.',
  },
];

// ---------------------------------------------------------------------------
// Application maps (actual work records)
// ---------------------------------------------------------------------------
export const APPLICATION_MAPS = [
  {
    id: 'ap1', fieldId: 'f3', fieldName: 'South Slope',
    date: '2026-11-01', operator: 'Kipchoge Rotich',
    product: 'Ridomil Gold', rate: '2.5 kg/ha', totalUsed: '6.5 kg',
    equipment: 'Boom Sprayer (400 L)', weatherAtTime: '22°C, low wind, no rain',
    notes: 'Applied 08:00–10:30. Nozzle #3 reduced output — flagged for repair.',
  },
  {
    id: 'ap2', fieldId: 'f1', fieldName: 'Upper Hill',
    date: '2026-09-16', operator: 'Mwangi Kariuki',
    product: 'DAP (18-46-0)', rate: '50 kg/ha', totalUsed: '160 kg',
    equipment: 'Manual broadcaster', weatherAtTime: '18°C, overcast, light rain',
    notes: 'Applied at planting. Good incorporation.',
  },
];

// ---------------------------------------------------------------------------
// Yield maps
// ---------------------------------------------------------------------------
export const YIELD_MAPS = [
  {
    id: 'ym1', fieldId: 'f1', fieldName: 'Upper Hill',
    season: 'Short Rains 2025', crop: 'Sorghum', yieldKg: 1840,
    yieldKgHa: 575, avgYieldBenchmarkKgHa: 620,
    zones: [
      { zone: 'High yield (north)', yieldKgHa: 660, areaPct: 40 },
      { zone: 'Medium yield (centre)', yieldKgHa: 560, areaPct: 40 },
      { zone: 'Low yield (rocky edge)', yieldKgHa: 420, areaPct: 20 },
    ],
    notes: 'Below benchmark due to lodging. Rocky-edge zone to be excluded from heavy crops.',
  },
  {
    id: 'ym2', fieldId: 'f2', fieldName: 'Valley Floor',
    season: 'Short Rains 2025', crop: 'Maize', yieldKg: 3240,
    yieldKgHa: 675, avgYieldBenchmarkKgHa: 620,
    zones: [
      { zone: 'High yield (centre)', yieldKgHa: 740, areaPct: 60 },
      { zone: 'Medium yield (edges)', yieldKgHa: 570, areaPct: 40 },
    ],
    notes: 'Above benchmark. Good moisture retention of clay soil contributed.',
  },
];

// ---------------------------------------------------------------------------
// Farm report summary (aggregated for the current season)
// ---------------------------------------------------------------------------
export const FARM_REPORT = {
  season: 'Long Rains 2026',
  generatedAt: '2026-11-05T08:00:00Z',
  summary: {
    totalActiveCycles: 3,
    totalFieldsHa: 12.5,
    plantedHa: 10.6,
    fallowHa: 1.9,
    openTasks: 5,
    overdueTasks: 0,
    lowStockItems: ['Emamectin benzoate'],
    equipmentNeedingAttention: ['Boom Sprayer – nozzle', 'Drip irrigation – South Slope'],
  },
  seasonToDateRainMm: null, // Will be filled from weather API
  lastYearYieldKgHa: { maize: 675, sorghum: 575 },
  notes: 'Season progressing well. Priority: irrigation repair and nozzle replacement before next spray round.',
};
