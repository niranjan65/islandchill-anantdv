import React, { useState, useEffect } from 'react';
import { PRODUCTS, BOMS, INITIAL_INVENTORY, INITIAL_WORK_ORDERS } from './data/mockData';
import { frappe } from './services/frappe';
import { generateSecret, verifyTOTP } from './services/totp';
import SupportModule from './modules/SupportModule';
import HRMSModule from './modules/HRMSModule';
import { CONFIG } from './config';
import './App.css';
import logo from "../public/logo.png"
import line1 from "../public/line1.png"
import line2 from "../public/line2.png"


const WORKFLOW_STAGES = [
  { id: 'extraction', name: 'Water Extraction', icon: '🚰', dept: 'Utilities', desc: 'Artesian water drawn from natural Fiji aquifer.', metrics: 'Flow: 120.00 L/min', color: '#0ea5e9', colorRgb: '14, 165, 233', tagline: '100% PURE FIJI SOURCE' },
  { id: 'mixing', name: 'Syrup Mixing', icon: '🧪', dept: 'Production', desc: 'Mixing artesian water, sugars, and concentrates.', metrics: 'Temp: 18.00°C', color: '#f59e0b', colorRgb: '245, 158, 11', tagline: 'MICRO-DIALED CONCENTRATE' },
  { id: 'testing', name: 'Lab QA Testing', icon: '🔬', dept: 'Quality Control', desc: 'Testing pH, Brix value, and microbiological safety.', metrics: 'pH: 6.80 • Brix: 11.20%', color: '#8b5cf6', colorRgb: '139, 92, 246', tagline: 'LAB INSPECTION APPROVED' },
  { id: 'blowing', name: 'Blowing / Prep', icon: '🍾', dept: 'Packaging Prep', desc: 'Blowing preforms to bottles or washing cans.', metrics: 'Output: 240.00 bpm', color: '#6366f1', colorRgb: '99, 102, 241', tagline: 'STERILE HIGH-SPEED FORMING' },
  { id: 'filling', name: 'Filling & Sealing', icon: '⚡', dept: 'Bottling Line', desc: 'Monobloc rotary filling and capping under CO2.', metrics: 'Fill rate: 12,000.00 cph', color: '#ef4444', colorRgb: '239, 68, 68', tagline: 'HERMETIC CO2 PRESSURE FILL' },
  { id: 'warmer', name: 'Warmer Tunnel', icon: '♨️', dept: 'Utilities', desc: 'Warming bottles to prevent condensation.', metrics: 'Temp: 32.00°C', color: '#f97316', colorRgb: '249, 115, 22', tagline: 'CONDENSATION PREVENTED' },
  { id: 'labeling', name: 'Laser labeling', icon: '🏷️', dept: 'Packaging', desc: 'High-speed laser label application & barcode print.', metrics: 'Laser power: 98.00%', color: '#06b6d4', colorRgb: '6, 182, 212', tagline: 'LASER-PRINTED BARCODES' },
  { id: 'final_qc', name: 'Final Inspection', icon: '👁️', dept: 'Quality Control', desc: 'Vision inspection for level checks and seals.', metrics: 'Rejects: 0.02%', color: '#d946ef', colorRgb: '217, 70, 239', tagline: 'VISION SCANNER QC PASS' },
  { id: 'packing', name: 'Hand Packing', icon: '📦', dept: 'Packing Area', desc: 'Cartoning products into box cases (12/24 units).', metrics: 'Output: 500.00 cases/hr', color: '#ec4899', colorRgb: '236, 72, 153', tagline: 'ROBOTIC CARTON PACK' },
  { id: 'palletising', name: 'Palletising', icon: '🏗️', dept: 'Logistics', desc: 'Stacking cartons on pallets & shrink wrapping.', metrics: 'Load: 60.00 cases/pal', color: '#14b8a6', colorRgb: '20, 184, 166', tagline: 'STRETCH-WRAPPED LOAD' },
  { id: 'dispatch', name: 'Dispatch Store', icon: '🚛', dept: 'Warehouse', desc: 'Inventory receipt syncing to ERPNext stores.', metrics: 'Status: Sync Complete', color: '#10b981', colorRgb: '16, 185, 129', tagline: 'ERP STORE SYNC COMPLETE' }
];

const MAINTENANCE_TEMPLATES = [
  {
    id: 'syrup-cip',
    name: 'Daily Preventive Maintenance Schedule (Syrup & CIP Equipment)',
    equipment: 'Syrup and CIP Equipment',
    area: 'Utilities',
    days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    tasks: [
      { id: 1, desc: 'Check sugar dissolving pumps for leakage', std: '-' },
      { id: 2, desc: 'Check Syrup transfer pumps for leakage', std: '-' },
      { id: 3, desc: 'Check Butterfly Valves for leakage', std: '-' },
      { id: 4, desc: 'Check Syrup transfer pumps for proper functioning', std: '-' },
      { id: 5, desc: 'Check any unusual sound from Propellers or motor', std: '-' },
      { id: 6, desc: 'Is there any unusual sound coming from machine', std: '-' },
      { id: 7, desc: 'Check the filter Ok to run production', std: '-' },
      { id: 8, desc: 'Check the water flow meter working condition (No meter currently)', std: '-' },
      { id: 9, desc: 'Check for the leakages from the valves and pump seals.', std: '-' },
      { id: 10, desc: 'Check Syrup transfer pump performance', std: '-' },
      { id: 11, desc: 'Check Valves condition on syrup transfer pumps', std: '-' }
    ]
  },
  {
    id: 'glycol-chilling',
    name: 'Daily Preventive Maintenance Schedule (SEM-FRM-01-00-02)',
    equipment: 'Glycol Chilling Plant & Grasso Refrigeration',
    area: 'Utilities',
    days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    tasks: [
      { id: 1, desc: 'Check functioning of load / Unload solenoid valves', std: '-' },
      { id: 2, desc: 'Check functioning of float valve', std: '-' },
      { id: 3, desc: 'Check oil leakages at compressor shaft seals', std: '-' },
      { id: 4, desc: 'Check cold well & hot well levels', std: '-' },
      { id: 5, desc: 'Check all the compressors are ON', std: '-' },
      { id: 6, desc: 'Check the temperature level ON the screen', std: '-' },
      { id: 7, desc: 'Check for Glycol leakage in the system', std: '-' },
      { id: 8, desc: 'Check for abnormal sound in pumps & motors', std: '-' }
    ]
  },
  {
    id: 'depalletizer',
    name: 'Daily Preventive Maintenance Schedule (De-Palletizer)',
    equipment: 'De-Palletizer',
    area: 'RTD Line',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check the alignment of the belts', std: '2 min' },
      { id: 2, desc: 'Check for the tension of the belts and adjust if required', std: '5 min' },
      { id: 3, desc: 'Clean the can travelling track from glass and crowns', std: '2 min' },
      { id: 4, desc: 'Check all gear boxes for sound & heating', std: '2 min' },
      { id: 5, desc: 'Clean the case conveyor from debris', std: '3 min' },
      { id: 6, desc: 'Clean all the sensor and proximities for proper functioning', std: '5 min' }
    ]
  },
  {
    id: 'date-coder',
    name: 'Daily Preventive Maintenance Schedule (Date Coder)',
    equipment: 'Date Coder',
    area: 'CSD / RTD Line',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check the ink & make up levels', std: '3 min' },
      { id: 2, desc: 'Check & ensure the encoder mounting', std: '5 min' },
      { id: 3, desc: 'Check the photocell for proper sensing of the bottles', std: '10 min' },
      { id: 4, desc: 'Clean & down the electrode plates', std: '2 min' },
      { id: 5, desc: 'Check the printhead sensor is sensing', std: '3 min' },
      { id: 6, desc: 'Check the product date & expiry date', std: '-' },
      { id: 7, desc: 'Check the printings property done on the products', std: '-' }
    ]
  },
  {
    id: 'bottling-line',
    name: 'Daily Preventive Maintenance Schedule (CSD / RTD Filler)',
    equipment: 'CSD / RTD FILLER',
    area: 'Bottling Line',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check for any jumping movement in the discharge conveyor chain', std: '3 min' },
      { id: 2, desc: 'Drain the condensate and fill the oiler if oil level is low for smooth movement of pneu. cylinders', std: '2 min' },
      { id: 3, desc: 'Check the condition of vent tubes, spreaders and bottle seals, replace if necessary', std: '0.5 min' },
      { id: 4, desc: 'Check the condition of snifts', std: '1 min' },
      { id: 5, desc: 'Remove all the bottles pieces & clean with water jet', std: '2 min' },
      { id: 6, desc: 'Check the bottle movement at air conveyor & supporting guides', std: '2 min' },
      { id: 7, desc: 'Check the alignment of guide plates of Air conveyor', std: '2 min' },
      { id: 8, desc: 'Check the lift cylinder air pressure & Co2 counter pressure leakages', std: '3 min' },
      { id: 9, desc: 'Grease the all centerlised grease points- Central lubrication as per the schedule', std: '2 min' },
      { id: 10, desc: 'Clean the elevating magnetic conveyor belt free of all crowns dust and other foreign matter', std: '10 min' },
      { id: 11, desc: 'Check all the pneumatic pipe lines, Regulators & Pneumatic valves for leakage', std: '10 min' }
    ]
  },
  {
    id: 'conveyors',
    name: 'Daily Preventive Maintenance Schedule (Conveyors)',
    equipment: 'CONVEYORS',
    area: 'CSD / RTD Line',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check for vibrations, sound and gear box heating of all conveyors', std: '5 min' },
      { id: 2, desc: 'Remove all foreign materials from conveyors', std: '5 min' },
      { id: 3, desc: 'Check the movement of the conveyors. Should not be jerky.', std: '10 min' },
      { id: 4, desc: 'Clean the conveyor tracks. Remove the cullet if found.', std: '5 min' },
      { id: 5, desc: 'Check for the lubrication availability on the chain.', std: '5 min' },
      { id: 6, desc: 'Inspect for adequacy of lubrication.', std: '10 min' },
      { id: 7, desc: 'Check wear strips of rails for damage, replace them if required.', std: '3 min' },
      { id: 8, desc: 'Check the smooth movement of bottles through bottle inspection stations.', std: '5 min' },
      { id: 9, desc: 'Check the oil level for conveyor motor if visible.', std: '5 min' }
    ]
  },
  {
    id: 'co2-mixer',
    name: 'Daily Preventive Maintenance Schedule (Co2 Mixer)',
    equipment: 'Co2 Mixer',
    area: 'RTD / CSD Line',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check the functioning of the pneumatic modulation valves', std: '5 min' },
      { id: 2, desc: 'Check for the level balance in Syrup reservoir tank', std: '5 min' },
      { id: 3, desc: 'Check the sight glass and pipe lines for leakage', std: '5 min' },
      { id: 4, desc: 'Check the leakages from mechanical seals of mixing pump and CIP booster pump, vacuum pump', std: '3 min' },
      { id: 5, desc: 'Clean the all external surfaces of the equipment thoroughly', std: '3 min' },
      { id: 6, desc: 'Check all pumps for leakage from the unions and for vibration', std: '2 min' },
      { id: 7, desc: 'Check for any leakage of CO2 and air', std: '3 min' },
      { id: 8, desc: 'Check for the pressure and temperature indicators of the areas', std: '5 min' }
    ]
  },
  {
    id: 'bottle-washer',
    name: 'Daily Preventive Maintenance Schedule (Bottle / Can Washer)',
    equipment: 'BOTTLE / CAN WASHER',
    area: 'CSD / RTD Line',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check the main line water pressure', std: '5 min' },
      { id: 2, desc: 'Check for unusual sound from pumps', std: '5 min' },
      { id: 3, desc: 'Inspect the alignment of spray nozzles & jettings of all compartments', std: '5 min' }
    ]
  },
  {
    id: 'boiler',
    name: 'Daily Preventive Maintenance Schedule (Boiler)',
    equipment: 'Boiler',
    area: 'Utilities',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check pressure / temp guages', std: '-' },
      { id: 2, desc: 'Check the TDS with the help of Lab chemist', std: '-' },
      { id: 3, desc: 'Clean flame sensors & viewing glass', std: '-' },
      { id: 4, desc: 'Carry out blow down based on TDS value', std: '-' },
      { id: 5, desc: 'Check for any steam leakages', std: '-' },
      { id: 6, desc: 'Do external cleaning of the boiler', std: '-' },
      { id: 7, desc: 'Check the water level in the reservoir tank', std: '-' },
      { id: 8, desc: 'Check the reservoir tank floatless valve functioning', std: '-' }
    ]
  },
  {
    id: 'air-compressor',
    name: 'Daily Preventive Maintenance Schedule (Air Compressor - 1)',
    equipment: 'Air Compressor - 1',
    area: 'Utilities',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Check the Oil level', std: '-' },
      { id: 2, desc: 'Check the Air intake vacuum indicator', std: '-' },
      { id: 3, desc: 'Check the condensate discharged from moisture separator during loading', std: '-' },
      { id: 4, desc: 'Check unloading and loading pressure', std: '-' },
      { id: 5, desc: 'Check air drier functioning and on', std: '-' },
      { id: 6, desc: 'Drain out all the filter outlets to drain moisture & water', std: '-' },
      { id: 7, desc: 'Is there any unusual sound coming from machine', std: '-' },
      { id: 8, desc: 'Check the joint leaking', std: '-' }
    ]
  },
  {
    id: 'cip-checklist',
    name: 'CIP Checklist (Carpenters Waters)',
    equipment: 'CIP System',
    area: 'Utilities',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    tasks: [
      { id: 1, desc: 'Verify place of CIP or backwash status', std: '-' },
      { id: 2, desc: 'Chemical Superstone Kleen check', std: '20 min' },
      { id: 3, desc: 'Flushing after Superstone Kleen', std: '-' },
      { id: 4, desc: 'Chemical XY12 Chlorine (Sodium Hypochlorite) check', std: '20 min' },
      { id: 5, desc: 'Flushing after XY12 Chlorine', std: '-' },
      { id: 6, desc: 'Chemical Performplus (Hydrogen Peroxide) check', std: '20 min' },
      { id: 7, desc: 'Flushing after Performplus', std: '-' }
    ]
  }
];

const CLEANING_TEMPLATES = [
  { id: 'toilet-clean', name: 'Cleaning of Toilets', doctype: 'Cleaning of Toilets', description: 'Log daily toilet sanitation status.' },
  { id: 'toilet-purpose', name: 'Toilet Cleaning Purpose', doctype: 'Toilet Cleaning purpose', description: 'Log toilet cleaning purpose details.' },
  { id: 'dining-clean', name: 'Cleaning of Dining Room', doctype: 'Cleaning of Dining Room', description: 'Log daily dining room sanitation status.' },
  { id: 'dining-purpose', name: 'Dining Room Cleaning Purpose', doctype: 'Dining Room Cleaning Purpose', description: 'Log dining room cleaning purpose details.' },
  { id: 'floor-clean', name: 'Factory Floor Cleaning', doctype: 'Factory Floor', description: 'Log factory floor cleaning checklist.' },
  { id: 'floor-purpose', name: 'Factory Floor Cleaning Purpose', doctype: 'Factory Floor Cleaning Purpose', description: 'Log factory floor cleaning standards.' },
  { id: 'lab-office-clean', name: 'Cleaning of Lab and Office', doctype: 'Cleaning of Lab and Office', description: 'Log daily laboratory & office cleaning logs.' },
  { id: 'lab-office-purpose', name: 'Lab and Office Cleaning Purpose', doctype: 'Lab and Office Cleaning Purpose', description: 'Log lab & office cleaning purpose details.' },
  { id: 'incubator-temp', name: 'Incubator Temperature Record', doctype: 'Incubator Temperature Record', description: 'Record incubator daily temp & humidity logs.' },
  { id: 'balance-calib', name: 'Balance Check or Calibration', doctype: 'Balance Check or Callibration', description: 'Record balance check metrics & calibration variance.' },
  { id: 'sanitation', name: 'Equipment Sanitation & CIP', doctype: 'Sanitation', description: 'Log chemical sanitation levels and contact times.' }
];

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication & Connection States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const conn = frappe.getConnectionSettings();
    return conn.connected;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const conn = frappe.getConnectionSettings();
    return conn.user || 'Guest';
  });
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    const conn = frappe.getConnectionSettings();
    return conn.role || 'Operator';
  });

  // Login form states
  const [loginUsername, setLoginUsername] = useState('administrator');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [isLive, setIsLive] = useState(false);
  const [erpUrl, setErpUrl] = useState('https://demo.erpnext.com');
  const [erpApiKey, setErpApiKey] = useState('');
  const [erpApiSecret, setErpApiSecret] = useState('');
  const [showAdvancedLogin, setShowAdvancedLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // TOTP 2FA states
  const [is2FAPhase, setIs2FAPhase] = useState('none'); // 'none', 'setup', 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [use2FA, setUse2FA] = useState(false);

  // Real-time Clock State synced with browser's time zone
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tab & Control states
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewWODrawer, setShowNewWODrawer] = useState(false);
  const [selectedWOId, setSelectedWOId] = useState(null);

  // Custom Alert Modal State and helper
  const [alertModal, setAlertModal] = useState(null); // { title: string, message: string, type: 'info' | 'error' | 'success' | 'warning' }
  const showAlert = (message, type = 'success', title = 'System Message') => {
    setAlertModal({ message, type, title });
  };

  // Stock Entry Modal State
  const [stockEntryModal, setStockEntryModal] = useState(null); // { woId: string, company: string, postingDate: string, postingTime: string, items: Array }
  const [seSaving, setSeSaving] = useState(false);
  const [woCreating, setWoCreating] = useState(false);
  const [maintSaving, setMaintSaving] = useState(false);

  // New Work Order dynamic loading states
  const [woProductsList, setWoProductsList] = useState([]);
  const [woBomsList, setWoBomsList] = useState([]);
  const [selectedWoProduct, setSelectedWoProduct] = useState('');
  const [selectedWoBom, setSelectedWoBom] = useState('');
  const [woProductSearch, setWoProductSearch] = useState('');
  const [woBomSearch, setWoBomSearch] = useState('');
  const [woItemsLoading, setWoItemsLoading] = useState(false);
  const [woBomsLoading, setWoBomsLoading] = useState(false);

  useEffect(() => {
    const loadDrawerItems = async () => {
      setWoItemsLoading(true);
      setWoProductsList([]);
      setWoBomsList([]);
      setSelectedWoProduct('');
      setSelectedWoBom('');
      setWoProductSearch('');
      setWoBomSearch('');

      const fallbackItems = PRODUCTS.map(p => ({
        code: p.code,
        name: p.name,
        unit: p.unit || 'Nos'
      }));

      try {
        const conn = frappe.getConnectionSettings();

        if (conn.isLive && conn.connected) {
          // Best source for Work Order item dropdown: Items that already have active submitted BOMs.
          // This avoids showing raw materials or items that cannot create a Work Order.
          const items = await frappe.getManufacturableItems?.(300) || await frappe.getFinishedGoods(300);

          if (items && items.length > 0) {
            setWoProductsList(items);
            setSelectedWoProduct(items[0].code);
            return;
          }
        }

        setWoProductsList(fallbackItems);
        setSelectedWoProduct(fallbackItems[0]?.code || '');
      } catch (err) {
        console.error('Failed to load Work Order items:', err);
        setWoProductsList(fallbackItems);
        setSelectedWoProduct(fallbackItems[0]?.code || '');
      } finally {
        setWoItemsLoading(false);
      }
    };

    if (showNewWODrawer) {
      loadDrawerItems();
    }
  }, [showNewWODrawer, isLoggedIn]);

  useEffect(() => {
    const loadProductBoms = async () => {
      setWoBomsList([]);
      setSelectedWoBom('');
      setWoBomSearch('');

      if (!selectedWoProduct) return;

      setWoBomsLoading(true);

      try {
        const conn = frappe.getConnectionSettings();

        if (conn.isLive && conn.connected) {
          const boms = await frappe.getBOMsForItem(selectedWoProduct, 100);
          setWoBomsList(boms || []);
          setSelectedWoBom((boms && boms.length > 0) ? boms[0].name : '');
          return;
        }

        const demoBom = `BOM-${selectedWoProduct}-demo`;
        setWoBomsList([{ id: demoBom, name: demoBom, productName: selectedWoProduct, active: 1 }]);
        setSelectedWoBom(demoBom);
      } catch (err) {
        console.error(`Failed to load BOMs for ${selectedWoProduct}:`, err);
        setWoBomsList([]);
        setSelectedWoBom('');
      } finally {
        setWoBomsLoading(false);
      }
    };

    loadProductBoms();
  }, [selectedWoProduct, isLoggedIn]);

  const filteredWoProductsList = woProductsList.filter(p => {
    const q = woProductSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.code || '').toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q);
  });

  const filteredWoBomsList = woBomsList.filter(bom => {
    const q = woBomSearch.trim().toLowerCase();
    if (!q) return true;
    return (bom.name || '').toLowerCase().includes(q) || (bom.productName || '').toLowerCase().includes(q);
  });

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);

  // Support Helpdesk States
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('fiji_support_tickets');
    if (saved) return JSON.parse(saved);
    return [
      {
        name: 'TKT-2026-001',
        subject: 'MV Kalana delay in custom clearance',
        customer: 'Micronesia Shipping Ltd',
        status: 'Open',
        priority: 'High',
        raised_by: 'captain.clark@micronesia.com',
        creation: '2026-05-30 08:30:00',
        description: 'Vessel has been anchored at Port Moresby outer harbor waiting for customs clearance on fuel cargo. Need immediate escalation.',
        conversation: [
          { sender: 'customer', name: 'Captain Clark', text: 'Vessel has been anchored at Port Moresby outer harbor waiting for customs clearance on fuel cargo. Need immediate escalation.', timestamp: '2026-05-30 08:30:00' },
          { sender: 'agent', name: 'Operations Desk', text: 'Hello Captain Clark, we have received your request. We are contacting Port Moresby customs liaison officer to expedite.', timestamp: '2026-05-30 08:45:00' }
        ]
      },
      {
        name: 'TKT-2026-002',
        subject: 'Inconsistent billing on invoice SINV-26-004',
        customer: 'Solomon Logistics Ltd',
        status: 'In Process',
        priority: 'Medium',
        raised_by: 'billing@solomonlog.com',
        creation: '2026-05-29 14:15:00',
        description: 'The outstanding amount on invoice SINV-26-004 does not match the agreed contract rates for freight services. Please review.',
        conversation: [
          { sender: 'customer', name: 'Solomon Billing Dept', text: 'The outstanding amount on invoice SINV-26-004 does not match the agreed contract rates for freight services. Please review.', timestamp: '2026-05-29 14:15:00' },
          { sender: 'agent', name: 'Accounts Support', text: 'We are verifying the freight bill against the standard tariff rules. We will update you shortly.', timestamp: '2026-05-29 15:00:00' }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('fiji_support_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const handleCreateTicket = (ticket) => {
    const newT = {
      name: `TKT-2026-0${tickets.length + 1}`,
      status: 'Open',
      creation: new Date().toISOString().replace('T', ' ').substring(0, 19),
      conversation: [
        { sender: 'customer', name: ticket.customer, text: ticket.description, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) }
      ],
      ...ticket
    };
    setTickets(prev => [newT, ...prev]);
  };

  const handleResolveTicket = (name) => {
    setTickets(prev => prev.map(t => {
      if (t.name === name) {
        return {
          ...t,
          status: 'Resolved',
          conversation: [...(t.conversation || []), { sender: 'system', name: 'System', text: 'Ticket resolved by support desk', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) }]
        };
      }
      return t;
    }));
  };

  const handleUpdateTicketStatus = (name, newStatus) => {
    setTickets(prev => prev.map(t => {
      if (t.name === name) {
        return {
          ...t,
          status: newStatus,
          conversation: [...(t.conversation || []), { sender: 'system', name: 'System', text: `Ticket status updated to ${newStatus}`, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) }]
        };
      }
      return t;
    }));
  };

  const handleSendTicketMessage = (name, text, senderType, senderName) => {
    setTickets(prev => prev.map(t => {
      if (t.name === name) {
        return {
          ...t,
          conversation: [...(t.conversation || []), { sender: senderType, name: senderName, text, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) }]
        };
      }
      return t;
    }));
  };

  // Expanded premium dashboard & paginated states
  const [fullscreenElement, setFullscreenElement] = useState(null);
  const [selectedItemCode, setSelectedItemCode] = useState('RM-WTR-01');
  const [invPage, setInvPage] = useState(1);
  const [bomList, setBomList] = useState([]);
  const [selectedBomId, setSelectedBomId] = useState('');
  const [activeBomMaterials, setActiveBomMaterials] = useState([]);
  const [bomPage, setBomPage] = useState(1);
  const [bomLoading, setBomLoading] = useState(false);
  const [maintPage, setMaintPage] = useState(1);
  const [woMonitorPage, setWoMonitorPage] = useState(1);
  const [erpItems, setErpItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const loadBOMs = async () => {
    setBomLoading(true);
    const conn = frappe.getConnectionSettings();
    if (conn.isLive && conn.connected) {
      try {
        const offset = (bomPage - 1) * 20;
        const liveBOMs = await frappe.getBOMs(20, offset);
        if (liveBOMs && liveBOMs.length > 0) {
          setBomList(liveBOMs);
          if (!selectedBomId) setSelectedBomId(liveBOMs[0].id);
        }
      } catch (err) {
        console.error("Failed to load BOMs from ERPNext:", err);
      } finally {
        setBomLoading(false);
      }
    } else {
      const mockBOMs = PRODUCTS.map(p => ({
        id: p.bomCode,
        name: p.bomCode,
        productName: p.name,
        active: 1
      }));
      setBomList(mockBOMs);
      if (!selectedBomId) setSelectedBomId(mockBOMs[0].id);
      setBomLoading(false);
    }
  };

  useEffect(() => {
    loadBOMs();
  }, [bomPage, isLoggedIn]);

  useEffect(() => {
    const fetchBOMDetails = async () => {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive && conn.connected && selectedBomId) {
        try {
          const details = await frappe.getBOMDetails(selectedBomId);
          if (details) {
            setActiveBomMaterials(details);
            return;
          }
        } catch (err) {
          console.error("Failed to fetch BOM details:", err);
        }
      }
      if (BOMS[selectedBomId]) {
        setActiveBomMaterials(BOMS[selectedBomId].materials);
      } else {
        const firstKey = Object.keys(BOMS)[0];
        setActiveBomMaterials(BOMS[selectedBomId] || BOMS[firstKey]?.materials || []);
      }
    };
    fetchBOMDetails();
  }, [selectedBomId, isLoggedIn]);



  // Business Workflow simulation states
  const [simStep, setSimStep] = useState(0);
  const [simPlaying, setSimPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(2000);

  useEffect(() => {
    let intervalId;
    if (simPlaying) {
      intervalId = setInterval(() => {
        setSimStep(prev => (prev + 1) % 11);
      }, simSpeed);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [simPlaying, simSpeed]);

  // Settings Panel states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsUrl, setSettingsUrl] = useState('');
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsApiSecret, setSettingsApiSecret] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Modal states for job card completion
  const [activeJCOp, setActiveJCOp] = useState(null); // { woId, jcId, operation, action: 'pause' | 'finish' | 'remark' }
  const [operatorName, setOperatorName] = useState('');
  const [operatorRemarks, setOperatorRemarks] = useState('');
  const [activeTimelineJC, setActiveTimelineJC] = useState(null); // { woId, jcId, operation, remarksList }

  // Job Card actual start/end time states
  const [jcActualStartTime, setJcActualStartTime] = useState('');
  const [jcActualEndTime, setJcActualEndTime] = useState('');

  // Sales section states
  const [salesSubTab, setSalesSubTab] = useState('invoice'); // 'invoice' | 'delivery'
  const [salesInvoicesList, setSalesInvoicesList] = useState([]);
  const [deliveryNotesList, setDeliveryNotesList] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesInvoicePage, setSalesInvoicePage] = useState(1);
  const [deliveryNotePage, setDeliveryNotePage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showCreateDeliveryNoteModal, setShowCreateDeliveryNoteModal] = useState(false);
  const [showAmendInvoiceModal, setShowAmendInvoiceModal] = useState(false);
  const [showAmendDeliveryNoteModal, setShowAmendDeliveryNoteModal] = useState(false);

  // Stock Entry autocomplete states
  const [seSourceSearch, setSeSourceSearch] = useState({});
  const [seTargetSearch, setSeTargetSearch] = useState({});
  const [seSourceSuggestions, setSeSourceSuggestions] = useState({});
  const [seTargetSuggestions, setSeTargetSuggestions] = useState({});
  const [activeSeSourceRow, setActiveSeSourceRow] = useState(null);
  const [activeSeTargetRow, setActiveSeTargetRow] = useState(null);

  // Email simulation states
  const [emailModal, setEmailModal] = useState(null); // { reportId, reportType }
  const [emailRecipient, setEmailRecipient] = useState('supervisor@islandchill.com.fj');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // PM Checklist overall comments state
  const [maintOverallComments, setMaintOverallComments] = useState('');

  const [replyingToIdx, setReplyingToIdx] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [employeeList, setEmployeeList] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'pauseModal' | 'remarksModal' | 'maintOperator' | 'maintSupervisor'

  const handleSearchEmployees = async (query, field) => {
    if (field === 'maintOperator') setMaintOperator(query);
    else if (field === 'maintSupervisor') setMaintSupervisor(query);
    else if (
      field === 'safetyOperator' ||
      field === 'safetySupervisor' ||
      field === 'safetyInjured' ||
      field === 'firstAidEmployee' ||
      field === 'firstAidSupervisor' ||
      field === 'labAnalyst' ||
      field === 'labVerifiedBy' ||
      field === 'labManager' ||
      field === 'labTasteAnalyst' ||
      field === 'labParticleAnalyst' ||
      field === 'labPreparedBy' ||
      field === 'labTechnician' ||
      field === 'labProdSupervisor' ||
      field === 'labEndorsedBy' ||
      field === 'labReceivedBy'
    ) {
      // local states managed inside sub-component modals
    } else {
      setOperatorName(query);
    }

    setActiveSearchField(field);
    if (query.trim().length >= 3) {
      const emps = await frappe.getEmployees(query, 20);
      setEmployeeList(emps);
      setShowEmployeeDropdown(true);
    } else if (query.trim().length === 0) {
      const emps = await frappe.getEmployees('', 20);
      setEmployeeList(emps);
      setShowEmployeeDropdown(true);
    } else {
      setShowEmployeeDropdown(false);
    }
  };

  useEffect(() => {
    const fetchInitialEmployees = async () => {
      const emps = await frappe.getEmployees('', 20);
      setEmployeeList(emps);
    };
    fetchInitialEmployees();
  }, []);

  // Update email template when modal is opened
  useEffect(() => {
    if (emailModal) {
      setEmailSubject(`Report Dispatch: ${emailModal.reportType} (ID: ${emailModal.reportId})`);
      setEmailBody(`Bula,\n\nPlease find attached the ${emailModal.reportType} for ID ${emailModal.reportId}, generated on ${new Date().toLocaleString()}.\n\nRegards,\nOperations Team\nCarpenters Water Fiji PTE Limited`);
    }
  }, [emailModal]);

  const handleSendEmail = (e) => {
    e.preventDefault();
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailModal(null);
      showAlert(`Email with report attached sent to ${emailRecipient} successfully!`, 'success', 'Email Sent');
    }, 1500);
  };

  // Maintenance module states
  const [maintenanceRecords, setMaintenanceRecords] = useState(() => {
    const saved = localStorage.getItem('fiji_maintenance_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMaintTemplate, setActiveMaintTemplate] = useState(null); // template index (0-4) or null
  const [viewingRecord, setViewingRecord] = useState(null); // record object or null
  const [maintWeekNo, setMaintWeekNo] = useState('');
  const [maintFromDate, setMaintFromDate] = useState('');
  const [maintToDate, setMaintToDate] = useState('');
  const [maintCheckgrid, setMaintCheckgrid] = useState({}); // { rowIdx-day: boolean }
  const [maintRemarks, setMaintRemarks] = useState({}); // { rowIdx: string }
  const [maintOperator, setMaintOperator] = useState('');
  const [maintSupervisor, setMaintSupervisor] = useState('');
  const [maintViewMode, setMaintViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeMaintSubTab, setActiveMaintSubTab] = useState('preventive'); // 'preventive' | 'regular-breakdown'
  const [activeMaintForm, setActiveMaintForm] = useState(null); // 'weight-check' | 'breakdown' | null
  const [maintSearchQuery, setMaintSearchQuery] = useState('');
  const [maintFilterEquipment, setMaintFilterEquipment] = useState('All');

  // Health & Safety states
  const [safetyRecords, setSafetyRecords] = useState(() => {
    const saved = localStorage.getItem('fiji_safety_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSafetyForm, setActiveSafetyForm] = useState(null);
  const [viewingSafetyRecord, setViewingSafetyRecord] = useState(null);
  const [safetySearchQuery, setSafetySearchQuery] = useState('');
  const [safetyFilterType, setSafetyFilterType] = useState('All');
  const [safetyPage, setSafetyPage] = useState(1);

  useEffect(() => {
    localStorage.setItem('fiji_safety_records', JSON.stringify(safetyRecords));
  }, [safetyRecords]);

  useEffect(() => {
    setSafetyPage(1);
  }, [safetySearchQuery, safetyFilterType]);

  // Laboratory states
  const [laboratoryRecords, setLaboratoryRecords] = useState(() => {
    const saved = localStorage.getItem('fiji_laboratory_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeLabForm, setActiveLabForm] = useState(null);
  const [viewingLabRecord, setViewingLabRecord] = useState(null);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [labFilterType, setLabFilterType] = useState('All');
  const [labPage, setLabPage] = useState(1);
  const [labViewMode, setLabViewMode] = useState('grid');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');


  useEffect(() => {
    localStorage.setItem('fiji_laboratory_records', JSON.stringify(laboratoryRecords));
  }, [laboratoryRecords]);

  useEffect(() => {
    setLabPage(1);
  }, [labSearchQuery, labFilterType]);

  // Cleaning & Sanitation states
  const [cleaningRecords, setCleaningRecords] = useState(() => {
    const saved = localStorage.getItem('fiji_cleaning_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCleaningForm, setActiveCleaningForm] = useState(null);
  const [viewingCleaningRecord, setViewingCleaningRecord] = useState(null);
  const [cleaningSearchQuery, setCleaningSearchQuery] = useState('');
  const [cleaningFilterType, setCleaningFilterType] = useState('All');
  const [cleaningPage, setCleaningPage] = useState(1);
  const [cleaningSaving, setCleaningSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('fiji_cleaning_records', JSON.stringify(cleaningRecords));
  }, [cleaningRecords]);

  useEffect(() => {
    setCleaningPage(1);
  }, [cleaningSearchQuery, cleaningFilterType]);

  const handleSaveCleaning = async (doctype, data) => {
    setCleaningSaving(true);
    let newId = `CS-${Date.now().toString().slice(-6)}`;
    const newRecordData = {
      type: doctype,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    };

    try {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive && conn.connected) {
        try {
          const response = await frappe.createCleaningSanitationRecord(doctype, data);
          if (response && response.name) {
            newId = response.name;
          }
        } catch (err) {
          console.error(`Failed to save ${doctype} to ERPNext:`, err);
          showAlert(`Failed to sync to ERPNext: ${err.message}. Saved locally instead.`, 'warning', 'Sync Issue');
        }
      }

      const newRecord = {
        id: newId,
        ...newRecordData
      };

      setCleaningRecords(prev => [newRecord, ...prev]);
      setActiveCleaningForm(null);
      showAlert(`${doctype} logged successfully!`, 'success', 'QC Log Saved');
      loadCleaningRecords();
    } finally {
      setCleaningSaving(false);
    }
  };

  const handleSaveLaboratory = (type, data) => {
    const newRecord = {
      id: `LAB-${Date.now().toString().slice(-6)}`,
      type,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    };
    setLaboratoryRecords(prev => [newRecord, ...prev]);
    setActiveLabForm(null);
    showAlert(`${type} logged successfully!`, 'success', 'QC Log Saved');
  };



  useEffect(() => {
    localStorage.setItem('fiji_maintenance_records', JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  useEffect(() => {
    setMaintPage(1);
  }, [maintSearchQuery, maintFilterEquipment]);

  const handleSaveSafety = (type, data) => {
    const newRecord = {
      id: `SAF-${Date.now().toString().slice(-6)}`,
      type, // 'Incident Report', 'First Aid Log', 'Swab Test'
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    };
    setSafetyRecords(prev => [newRecord, ...prev]);
    setActiveSafetyForm(null);
    showAlert(`${type} logged successfully!`, 'success', 'Safety Log Saved');
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    setMaintSaving(true);
    const template = MAINTENANCE_TEMPLATES[activeMaintTemplate];

    let totalChecked = 0;
    template.tasks.forEach((task, tIdx) => {
      if (maintCheckgrid[tIdx]) {
        totalChecked++;
      }
    });

    let newId = `MAINT-${Date.now().toString().slice(-6)}`;
    const newRecordData = {
      templateId: template.id,
      equipment: template.equipment,
      area: template.area,
      name: template.name,
      weekNo: maintWeekNo,
      fromDate: maintFromDate,
      toDate: maintToDate,
      operator: maintOperator,
      supervisor: maintSupervisor,
      checkgrid: maintCheckgrid,
      remarks: maintRemarks,
      overallComments: maintOverallComments,
      totalChecked,
      maxPossible: template.tasks.length,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    try {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive && conn.connected) {
        try {
          const response = await frappe.createMaintenanceSchedule(newRecordData);
          if (response && response.name) {
            newId = response.name;
          }
        } catch (err) {
          console.error("Failed to save schedule to ERPNext:", err);
          showAlert(`Failed to save to ERPNext: ${err.message}. Saving locally instead.`, 'warning', 'Sync Issue');
        }
      }

      const newRecord = {
        id: newId,
        ...newRecordData
      };

      setMaintenanceRecords(prev => [newRecord, ...prev]);
      setActiveMaintTemplate(null);
      setMaintWeekNo('');
      setMaintFromDate('');
      setMaintToDate('');
      setMaintCheckgrid({});
      setMaintRemarks({});
      setMaintOperator('');
      setMaintSupervisor('');
      setMaintOverallComments('');

      showAlert(`Maintenance checklist for ${template.equipment} logged successfully!`, 'success', 'Maintenance Log Saved');
    } finally {
      setMaintSaving(false);
    }
  };

  const handleSaveMaintForm = (type, data) => {
    const newRecord = {
      id: `MAINT-${Date.now().toString().slice(-6)}`,
      templateId: type, // 'weight-check' | 'breakdown'
      equipment: type === 'weight-check' ? 'Weight Check' : 'Machine Breakdown',
      area: type === 'weight-check' ? 'Quality Check' : 'Maintenance',
      name: type === 'weight-check' ? 'Standard Form 88: Weight Check' : 'Appendix A: Machine Breakdown',
      operator: data.checkedBy || data.requestorName || 'N/A',
      supervisor: data.verifiedBy || data.approvedByProductionSV || 'N/A',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    };
    setMaintenanceRecords(prev => [newRecord, ...prev]);
    setActiveMaintForm(null);
    showAlert(`${newRecord.name} logged successfully!`, 'success', 'Log Saved');
  };

  // Stock Adjust Modal states
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [adjustItemCode, setAdjustItemCode] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);

  // Local Storage Data persistence
  const [workOrders, setWorkOrders] = useState(() => {
    const saved = localStorage.getItem('fiji_work_orders');
    const list = saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
    // Map initial string remarks to remarksList array format if not already done
    return list.map(wo => {
      if (wo.jobCards) {
        wo.jobCards = wo.jobCards.map(jc => {
          if (!jc.remarksList) {
            jc.remarksList = jc.remarks ? [
              {
                timestamp: wo.plannedStart || '2026-06-02 08:30:00',
                operator: jc.operator || 'S. Prasad',
                text: jc.remarks
              }
            ] : [];
          }
          return jc;
        });
      }
      return wo;
    });
  });

  // Paginated loading hooks
  const [woLoading, setWoLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  useEffect(() => {
    if (selectedWOId && workOrders && workOrders.length > 0) {
      const idx = workOrders.findIndex(wo => wo.id === selectedWOId);
      if (idx !== -1) {
        const page = Math.floor(idx / 20) + 1;
        setCurrentPage(page);
      }
    }
  }, [selectedWOId, workOrders]);

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('fiji_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  useEffect(() => {
    localStorage.setItem('fiji_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('fiji_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    const loadItems = async () => {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive && conn.connected) {
        setItemsLoading(true);
        try {
          const offset = (invPage - 1) * 20;
          const liveItems = await frappe.getItems(20, offset);
          if (liveItems && liveItems.length > 0) {
            const itemCodes = liveItems.map(item => item.code);
            const bins = await frappe.getBinQuantities(itemCodes);

            const merged = liveItems.map(item => {
              const targetWarehouse = item.category === 'Finished Goods' ? 'Finished Goods - CWFL' : 'Raw Materials - CWFL';
              const binMatch = bins.find(b => b.item_code === item.code && b.warehouse === targetWarehouse);
              const actualQty = binMatch ? Number(binMatch.actual_qty || 0) : null;

              const localMatch = inventory[item.code];
              return {
                ...item,
                qty: actualQty !== null ? actualQty : (localMatch ? localMatch.qty : Math.floor(Math.random() * 500) + 100)
              };
            });

            setErpItems(merged);
            if (!selectedItemCode || !merged.find(i => i.code === selectedItemCode)) {
              setSelectedItemCode(merged[0].code);
            }
          } else {
            setErpItems([]);
          }
        } catch (err) {
          console.error("Failed to load items from ERPNext:", err);
        } finally {
          setItemsLoading(false);
        }
      } else {
        setErpItems([]);
      }
    };
    loadItems();
  }, [invPage, isLoggedIn, inventory]);



  // Clear OTP when transitioning phases
  useEffect(() => {
    Promise.resolve().then(() => setOtpCode(''));
  }, [is2FAPhase]);



  // const loadWorkOrders = async () => {
  //   Promise.resolve().then(() => setWoLoading(true));
  //   const conn = frappe.getConnectionSettings();
  //   if (conn.isLive && conn.connected) {
  //     try {
  //       const offset = (currentPage - 1) * recordsPerPage;
  //       const liveWOs = await frappe.getWorkOrders(recordsPerPage, offset);
  //       if (liveWOs) {
  //         const savedLocal = localStorage.getItem('fiji_work_orders');
  //         const localList = savedLocal ? JSON.parse(savedLocal) : INITIAL_WORK_ORDERS;
  //         const merged = await Promise.all(liveWOs.map(async (live) => {
  //           const localMatch = localList.find(l => l.id === live.id);
  //           let realJobCards = null;
  //           try {
  //             realJobCards = await frappe.getJobCardsForWorkOrder(live.id);
  //           } catch (jcErr) {
  //             console.warn(`Failed to fetch Job Cards for Work Order ${live.id}:`, jcErr);
  //           }

  //           return {
  //             ...live,
  //             jobCards: (realJobCards && realJobCards.length > 0) ? realJobCards : (localMatch && localMatch.jobCards.length > 0 ? localMatch.jobCards : [
  //               { id: 'PO-JOB00601', operation: 'Mixing', station: 'Mixing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00602', operation: 'Lab Testing', station: 'Lab Testing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00603', operation: 'Can/Bottle Prep', station: 'Can Preparation Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00604', operation: 'Filling', station: 'Filling Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00605', operation: 'Initial Quality Check', station: 'Initial QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00606', operation: 'Warmer', station: 'Warmer Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00607', operation: 'Laser Labeling', station: 'Labeling Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00608', operation: 'Final Quality Check', station: 'Final QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00609', operation: 'Hand Packing', station: 'Packing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00610', operation: 'Palletising', station: 'Palletisation Area', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //               { id: 'PO-JOB00611', operation: 'Store & Dispatch', station: 'Warehouse/Logistics', status: 'Not Started', operator: '', remarks: '', remarksList: [] }
  //             ])
  //           };
  //         }));
  //         setWorkOrders(merged);
  //       }
  //     } catch (err) {
  //       console.error("Failed to load work orders from ERPNext:", err);
  //     } finally {
  //       setWoLoading(false);
  //     }
  //   } else {
  //     setWoLoading(false);
  //   }
  // };
  const loadWorkOrders = async () => {
    Promise.resolve().then(() => setWoLoading(true));

    const conn = frappe.getConnectionSettings();

    if (conn.isLive && conn.connected) {
      try {
        const offset = (currentPage - 1) * recordsPerPage;
        const liveWOs = await frappe.getWorkOrders(recordsPerPage, offset);

        if (liveWOs) {
          const savedLocal = localStorage.getItem('fiji_work_orders');
          const localList = savedLocal ? JSON.parse(savedLocal) : INITIAL_WORK_ORDERS;

          const defaultJobCards = [
            { id: 'PO-JOB00601', operation: 'Mixing', station: 'Mixing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00602', operation: 'Lab Testing', station: 'Lab Testing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00603', operation: 'Can/Bottle Prep', station: 'Can Preparation Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00604', operation: 'Filling', station: 'Filling Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00605', operation: 'Initial Quality Check', station: 'Initial QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00606', operation: 'Warmer', station: 'Warmer Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00607', operation: 'Laser Labeling', station: 'Labeling Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00608', operation: 'Final Quality Check', station: 'Final QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00609', operation: 'Hand Packing', station: 'Packing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00610', operation: 'Palletising', station: 'Palletisation Area', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00611', operation: 'Store & Dispatch', station: 'Warehouse/Logistics', status: 'Not Started', operator: '', remarks: '', remarksList: [] }
          ];

          const merged = await Promise.all(
            liveWOs.map(async (live) => {
              const localMatch = localList.find(l => l.id === live.id);

              let realJobCards = null;

              try {
                realJobCards = await frappe.getJobCardsForWorkOrder(live.id);
              } catch (jcErr) {
                console.warn(`Failed to fetch Job Cards for Work Order ${live.id}:`, jcErr);
              }

              const mergedJobCards =
                realJobCards && realJobCards.length > 0
                  ? realJobCards
                  : localMatch && localMatch.jobCards && localMatch.jobCards.length > 0
                    ? localMatch.jobCards
                    : defaultJobCards;

              const materialTransferred = Boolean(
                localMatch?.materialTransferred ||
                localMatch?.stockEntryCreated
              );

              return {
                ...live,

                // Preserve local material issue flags
                materialTransferred,
                stockEntryCreated: Boolean(localMatch?.stockEntryCreated),
                stockEntryName: localMatch?.stockEntryName || '',
                stockEntryPostingDate: localMatch?.stockEntryPostingDate || '',
                stockEntryPostingTime: localMatch?.stockEntryPostingTime || '',

                // Trust ERPNext status after Stock Entry submission
                status: live.status,

                jobCards: mergedJobCards
              };
            })
          );

          setWorkOrders(merged);
        }
      } catch (err) {
        console.error("Failed to load work orders from ERPNext:", err);
      } finally {
        setWoLoading(false);
      }
    } else {
      setWoLoading(false);
    }
  };

  const loadMaintenanceSchedules = async () => {
    const conn = frappe.getConnectionSettings();
    if (conn.isLive && conn.connected) {
      try {
        const liveMaint = await frappe.getMaintenanceSchedules();
        if (liveMaint && liveMaint.length > 0) {
          setMaintenanceRecords(prev => {
            const localIds = new Set(liveMaint.map(r => r.id));
            const filteredLocal = prev.filter(r => !localIds.has(r.id));
            return [...liveMaint, ...filteredLocal];
          });
        }
      } catch (err) {
        console.error("Failed to load maintenance schedules from ERPNext:", err);
      }
    }
  };

  useEffect(() => {
    loadWorkOrders();
    loadMaintenanceSchedules();
  }, [currentPage, isLoggedIn]);

  const loadSalesInvoices = async () => {
    setSalesLoading(true);
    try {
      const offset = (salesInvoicePage - 1) * 20;
      const res = await frappe.getSalesInvoices(20, offset);
      setSalesInvoicesList(res || []);
    } catch (err) {
      console.error("Failed to load sales invoices:", err);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadDeliveryNotes = async () => {
    setSalesLoading(true);
    try {
      const offset = (deliveryNotePage - 1) * 20;
      const res = await frappe.getDeliveryNotes(20, offset);
      setDeliveryNotesList(res || []);
    } catch (err) {
      console.error("Failed to load delivery notes:", err);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadCleaningRecords = async () => {
    const conn = frappe.getConnectionSettings();
    if (conn.isLive && conn.connected) {
      try {
        const fetchPromises = CLEANING_TEMPLATES.map(async (tpl) => {
          try {
            const records = await frappe.getCleaningSanitationRecords(tpl.doctype);
            if (records) {
              return records.map(r => ({
                id: r.name,
                type: tpl.doctype,
                timestamp: r.creation ? r.creation.replace('T', ' ').substring(0, 19) : '',
                ...r
              }));
            }
          } catch (e) {
            console.warn(`Could not load records for ${tpl.doctype} from ERPNext:`, e);
          }
          return [];
        });

        const results = await Promise.all(fetchPromises);
        const merged = results.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        if (merged.length > 0) {
          setCleaningRecords(merged);
        }
      } catch (err) {
        console.error("Failed to fetch Cleaning records:", err);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn && currentTab === 'cleaning') {
      loadCleaningRecords();
    }
  }, [currentTab, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && currentTab === 'sales') {
      if (salesSubTab === 'invoice') {
        loadSalesInvoices();
      } else {
        loadDeliveryNotes();
      }
    }
  }, [salesInvoicePage, deliveryNotePage, salesSubTab, currentTab, isLoggedIn]);



  // ERPNext status helpers
  // Work Order uses ERPNext statuses: Not Started / In Process / Stock Reserved / Completed...
  // Job Card uses ERPNext statuses: Open / Work In Progress / On Hold / Completed...
  const WORK_ORDER_ACTIVE_STATUSES = ['In Process', 'Stock Reserved', 'Stock Partially Reserved'];
  const WORK_ORDER_STARTABLE_STATUSES = ['Pending', 'Not Started', 'Draft', 'Submitted'];
  const JOB_CARD_STARTABLE_STATUSES = ['Open', 'Not Started', 'Material Transferred', 'Submitted'];
  const JOB_CARD_RUNNING_STATUSES = ['Work In Progress', 'In Process'];
  const JOB_CARD_PAUSED_STATUSES = ['On Hold', 'Paused'];

  // Dashboard calculations
  const activeWOsCount = workOrders.filter(wo => WORK_ORDER_ACTIVE_STATUSES.includes(wo.status)).length;
  const pendingWOsCount = workOrders.filter(wo => wo.status === 'Pending').length;

  let inProgressJobCardsCount = 0;
  workOrders.forEach(wo => {
    if (wo.jobCards) {
      inProgressJobCardsCount += wo.jobCards.filter(jc => JOB_CARD_RUNNING_STATUSES.includes(jc.status)).length;
    }
  });

  const lowStockCount = Object.keys(inventory).filter(key => {
    const item = inventory[key];
    return item.qty < item.minLevel;
  }).length;

  const totalProduction = workOrders.reduce((sum, wo) => sum + (wo.produced || 0), 0);
  const goodProduction = workOrders.reduce((sum, wo) => {
    if (wo.status === 'Completed') return sum + (wo.produced || 0);
    if (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status)) return sum + (wo.produced || 0) * 0.96;
    return sum;
  }, 0);
  const looseProduction = totalProduction - goodProduction;

  // Login Procedures
  const handleSetup2FA = async (userVal) => {
    const cleanUser = userVal.trim() || 'administrator';
    const secret = generateSecret();
    setTempSecret(secret);
    const otpauth = `otpauth://totp/IslandChill:${cleanUser}?secret=${secret}&issuer=CarpentersFiji&period=30`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauth)}`;
    setTotpQrUrl(qrUrl);
    setIs2FAPhase('setup');
  };

  const handleVerify2FASetup = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const isValid = await verifyTOTP(otpCode, tempSecret);
      if (isValid) {
        localStorage.setItem(`totp_enabled_${loginUsername}`, 'true');
        localStorage.setItem(`totp_secret_${loginUsername}`, tempSecret);

        const result = await frappe.login(CONFIG.ERPNEXT_SERVER_URL, loginUsername, loginPassword, true);
        if (result.success) {
          setCurrentUser(result.user);
          setCurrentUserRole(result.role);
          setIsLoggedIn(true);
        } else {
          setLoginError(result.message || 'Verification succeeded, but failed to connect to ERPNext.');
          setIs2FAPhase('none');
        }
      } else {
        setLoginError('Invalid MFA code. Please check your Authenticator app.');
      }
    } catch (err) {
      setLoginError(err.message || 'MFA setup verification failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerify2FALogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const isValid = await verifyTOTP(otpCode, tempSecret);
      if (isValid) {
        const result = await frappe.login(CONFIG.ERPNEXT_SERVER_URL, loginUsername, loginPassword, true);
        if (result.success) {
          setCurrentUser(result.user);
          setCurrentUserRole(result.role);
          setIsLoggedIn(true);
        } else {
          setLoginError(result.message || 'Failed to connect to ERPNext.');
          setIs2FAPhase('none');
        }
      } else {
        setLoginError('Invalid code. Please check your Authenticator app.');
      }
    } catch (err) {
      setLoginError(err.message || 'TOTP validation failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const has2FA = localStorage.getItem(`totp_enabled_${loginUsername}`) === 'true';
    if (has2FA) {
      const savedSecret = localStorage.getItem(`totp_secret_${loginUsername}`);
      setTempSecret(savedSecret);
      setIs2FAPhase('verify');
      return;
    }

    if (use2FA) {
      await handleSetup2FA(loginUsername);
      return;
    }

    setLoginLoading(true);
    try {
      const result = await frappe.login(CONFIG.ERPNEXT_SERVER_URL, loginUsername, loginPassword, true);
      if (result.success) {
        setCurrentUser(result.user);
        setCurrentUserRole(result.role);
        setIsLoggedIn(true);
      } else {
        setLoginError(result.message || 'Failed to connect to ERPNext.');
      }
    } catch (err) {
      setLoginError(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLaunchDemoMode = () => {
    setLoginLoading(true);
    setTimeout(async () => {
      const result = await frappe.login('', '', '', false);
      setCurrentUser(result.user);
      setCurrentUserRole(result.role);
      setIsLoggedIn(true);
      setLoginLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    frappe.logout();
    setIsLoggedIn(false);
    setCurrentTab('dashboard');
    setIs2FAPhase('none');
  };

  const handleCopyMFAKey = () => {
    navigator.clipboard.writeText(tempSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleReset2FA = () => {
    localStorage.removeItem(`totp_enabled_${loginUsername}`);
    localStorage.removeItem(`totp_secret_${loginUsername}`);
    setIs2FAPhase('none');
    setUse2FA(false);
    setLoginError('2FA settings reset successfully. You can re-enroll.');
  };

  // Start a Work Order Run
  const handleStartWorkOrder = async (woId) => {
    const conn = frappe.getConnectionSettings();
    const woToStart = workOrders.find(wo => wo.id === woId);
    if (!woToStart) return;

    // First check ERPNext for an existing Draft Stock Entry.
    // If found, reopen the same draft so the user can edit qty/warehouses and submit it.
    if (conn.isLive && conn.connected) {
      setSyncStatusMsg('Checking existing Stock Entry draft...');
      try {
        const existingDraft = await frappe.getStockEntryForWorkOrder(woToStart.id);

        if (existingDraft) {
          const draftItems = (existingDraft.items || []).map(row => ({
            code: row.item_code,
            name: row.item_name || row.item_code,
            qty: Number(row.qty || row.transfer_qty || 0),
            unit: row.uom || row.stock_uom || '',
            sourceWarehouse: row.s_warehouse || '',
            targetWarehouse: row.t_warehouse || ''
          }));

          setSeSourceSearch({});
          setSeTargetSearch({});

          setStockEntryModal({
            woId: woToStart.id,
            company: existingDraft.company || woToStart.company || 'Anantdv (Demo)',
            postingDate: existingDraft.posting_date || '',
            postingTime: existingDraft.posting_time ? String(existingDraft.posting_time).substring(0, 5) : '',
            items: draftItems,
            stockEntryName: existingDraft.name,
            docstatus: existingDraft.docstatus || 0,
            saved: true,
            submitted: false
          });

          setSyncStatusMsg('');
          return;
        }
      } catch (err) {
        console.warn(`No editable Stock Entry draft found for Work Order ${woToStart.id}:`, err);
      } finally {
        setSyncStatusMsg('');
      }
    }

    let materials = [];
    if (conn.isLive && conn.connected) {
      setSyncStatusMsg('Loading BOM materials for Stock Entry...');
      try {
        const details = await frappe.getBOMDetails(woToStart.bomNo);
        if (details && details.length > 0) {
          materials = details.map(m => ({
            code: m.code,
            name: m.name,
            qty: Number((m.qty * (woToStart.quantity || 1)).toFixed(4)),
            unit: m.unit,
            sourceWarehouse: woToStart.sourceWarehouse || 'Stores - AD',
            targetWarehouse: woToStart.wipWarehouse || 'Work In Progress - AD'
          }));
        }
      } catch (err) {
        console.error('Failed to load BOM materials for stock entry:', err);
      }
    }

    if (materials.length === 0) {
      const mockBom = BOMS[woToStart.bomNo] || Object.values(BOMS)[0];
      materials = (mockBom?.materials || []).map(m => ({
        code: m.code,
        name: m.name,
        qty: Number((m.qty * (woToStart.quantity || 1)).toFixed(4)),
        unit: m.unit,
        sourceWarehouse: woToStart.sourceWarehouse || 'Stores - AD',
        targetWarehouse: woToStart.wipWarehouse || 'Work In Progress - AD'
      }));
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    const formattedTime = today.toTimeString().split(' ')[0].substring(0, 5);

    setStockEntryModal({
      woId: woToStart.id,
      company: woToStart.company || 'Anantdv (Demo)',
      postingDate: formattedDate,
      postingTime: formattedTime,
      items: materials,

      // Draft/submission state for the two-step ERPNext flow
      stockEntryName: '',
      docstatus: 0,
      saved: false,
      submitted: false
    });
  };

  // const handleConfirmStockEntry = async (seData) => {
  //   setSeSaving(true);
  //   try {
  //     let success = true;
  //     let errorMsg = '';
  //     const conn = frappe.getConnectionSettings();

  //     if (conn.isLive && conn.connected) {
  //       try {
  //         setSyncStatusMsg('Creating Stock Entry on ERPNext...');
  //         const convertedDate = seData.postingDate;
  //         const seRes = await frappe.createStockEntry({
  //           workOrder: seData.woId,
  //           company: seData.company,
  //           postingDate: convertedDate,
  //           postingTime: seData.postingTime,
  //           items: seData.items
  //         });
  //         if (!seRes || !seRes.success) {
  //           success = false;
  //           errorMsg = seRes?.message || 'Stock Entry submission failed';
  //         }
  //       } catch (err) {
  //         success = false;
  //         errorMsg = err.message;
  //       }
  //     }

  //     if (!success) {
  //       showAlert(`Failed to create Stock Entry: ${errorMsg}`, 'error', 'ERPNext Error');
  //       return;
  //     }

  //     // Stock Entry success - now start the Work Order run
  //     const woToStart = workOrders.find(wo => wo.id === seData.woId);
  //     if (!woToStart) {
  //       setStockEntryModal(null);
  //       return;
  //     }

  //     const updatedJobCards = woToStart.jobCards && woToStart.jobCards.length > 0 ? woToStart.jobCards : [
  //       { id: 'PO-JOB00601', operation: 'Mixing', station: 'Mixing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00602', operation: 'Lab Testing', station: 'Lab Testing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00603', operation: 'Can/Bottle Prep', station: 'Can Preparation Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00604', operation: 'Filling', station: 'Filling Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00605', operation: 'Initial Quality Check', station: 'Initial QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00606', operation: 'Warmer', station: 'Warmer Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00607', operation: 'Laser Labeling', station: 'Labeling Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00608', operation: 'Final Quality Check', station: 'Final QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00609', operation: 'Hand Packing', station: 'Packing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00610', operation: 'Palletising', station: 'Palletisation Area', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
  //       { id: 'PO-JOB00611', operation: 'Store & Dispatch', station: 'Warehouse/Logistics', status: 'Not Started', operator: '', remarks: '', remarksList: [] }
  //     ];

  //     const updatedWO = {
  //       ...woToStart,
  //       status: 'In Process',
  //       jobCards: updatedJobCards
  //     };

  //     if (conn.isLive && conn.connected) {
  //       try {
  //         setSyncStatusMsg('Starting Work Order on ERPNext...');
  //         const res = await frappe.syncWorkOrderToERP(updatedWO);
  //         if (!res || !res.success) {
  //           success = false;
  //           errorMsg = res?.message || 'Sync failed';
  //         }
  //       } catch (err) {
  //         success = false;
  //         errorMsg = err.message;
  //       }
  //     }

  //     if (success) {
  //       setWorkOrders(prev => prev.map(wo => wo.id === seData.woId ? updatedWO : wo));
  //       showAlert(`Stock Entry submitted and Work Order ${seData.woId} started successfully!`, 'success', 'Work Order Started');
  //       setStockEntryModal(null);
  //     } else {
  //       showAlert(`Failed to start Work Order: ${errorMsg}`, 'error', 'ERPNext Error');
  //     }
  //   } finally {
  //     setSeSaving(false);
  //   }
  // };
  const handleConfirmStockEntry = async (seData) => {
    setSeSaving(true);

    try {
      const conn = frappe.getConnectionSettings();

      if (!conn.isLive || !conn.connected) {
        const demoStockEntryName = `DEMO-SE-${Date.now().toString().slice(-6)}`;

        setStockEntryModal(prev => ({
          ...prev,
          stockEntryName: demoStockEntryName,
          docstatus: 0,
          saved: true,
          submitted: false
        }));

        setWorkOrders(prev =>
          prev.map(wo =>
            wo.id === seData.woId
              ? {
                  ...wo,
                  stockEntryCreated: true,
                  stockEntryName: demoStockEntryName,
                  stockEntryPostingDate: seData.postingDate,
                  stockEntryPostingTime: seData.postingTime
                }
              : wo
          )
        );

        showAlert(
          `Stock Entry ${demoStockEntryName} saved as Draft in demo mode. Now submit it to continue the flow.`,
          'success',
          'Stock Entry Draft Saved'
        );

        return;
      }

      setSyncStatusMsg('Saving Stock Entry draft on ERPNext...');

      const seRes = await frappe.saveStockEntryDraft({
        workOrder: seData.woId,
        company: seData.company,
        postingDate: seData.postingDate,
        postingTime: seData.postingTime,
        stockEntryName: seData.stockEntryName || '',
        items: seData.items
      });

      if (!seRes || !seRes.success) {
        showAlert(
          `Failed to save Stock Entry draft: ${seRes?.message || 'Unknown error'}`,
          'error',
          'ERPNext Error'
        );
        return;
      }

      const stockEntryName = seRes.name;

      setStockEntryModal(prev => ({
        ...prev,
        stockEntryName,
        docstatus: 0,
        saved: true,
        submitted: false
      }));

      setWorkOrders(prev =>
        prev.map(wo =>
          wo.id === seData.woId
            ? {
                ...wo,
                stockEntryCreated: true,
                stockEntryName,
                stockEntryPostingDate: seData.postingDate,
                stockEntryPostingTime: seData.postingTime
              }
            : wo
        )
      );

      showAlert(
        `Stock Entry ${stockEntryName} saved as Draft. Now submit it to start the Work Order in ERPNext.`,
        'success',
        'Stock Entry Draft Saved'
      );
    } catch (err) {
      showAlert(`Failed to save Stock Entry draft: ${err.message}`, 'error', 'ERPNext Error');
    } finally {
      setSeSaving(false);
      setSyncStatusMsg('');
    }
  };

  const handleSubmitStockEntry = async () => {
    if (!stockEntryModal?.stockEntryName) {
      showAlert('Please save the Stock Entry first.', 'warning', 'Stock Entry Not Saved');
      return;
    }

    setSeSaving(true);

    try {
      const conn = frappe.getConnectionSettings();
      const woId = stockEntryModal.woId;

      if (!conn.isLive || !conn.connected) {
        setWorkOrders(prev =>
          prev.map(wo =>
            wo.id === woId
              ? {
                  ...wo,
                  status: 'In Process',
                  materialTransferred: true,
                  stockEntryCreated: true,
                  submitted: true
                }
              : wo
          )
        );

        showAlert('Demo Stock Entry submitted locally. Work Order moved to In Process.', 'success', 'Submitted');
        setStockEntryModal(null);
        return;
      }

      setSyncStatusMsg('Submitting Stock Entry on ERPNext...');

      const submitRes = await frappe.submitStockEntry(stockEntryModal.stockEntryName);

      if (!submitRes || !submitRes.success) {
        showAlert(
          `Failed to submit Stock Entry: ${submitRes?.message || 'Unknown error'}`,
          'error',
          'ERPNext Error'
        );
        return;
      }

      showAlert(
        `Stock Entry ${stockEntryModal.stockEntryName} submitted. ERPNext will update the Work Order status.`,
        'success',
        'Stock Entry Submitted'
      );

      setStockEntryModal(null);
      setSelectedWOId(woId);

      // ERPNext updates Work Order status and creates/updates Job Cards after submit.
      // Reload after a tiny delay so server-side hooks/status updates are visible.
      setTimeout(() => {
        loadWorkOrders();
      }, 700);
    } catch (err) {
      showAlert(`Failed to submit Stock Entry: ${err.message}`, 'error', 'ERPNext Error');
    } finally {
      setSeSaving(false);
      setSyncStatusMsg('');
    }
  };

const handleSearchSeSource = async (idx, query) => {
    setSeSourceSearch(prev => ({ ...prev, [idx]: query }));
    setActiveSeSourceRow(idx);
    const res = await frappe.getWarehouses(query);
    setSeSourceSuggestions(prev => ({ ...prev, [idx]: res || [] }));
  };

  const selectSeSource = (idx, selectedWh) => {
    if (!stockEntryModal) return;
    const newItems = [...stockEntryModal.items];
    newItems[idx].sourceWarehouse = selectedWh.name;
    setStockEntryModal(prev => ({ ...prev, items: newItems }));
    setSeSourceSearch(prev => ({ ...prev, [idx]: selectedWh.name }));
    setActiveSeSourceRow(null);
  };

  const handleSearchSeTarget = async (idx, query) => {
    setSeTargetSearch(prev => ({ ...prev, [idx]: query }));
    setActiveSeTargetRow(idx);
    const res = await frappe.getWarehouses(query);
    setSeTargetSuggestions(prev => ({ ...prev, [idx]: res || [] }));
  };

  const selectSeTarget = (idx, selectedWh) => {
    if (!stockEntryModal) return;
    const newItems = [...stockEntryModal.items];
    newItems[idx].targetWarehouse = selectedWh.name;
    setStockEntryModal(prev => ({ ...prev, items: newItems }));
    setSeTargetSearch(prev => ({ ...prev, [idx]: selectedWh.name }));
    setActiveSeTargetRow(null);
  };

  // Deduct resources based on BOM
  const deductBOMResources = (bomCode, batchSize, stepType) => {
    const bom = BOMS[bomCode];
    if (!bom) return;

    setInventory(prevInv => {
      const updatedInv = { ...prevInv };

      bom.materials.forEach(mat => {
        const totalNeeded = mat.qty * batchSize;

        if (stepType === 'Mixing' && updatedInv[mat.code] && updatedInv[mat.code].category === 'Raw Material') {
          updatedInv[mat.code].qty = Math.max(0, updatedInv[mat.code].qty - totalNeeded);
          frappe.syncStockToERP(mat.code, updatedInv[mat.code].qty);
        }

        if (stepType === 'Can/Bottle Prep' && updatedInv[mat.code] && updatedInv[mat.code].category === 'Packaging') {
          updatedInv[mat.code].qty = Math.max(0, updatedInv[mat.code].qty - totalNeeded);
          frappe.syncStockToERP(mat.code, updatedInv[mat.code].qty);
        }
      });

      return updatedInv;
    });
  };

  const addFinishedGoodsStock = (productName, quantityProduced) => {
    const product = PRODUCTS.find(p => p.name === productName);
    if (!product) return;

    const fgCode = `FG-${product.code}`;
    setInventory(prevInv => {
      const updatedInv = { ...prevInv };
      if (updatedInv[fgCode]) {
        updatedInv[fgCode].qty += quantityProduced;
      } else {
        updatedInv[fgCode] = {
          name: `${product.name} Box`,
          qty: quantityProduced,
          unit: 'Box',
          category: 'Finished Goods',
          minLevel: 50
        };
      }
      frappe.syncStockToERP(fgCode, updatedInv[fgCode].qty);
      return updatedInv;
    });
  };

  const formatRemarksList = (list) => {
    return (list || []).map(log => {
      let logStr = `[${log.timestamp}] ${log.operator}: ${log.text}`;
      if (log.replies && log.replies.length > 0) {
        const repliesStr = log.replies.map(r => `  ↳ Reply [${r.timestamp}] ${r.operator}: ${r.text}`).join('\n');
        logStr += `\n${repliesStr}`;
      }
      return logStr;
    }).join('\n');
  };

  // Job Card State modifiers (Start, Pause, Resume, Finish, Add Remarks)
  const handleStartJobCard = async (woId, jcId) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const log = { timestamp, operator: currentUser, text: 'Job started.' };

    let finalRemarks = '';

    // Optimistic UI update
    setWorkOrders(prevWOs => prevWOs.map(wo => {
      if (wo.id !== woId) return wo;

      const updatedJobCards = wo.jobCards.map(jc => {
        if (jc.id === jcId) {
          const updatedRemarksList = [...(jc.remarksList || []), log];
          finalRemarks = formatRemarksList(updatedRemarksList);
          return {
            ...jc,
            status: 'Work In Progress',
            operator: currentUser,
            remarksList: updatedRemarksList,
            remarks: finalRemarks
          };
        }
        return jc;
      });

      return {
        ...wo,
        status: 'In Process',
        jobCards: updatedJobCards
      };
    }));

    try {
      const conn = frappe.getConnectionSettings();

      if (conn.isLive && conn.connected) {
        const jcRes = await frappe.syncJobCardToERP(jcId, 'Work In Progress', finalRemarks);

        if (!jcRes || jcRes.success === false) {
          throw new Error(jcRes?.error || 'Failed to start Job Card in ERPNext');
        }

        // Make ERPNext Work Order list match the shop-floor status.
        await frappe.forceWorkOrderInProgress(woId);

        // Reload from ERPNext so frontend does not show fake local-only status.
        await loadWorkOrders();
      }
    } catch (err) {
      showAlert(`Failed to start Job Card: ${err.message}`, 'error', 'ERPNext Error');
      loadWorkOrders();
    }
  };

  const handlePauseJobCard = (woId, jcId, operator, remarksText) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanOp = operator || currentUser;
    const cleanRemarks = remarksText || 'Operation paused.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: `Paused: ${cleanRemarks}`,
      actualStartTime: jcActualStartTime,
      actualEndTime: jcActualEndTime
    };

    let finalRemarks = '';
    setWorkOrders(prevWOs => prevWOs.map(wo => {
      if (wo.id !== woId) return wo;

      const updatedJobCards = wo.jobCards.map(jc => {
        if (jc.id === jcId) {
          const updatedRemarksList = [...(jc.remarksList || []), log];
          finalRemarks = formatRemarksList(updatedRemarksList);
          return {
            ...jc,
            status: 'On Hold',
            operator: cleanOp,
            remarksList: updatedRemarksList,
            remarks: finalRemarks,
            actualStartTime: jcActualStartTime || jc.actualStartTime,
            actualEndTime: jcActualEndTime || jc.actualEndTime
          };
        }
        return jc;
      });

      return { ...wo, jobCards: updatedJobCards };
    }));

    frappe.syncJobCardToERP(jcId, 'On Hold', finalRemarks);
    setActiveJCOp(null);
    setOperatorName('');
    setOperatorRemarks('');
    setJcActualStartTime('');
    setJcActualEndTime('');
  };

  const handleResumeJobCard = (woId, jcId) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const log = { timestamp, operator: currentUser, text: 'Job resumed.' };

    let finalRemarks = '';
    setWorkOrders(prevWOs => prevWOs.map(wo => {
      if (wo.id !== woId) return wo;

      const updatedJobCards = wo.jobCards.map(jc => {
        if (jc.id === jcId) {
          const updatedRemarksList = [...(jc.remarksList || []), log];
          finalRemarks = formatRemarksList(updatedRemarksList);
          return {
            ...jc,
            status: 'Work In Progress',
            operator: currentUser,
            remarksList: updatedRemarksList,
            remarks: finalRemarks
          };
        }
        return jc;
      });

      return { ...wo, jobCards: updatedJobCards };
    }));

    frappe.syncJobCardToERP(jcId, 'Work In Progress', finalRemarks);
  };

  const handleFinishJobCard = (woId, jcId, operator, remarksText) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanOp = operator || currentUser;
    const cleanRemarks = remarksText || 'Operation finished.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: `Finished: ${cleanRemarks}`,
      actualStartTime: jcActualStartTime,
      actualEndTime: jcActualEndTime
    };

    let finalRemarks = '';
    setWorkOrders(prevWOs => {
      return prevWOs.map(wo => {
        if (wo.id !== woId) return wo;

        const updatedCards = wo.jobCards.map(jc => {
          if (jc.id === jcId) {
            const updatedRemarksList = [...(jc.remarksList || []), log];
            finalRemarks = formatRemarksList(updatedRemarksList);
            return {
              ...jc,
              status: 'Completed',
              operator: cleanOp,
              remarksList: updatedRemarksList,
              remarks: finalRemarks,
              actualStartTime: jcActualStartTime || jc.actualStartTime,
              actualEndTime: jcActualEndTime || jc.actualEndTime
            };
          }
          return jc;
        });

        const completedCount = updatedCards.filter(jc => jc.status === 'Completed').length;
        const isLastCard = completedCount === updatedCards.length;

        const completedJC = wo.jobCards.find(jc => jc.id === jcId);

        if (completedJC && completedJC.operation === 'Mixing') {
          deductBOMResources(wo.bomNo, wo.quantity, 'Mixing');
        }

        if (completedJC && completedJC.operation === 'Can/Bottle Prep') {
          deductBOMResources(wo.bomNo, wo.quantity, 'Can/Bottle Prep');
        }

        const finalStatus = isLastCard ? 'Completed' : 'In Process';
        const producedCount = isLastCard ? wo.quantity : wo.produced;

        if (isLastCard) {
          addFinishedGoodsStock(wo.product, wo.quantity);
        }

        const updatedWO = {
          ...wo,
          status: finalStatus,
          produced: producedCount,
          jobCards: updatedCards
        };

        frappe.syncWorkOrderToERP(updatedWO);
        return updatedWO;
      });
    });

    frappe.syncJobCardToERP(jcId, 'Completed', finalRemarks);
    setActiveJCOp(null);
    setOperatorName('');
    setOperatorRemarks('');
    setJcActualStartTime('');
    setJcActualEndTime('');
  };

  const handleAddRemarkJobCard = (woId, jcId, operator, remarksText) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanOp = operator || currentUser;
    const cleanRemarks = remarksText || 'Comment added.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: cleanRemarks,
      actualStartTime: jcActualStartTime,
      actualEndTime: jcActualEndTime
    };

    let finalRemarks = '';
    setWorkOrders(prevWOs => prevWOs.map(wo => {
      if (wo.id !== woId) return wo;

      const updatedJobCards = wo.jobCards.map(jc => {
        if (jc.id === jcId) {
          const updatedRemarksList = [...(jc.remarksList || []), log];
          finalRemarks = formatRemarksList(updatedRemarksList);
          return {
            ...jc,
            remarksList: updatedRemarksList,
            remarks: finalRemarks,
            actualStartTime: jcActualStartTime || jc.actualStartTime,
            actualEndTime: jcActualEndTime || jc.actualEndTime
          };
        }
        return jc;
      });

      return { ...wo, jobCards: updatedJobCards };
    }));

    const targetWO = workOrders.find(wo => wo.id === woId);
    const targetJC = targetWO?.jobCards?.find(j => j.id === jcId);
    const currentStatus = targetJC ? targetJC.status : 'Work In Progress';
    frappe.syncJobCardToERP(jcId, currentStatus, finalRemarks);

    setActiveJCOp(null);
    setOperatorName('');
    setOperatorRemarks('');
    setJcActualStartTime('');
    setJcActualEndTime('');
  };

  const handleReplyToRemarkJobCard = (woId, jcId, remarkIndex, operator, replyText) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanOp = operator || currentUser;
    const cleanReply = replyText || '';
    if (!cleanReply.trim()) return;

    const replyObj = { timestamp, operator: cleanOp, text: cleanReply };

    let finalRemarks = '';
    setWorkOrders(prevWOs => prevWOs.map(wo => {
      if (wo.id !== woId) return wo;

      const updatedJobCards = wo.jobCards.map(jc => {
        if (jc.id === jcId) {
          const updatedRemarksList = (jc.remarksList || []).map((log, idx) => {
            if (idx === remarkIndex) {
              return {
                ...log,
                replies: [...(log.replies || []), replyObj]
              };
            }
            return log;
          });

          finalRemarks = formatRemarksList(updatedRemarksList);

          return {
            ...jc,
            remarksList: updatedRemarksList,
            remarks: finalRemarks
          };
        }
        return jc;
      });

      return { ...wo, jobCards: updatedJobCards };
    }));

    const targetWO = workOrders.find(wo => wo.id === woId);
    const targetJC = targetWO?.jobCards?.find(j => j.id === jcId);
    const currentStatus = targetJC ? targetJC.status : 'Work In Progress';
    frappe.syncJobCardToERP(jcId, currentStatus, finalRemarks);
  };

  const handleCreateNewWO = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const productCode = data.get('productCode');
    const bomNo = data.get('bomNo');
    const quantity = parseInt(data.get('quantity'), 10);
    const lineNo = data.get('lineNo');
    const plannedStart = data.get('plannedStart');
    const company = data.get('company') || 'Anantdv (Demo)';
    const sourceWarehouse = data.get('sourceWarehouse') || 'Stores - AD';
    const fgWarehouse = data.get('fgWarehouse') || 'Finished Goods - AD';
    const wipWarehouse = data.get('wipWarehouse') || 'Work In Progress - AD';

    const product = woProductsList.find(p => p.code === productCode) || PRODUCTS.find(p => p.code === productCode);

    if (!productCode || !product) {
      showAlert('Please select a valid Item to manufacture.', 'warning', 'Missing Item');
      return;
    }

    if (!bomNo) {
      showAlert('Please select an active submitted BOM for this item.', 'warning', 'Missing BOM');
      return;
    }

    if (!quantity || quantity <= 0) {
      showAlert('Please enter a valid quantity.', 'warning', 'Invalid Quantity');
      return;
    }

    setWoCreating(true);
    const plannedDateStr = plannedStart ? plannedStart.replace('T', ' ') : new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newWO = {
      // product: product.name,
      product: product.code,
      quantity: quantity,
      plannedStart: plannedDateStr,
      bomNo: bomNo,
      lineNo: lineNo || 'Filling Line 1',
      company,
      sourceWarehouse,
      fgWarehouse,
      wipWarehouse
    };

    try {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive) {
        setSyncStatusMsg('Creating Work Order on ERPNext...');
        const res = await frappe.createWorkOrder(newWO);
        if (res.success) {
          let jobCards = [];
          const ops = await frappe.getBOMOperations(bomNo);
          if (ops && ops.length > 0) {
            jobCards = ops;
          }

          const nextWO = {
            id: res.name,
            ...newWO,
            item: product.name,
            produced: 0,
            status: 'Pending',
            jobCards: jobCards
          };
          setWorkOrders(prev => [nextWO, ...prev]);
          setSelectedWOId(res.name);
          setShowNewWODrawer(false);
          loadWorkOrders();
        }
      } else {
        const mockName = `MFG-WO-2026-${String(workOrders.length + 98).padStart(5, '0')}`;
        const nextWO = {
          id: mockName,
          ...newWO,
          item: product.name,
          produced: 0,
          status: 'Pending',
          jobCards: [
            { id: 'PO-JOB00601', operation: 'Mixing', station: 'Mixing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00602', operation: 'Lab Testing', station: 'Lab Testing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00603', operation: 'Can/Bottle Prep', station: 'Can Preparation Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00604', operation: 'Filling', station: 'Filling Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00605', operation: 'Initial Quality Check', station: 'Initial QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00606', operation: 'Warmer', station: 'Warmer Machine', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00607', operation: 'Laser Labeling', station: 'Labeling Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00608', operation: 'Final Quality Check', station: 'Final QC Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00609', operation: 'Hand Packing', station: 'Packing Station', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00610', operation: 'Palletising', station: 'Palletisation Area', status: 'Not Started', operator: '', remarks: '', remarksList: [] },
            { id: 'PO-JOB00611', operation: 'Store & Dispatch', station: 'Warehouse/Logistics', status: 'Not Started', operator: '', remarks: '', remarksList: [] }
          ]
        };
        setWorkOrders(prev => [nextWO, ...prev]);
        setSelectedWOId(mockName);
        setShowNewWODrawer(false);
      }
    } catch (err) {
      showAlert(`Error creating Work Order on ERPNext: ${err.message}`, 'error', 'ERPNext Error');
    } finally {
      setWoCreating(false);
    }
  };

  const handleDeleteWorkOrder = async (woId) => {
    if (!window.confirm(`Are you sure you want to delete Work Order ${woId}?`)) return;
    try {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive) {
        await frappe.deleteWorkOrder(woId);
      }
      setWorkOrders(prev => prev.filter(wo => wo.id !== woId));
      if (selectedWOId === woId) setSelectedWOId(null);
      loadWorkOrders();
    } catch (err) {
      showAlert(`Error deleting Work Order: ${err.message}`, 'error', 'ERPNext Error');
    }
  };

  const handleAdjustStockSubmit = (e) => {
    e.preventDefault();
    setInventory(prev => {
      const updated = { ...prev };
      if (updated[adjustItemCode]) {
        updated[adjustItemCode].qty = Math.max(0, updated[adjustItemCode].qty + adjustQty);
        frappe.syncStockToERP(adjustItemCode, updated[adjustItemCode].qty);
      }
      return updated;
    });
    setShowAdjustStockModal(false);
    setAdjustItemCode('');
    setAdjustQty(0);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSyncStatusMsg('Verifying credentials...');

    try {
      const isLiveActive = settingsUrl && settingsApiKey && settingsApiSecret;
      const result = await frappe.login(settingsUrl, settingsApiKey, settingsApiSecret, !!isLiveActive);

      if (result.success) {
        setSyncStatusMsg('Connection settings synced successfully!');
        setCurrentUser(result.user);
        setCurrentUserRole(result.role);
        setTimeout(() => {
          setShowSettingsModal(false);
          setSyncStatusMsg('');
        }, 1200);
      } else {
        setSyncStatusMsg(`Sync error: ${result.message}`);
      }
    } catch (err) {
      setSyncStatusMsg(`Connection failed: ${err.message}`);
    }
  };

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedWorkOrders = isLoggedIn && frappe.getConnectionSettings().isLive
    ? filteredWorkOrders
    : filteredWorkOrders.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const totalWOPages = isLoggedIn && frappe.getConnectionSettings().isLive
    ? 5
    : Math.max(1, Math.ceil(filteredWorkOrders.length / recordsPerPage));

  // Render Login page if offline/not authenticated
  if (!isLoggedIn) {
    if (is2FAPhase === 'setup') {
      return (
        <div className="login-page">
          <div className="login-bg-decorations">
            <div className="login-blob login-blob-1"></div>
            <div className="login-blob login-blob-2"></div>
          </div>

          <div className="login-card totp-setup-card">
            <button onClick={() => setIs2FAPhase('none')} className="btn-back" type="button">
              ← Back to login
            </button>

            <div className="login-header" style={{ textAlign: 'center' }}>
              <div className="totp-icon-header">🛡️</div>
              <h2>Setup Authenticator</h2>
              <p>Scan this QR code with Google Authenticator to enable 2-Factor Authentication (2FA)</p>
            </div>

            {loginError && (
              <div className="totp-error-alert">
                <span>⚠️ {loginError}</span>
              </div>
            )}

            <div className="totp-setup-body">
              <div className="qr-container">
                {totpQrUrl && <img src={totpQrUrl} alt="Google Authenticator QR Code" className="qr-code-img" />}
              </div>

              <div className="secret-display-box">
                <label style={{ fontWeight: '600', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Manual Setup Key</label>
                <div className="secret-key-wrapper">
                  <span className="secret-key-text">{tempSecret}</span>
                  <button onClick={handleCopyMFAKey} className="btn-copy" type="button">
                    {copiedKey ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerify2FASetup} className="login-form">
                <div className="form-group">
                  <label htmlFor="otpCode">6-Digit Verification Code</label>
                  <input
                    id="otpCode"
                    type="text"
                    pattern="\d*"
                    maxLength="6"
                    className="form-input text-center letter-spacing-lg"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn-primary-login" disabled={loginLoading || otpCode.length !== 6}>
                  {loginLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    if (is2FAPhase === 'verify') {
      return (
        <div className="login-page">
          <div className="login-bg-decorations">
            <div className="login-blob login-blob-1"></div>
            <div className="login-blob login-blob-2"></div>
          </div>

          <div className="login-card totp-verify-card">
            <button onClick={() => setIs2FAPhase('none')} className="btn-back" type="button">
              ← Back to login
            </button>

            <div className="login-header" style={{ textAlign: 'center' }}>
              <div className="totp-icon-header">🛡️</div>
              <h2>MFA Verification</h2>
              <p>Enter the 6-digit code generated by your Google Authenticator app for <strong>{loginUsername}</strong></p>
            </div>

            {loginError && (
              <div className="totp-error-alert">
                <span>⚠️ {loginError}</span>
              </div>
            )}

            <form onSubmit={handleVerify2FALogin} className="login-form">
              <div className="form-group">
                <label htmlFor="otpCodeVerify">Authenticator Code</label>
                <input
                  id="otpCodeVerify"
                  type="text"
                  pattern="\d*"
                  maxLength="6"
                  className="form-input text-center letter-spacing-lg"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-primary-login" disabled={loginLoading || otpCode.length !== 6}>
                {loginLoading ? 'Authenticating...' : 'Verify & Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={handleReset2FA} className="btn-reset-2fa" style={{ fontSize: '11px', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer' }}>
                Reset 2FA Setup
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="login-page">
        <div className="login-bg-decorations">
          <div className="login-blob login-blob-1"></div>
          <div className="login-blob login-blob-2"></div>
        </div>

        <div className="login-card">
          <div className="login-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <img src={logo} alt="Island Chill Logo" style={{ height: '48px', width: 'auto' }} />
            </div>
            <h2 style={{ textAlign: 'center' }}>Island Chill</h2>
            <p style={{ textAlign: 'center' }}>Sign in to manage bottling and warehouse production</p>
          </div>

          {loginError && (
            <div className="totp-error-alert">
              <span>⚠️ {loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label>Username / Email</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  className="form-input-icon"
                  placeholder="administrator"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  disabled={loginLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input-icon"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <input
                type="checkbox"
                id="totp-toggle"
                checked={use2FA || localStorage.getItem(`totp_enabled_${loginUsername}`) === 'true'}
                disabled={localStorage.getItem(`totp_enabled_${loginUsername}`) === 'true'}
                onChange={(e) => setUse2FA(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="totp-toggle" style={{ fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Secure with Google Authenticator
                {localStorage.getItem(`totp_enabled_${loginUsername}`) === 'true' && (
                  <span style={{ color: 'var(--success)', fontWeight: 'bold', marginLeft: '6px' }}>(Enabled)</span>
                )}
              </label>
            </div>

            <button type="submit" className="btn-primary-login" disabled={loginLoading} style={{ marginTop: '16px' }}>
              {loginLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }



  const filteredMaintRecords = maintenanceRecords.filter(rec => {
    const matchesSearch = !maintSearchQuery ||
      (rec.id && rec.id.toLowerCase().includes(maintSearchQuery.toLowerCase())) ||
      (rec.operator && rec.operator.toLowerCase().includes(maintSearchQuery.toLowerCase())) ||
      (rec.supervisor && rec.supervisor.toLowerCase().includes(maintSearchQuery.toLowerCase())) ||
      (rec.equipment && rec.equipment.toLowerCase().includes(maintSearchQuery.toLowerCase())) ||
      (rec.area && rec.area.toLowerCase().includes(maintSearchQuery.toLowerCase()));

    const matchesFilter = maintFilterEquipment === 'All' || rec.equipment === maintFilterEquipment;
    return matchesSearch && matchesFilter;
  });

  const filteredSafetyRecords = safetyRecords.filter(rec => {
    const matchesSearch = !safetySearchQuery ||
      (rec.id && rec.id.toLowerCase().includes(safetySearchQuery.toLowerCase())) ||
      (rec.type && rec.type.toLowerCase().includes(safetySearchQuery.toLowerCase())) ||
      (rec.operator && rec.operator.toLowerCase().includes(safetySearchQuery.toLowerCase())) ||
      (rec.injuredPerson && rec.injuredPerson.toLowerCase().includes(safetySearchQuery.toLowerCase())) ||
      (rec.details && rec.details.toLowerCase().includes(safetySearchQuery.toLowerCase()));

    const matchesFilter = safetyFilterType === 'All' || rec.type === safetyFilterType;
    return matchesSearch && matchesFilter;
  });

  const filteredLabRecords = laboratoryRecords.filter(rec => {
    const matchesSearch = !labSearchQuery ||
      (rec.id && rec.id.toLowerCase().includes(labSearchQuery.toLowerCase())) ||
      (rec.type && rec.type.toLowerCase().includes(labSearchQuery.toLowerCase())) ||
      (rec.analyst && rec.analyst.toLowerCase().includes(labSearchQuery.toLowerCase())) ||
      (rec.verifiedBy && rec.verifiedBy.toLowerCase().includes(labSearchQuery.toLowerCase())) ||
      (rec.comments && rec.comments.toLowerCase().includes(labSearchQuery.toLowerCase()));

    const matchesFilter = labFilterType === 'All' || rec.type === labFilterType;
    return matchesSearch && matchesFilter;
  });




  const handleOpenSettings = () => {
    const conn = frappe.getConnectionSettings();
    setSettingsUrl(conn.url || 'https://demo.erpnext.com');
    setSettingsApiKey(conn.apiKey || '');
    setSettingsApiSecret(conn.apiSecret || '');
    setSyncStatusMsg('');
    setShowSettingsModal(true);
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header Bar */}
      {isLoggedIn && (
        <div className="mobile-header-bar">
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt="Island Chill Logo" style={{ height: '32px', width: 'auto' }} />
            <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Island Chill</span>
          </div>
          <div style={{ width: '40px' }}></div> {/* Spacer to balance menu button */}
        </div>
      )}

      {/* Sidebar Backdrop on Mobile */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="sidebar-brand" style={{ gap: '8px', paddingBottom: '16px' }}>
            <img src={logo} alt="Island Chill Logo" style={{ height: '40px', width: 'auto' }} />
            <div>
              <div className="brand-text">Island Chill</div>
              <div className="brand-subtext">Carpenters Water Fiji</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${currentTab === 'workflow' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('workflow'); setMobileMenuOpen(false); }}
            >
              🔄 Business Workflow
            </button>
            <button
              className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('dashboard'); setSelectedWOId(null); setMobileMenuOpen(false); }}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-item ${currentTab === 'work-orders' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('work-orders'); setMobileMenuOpen(false); }}
            >
              📋 Work Orders
            </button>
            <button
              className={`nav-item ${currentTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('inventory'); setMobileMenuOpen(false); }}
            >
              📦 Stock / Inventory
            </button>
            <button
              className={`nav-item ${currentTab === 'sales' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('sales'); setMobileMenuOpen(false); }}
            >
              💰 Sales Desk
            </button>
            <button
              className={`nav-item ${currentTab === 'bom' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('bom'); setMobileMenuOpen(false); }}
            >
              🧪 BOM Recipes
            </button>
            <button
              className={`nav-item ${currentTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('maintenance'); setMobileMenuOpen(false); }}
            >
              🔧 Maintenance
            </button>
            <button
              className={`nav-item ${currentTab === 'safety' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('safety'); setMobileMenuOpen(false); }}
            >
              🦺 Health & Safety
            </button>
            <button
              className={`nav-item ${currentTab === 'laboratory' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('laboratory'); setMobileMenuOpen(false); }}
            >
              🔬 Laboratory
            </button>
            <button
              className={`nav-item ${currentTab === 'cleaning' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('cleaning'); setMobileMenuOpen(false); }}
            >
              🧹 Cleaning & Sanitation
            </button>
            <button
              className={`nav-item ${currentTab === 'support' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('support'); setMobileMenuOpen(false); }}
            >
              🎧 Support Helpdesk
            </button>
            <button
              className={`nav-item ${currentTab === 'hr' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('hr'); setMobileMenuOpen(false); }}
            >
              👥 Human Resource
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-indicator">
              <span className="status-dot pulse"></span>
              <span>All Systems Operational</span>
            </div>
            <div className="status-chart">
              <div className="status-chart-bar" style={{ height: '40%' }}></div>
              <div className="status-chart-bar" style={{ height: '60%' }}></div>
              <div className="status-chart-bar" style={{ height: '55%' }}></div>
              <div className="status-chart-bar" style={{ height: '70%' }}></div>
              <div className="status-chart-bar" style={{ height: '90%' }}></div>
              <div className="status-chart-bar" style={{ height: '80%' }}></div>
              <div className="status-chart-bar" style={{ height: '85%' }}></div>
            </div>
          </div>

          <div className="user-profile" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar">{currentUser.substring(0, 2).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{currentUser}</span>
                <span className="user-role">{currentUserRole}</span>
              </div>
            </div>
            <button onClick={handleLogout} style={{ color: '#ef4444', fontSize: '14px', padding: '4px' }} title="Log Out">
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-workspace">
        <header className="app-header">
          <div className="header-welcome">
            <h1>Welcome back, {currentUser.split(' ')[0]} 👋</h1>
            <p>
              Bottling Shop Floor Status. Mode: {' '}
              <strong style={{ color: frappe.getConnectionSettings().isLive ? 'var(--success)' : 'var(--warning)' }}>
                {frappe.getConnectionSettings().isLive ? 'Live ERPNext' : 'Offline Simulation'}
              </strong>
            </p>
          </div>

          <div className="header-actions">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search work orders, items..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <button
                className="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {lowStockCount > 0 && <span className="bell-badge">{lowStockCount}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Alerts & Messages</h3>
                    <button onClick={() => setShowNotifications(false)}>✕</button>
                  </div>
                  <div className="notification-body">
                    {/* Low Stock Items */}
                    {Object.keys(inventory).filter(key => inventory[key].qty < inventory[key].minLevel).length > 0 ? (
                      Object.keys(inventory).filter(key => inventory[key].qty < inventory[key].minLevel).map(key => (
                        <div key={key} className="notification-item warning" onClick={() => { setCurrentTab('inventory'); setShowNotifications(false); }}>
                          <span className="notification-icon">⚠️</span>
                          <div className="notification-info">
                            <div className="notification-title">Low Stock: {inventory[key].name}</div>
                            <div className="notification-text">Current qty is {inventory[key].qty} {inventory[key].unit} (Threshold: {inventory[key].minLevel})</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-item success">
                        <span className="notification-icon">✅</span>
                        <div className="notification-info">
                          <div className="notification-title">Stock Levels Normal</div>
                          <div className="notification-text">No items are running below reorder levels.</div>
                        </div>
                      </div>
                    )}
                    {/* Recent Support Tickets */}
                    {tickets && tickets.slice(0, 2).map(tkt => (
                      <div key={tkt.name} className="notification-item info" onClick={() => { setCurrentTab('support'); setShowNotifications(false); }}>
                        <span className="notification-icon">🎧</span>
                        <div className="notification-info">
                          <div className="notification-title">Support Desk: {tkt.name}</div>
                          <div className="notification-text">{tkt.subject} (Customer: {tkt.customer})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="date-selector" title={`Time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}>
              <span>📅</span>
              <span>
                {currentTime.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} {currentTime.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* KPI Progress Sequence Cards */}
            <div className="flow-container">
              <div className="flow-card blue" onClick={() => setCurrentTab('work-orders')}>
                <div className="flow-icon-container">📝</div>
                <div className="flow-details">
                  <h3>Work Orders</h3>
                  <div className="flow-value">{workOrders.length}</div>
                  <div className="flow-status text-muted">
                    <span style={{ color: 'var(--info)' }}>●</span> {activeWOsCount} Active | {pendingWOsCount} Scheduled
                  </div>
                </div>
              </div>

              <div className="flow-arrow">➔</div>

              <div className="flow-card" onClick={() => setCurrentTab('work-orders')}>
                <div className="flow-icon-container">⚙️</div>
                <div className="flow-details">
                  <h3>Job Cards</h3>
                  <div className="flow-value">{inProgressJobCardsCount + 15}</div>
                  <div className="flow-status text-muted">
                    <span style={{ color: 'var(--warning)' }}>●</span> {inProgressJobCardsCount} In Process
                  </div>
                </div>
              </div>

              <div className="flow-arrow">➔</div>

              <div className="flow-card green" onClick={() => setCurrentTab('inventory')}>
                <div className="flow-icon-container">📦</div>
                <div className="flow-details">
                  <h3>Stock Alerts</h3>
                  <div className="flow-value" style={{ color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {lowStockCount} Low Items
                  </div>
                  <div className="flow-status text-muted">
                    <span>●</span> {Object.keys(inventory).length} total items
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics cards row */}
            <div className="metrics-row">
              <div className="metric-widget">
                <div className="metric-widget-header">
                  <span>Total Production</span>
                  <span className="icon">🏆</span>
                </div>
                <div className="metric-value-container">
                  <span className="metric-val">{Number(totalProduction).toFixed(2)} Box</span>
                  <span className="metric-change up">▲ 2.4%</span>
                </div>
              </div>

              <div className="metric-widget">
                <div className="metric-widget-header">
                  <span>Good Qty</span>
                  <span className="icon">✓</span>
                </div>
                <div className="metric-value-container">
                  <span className="metric-val">{goodProduction.toFixed(2)} Box</span>
                  <span className="metric-change up">▲ 9.8%</span>
                </div>
              </div>

              <div className="metric-widget">
                <div className="metric-widget-header">
                  <span>Loose Qty</span>
                  <span className="icon">⚠</span>
                </div>
                <div className="metric-value-container">
                  <span className="metric-val">{looseProduction.toFixed(2)} Box</span>
                  <span className="metric-change down">▼ 4.3%</span>
                </div>
              </div>

              <div className="metric-widget">
                <div className="metric-widget-header">
                  <span>Safety Alerts</span>
                  <span className="icon">🚨</span>
                </div>
                <div className="metric-value-container">
                  <span className="metric-val">{Number(lowStockCount).toFixed(2)} Items</span>
                  <span className="metric-change down" style={{ color: 'var(--danger)' }}>Critical</span>
                </div>
              </div>
            </div>

            {/* Live Lines status */}
            <div className="live-lines-section">
              <div className="line-card">
                <div className="line-video-container" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img src={line1} alt="Filling Line 1" className="line-placeholder-img" style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }} />
                    <div className="feed-noise" />
                    <div className="feed-hud">
                      <div className="hud-box" style={{ top: '25%', left: '30%', width: '45px', height: '45px' }}>
                        <span className="hud-label">BOT-041: 99.8%</span>
                      </div>
                      <div className="hud-box" style={{ top: '45%', left: '55%', width: '45px', height: '45px' }}>
                        <span className="hud-label">BOT-042: 100.0%</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '9px', fontFamily: 'monospace', color: '#00ff00', textShadow: '0 0 4px #00ff00', fontWeight: '600' }}>
                        FPS: 29.97 • RES: 1080P • AI VISION ACTIVE
                      </div>
                    </div>
                  </div>
                  <button
                    className="fullscreen-btn"
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '4px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                    onClick={() => setFullscreenElement('live1')}
                    title="Fullscreen Feed"
                  >
                    ⛶
                  </button>
                  <div className="live-badge">
                    <span className="live-dot"></span>
                    <span>LIVE</span>
                  </div>
                  <div className="line-info-overlay">
                    <h3 className="line-title">Filling Line 1 (Water Bottling)</h3>
                    <div className="line-status-text">
                      <span className="line-status-indicator"></span> Running Smoothly
                    </div>
                  </div>
                </div>
                <div className="line-card-footer">
                  <div className="line-stat-item">
                    <span className="line-stat-label">Active Job</span>
                    <span className="line-stat-value">Island Chill 1.5L Run</span>
                  </div>
                  <div className="line-stat-item">
                    <span className="line-stat-label">Conveyor Speed</span>
                    <span className="line-stat-value">120.00 cartons/hr</span>
                  </div>
                  <div className="line-stat-item">
                    <span className="line-stat-label">Operator</span>
                    <span className="line-stat-value">K. Reddy</span>
                  </div>
                </div>
              </div>

              <div className="line-card">
                <div className="line-video-container" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img src={line2} alt="Filling Line 2" className="line-placeholder-img" style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }} />
                    <div className="feed-noise" />
                    <div className="feed-hud">
                      <div className="hud-box" style={{ top: '35%', left: '20%', width: '40px', height: '40px' }}>
                        <span className="hud-label">CAN-891: FILL OK</span>
                      </div>
                      <div className="hud-box" style={{ top: '50%', left: '60%', width: '40px', height: '40px' }}>
                        <span className="hud-label">CAN-892: SEAL OK</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '9px', fontFamily: 'monospace', color: '#00ff00', textShadow: '0 0 4px #00ff00', fontWeight: '600' }}>
                        FPS: 29.97 • RES: 1080P • AI VISION ACTIVE
                      </div>
                    </div>
                  </div>
                  <button
                    className="fullscreen-btn"
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '4px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                    onClick={() => setFullscreenElement('live2')}
                    title="Fullscreen Feed"
                  >
                    ⛶
                  </button>
                  <div className="live-badge">
                    <span className="live-dot"></span>
                    <span>LIVE</span>
                  </div>
                  <div className="line-info-overlay">
                    <h3 className="line-title">Filling Line 2 (Alcoholic & Cans)</h3>
                    <div className="line-status-text">
                      <span className="line-status-indicator"></span> Running Smoothly
                    </div>
                  </div>
                </div>
                <div className="line-card-footer">
                  <div className="line-stat-item">
                    <span className="line-stat-label">Active Job</span>
                    <span className="line-stat-value">RUM Cola 500ml Can</span>
                  </div>
                  <div className="line-stat-item">
                    <span className="line-stat-label">Conveyor Speed</span>
                    <span className="line-stat-value">95.00 cartons/hr</span>
                  </div>
                  <div className="line-stat-item">
                    <span className="line-stat-label">Operator</span>
                    <span className="line-stat-value">S. Prasad</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistical Charts Section */}
            <div className="dashboard-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
              {/* Chart 1: Overall Equipment Effectiveness (OEE) Gauges */}
              <div className="details-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="details-card-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="details-card-title">Plant OEE Metrics (%)</h3>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    onClick={() => setFullscreenElement('chartOee')}
                    title="Fullscreen Chart"
                  >
                    ⛶
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Availability', value: 92.45, color: 'var(--info)' },
                    { label: 'Performance', value: 88.20, color: 'var(--warning)' },
                    { label: 'Quality Rate', value: 98.76, color: 'var(--success)' },
                    { label: 'Overall OEE', value: 80.54, color: 'var(--accent)' }
                  ].map((gauge, gIdx) => (
                    <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{gauge.label}</span>
                        <strong style={{ color: gauge.color }}>{gauge.value.toFixed(2)}%</strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${gauge.value}%`, backgroundColor: gauge.color, borderRadius: '4px', transition: 'width 1s ease' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Hourly Water Flow Rate & Energy Yield (Line Chart) */}
              <div className="details-card" style={{ padding: '20px' }}>
                <div className="details-card-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="details-card-title">Hourly Water Flow Rate (L/min)</h3>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    onClick={() => setFullscreenElement('chartFlow')}
                    title="Fullscreen Chart"
                  >
                    ⛶
                  </button>
                </div>
                <div style={{ height: '110px', position: 'relative', marginTop: '16px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="flow-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--info)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--info)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 80 Q 50 60 100 70 T 200 45 T 300 55 T 400 35 L 400 100 L 0 100 Z"
                      fill="url(#flow-glow)"
                    />
                    <path
                      d="M 0 80 Q 50 60 100 70 T 200 45 T 300 55 T 400 35"
                      fill="none"
                      stroke="var(--info)"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>08:00</span>
                    <span>10:00</span>
                    <span>12:00</span>
                    <span>14:00</span>
                    <span>16:00</span>
                  </div>
                </div>
              </div>

              {/* Chart 3: Product Defect Distribution (Donut Breakdown) */}
              <div className="details-card" style={{ padding: '20px' }}>
                <div className="details-card-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="details-card-title">Product Defect Breakdown</h3>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    onClick={() => setFullscreenElement('chartDefects')}
                    title="Fullscreen Chart"
                  >
                    ⛶
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: '110px', marginTop: '16px' }}>
                  <svg width="80" height="80" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--danger)" strokeWidth="3.2"
                      strokeDasharray="60 40" strokeDashoffset="25" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="3.2"
                      strokeDasharray="30 70" strokeDashoffset="85" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--info)" strokeWidth="3.2"
                      strokeDasharray="10 90" strokeDashoffset="115" />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                      <span style={{ color: 'var(--text-main)' }}>Underfill: 60.00%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--warning)', borderRadius: '50%' }}></span>
                      <span style={{ color: 'var(--text-main)' }}>Cap Seal: 30.00%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--info)', borderRadius: '50%' }}></span>
                      <span style={{ color: 'var(--text-main)' }}>Barcode Scan: 10.00%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Monitor Table */}
            <div className="dashboard-details-grid" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
              <div className="details-card">
                <div className="details-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 className="details-card-title">Work Order Monitor</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="text-input"
                      style={{ width: '200px', padding: '6px 12px', fontSize: '12px' }}
                      placeholder="Search Work Orders..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button className="primary-btn" onClick={() => setShowNewWODrawer(true)}>+ Schedule Job</button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Work Order</th>
                        <th>Item</th>
                        <th>Target Qty</th>
                        <th>Good Qty</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkOrders.slice((woMonitorPage - 1) * 20, woMonitorPage * 20).map(wo => {
                        let pct = wo.produced ? ((wo.produced / wo.quantity) * 100) : 0;
                        if (wo.status === 'Completed') pct = 100;

                        return (
                          <tr key={wo.id}>
                            <td style={{ fontWeight: '600' }}>{wo.id}</td>
                            <td>{wo.item}</td>
                            <td>{Number(wo.quantity).toFixed(2)} Box</td>
                            <td>{Number(wo.produced || 0).toFixed(2)} Box ({pct.toFixed(2)}%)</td>
                            <td>
                              <span className={`badge badge-${wo.status.toLowerCase().replace(' ', '-')}`}>
                                {wo.status}
                              </span>
                            </td>
                            <td>
                              <button className="view-btn" onClick={() => { setSelectedWOId(wo.id); setCurrentTab('work-orders'); }}>
                                👁️ View details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', padding: '0 20px 20px 20px' }}>
                  <button
                    className="secondary-btn"
                    disabled={woMonitorPage === 1}
                    onClick={() => setWoMonitorPage(prev => Math.max(1, prev - 1))}
                  >
                    ◀ Previous
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>
                    Page {woMonitorPage} of {Math.max(1, Math.ceil(filteredWorkOrders.length / 20))}
                  </span>
                  <button
                    className="secondary-btn"
                    disabled={woMonitorPage === Math.max(1, Math.ceil(filteredWorkOrders.length / 20))}
                    onClick={() => setWoMonitorPage(prev => Math.min(Math.max(1, Math.ceil(filteredWorkOrders.length / 20)), prev + 1))}
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Work Orders Tab */}
        {currentTab === 'work-orders' && (
          <div className="wo-tab-container">
            <div className="wo-tab-header">
              <div className="tab-title-desc">
                <h2>Production Work Orders & Execution</h2>
                <p>Manage scheduling, job card statuses, and bottling operations checklist.</p>
              </div>
              <button className="primary-btn" onClick={() => setShowNewWODrawer(true)}>
                Create Work Order
              </button>
            </div>

            <div className="wo-grid">
              {woLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading Work Orders from ERPNext...
                </div>
              ) : displayedWorkOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No Work Orders found.
                </div>
              ) : (
                displayedWorkOrders.map(wo => {
                  const isSelected = selectedWOId === wo.id;
                  let pct = 0;
                  if (wo.status === 'Completed') {
                    pct = 100;
                  } else if (wo.jobCards && wo.jobCards.length > 0) {
                    const completed = wo.jobCards.filter(jc => jc.status === 'Completed').length;
                    pct = (completed / wo.jobCards.length) * 100;
                  }

                  return (
                    <div key={wo.id} className="wo-card-container">
                      <div className="wo-card-header">
                        <div className="wo-card-title-block">
                          <div className="wo-card-icon">🏭</div>
                          <div className="wo-card-id-block">
                            <h3>{wo.id}</h3>
                            <p>{wo.product}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`badge badge-${wo.status.toLowerCase().replace(' ', '-')}`}>
                            {wo.status}
                          </span>
                          {WORK_ORDER_STARTABLE_STATUSES.includes(wo.status) && (
                            <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStartWorkOrder(wo.id)}>
                              Start Run
                            </button>
                          )}
                          <button
                            className="secondary-btn"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => setSelectedWOId(isSelected ? null : wo.id)}
                          >
                            {isSelected ? 'Collapse' : 'Show Operations'}
                          </button>
                          <button
                            className="secondary-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => handleDeleteWorkOrder(wo.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="wo-metadata-grid">
                        <div className="metadata-item">
                          <span className="metadata-label">Filling Line</span>
                          <span className="metadata-value">{wo.lineNo}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Batch Size</span>
                          <span className="metadata-value">{Number(wo.quantity).toFixed(2)} Box</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Produced Qty</span>
                          <span className="metadata-value">{Number(wo.produced || 0).toFixed(2)} Box</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Planned Start</span>
                          <span className="metadata-value">{wo.plannedStart}</span>
                        </div>
                      </div>

                      <div className="wo-progress-section">
                        <div className="progress-info">
                          <span>Checklist Completion</span>
                          <span>{pct.toFixed(2)}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="job-cards-section">
                          <h4 className="section-subtitle">Operational Job Cards ({wo.jobCards ? wo.jobCards.length : 0})</h4>

                          {(!wo.jobCards || wo.jobCards.length === 0) ? (
                            <p className="text-muted" style={{ fontSize: '13px', padding: '10px 0' }}>
                              Work Order not started yet. Hit "Start Run" above to auto-generate checklist cards.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {wo.jobCards.map((jc, index) => (
                                <div key={jc.id} className="jc-item-row" style={{ gridTemplateColumns: '50px 1.8fr 1fr 1fr 2.2fr' }}>
                                  <div className="jc-index">{(index + 1).toString().padStart(2, '0')}</div>
                                  <div className="jc-op-details">
                                    <h4>{jc.operation}</h4>
                                    <p>{jc.station} {jc.status !== 'Completed' && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({jc.status})</span>}</p>
                                    {(() => {
                                      let start = jc.actualStartTime || '';
                                      let end = jc.actualEndTime || '';
                                      if (jc.remarksList) {
                                        for (let i = jc.remarksList.length - 1; i >= 0; i--) {
                                          const log = jc.remarksList[i];
                                          if (log.actualStartTime && !start) start = log.actualStartTime;
                                          if (log.actualEndTime && !end) end = log.actualEndTime;
                                        }
                                      }
                                      if (start || end) {
                                        return (
                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {start && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong>Start:</strong> {start.replace('T', ' ')}</span>}
                                            {end && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong>End:</strong> {end.replace('T', ' ')}</span>}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>

                                  <div className="jc-operator-log text-muted">
                                    {jc.operator ? (
                                      <span>👤 {jc.operator}</span>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>

                                  <div className="jc-status-badge">
                                    <span className={`badge badge-${jc.status.toLowerCase().replace(' ', '-')}`}>
                                      {jc.status}
                                    </span>
                                  </div>

                                  {/* Dynamic actions block matching work order.png */}
                                  <div className="jc-actions" style={{ gap: '4px' }}>
                                    {/* Action: Start */}
                                    {/* {jc.status === 'Not Started' && wo.status === 'In Progress' && ( */}
                                    {JOB_CARD_STARTABLE_STATUSES.includes(jc.status) && (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status) || wo.materialTransferred) && (
                                      <button
                                        className="action-btn-small start"
                                        onClick={() => handleStartJobCard(wo.id, jc.id)}
                                      >
                                        ▶ Start
                                      </button>
                                    )}

                                    {/* Actions: Pause, Finish */}
                                    {JOB_CARD_RUNNING_STATUSES.includes(jc.status) && (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status) || wo.materialTransferred) && (
                                      <>
                                        <button
                                          className="action-btn-small"
                                          style={{ backgroundColor: 'var(--warning)', color: '#111' }}
                                          onClick={() => setActiveJCOp({ woId: wo.id, jcId: jc.id, operation: jc.operation, action: 'pause' })}
                                        >
                                          ⏸ Pause
                                        </button>
                                        <button
                                          className="action-btn-small complete"
                                          onClick={() => setActiveJCOp({ woId: wo.id, jcId: jc.id, operation: jc.operation, action: 'finish' })}
                                        >
                                          ✓ Finish
                                        </button>
                                      </>
                                    )}

                                    {/* Actions: Resume, Finish, Add Remarks */}
                                    {JOB_CARD_PAUSED_STATUSES.includes(jc.status) && (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status) || wo.materialTransferred) && (
                                      <>
                                        <button
                                          className="action-btn-small start"
                                          onClick={() => handleResumeJobCard(wo.id, jc.id)}
                                        >
                                          ▶ Resume
                                        </button>
                                        <button
                                          className="action-btn-small complete"
                                          onClick={() => setActiveJCOp({ woId: wo.id, jcId: jc.id, operation: jc.operation, action: 'finish' })}
                                        >
                                          ✓ Finish
                                        </button>
                                      </>
                                    )}

                                    {/* Done Indicator */}
                                    {jc.status === 'Completed' && (
                                      <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '12px', marginRight: '6px' }}>✓ Done</span>
                                    )}

                                    {/* Action: Remarks (Unified entrypoint for viewing history and adding new remarks) */}
                                    <button
                                      className="action-btn-small remarks"
                                      style={{ padding: '6px 8px' }}
                                      onClick={() => {
                                        setOperatorName(jc.operator || currentUser || '');
                                        setOperatorRemarks('');
                                        setActiveTimelineJC({ woId: wo.id, jcId: jc.id, operation: jc.operation });
                                      }}
                                    >
                                      💬 Remarks
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
              <button
                className="secondary-btn"
                disabled={currentPage === 1 || woLoading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                ◀ Previous
              </button>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                Page {currentPage} of {totalWOPages}
              </span>
              <button
                className="secondary-btn"
                disabled={currentPage === totalWOPages || woLoading}
                onClick={() => setCurrentPage(prev => Math.min(totalWOPages, prev + 1))}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {currentTab === 'inventory' && (() => {
          const conn = frappe.getConnectionSettings();
          const isLiveMode = conn.isLive && conn.connected;

          const allInvItems = isLiveMode
            ? erpItems
            : Object.keys(inventory).map(code => ({ code, ...inventory[code] }));

          const filteredInvItems = allInvItems.filter(item =>
            item.code.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(invSearchQuery.toLowerCase())
          );

          const displayedInvItems = filteredInvItems.slice((invPage - 1) * 20, invPage * 20);
          const totalInvPages = Math.max(1, Math.ceil(filteredInvItems.length / 20));
          const selectedItem = filteredInvItems.find(i => i.code === selectedItemCode) || filteredInvItems[0] || allInvItems[0];

          return (
            <div className="inv-tab-container">
              <div className="wo-tab-header">
                <div className="tab-title-desc">
                  <h2>Warehouse Stocks & Inventory Control</h2>
                  <p>Monitor raw ingredients, bottle components, caps, and final finished goods boxes.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="text-input"
                    style={{ width: '200px', padding: '6px 12px', fontSize: '12px' }}
                    placeholder="Search Inventory..."
                    value={invSearchQuery}
                    onChange={e => setInvSearchQuery(e.target.value)}
                  />
                  <button className="primary-btn" onClick={() => {
                    const firstItem = Object.keys(inventory)[0];
                    setAdjustItemCode(firstItem);
                    setShowAdjustStockModal(true);
                  }}>
                    Adjust Stock
                  </button>
                </div>
              </div>

              <div className="inv-explorer-grid">
                <div className="details-card">
                  {itemsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading Items from ERPNext...
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Qty In Stock</th>
                            <th>Safety Level</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedInvItems.map(item => {
                            let health = 'normal';
                            if (item.qty < item.minLevel) {
                              health = 'low';
                            } else if (item.qty < item.minLevel * 1.5) {
                              health = 'warning';
                            }

                            const isSelected = selectedItemCode === item.code;

                            return (
                              <tr
                                key={item.code}
                                onClick={() => setSelectedItemCode(item.code)}
                                style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.08)' : '' }}
                                className={isSelected ? 'active-row' : ''}
                              >
                                <td style={{ fontWeight: '600' }}>{item.code}</td>
                                <td>{item.name}</td>
                                <td>
                                  <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                                    {item.category}
                                  </span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                  {Number(item.qty).toFixed(2)} {item.unit}
                                </td>
                                <td className="text-muted">
                                  {Number(item.minLevel).toFixed(2)} {item.unit}
                                </td>
                                <td>
                                  <span className={`stock-alert-text ${health}`} style={{ fontWeight: '600', fontSize: '11px' }}>
                                    {health === 'low' && '🚨 REORDER'}
                                    {health === 'warning' && '⚠ WARNING'}
                                    {health === 'normal' && '✓ OK'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Pagination Controls */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', padding: '16px 0' }}>
                    <button
                      className="secondary-btn"
                      disabled={invPage === 1}
                      onClick={() => setInvPage(prev => Math.max(1, prev - 1))}
                    >
                      ◀ Previous
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>
                      Page {invPage} of {totalInvPages}
                    </span>
                    <button
                      className="secondary-btn"
                      disabled={invPage === totalInvPages}
                      onClick={() => setInvPage(prev => Math.min(totalInvPages, prev + 1))}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

                {/* Right Side: Detailed Panel */}
                {selectedItem && (
                  <div className="details-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {selectedItem.category}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px', color: 'var(--text-heading)' }}>
                        {selectedItem.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                        Item Code: {selectedItem.code}
                      </div>
                    </div>

                    {/* Dynamic Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Average Age</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: 'var(--text-main)' }}>
                          {selectedItem.category === 'Finished Goods' ? '4.50 days' : '0.00 days'}
                        </div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Time to Produce</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: 'var(--text-main)' }}>
                          {selectedItem.category === 'Finished Goods' ? (selectedItem.code.includes('RUM') ? '12.50 mins' : '8.00 mins') : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Trending Sparklines - Show only for Finished Goods */}
                    {selectedItem.category === 'Finished Goods' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '500' }}>Production Trend (7d)</span>
                            <span style={{ color: 'var(--success)', fontWeight: '600' }}>+12.4%</span>
                          </div>
                          <div style={{ height: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', padding: '4px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path
                                d="M 0 25 Q 15 15 30 20 T 60 10 T 90 5"
                                fill="none"
                                stroke="var(--success)"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '500' }}>Consumption / Forecast</span>
                            <span style={{ color: 'var(--warning)', fontWeight: '600' }}>Balanced</span>
                          </div>
                          <div style={{ height: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', padding: '4px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path
                                d="M 0 20 Q 25 15 50 25 T 100 12"
                                fill="none"
                                stroke="var(--warning)"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Card */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Level:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{selectedItem.qty.toFixed(2)} {selectedItem.unit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Safety Stock Limit:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{selectedItem.minLevel.toFixed(2)} {selectedItem.unit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Storage Area:</span>
                        <strong style={{ color: 'var(--text-main)' }}>
                          {selectedItem.category === 'Finished Goods' ? 'Finished Goods WH' : 'Raw Materials WH'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* BOM Recipes Tab */}
        {currentTab === 'bom' && (
          <div className="bom-tab-container">
            <div className="tab-title-desc">
              <h2>Bill of Materials (BOM) & Recipes</h2>
              <p>Explore precise ingredient and packaging formulations required for a box of 24/12 finished products.</p>
            </div>

            <div className="bom-explorer-grid">
              <div className="bom-list">
                <div className="bom-list-header">Finished Products Formula</div>
                {bomLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading BOMs...
                  </div>
                ) : bomList.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No BOMs loaded.
                  </div>
                ) : (
                  bomList.map(bom => (
                    <div
                      key={bom.id}
                      className={`bom-list-item ${selectedBomId === bom.id ? 'active' : ''}`}
                      onClick={() => setSelectedBomId(bom.id)}
                    >
                      <div className="bom-list-item-title">{bom.productName || bom.name}</div>
                      <div className="bom-list-item-code">{bom.id} {bom.active ? '• Active' : ''}</div>
                    </div>
                  ))
                )}

                {/* BOM Pagination */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    className="secondary-btn"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    disabled={bomPage === 1 || bomLoading}
                    onClick={() => setBomPage(prev => Math.max(1, prev - 1))}
                  >
                    ◀ Previous
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>
                    Page {bomPage}
                  </span>
                  <button
                    className="secondary-btn"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    disabled={bomList.length < 20 || bomLoading}
                    onClick={() => setBomPage(prev => prev + 1)}
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              <div className="bom-recipe-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Formula Detail: {selectedBomId}</h3>
                    <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
                      Quantities specified below are required to produce the finished goods carton.
                    </p>
                  </div>
                  <button
                    className="primary-btn no-print"
                    onClick={() => window.print()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
                  >
                    🖨️ Print Formula
                  </button>
                </div>

                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Material Code</th>
                      <th>Material Name</th>
                      <th>Qty Required</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBomMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No materials found for this formula.
                        </td>
                      </tr>
                    ) : (
                      activeBomMaterials.map(mat => (
                        <tr key={mat.code}>
                          <td style={{ fontWeight: '600' }}>{mat.code}</td>
                          <td>{mat.name}</td>
                          <td style={{ fontWeight: '600', color: 'var(--accent-hover)' }}>{Number(mat.qty).toFixed(2)}</td>
                          <td>{mat.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {currentTab === 'sales' && (() => {
          const filteredInvoices = salesInvoicesList.filter(inv =>
            inv.name.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
            inv.customer.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
            inv.status.toLowerCase().includes(salesSearchQuery.toLowerCase())
          );

          const filteredDeliveryNotes = deliveryNotesList.filter(dn =>
            dn.name.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
            dn.customer.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
            dn.status.toLowerCase().includes(salesSearchQuery.toLowerCase())
          );

          return (
            <div className="bom-tab-container">
              <div className="tab-title-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2>💰 Sales & Billing Operations</h2>
                  <p>Manage, invoice, and track finished goods shipments and invoice dispatches.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {salesSubTab === 'invoice' ? (
                    <button
                      className="primary-btn"
                      onClick={() => setShowCreateInvoiceModal(true)}
                      style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      + Create Sales Invoice
                    </button>
                  ) : (
                    <button
                      className="primary-btn"
                      onClick={() => setShowCreateDeliveryNoteModal(true)}
                      style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                    >
                      + Create Delivery Note
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tabs toggles */}
              <div className="sub-tabs-container" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '20px', paddingBottom: '2px' }}>
                <button
                  className={`tab-btn ${salesSubTab === 'invoice' ? 'active' : ''}`}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', border: 'none', borderBottom: salesSubTab === 'invoice' ? '3px solid var(--accent)' : 'none', background: 'none', cursor: 'pointer', color: salesSubTab === 'invoice' ? 'var(--accent)' : 'var(--text-muted)' }}
                  onClick={() => { setSalesSubTab('invoice'); setSelectedInvoice(null); }}
                >
                  📝 Sales Invoices
                </button>
                <button
                  className={`tab-btn ${salesSubTab === 'delivery' ? 'active' : ''}`}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', border: 'none', borderBottom: salesSubTab === 'delivery' ? '3px solid var(--accent)' : 'none', background: 'none', cursor: 'pointer', color: salesSubTab === 'delivery' ? 'var(--accent)' : 'var(--text-muted)' }}
                  onClick={() => { setSalesSubTab('delivery'); setSelectedDeliveryNote(null); }}
                >
                  🚚 Delivery Notes
                </button>
              </div>

              {/* Content body split layout */}
              <div className="bom-explorer-grid">

                {/* Left Column: List with pagination */}
                <div className="bom-list">
                  <div style={{ paddingBottom: '8px' }}>
                    <input
                      type="text"
                      className="text-input"
                      style={{ width: '100%', padding: '6px 12px', fontSize: '11px' }}
                      placeholder={salesSubTab === 'invoice' ? "Search Invoices..." : "Search Delivery Notes..."}
                      value={salesSearchQuery}
                      onChange={e => setSalesSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="bom-list-header" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    {salesSubTab === 'invoice' ? 'Invoices List' : 'Delivery Notes List'}
                  </div>

                  {salesLoading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading data...
                    </div>
                  ) : salesSubTab === 'invoice' ? (
                    filteredInvoices.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</div>
                    ) : (
                      filteredInvoices.map(inv => (
                        <div
                          key={inv.name}
                          className={`bom-list-item ${selectedInvoice?.name === inv.name ? 'active' : ''}`}
                          onClick={async () => {
                            setSalesLoading(true);
                            try {
                              const details = await frappe.getSalesInvoiceDetails(inv.name);
                              setSelectedInvoice(details);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setSalesLoading(false);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{inv.name}</span>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : inv.status === 'Draft' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: inv.status === 'Paid' ? 'var(--success)' : inv.status === 'Draft' ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 'bold' }}>{inv.status}</span>
                          </div>
                          <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>{inv.customer}</span>
                            <strong>${Number(inv.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📅 {inv.posting_date}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    filteredDeliveryNotes.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No delivery notes found.</div>
                    ) : (
                      filteredDeliveryNotes.map(dn => (
                        <div
                          key={dn.name}
                          className={`bom-list-item ${selectedDeliveryNote?.name === dn.name ? 'active' : ''}`}
                          onClick={async () => {
                            setSalesLoading(true);
                            try {
                              const details = await frappe.getDeliveryNoteDetails(dn.name);
                              setSelectedDeliveryNote(details);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setSalesLoading(false);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{dn.name}</span>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: dn.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : dn.status === 'Draft' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: dn.status === 'Completed' ? 'var(--success)' : dn.status === 'Draft' ? 'var(--text-muted)' : 'var(--warning)', fontWeight: 'bold' }}>{dn.status}</span>
                          </div>
                          <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>{dn.customer}</span>
                            <strong>${Number(dn.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📅 {dn.posting_date}
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* Left Side Pagination */}
                  {salesSubTab === 'invoice' ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '12px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                      <button
                        className="secondary-btn"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={salesInvoicePage === 1 || salesLoading}
                        onClick={() => setSalesInvoicePage(prev => Math.max(1, prev - 1))}
                      >
                        ◀ Previous
                      </button>
                      <span style={{ fontSize: '11px', fontWeight: '600' }}>Page {salesInvoicePage}</span>
                      <button
                        className="secondary-btn"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={salesInvoicesList.length < 20 || salesLoading}
                        onClick={() => setSalesInvoicePage(prev => prev + 1)}
                      >
                        Next ▶
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '12px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                      <button
                        className="secondary-btn"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={deliveryNotePage === 1 || salesLoading}
                        onClick={() => setDeliveryNotePage(prev => Math.max(1, prev - 1))}
                      >
                        ◀ Previous
                      </button>
                      <span style={{ fontSize: '11px', fontWeight: '600' }}>Page {deliveryNotePage}</span>
                      <button
                        className="secondary-btn"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={deliveryNotesList.length < 20 || salesLoading}
                        onClick={() => setDeliveryNotePage(prev => prev + 1)}
                      >
                        Next ▶
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column: Standard Format Detail View */}
                <div className="bom-recipe-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  {salesSubTab === 'invoice' ? (
                    !selectedInvoice ? (
                      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '48px', marginBottom: '12px' }}>📄</span>
                        <h3>Select a Sales Invoice</h3>
                        <p style={{ fontSize: '13px' }}>Click an item on the left list to view invoice detail slip.</p>
                      </div>
                    ) : (
                      <div className="print-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>TAX INVOICE</h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Carpenters Water Fiji PTE Limited</span>
                            <div style={{ marginTop: '8px', fontSize: '12px' }}>
                              <strong>Bill To:</strong> {selectedInvoice.customer}<br />
                              <strong>Tax ID:</strong> FJ-TIN-893240-Z
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <svg width="60" height="60" style={{ border: '1px solid var(--border-color)', padding: '2px', backgroundColor: '#fff', borderRadius: '4px' }} viewBox="0 0 29 29">
                              <path d="M0 0h7v7H0zm1 1v5h5V1zm8-1h1v1H9zm1 1h1v1h-1zm-2 1h1v1H8zm3 0h1v1h-1zM9 4h1v1H9zm2 0h1v1h-1zm-3 1h1v1H8zm1 1h1v1H9zM0 9h7v7H0zm1 1v5h5v-5zm11-2h1v1h-1zm-1 2h1v1h-1zm2 1h1v1h-1zm-2 2h1v1h-1zm1 1h1v1h-1zm3-6h1v1h-1zm-1 2h1v1h-1zm2 1h1v1h-1zm-2 2h1v1h-1zm1 1h1v1h-1zm5-7h7v7h-7zm1 1v5h5v-5zm-11 8h1v1h-1zm2 0h1v1h-1zm-1 1h1v1h-1zm-2 2h1v1h-1zm3 0h1v1h-1zm1 1h1v1h-1zm-3 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm7-7h1v1h-1zm2 0h1v1h-1zm-1 1h1v1h-1zm-2 2h1v1h-1zm3 0h1v1h-1zm1 1h1v1h-1zm-3 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-7 2h1v1h-1zm2 0h1v1h-1zm-1 1h1v1h-1zm5-1h1v1h-1zm2 0h1v1h-1zm-1 1h1v1h-1z" fill="#111" />
                            </svg>
                            <div style={{ textAlign: 'right', fontSize: '12px' }}>
                              <h4 style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '14px', margin: '0 0 4px 0' }}>{selectedInvoice.name}</h4>
                              <span><strong>Posting Date:</strong> {selectedInvoice.posting_date}</span><br />
                              <span><strong>Due Date:</strong> {selectedInvoice.due_date || '-'}</span><br />
                              <span style={{ fontSize: '11px', display: 'inline-block', marginTop: '6px', padding: '3px 8px', borderRadius: '4px', backgroundColor: selectedInvoice.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedInvoice.status === 'Paid' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{selectedInvoice.status}</span>
                            </div>
                          </div>
                        </div>

                        <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--border-color)' }}>
                              <th style={{ padding: '8px' }}>Item Code</th>
                              <th style={{ padding: '8px' }}>Item Description</th>
                              <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                              <th style={{ padding: '8px', textAlign: 'right' }}>Rate</th>
                              <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items?.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: '700' }}>{item.item_code}</td>
                                <td style={{ padding: '8px' }}>{item.item_name || 'Standard PET Water Box'}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>${Number(item.rate).toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>${Number(item.amount || (item.qty * item.rate)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                          <div style={{ flex: 1, minWidth: '240px', fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', borderLeft: '3px solid var(--accent)', paddingLeft: '8px', marginTop: '12px' }}>
                            <strong>Amount in Words:</strong><br />
                            <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{convertNumberToWords(selectedInvoice.grand_total || selectedInvoice.items?.reduce((acc, it) => acc + (it.qty * it.rate), 0) * 1.09)}</span>
                          </div>
                          <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Net Total:</span>
                              <strong>${Number(selectedInvoice.net_total || (selectedInvoice.grand_total - (selectedInvoice.total_taxes_and_charges || 0)) || selectedInvoice.items?.reduce((acc, it) => acc + (it.qty * it.rate), 0)).toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>VAT (9%):</span>
                              <strong>${Number(selectedInvoice.total_taxes_and_charges || (selectedInvoice.grand_total * 0.09) || selectedInvoice.items?.reduce((acc, it) => acc + (it.qty * it.rate), 0) * 0.09).toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '14px', color: 'var(--accent)' }}>
                              <span>Grand Total:</span>
                              <strong>${Number(selectedInvoice.grand_total || selectedInvoice.items?.reduce((acc, it) => acc + (it.qty * it.rate), 0) * 1.09).toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Bank Details & Terms Footer */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '11px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginTop: '10px' }}>
                          <div>
                            <strong style={{ color: 'var(--text-heading)', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>🏦 BANK PAYMENT DETAILS</strong>
                            <span style={{ color: 'var(--text-muted)' }}>Bank Name:</span> <strong style={{ color: 'var(--text-main)' }}>Westpac Banking Fiji</strong><br />
                            <span style={{ color: 'var(--text-muted)' }}>Account Name:</span> <strong style={{ color: 'var(--text-main)' }}>Carpenters Water Fiji PTE Limited</strong><br />
                            <span style={{ color: 'var(--text-muted)' }}>Account Number:</span> <strong style={{ color: 'var(--text-main)' }}>9801452309</strong><br />
                            <span style={{ color: 'var(--text-muted)' }}>BSB/SWIFT:</span> <strong style={{ color: 'var(--text-main)' }}>WPACFJ21</strong>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-heading)', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>📋 TERMS & CONDITIONS</strong>
                            <span style={{ color: 'var(--text-muted)' }}>1. Payment terms are net 30 days from posting date.</span><br />
                            <span style={{ color: 'var(--text-muted)' }}>2. Please mention Invoice number as deposit reference.</span><br />
                            <span style={{ color: 'var(--text-muted)' }}>3. Late accounts accrue 1.5% monthly compound interest.</span>
                          </div>
                        </div>

                        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                          <button type="button" className="secondary-btn" onClick={() => setShowAmendInvoiceModal(true)}>✏️ Amend Invoice</button>
                          <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Invoice</button>
                        </div>
                      </div>
                    )
                  ) : (
                    !selectedDeliveryNote ? (
                      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '48px', marginBottom: '12px' }}>🚚</span>
                        <h3>Select a Delivery Note</h3>
                        <p style={{ fontSize: '13px' }}>Click an item on the left list to view delivery note slip.</p>
                      </div>
                    ) : (
                      <div className="print-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>DELIVERY NOTE</h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Carpenters Water Fiji PTE Limited</span>
                            <div style={{ marginTop: '8px', fontSize: '12px' }}>
                              <strong>Deliver To:</strong> {selectedDeliveryNote.customer}<br />
                              <strong>Shipment Point:</strong> Western Depot Lautoka
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '12px' }}>
                            <h4 style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '14px', margin: '0 0 4px 0' }}>{selectedDeliveryNote.name}</h4>
                            <span><strong>Posting Date:</strong> {selectedDeliveryNote.posting_date}</span><br />
                            <span><strong>Posting Time:</strong> {selectedDeliveryNote.posting_time}</span><br />
                            <span style={{ fontSize: '11px', display: 'inline-block', marginTop: '6px', padding: '3px 8px', borderRadius: '4px', backgroundColor: selectedDeliveryNote.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: selectedDeliveryNote.status === 'Completed' ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>{selectedDeliveryNote.status}</span>
                          </div>
                        </div>

                        <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--border-color)' }}>
                              <th style={{ padding: '8px' }}>Item Code</th>
                              <th style={{ padding: '8px' }}>Item Description</th>
                              <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                              <th style={{ padding: '8px' }}>Source Warehouse</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDeliveryNote.items?.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: '700' }}>{item.item_code}</td>
                                <td style={{ padding: '8px' }}>{item.item_name || 'Standard PET Water Box'}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                                <td style={{ padding: '8px' }}>{item.warehouse || 'Finished Goods - CWFL'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <p><strong>Note:</strong> Goods received in good order. Please sign below upon cargo handover confirmation.</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
                            <div style={{ borderTop: '1px dashed var(--text-muted)', paddingTop: '8px', textAlign: 'center' }}>Authorized Signature (Sender)</div>
                            <div style={{ borderTop: '1px dashed var(--text-muted)', paddingTop: '8px', textAlign: 'center' }}>Customer Signature (Receiver)</div>
                          </div>
                        </div>

                        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                          <button type="button" className="secondary-btn" onClick={() => setShowAmendDeliveryNoteModal(true)}>✏️ Amend Note</button>
                          <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Delivery Note</button>
                        </div>
                      </div>
                    )
                  )}
                </div>

              </div>
            </div>
          )
        })()}

        {/* Maintenance Tab */}
        {currentTab === 'maintenance' && (
          <div className="maintenance-tab-container">
            <div className="tab-title-desc">
              <h2>Preventive Maintenance Operations</h2>
              <p>Execute, log, and view status dashboards for Fiji Bottling Plant daily preventive maintenance schedules.</p>
            </div>

            {/* Dashboard metrics widgets */}
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Logged Checklists</span>
                  <span className="metric-icon">🔧</span>
                </div>
                <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{maintenanceRecords.length}</div>
                <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>Checklists completed</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equipment Monitored</span>
                  <span className="metric-icon">⚙️</span>
                </div>
                <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>
                  {Array.from(new Set(MAINTENANCE_TEMPLATES.map(t => t.equipment))).length} / {Array.from(new Set(MAINTENANCE_TEMPLATES.map(t => t.equipment))).length}
                </div>
                <div className="metric-footer text-success" style={{ fontSize: '11px', color: 'var(--success)' }}>● All Operational</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Task Checks</span>
                  <span className="metric-icon">✓</span>
                </div>
                <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>
                  {maintenanceRecords.reduce((sum, r) => sum + (r.totalChecked || 0), 0)}
                </div>
                <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>Completed check items</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Activity</span>
                  <span className="metric-icon">⏱️</span>
                </div>
                <div className="metric-value" style={{ fontSize: '15px', fontWeight: '800', margin: '14px 0 13px 0', height: '24px', display: 'flex', alignItems: 'center' }}>
                  {maintenanceRecords[0] ? maintenanceRecords[0].timestamp.split(' ')[0] : 'No logs yet'}
                </div>
                <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>Timestamp of last save</div>
              </div>
            </div>

            {/* Sub-Tabs selection bar for Maintenance */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '2px' }}>
              <button
                type="button"
                className={`tab-btn ${activeMaintSubTab === 'preventive' ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeMaintSubTab === 'preventive' ? '3px solid var(--accent)' : 'none',
                  color: activeMaintSubTab === 'preventive' ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveMaintSubTab('preventive')}
              >
                ⚙️ Daily Preventive Checklists
              </button>
              <button
                type="button"
                className={`tab-btn ${activeMaintSubTab === 'regular-breakdown' ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeMaintSubTab === 'regular-breakdown' ? '3px solid var(--accent)' : 'none',
                  color: activeMaintSubTab === 'regular-breakdown' ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveMaintSubTab('regular-breakdown')}
              >
                🛠️ Regular Checks & Breakdowns
              </button>
            </div>

            {activeMaintSubTab === 'preventive' && (
              <>
                {/* Main view container: Templates select list */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Available Daily Preventive Checklists</h3>
                  <button
                    type="button"
                    onClick={() => setMaintViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                    className="secondary-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                  >
                    {maintViewMode === 'grid' ? '📋 List View' : '🎚️ Grid View'}
                  </button>
                </div>

                {maintViewMode === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {MAINTENANCE_TEMPLATES.map((tpl) => {
                      const countMatched = maintenanceRecords.filter(r => r.templateId === tpl.id).length;
                      const originalIdx = MAINTENANCE_TEMPLATES.findIndex(t => t.id === tpl.id);
                      return (
                        <div key={tpl.id} className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                          <div>
                            <span className="badge" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                              {tpl.area}
                            </span>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                              {tpl.equipment}
                            </h4>
                            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                              {tpl.tasks.length} check points • {tpl.days.join(', ')} sequence
                            </p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {countMatched}</span>
                            <button
                              type="button"
                              className="primary-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => {
                                const todayStr = new Date().toISOString().substring(0, 10);
                                const weekNo = getWeekNumber(new Date()).toString();
                                setActiveMaintTemplate(originalIdx);
                                setMaintWeekNo(weekNo);
                                setMaintFromDate(todayStr);
                                setMaintToDate(todayStr);
                                setMaintCheckgrid({});
                                setMaintRemarks({});
                                setMaintOperator('');
                                setMaintSupervisor('');
                              }}
                            >
                              📝 Fill Checklist
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '32px' }}>
                    <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', width: '220px' }}>Equipment Title</th>
                          <th style={{ padding: '8px', textAlign: 'left', width: '120px' }}>Area</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Tasks & sequence</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '150px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MAINTENANCE_TEMPLATES.map(tpl => {
                          const countMatched = maintenanceRecords.filter(r => r.templateId === tpl.id).length;
                          const originalIdx = MAINTENANCE_TEMPLATES.findIndex(t => t.id === tpl.id);
                          return (
                            <tr key={tpl.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px', fontWeight: '700' }}>{tpl.equipment}</td>
                              <td style={{ padding: '8px' }}>
                                <span className="badge" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent)', fontSize: '10px', padding: '3px 6px', borderRadius: '4px' }}>
                                  {tpl.area}
                                </span>
                              </td>
                              <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                                {tpl.tasks.length} check points • {tpl.days.join(', ')} sequence
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Logs: {countMatched}</span>
                                  <button
                                    type="button"
                                    className="primary-btn"
                                    style={{ padding: '6px 14px', fontSize: '12px' }}
                                    onClick={() => {
                                      const todayStr = new Date().toISOString().substring(0, 10);
                                      const weekNo = getWeekNumber(new Date()).toString();
                                      setActiveMaintTemplate(originalIdx);
                                      setMaintWeekNo(weekNo);
                                      setMaintFromDate(todayStr);
                                      setMaintToDate(todayStr);
                                      setMaintCheckgrid({});
                                      setMaintRemarks({});
                                      setMaintOperator('');
                                      setMaintSupervisor('');
                                    }}
                                  >
                                    📝 Fill Checklist
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeMaintSubTab === 'regular-breakdown' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {/* Weight Check (Form 88) */}
                <div className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--info)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      QUALITY CHECK
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                      Form 88: Weight Check
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      Execute and log weights checks for finished products. Required twice daily.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {maintenanceRecords.filter(r => r.templateId === 'weight-check').length}</span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setActiveMaintForm('weight-check')}
                    >
                      📝 Log Weight Check
                    </button>
                  </div>
                </div>

                {/* Machine Breakdown */}
                <div className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      MAINTENANCE
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                      Machine Breakdown Log
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      Log requests, maintenance actions, and production handovers for machine breakdowns.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {maintenanceRecords.filter(r => r.templateId === 'breakdown').length}</span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => setActiveMaintForm('breakdown')}
                    >
                      📝 Log Breakdown
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* History Log Table */}
            <div className="dashboard-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Checklist Log History</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by Log ID, Oper., Superv. ..."
                    className="form-input"
                    style={{ width: '220px', height: '34px', padding: '6px 12px', fontSize: '12px' }}
                    value={maintSearchQuery}
                    onChange={(e) => setMaintSearchQuery(e.target.value)}
                  />
                  <select
                    className="form-input"
                    style={{ width: '180px', height: '34px', padding: '6px 12px', fontSize: '12px' }}
                    value={maintFilterEquipment}
                    onChange={(e) => setMaintFilterEquipment(e.target.value)}
                  >
                    <option value="All">All Equipments</option>
                    {Array.from(new Set(MAINTENANCE_TEMPLATES.map(t => t.equipment))).map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                    <option value="Weight Check">Weight Check</option>
                    <option value="Machine Breakdown">Machine Breakdown</option>
                  </select>
                </div>
              </div>

              {filteredMaintRecords.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>
                  No matching maintenance records found.
                </p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Log ID</th>
                          <th>Equipment</th>
                          <th>Area</th>
                          <th>Week No</th>
                          <th>Operator</th>
                          <th>Supervisor</th>
                          <th>Completion</th>
                          <th>Timestamp</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaintRecords.slice((maintPage - 1) * 20, maintPage * 20).map((rec) => (
                          <tr key={rec.id}>
                            <td style={{ fontWeight: '600' }}>{rec.id}</td>
                            <td style={{ fontWeight: '600' }}>{rec.equipment}</td>
                            <td>{rec.area}</td>
                            <td style={{ fontWeight: '600' }}>{rec.weekNo ? `Wk ${rec.weekNo}` : 'N/A'}</td>
                            <td>👤 {rec.operator || 'Not Signed'}</td>
                            <td>👤 {rec.supervisor || 'Not Signed'}</td>
                            <td>
                              {rec.templateId === 'weight-check' ? (
                                <span className="badge badge-completed" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                  Logged Weight Check
                                </span>
                              ) : rec.templateId === 'breakdown' ? (
                                <span className="badge badge-completed" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                  Breakdown Logged
                                </span>
                              ) : (
                                <span className="badge badge-completed" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                                  {rec.totalChecked} / {rec.maxPossible} checks ({Math.round((rec.totalChecked / (rec.maxPossible || 1)) * 100)}%)
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.timestamp}</td>
                            <td>
                              <button
                                type="button"
                                className="secondary-btn"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => setViewingRecord(rec)}
                              >
                                👁️ View Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Maintenance Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={maintPage === 1}
                      onClick={() => setMaintPage(prev => Math.max(1, prev - 1))}
                    >
                      ◀ Previous
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>
                      Page {maintPage} of {Math.max(1, Math.ceil(filteredMaintRecords.length / 20))}
                    </span>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={maintPage === Math.max(1, Math.ceil(filteredMaintRecords.length / 20))}
                      onClick={() => setMaintPage(prev => Math.min(Math.max(1, Math.ceil(filteredMaintRecords.length / 20)), prev + 1))}
                    >
                      Next ▶
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Health & Safety Tab */}
        {currentTab === 'safety' && (() => {
          // Safety dashboard cards calculations
          const getDaysSinceLastIncident = () => {
            const incidentLogs = safetyRecords.filter(r => r.type === 'Incident Report');
            if (incidentLogs.length === 0) return 248;
            const latestIncident = incidentLogs[0];
            const incidentDate = new Date(latestIncident.timestamp.replace(' ', 'T'));
            const diffTime = Math.abs(new Date() - incidentDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays - 1);
          };

          const safetyIncidents = safetyRecords.filter(r => r.type === 'Incident Report').length;
          const firstAidLogs = safetyRecords.filter(r => r.type === 'First Aid Log').length;

          const getSwabComplianceRate = () => {
            const swabLogs = safetyRecords.filter(r => r.type === 'Swab Test');
            if (swabLogs.length === 0) return 100;
            const passedSwabs = swabLogs.filter(s => {
              const locations = ['filtration', 'infeed', 'cleanRoom', 'labelling', 'blowing'];
              return locations.every(loc => {
                const yeast = Number(s.swabData?.[loc]?.yeast || 0);
                const mould = Number(s.swabData?.[loc]?.mould || 0);
                const hpc = Number(s.swabData?.[loc]?.hpc || 0);
                return yeast <= 15 && mould <= 15 && hpc <= 15;
              });
            });
            return Math.round((passedSwabs.length / swabLogs.length) * 100);
          };

          return (
            <div className="maintenance-tab-container">
              <div className="tab-title-desc">
                <h2>Health & Safety Operations</h2>
                <p>Execute, log, and monitor plant safety statistics, First Aid logs, and Environmental Swab microbiology tests.</p>
              </div>

              {/* Dashboard metrics widgets */}
              <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Incident-Free Streak</span>
                    <span className="metric-icon">💚</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: 'var(--success)' }}>
                    {getDaysSinceLastIncident()} Days
                  </div>
                  <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>Since last logged accident</div>
                </div>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Safety Incidents</span>
                    <span className="metric-icon">🛡️</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: safetyIncidents > 0 ? 'var(--danger)' : 'var(--text)' }}>
                    {safetyIncidents}
                  </div>
                  <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>OHSF 1/2 notification reports</div>
                </div>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Aid Logs</span>
                    <span className="metric-icon">🩹</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{firstAidLogs}</div>
                  <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>Standard Form 17 entries</div>
                </div>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title" style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Swab Compliance</span>
                    <span className="metric-icon">🧪</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: getSwabComplianceRate() >= 95 ? 'var(--success)' : 'var(--warning)' }}>
                    {getSwabComplianceRate()}%
                  </div>
                  <div className="metric-footer text-muted" style={{ fontSize: '11px' }}>Swab counts =&lt; 15cfu</div>
                </div>
              </div>

              {/* Attached Safety Forms Templates Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Health & Safety Digital Forms</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {/* OHSF Form */}
                <div className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      REGULATORY
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                      OHSF 1/2 Notification
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      Record details of workplace injuries, diseases, and lost-time incidents under 1996 Regulations.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {safetyRecords.filter(r => r.type === 'Incident Report').length}</span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => setActiveSafetyForm('ohsf')}
                    >
                      📝 Log Accident
                    </button>
                  </div>
                </div>

                {/* First Aid Form */}
                <div className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--info)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      STANDARD FORM 17
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                      First Aid Register
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      Log minor cuts, bruises, serious injuries, and first aid treatments administered on-site.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {safetyRecords.filter(r => r.type === 'First Aid Log').length}</span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setActiveSafetyForm('first-aid')}
                    >
                      📝 Fill First Aid
                    </button>
                  </div>
                </div>

                {/* Swab Test Form */}
                <div className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      STANDARD FORM 14
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                      Environmental Swab Test
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      Record microbiology Yeast, Mould, and HPC counts across plant clean zones.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {safetyRecords.filter(r => r.type === 'Swab Test').length}</span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                      onClick={() => setActiveSafetyForm('swab')}
                    >
                      📝 Log Swab Test
                    </button>
                  </div>
                </div>

                {/* Induction Form (Form 37) */}
                <div className="inv-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      OHS FORM 37
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>
                      Induction Checklist
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      Log visitor, employee, or contractor OHS induction checklists before plant zone entries.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>Logs: {safetyRecords.filter(r => r.type === 'Induction Log').length}</span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                      onClick={() => setActiveSafetyForm('induction')}
                    >
                      📝 Log Induction
                    </button>
                  </div>
                </div>
              </div>

              {/* Safety Logs Register Table */}
              <div className="dashboard-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Health & Safety Event Register</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Search register logs..."
                      className="form-input"
                      style={{ width: '220px', height: '34px', padding: '6px 12px', fontSize: '12px' }}
                      value={safetySearchQuery}
                      onChange={(e) => setSafetySearchQuery(e.target.value)}
                    />
                    <select
                      className="form-input"
                      style={{ width: '180px', height: '34px', padding: '6px 12px', fontSize: '12px' }}
                      value={safetyFilterType}
                      onChange={(e) => setSafetyFilterType(e.target.value)}
                    >
                      <option value="All">All Form Types</option>
                      <option value="Incident Report">Incident Reports</option>
                      <option value="First Aid Log">First Aid Logs</option>
                      <option value="Swab Test">Swab Tests</option>
                      <option value="Induction Log">Induction Logs</option>
                    </select>
                  </div>
                </div>

                {filteredSafetyRecords.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>
                    No safety events logged matching the search criteria.
                  </p>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="custom-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Log ID</th>
                            <th>Form Type</th>
                            <th>Target Person / Analyst</th>
                            <th>Event Summary / Area Status</th>
                            <th>Logged By / Witness</th>
                            <th>Timestamp</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSafetyRecords.slice((safetyPage - 1) * 20, safetyPage * 20).map((rec) => {
                            let summary = '';
                            let logger = rec.operator || 'Not Signed';
                            let target = rec.injuredPerson || rec.analyst || 'N/A';

                            if (rec.type === 'Incident Report') {
                              summary = `Lost Time: ${rec.daysLost || 0} days - ${rec.incidentNature || 'Injury'}`;
                            } else if (rec.type === 'First Aid Log') {
                              summary = `First Aid: ${rec.treatmentGiven || '-'}`;
                              logger = rec.verifiedBy || 'N/A';
                            } else if (rec.type === 'Swab Test') {
                              const passed = ['filtration', 'infeed', 'cleanRoom', 'labelling', 'blowing'].every(l => {
                                return Number(rec.swabData?.[l]?.yeast || 0) <= 15 && Number(rec.swabData?.[l]?.mould || 0) <= 15 && Number(rec.swabData?.[l]?.hpc || 0) <= 15;
                              });
                              summary = passed ? '✅ Compliance Pass' : '❌ Contamination Warning';
                            } else if (rec.type === 'Induction Log') {
                              summary = `Reason: ${rec.reasonForVisit || '-'} • Areas: ${rec.visitingAreas || '-'}`;
                              logger = rec.inductorName || 'N/A';
                              target = rec.name || 'N/A';
                            }

                            return (
                              <tr key={rec.id}>
                                <td style={{ fontWeight: '600' }}>{rec.id}</td>
                                <td>
                                  <span className="badge" style={{
                                    backgroundColor: rec.type === 'Incident Report' ? 'rgba(239, 68, 68, 0.1)' : rec.type === 'First Aid Log' ? 'rgba(14, 165, 233, 0.1)' : rec.type === 'Swab Test' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                    color: rec.type === 'Incident Report' ? 'var(--danger)' : rec.type === 'First Aid Log' ? 'var(--info)' : rec.type === 'Swab Test' ? 'var(--success)' : 'var(--accent)'
                                  }}>
                                    {rec.type}
                                  </span>
                                </td>
                                <td style={{ fontWeight: '600' }}>{target}</td>
                                <td style={{ fontStyle: 'italic' }}>{summary}</td>
                                <td>👤 {logger}</td>
                                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.timestamp}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="secondary-btn"
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => setViewingSafetyRecord(rec)}
                                  >
                                    👁️ View Report
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Safety Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={safetyPage === 1}
                        onClick={() => setSafetyPage(prev => Math.max(1, prev - 1))}
                      >
                        ◀ Previous
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>
                        Page {safetyPage} of {Math.max(1, Math.ceil(filteredSafetyRecords.length / 20))}
                      </span>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={safetyPage === Math.max(1, Math.ceil(filteredSafetyRecords.length / 20))}
                        onClick={() => setSafetyPage(prev => Math.min(Math.max(1, Math.ceil(filteredSafetyRecords.length / 20)), prev + 1))}
                      >
                        Next ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Business Workflow Tab */}
        {currentTab === 'workflow' && (
          <div className="maintenance-tab-container">
            <div className="module-header" style={{ borderBottom: 'none', paddingBottom: 0, flexWrap: 'wrap', gap: '16px' }}>
              <div className="module-title">
                <h2>Process Workflow</h2>
                <p>Interactive, animated simulation of the entire end-to-end beverage production line.</p>
              </div>

              {/* Simulation Controls */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  className="primary-btn"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setSimPlaying(!simPlaying)}
                >
                  {simPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  className="secondary-btn"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => { setSimPlaying(false); setSimStep(0); }}
                >
                  🔄 Reset
                </button>
                <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                  <button
                    className="secondary-btn"
                    style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: simSpeed === 4000 ? 'var(--accent)' : '', color: simSpeed === 4000 ? '#111' : '' }}
                    onClick={() => setSimSpeed(4000)}
                  >
                    Slow
                  </button>
                  <button
                    className="secondary-btn"
                    style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: simSpeed === 2000 ? 'var(--accent)' : '', color: simSpeed === 2000 ? '#111' : '' }}
                    onClick={() => setSimSpeed(2000)}
                  >
                    1x
                  </button>
                  <button
                    className="secondary-btn"
                    style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: simSpeed === 800 ? 'var(--accent)' : '', color: simSpeed === 800 ? '#111' : '' }}
                    onClick={() => setSimSpeed(800)}
                  >
                    Fast
                  </button>
                </div>
              </div>
            </div>

            {/* serpentine path flow layout */}
            {/* serpentine path flow layout */}
            {(() => {
              const STAGE_POINTS = [
                { x: 12.5, y: 16.6, col: 1, row: 1 },
                { x: 37.5, y: 16.6, col: 2, row: 1 },
                { x: 62.5, y: 16.6, col: 3, row: 1 },
                { x: 87.5, y: 16.6, col: 4, row: 1 },
                { x: 87.5, y: 50.0, col: 4, row: 2 },
                { x: 62.5, y: 50.0, col: 3, row: 2 },
                { x: 37.5, y: 50.0, col: 2, row: 2 },
                { x: 12.5, y: 50.0, col: 1, row: 2 },
                { x: 12.5, y: 83.3, col: 1, row: 3 },
                { x: 37.5, y: 83.3, col: 2, row: 3 },
                { x: 62.5, y: 83.3, col: 3, row: 3 }
              ];

              return (
                <div className="workflow-diagram-board">
                  {/* Background SVG pipelines */}
                  <svg className="workflow-pipelines-svg">
                    <defs>
                      <filter id="neon-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Connective pipeline paths */}
                    {STAGE_POINTS.slice(0, 10).map((pt, idx) => {
                      const nextPt = STAGE_POINTS[idx + 1];
                      const stage = WORKFLOW_STAGES[idx];
                      const isSegmentActive = simPlaying ? (simStep >= idx) : (simStep > idx);
                      const segmentColor = isSegmentActive ? stage.color : 'rgba(255, 255, 255, 0.08)';

                      return (
                        <g key={idx}>
                          {/* Translucent Aura Glow Line */}
                          <line
                            x1={`${pt.x}%`}
                            y1={`${pt.y}%`}
                            x2={`${nextPt.x}%`}
                            y2={`${nextPt.y}%`}
                            stroke={segmentColor}
                            strokeWidth="10"
                            opacity={isSegmentActive ? 0.35 : 0.02}
                            style={{
                              filter: isSegmentActive ? 'url(#neon-glow-filter)' : 'none',
                              transition: 'all 0.5s ease'
                            }}
                          />
                          {/* Main Pipe Track */}
                          <line
                            x1={`${pt.x}%`}
                            y1={`${pt.y}%`}
                            x2={`${nextPt.x}%`}
                            y2={`${nextPt.y}%`}
                            stroke={segmentColor}
                            strokeWidth="3"
                            style={{
                              transition: 'all 0.5s ease'
                            }}
                          />
                          {/* Running Neon Fluid Flow Animation */}
                          {isSegmentActive && simPlaying && (
                            <line
                              x1={`${pt.x}%`}
                              y1={`${pt.y}%`}
                              x2={`${nextPt.x}%`}
                              y2={`${nextPt.y}%`}
                              stroke="#ffffff"
                              strokeWidth="3.5"
                              strokeDasharray="8 12"
                              className="dash-animation"
                              style={{
                                opacity: 0.85
                              }}
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Grid layout for industrial workflow stage pods */}
                  <div className="workflow-grid-container">
                    {WORKFLOW_STAGES.map((stage, idx) => {
                      const pt = STAGE_POINTS[idx];
                      const isActive = simStep === idx;
                      const isPassed = simStep > idx;

                      return (
                        <div
                          key={stage.id}
                          className={`workflow-node-capsule ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                          style={{
                            gridColumn: pt.col,
                            gridRow: pt.row,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSimStep(idx)}
                        >
                          {/* Inner glowing spotlight/halo behind active pod */}
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '5px',
                                width: '90px',
                                height: '90px',
                                borderRadius: '50%',
                                background: `radial-gradient(circle, rgba(${stage.colorRgb}, 0.35) 0%, transparent 70%)`,
                                pointerEvents: 'none',
                                zIndex: 1,
                                animation: 'pulse-glow 1.5s infinite alternate'
                              }}
                            />
                          )}

                          {/* Futuristic Industrial Pointer Pill Label */}
                          {isActive && stage.tagline && (
                            <div className="workflow-pointer-tag" style={{ backgroundColor: stage.color, bottom: '105px', zIndex: 10 }}>
                              {stage.tagline}
                            </div>
                          )}

                          {/* The 3D-styled Rounded Icon Pod */}
                          <div
                            className="workflow-node-pod"
                            style={{
                              width: '70px',
                              height: '70px',
                              borderRadius: '20px',
                              border: isActive ? `2.5px solid ${stage.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                              backgroundColor: isActive ? `rgba(${stage.colorRgb}, 0.22)` : isPassed ? `rgba(${stage.colorRgb}, 0.08)` : 'rgba(11, 15, 26, 0.7)',
                              boxShadow: isActive
                                ? `0 0 28px rgba(${stage.colorRgb}, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.3)`
                                : isPassed
                                  ? `0 0 15px rgba(${stage.colorRgb}, 0.25)`
                                  : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '28px',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              zIndex: 3
                            }}
                          >
                            <span style={{ textShadow: isActive || isPassed ? `0 0 8px ${stage.color}` : 'none' }}>
                              {stage.icon}
                            </span>
                          </div>

                          {/* Minimalist Info Label below the Pod */}
                          <div
                            className="workflow-node-label"
                            style={{
                              marginTop: '12px',
                              textAlign: 'center',
                              zIndex: 3,
                              pointerEvents: 'none'
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: '800', color: isActive || isPassed ? '#ffffff' : '#8892b0', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>
                              {(idx + 1).toString().padStart(2, '0')}. {stage.name}
                            </div>
                            <div style={{ fontSize: '9px', color: isActive ? stage.color : 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                              {stage.dept}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Workflow Step Detail panel */}
            <div className="dashboard-card" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ fontSize: '48px', backgroundColor: 'rgba(251, 191, 36, 0.1)', width: '90px', height: '90px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {WORKFLOW_STAGES[simStep].icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                    Stage {simStep + 1}: {WORKFLOW_STAGES[simStep].name}
                  </h3>
                  <span className="badge badge-completed">{WORKFLOW_STAGES[simStep].dept}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
                  {WORKFLOW_STAGES[simStep].desc}
                </p>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ fontSize: '12px' }}>
                    <span className="text-muted">Live Reading: </span>
                    <strong style={{ color: 'var(--accent)' }}>{WORKFLOW_STAGES[simStep].metrics}</strong>
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <span className="text-muted">Status: </span>
                    <strong style={{ color: 'var(--success)' }}>Active Pipeline</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
        {currentTab === 'laboratory' && (() => {
          const getLabTotalTests = () => laboratoryRecords.length;

          const getLabMicroCompliance = () => {
            const microRecords = laboratoryRecords.filter(r => r.type.includes('Micro'));
            if (microRecords.length === 0) return 100;
            let passed = 0;
            microRecords.forEach(r => {
              if (r.type === 'Form 1 (Micro raw)') {
                const allAbsent = r.sampleRows?.every(row =>
                  String(row.tcc).toLowerCase().includes('absent') || String(row.tcc).toLowerCase().includes('neg') ||
                  String(row.ecoli).toLowerCase().includes('absent') || String(row.ecoli).toLowerCase().includes('neg')
                );
                if (allAbsent) passed++;
              } else if (r.type === 'Form 11 (Micro water)') {
                const allAbsent = r.sampleRows?.every(row => {
                  const tccPassed = !row.tcc || String(row.tcc).toLowerCase().includes('absent') || String(row.tcc).toLowerCase().includes('neg') || String(row.tcc) === '';
                  const ecoliPassed = !row.ecoli || String(row.ecoli).toLowerCase().includes('absent') || String(row.ecoli).toLowerCase().includes('neg') || String(row.ecoli) === '';
                  const hpcPassed = Number(row.hpc1 || 0) < 100 && Number(row.hpc2 || 0) < 100;
                  return tccPassed && ecoliPassed && hpcPassed;
                });
                if (allAbsent) passed++;
              }
            });
            return Math.round((passed / microRecords.length) * 100);
          };

          const getLabChemCompliance = () => {
            const chemRecords = laboratoryRecords.filter(r => r.type === 'Form 9 (Chemical)');
            if (chemRecords.length === 0) return 100;
            let passed = 0;
            chemRecords.forEach(r => {
              const rawPhVal = Number(r.rawPh || 7.0);
              const rawTdsVal = Number(r.rawTds || 100);
              const prodPhVal = Number(r.prodPh || 7.2);
              const prodTdsVal = Number(r.prodTds || 120);

              const rawPassed = rawPhVal >= 6.5 && rawPhVal <= 8.5 && rawTdsVal >= 50 && rawTdsVal <= 500;
              const prodPassed = prodPhVal >= 6.5 && prodPhVal <= 8.5 && prodTdsVal >= 50 && prodTdsVal <= 500;
              if (rawPassed && prodPassed) passed++;
            });
            return Math.round((passed / chemRecords.length) * 100);
          };

          const microCompliance = getLabMicroCompliance();
          const chemCompliance = getLabChemCompliance();

          return (
            <div className="maintenance-tab-container">
              <div className="tab-title-desc">
                <h2>Laboratory & Quality Control</h2>
                <p>Log and review raw materials microbiological status, chemical properties, water micro-compliance, and visual taste inspections.</p>
              </div>

              {/* Lab Dashboard metrics */}
              <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL QUALITY TESTS</span>
                    <span style={{ fontSize: '20px' }}>🧪</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{getLabTotalTests()}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Logged across all parameters</span>
                </div>

                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>MICRO COMPLIANCE</span>
                    <span style={{ fontSize: '20px' }}>🧫</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: microCompliance < 90 ? 'var(--danger)' : 'var(--success)' }}>
                    {microCompliance}%
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: 100% Absent E-Coli</span>
                </div>

                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>CHEMICAL COMPLIANCE</span>
                    <span style={{ fontSize: '20px' }}>📉</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: chemCompliance < 90 ? 'var(--danger)' : 'var(--success)' }}>
                    {chemCompliance}%
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>pH (6.5-8.5) & TDS spec</span>
                </div>

                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>LAST TEST LOGGED</span>
                    <span style={{ fontSize: '20px' }}>🔬</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '13px', fontWeight: '800', margin: '14px 0 10px 0', color: 'var(--accent)' }}>
                    {laboratoryRecords[0] ? laboratoryRecords[0].timestamp.split(' ')[1] || laboratoryRecords[0].timestamp : 'No entries'}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date: {laboratoryRecords[0] ? laboratoryRecords[0].timestamp.split(' ')[0] : 'N/A'}</span>
                </div>
              </div>

              {/* Lab Forms action sheets grid */}
              <div>
                {(() => {
                  const LAB_TEMPLATES = [
                    { id: 'form1', icon: '📄', name: 'Form 1: Raw Materials Micro', desc: 'Microbiological analysis of primary packaging raw materials (Preforms, Closures, BIB bags).' },
                    { id: 'form9', icon: '📊', name: 'Form 9: Chemical Test', desc: 'pH, TDS levels check for Raw/Product Water, post-CIP levels, and conductivity calibration.' },
                    { id: 'form11', icon: '🧫', name: 'Form 11: Water Micro', desc: 'Cultivate SPC Agar incubation, TCC and E-Coli counts for Silver Ion, BH, and 0.45um Filter.' },
                    { id: 'form21', icon: '👅', name: 'Form 21: Taste & Visual', desc: 'Log 4h/36h/72h taste properties and 5d/10d/30d visual particle shelf-life checks.' },
                    { id: 'form36', icon: '🥃', name: 'Form 36: Bourbon Whiskey & Cola', desc: 'Tank batch records, ingredients checklist, Brix % checks, alcohol test, and gas pressure.' },
                    { id: 'form100', icon: '🏭', name: 'Form 100: Production Record', desc: 'Production shift logs, cases handover to warehouse, LPG/EFL meter, wastage log, and downtime remarks.' },
                    { id: 'form103', icon: '📡', name: 'Form 103: Silver Photometer Log', desc: 'Daily photometer readings for Silver Ion (spec >10ppb) and standard calibration tests.' }
                  ];

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '8px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Available Daily Quality Checklists</h3>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                          onClick={() => setLabViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                        >
                          {labViewMode === 'grid' ? '📋 List View' : '🎚️ Grid View'}
                        </button>
                      </div>

                      {labViewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          {LAB_TEMPLATES.map(tpl => (
                            <div key={tpl.id} className="template-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '24px' }}>{tpl.icon}</span>
                                <strong style={{ fontSize: '13px' }}>{tpl.name}</strong>
                              </div>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>{tpl.desc}</p>
                              <button className="primary-btn" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setActiveLabForm(tpl.id)}>📝 Fill Form</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                                <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>Icon</th>
                                <th style={{ padding: '8px', textAlign: 'left', width: '240px' }}>Form Title / Template</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                                <th style={{ padding: '8px', textAlign: 'center', width: '120px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {LAB_TEMPLATES.map(tpl => (
                                <tr key={tpl.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '8px', fontSize: '20px', textAlign: 'center' }}>{tpl.icon}</td>
                                  <td style={{ padding: '8px', fontWeight: '700' }}>{tpl.name}</td>
                                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{tpl.desc}</td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <button className="primary-btn" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setActiveLabForm(tpl.id)}>📝 Fill Form</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Lab Logs register list */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Laboratory Quality Control Register</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '220px', height: '32px', fontSize: '12px' }}
                      placeholder="🔍 Search log by Analyst/ID..."
                      value={labSearchQuery}
                      onChange={(e) => setLabSearchQuery(e.target.value)}
                    />
                    <select
                      className="form-input"
                      style={{ width: '180px', height: '32px', fontSize: '12px' }}
                      value={labFilterType}
                      onChange={(e) => setLabFilterType(e.target.value)}
                    >
                      <option value="All">All Form Types</option>
                      <option value="Form 1 (Micro raw)">Form 1 (Micro raw)</option>
                      <option value="Form 9 (Chemical)">Form 9 (Chemical)</option>
                      <option value="Form 11 (Micro water)">Form 11 (Micro water)</option>
                      <option value="Form 21 (Taste/Visual)">Form 21 (Taste/Visual)</option>
                    </select>
                  </div>
                </div>

                {filteredLabRecords.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    No quality control checks found. Select a form card above to submit a new test log.
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Log ID</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Form Template</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Analyst</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Verification Status</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Submitted</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLabRecords.slice((labPage - 1) * 20, labPage * 20).map((rec) => {
                            let compliancePass = true;
                            if (rec.type === 'Form 1 (Micro raw)') {
                              compliancePass = rec.sampleRows?.every(row =>
                                String(row.tcc).toLowerCase().includes('absent') && String(row.ecoli).toLowerCase().includes('absent')
                              );
                            } else if (rec.type === 'Form 11 (Micro water)') {
                              compliancePass = rec.sampleRows?.every(row =>
                                (!row.tcc || String(row.tcc).toLowerCase().includes('absent')) &&
                                (!row.ecoli || String(row.ecoli).toLowerCase().includes('absent')) &&
                                Number(row.hpc1 || 0) < 100
                              );
                            } else if (rec.type === 'Form 9 (Chemical)') {
                              const rPh = Number(rec.rawPh || 7.0);
                              const pPh = Number(rec.prodPh || 7.2);
                              compliancePass = rPh >= 6.5 && rPh <= 8.5 && pPh >= 6.5 && pPh <= 8.5;
                            }

                            return (
                              <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ fontWeight: '700', padding: '10px' }}>{rec.id}</td>
                                <td style={{ padding: '10px' }}>
                                  <strong>{rec.type}</strong>
                                </td>
                                <td style={{ padding: '10px' }}>👤 {rec.analyst}</td>
                                <td style={{ padding: '10px' }}>
                                  <span className={`badge ${compliancePass ? 'badge-completed' : 'badge-failed'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                    {compliancePass ? '✓ Within Specification' : '⚠️ Action Required'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{rec.timestamp}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="secondary-btn"
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => setViewingLabRecord(rec)}
                                  >
                                    👁️ View Report
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination controls */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={labPage === 1}
                        onClick={() => setLabPage(prev => Math.max(1, prev - 1))}
                      >
                        ◀ Previous
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>
                        Page {labPage} of {Math.max(1, Math.ceil(filteredLabRecords.length / 20))}
                      </span>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={labPage === Math.max(1, Math.ceil(filteredLabRecords.length / 20))}
                        onClick={() => setLabPage(prev => Math.min(Math.max(1, Math.ceil(filteredLabRecords.length / 20)), prev + 1))}
                      >
                        Next ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {currentTab === 'cleaning' && (() => {
          const filtered = cleaningRecords.filter(rec => {
            const matchesSearch =
              rec.id.toLowerCase().includes(cleaningSearchQuery.toLowerCase()) ||
              rec.type.toLowerCase().includes(cleaningSearchQuery.toLowerCase()) ||
              (rec.cleaner || rec.recorded_by || rec.checked_by || rec.performed_by || '').toLowerCase().includes(cleaningSearchQuery.toLowerCase()) ||
              (rec.supervisor || '').toLowerCase().includes(cleaningSearchQuery.toLowerCase()) ||
              (rec.remarks || '').toLowerCase().includes(cleaningSearchQuery.toLowerCase());

            const matchesType = cleaningFilterType === 'All' || rec.type === cleaningFilterType;
            return matchesSearch && matchesType;
          });

          return (
            <div className="maintenance-tab-container">
              <div className="tab-title-desc">
                <h2>Cleaning & Sanitation Control</h2>
                <p>Track, schedule, and log hygiene compliance, toilet & dining facility checks, factory floor cleaning, incubator logs, and chemical balance calibrations.</p>
              </div>

              {/* Quick Metrics */}
              <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL LOGS SUBMITTED</span>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: 'var(--text-heading)' }}>{cleaningRecords.length} Records</div>
                </div>
                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COMPLIANCE STATUS</span>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: 'var(--success)' }}>
                    {cleaningRecords.length > 0 ? (
                      `${Math.round((cleaningRecords.filter(r => r.status === 'Clean' || r.status === 'Pass' || r.status === 'Satisfactory' || r.status === 'Normal').length / cleaningRecords.length) * 100)}% Pass`
                    ) : '100%'}
                  </div>
                </div>
                <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HYGIENE LOGS TODAY</span>
                  <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: 'var(--accent)' }}>
                    {cleaningRecords.filter(r => r.timestamp?.startsWith(new Date().toISOString().substring(0, 10))).length} Logs
                  </div>
                </div>
              </div>

              {/* Template Card Grids */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-heading)' }}>📋 Select Sanitation or Calibration Form</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {CLEANING_TEMPLATES.map(tpl => (
                    <div
                      key={tpl.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-heading)' }}>🧹 {tpl.name}</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{tpl.description}</p>
                      </div>
                      <button
                        className="primary-btn"
                        style={{ alignSelf: 'flex-start', fontSize: '11px', padding: '6px 12px' }}
                        onClick={() => setActiveCleaningForm(tpl.id)}
                      >
                        📝 Fill Form
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* History Table */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-heading)' }}>📋 Sanitation & QC Log History</h3>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Search */}
                    <input
                      type="text"
                      className="text-input"
                      style={{ width: '200px', padding: '6px 12px', fontSize: '11px' }}
                      placeholder="Search logs..."
                      value={cleaningSearchQuery}
                      onChange={e => setCleaningSearchQuery(e.target.value)}
                    />
                    {/* Filter Type */}
                    <select
                      className="text-input"
                      style={{ width: '180px', padding: '6px', fontSize: '11px' }}
                      value={cleaningFilterType}
                      onChange={e => setCleaningFilterType(e.target.value)}
                    >
                      <option value="All">All Form Types</option>
                      {CLEANING_TEMPLATES.map(t => (
                        <option key={t.id} value={t.doctype}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No logs matched your criteria.</div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="custom-table" style={{ width: '100%' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Log ID</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Form Template</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Performed By</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Submitted</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice((cleaningPage - 1) * 20, cleaningPage * 20).map(rec => {
                            const isPass = rec.status === 'Clean' || rec.status === 'Pass' || rec.status === 'Satisfactory' || rec.status === 'Normal';
                            return (
                              <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ fontWeight: '700', padding: '10px' }}>{rec.id}</td>
                                <td style={{ padding: '10px' }}>
                                  <strong>{rec.type}</strong>
                                </td>
                                <td style={{ padding: '10px' }}>👤 {rec.cleaner || rec.recorded_by || rec.checked_by || rec.performed_by}</td>
                                <td style={{ padding: '10px' }}>
                                  <span className={`badge ${isPass ? 'badge-completed' : 'badge-failed'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                    {isPass ? '✓ Satisfactory' : '⚠️ Action Required'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{rec.timestamp}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="secondary-btn"
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => setViewingCleaningRecord(rec)}
                                  >
                                    👁️ View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={cleaningPage === 1}
                        onClick={() => setCleaningPage(prev => Math.max(1, prev - 1))}
                      >
                        ◀ Previous
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>
                        Page {cleaningPage} of {Math.max(1, Math.ceil(filtered.length / 20))}
                      </span>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={cleaningPage === Math.max(1, Math.ceil(filtered.length / 20))}
                        onClick={() => setCleaningPage(prev => Math.min(Math.max(1, Math.ceil(filtered.length / 20)), prev + 1))}
                      >
                        Next ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Support Helpdesk Module */}
        {currentTab === 'support' && (
          <SupportModule
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onResolveTicket={handleResolveTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onSendMessage={handleSendTicketMessage}
          />
        )}

        {/* Human Resource Module */}
        {currentTab === 'hr' && (
          <HRMSModule />
        )}
      </main>

      {/* Settings Modal (ERPNext Sync Credentials) */}
      {showSettingsModal && (
        <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>ERPNext Sync Settings</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateSettings}>
              <div className="modal-content">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Provide credentials below to synchronize shop floor work orders and stocks with your central live ERPNext server.
                </p>

                <div className="form-group">
                  <label>ERPNext Instance Server URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={settingsUrl}
                    onChange={(e) => setSettingsUrl(e.target.value)}
                    placeholder="https://your-frappe-site.erpnext.com"
                  />
                </div>

                <div className="form-group">
                  <label>REST API Key</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsApiKey}
                    onChange={(e) => setSettingsApiKey(e.target.value)}
                    placeholder="e.g. abc123def456"
                  />
                </div>

                <div className="form-group">
                  <label>REST API Secret</label>
                  <input
                    type="password"
                    className="form-input"
                    value={settingsApiSecret}
                    onChange={(e) => setSettingsApiSecret(e.target.value)}
                    placeholder="••••••••••••••••"
                  />
                </div>

                {syncStatusMsg && (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    marginTop: '12px',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: syncStatusMsg.startsWith('Sync error') || syncStatusMsg.startsWith('Connection failed') ? '#fef2f2' : '#f0fdf4',
                    color: syncStatusMsg.startsWith('Sync error') || syncStatusMsg.startsWith('Connection failed') ? '#ef4444' : '#10b981'
                  }}>
                    {syncStatusMsg}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save & Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Modal Overlay */}
      {fullscreenElement && (
        <div className="modal-backdrop" onClick={() => setFullscreenElement(null)}>
          <div className="modal-panel fullscreen-modal-panel" style={{ width: '90%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>
                {fullscreenElement === 'live1' && 'Filling Line 1 Feed (Water Bottling)'}
                {fullscreenElement === 'live2' && 'Filling Line 2 Feed (Alcoholic & Cans)'}
                {fullscreenElement === 'chartOee' && 'Overall Equipment Effectiveness (OEE) Metrics'}
                {fullscreenElement === 'chartFlow' && 'Hourly Water Flow Rate'}
                {fullscreenElement === 'chartDefects' && 'Product Defect Breakdown'}
              </span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} onClick={() => setFullscreenElement(null)}>✕</button>
            </div>
            <div className="modal-content" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '24px' }}>
              {fullscreenElement === 'live1' && (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={line1} alt="Filling Line 1" style={{ objectFit: 'contain', width: '100%', height: '100%', borderRadius: '8px' }} />
                  <div className="feed-noise" />
                  <div className="feed-hud">
                    <div className="hud-box" style={{ top: '25%', left: '30%', width: '90px', height: '90px', fontSize: '12px' }}>
                      <span className="hud-label">BOT-041: 99.8%</span>
                    </div>
                    <div className="hud-box" style={{ top: '45%', left: '55%', width: '90px', height: '90px', fontSize: '12px' }}>
                      <span className="hud-label">BOT-042: 100.0%</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '12px', fontFamily: 'monospace', color: '#00ff00', textShadow: '0 0 4px #00ff00', fontWeight: '600' }}>
                      FPS: 29.97 • RES: 1080P • AI VISION ACTIVE
                    </div>
                  </div>
                </div>
              )}
              {fullscreenElement === 'live2' && (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={line2} alt="Filling Line 2" style={{ objectFit: 'contain', width: '100%', height: '100%', borderRadius: '8px' }} />
                  <div className="feed-noise" />
                  <div className="feed-hud">
                    <div className="hud-box" style={{ top: '35%', left: '20%', width: '80px', height: '80px', fontSize: '12px' }}>
                      <span className="hud-label">CAN-891: FILL OK</span>
                    </div>
                    <div className="hud-box" style={{ top: '50%', left: '60%', width: '80px', height: '80px', fontSize: '12px' }}>
                      <span className="hud-label">CAN-892: SEAL OK</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '12px', fontFamily: 'monospace', color: '#00ff00', textShadow: '0 0 4px #00ff00', fontWeight: '600' }}>
                      FPS: 29.97 • RES: 1080P • AI VISION ACTIVE
                    </div>
                  </div>
                </div>
              )}
              {fullscreenElement === 'chartOee' && (
                <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {[
                    { label: 'Availability', value: 92.45, color: 'var(--info)', desc: 'Percentage of planned uptime that the plant is active' },
                    { label: 'Performance', value: 88.20, color: 'var(--warning)', desc: 'Uptime processing speed vs rated machine capacity' },
                    { label: 'Quality Rate', value: 98.76, color: 'var(--success)', desc: 'Percentage of good production vs total production' },
                    { label: 'Overall OEE', value: 80.54, color: 'var(--accent)', desc: 'Availability × Performance × Quality' }
                  ].map((gauge, gIdx) => (
                    <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{gauge.label}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{gauge.desc}</div>
                        </div>
                        <strong style={{ color: gauge.color, fontSize: '16px' }}>{gauge.value.toFixed(2)}%</strong>
                      </div>
                      <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '7px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${gauge.value}%`, backgroundColor: gauge.color, borderRadius: '7px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {fullscreenElement === 'chartFlow' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ height: '80%', position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="flow-glow-full" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--info)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--info)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 160 Q 75 120 150 140 T 300 90 T 450 110 T 600 70 L 600 200 L 0 200 Z"
                        fill="url(#flow-glow-full)"
                      />
                      <path
                        d="M 0 160 Q 75 120 150 140 T 300 90 T 450 110 T 600 70"
                        fill="none"
                        stroke="var(--info)"
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span>08:00 (120 L/min)</span>
                    <span>10:00 (140 L/min)</span>
                    <span>12:00 (165 L/min)</span>
                    <span>14:00 (150 L/min)</span>
                    <span>16:00 (180 L/min)</span>
                  </div>
                </div>
              )}
              {fullscreenElement === 'chartDefects' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
                  <svg width="180" height="180" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--danger)" strokeWidth="3.2"
                      strokeDasharray="60 40" strokeDashoffset="25" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="3.2"
                      strokeDasharray="30 70" strokeDashoffset="85" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--info)" strokeWidth="3.2"
                      strokeDasharray="10 90" strokeDashoffset="115" />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Underfill Volume: 60.00%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--warning)', borderRadius: '50%' }}></span>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Cap Seal Leakage: 30.00%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--info)', borderRadius: '50%' }}></span>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Barcode Scan Failure: 10.00%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Create Work Order */}
      {showNewWODrawer && (
        <div className="drawer-backdrop" onClick={() => setShowNewWODrawer(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Schedule New Production Run</h3>
              <button className="drawer-close-btn" onClick={() => setShowNewWODrawer(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateNewWO} className="drawer-content" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingBottom: '20px' }}>
              <div className="form-group">
                <label>Select Product (Item to Manufacture) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search item code or name..."
                  value={woProductSearch}
                  onChange={(e) => setWoProductSearch(e.target.value)}
                  disabled={woItemsLoading}
                  style={{ marginBottom: '8px' }}
                />
                <select
                  name="productCode"
                  className="form-input"
                  value={selectedWoProduct}
                  onChange={(e) => setSelectedWoProduct(e.target.value)}
                  disabled={woItemsLoading || filteredWoProductsList.length === 0}
                  required
                >
                  {woItemsLoading ? (
                    <option value="">Loading items...</option>
                  ) : filteredWoProductsList.length === 0 ? (
                    <option value="">No manufacturable items found</option>
                  ) : (
                    filteredWoProductsList.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))
                  )}
                </select>
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  Live mode shows Items that have an active submitted BOM.
                </small>
              </div>

              <div className="form-group">
                <label>BOM No *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search BOM..."
                  value={woBomSearch}
                  onChange={(e) => setWoBomSearch(e.target.value)}
                  disabled={woBomsLoading || !selectedWoProduct}
                  style={{ marginBottom: '8px' }}
                />
                <select
                  name="bomNo"
                  className="form-input"
                  value={selectedWoBom}
                  onChange={(e) => setSelectedWoBom(e.target.value)}
                  disabled={woBomsLoading || filteredWoBomsList.length === 0}
                  required
                >
                  {woBomsLoading ? (
                    <option value="">Loading BOMs...</option>
                  ) : filteredWoBomsList.length === 0 ? (
                    <option value="">No active submitted BOM for selected item</option>
                  ) : (
                    filteredWoBomsList.map(bom => (
                      <option key={bom.id} value={bom.name}>
                        {bom.name}{bom.isDefault ? ' • Default' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Batch Size (Qty to Manufacture) *</label>
                <input
                  type="number"
                  name="quantity"
                  className="form-input"
                  defaultValue="1"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Company *</label>
                <input
                  type="text"
                  name="company"
                  className="form-input"
                  defaultValue="Anantdv (Demo)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Source Warehouse</label>
                <input
                  type="text"
                  name="sourceWarehouse"
                  className="form-input"
                  defaultValue="Stores - AD"
                />
              </div>

              <div className="form-group">
                <label>Target Warehouse (Finished Goods)</label>
                <input
                  type="text"
                  name="fgWarehouse"
                  className="form-input"
                  defaultValue="Finished Goods - AD"
                />
              </div>

              <div className="form-group">
                <label>Work-in-Progress Warehouse *</label>
                <input
                  type="text"
                  name="wipWarehouse"
                  className="form-input"
                  defaultValue="Work In Progress - AD"
                  required
                />
              </div>

              <div className="form-group">
                <label>Production Bottling Line</label>
                <select name="lineNo" className="form-input">
                  <option value="Filling Line 1">Filling Line 1 (Water Line)</option>
                  <option value="Filling Line 2">Filling Line 2 (Alcoholic Cans)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Planned Start Time *</label>
                <input
                  type="datetime-local"
                  name="plannedStart"
                  className="form-input"
                  defaultValue="2026-06-02T23:30:00"
                  required
                />
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button type="submit" className="primary-btn" disabled={woCreating} style={{ flexGrow: 1, justifyContent: 'center' }}>
                  {woCreating ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                      Launching...
                    </>
                  ) : 'Launch Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Modal: Job Card Checklist Action (Pause / Finish / Add Remarks) */}
      {activeJCOp && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-header">
              <span>
                {activeJCOp.action === 'pause' && '⏸ Pause Checklist Operation'}
                {activeJCOp.action === 'finish' && '✓ Log checklist Completion'}
                {activeJCOp.action === 'remark' && '💬 Add Observation Notes / Remark'}
              </span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActiveJCOp(null)}>✕</button>
            </div>
            <div className="modal-content">
              <p style={{ fontSize: '13px', margin: '0 0 16px 0', color: 'var(--text-muted)' }}>
                Logging updates for operation **{activeJCOp.operation}**. This status change updates Central ERPNext instantly.
              </p>

              {activeJCOp.action === 'finish' && activeJCOp.operation === 'Mixing' && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--info)', marginBottom: '16px', fontWeight: '500' }}>
                  ℹ️ **Mixing Phase**: Raw materials recipe (Water, Sugar, CO2, Concentrate) will be deducted from warehouse inventory.
                </div>
              )}

              {activeJCOp.action === 'finish' && activeJCOp.operation === 'Can/Bottle Prep' && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-hover)', marginBottom: '16px', fontWeight: '500' }}>
                  ℹ️ **Packaging Prep**: Production materials (Cans, preforms, tabs, boxes) will be deducted from packaging stock.
                </div>
              )}

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Operator Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={operatorName}
                  onChange={(e) => handleSearchEmployees(e.target.value, 'pauseModal')}
                  onFocus={() => {
                    setActiveSearchField('pauseModal');
                    if (operatorName.trim().length >= 3 || employeeList.length > 0) {
                      setShowEmployeeDropdown(true);
                    }
                  }}
                  placeholder="e.g. S. Prasad"
                  required
                  autoComplete="off"
                />
                {showEmployeeDropdown && activeSearchField === 'pauseModal' && employeeList.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    {employeeList.map((emp) => (
                      <div
                        key={emp.name}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          color: '#374151'
                        }}
                        onMouseDown={() => {
                          setOperatorName(emp.employee_name);
                          setShowEmployeeDropdown(false);
                        }}
                        className="employee-dropdown-item"
                      >
                        <strong>{emp.employee_name}</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({emp.name})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Actual Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={jcActualStartTime}
                    onChange={(e) => setJcActualStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Actual End Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={jcActualEndTime}
                    onChange={(e) => setJcActualEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observation Notes / Remarks</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  value={operatorRemarks}
                  onChange={(e) => setOperatorRemarks(e.target.value)}
                  placeholder={
                    activeJCOp.action === 'pause'
                      ? "Enter reason for pause (e.g. mechanical calibration needed, shift change)..."
                      : "Enter details (e.g. pH check 3.2, seal checks normal)..."
                  }
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setActiveJCOp(null)}>Cancel</button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  if (activeJCOp.action === 'pause') {
                    handlePauseJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorRemarks);
                  } else if (activeJCOp.action === 'finish') {
                    handleFinishJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorRemarks);
                  } else if (activeJCOp.action === 'remark') {
                    handleAddRemarkJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorRemarks);
                  }
                }}
              >
                Sign & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View & Add Remarks History Timeline */}
      {activeTimelineJC && (() => {
        const liveWO = workOrders.find(w => w.id === activeTimelineJC.woId);
        const liveJC = liveWO?.jobCards?.find(j => j.id === activeTimelineJC.jcId);
        const remarksList = liveJC?.remarksList || [];

        return (
          <div className="modal-backdrop" onClick={() => { setActiveTimelineJC(null); setReplyingToIdx(null); setReplyText(''); }}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ width: '560px' }}>
              <div className="modal-header">
                <span>Remarks History & Observation Notes: {liveJC?.operation || activeTimelineJC.operation}</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setActiveTimelineJC(null); setReplyingToIdx(null); setReplyText(''); }}>✕</button>
              </div>
              <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Timeline display */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  {remarksList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                      No remarks recorded yet. Add the first remark below.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)', margin: '8px 0 8px 10px' }}>
                      {remarksList.map((log, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-26px',
                            top: '2px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                            border: '2px solid white'
                          }}></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                            ⏱️ {log.timestamp} • 👤 {log.operator}
                            <button
                              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px', marginLeft: '12px', textDecoration: 'underline', padding: '0' }}
                              onClick={() => {
                                setReplyingToIdx(replyingToIdx === index ? null : index);
                                setReplyText('');
                              }}
                            >
                              {replyingToIdx === index ? 'Cancel Reply' : 'Reply'}
                            </button>
                          </div>
                          <div style={{
                            fontSize: '13px',
                            backgroundColor: '#f3f4f6',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            color: 'var(--text-heading)',
                            fontWeight: '500'
                          }}>
                            {log.text}
                            {(log.actualStartTime || log.actualEndTime) && (
                              <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px', fontStyle: 'italic', fontWeight: '600' }}>
                                {log.actualStartTime && `Start: ${log.actualStartTime.replace('T', ' ')}`}
                                {log.actualStartTime && log.actualEndTime && ' | '}
                                {log.actualEndTime && `End: ${log.actualEndTime.replace('T', ' ')}`}
                              </div>
                            )}
                          </div>

                          {/* Nested Replies display */}
                          {log.replies && log.replies.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px', marginTop: '8px', borderLeft: '2px dashed var(--border-color)', paddingLeft: '12px' }}>
                              {log.replies.map((reply, rIdx) => (
                                <div key={rIdx} style={{ position: 'relative' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                    ⏱️ {reply.timestamp} • 👤 {reply.operator}
                                  </div>
                                  <div style={{
                                    fontSize: '12px',
                                    backgroundColor: '#eef2f6',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    color: 'var(--text-heading)'
                                  }}>
                                    {reply.text}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Reply input field */}
                          {replyingToIdx === index && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '16px', marginTop: '8px', padding: '8px', backgroundColor: 'rgba(251, 191, 36, 0.05)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600' }}>Replying as operator: {operatorName || currentUser}</span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ padding: '6px', fontSize: '12px', flex: 1 }}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type your reply comment..."
                                />
                                <button
                                  type="button"
                                  className="primary-btn"
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                  onClick={() => {
                                    if (!replyText.trim()) return;
                                    handleReplyToRemarkJobCard(activeTimelineJC.woId, activeTimelineJC.jcId, index, operatorName || currentUser, replyText);
                                    setReplyText('');
                                    setReplyingToIdx(null);
                                  }}
                                >
                                  Submit
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Remark form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>Add New Remark</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Operator</label>
                      <input
                        type="text"
                        className="form-input"
                        value={operatorName}
                        onChange={(e) => handleSearchEmployees(e.target.value, 'remarksModal')}
                        onFocus={() => {
                          setActiveSearchField('remarksModal');
                          if (operatorName.trim().length >= 3 || employeeList.length > 0) {
                            setShowEmployeeDropdown(true);
                          }
                        }}
                        placeholder="Operator name"
                        style={{ padding: '8px', fontSize: '12px' }}
                        autoComplete="off"
                      />
                      {showEmployeeDropdown && activeSearchField === 'remarksModal' && employeeList.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          {employeeList.map((emp) => (
                            <div
                              key={emp.name}
                              style={{
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                borderBottom: '1px solid #f3f4f6',
                                color: '#374151'
                              }}
                              onMouseDown={() => {
                                setOperatorName(emp.employee_name);
                                setShowEmployeeDropdown(false);
                              }}
                              className="employee-dropdown-item"
                            >
                              <strong>{emp.employee_name}</strong> <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({emp.name})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Actual Start Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={jcActualStartTime}
                        onChange={(e) => setJcActualStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Actual End Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={jcActualEndTime}
                        onChange={(e) => setJcActualEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Observation Notes</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '60px', fontFamily: 'inherit', padding: '8px', fontSize: '12px' }}
                      value={operatorRemarks}
                      onChange={(e) => setOperatorRemarks(e.target.value)}
                      placeholder="Type remark message..."
                    />
                  </div>
                </div>

              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="secondary-btn" onClick={() => { setActiveTimelineJC(null); setReplyingToIdx(null); setReplyText(''); }}>Close</button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    if (!operatorRemarks.trim()) return;
                    handleAddRemarkJobCard(activeTimelineJC.woId, activeTimelineJC.jcId, operatorName, operatorRemarks);
                    setOperatorRemarks('');
                  }}
                >
                  Submit Remark
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Adjust Inventory Stock */}
      {showAdjustStockModal && (
        <div className="modal-backdrop" onClick={() => setShowAdjustStockModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Adjust Stock Quantity</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAdjustStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjustStockSubmit}>
              <div className="modal-content">
                <div className="form-group">
                  <label>Select Catalog Item</label>
                  <select
                    className="form-input"
                    value={adjustItemCode}
                    onChange={(e) => setAdjustItemCode(e.target.value)}
                  >
                    {Object.keys(inventory).map(code => (
                      <option key={code} value={code}>{code} - {inventory[code].name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity to Add/Subtract</label>
                  <input
                    type="number"
                    className="form-input"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value, 10))}
                    placeholder="Enter positive to add, negative to deduct..."
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Current inventory stock level: **{Number(inventory[adjustItemCode]?.qty || 0).toFixed(2)} {inventory[adjustItemCode]?.unit}**
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowAdjustStockModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Submit Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Weight Check (Form 88) */}
      {activeMaintForm === 'weight-check' && (() => {
        return (
          <MaintWeightCheckModal
            onClose={() => setActiveMaintForm(null)}
            onSubmit={(data) => handleSaveMaintForm('weight-check', data)}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
          />
        );
      })()}

      {/* Modal: Log Machine Breakdown */}
      {activeMaintForm === 'breakdown' && (() => {
        return (
          <MaintBreakdownModal
            onClose={() => setActiveMaintForm(null)}
            onSubmit={(data) => handleSaveMaintForm('breakdown', data)}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
          />
        );
      })()}

      {/* Modal: Fill Daily Maintenance Checklist */}
      {activeMaintTemplate !== null && (() => {
        const template = MAINTENANCE_TEMPLATES[activeMaintTemplate];
        return (
          <div className="modal-backdrop">
            <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water Fiji PTE Limited</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Preventive Maintenance Schedule</span>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={() => setActiveMaintTemplate(null)}>✕</button>
              </div>
              <form onSubmit={handleSaveMaintenance}>
                <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                  {/* Top metadata input */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Equipment</label>
                      <input type="text" className="form-input" value={template.equipment} disabled style={{ backgroundColor: '#f3f4f6' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Area</label>
                      <input type="text" className="form-input" value={template.area} disabled style={{ backgroundColor: '#f3f4f6' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>WEEK NO</label>
                      <input
                        type="text"
                        className="form-input"
                        value={maintWeekNo}
                        disabled
                        style={{ backgroundColor: '#f3f4f6' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>From</label>
                        <input
                          type="date"
                          className="form-input"
                          value={maintFromDate}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                          required
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>To</label>
                        <input
                          type="date"
                          className="form-input"
                          value={maintToDate}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist Grid Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th style={{ width: '40px', padding: '6px' }}>Sr.No</th>
                          <th style={{ minWidth: '220px', padding: '6px', textAlign: 'left' }}>Description</th>
                          <th style={{ width: '60px', padding: '6px' }}>Std Time</th>
                          <th style={{ width: '80px', padding: '6px', textAlign: 'center' }}>Completed</th>
                          <th style={{ minWidth: '150px', padding: '6px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {template.tasks.map((task, tIdx) => (
                          <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ textAlign: 'center', padding: '6px', fontWeight: '600' }}>{task.id}</td>
                            <td style={{ padding: '6px', fontWeight: '500' }}>{task.desc}</td>
                            <td style={{ textAlign: 'center', padding: '6px', color: 'var(--text-muted)' }}>{task.std}</td>
                            <td style={{ textAlign: 'center', padding: '4px' }}>
                              <input
                                type="checkbox"
                                checked={!!maintCheckgrid[tIdx]}
                                onChange={(e) => {
                                  setMaintCheckgrid(prev => ({
                                    ...prev,
                                    [tIdx]: e.target.checked
                                  }));
                                }}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Remarks/Observations"
                                style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                                value={maintRemarks[tIdx] || ''}
                                onChange={(e) => {
                                  setMaintRemarks(prev => ({
                                    ...prev,
                                    [tIdx]: e.target.value
                                  }));
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '50px', padding: '6px' }}
                      value={maintOverallComments}
                      onChange={e => setMaintOverallComments(e.target.value)}
                      placeholder="Enter overall comments or observations about this maintenance run..."
                    />
                  </div>

                  {/* Signatures & Employee Autocomplete Search */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sign. Of the Operator</label>
                      <input
                        type="text"
                        className="form-input"
                        value={maintOperator}
                        onChange={(e) => handleSearchEmployees(e.target.value, 'maintOperator')}
                        onFocus={() => {
                          setActiveSearchField('maintOperator');
                          if (maintOperator.trim().length >= 3 || employeeList.length > 0) {
                            setShowEmployeeDropdown(true);
                          }
                        }}
                        placeholder="Search employee..."
                        required
                        autoComplete="off"
                      />
                      {showEmployeeDropdown && activeSearchField === 'maintOperator' && employeeList.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          maxHeight: '130px',
                          overflowY: 'auto',
                          zIndex: 1001,
                          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          {employeeList.map((emp) => (
                            <div
                              key={emp.name}
                              style={{
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                borderBottom: '1px solid #f3f4f6',
                                color: '#374151'
                              }}
                              onMouseDown={() => {
                                setMaintOperator(emp.employee_name);
                                setShowEmployeeDropdown(false);
                              }}
                              className="employee-dropdown-item"
                            >
                              <strong>{emp.employee_name}</strong> <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({emp.name})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sign. Of the Supervisor</label>
                      <input
                        type="text"
                        className="form-input"
                        value={maintSupervisor}
                        onChange={(e) => handleSearchEmployees(e.target.value, 'maintSupervisor')}
                        onFocus={() => {
                          setActiveSearchField('maintSupervisor');
                          if (maintSupervisor.trim().length >= 3 || employeeList.length > 0) {
                            setShowEmployeeDropdown(true);
                          }
                        }}
                        placeholder="Search employee..."
                        required
                        autoComplete="off"
                      />
                      {showEmployeeDropdown && activeSearchField === 'maintSupervisor' && employeeList.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          maxHeight: '130px',
                          overflowY: 'auto',
                          zIndex: 1001,
                          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          {employeeList.map((emp) => (
                            <div
                              key={emp.name}
                              style={{
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                borderBottom: '1px solid #f3f4f6',
                                color: '#374151'
                              }}
                              onMouseDown={() => {
                                setMaintSupervisor(emp.employee_name);
                                setShowEmployeeDropdown(false);
                              }}
                              className="employee-dropdown-item"
                            >
                              <strong>{emp.employee_name}</strong> <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({emp.name})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Computed Metrics</label>
                      <div className="form-input" style={{ backgroundColor: '#f3f4f6', height: '36px', display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: '700', color: 'var(--accent)' }}>
                        Total Tasks Completed: {Object.values(maintCheckgrid).filter(Boolean).length}
                      </div>
                    </div>
                  </div>

                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="secondary-btn" onClick={() => setActiveMaintTemplate(null)}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={maintSaving}>
                    {maintSaving ? (
                      <>
                        <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                        Saving...
                      </>
                    ) : 'Save Checklist Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: View Saved Maintenance Checklist Report */}
      {viewingRecord && (() => {
        if (viewingRecord.templateId === 'weight-check') {
          return (
            <div className="modal-backdrop">
              <div className="modal-panel print-report-container" style={{ width: '850px', maxWidth: '95%' }}>
                <div className="modal-header">
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Island Chill / Crush / US Cola</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 88: Weight Check Report ({viewingRecord.id})</span>
                  </div>
                  <button className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={() => setViewingRecord(null)}>✕</button>
                </div>
                <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderLeft: '4px solid var(--accent)', color: 'var(--text-heading)', fontSize: '12px', marginBottom: '12px' }}>
                    <strong>Note:</strong> Weight Check frequency is twice per Day.
                  </div>
                  <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th>Slot</th>
                        <th>Date</th>
                        <th>Checked By</th>
                        <th>Verified By</th>
                        <th>Product Description</th>
                        <th>Weight 1</th>
                        <th>Weight 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingRecord.rows?.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td><strong>Slot {idx + 1}</strong></td>
                          <td>{row.date}</td>
                          <td>{row.checkedBy}</td>
                          <td>{row.verifiedBy}</td>
                          <td>{row.productDesc}</td>
                          <td>{row.weight1}</td>
                          <td>{row.weight2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {viewingRecord.overallComments && (
                    <div style={{ marginTop: '16px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                      <strong style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OVERALL COMMENTS / REMARKS</strong>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-heading)' }}>{viewingRecord.overallComments}</div>
                    </div>
                  )}
                </div>
                <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="primary-btn" onClick={() => setEmailModal({ reportId: viewingRecord.id, reportType: 'Weight Check Report' })} style={{ backgroundColor: '#a27b5c', borderColor: '#a27b5c' }}>📧 Send Email</button>
                  <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Report</button>
                  <button type="button" className="secondary-btn" onClick={() => setViewingRecord(null)}>Close Report</button>
                </div>
              </div>
            </div>
          );
        }

        if (viewingRecord.templateId === 'breakdown') {
          return (
            <div className="modal-backdrop">
              <div className="modal-panel print-report-container" style={{ width: '900px', maxWidth: '95%' }}>
                <div className="modal-header">
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Island Chill - Carpenters Waters (Fiji) PTE Limited</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Machine Breakdown Report ({viewingRecord.id})</span>
                  </div>
                  <button className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={() => setViewingRecord(null)}>✕</button>
                </div>
                <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

                  <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '8px', fontWeight: '700' }}>Section 1: Request Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div><strong>Requestor Name:</strong> {viewingRecord.requestorName}</div>
                      <div><strong>Machine Name & No:</strong> {viewingRecord.machineName}</div>
                      <div><strong>Breakdown Date & Time:</strong> {viewingRecord.breakdownDate} {viewingRecord.breakdownTime}</div>
                      <div><strong>Checked By (SV Name):</strong> {viewingRecord.checkedBySV}</div>
                      <div><strong>Approved By (FM Name):</strong> {viewingRecord.approvedByFM}</div>
                    </div>
                    <div style={{ marginTop: '8px' }}><strong>Breakdown Description:</strong> {viewingRecord.breakdownDesc}</div>
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '8px', fontWeight: '700' }}>Section 2: Maintenance Work Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div><strong>Received By:</strong> {viewingRecord.receivedBy}</div>
                      <div><strong>Work In-charge Assessment:</strong> {viewingRecord.workAssessment}</div>
                      <div><strong>Date & Time Repaired:</strong> {viewingRecord.dateRepaired} {viewingRecord.timeRepaired}</div>
                      <div><strong>Repaired Done By:</strong> {viewingRecord.repairedDoneBy}</div>
                      <div><strong>Approved By (MM Name):</strong> {viewingRecord.approvedByMM}</div>
                    </div>
                    <div style={{ marginTop: '8px' }}><strong>Description of Work Carried Out:</strong> {viewingRecord.workCarriedOut}</div>
                    <div style={{ marginTop: '8px' }}><strong>Parts Used:</strong> {viewingRecord.partsUsed}</div>
                  </div>

                  {viewingRecord.overallComments && (
                    <div style={{ marginTop: '16px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                      <strong style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OVERALL COMMENTS / REMARKS</strong>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-heading)' }}>{viewingRecord.overallComments}</div>
                    </div>
                  )}

                </div>
                <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="primary-btn" onClick={() => setEmailModal({ reportId: viewingRecord.id, reportType: 'Machine Breakdown Report' })} style={{ backgroundColor: '#a27b5c', borderColor: '#a27b5c' }}>📧 Send Email</button>
                  <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Report</button>
                  <button type="button" className="secondary-btn" onClick={() => setViewingRecord(null)}>Close Report</button>
                </div>
              </div>
            </div>
          );
        }

        const template = MAINTENANCE_TEMPLATES.find(t => t.id === viewingRecord.templateId) || MAINTENANCE_TEMPLATES[0];
        return (
          <div className="modal-backdrop">
            <div className="modal-panel print-report-container" style={{ width: '920px', maxWidth: '95%' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water Fiji PTE Limited</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Archived Preventive Maintenance Schedule Details ({viewingRecord.id})</span>
                </div>
                <button className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={() => setViewingRecord(null)}>✕</button>
              </div>
              <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                {/* Top metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Equipment</label>
                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600' }}>
                      {viewingRecord.equipment}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Area</label>
                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600' }}>
                      {viewingRecord.area}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>WEEK NO</label>
                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>
                      Wk {viewingRecord.weekNo}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>From</label>
                      <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px' }}>
                        {viewingRecord.fromDate}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>To</label>
                      <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px' }}>
                        {viewingRecord.toDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist Grid Table */}
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ width: '40px', padding: '6px' }}>Sr.No</th>
                        <th style={{ minWidth: '220px', padding: '6px', textAlign: 'left' }}>Description</th>
                        <th style={{ width: '60px', padding: '6px' }}>Std Time</th>
                        <th style={{ width: '80px', padding: '6px', textAlign: 'center' }}>Completed</th>
                        <th style={{ minWidth: '150px', padding: '6px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {template.tasks.map((task, tIdx) => {
                        const hasCheckgrid = viewingRecord.checkgrid !== undefined && viewingRecord.checkgrid !== null;
                        const isChecked = hasCheckgrid && (
                          viewingRecord.checkgrid[tIdx] !== undefined
                            ? !!viewingRecord.checkgrid[tIdx]
                            : (template.days && template.days.some(day => !!viewingRecord.checkgrid[`${tIdx}-${day}`]))
                        );

                        return (
                          <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ textAlign: 'center', padding: '6px', fontWeight: '600' }}>{task.id}</td>
                            <td style={{ padding: '6px', fontWeight: '500' }}>{task.desc}</td>
                            <td style={{ textAlign: 'center', padding: '6px', color: 'var(--text-muted)' }}>{task.std}</td>
                            <td style={{ textAlign: 'center', padding: '4px', fontSize: '16px' }}>
                              {isChecked ? '✅' : '❌'}
                            </td>
                            <td style={{ padding: '6px', fontStyle: 'italic', color: 'var(--text-heading)' }}>
                              {(viewingRecord.remarks && viewingRecord.remarks[tIdx]) || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {viewingRecord.overallComments && (
                  <div style={{ marginTop: '16px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OVERALL COMMENTS / REMARKS</strong>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-heading)' }}>{viewingRecord.overallComments}</div>
                  </div>
                )}

                {/* Signatures details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sign. Of the Operator</label>
                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600' }}>
                      👤 {viewingRecord.operator || 'Not Signed'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sign. Of the Supervisor</label>
                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600' }}>
                      👤 {viewingRecord.supervisor || 'Not Signed'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Audit Summary</label>
                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '12px', fontWeight: '700' }}>
                      Checklist Completion Rate: {viewingRecord.maxPossible ? Math.round(((viewingRecord.totalChecked || 0) / viewingRecord.maxPossible) * 100) : 0}% ({viewingRecord.totalChecked || 0} / {viewingRecord.maxPossible || 0})
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="primary-btn" onClick={() => setEmailModal({ reportId: viewingRecord.id, reportType: viewingRecord.equipment + ' PM Report' })} style={{ backgroundColor: '#a27b5c', borderColor: '#a27b5c' }}>📧 Send Email</button>
                <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Report</button>
                <button type="button" className="secondary-btn" onClick={() => setViewingRecord(null)}>Close Report</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Cleaning & Sanitation Form */}
      {activeCleaningForm && (
        <CleaningFormModal
          templateId={activeCleaningForm}
          onClose={() => setActiveCleaningForm(null)}
          onSubmit={(data) => handleSaveCleaning(CLEANING_TEMPLATES.find(t => t.id === activeCleaningForm).doctype, data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
          setActiveSearchField={setActiveSearchField}
        />
      )}

      {/* Modal: View Cleaning & Sanitation Report Details */}
      {viewingCleaningRecord && (
        <CleaningRecordDetailModal
          record={viewingCleaningRecord}
          onClose={() => setViewingCleaningRecord(null)}
        />
      )}

      {/* Modal: Log Accident (OHSF 1 & 2) */}
      {activeSafetyForm === 'ohsf' && (() => {
        return (
          <SafetyIncidentFormModal
            onClose={() => setActiveSafetyForm(null)}
            onSubmit={(data) => handleSaveSafety('Incident Report', data)}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
          />
        );
      })()}

      {/* Modal: First Aid Log (Form 17) */}
      {activeSafetyForm === 'first-aid' && (() => {
        return (
          <SafetyFirstAidFormModal
            onClose={() => setActiveSafetyForm(null)}
            onSubmit={(data) => handleSaveSafety('First Aid Log', data)}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
          />
        );
      })()}

      {/* Modal: Environmental Swab Test (Form 14) */}
      {activeSafetyForm === 'swab' && (() => {
        return (
          <SafetySwabFormModal
            onClose={() => setActiveSafetyForm(null)}
            onSubmit={(data) => handleSaveSafety('Swab Test', data)}
          />
        );
      })()}

      {/* Modal: OHS Induction Form (Form 37) */}
      {activeSafetyForm === 'induction' && (() => {
        return (
          <SafetyForm37Modal
            onClose={() => setActiveSafetyForm(null)}
            onSubmit={(data) => handleSaveSafety('Induction Log', data)}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
          />
        );
      })()}

      {/* Modal: View Safety Report Details */}
      {viewingSafetyRecord && (() => {
        return (
          <SafetyReportViewerModal
            record={viewingSafetyRecord}
            onClose={() => setViewingSafetyRecord(null)}
          />
        );
      })()}

      {/* Modal: Laboratory Form 1 */}
      {activeLabForm === 'form1' && (
        <LabForm1Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 1 (Micro raw)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}

      {/* Modal: Laboratory Form 9 */}
      {activeLabForm === 'form9' && (
        <LabForm9Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 9 (Chemical)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}

      {/* Modal: Laboratory Form 11 */}
      {activeLabForm === 'form11' && (
        <LabForm11Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 11 (Micro water)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}

      {/* Modal: Laboratory Form 21 */}
      {activeLabForm === 'form21' && (
        <LabForm21Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 21 (Taste/Visual)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}

      {/* Modal: Laboratory Form 36 */}
      {activeLabForm === 'form36' && (
        <LabForm36Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 36 (Bourbon/Cola)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}

      {/* Modal: Laboratory Form 100 */}
      {activeLabForm === 'form100' && (
        <LabForm100Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 100 (Production Log)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}
      {/* Modal: Laboratory Form 103 */}
      {activeLabForm === 'form103' && (
        <LabForm103Modal
          onClose={() => setActiveLabForm(null)}
          onSubmit={(data) => handleSaveLaboratory('Form 103 (Silver Log)', data)}
          employeeList={employeeList}
          handleSearchEmployees={handleSearchEmployees}
          showEmployeeDropdown={showEmployeeDropdown}
          setShowEmployeeDropdown={setShowEmployeeDropdown}
          activeSearchField={activeSearchField}
        />
      )}

      {/* Modal: View Laboratory Report Details */}
      {viewingLabRecord && (
        <LabReportViewerModal
          record={viewingLabRecord}
          onClose={() => setViewingLabRecord(null)}
        />
      )}

      {/* Stock Entry Dialog Modal */}
      {/* Stock Entry Dialog Modal */}
      {stockEntryModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => { setActiveSeSourceRow(null); setActiveSeTargetRow(null); }}>
          <div className="modal-panel" style={{ maxWidth: '850px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{stockEntryModal.stockEntryName ? `Edit Stock Entry Draft: ${stockEntryModal.stockEntryName}` : 'New Stock Entry (Material Transfer for Manufacture)'}</h3>
              <button className="close-btn" onClick={() => setStockEntryModal(null)}>✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleConfirmStockEntry(stockEntryModal);
            }}>
              <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="input-label">Series</label>
                    <input type="text" className="text-input" value="MAT-STE-YYYY.-" disabled style={{ opacity: 0.7 }} />
                  </div>
                  <div>
                    <label className="input-label">Stock Entry Type</label>
                    <input type="text" className="text-input" value="Material Transfer for Manufacture" disabled style={{ opacity: 0.7 }} />
                  </div>
                  <div>
                    <label className="input-label">Work Order</label>
                    <input type="text" className="text-input" value={stockEntryModal.woId} disabled style={{ opacity: 0.7 }} />
                  </div>
                  <div>
                    <label className="input-label">Company *</label>
                    <input
                      type="text"
                      className="text-input"
                      value={stockEntryModal.company}
                      onChange={(e) => setStockEntryModal(prev => ({ ...prev, company: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Posting Date *</label>
                    <input
                      type="date"
                      className="text-input"
                      value={stockEntryModal.postingDate}
                      onChange={(e) => setStockEntryModal(prev => ({ ...prev, postingDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Posting Time *</label>
                    <input
                      type="time"
                      className="text-input"
                      value={stockEntryModal.postingTime}
                      onChange={(e) => setStockEntryModal(prev => ({ ...prev, postingTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: 'var(--text-heading)' }}>Items List</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
                  <table className="custom-table" style={{ margin: 0, width: '100%' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th>Source Warehouse *</th>
                        <th>Target Warehouse *</th>
                        <th>Item Code</th>
                        <th style={{ width: '120px' }}>Transfer Qty *</th>
                        <th>UOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockEntryModal.items.map((item, idx) => (
                        <tr key={item.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ position: 'relative', minWidth: '180px' }}>
                            <input
                              type="text"
                              className="text-input"
                              style={{ padding: '4px 8px', fontSize: '13px' }}
                              value={seSourceSearch[idx] !== undefined ? seSourceSearch[idx] : item.sourceWarehouse}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSeSourceSearch(prev => ({ ...prev, [idx]: val }));
                                const newItems = [...stockEntryModal.items];
                                newItems[idx].sourceWarehouse = val;
                                setStockEntryModal(prev => ({ ...prev, items: newItems }));
                                handleSearchSeSource(idx, val);
                              }}
                              onFocus={() => setActiveSeSourceRow(idx)}
                              placeholder="Search Source..."
                              required
                            />
                            {activeSeSourceRow === idx && seSourceSuggestions[idx] && seSourceSuggestions[idx].length > 0 && (
                              <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '120px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {seSourceSuggestions[idx].map(w => (
                                  <div
                                    key={w.name}
                                    className="dropdown-item"
                                    style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '11px', color: '#111' }}
                                    onClick={() => selectSeSource(idx, w)}
                                  >
                                    🏢 {w.warehouse_name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ position: 'relative', minWidth: '180px' }}>
                            <input
                              type="text"
                              className="text-input"
                              style={{ padding: '4px 8px', fontSize: '13px' }}
                              value={seTargetSearch[idx] !== undefined ? seTargetSearch[idx] : item.targetWarehouse}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSeTargetSearch(prev => ({ ...prev, [idx]: val }));
                                const newItems = [...stockEntryModal.items];
                                newItems[idx].targetWarehouse = val;
                                setStockEntryModal(prev => ({ ...prev, items: newItems }));
                                handleSearchSeTarget(idx, val);
                              }}
                              onFocus={() => setActiveSeTargetRow(idx)}
                              placeholder="Search Target..."
                              required
                            />
                            {activeSeTargetRow === idx && seTargetSuggestions[idx] && seTargetSuggestions[idx].length > 0 && (
                              <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '120px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {seTargetSuggestions[idx].map(w => (
                                  <div
                                    key={w.name}
                                    className="dropdown-item"
                                    style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '11px', color: '#111' }}
                                    onClick={() => selectSeTarget(idx, w)}
                                  >
                                    🏢 {w.warehouse_name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-heading)' }}>
                            <strong>{item.code}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.name}</div>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              className="text-input"
                              style={{ padding: '4px 8px', fontSize: '13px' }}
                              value={item.qty}
                              onChange={(e) => {
                                const newItems = [...stockEntryModal.items];
                                newItems[idx].qty = e.target.value;
                                setStockEntryModal(prev => ({ ...prev, items: newItems }));
                              }}
                              required
                            />
                          </td>
                          <td style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setStockEntryModal(null)}
                  disabled={seSaving}
                >
                  Cancel
                </button>

                {stockEntryModal.stockEntryName && (
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled
                  >
                    Draft: {stockEntryModal.stockEntryName}
                  </button>
                )}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={seSaving}
                  style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                >
                  {seSaving ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                      {stockEntryModal.stockEntryName ? 'Updating Draft...' : 'Saving Draft...'}
                    </>
                  ) : (stockEntryModal.stockEntryName ? 'Update Stock Entry Draft' : 'Save Stock Entry')}
                </button>

                {stockEntryModal.stockEntryName && (
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={seSaving}
                    onClick={handleSubmitStockEntry}
                    style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                  >
                    {seSaving ? (
                      <>
                        <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                        Submitting...
                      </>
                    ) : 'Submit Stock Entry'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Send Email */}
      {emailModal && (
        <div className="modal-backdrop" style={{ zIndex: 1150 }} onClick={() => setEmailModal(null)}>
          <div className="modal-panel" style={{ maxWidth: '500px', width: '90%', background: '#faf6f0', border: '1px solid #dcd1c4', borderRadius: '12px', boxShadow: '0 10px 25px rgba(92, 74, 60, 0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #eadecf', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#5c4a3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📧 Dispatch Report via Email
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#8c7664' }} onClick={() => setEmailModal(null)}>✕</button>
            </div>

            <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c6553', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recipient Email *</label>
                <input
                  type="email"
                  className="form-input"
                  style={{ borderColor: '#dcd1c4', backgroundColor: '#fff', color: '#3c3025' }}
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  required
                  placeholder="enter email address..."
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c6553', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ borderColor: '#dcd1c4', backgroundColor: '#fff', color: '#3c3025' }}
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c6553', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message Body</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px', borderColor: '#dcd1c4', backgroundColor: '#fff', color: '#3c3025', fontFamily: 'inherit', fontSize: '12px', padding: '8px' }}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f5efe6', padding: '10px', borderRadius: '8px', border: '1px solid #eadecf' }}>
                <span style={{ fontSize: '20px' }}>📎</span>
                <div style={{ fontSize: '12px', color: '#5c4a3c' }}>
                  <strong>Attachment:</strong> {emailModal.reportType} (Generated PDF Simulation)
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #eadecf', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="secondary-btn" style={{ backgroundColor: '#e7dfd8', color: '#5c4a3c', border: 'none' }} onClick={() => setEmailModal(null)} disabled={emailSending}>Cancel</button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ backgroundColor: '#a27b5c', borderColor: '#a27b5c', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={emailSending}
                >
                  {emailSending ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                      Sending...
                    </>
                  ) : (
                    'Send Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Sales Invoice */}
      {showCreateInvoiceModal && (
        <SalesInvoiceFormModal
          onClose={() => setShowCreateInvoiceModal(false)}
          products={PRODUCTS}
          loading={salesLoading}
          onSubmit={async (data) => {
            setSalesLoading(true);
            try {
              const res = await frappe.createSalesInvoice(data);
              if (res.success) {
                showAlert(`Sales Invoice ${res.name} created and submitted successfully!`, 'success', 'Invoice Created');
                loadSalesInvoices();
              }
            } catch (err) {
              showAlert(err.message || 'Failed to create invoice', 'error', 'Error');
            } finally {
              setSalesLoading(false);
              setShowCreateInvoiceModal(false);
            }
          }}
        />
      )}

      {/* Modal: Amend Sales Invoice */}
      {showAmendInvoiceModal && selectedInvoice && (
        <SalesInvoiceFormModal
          onClose={() => setShowAmendInvoiceModal(false)}
          products={PRODUCTS}
          initialData={selectedInvoice}
          loading={salesLoading}
          onSubmit={async (data) => {
            setSalesLoading(true);
            try {
              const res = await frappe.amendSalesInvoice(selectedInvoice.name, data);
              if (res.success) {
                showAlert(`Sales Invoice ${res.name} amended successfully!`, 'success', 'Invoice Amended');
                loadSalesInvoices();
                setSelectedInvoice(null);
              }
            } catch (err) {
              showAlert(err.message || 'Failed to amend invoice', 'error', 'Error');
            } finally {
              setSalesLoading(false);
              setShowAmendInvoiceModal(false);
            }
          }}
        />
      )}

      {/* Modal: Create Delivery Note */}
      {showCreateDeliveryNoteModal && (
        <DeliveryNoteFormModal
          onClose={() => setShowCreateDeliveryNoteModal(false)}
          products={PRODUCTS}
          loading={salesLoading}
          onSubmit={async (data) => {
            setSalesLoading(true);
            try {
              const res = await frappe.createDeliveryNote(data);
              if (res.success) {
                showAlert(`Delivery Note ${res.name} created and submitted successfully!`, 'success', 'Delivery Note Created');
                loadDeliveryNotes();
              }
            } catch (err) {
              showAlert(err.message || 'Failed to create Delivery Note', 'error', 'Error');
            } finally {
              setSalesLoading(false);
              setShowCreateDeliveryNoteModal(false);
            }
          }}
        />
      )}

      {/* Modal: Amend Delivery Note */}
      {showAmendDeliveryNoteModal && selectedDeliveryNote && (
        <DeliveryNoteFormModal
          onClose={() => setShowAmendDeliveryNoteModal(false)}
          products={PRODUCTS}
          initialData={selectedDeliveryNote}
          loading={salesLoading}
          onSubmit={async (data) => {
            setSalesLoading(true);
            try {
              const res = await frappe.amendDeliveryNote(selectedDeliveryNote.name, data);
              if (res.success) {
                showAlert(`Delivery Note ${res.name} amended successfully!`, 'success', 'Delivery Note Amended');
                loadDeliveryNotes();
                setSelectedDeliveryNote(null);
              }
            } catch (err) {
              showAlert(err.message || 'Failed to amend Delivery Note', 'error', 'Error');
            } finally {
              setSalesLoading(false);
              setShowAmendDeliveryNoteModal(false);
            }
          }}
        />
      )}

      {/* Custom Alert Message Modal */}
      {alertModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setAlertModal(null)}>
          <div className="modal-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {alertModal.type === 'error' ? '❌' : alertModal.type === 'warning' ? '⚠️' : '✅'}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-heading)' }}>
              {alertModal.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              {alertModal.message}
            </p>
            <button
              className="primary-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setAlertModal(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub-components for Health & Safety Tab

function SafetyIncidentFormModal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [injuredName, setInjuredName] = useState('');
  const [sex, setSex] = useState('Male');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('');
  const [experienceDays, setExperienceDays] = useState('');
  const [relationship, setRelationship] = useState('Employee');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentType, setIncidentType] = useState('Accident');
  const [incidentAgency, setIncidentAgency] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [medicalTreatment, setMedicalTreatment] = useState('');
  const [practitionerName, setPractitionerName] = useState('');
  const [dateNotified, setDateNotified] = useState('');
  const [incapacityPeriod, setIncapacityPeriod] = useState('');
  const [daysLost, setDaysLost] = useState('');
  const [dateResumption, setDateResumption] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [dateActionTaken, setDateActionTaken] = useState('');

  const [operator, setOperator] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [overallComments, setOverallComments] = useState('');

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      injuredPerson: injuredName,
      sex,
      address,
      dob,
      jobTitle,
      experience: `${experienceYears || 0}y ${experienceMonths || 0}m ${experienceDays || 0}d`,
      relationship,
      incidentTime,
      incidentType,
      incidentAgency,
      incidentLocation,
      details: damageDescription,
      medicalTreatment,
      practitionerName,
      dateNotified,
      incapacityPeriod,
      daysLost: Number(daysLost || 0),
      dateResumption,
      correctiveAction,
      dateActionTaken,
      operator,
      supervisor,
      overallComments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '960px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water Fiji PTE Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OHSF 1 & 2: Accident and Disease Notification Report</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Section 1: Personal Data */}
            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', color: 'var(--accent)', fontSize: '13px' }}>1. Personal Data of Injured Person</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Name of Injured Person *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={injuredName}
                    onChange={(e) => {
                      setInjuredName(e.target.value);
                      handleSearchEmployees(e.target.value, 'safetyInjured');
                    }}
                    placeholder="Search employee (min 3 chars)"
                  />
                  {showEmployeeDropdown && activeSearchField === 'safetyInjured' && (
                    <div className="autocomplete-dropdown" style={{ top: '100%', zIndex: 10 }}>
                      {employeeList.map(emp => (
                        <div
                          key={emp.name}
                          className="dropdown-item"
                          onClick={() => {
                            setInjuredName(`${emp.employee_name || emp.name} (${emp.name})`);
                            if (emp.gender) setSex(emp.gender);
                            if (emp.date_of_birth) setDob(emp.date_of_birth);
                            if (emp.designation) setJobTitle(emp.designation);
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          👤 {emp.employee_name || emp.name} ({emp.designation || 'Staff'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sex</label>
                  <select className="form-input" value={sex} onChange={e => setSex(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
                  <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Residential Address</label>
                  <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Job Title</label>
                  <input type="text" className="form-input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Packer" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Relationship Status</label>
                  <select className="form-input" value={relationship} onChange={e => setRelationship(e.target.value)}>
                    <option value="Employee">Employee</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Trainee">Trainee</option>
                    <option value="Apprentice">Apprentice</option>
                    <option value="Visitor">Visitor</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Experience (Years)</label>
                  <input type="number" min="0" className="form-input" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="Years" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Experience (Months)</label>
                  <input type="number" min="0" max="11" className="form-input" value={experienceMonths} onChange={e => setExperienceMonths(e.target.value)} placeholder="Months" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Experience (Days)</label>
                  <input type="number" min="0" max="30" className="form-input" value={experienceDays} onChange={e => setExperienceDays(e.target.value)} placeholder="Days" />
                </div>
              </div>
            </div>

            {/* Section 2: Details of Incident */}
            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', color: 'var(--accent)', fontSize: '13px' }}>2. Incident / Disease Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date and Time of Occurrence *</label>
                  <input type="datetime-local" className="form-input" required value={incidentTime} onChange={e => setIncidentTime(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type of Incident</label>
                  <select className="form-input" value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                    <option value="Accident">Accident</option>
                    <option value="Disease">Occupational Disease</option>
                    <option value="Near Miss">Near Miss</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Agency involved</label>
                  <input type="text" className="form-input" value={incidentAgency} onChange={e => setIncidentAgency(e.target.value)} placeholder="e.g. Forklift, Wet Floor" />
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>How/Where did incident happen? Location & Description *</label>
                <textarea className="form-input" required style={{ height: '70px', padding: '8px' }} value={incidentLocation} onChange={e => setIncidentLocation(e.target.value)} placeholder="Describe the scene, physical location, and sequence of events." />
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description of Personal Damage/Injuries *</label>
                <textarea className="form-input" required style={{ height: '70px', padding: '8px' }} value={damageDescription} onChange={e => setDamageDescription(e.target.value)} placeholder="Specify injuries (e.g. cut to left hand index finger)." />
              </div>
            </div>

            {/* Section 3: Medical Treatment & Incapacity */}
            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', color: 'var(--accent)', fontSize: '13px' }}>3. Treatment & Incapacity details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Medical Treatment Given</label>
                  <input type="text" className="form-input" value={medicalTreatment} onChange={e => setMedicalTreatment(e.target.value)} placeholder="e.g. Bandaged at clinic" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Name of Medical Practitioner</label>
                  <input type="text" className="form-input" value={practitionerName} onChange={e => setPractitionerName(e.target.value)} placeholder="Practitioner / Hospital Name" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date Notified to Chief Inspector</label>
                  <input type="date" className="form-input" value={dateNotified} onChange={e => setDateNotified(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Period of Incapacity</label>
                  <input type="text" className="form-input" value={incapacityPeriod} onChange={e => setIncapacityPeriod(e.target.value)} placeholder="e.g. 5 days off" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Total Working Days Lost</label>
                  <input type="number" min="0" className="form-input" value={daysLost} onChange={e => setDaysLost(e.target.value)} placeholder="Working Days" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date of Resumption of Work</label>
                  <input type="date" className="form-input" value={dateResumption} onChange={e => setDateResumption(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 4: Corrective Actions */}
            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', color: 'var(--accent)', fontSize: '13px' }}>4. Corrective Action & Validation</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Corrective Action Identified</label>
                  <input type="text" className="form-input" value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} placeholder="Describe actions to prevent recurrence." />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date Action Taken</label>
                  <input type="date" className="form-input" value={dateActionTaken} onChange={e => setDateActionTaken(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '50px', padding: '6px' }}
                  value={overallComments}
                  onChange={e => setOverallComments(e.target.value)}
                  placeholder="Enter overall comments or observations about this incident notification..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sign of Operator / Logger *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={operator}
                    onChange={(e) => {
                      setOperator(e.target.value);
                      handleSearchEmployees(e.target.value, 'safetyOperator');
                    }}
                    placeholder="Search employee (min 3 chars)"
                  />
                  {showEmployeeDropdown && activeSearchField === 'safetyOperator' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div
                          key={emp.name}
                          className="dropdown-item"
                          onClick={() => {
                            setOperator(`${emp.employee_name || emp.name} (${emp.name})`);
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          👤 {emp.employee_name || emp.name} ({emp.designation || 'Staff'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sign of Supervisor / Approver *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={supervisor}
                    onChange={(e) => {
                      setSupervisor(e.target.value);
                      handleSearchEmployees(e.target.value, 'safetySupervisor');
                    }}
                    placeholder="Search supervisor (min 3 chars)"
                  />
                  {showEmployeeDropdown && activeSearchField === 'safetySupervisor' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div
                          key={emp.name}
                          className="dropdown-item"
                          onClick={() => {
                            setSupervisor(`${emp.employee_name || emp.name} (${emp.name})`);
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          👤 {emp.employee_name || emp.name} ({emp.designation || 'Supervisor'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}>Save Incident Notification</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SafetyFirstAidFormModal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [injuredName, setInjuredName] = useState('');
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [injuryType, setInjuryType] = useState('Minor');
  const [cause, setCause] = useState('');
  const [treatment, setTreatment] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [supervisor, setSupervisor] = useState('');

  const [overallComments, setOverallComments] = useState('');

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      injuredPerson: injuredName,
      date,
      time,
      injuryType,
      incidentNature: injuryType,
      cause,
      treatmentGiven: treatment,
      verifiedBy: administeredBy,
      operator: administeredBy,
      supervisor,
      overallComments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '720px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 17: First Aid Registry Log</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Time</label>
                <input type="time" className="form-input" required value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Employee / Person Injured *</label>
              <input
                type="text"
                className="form-input"
                required
                value={injuredName}
                onChange={(e) => {
                  setInjuredName(e.target.value);
                  handleSearchEmployees(e.target.value, 'firstAidEmployee');
                }}
                placeholder="Search injured person name (min 3 chars)"
              />
              {showEmployeeDropdown && activeSearchField === 'firstAidEmployee' && (
                <div className="autocomplete-dropdown">
                  {employeeList.map(emp => (
                    <div
                      key={emp.name}
                      className="dropdown-item"
                      onClick={() => {
                        setInjuredName(`${emp.employee_name || emp.name} (${emp.name})`);
                        setShowEmployeeDropdown(false);
                      }}
                    >
                      👤 {emp.employee_name || emp.name} ({emp.designation || 'Staff'})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type of Injury</label>
              <select className="form-input" value={injuryType} onChange={e => setInjuryType(e.target.value)}>
                <option value="Minor">Minor (small cuts, bruises, etc.)</option>
                <option value="Serious">Serious (major injury such as fracture)</option>
                <option value="Critical">Need Immediate Medical Attention</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Cause(s) of Injury *</label>
              <textarea className="form-input" required style={{ height: '60px', padding: '8px' }} value={cause} onChange={e => setCause(e.target.value)} placeholder="Describe the physical cause." />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>First Aid Treatment Given *</label>
              <textarea className="form-input" required style={{ height: '60px', padding: '8px' }} value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Describe first aid treatment." />
            </div>

            <div className="form-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
              <textarea
                className="form-input"
                style={{ minHeight: '50px', padding: '6px' }}
                value={overallComments}
                onChange={e => setOverallComments(e.target.value)}
                placeholder="Enter overall comments or observations about this first aid administration..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>First Aid Given By (Sign) *</label>
                <input type="text" className="form-input" required value={administeredBy} onChange={e => setAdministeredBy(e.target.value)} placeholder="Attendant Name" />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Approved By Supervisor *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={supervisor}
                  onChange={(e) => {
                    setSupervisor(e.target.value);
                    handleSearchEmployees(e.target.value, 'firstAidSupervisor');
                  }}
                  placeholder="Search supervisor name (min 3 chars)"
                />
                {showEmployeeDropdown && activeSearchField === 'firstAidSupervisor' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div
                        key={emp.name}
                        className="dropdown-item"
                        onClick={() => {
                          setSupervisor(`${emp.employee_name || emp.name} (${emp.name})`);
                          setShowEmployeeDropdown(false);
                        }}
                      >
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Supervisor'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save First Aid Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SafetySwabFormModal({ onClose, onSubmit }) {
  const [analyst, setAnalyst] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [swabData, setSwabData] = useState({
    filtration: { yeast: '', mould: '', hpc: '' },
    infeed: { yeast: '', mould: '', hpc: '' },
    cleanRoom: { yeast: '', mould: '', hpc: '' },
    labelling: { yeast: '', mould: '', hpc: '' },
    warehouse: { yeast: '', mould: '', hpc: '' },
    blowing: { yeast: '', mould: '', hpc: '' }
  });

  const locations = [
    { key: 'filtration', name: 'Filtration Area' },
    { key: 'infeed', name: 'Infeed' },
    { key: 'cleanRoom', name: 'Clean Room' },
    { key: 'labelling', name: 'Labelling' },
    { key: 'warehouse', name: 'Ware-House' },
    { key: 'blowing', name: 'Blowing' }
  ];

  const [overallComments, setOverallComments] = useState('');

  const handleInputChange = (loc, key, val) => {
    setSwabData(prev => ({
      ...prev,
      [loc]: {
        ...prev[loc],
        [key]: val
      }
    }));
  };

  const checkContamination = () => {
    // exceeds 15cfu except for Warehouse
    return locations.some(loc => {
      if (loc.key === 'warehouse') return false;
      const data = swabData[loc.key];
      return Number(data.yeast || 0) > 15 || Number(data.mould || 0) > 15 || Number(data.hpc || 0) > 15;
    });
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      analyst,
      date,
      swabData,
      operator: analyst,
      supervisor: 'Operations Manager',
      overallComments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '840px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 14: Environmental Swab Test microbiology Register</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Analyst *</label>
                <input type="text" className="form-input" required value={analyst} onChange={e => setAnalyst(e.target.value)} placeholder="Name of Analyst" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date of Swab *</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            {checkContamination() && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                ⚠️ Contamination Warning: One or more zones exceed safety threshold =&lt; 15cfu (excluding Warehouse).
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Location</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Yeast Count (CFU)</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Mould Count (CFU)</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>HPC Count (CFU)</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map(loc => {
                    const rowWarning = loc.key !== 'warehouse' && (
                      Number(swabData[loc.key].yeast || 0) > 15 ||
                      Number(swabData[loc.key].mould || 0) > 15 ||
                      Number(swabData[loc.key].hpc || 0) > 15
                    );
                    return (
                      <tr key={loc.key} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rowWarning ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '8px', fontWeight: '600' }}>
                          {loc.name} {loc.key === 'warehouse' && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(Exempt)</span>}
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            style={{ height: '30px', textAlign: 'center', borderColor: rowWarning && Number(swabData[loc.key].yeast || 0) > 15 ? 'var(--danger)' : '' }}
                            value={swabData[loc.key].yeast}
                            onChange={e => handleInputChange(loc.key, 'yeast', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            style={{ height: '30px', textAlign: 'center', borderColor: rowWarning && Number(swabData[loc.key].mould || 0) > 15 ? 'var(--danger)' : '' }}
                            value={swabData[loc.key].mould}
                            onChange={e => handleInputChange(loc.key, 'mould', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            style={{ height: '30px', textAlign: 'center', borderColor: rowWarning && Number(swabData[loc.key].hpc || 0) > 15 ? 'var(--danger)' : '' }}
                            value={swabData[loc.key].hpc}
                            onChange={e => handleInputChange(loc.key, 'hpc', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
              <textarea
                className="form-input"
                style={{ minHeight: '50px', padding: '6px' }}
                value={overallComments}
                onChange={e => setOverallComments(e.target.value)}
                placeholder="Enter overall comments or observations about this microbiology swab run..."
              />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              * Acceptance threshold is =&lt; 15cfu. Warehouse counts are recorded but excluded from compliance limits.
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>Save Swab Report</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SafetyReportViewerModal({ record, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel print-report-container" style={{ width: '840px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water Fiji PTE Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Archived Safety Document Details ({record.id})</span>
          </div>
          <button className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', fontSize: '12px' }}>

          <div style={{ padding: '12px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>DOCUMENT TYPE</span>
              <strong style={{ fontSize: '14px', color: 'var(--accent)' }}>{record.type}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>LOGGED TIMESTAMP</span>
              <strong>{record.timestamp}</strong>
            </div>
          </div>

          {/* OHSF Incident Report Render */}
          {record.type === 'Incident Report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', color: 'var(--accent)', marginBottom: '8px' }}>Personal Data of Injured Person</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div><strong>Name:</strong> {record.injuredPerson}</div>
                  <div><strong>Sex:</strong> {record.sex}</div>
                  <div><strong>DOB:</strong> {record.dob || '-'}</div>
                  <div><strong>Residential Address:</strong> {record.address || '-'}</div>
                  <div><strong>Job Title:</strong> {record.jobTitle || '-'}</div>
                  <div><strong>Employment Status:</strong> {record.relationship}</div>
                  <div><strong>Experience:</strong> {record.experience || '-'}</div>
                </div>
              </div>

              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', color: 'var(--accent)', marginBottom: '8px' }}>Incident / Disease Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div><strong>Occurrence Time:</strong> {record.incidentTime}</div>
                  <div><strong>Type:</strong> {record.incidentType}</div>
                  <div><strong>Agency involved:</strong> {record.incidentAgency || '-'}</div>
                </div>
                <div style={{ marginTop: '8px' }}><strong>How & Where Happened:</strong> {record.incidentLocation}</div>
                <div style={{ marginTop: '8px' }}><strong>Injuries & Damage Description:</strong> {record.details}</div>
              </div>

              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', color: 'var(--accent)', marginBottom: '8px' }}>Medical Treatment & lost Time</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div><strong>Treatment:</strong> {record.medicalTreatment || '-'}</div>
                  <div><strong>Practitioner:</strong> {record.practitionerName || '-'}</div>
                  <div><strong>Notified Chief Inspector:</strong> {record.dateNotified || '-'}</div>
                  <div><strong>Period of Incapacity:</strong> {record.incapacityPeriod || '-'}</div>
                  <div><strong>Working Days Lost:</strong> {record.daysLost || 0} days</div>
                  <div><strong>Resumption Date:</strong> {record.dateResumption || '-'}</div>
                </div>
              </div>

              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', color: 'var(--accent)', marginBottom: '8px' }}>Corrective Actions & Signatures</h4>
                <div><strong>Corrective Action Identified:</strong> {record.correctiveAction || '-'} (taken on {record.dateActionTaken || '-'})</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                  <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}><strong>Operator/Logger:</strong> {record.operator}</div>
                  <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}><strong>Supervisor/Approver:</strong> {record.supervisor}</div>
                </div>
              </div>
            </div>
          )}

          {/* First Aid Log Render */}
          {record.type === 'First Aid Log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div><strong>Injured Employee:</strong> {record.injuredPerson}</div>
                <div><strong>Date:</strong> {record.date}</div>
                <div><strong>Time:</strong> {record.time}</div>
                <div><strong>Injury Classification:</strong> {record.injuryType}</div>
                <div><strong>Attendant / First Aider:</strong> {record.verifiedBy}</div>
                <div><strong>Approving Supervisor:</strong> {record.supervisor}</div>
              </div>
              <div><strong>Cause(s) of Injury:</strong> {record.cause}</div>
              <div><strong>First Aid Treatment Administered:</strong> {record.treatmentGiven}</div>
            </div>
          )}

          {/* Swab Test Log Render */}
          {record.type === 'Swab Test' && (() => {
            const locations = [
              { key: 'filtration', name: 'Filtration Area' },
              { key: 'infeed', name: 'Infeed' },
              { key: 'cleanRoom', name: 'Clean Room' },
              { key: 'labelling', name: 'Labelling' },
              { key: 'warehouse', name: 'Ware-House' },
              { key: 'blowing', name: 'Blowing' }
            ];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><strong>Analyst Name:</strong> {record.analyst}</div>
                  <div><strong>Swab Date:</strong> {record.date}</div>
                </div>
                <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ padding: '6px' }}>Zone Location</th>
                      <th style={{ padding: '6px', textAlign: 'center' }}>Yeast Count (CFU)</th>
                      <th style={{ padding: '6px', textAlign: 'center' }}>Mould Count (CFU)</th>
                      <th style={{ padding: '6px', textAlign: 'center' }}>HPC Count (CFU)</th>
                      <th style={{ padding: '6px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map(loc => {
                      const yeast = Number(record.swabData?.[loc.key]?.yeast || 0);
                      const mould = Number(record.swabData?.[loc.key]?.mould || 0);
                      const hpc = Number(record.swabData?.[loc.key]?.hpc || 0);
                      const warning = loc.key !== 'warehouse' && (yeast > 15 || mould > 15 || hpc > 15);

                      return (
                        <tr key={loc.key} style={{ backgroundColor: warning ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                          <td style={{ padding: '6px', fontWeight: '600' }}>{loc.name}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{yeast}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{mould}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{hpc}</td>
                          <td style={{ padding: '6px', textAlign: 'center', fontWeight: '700', color: warning ? 'var(--danger)' : 'var(--success)' }}>
                            {warning ? '⚠️ Fail (>15cfu)' : 'Pass'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Induction Log Render */}
          {record.type === 'Induction Log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div><strong>Inductee Name:</strong> {record.name}</div>
                <div><strong>Reason for Visit:</strong> {record.reasonForVisit}</div>
                <div><strong>Visiting Areas:</strong> {record.visitingAreas}</div>
                <div><strong>Date Checklisted:</strong> {record.date} (Signature: {record.signature})</div>
                <div><strong>Inductor Name:</strong> {record.inductorName} (Signature: {record.inductorSignature})</div>
                <div><strong>Inductor Date:</strong> {record.inductorDate}</div>
                <div><strong>Approved By:</strong> {record.approvedByName} (Signature: {record.approvedBySign})</div>
              </div>

              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', color: 'var(--accent)', marginBottom: '8px', fontWeight: '700' }}>Induction Checklist Items Status</h4>
              <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Induction Area Description</th>
                    <th style={{ padding: '6px', textAlign: 'center', width: '100px' }}>Inducted (YES/NO)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'companyPolicy', label: 'Company Policy (ISO 9001:2015, HACCP, Harassment, Health & Safety)' },
                    { key: 'dressCode', label: 'Dress Code (jewelry policy, sanitizing hands, hair nets/face masks, safety shoes)' },
                    { key: 'noMobile', label: 'No use of Mobile Phones in Production area' },
                    { key: 'earPlugs', label: 'Use of ear plugs or ear muffs in blowing section' },
                    { key: 'toilets', label: 'Toilets/ Change Rooms' },
                    { key: 'smoking', label: 'Smoking/Non Smoking Areas' },
                    { key: 'authorizedAreas', label: 'Authorized/Unauthorized Areas' },
                    { key: 'hazardReporting', label: 'Hazard Reporting Procedures (Damaged Bait Stations, incomplete structures, etc.)' },
                    { key: 'accidentReporting', label: 'Accident/Incident Reporting Procedures' },
                    { key: 'evacuationProcedure', label: 'Evacuation Procedure' },
                    { key: 'nearestExit', label: 'Nearest Exit in the Case of Emergency' },
                    { key: 'fireEquipment', label: 'Location of Nearest Fire Fighting Equipment' },
                    { key: 'firstAidKit', label: 'Location of First Aid Kit/Certified first aiders' },
                    { key: 'healthIssues', label: 'Any health issues or food poisoning has occurred at least 2 weeks prior to factory visit' },
                    { key: 'msdsLocation', label: 'Location of MSDS' }
                  ].map(item => (
                    <tr key={item.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px' }}>{item.label}</td>
                      <td style={{ padding: '6px', textAlign: 'center', fontWeight: '700', color: record.checklist?.[item.key] === 'YES' ? 'var(--success)' : 'var(--danger)' }}>
                        {record.checklist?.[item.key] || 'NO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {record.comments && (
                <div><strong>Comments / Remarks:</strong> {record.comments}</div>
              )}
            </div>
          )}
          {record.overallComments && (
            <div style={{ marginTop: '16px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', marginBottom: '16px' }}>
              <strong style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OVERALL COMMENTS / REMARKS</strong>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-heading)' }}>{record.overallComments}</div>
            </div>
          )}

        </div>
        <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={() => setEmailModal({ reportId: record.id, reportType: record.type || 'Safety Report' })} style={{ backgroundColor: '#a27b5c', borderColor: '#a27b5c' }}>📧 Send Email</button>
          <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Report</button>
          <button type="button" className="secondary-btn" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  );
}

// Sub-components for Laboratory & QC Tab

function LabForm1Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [analyst, setAnalyst] = useState('');
  const [manager, setManager] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [preformLotNo, setPreformLotNo] = useState('');
  const [closuresLotNo, setClosuresLotNo] = useState('');
  const [bibInnerBag, setBibInnerBag] = useState('');
  const [isCheckedSpec, setIsCheckedSpec] = useState(false);

  const [sampleRows, setSampleRows] = useState(() => [
    { description: 'PET Preforms (Raw)', tcc: 'Absent', ecoli: 'Absent', analyst: '', inDate: new Date().toISOString().slice(0, 10), inTime: '10:00', outDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), outTime: '10:00' },
    { description: 'HDPE Closures (Raw)', tcc: 'Absent', ecoli: 'Absent', analyst: '', inDate: new Date().toISOString().slice(0, 10), inTime: '10:00', outDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), outTime: '10:00' },
    { description: 'BIB Inner Bag / Film (Raw)', tcc: 'Absent', ecoli: 'Absent', analyst: '', inDate: new Date().toISOString().slice(0, 10), inTime: '10:00', outDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), outTime: '10:00' }
  ]);

  const handleRowChange = (idx, key, val) => {
    setSampleRows(prev => prev.map((row, rIdx) => rIdx === idx ? { ...row, [key]: val } : row));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      analyst,
      manager,
      date,
      preformLotNo,
      closuresLotNo,
      bibInnerBag,
      sampleRows,
      specChecked: isCheckedSpec
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 1: Microbiological Analysis of Primary Raw Materials</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date of Analysis</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Analyst Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={analyst}
                  onChange={(e) => { setAnalyst(e.target.value); handleSearchEmployees(e.target.value, 'labAnalyst'); }}
                  placeholder="Search Analyst..."
                />
                {showEmployeeDropdown && activeSearchField === 'labAnalyst' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setAnalyst(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Analyst'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Operations Manager *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={manager}
                  onChange={(e) => { setManager(e.target.value); handleSearchEmployees(e.target.value, 'labManager'); }}
                  placeholder="Search Manager..."
                />
                {showEmployeeDropdown && activeSearchField === 'labManager' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setManager(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Manager'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Preform Lot No. *</label>
                <input type="text" className="form-input" required value={preformLotNo} onChange={e => setPreformLotNo(e.target.value)} placeholder="Lot number" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Closures Lot No. *</label>
                <input type="text" className="form-input" required value={closuresLotNo} onChange={e => setClosuresLotNo(e.target.value)} placeholder="Lot number" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>BIB Inner Bag *</label>
                <input type="text" className="form-input" required value={bibInnerBag} onChange={e => setBibInnerBag(e.target.value)} placeholder="Lot number" />
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Analysis and Incubation Results</h4>
              <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample Description</th>
                    <th style={{ width: '110px' }}>TCC (Absent/Coli)</th>
                    <th style={{ width: '110px' }}>E-Coli</th>
                    <th>Row Analyst</th>
                    <th>Incubation In (Date/Time)</th>
                    <th>Incubation Out (Date/Time)</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ fontWeight: '700', padding: '6px' }}>{row.description}</td>
                      <td style={{ padding: '4px' }}>
                        <select className="form-input" style={{ height: '30px' }} value={row.tcc} onChange={e => handleRowChange(idx, 'tcc', e.target.value)}>
                          <option value="Absent">Absent</option>
                          <option value="Present">Present (Fail)</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select className="form-input" style={{ height: '30px' }} value={row.ecoli} onChange={e => handleRowChange(idx, 'ecoli', e.target.value)}>
                          <option value="Absent">Absent</option>
                          <option value="Present">Present (Fail)</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input type="text" className="form-input" style={{ height: '30px' }} value={row.analyst} onChange={e => handleRowChange(idx, 'analyst', e.target.value)} placeholder="Analyst initials" />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="date" className="form-input" style={{ height: '30px', fontSize: '10px' }} value={row.inDate} onChange={e => handleRowChange(idx, 'inDate', e.target.value)} />
                          <input type="time" className="form-input" style={{ height: '30px', fontSize: '10px' }} value={row.inTime} onChange={e => handleRowChange(idx, 'inTime', e.target.value)} />
                        </div>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="date" className="form-input" style={{ height: '30px', fontSize: '10px' }} value={row.outDate} onChange={e => handleRowChange(idx, 'outDate', e.target.value)} />
                          <input type="time" className="form-input" style={{ height: '30px', fontSize: '10px' }} value={row.outTime} onChange={e => handleRowChange(idx, 'outTime', e.target.value)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" required checked={isCheckedSpec} onChange={e => setIsCheckedSpec(e.target.checked)} id="rm_spec_check" />
              <label htmlFor="rm_spec_check" style={{ fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                I certify that raw materials microbiological parameters are verified and conform to: **Negative or Absent for Coliform & E-Coli** specification bounds.
              </label>
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Micro Raw Analysis</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabForm9Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [analyst, setAnalyst] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [rawPh, setRawPh] = useState('7.0');
  const [rawPhTime, setRawPhTime] = useState('08:00');
  const [rawTds, setRawTds] = useState('100');
  const [rawTdsTime, setRawTdsTime] = useState('08:00');

  const [cipPh, setCipPh] = useState('7.0');
  const [cipTime, setCipTime] = useState('09:00');

  const [alcoholCheck, setAlcoholCheck] = useState('0.0');
  const [brixCheck, setBrixCheck] = useState('0.0');

  const [prodPh, setProdPh] = useState('7.2');
  const [prodPhTime, setProdPhTime] = useState('10:00');
  const [prodTds, setProdTds] = useState('120');
  const [prodTdsTime, setProdTdsTime] = useState('10:00');

  const [tasteCheck, setTasteCheck] = useState('Pass');
  const [tasteTime, setTasteTime] = useState('10:00');
  const [particleCheck, setParticleCheck] = useState('Pass');
  const [particleTime, setParticleTime] = useState('10:00');

  const [buffer4, setBuffer4] = useState('4.00');
  const [buffer7, setBuffer7] = useState('7.00');
  const [buffer10, setBuffer10] = useState('10.00');
  const [cond1413, setCond1413] = useState('1413');
  const [checkStandard, setCheckStandard] = useState('1413');
  const [comments, setComments] = useState('');

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      analyst,
      verifiedBy,
      date,
      rawPh, rawPhTime, rawTds, rawTdsTime,
      cipPh, cipTime,
      alcoholCheck, brixCheck,
      prodPh, prodPhTime, prodTds, prodTdsTime,
      tasteCheck, tasteTime, particleCheck, particleTime,
      buffer4, buffer7, buffer10, cond1413, checkStandard,
      comments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 9: Chemical Test Log Sheet</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Analyst *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={analyst}
                  onChange={(e) => { setAnalyst(e.target.value); handleSearchEmployees(e.target.value, 'labAnalyst'); }}
                  placeholder="Search Analyst..."
                />
                {showEmployeeDropdown && activeSearchField === 'labAnalyst' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setAnalyst(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Analyst'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Verified By *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={verifiedBy}
                  onChange={(e) => { setVerifiedBy(e.target.value); handleSearchEmployees(e.target.value, 'labVerifiedBy'); }}
                  placeholder="Search Verifier..."
                />
                {showEmployeeDropdown && activeSearchField === 'labVerifiedBy' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setVerifiedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Supervisor'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Raw Water & Post CIP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>1. Raw Water Parameters</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px' }}>pH Level / Time</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={rawPh} onChange={e => setRawPh(e.target.value)} />
                      <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={rawPhTime} onChange={e => setRawPhTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>TDS Level / Time</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" className="form-input" style={{ height: '30px' }} value={rawTds} onChange={e => setRawTds(e.target.value)} />
                      <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={rawTdsTime} onChange={e => setRawTdsTime(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>2. Sanitation & CIP Check</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px' }}>pH Level After CIP</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={cipPh} onChange={e => setCipPh(e.target.value)} />
                      <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={cipTime} onChange={e => setCipTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Alcohol% (RTD to CSD)</label>
                    <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={alcoholCheck} onChange={e => setAlcoholCheck(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Brix (RTD to Water)</label>
                    <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={brixCheck} onChange={e => setBrixCheck(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Product Water PET / BIB */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>3. Product Water PET / BIB (Spec Range: pH 6.5-8.5, TDS 50-500ppm)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px' }}>pH Level / Time</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="number" step="0.01" className="form-input" style={{ height: '30px', borderColor: (Number(prodPh) < 6.5 || Number(prodPh) > 8.5) ? 'var(--danger)' : '' }} value={prodPh} onChange={e => setProdPh(e.target.value)} />
                    <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={prodPhTime} onChange={e => setProdPhTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>TDS Level (ppm) / Time</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="number" className="form-input" style={{ height: '30px', borderColor: (Number(prodTds) < 50 || Number(prodTds) > 500) ? 'var(--danger)' : '' }} value={prodTds} onChange={e => setProdTds(e.target.value)} />
                    <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={prodTdsTime} onChange={e => setProdTdsTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Taste & Odour Check</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select className="form-input" style={{ height: '30px' }} value={tasteCheck} onChange={e => setTasteCheck(e.target.value)}>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                    <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={tasteTime} onChange={e => setTasteTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Visual Particle Check</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select className="form-input" style={{ height: '30px' }} value={particleCheck} onChange={e => setParticleCheck(e.target.value)}>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                    <input type="time" className="form-input" style={{ height: '30px', padding: '2px' }} value={particleTime} onChange={e => setParticleTime(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Reagents Check Buffer */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>4. Reagents & Instruments Calibration Check</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px' }}>pH 4.0 Buffer</label>
                  <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={buffer4} onChange={e => setBuffer4(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>pH 7.0 Buffer</label>
                  <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={buffer7} onChange={e => setBuffer7(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>pH 10.0 Buffer</label>
                  <input type="number" step="0.01" className="form-input" style={{ height: '30px' }} value={buffer10} onChange={e => setBuffer10(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>1413 µS/cm Conductivity</label>
                  <input type="number" className="form-input" style={{ height: '30px' }} value={cond1413} onChange={e => setCond1413(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Check Standard</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={checkStandard} onChange={e => setCheckStandard(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Comments / Observations</label>
              <textarea className="form-input" style={{ minHeight: '50px', padding: '6px' }} value={comments} onChange={e => setComments(e.target.value)} placeholder="Type notes here..." />
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Chemical Test</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabForm11Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [analyst, setAnalyst] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [market, setMarket] = useState('Local');
  const [productSize, setProductSize] = useState('1.5L PET');
  const [vessel, setVessel] = useState('Vessel A');
  const [compactDryEC, setCompactDryEC] = useState('CD-EC-901');
  const [pipetteLot, setPipetteLot] = useState('PL-9988');
  const [spcAgarDate, setSpcAgarDate] = useState(new Date().toISOString().slice(0, 10));
  const [incubatorNo, setIncubatorNo] = useState('INC-03');
  const [comments, setComments] = useState('');

  const [sampleRows, setSampleRows] = useState([
    { sample: 'Silver Ion Water', tcc: 'Absent', ecoli: 'Absent', hpc1: '0', hpc2: '0', analyst: '' },
    { sample: 'BH (Bore Hole) Water', tcc: 'Absent', ecoli: 'Absent', hpc1: '0', hpc2: '0', analyst: '' },
    { sample: '0.45um Filter Water', tcc: 'Absent', ecoli: 'Absent', hpc1: '0', hpc2: '0', analyst: '' }
  ]);

  const handleRowChange = (idx, key, val) => {
    setSampleRows(prev => prev.map((row, rIdx) => rIdx === idx ? { ...row, [key]: val } : row));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      analyst,
      date,
      market,
      productSize,
      vessel,
      compactDryEC,
      pipetteLot,
      spcAgarDate,
      incubatorNo,
      sampleRows,
      comments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 11: Microbiological Analysis of Raw and Product Water</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date of Analysis</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Analyst Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={analyst}
                  onChange={(e) => { setAnalyst(e.target.value); handleSearchEmployees(e.target.value, 'labAnalyst'); }}
                  placeholder="Search Analyst..."
                />
                {showEmployeeDropdown && activeSearchField === 'labAnalyst' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setAnalyst(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Analyst'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Market Area</label>
                <input type="text" className="form-input" value={market} onChange={e => setMarket(e.target.value)} placeholder="e.g. Export / Local" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Product Size</label>
                <input type="text" className="form-input" value={productSize} onChange={e => setProductSize(e.target.value)} placeholder="e.g. 500mL / 1.5L" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Vessel / Silo</label>
                <input type="text" className="form-input" value={vessel} onChange={e => setVessel(e.target.value)} placeholder="Vessel Name" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Compact Dry EC Batch</label>
                <input type="text" className="form-input" value={compactDryEC} onChange={e => setCompactDryEC(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Pipette Lot No.</label>
                <input type="text" className="form-input" value={pipetteLot} onChange={e => setPipetteLot(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>SPC Agar Prep Date</label>
                <input type="date" className="form-input" value={spcAgarDate} onChange={e => setSpcAgarDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Incubator ID / Room</label>
                <input type="text" className="form-input" value={incubatorNo} onChange={e => setIncubatorNo(e.target.value)} />
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Microbiological Cultivation results</h4>
              <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample Source</th>
                    <th style={{ width: '120px' }}>TCC (Absent/100ml)</th>
                    <th style={{ width: '120px' }}>E-Coli</th>
                    <th style={{ width: '100px' }}>HPC (Count 1)</th>
                    <th style={{ width: '100px' }}>HPC (Count 2)</th>
                    <th>Row Analyst</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ fontWeight: '700', padding: '6px' }}>{row.sample}</td>
                      <td style={{ padding: '4px' }}>
                        <select className="form-input" style={{ height: '30px' }} value={row.tcc} onChange={e => handleRowChange(idx, 'tcc', e.target.value)}>
                          <option value="Absent">Absent</option>
                          <option value="Present">Present</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select className="form-input" style={{ height: '30px' }} value={row.ecoli} onChange={e => handleRowChange(idx, 'ecoli', e.target.value)}>
                          <option value="Absent">Absent</option>
                          <option value="Present">Present</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input type="number" min="0" className="form-input" style={{ height: '30px', textAlign: 'center', borderColor: (Number(row.hpc1) > 100) ? 'var(--danger)' : '' }} value={row.hpc1} onChange={e => handleRowChange(idx, 'hpc1', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input type="number" min="0" className="form-input" style={{ height: '30px', textAlign: 'center', borderColor: (Number(row.hpc2) > 100) ? 'var(--danger)' : '' }} value={row.hpc2} onChange={e => handleRowChange(idx, 'hpc2', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input type="text" className="form-input" style={{ height: '30px' }} value={row.analyst} onChange={e => handleRowChange(idx, 'analyst', e.target.value)} placeholder="Initials" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              * Spec limits: Total Coliform Count (TCC) - Absent/100mL; HPC count must be &lt; 100cfu/mL. BH testing is scheduled weekly.
            </div>

            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>General Observations</label>
              <textarea className="form-input" style={{ minHeight: '50px', padding: '6px' }} value={comments} onChange={e => setComments(e.target.value)} placeholder="Observations..." />
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Water Micro Analysis</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabForm21Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sampleSize, setSampleSize] = useState('600ml PET');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [comments, setComments] = useState('');

  const [tasteRows, setTasteRows] = useState(() => [
    { sampleDate: new Date().toISOString().slice(0, 10), sampleSize: '600ml PET', h4_taste: 'Normal', h4_doneBy: '', h36_taste: 'Normal', h36_doneBy: '', h72_taste: 'Normal', h72_doneBy: '', verifiedBy: '' },
    { sampleDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), sampleSize: '600ml PET', h4_taste: 'Normal', h4_doneBy: '', h36_taste: 'Normal', h36_doneBy: '', h72_taste: 'Normal', h72_doneBy: '', verifiedBy: '' }
  ]);

  const [particleRows, setParticleRows] = useState(() => [
    { sampleDate: new Date().toISOString().slice(0, 10), sampleSize: '600ml PET', d5_particle: 'Nil', d5_doneBy: '', d10_particle: 'Nil', d10_doneBy: '', d30_particle: 'Nil', d30_doneBy: '', verifiedBy: '' },
    { sampleDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), sampleSize: '600ml PET', d5_particle: 'Nil', d5_doneBy: '', d10_particle: 'Nil', d10_doneBy: '', d30_particle: 'Nil', d30_doneBy: '', verifiedBy: '' }
  ]);

  const handleTasteRowChange = (idx, key, val) => {
    setTasteRows(prev => prev.map((row, rIdx) => rIdx === idx ? { ...row, [key]: val } : row));
  };

  const handleParticleRowChange = (idx, key, val) => {
    setParticleRows(prev => prev.map((row, rIdx) => rIdx === idx ? { ...row, [key]: val } : row));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      date,
      sampleSize,
      verifiedBy,
      tasteRows,
      particleRows,
      comments,
      analyst: tasteRows[0]?.h4_doneBy || 'QC Officer'
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '960px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 21: Taste Test & Visual Inspection Shelf Life Log</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Default Sample Size</label>
                <input type="text" className="form-input" value={sampleSize} onChange={e => setSampleSize(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Verified By Supervisor *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={verifiedBy}
                  onChange={(e) => { setVerifiedBy(e.target.value); handleSearchEmployees(e.target.value, 'labVerifiedBy'); }}
                  placeholder="Search Supervisor..."
                />
                {showEmployeeDropdown && activeSearchField === 'labVerifiedBy' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setVerifiedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name} ({emp.designation || 'Supervisor'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table 1: Taste Test */}
            <div>
              <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Part A: Taste Test Shelf-Life properties (4h, 36h, 72h)</h4>
              <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample Date</th>
                    <th>Size</th>
                    <th>4th Hour Taste</th>
                    <th>4h Done By</th>
                    <th>36th Hour Taste</th>
                    <th>36h Done By</th>
                    <th>72nd Hour Taste</th>
                    <th>72h Done By</th>
                  </tr>
                </thead>
                <tbody>
                  {tasteRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td><input type="date" className="form-input" style={{ height: '30px' }} value={row.sampleDate} onChange={e => handleTasteRowChange(idx, 'sampleDate', e.target.value)} /></td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.sampleSize} onChange={e => handleTasteRowChange(idx, 'sampleSize', e.target.value)} /></td>
                      <td>
                        <select className="form-input" style={{ height: '30px' }} value={row.h4_taste} onChange={e => handleTasteRowChange(idx, 'h4_taste', e.target.value)}>
                          <option value="Normal">Normal</option>
                          <option value="Off-taste">Off-taste</option>
                        </select>
                      </td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.h4_doneBy} onChange={e => handleTasteRowChange(idx, 'h4_doneBy', e.target.value)} placeholder="Initials" /></td>
                      <td>
                        <select className="form-input" style={{ height: '30px' }} value={row.h36_taste} onChange={e => handleTasteRowChange(idx, 'h36_taste', e.target.value)}>
                          <option value="Normal">Normal</option>
                          <option value="Off-taste">Off-taste</option>
                        </select>
                      </td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.h36_doneBy} onChange={e => handleTasteRowChange(idx, 'h36_doneBy', e.target.value)} placeholder="Initials" /></td>
                      <td>
                        <select className="form-input" style={{ height: '30px' }} value={row.h72_taste} onChange={e => handleTasteRowChange(idx, 'h72_taste', e.target.value)}>
                          <option value="Normal">Normal</option>
                          <option value="Off-taste">Off-taste</option>
                        </select>
                      </td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.h72_doneBy} onChange={e => handleTasteRowChange(idx, 'h72_doneBy', e.target.value)} placeholder="Initials" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 2: Particle Count */}
            <div>
              <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Part B: Visual Particle Shelf-Life Count (5d, 10d, 30d)</h4>
              <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample Date</th>
                    <th>Size</th>
                    <th>5th Day Particles</th>
                    <th>5d Done By</th>
                    <th>10th Day Particles</th>
                    <th>10d Done By</th>
                    <th>30th Day Particles</th>
                    <th>30d Done By</th>
                  </tr>
                </thead>
                <tbody>
                  {particleRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td><input type="date" className="form-input" style={{ height: '30px' }} value={row.sampleDate} onChange={e => handleParticleRowChange(idx, 'sampleDate', e.target.value)} /></td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.sampleSize} onChange={e => handleParticleRowChange(idx, 'sampleSize', e.target.value)} /></td>
                      <td>
                        <select className="form-input" style={{ height: '30px' }} value={row.d5_particle} onChange={e => handleParticleRowChange(idx, 'd5_particle', e.target.value)}>
                          <option value="Nil">Nil</option>
                          <option value="Present">Particles Present</option>
                        </select>
                      </td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.d5_doneBy} onChange={e => handleParticleRowChange(idx, 'd5_doneBy', e.target.value)} placeholder="Initials" /></td>
                      <td>
                        <select className="form-input" style={{ height: '30px' }} value={row.d10_particle} onChange={e => handleParticleRowChange(idx, 'd10_particle', e.target.value)}>
                          <option value="Nil">Nil</option>
                          <option value="Present">Particles Present</option>
                        </select>
                      </td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.d10_doneBy} onChange={e => handleParticleRowChange(idx, 'd10_doneBy', e.target.value)} placeholder="Initials" /></td>
                      <td>
                        <select className="form-input" style={{ height: '30px' }} value={row.d30_particle} onChange={e => handleParticleRowChange(idx, 'd30_particle', e.target.value)}>
                          <option value="Nil">Nil</option>
                          <option value="Present">Particles Present</option>
                        </select>
                      </td>
                      <td><input type="text" className="form-input" style={{ height: '30px' }} value={row.d30_doneBy} onChange={e => handleParticleRowChange(idx, 'd30_doneBy', e.target.value)} placeholder="Initials" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Comments / Corrective Action</label>
              <textarea className="form-input" style={{ minHeight: '50px', padding: '6px' }} value={comments} onChange={e => setComments(e.target.value)} placeholder="Type notes here..." />
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Taste & Visual Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabReportViewerModal({ record, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel print-report-container" style={{ width: '880px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Archived QC Laboratory Document Details ({record.id})</span>
          </div>
          <button className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ padding: '12px 16px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>QC REPORT TYPE</span>
              <strong style={{ fontSize: '14px', color: 'var(--accent)' }}>{record.type}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>LOGGED TIMESTAMP</span>
              <strong>{record.timestamp}</strong>
            </div>
          </div>

          {/* Form 1 raw Micro */}
          {record.type === 'Form 1 (Micro raw)' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><strong>Analysis Date:</strong> {record.date}</div>
                <div><strong>Analyst Name:</strong> {record.analyst}</div>
                <div><strong>Operations Manager:</strong> {record.manager}</div>
                <div><strong>Preform Lot:</strong> {record.preformLotNo}</div>
                <div><strong>Closures Lot:</strong> {record.closuresLotNo}</div>
                <div><strong>BIB Inner Bag:</strong> {record.bibInnerBag}</div>
              </div>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Microbiological Cultivation Log</h4>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '6px' }}>Sample Description</th>
                    <th style={{ padding: '6px' }}>TCC Status</th>
                    <th style={{ padding: '6px' }}>E-Coli Status</th>
                    <th style={{ padding: '6px' }}>Row Analyst</th>
                    <th style={{ padding: '6px' }}>Incubation In</th>
                    <th style={{ padding: '6px' }}>Incubation Out</th>
                  </tr>
                </thead>
                <tbody>
                  {record.sampleRows?.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px', fontWeight: '700' }}>{row.description}</td>
                      <td style={{ padding: '6px', color: row.tcc === 'Absent' ? 'var(--success)' : 'var(--danger)' }}>{row.tcc}</td>
                      <td style={{ padding: '6px', color: row.ecoli === 'Absent' ? 'var(--success)' : 'var(--danger)' }}>{row.ecoli}</td>
                      <td style={{ padding: '6px' }}>{row.analyst || '-'}</td>
                      <td style={{ padding: '6px' }}>{row.inDate} {row.inTime}</td>
                      <td style={{ padding: '6px' }}>{row.outDate} {row.outTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form 9 Chemical */}
          {record.type === 'Form 9 (Chemical)' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div><strong>Date Logged:</strong> {record.date}</div>
                <div><strong>Analyst:</strong> {record.analyst}</div>
                <div><strong>Verified By:</strong> {record.verifiedBy}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Raw Water Levels</h4>
                  <div><strong>pH level:</strong> {record.rawPh} (at {record.rawPhTime})</div>
                  <div><strong>TDS level:</strong> {record.rawTds} ppm (at {record.rawTdsTime})</div>
                  <div style={{ marginTop: '8px' }}><strong>pH After CIP:</strong> {record.cipPh} (at {record.cipTime})</div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Changeover Tests</h4>
                  <div><strong>RTD to CSD Alcohol %:</strong> {record.alcoholCheck}%</div>
                  <div><strong>RTD to Water Brix:</strong> {record.brixCheck}</div>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Product Water PET / BIB</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div><strong>pH Level:</strong> {record.prodPh} (at {record.prodPhTime})</div>
                  <div><strong>TDS Level:</strong> {record.prodTds} ppm (at {record.prodTdsTime})</div>
                  <div><strong>Taste Test:</strong> {record.tasteCheck} (at {record.tasteTime})</div>
                  <div><strong>Visual Particle:</strong> {record.particleCheck} (at {record.particleTime})</div>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Reagent & Instrument Checks</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div><strong>pH 4.0:</strong> {record.buffer4}</div>
                  <div><strong>pH 7.0:</strong> {record.buffer7}</div>
                  <div><strong>pH 10.0:</strong> {record.buffer10}</div>
                  <div><strong>Cond. 1413:</strong> {record.cond1413}</div>
                  <div><strong>Standard:</strong> {record.checkStandard}</div>
                </div>
              </div>

              {record.comments && (
                <div>
                  <strong>Comments:</strong> {record.comments}
                </div>
              )}
            </div>
          )}

          {/* Form 11 Water Micro */}
          {record.type === 'Form 11 (Micro water)' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><strong>Analysis Date:</strong> {record.date}</div>
                <div><strong>Analyst Name:</strong> {record.analyst}</div>
                <div><strong>Market Area:</strong> {record.market}</div>
                <div><strong>Product Size:</strong> {record.productSize}</div>
                <div><strong>Vessel Name:</strong> {record.vessel}</div>
                <div><strong>Compact Dry EC Batch:</strong> {record.compactDryEC}</div>
                <div><strong>Pipette Lot:</strong> {record.pipetteLot}</div>
                <div><strong>SPC Agar Date:</strong> {record.spcAgarDate}</div>
                <div><strong>Incubator ID:</strong> {record.incubatorNo}</div>
              </div>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Microbiological Cultivation Results</h4>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '6px' }}>Sample Source</th>
                    <th style={{ padding: '6px' }}>TCC</th>
                    <th style={{ padding: '6px' }}>E-Coli</th>
                    <th style={{ padding: '6px' }}>HPC (Count 1)</th>
                    <th style={{ padding: '6px' }}>HPC (Count 2)</th>
                    <th style={{ padding: '6px' }}>Row Analyst</th>
                  </tr>
                </thead>
                <tbody>
                  {record.sampleRows?.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px', fontWeight: '700' }}>{row.sample}</td>
                      <td style={{ padding: '6px' }}>{row.tcc}</td>
                      <td style={{ padding: '6px' }}>{row.ecoli}</td>
                      <td style={{ padding: '6px', color: Number(row.hpc1) > 100 ? 'var(--danger)' : '' }}>{row.hpc1} cfu</td>
                      <td style={{ padding: '6px', color: Number(row.hpc2) > 100 ? 'var(--danger)' : '' }}>{row.hpc2} cfu</td>
                      <td style={{ padding: '6px' }}>{row.analyst || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {record.comments && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Comments:</strong> {record.comments}
                </div>
              )}
            </div>
          )}

          {/* Form 21 Taste / Visual */}
          {record.type === 'Form 21 (Taste/Visual)' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div><strong>Logged Date:</strong> {record.date}</div>
                <div><strong>Default Sample Size:</strong> {record.sampleSize}</div>
                <div><strong>Verified By:</strong> {record.verifiedBy}</div>
              </div>

              <div>
                <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Part A: Taste Test Shelf Life Logs</h4>
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ padding: '6px' }}>Sample Date</th>
                      <th style={{ padding: '6px' }}>Size</th>
                      <th style={{ padding: '6px' }}>4th Hour</th>
                      <th style={{ padding: '6px' }}>4h By</th>
                      <th style={{ padding: '6px' }}>36th Hour</th>
                      <th style={{ padding: '6px' }}>36h By</th>
                      <th style={{ padding: '6px' }}>72nd Hour</th>
                      <th style={{ padding: '6px' }}>72h By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.tasteRows?.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '6px' }}>{row.sampleDate}</td>
                        <td style={{ padding: '6px' }}>{row.sampleSize}</td>
                        <td style={{ padding: '6px' }}>{row.h4_taste}</td>
                        <td style={{ padding: '6px' }}>{row.h4_doneBy}</td>
                        <td style={{ padding: '6px' }}>{row.h36_taste}</td>
                        <td style={{ padding: '6px' }}>{row.h36_doneBy}</td>
                        <td style={{ padding: '6px' }}>{row.h72_taste}</td>
                        <td style={{ padding: '6px' }}>{row.h72_doneBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Part B: Visual Particle Shelf Life Logs</h4>
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ padding: '6px' }}>Sample Date</th>
                      <th style={{ padding: '6px' }}>Size</th>
                      <th style={{ padding: '6px' }}>5th Day</th>
                      <th style={{ padding: '6px' }}>5d By</th>
                      <th style={{ padding: '6px' }}>10th Day</th>
                      <th style={{ padding: '6px' }}>10d By</th>
                      <th style={{ padding: '6px' }}>30th Day</th>
                      <th style={{ padding: '6px' }}>30d By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.particleRows?.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '6px' }}>{row.sampleDate}</td>
                        <td style={{ padding: '6px' }}>{row.sampleSize}</td>
                        <td style={{ padding: '6px' }}>{row.d5_particle}</td>
                        <td style={{ padding: '6px' }}>{row.d5_doneBy}</td>
                        <td style={{ padding: '6px' }}>{row.d10_particle}</td>
                        <td style={{ padding: '6px' }}>{row.d10_doneBy}</td>
                        <td style={{ padding: '6px' }}>{row.d30_particle}</td>
                        <td style={{ padding: '6px' }}>{row.d30_doneBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Form 36 Bourbon Whiskey & Cola */}
          {record.type === 'Form 36 (Bourbon/Cola)' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div><strong>Log Date:</strong> {record.date}</div>
                <div><strong>Tank No:</strong> {record.tankNo}</div>
                <div><strong>Volume:</strong> {record.volume}</div>
                <div><strong>Prepared By:</strong> {record.preparedBy}</div>
                <div><strong>Verified By:</strong> {record.verifiedBy}</div>
                <div><strong>Lab Alc %:</strong> {record.labAlc}% (Analysed: {record.analysedBy})</div>
                <div><strong>Tank pH:</strong> {record.tankPh}</div>
                <div><strong>Finished pH:</strong> {record.finishedPh}</div>
              </div>

              <h4 style={{ color: 'var(--accent)', marginBottom: '4px' }}>Batch Recipe Checklist</h4>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Ingredient Description</th>
                    <th>Standard Qty (2000L)</th>
                    <th>Lot / Batch No.</th>
                    <th>Added Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Bourbon</td>
                    <td>42Kg (46L)</td>
                    <td>{record.bourbonLot}</td>
                    <td>✅ Added</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Ethanol</td>
                    <td>125Kg (158.5L)</td>
                    <td>{record.ethanolLot}</td>
                    <td>✅ Added</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Aged Cola Flavour</td>
                    <td>2.0Kg</td>
                    <td>{record.agedColaLot}</td>
                    <td>✅ Added</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Cola Flavour</td>
                    <td>3.6Kg</td>
                    <td>{record.colaFlavourLot}</td>
                    <td>✅ Added</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Cola Acidulant</td>
                    <td>1.0Kg</td>
                    <td>{record.acidulantLot}</td>
                    <td>✅ Added</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Sodium Benzoate</td>
                    <td>0.4Kg</td>
                    <td>{record.benzoateLot}</td>
                    <td>✅ Added</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>Sugar</td>
                    <td>150Kg</td>
                    <td>{record.sugarLot}</td>
                    <td>✅ Added</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div><strong>Brix % Mixer:</strong> {record.brixMixer}% (Taken by: {record.brixMixerBy})</div>
                <div><strong>Brix % Product:</strong> {record.brixProduct}% (Taken by: {record.brixProductBy})</div>
                <div><strong>Gas Level:</strong> {record.gasLevel}</div>
              </div>

              {record.comments && (
                <div><strong>Comments:</strong> {record.comments}</div>
              )}
            </div>
          )}

          {/* Form 100 Production Record */}
          {record.type === 'Form 100 (Production Log)' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div><strong>Shift Date:</strong> {record.date}</div>
                <div><strong>Time Start:</strong> {record.timeStart}</div>
                <div><strong>Time Stop:</strong> {record.timeStop}</div>
                <div><strong>Market Area:</strong> {record.market}</div>
                <div><strong>Supervisor:</strong> {record.supervisor}</div>
                <div><strong>Product:</strong> {record.productDesc}</div>
                <div><strong>Size:</strong> {record.productSize}</div>
                <div><strong>Packaging:</strong> {record.packingType}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Warehouse Handover</h4>
                  <div><strong>Total Cases Handover:</strong> {record.warehouseCases}</div>
                  <div><strong>Endorsed By:</strong> {record.endorsedBy}</div>
                  <div><strong>Received By (Warehouse):</strong> {record.receivedBy}</div>
                  <div style={{ marginTop: '6px' }}><strong>Filler Counter:</strong> {record.fillerCounter}</div>
                  <div><strong>Labeller Counter:</strong> {record.labellerCounter}</div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Utility Meter Readings</h4>
                  <div><strong>LPG Level (Start / Stop):</strong> {record.lpgStart} / {record.lpgStop}</div>
                  <div><strong>EFL Level (Start / Stop):</strong> {record.eflStart} / {record.eflStop}</div>
                  <div><strong>BOC Vessel level (Start / Stop):</strong> {record.bocStart} / {record.bocStop}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Production Crew</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>In-feed: {record.crewInfeed}</div>
                    <div>Filler Operator: {record.crewFiller}</div>
                    <div>Lab Chemist: {record.crewLab}</div>
                    <div>Water System: {record.crewWater}</div>
                    <div>Blowing Operator: {record.crewBlowing}</div>
                    <div>Labeller: {record.crewLabeller}</div>
                  </div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '6px' }}>Wastage Logs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>Bottle/Cans: {record.wasteBottles}</div>
                    <div>Cap/Lid Wastage: {record.wasteCaps}</div>
                    <div>Preform waste: {record.wastePreform}</div>
                    <div>LDPE film waste: {record.wasteLdpe}</div>
                    <div>Cartons wasted: {record.wasteCartons}</div>
                    <div>Lab Samples taken: {record.wasteSamples}</div>
                  </div>
                </div>
              </div>

              {record.comments && (
                <div><strong>Downtimes / Comments:</strong> {record.comments}</div>
              )}
            </div>
          )}

          {/* Form 103 Silver Photometer Log */}
          {record.type === 'Form 103 (Silver Log)' && (() => {
            const hasFailure = record.sets?.some(s => s.rows?.some(r => Number(r.reading) < 10));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {hasFailure && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '11px', fontWeight: '700', borderRadius: '6px' }}>
                    ⚠️ Warning: One or more Silver Ion photometer readings are below acceptance spec level (minimum 10ppb).
                  </div>
                )}

                {record.sets?.map((set, sIdx) => (
                  <div key={sIdx} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                      <div><strong>Date Set {sIdx + 1}:</strong> {set.date}</div>
                      <div><strong>Technician:</strong> {set.technician}</div>
                      <div><strong>Verified By:</strong> {set.verifiedBy}</div>
                    </div>
                    <table className="custom-table" style={{ width: '100%', marginBottom: '8px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th style={{ padding: '6px' }}>Sample Point</th>
                          <th style={{ padding: '6px', textAlign: 'center' }}>Time</th>
                          <th style={{ padding: '6px', textAlign: 'center' }}>Silver Ion Reading (ppb)</th>
                          <th style={{ padding: '6px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {set.rows?.map((row, rIdx) => {
                          const isFailed = Number(row.reading) < 10;
                          return (
                            <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '6px', fontWeight: '600' }}>{row.sample}</td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>{row.time}</td>
                              <td style={{ padding: '6px', textAlign: 'center', fontWeight: '700', color: isFailed ? 'var(--danger)' : '' }}>{row.reading} ppb</td>
                              <td style={{ padding: '6px', textAlign: 'center', fontWeight: '700', color: isFailed ? 'var(--danger)' : 'var(--success)' }}>
                                {isFailed ? '⚠️ Fail (<10ppb)' : 'Pass'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div><strong>Calibration record notes:</strong> {set.calibration || '-'}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {record.overallComments && (
            <div style={{ marginTop: '16px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f9fafb', marginBottom: '16px' }}>
              <strong style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OVERALL COMMENTS / REMARKS</strong>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-heading)' }}>{record.overallComments}</div>
            </div>
          )}

        </div>
        <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={() => setEmailModal({ reportId: record.id, reportType: record.type || 'QC Report' })} style={{ backgroundColor: '#a27b5c', borderColor: '#a27b5c' }}>📧 Send Email</button>
          <button type="button" className="primary-btn" onClick={() => window.print()} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>🖨️ Print Report</button>
          <button type="button" className="secondary-btn" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  );
}

function LabForm36Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tankNo, setTankNo] = useState('Tank 1');
  const [volume, setVolume] = useState('2000L');
  const [preparedBy, setPreparedBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [labAlc, setLabAlc] = useState('5.0');
  const [analysedBy, setAnalysedBy] = useState('');
  const [tankPh, setTankPh] = useState('3.8');
  const [finishedPh, setFinishedPh] = useState('3.8');

  const [bourbonLot, setBourbonLot] = useState('');
  const [ethanolLot, setEthanolLot] = useState('');
  const [agedColaLot, setAgedColaLot] = useState('');
  const [colaFlavourLot, setColaFlavourLot] = useState('');
  const [acidulantLot, setAcidulantLot] = useState('');
  const [benzoateLot, setBenzoateLot] = useState('');
  const [sugarLot, setSugarLot] = useState('');

  const [brixMixer, setBrixMixer] = useState('11.2');
  const [brixMixerBy, setBrixMixerBy] = useState('');
  const [brixProduct, setBrixProduct] = useState('11.4');
  const [brixProductBy, setBrixProductBy] = useState('');
  const [gasLevel, setGasLevel] = useState('2.8');
  const [comments, setComments] = useState('');

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      date, tankNo, volume, preparedBy, verifiedBy, labAlc, analysedBy, tankPh, finishedPh,
      bourbonLot, ethanolLot, agedColaLot, colaFlavourLot, acidulantLot, benzoateLot, sugarLot,
      brixMixer, brixMixerBy, brixProduct, brixProductBy, gasLevel, comments,
      analyst: preparedBy
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 36: Bourbon Whiskey & Cola Product Tank Record</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Date of Batch</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Tank Number</label>
                <input type="text" className="form-input" value={tankNo} onChange={e => setTankNo(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Volume</label>
                <input type="text" className="form-input" value={volume} onChange={e => setVolume(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Prepared By *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={preparedBy}
                  onChange={(e) => { setPreparedBy(e.target.value); handleSearchEmployees(e.target.value, 'labPreparedBy'); }}
                  placeholder="Search Employee..."
                />
                {showEmployeeDropdown && activeSearchField === 'labPreparedBy' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setPreparedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Verified By *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={verifiedBy}
                  onChange={(e) => { setVerifiedBy(e.target.value); handleSearchEmployees(e.target.value, 'labVerifiedBy'); }}
                  placeholder="Search Verifier..."
                />
                {showEmployeeDropdown && activeSearchField === 'labVerifiedBy' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setVerifiedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Lab Report Analysed By *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={analysedBy}
                  onChange={(e) => { setAnalysedBy(e.target.value); handleSearchEmployees(e.target.value, 'labAnalyst'); }}
                  placeholder="Search Analyst..."
                />
                {showEmployeeDropdown && activeSearchField === 'labAnalyst' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setAnalysedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Lab Report Alcohol %</label>
                <input type="number" step="0.01" className="form-input" value={labAlc} onChange={e => setLabAlc(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Tank pH</label>
                <input type="number" step="0.1" className="form-input" value={tankPh} onChange={e => setTankPh(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Finished Product pH</label>
                <input type="number" step="0.1" className="form-input" value={finishedPh} onChange={e => setFinishedPh(e.target.value)} />
              </div>
            </div>

            <div>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Batch Recipe Checklist</h4>
              <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Ingredient Description</th>
                    <th>Standard Qty (2000L)</th>
                    <th>Lot / Batch No. *</th>
                    <th>Added Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Bourbon</td>
                    <td>42Kg (46L)</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={bourbonLot} onChange={e => setBourbonLot(e.target.value)} placeholder="Bourbon batch lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                  <tr>
                    <td>Ethanol</td>
                    <td>125Kg (158.5L)</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={ethanolLot} onChange={e => setEthanolLot(e.target.value)} placeholder="Ethanol batch lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                  <tr>
                    <td>Aged Cola Flavour</td>
                    <td>2.0Kg</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={agedColaLot} onChange={e => setAgedColaLot(e.target.value)} placeholder="Aged Cola batch lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                  <tr>
                    <td>Cola Flavour</td>
                    <td>3.6Kg</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={colaFlavourLot} onChange={e => setColaFlavourLot(e.target.value)} placeholder="Cola Flavour lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                  <tr>
                    <td>Cola Acidulant</td>
                    <td>1.0Kg</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={acidulantLot} onChange={e => setAcidulantLot(e.target.value)} placeholder="Acidulant lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                  <tr>
                    <td>Sodium Benzoate</td>
                    <td>0.4Kg</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={benzoateLot} onChange={e => setBenzoateLot(e.target.value)} placeholder="Benzoate lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                  <tr>
                    <td>Sugar</td>
                    <td>150Kg</td>
                    <td><input type="text" className="form-input" style={{ height: '28px' }} required value={sugarLot} onChange={e => setSugarLot(e.target.value)} placeholder="Sugar lot" /></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Confirmed Added</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px' }}>Brix Mixer %</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="number" step="0.1" className="form-input" value={brixMixer} onChange={e => setBrixMixer(e.target.value)} />
                  <input type="text" className="form-input" placeholder="By" value={brixMixerBy} onChange={e => setBrixMixerBy(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px' }}>Brix Finished Product %</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="number" step="0.1" className="form-input" value={brixProduct} onChange={e => setBrixProduct(e.target.value)} />
                  <input type="text" className="form-input" placeholder="By" value={brixProductBy} onChange={e => setBrixProductBy(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px' }}>Gas Level</label>
                <input type="number" step="0.1" className="form-input" value={gasLevel} onChange={e => setGasLevel(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px' }}>Comments</label>
              <textarea className="form-input" style={{ minHeight: '50px', padding: '6px' }} value={comments} onChange={e => setComments(e.target.value)} placeholder="Remarks..." />
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Batch Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabForm100Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeStart, setTimeStart] = useState('08:00');
  const [timeStop, setTimeStop] = useState('16:30');
  const [market, setMarket] = useState('Local');
  const [supervisor, setSupervisor] = useState('');
  const [productDesc, setProductDesc] = useState('Island Chill Water');
  const [productSize, setProductSize] = useState('600ml PET');
  const [packingType, setPackingType] = useState('Cartons');

  const [warehouseCases, setWarehouseCases] = useState('1450');
  const [endorsedBy, setEndorsedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [fillerCounter, setFillerCounter] = useState('34890');
  const [labellerCounter, setLabellerCounter] = useState('34882');

  const [lpgStart, setLpgStart] = useState('45%');
  const [lpgStop, setLpgStop] = useState('40%');
  const [eflStart, setEflStart] = useState('10200');
  const [eflStop, setEflStop] = useState('10950');
  const [bocStart, setBocStart] = useState('80%');
  const [bocStop, setBocStop] = useState('75%');

  const [crewInfeed, setCrewInfeed] = useState('');
  const [crewFiller, setCrewFiller] = useState('');
  const [crewLab, setCrewLab] = useState('');
  const [crewWater, setCrewWater] = useState('');
  const [crewBlowing, setCrewBlowing] = useState('');
  const [crewLabeller, setCrewLabeller] = useState('');

  const [wasteBottles, setWasteBottles] = useState('12');
  const [wasteCaps, setWasteCaps] = useState('15');
  const [wastePreform, setWastePreform] = useState('8');
  const [wasteLdpe, setWasteLdpe] = useState('2kg');
  const [wasteCartons, setWasteCartons] = useState('3');
  const [wasteSamples, setWasteSamples] = useState('10');
  const [comments, setComments] = useState('');

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      date, timeStart, timeStop, market, supervisor, productDesc, productSize, packingType,
      warehouseCases, endorsedBy, receivedBy, fillerCounter, labellerCounter,
      lpgStart, lpgStop, eflStart, eflStop, bocStart, bocStop,
      crewInfeed, crewFiller, crewLab, crewWater, crewBlowing, crewLabeller,
      wasteBottles, wasteCaps, wastePreform, wasteLdpe, wasteCartons, wasteSamples,
      comments,
      analyst: supervisor
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 100: Daily Production & Handover Record</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Shift Date</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Time Start</label>
                <input type="time" className="form-input" value={timeStart} onChange={e => setTimeStart(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Time Stop</label>
                <input type="time" className="form-input" value={timeStop} onChange={e => setTimeStop(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Production Supervisor *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={supervisor}
                  onChange={(e) => { setSupervisor(e.target.value); handleSearchEmployees(e.target.value, 'labProdSupervisor'); }}
                  placeholder="Search Supervisor..."
                />
                {showEmployeeDropdown && activeSearchField === 'labProdSupervisor' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setSupervisor(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Product Description</label>
                <input type="text" className="form-input" value={productDesc} onChange={e => setProductDesc(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Size</label>
                <input type="text" className="form-input" value={productSize} onChange={e => setProductSize(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Market</label>
                <input type="text" className="form-input" value={market} onChange={e => setMarket(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Packing Type</label>
                <input type="text" className="form-input" value={packingType} onChange={e => setPackingType(e.target.value)} placeholder="Cartons / LDPE Wrap" />
              </div>
            </div>

            {/* Warehouse Handover */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>1. Warehouse Handover Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px' }}>Cases Handed Over</label>
                  <input type="text" className="form-input" value={warehouseCases} onChange={e => setWarehouseCases(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '10px' }}>Endorsed By *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={endorsedBy}
                    onChange={(e) => { setEndorsedBy(e.target.value); handleSearchEmployees(e.target.value, 'labEndorsedBy'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'labEndorsedBy' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setEndorsedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '10px' }}>Received By Warehouse *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={receivedBy}
                    onChange={(e) => { setReceivedBy(e.target.value); handleSearchEmployees(e.target.value, 'labReceivedBy'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'labReceivedBy' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setReceivedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Filler Counter</label>
                  <input type="number" className="form-input" value={fillerCounter} onChange={e => setFillerCounter(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Labeller Counter</label>
                  <input type="number" className="form-input" value={labellerCounter} onChange={e => setLabellerCounter(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Meter readings & Crew */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>2. Utilities Meter readings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px' }}>LPG (Start / Stop)</label>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <input type="text" className="form-input" style={{ height: '30px' }} value={lpgStart} onChange={e => setLpgStart(e.target.value)} />
                      <input type="text" className="form-input" style={{ height: '30px' }} value={lpgStop} onChange={e => setLpgStop(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>EFL (Start / Stop)</label>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <input type="text" className="form-input" style={{ height: '30px' }} value={eflStart} onChange={e => setEflStart(e.target.value)} />
                      <input type="text" className="form-input" style={{ height: '30px' }} value={eflStop} onChange={e => setEflStop(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>BOC Vessel (Start / Stop)</label>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <input type="text" className="form-input" style={{ height: '30px' }} value={bocStart} onChange={e => setBocStart(e.target.value)} />
                      <input type="text" className="form-input" style={{ height: '30px' }} value={bocStop} onChange={e => setBocStop(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>3. Production Crew List</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px' }}>Infeed / Palletizer</label>
                    <input type="text" className="form-input" style={{ height: '30px' }} value={crewInfeed} onChange={e => setCrewInfeed(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Filler Operator</label>
                    <input type="text" className="form-input" style={{ height: '30px' }} value={crewFiller} onChange={e => setCrewFiller(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Lab Chemist</label>
                    <input type="text" className="form-input" style={{ height: '30px' }} value={crewLab} onChange={e => setCrewLab(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Water System</label>
                    <input type="text" className="form-input" style={{ height: '30px' }} value={crewWater} onChange={e => setCrewWater(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Blowing Operator</label>
                    <input type="text" className="form-input" style={{ height: '30px' }} value={crewBlowing} onChange={e => setCrewBlowing(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Labeller Operator</label>
                    <input type="text" className="form-input" style={{ height: '30px' }} value={crewLabeller} onChange={e => setCrewLabeller(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Wastage Logs */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '8px' }}>4. Caps & Material Wastage count</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px' }}>Bottle / Cans</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={wasteBottles} onChange={e => setWasteBottles(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Cap / Lid waste</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={wasteCaps} onChange={e => setWasteCaps(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Preform waste</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={wastePreform} onChange={e => setWastePreform(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>LDPE Wrap waste</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={wasteLdpe} onChange={e => setWasteLdpe(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Cartons wasted</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={wasteCartons} onChange={e => setWasteCartons(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '10px' }}>Lab Samples</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={wasteSamples} onChange={e => setWasteSamples(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Downtimes & Comments</label>
              <textarea className="form-input" style={{ minHeight: '60px', padding: '6px' }} value={comments} onChange={e => setComments(e.target.value)} placeholder="Log dountime reasons and duration..." />
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Production Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabForm103Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [date1, setDate1] = useState(new Date().toISOString().slice(0, 10));
  const [tech1, setTech1] = useState('');
  const [verifier1, setVerifier1] = useState('');
  const [calibration1, setCalibration1] = useState('Photometer zero calibrated using blank sample.');
  const [rows1, setRows1] = useState([
    { sample: 'Filtration Output', time: '08:00', reading: '12' },
    { sample: 'Clean Room Buffer Tank', time: '08:00', reading: '11' }
  ]);

  const [date2, setDate2] = useState(new Date().toISOString().slice(0, 10));
  const [tech2, setTech2] = useState('');
  const [verifier2, setVerifier2] = useState('');
  const [calibration2, setCalibration2] = useState('Photometer zero calibrated.');
  const [rows2, setRows2] = useState([
    { sample: 'Filtration Output', time: '12:00', reading: '14' },
    { sample: 'Clean Room Buffer Tank', time: '12:00', reading: '13' }
  ]);

  const [date3, setDate3] = useState(new Date().toISOString().slice(0, 10));
  const [tech3, setTech3] = useState('');
  const [verifier3, setVerifier3] = useState('');
  const [calibration3, setCalibration3] = useState('Photometer calibrated.');
  const [rows3, setRows3] = useState([
    { sample: 'Filtration Output', time: '16:00', reading: '13' },
    { sample: 'Clean Room Buffer Tank', time: '16:00', reading: '12' }
  ]);

  const handleRowChange = (setNum, rowIdx, key, val) => {
    if (setNum === 1) {
      setRows1(prev => prev.map((r, idx) => idx === rowIdx ? { ...r, [key]: val } : r));
    } else if (setNum === 2) {
      setRows2(prev => prev.map((r, idx) => idx === rowIdx ? { ...r, [key]: val } : r));
    } else {
      setRows3(prev => prev.map((r, idx) => idx === rowIdx ? { ...r, [key]: val } : r));
    }
  };

  const checkSpecFailure = () => {
    const allRows = [...rows1, ...rows2, ...rows3];
    return allRows.some(r => Number(r.reading) < 10);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit({
      sets: [
        { date: date1, technician: tech1, verifiedBy: verifier1, calibration: calibration1, rows: rows1 },
        { date: date2, technician: tech2, verifiedBy: verifier2, calibration: calibration2, rows: rows2 },
        { date: date3, technician: tech3, verifiedBy: verifier3, calibration: calibration3, rows: rows3 }
      ],
      analyst: tech1 || 'QC Tech',
      verifiedBy: verifier1 || 'Manager',
      date: date1
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '950px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 103: Silver Photometer Log & Calibration Sheet</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmitForm}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '12px' }}>

            <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderLeft: '4px solid var(--accent)', color: 'var(--text-heading)' }}>
              <strong>Acceptance specification bounds:</strong> Reading of Silver Ion should be **above 10ppb**.
            </div>

            {checkSpecFailure() && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: '700', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                ⚠️ Warning: One or more readings are below the minimum required 10ppb silver concentration!
              </div>
            )}

            {/* Set 1 */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Set 1 readings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <label>Date</label>
                  <input type="date" className="form-input" style={{ height: '30px' }} value={date1} onChange={e => setDate1(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <label>Technician *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ height: '30px' }}
                    required
                    value={tech1}
                    onChange={(e) => { setTech1(e.target.value); handleSearchEmployees(e.target.value, 'labTechnician'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'labTechnician' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setTech1(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label>Verified By *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ height: '30px' }}
                    required
                    value={verifier1}
                    onChange={(e) => { setVerifier1(e.target.value); handleSearchEmployees(e.target.value, 'labVerifiedBy'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'labVerifiedBy' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setVerifier1(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <table className="custom-table" style={{ width: '100%', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample point</th>
                    <th>Time</th>
                    <th>Photometer Reading (ppb)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows1.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td><strong>{row.sample}</strong></td>
                      <td><input type="time" className="form-input" style={{ height: '28px' }} value={row.time} onChange={e => handleRowChange(1, rIdx, 'time', e.target.value)} /></td>
                      <td><input type="number" className="form-input" style={{ height: '28px', borderColor: Number(row.reading) < 10 ? 'var(--danger)' : '' }} value={row.reading} onChange={e => handleRowChange(1, rIdx, 'reading', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <label>Calibration Log Record notes</label>
                <input type="text" className="form-input" style={{ height: '30px' }} value={calibration1} onChange={e => setCalibration1(e.target.value)} />
              </div>
            </div>

            {/* Set 2 */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Set 2 readings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <label>Date</label>
                  <input type="date" className="form-input" style={{ height: '30px' }} value={date2} onChange={e => setDate2(e.target.value)} />
                </div>
                <div>
                  <label>Technician</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={tech2} onChange={e => setTech2(e.target.value)} placeholder="Technician Initials" />
                </div>
                <div>
                  <label>Verified By</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={verifier2} onChange={e => setVerifier2(e.target.value)} placeholder="Verifier Initials" />
                </div>
              </div>
              <table className="custom-table" style={{ width: '100%', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample point</th>
                    <th>Time</th>
                    <th>Photometer Reading (ppb)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows2.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td><strong>{row.sample}</strong></td>
                      <td><input type="time" className="form-input" style={{ height: '28px' }} value={row.time} onChange={e => handleRowChange(2, rIdx, 'time', e.target.value)} /></td>
                      <td><input type="number" className="form-input" style={{ height: '28px', borderColor: Number(row.reading) < 10 ? 'var(--danger)' : '' }} value={row.reading} onChange={e => handleRowChange(2, rIdx, 'reading', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <label>Calibration Log Record notes</label>
                <input type="text" className="form-input" style={{ height: '30px' }} value={calibration2} onChange={e => setCalibration2(e.target.value)} />
              </div>
            </div>

            {/* Set 3 */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Set 3 readings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <label>Date</label>
                  <input type="date" className="form-input" style={{ height: '30px' }} value={date3} onChange={e => setDate3(e.target.value)} />
                </div>
                <div>
                  <label>Technician</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={tech3} onChange={e => setTech3(e.target.value)} placeholder="Technician Initials" />
                </div>
                <div>
                  <label>Verified By</label>
                  <input type="text" className="form-input" style={{ height: '30px' }} value={verifier3} onChange={e => setVerifier3(e.target.value)} placeholder="Verifier Initials" />
                </div>
              </div>
              <table className="custom-table" style={{ width: '100%', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th>Sample point</th>
                    <th>Time</th>
                    <th>Photometer Reading (ppb)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows3.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td><strong>{row.sample}</strong></td>
                      <td><input type="time" className="form-input" style={{ height: '28px' }} value={row.time} onChange={e => handleRowChange(3, rIdx, 'time', e.target.value)} /></td>
                      <td><input type="number" className="form-input" style={{ height: '28px', borderColor: Number(row.reading) < 10 ? 'var(--danger)' : '' }} value={row.reading} onChange={e => handleRowChange(3, rIdx, 'reading', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <label>Calibration Log Record notes</label>
                <input type="text" className="form-input" style={{ height: '30px' }} value={calibration3} onChange={e => setCalibration3(e.target.value)} />
              </div>
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Photometer Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SafetyForm37Modal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [name, setName] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('Audit');
  const [visitingAreas, setVisitingAreas] = useState('');
  const [comments, setComments] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [signature, setSignature] = useState(false);
  const [inductorName, setInductorName] = useState('');
  const [inductorSignature, setInductorSignature] = useState(false);
  const [inductorDate, setInductorDate] = useState(new Date().toISOString().slice(0, 10));
  const [approvedByName, setApprovedByName] = useState('');
  const [approvedBySign, setApprovedBySign] = useState(false);

  const [checklist, setChecklist] = useState({
    companyPolicy: 'YES',
    dressCode: 'YES',
    noMobile: 'YES',
    earPlugs: 'YES',
    toilets: 'YES',
    smoking: 'YES',
    authorizedAreas: 'YES',
    hazardReporting: 'YES',
    accidentReporting: 'YES',
    evacuationProcedure: 'YES',
    nearestExit: 'YES',
    fireEquipment: 'YES',
    firstAidKit: 'YES',
    healthIssues: 'YES',
    msdsLocation: 'YES'
  });

  const areas = [
    { key: 'companyPolicy', label: 'Company Policy (ISO 9001:2015, HACCP, Harassment, Health & Safety)' },
    { key: 'dressCode', label: 'Dress Code (jewelry policy, sanitizing hands, hair nets/face masks, safety shoes)' },
    { key: 'noMobile', label: 'No use of Mobile Phones in Production area' },
    { key: 'earPlugs', label: 'Use of ear plugs or ear muffs in blowing section' },
    { key: 'toilets', label: 'Toilets/ Change Rooms' },
    { key: 'smoking', label: 'Smoking/Non Smoking Areas' },
    { key: 'authorizedAreas', label: 'Authorized/Unauthorized Areas' },
    { key: 'hazardReporting', label: 'Hazard Reporting Procedures (Damaged Bait Stations, incomplete structures, etc.)' },
    { key: 'accidentReporting', label: 'Accident/Incident Reporting Procedures' },
    { key: 'evacuationProcedure', label: 'Evacuation Procedure' },
    { key: 'nearestExit', label: 'Nearest Exit in the Case of Emergency' },
    { key: 'fireEquipment', label: 'Location of Nearest Fire Fighting Equipment' },
    { key: 'firstAidKit', label: 'Location of First Aid Kit/Certified first aiders' },
    { key: 'healthIssues', label: 'Any health issues or food poisoning has occurred at least 2 weeks prior to factory visit' },
    { key: 'msdsLocation', label: 'Location of MSDS' }
  ];

  const handleChecklistChange = (key, val) => {
    setChecklist(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name, reasonForVisit, visitingAreas, comments, date, signature: signature ? 'Checked' : 'Unsigned',
      inductorName, inductorSignature: inductorSignature ? 'Checked' : 'Unsigned', inductorDate,
      approvedByName, approvedBySign: approvedBySign ? 'Checked' : 'Unsigned',
      checklist
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '850px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Island Chill - Carpenters Waters (Fiji) Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 37: OHS Induction Procedure Checklist</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <label>Name of Visitor/Employee/Contractor *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={name}
                  onChange={(e) => { setName(e.target.value); handleSearchEmployees(e.target.value, 'inductionInductee'); }}
                />
                {showEmployeeDropdown && activeSearchField === 'inductionInductee' && (
                  <div className="autocomplete-dropdown">
                    {employeeList.map(emp => (
                      <div key={emp.name} className="dropdown-item" onClick={() => { setName(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                        👤 {emp.employee_name || emp.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label>Reason for Visit (audit, tour, others)</label>
                <input type="text" className="form-input" value={reasonForVisit} onChange={e => setReasonForVisit(e.target.value)} />
              </div>
              <div>
                <label>Visiting Areas</label>
                <input type="text" className="form-input" value={visitingAreas} onChange={e => setVisitingAreas(e.target.value)} />
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="custom-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Induction Areas Checklist</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>YES</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>NO</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map(item => (
                    <tr key={item.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px' }}>{item.label}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={item.key}
                          checked={checklist[item.key] === 'YES'}
                          onChange={() => handleChecklistChange(item.key, 'YES')}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={item.key}
                          checked={checklist[item.key] === 'NO'}
                          onChange={() => handleChecklistChange(item.key, 'NO')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label>Comments / Remarks</label>
              <textarea className="form-input" style={{ minHeight: '60px', padding: '6px' }} value={comments} onChange={e => setComments(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                <h4 style={{ fontWeight: '700', fontSize: '11px', marginBottom: '8px', color: 'var(--accent)' }}>Inductee Certification</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <input type="checkbox" id="inductee-sig" checked={signature} onChange={e => setSignature(e.target.checked)} />
                  <label htmlFor="inductee-sig">I certify that I have undergone induction in the above areas.</label>
                </div>
                <div>
                  <label>Date</label>
                  <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                <h4 style={{ fontWeight: '700', fontSize: '11px', marginBottom: '8px', color: 'var(--accent)' }}>Inductor Details</h4>
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <label>Inductor's Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={inductorName}
                    onChange={(e) => { setInductorName(e.target.value); handleSearchEmployees(e.target.value, 'inductionInductor'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'inductionInductor' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setInductorName(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <input type="checkbox" id="inductor-sig" checked={inductorSignature} onChange={e => setInductorSignature(e.target.checked)} />
                  <label htmlFor="inductor-sig">Signed as Inductor</label>
                </div>
                <div>
                  <label>Induction Date</label>
                  <input type="date" className="form-input" value={inductorDate} onChange={e => setInductorDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
              <h4 style={{ fontWeight: '700', fontSize: '11px', marginBottom: '8px', color: 'var(--accent)' }}>Management Approval</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <label>Approved By Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={approvedByName}
                    onChange={(e) => { setApprovedByName(e.target.value); handleSearchEmployees(e.target.value, 'inductionApprovedBy'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'inductionApprovedBy' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setApprovedByName(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '18px' }}>
                  <input type="checkbox" id="approved-sig" checked={approvedBySign} onChange={e => setApprovedBySign(e.target.checked)} />
                  <label htmlFor="approved-sig">Approved Signature</label>
                </div>
              </div>
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Induction</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaintWeightCheckModal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [rows, setRows] = useState(Array.from({ length: 8 }, () => ({
    date: new Date().toISOString().slice(0, 10),
    checkedBy: '',
    verifiedBy: '',
    productDesc: 'Island Chill Artesian Water',
    weight1: '602',
    weight2: '601'
  })));

  const [overallComments, setOverallComments] = useState('');

  const handleRowChange = (idx, key, val) => {
    setRows(prev => prev.map((r, rIdx) => rIdx === idx ? { ...r, [key]: val } : r));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      rows,
      checkedBy: rows[0].checkedBy || 'Chemist',
      verifiedBy: rows[0].verifiedBy || 'QC SV',
      overallComments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '900px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Island Chill / Crush / US Cola</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Form 88: For Weight Check Checklist</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
            <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderLeft: '4px solid var(--accent)', color: 'var(--text-heading)' }}>
              <strong>Weight Check frequency:</strong> Weight Check frequency is twice per Day.
            </div>

            <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ width: '50px' }}>Slot</th>
                  <th style={{ width: '110px' }}>Date</th>
                  <th style={{ width: '160px' }}>Checked By *</th>
                  <th style={{ width: '160px' }}>Verified By *</th>
                  <th>Product Description</th>
                  <th style={{ width: '80px' }}>Weight 1</th>
                  <th style={{ width: '80px' }}>Weight 2</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}><strong>#{idx + 1}</strong></td>
                    <td>
                      <input type="date" className="form-input" style={{ height: '28px' }} required value={row.date} onChange={e => handleRowChange(idx, 'date', e.target.value)} />
                    </td>
                    <td style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: '28px' }}
                        required
                        placeholder="Search Checked By..."
                        value={row.checkedBy}
                        onChange={(e) => { handleRowChange(idx, 'checkedBy', e.target.value); handleSearchEmployees(e.target.value, `weightCheckedBy-${idx}`); }}
                      />
                      {showEmployeeDropdown && activeSearchField === `weightCheckedBy-${idx}` && (
                        <div className="autocomplete-dropdown">
                          {employeeList.map(emp => (
                            <div key={emp.name} className="dropdown-item" onClick={() => { handleRowChange(idx, 'checkedBy', `${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                              👤 {emp.employee_name || emp.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: '28px' }}
                        required
                        placeholder="Search Verified By..."
                        value={row.verifiedBy}
                        onChange={(e) => { handleRowChange(idx, 'verifiedBy', e.target.value); handleSearchEmployees(e.target.value, `weightVerifiedBy-${idx}`); }}
                      />
                      {showEmployeeDropdown && activeSearchField === `weightVerifiedBy-${idx}` && (
                        <div className="autocomplete-dropdown">
                          {employeeList.map(emp => (
                            <div key={emp.name} className="dropdown-item" onClick={() => { handleRowChange(idx, 'verifiedBy', `${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                              👤 {emp.employee_name || emp.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input type="text" className="form-input" style={{ height: '28px' }} value={row.productDesc} onChange={e => handleRowChange(idx, 'productDesc', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-input" style={{ height: '28px' }} value={row.weight1} onChange={e => handleRowChange(idx, 'weight1', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-input" style={{ height: '28px' }} value={row.weight2} onChange={e => handleRowChange(idx, 'weight2', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
              <textarea
                className="form-input"
                style={{ minHeight: '50px', padding: '6px' }}
                value={overallComments}
                onChange={e => setOverallComments(e.target.value)}
                placeholder="Enter any additional observations, non-conformance notes, or adjustments made..."
              />
            </div>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Weight Checks</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaintBreakdownModal({ onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField }) {
  const [requestorName, setRequestorName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [breakdownDate, setBreakdownDate] = useState(new Date().toISOString().slice(0, 10));
  const [breakdownTime, setBreakdownTime] = useState('10:00');
  const [breakdownDesc, setBreakdownDesc] = useState('');
  const [checkedBySV, setCheckedBySV] = useState('');
  const [approvedByFM, setApprovedByFM] = useState('');

  const [receivedBy, setReceivedBy] = useState('');
  const [workAssessment, setWorkAssessment] = useState('Maintenance');
  const [workCarriedOut, setWorkCarriedOut] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [dateRepaired, setDateRepaired] = useState(new Date().toISOString().slice(0, 10));
  const [timeRepaired, setTimeRepaired] = useState('12:30');
  const [repairedDoneBy, setRepairedDoneBy] = useState('');
  const [approvedByMM, setApprovedByMM] = useState('');

  const [checkedByProdSV, setCheckedByProdSV] = useState('');
  const [approvedByProdFM, setApprovedByProdFM] = useState('');
  const [overallComments, setOverallComments] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      requestorName, machineName, breakdownDate, breakdownTime, breakdownDesc, checkedBySV, approvedByFM,
      receivedBy, workAssessment, workCarriedOut, partsUsed, dateRepaired, timeRepaired, repairedDoneBy, approvedByMM,
      checkedByProdSV, approvedByProdFM, overallComments
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Island Chill - Carpenters Waters (Fiji) PTE Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Machine Breakdown Record Form (SOP-Island 002)</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content" style={{ maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>

            {/* Section 1 */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px', fontWeight: '700' }}>Section 1: To be filled-up by the Requestor</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <label>Requestor Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={requestorName}
                    onChange={(e) => { setRequestorName(e.target.value); handleSearchEmployees(e.target.value, 'breakdownRequestor'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownRequestor' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setRequestorName(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label>Machine Name & No. *</label>
                  <input type="text" className="form-input" required value={machineName} onChange={e => setMachineName(e.target.value)} placeholder="e.g. Coder - Domino #2" />
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Breakdown Date</label>
                    <input type="date" className="form-input" value={breakdownDate} onChange={e => setBreakdownDate(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Time</label>
                    <input type="time" className="form-input" value={breakdownTime} onChange={e => setBreakdownTime(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label>Breakdown Description *</label>
                <textarea className="form-input" required style={{ minHeight: '50px', padding: '6px' }} value={breakdownDesc} onChange={e => setBreakdownDesc(e.target.value)} placeholder="Describe the failure symptoms..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <label>Checked By (SV Name & Sign) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={checkedBySV}
                    onChange={(e) => { setCheckedBySV(e.target.value); handleSearchEmployees(e.target.value, 'breakdownCheckedSV'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownCheckedSV' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setCheckedBySV(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label>Approved By (FM Name & Sign) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={approvedByFM}
                    onChange={(e) => { setApprovedByFM(e.target.value); handleSearchEmployees(e.target.value, 'breakdownApprovedFM'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownApprovedFM' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setApprovedByFM(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px', fontWeight: '700' }}>Section 2: To be filled-up by Maintenance</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <label>Received By *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={receivedBy}
                    onChange={(e) => { setReceivedBy(e.target.value); handleSearchEmployees(e.target.value, 'breakdownReceivedBy'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownReceivedBy' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setReceivedBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label>Work In-charge Assessment</label>
                  <select className="form-input" value={workAssessment} onChange={e => setWorkAssessment(e.target.value)}>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Date Repaired</label>
                    <input type="date" className="form-input" value={dateRepaired} onChange={e => setDateRepaired(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Time Repaired</label>
                    <input type="time" className="form-input" value={timeRepaired} onChange={e => setTimeRepaired(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <label>Description of Work Carried Out *</label>
                  <textarea className="form-input" required style={{ minHeight: '50px', padding: '6px' }} value={workCarriedOut} onChange={e => setWorkCarriedOut(e.target.value)} />
                </div>
                <div>
                  <label>Parts Used</label>
                  <textarea className="form-input" style={{ minHeight: '50px', padding: '6px' }} value={partsUsed} onChange={e => setPartsUsed(e.target.value)} placeholder="List spare parts replaced..." />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <label>Repaired Done By (Name & Sign) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={repairedDoneBy}
                    onChange={(e) => { setRepairedDoneBy(e.target.value); handleSearchEmployees(e.target.value, 'breakdownRepairedBy'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownRepairedBy' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setRepairedDoneBy(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label>Approved By (MM Name & Sign) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={approvedByMM}
                    onChange={(e) => { setApprovedByMM(e.target.value); handleSearchEmployees(e.target.value, 'breakdownApprovedMM'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownApprovedMM' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setApprovedByMM(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
              <textarea
                className="form-input"
                style={{ minHeight: '50px', padding: '6px' }}
                value={overallComments}
                onChange={e => setOverallComments(e.target.value)}
                placeholder="Enter any additional breakdown repair comments, root cause details, or notes..."
              />
            </div>

            {/* Section 3 */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px', fontWeight: '700' }}>Section 3: To be filled-up by Production</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <label>Checked By (Production SV Name & Sign) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={checkedByProdSV}
                    onChange={(e) => { setCheckedByProdSV(e.target.value); handleSearchEmployees(e.target.value, 'breakdownCheckedProdSV'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownCheckedProdSV' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setCheckedByProdSV(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label>Approved By (FM Name & Sign) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={approvedByProdFM}
                    onChange={(e) => { setApprovedByProdFM(e.target.value); handleSearchEmployees(e.target.value, 'breakdownApprovedProdFM'); }}
                  />
                  {showEmployeeDropdown && activeSearchField === 'breakdownApprovedProdFM' && (
                    <div className="autocomplete-dropdown">
                      {employeeList.map(emp => (
                        <div key={emp.name} className="dropdown-item" onClick={() => { setApprovedByProdFM(`${emp.employee_name || emp.name} (${emp.name})`); setShowEmployeeDropdown(false); }}>
                          👤 {emp.employee_name || emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Breakdown</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const convertNumberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];

  let str = '';
  const parts = Number(num).toFixed(2).split('.');
  const dollars = parseInt(parts[0], 10);
  const cents = parseInt(parts[1], 10);

  if (dollars === 0) {
    str = 'Zero Dollars';
  } else {
    const convertChunk = (n) => {
      let chunkStr = '';
      if (n >= 100) {
        chunkStr += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        chunkStr += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        chunkStr += ones[n] + ' ';
      }
      return chunkStr.trim();
    };

    let tempDollars = dollars;
    let scaleIdx = 0;
    let dollarWords = '';

    while (tempDollars > 0) {
      const chunk = tempDollars % 1000;
      if (chunk > 0) {
        const chunkWords = convertChunk(chunk);
        dollarWords = chunkWords + ' ' + (scales[scaleIdx] ? scales[scaleIdx] + ' ' : '') + dollarWords;
      }
      tempDollars = Math.floor(tempDollars / 1000);
      scaleIdx++;
    }
    str = dollarWords.trim() + ' Dollars';
  }

  if (cents > 0) {
    let centWords = '';
    if (cents < 20) {
      centWords = ones[cents];
    } else {
      centWords = tens[Math.floor(cents / 10)] + (cents % 10 > 0 ? '-' + ones[cents % 10] : '');
    }
    str += ' and ' + centWords + ' Cents';
  } else {
    str += ' and Zero Cents';
  }

  return str + ' Only';
};

function SalesInvoiceFormModal({ onClose, onSubmit, products, initialData = null, loading = false }) {
  const [customer, setCustomer] = useState(initialData?.customer || '');
  const [postingDate, setPostingDate] = useState(initialData?.posting_date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initialData?.due_date || new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState(initialData?.items || [{ item_code: products[0]?.code || '', qty: 10, rate: 10.00 }]);

  // Customer Autocomplete States
  const [customerSearch, setCustomerSearch] = useState(initialData?.customer || '');
  const [customerList, setCustomerList] = useState([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Item Autocomplete States
  const [itemSearchText, setItemSearchText] = useState({}); // { [idx]: string }
  const [itemSuggestions, setItemSuggestions] = useState({}); // { [idx]: Array }
  const [activeItemRow, setActiveItemRow] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const res = await frappe.getCustomers(customerSearch);
      setCustomerList(res || []);
    };
    if (customerSearch.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setCustomerList([]);
    }
  }, [customerSearch]);

  const handleSearchItem = async (idx, query) => {
    setItemSearchText(prev => ({ ...prev, [idx]: query }));
    setActiveItemRow(idx);
    const res = await frappe.getItemsSearch(query);
    setItemSuggestions(prev => ({ ...prev, [idx]: res || [] }));
  };

  const selectItem = async (idx, selectedItem) => {
    const rate = await frappe.getItemPrice(selectedItem.code);
    const updated = items.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          item_code: selectedItem.code,
          item_name: selectedItem.name,
          unit: selectedItem.unit || 'Nos',
          rate: rate
        };
      }
      return item;
    });
    setItems(updated);
    setItemSearchText(prev => ({ ...prev, [idx]: selectedItem.code }));
    setActiveItemRow(null);
  };

  const handleAddItem = () => {
    setItems([...items, { item_code: products[0]?.code || '', qty: 10, rate: 10.00 }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, key, val) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        return { ...item, [key]: val };
      }
      return item;
    });
    setItems(updated);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!customer) {
      alert("Please select a valid customer.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    onSubmit({
      customer,
      postingDate,
      dueDate,
      items
    });
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => { setShowCustDropdown(false); setActiveItemRow(null); }}>
      <div className="modal-panel" style={{ width: '800px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
            {initialData ? '✏️ Amend Sales Invoice' : '📝 Create Sales Invoice'}
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <label className="input-label">Customer Name *</label>
                <input
                  type="text"
                  className="text-input"
                  required
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setCustomer(e.target.value); setShowCustDropdown(true); }}
                  onFocus={() => setShowCustDropdown(true)}
                  placeholder="Search Customer..."
                />
                {showCustDropdown && customerList.length > 0 && (
                  <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {customerList.map(c => (
                      <div
                        key={c.name}
                        className="dropdown-item"
                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#111' }}
                        onClick={() => { setCustomerSearch(c.customer_name); setCustomer(c.customer_name); setShowCustDropdown(false); }}
                      >
                        🏢 {c.customer_name} ({c.name})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="input-label">Posting Date *</label>
                <input type="date" className="text-input" required value={postingDate} onChange={e => setPostingDate(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Due Date *</label>
                <input type="date" className="text-input" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--text-heading)' }}>Invoice Items</h4>
              <button type="button" className="secondary-btn" onClick={handleAddItem} style={{ padding: '4px 8px', fontSize: '11px' }}>+ Add Row</button>
            </div>

            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th>Item Code *</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Rate ($)</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="text-input"
                        style={{ padding: '4px' }}
                        required
                        placeholder="Search Item..."
                        value={itemSearchText[idx] !== undefined ? itemSearchText[idx] : item.item_code}
                        onChange={e => handleSearchItem(idx, e.target.value)}
                        onFocus={() => setActiveItemRow(idx)}
                      />
                      {activeItemRow === idx && itemSuggestions[idx] && itemSuggestions[idx].length > 0 && (
                        <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {itemSuggestions[idx].map(p => (
                            <div
                              key={p.code}
                              className="dropdown-item"
                              style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '11px', color: '#111' }}
                              onClick={() => selectItem(idx, p)}
                            >
                              📦 {p.name} ({p.code})
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="text-input"
                        style={{ padding: '4px', textAlign: 'center' }}
                        required
                        min="1"
                        value={item.qty}
                        onChange={e => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="text-input"
                        style={{ padding: '4px', textAlign: 'right' }}
                        required
                        min="0"
                        value={item.rate}
                        onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0.0)}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', paddingRight: '8px' }}>
                      ${Number(item.qty * item.rate).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>
              {loading ? (
                <>
                  <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                  Submitting...
                </>
              ) : (initialData ? 'Save & Submit Amended Invoice' : 'Save & Submit Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeliveryNoteFormModal({ onClose, onSubmit, products, initialData = null, loading = false }) {
  const [customer, setCustomer] = useState(initialData?.customer || '');
  const [postingDate, setPostingDate] = useState(initialData?.posting_date || new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState(initialData?.items || [{ item_code: products[0]?.code || '', qty: 10, warehouse: 'Finished Goods - CWFL' }]);

  // Customer Autocomplete States
  const [customerSearch, setCustomerSearch] = useState(initialData?.customer || '');
  const [customerList, setCustomerList] = useState([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Item Autocomplete States
  const [itemSearchText, setItemSearchText] = useState({}); // { [idx]: string }
  const [itemSuggestions, setItemSuggestions] = useState({}); // { [idx]: Array }
  const [activeItemRow, setActiveItemRow] = useState(null);

  // Warehouse Autocomplete States
  const [whSearchText, setWhSearchText] = useState({}); // { [idx]: string }
  const [whSuggestions, setWhSuggestions] = useState({}); // { [idx]: Array }
  const [activeWhRow, setActiveWhRow] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const res = await frappe.getCustomers(customerSearch);
      setCustomerList(res || []);
    };
    if (customerSearch.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setCustomerList([]);
    }
  }, [customerSearch]);

  const handleSearchItem = async (idx, query) => {
    setItemSearchText(prev => ({ ...prev, [idx]: query }));
    setActiveItemRow(idx);
    const res = await frappe.getItemsSearch(query);
    setItemSuggestions(prev => ({ ...prev, [idx]: res || [] }));
  };

  const selectItem = (idx, selectedItem) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          item_code: selectedItem.code,
          item_name: selectedItem.name,
          unit: selectedItem.unit || 'Nos'
        };
      }
      return item;
    });
    setItems(updated);
    setItemSearchText(prev => ({ ...prev, [idx]: selectedItem.code }));
    setActiveItemRow(null);
  };

  const handleSearchWh = async (idx, query) => {
    setWhSearchText(prev => ({ ...prev, [idx]: query }));
    setActiveWhRow(idx);
    const res = await frappe.getWarehouses(query);
    setWhSuggestions(prev => ({ ...prev, [idx]: res || [] }));
  };

  const selectWh = (idx, selectedWh) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        return { ...item, warehouse: selectedWh.name };
      }
      return item;
    });
    setItems(updated);
    setWhSearchText(prev => ({ ...prev, [idx]: selectedWh.name }));
    setActiveWhRow(null);
  };

  const handleAddItem = () => {
    setItems([...items, { item_code: products[0]?.code || '', qty: 10, warehouse: 'Finished Goods - CWFL' }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, key, val) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        return { ...item, [key]: val };
      }
      return item;
    });
    setItems(updated);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!customer) {
      alert("Please select a valid customer.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    onSubmit({
      customer,
      postingDate,
      items
    });
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => { setShowCustDropdown(false); setActiveItemRow(null); setActiveWhRow(null); }}>
      <div className="modal-panel" style={{ width: '800px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
            {initialData ? '✏️ Amend Delivery Note' : '🚚 Create Delivery Note'}
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <label className="input-label">Customer Name *</label>
                <input
                  type="text"
                  className="text-input"
                  required
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setCustomer(e.target.value); setShowCustDropdown(true); }}
                  onFocus={() => setShowCustDropdown(true)}
                  placeholder="Search Customer..."
                />
                {showCustDropdown && customerList.length > 0 && (
                  <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {customerList.map(c => (
                      <div
                        key={c.name}
                        className="dropdown-item"
                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#111' }}
                        onClick={() => { setCustomerSearch(c.customer_name); setCustomer(c.customer_name); setShowCustDropdown(false); }}
                      >
                        🏢 {c.customer_name} ({c.name})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="input-label">Posting Date *</label>
                <input type="date" className="text-input" required value={postingDate} onChange={e => setPostingDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--text-heading)' }}>Shipment Items</h4>
              <button type="button" className="secondary-btn" onClick={handleAddItem} style={{ padding: '4px 8px', fontSize: '11px' }}>+ Add Row</button>
            </div>

            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th>Item Code *</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Qty</th>
                  <th>Source Warehouse *</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="text-input"
                        style={{ padding: '4px' }}
                        required
                        placeholder="Search Item..."
                        value={itemSearchText[idx] !== undefined ? itemSearchText[idx] : item.item_code}
                        onChange={e => handleSearchItem(idx, e.target.value)}
                        onFocus={() => setActiveItemRow(idx)}
                      />
                      {activeItemRow === idx && itemSuggestions[idx] && itemSuggestions[idx].length > 0 && (
                        <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {itemSuggestions[idx].map(p => (
                            <div
                              key={p.code}
                              className="dropdown-item"
                              style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '11px', color: '#111' }}
                              onClick={() => selectItem(idx, p)}
                            >
                              📦 {p.name} ({p.code})
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="text-input"
                        style={{ padding: '4px', textAlign: 'center' }}
                        required
                        min="1"
                        value={item.qty}
                        onChange={e => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="text-input"
                        style={{ padding: '4px' }}
                        required
                        placeholder="Search Warehouse..."
                        value={whSearchText[idx] !== undefined ? whSearchText[idx] : item.warehouse}
                        onChange={e => handleSearchWh(idx, e.target.value)}
                        onFocus={() => setActiveWhRow(idx)}
                      />
                      {activeWhRow === idx && whSuggestions[idx] && whSuggestions[idx].length > 0 && (
                        <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {whSuggestions[idx].map(w => (
                            <div
                              key={w.name}
                              className="dropdown-item"
                              style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '11px', color: '#111' }}
                              onClick={() => selectWh(idx, w)}
                            >
                              🏢 {w.warehouse_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading} style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>
              {loading ? (
                <>
                  <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                  Submitting...
                </>
              ) : (initialData ? 'Save & Submit Amended Delivery Note' : 'Save & Submit Delivery Note')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for all 11 Cleaning & Sanitation forms
function CleaningFormModal({ templateId, onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField, setActiveSearchField }) {
  const template = CLEANING_TEMPLATES.find(t => t.id === templateId);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [postingTime, setPostingTime] = useState(new Date().toTimeString().slice(0, 5));

  // Cleaner / Checker autocomplete
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [cleaner, setCleaner] = useState('');

  // Supervisor autocomplete
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [supervisor, setSupervisor] = useState('');

  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Set default values based on template type
    if (templateId === 'toilet-clean') {
      setFormData({ soap_refilled: 'YES', toilet_paper_refilled: 'YES', floor_mopped: 'YES', trash_emptied: 'YES', disinfected: 'YES', status: 'Clean' });
    } else if (templateId === 'toilet-purpose') {
      setFormData({ purpose: 'Regular toilet sanitization and cleanliness maintenance', frequency: 'Daily', cleaning_agent_used: 'Sodium Hypochlorite 5%' });
    } else if (templateId === 'dining-clean') {
      setFormData({ tables_cleaned: 'YES', floor_swept_mopped: 'YES', trash_emptied: 'YES', status: 'Clean' });
    } else if (templateId === 'dining-purpose') {
      setFormData({ purpose: 'Dining room sanitation and tables disinfection', frequency: 'Daily', cleaning_agent_used: 'Diversey Quat Sanitizer' });
    } else if (templateId === 'floor-clean') {
      setFormData({ area: 'Bottling Line', swept_scrubbed: 'YES', spillages_cleared: 'YES', drains_cleaned: 'YES', status: 'Clean' });
    } else if (templateId === 'floor-purpose') {
      setFormData({ purpose: 'Factory floor scrubbing & hygiene standard compliance', frequency: 'Shift-wise', cleaning_agent_used: 'Caustic floor cleaner' });
    } else if (templateId === 'lab-office-clean') {
      setFormData({ desk_surfaces_wiped: 'YES', floor_vacuumed_mopped: 'YES', bins_emptied: 'YES', status: 'Clean' });
    } else if (templateId === 'lab-office-purpose') {
      setFormData({ purpose: 'Laboratory bench space & office sanitation', frequency: 'Daily', cleaning_agent_used: 'Isopropyl Alcohol 70%' });
    } else if (templateId === 'incubator-temp') {
      setFormData({ incubator_id: 'Incubator 1', temperature: 37.0, humidity: 45.0, status: 'Normal' });
    } else if (templateId === 'balance-calib') {
      setFormData({ balance_id: 'Analytical Balance', weight_standard: 100.0000, weight_measured: 100.0000, variance: 0.0000, status: 'Pass' });
    } else if (templateId === 'sanitation') {
      setFormData({ equipment_sanitized: 'Syrup Tank', chemical_used: 'Chlorine', concentration_ppm: 200, contact_time_mins: 15, status: 'Satisfactory' });
    }
  }, [templateId]);

  const handleCheckboxChange = (key) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key] === 'YES' ? 'NO' : 'YES'
    }));
  };

  const handleInputChange = (key, val) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: val };
      // Auto-compute variance if weight fields changed in balance calibration
      if (templateId === 'balance-calib' && (key === 'weight_standard' || key === 'weight_measured')) {
        const std = parseFloat(key === 'weight_standard' ? val : prev.weight_standard) || 0;
        const meas = parseFloat(key === 'weight_measured' ? val : prev.weight_measured) || 0;
        updated.variance = parseFloat((meas - std).toFixed(4));
        updated.status = Math.abs(updated.variance) <= 0.005 ? 'Pass' : 'Fail';
      }
      return updated;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      posting_date: postingDate,
      posting_time: postingTime,
      ...formData
    };
    if (templateId === 'incubator-temp') {
      if (!cleaner) { alert('Please select inspector name.'); return; }
      finalData.recorded_by = cleaner;
    } else if (templateId === 'balance-calib') {
      if (!cleaner) { alert('Please select checking officer name.'); return; }
      finalData.checked_by = cleaner;
    } else if (templateId === 'sanitation') {
      if (!cleaner) { alert('Please select operator name.'); return; }
      finalData.performed_by = cleaner;
      if (supervisor) finalData.supervisor = supervisor;
    } else {
      // Cleaning checklists
      if (!cleaner) { alert('Please select cleaner name.'); return; }
      finalData.cleaner = cleaner;
      if (supervisor) finalData.supervisor = supervisor;
    }
    onSubmit(finalData);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowEmployeeDropdown(false)}>
      <div className="modal-panel" style={{ width: '550px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🧹 {template?.name}</h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="input-label">Date *</label>
                <input type="date" className="text-input" required value={postingDate} onChange={e => setPostingDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="input-label">Time *</label>
                <input type="time" className="text-input" required value={postingTime} onChange={e => setPostingTime(e.target.value)} />
              </div>
            </div>

            {/* Operator/Cleaner field */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="input-label">
                {templateId === 'incubator-temp' ? 'Recorded By (Analyst/Chemist) *' :
                  templateId === 'balance-calib' ? 'Checked By (Officer/Tech) *' :
                    templateId === 'sanitation' ? 'Performed By (Operator) *' : 'Cleaner Name *'}
              </label>
              <input
                type="text"
                className="text-input"
                required
                placeholder="Search employee..."
                value={cleanerSearch}
                onChange={e => { setCleanerSearch(e.target.value); setCleaner(e.target.value); handleSearchEmployees(e.target.value, 'cleaner'); setShowEmployeeDropdown(true); }}
                onFocus={() => { setActiveSearchField('cleaner'); setShowEmployeeDropdown(true); }}
              />
              {showEmployeeDropdown && activeSearchField === 'cleaner' && employeeList.length > 0 && (
                <div className="autocomplete-dropdown" style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '130px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
                  {employeeList.map(emp => (
                    <div
                      key={emp.name}
                      className="dropdown-item"
                      style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#111' }}
                      onClick={() => { setCleanerSearch(emp.employee_name); setCleaner(emp.employee_name); setShowEmployeeDropdown(false); }}
                    >
                      👤 {emp.employee_name} ({emp.designation})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supervisor field (where applicable) */}
            {['toilet-clean', 'dining-clean', 'floor-clean', 'lab-office-clean', 'sanitation'].includes(templateId) && (
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="input-label">Verified By (Supervisor)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Search employee..."
                  value={supervisorSearch}
                  onChange={e => { setSupervisorSearch(e.target.value); setSupervisor(e.target.value); handleSearchEmployees(e.target.value, 'supervisor'); setShowEmployeeDropdown(true); }}
                  onFocus={() => { setActiveSearchField('supervisor'); setShowEmployeeDropdown(true); }}
                />
                {showEmployeeDropdown && activeSearchField === 'supervisor' && employeeList.length > 0 && (
                  <div className="autocomplete-dropdown" style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '130px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
                    {employeeList.map(emp => (
                      <div
                        key={emp.name}
                        className="dropdown-item"
                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#111' }}
                        onClick={() => { setSupervisorSearch(emp.employee_name); setSupervisor(emp.employee_name); setShowEmployeeDropdown(false); }}
                      >
                        👤 {emp.employee_name} ({emp.designation})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic content for toilet clean */}
            {templateId === 'toilet-clean' && (
              <>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.soap_refilled === 'YES'} onChange={() => handleCheckboxChange('soap_refilled')} />
                    Soap Refilled / Handwash OK
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.toilet_paper_refilled === 'YES'} onChange={() => handleCheckboxChange('toilet_paper_refilled')} />
                    Toilet Paper / Paper Towels Refilled
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.floor_mopped === 'YES'} onChange={() => handleCheckboxChange('floor_mopped')} />
                    Floor Mopped & Dry
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.trash_emptied === 'YES'} onChange={() => handleCheckboxChange('trash_emptied')} />
                    Bins Emptied & New Liners Placed
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.disinfected === 'YES'} onChange={() => handleCheckboxChange('disinfected')} />
                    Bowls and Urinals Disinfected
                  </label>
                </div>
                <div className="form-group">
                  <label className="input-label">Cleaning Status</label>
                  <select className="text-input" value={formData.status || 'Clean'} onChange={e => handleInputChange('status', e.target.value)}>
                    <option value="Clean">Clean (OK)</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </>
            )}

            {/* Toilet purpose / Dining purpose / Floor purpose / Lab purpose */}
            {['toilet-purpose', 'dining-purpose', 'floor-purpose', 'lab-office-purpose'].includes(templateId) && (
              <>
                <div className="form-group">
                  <label className="input-label">Cleaning Purpose *</label>
                  <textarea className="text-input" required style={{ minHeight: '60px' }} value={formData.purpose || ''} onChange={e => handleInputChange('purpose', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="input-label">Frequency *</label>
                    <select className="text-input" value={formData.frequency || 'Daily'} onChange={e => handleInputChange('frequency', e.target.value)}>
                      <option value="Daily">Daily</option>
                      <option value="Shift-wise">Shift-wise</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Cleaning Agent Used *</label>
                    <input type="text" className="text-input" required value={formData.cleaning_agent_used || ''} onChange={e => handleInputChange('cleaning_agent_used', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Additional Notes</label>
                  <textarea className="text-input" style={{ minHeight: '40px' }} value={formData.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} />
                </div>
              </>
            )}

            {/* Dining clean */}
            {templateId === 'dining-clean' && (
              <>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.tables_cleaned === 'YES'} onChange={() => handleCheckboxChange('tables_cleaned')} />
                    Tables and Chairs Disinfected
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.floor_swept_mopped === 'YES'} onChange={() => handleCheckboxChange('floor_swept_mopped')} />
                    Floor Swept & Mopped
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.trash_emptied === 'YES'} onChange={() => handleCheckboxChange('trash_emptied')} />
                    Waste Bins Emptied
                  </label>
                </div>
                <div className="form-group">
                  <label className="input-label">Sanitation Status</label>
                  <select className="text-input" value={formData.status || 'Clean'} onChange={e => handleInputChange('status', e.target.value)}>
                    <option value="Clean">Clean (OK)</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </>
            )}

            {/* Factory floor clean */}
            {templateId === 'floor-clean' && (
              <>
                <div className="form-group">
                  <label className="input-label">Factory Area Zone *</label>
                  <select className="text-input" value={formData.area || 'Bottling Line'} onChange={e => handleInputChange('area', e.target.value)}>
                    <option value="Bottling Line">Bottling Line (CSD/RTD)</option>
                    <option value="Blowing Section">Blowing Section</option>
                    <option value="Warehouse">Warehouse & Dispatch</option>
                    <option value="Mixing Room">Syrup / Mixing Room</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.swept_scrubbed === 'YES'} onChange={() => handleCheckboxChange('swept_scrubbed')} />
                    Floor Swept and Scrubbed
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.spillages_cleared === 'YES'} onChange={() => handleCheckboxChange('spillages_cleared')} />
                    Liquid Spillages Cleared immediately
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.drains_cleaned === 'YES'} onChange={() => handleCheckboxChange('drains_cleaned')} />
                    Drainage Channels Flushed and Cleaned
                  </label>
                </div>
                <div className="form-group">
                  <label className="input-label">Floor Status</label>
                  <select className="text-input" value={formData.status || 'Clean'} onChange={e => handleInputChange('status', e.target.value)}>
                    <option value="Clean">Clean (OK)</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </>
            )}

            {/* Lab and office clean */}
            {templateId === 'lab-office-clean' && (
              <>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.desk_surfaces_wiped === 'YES'} onChange={() => handleCheckboxChange('desk_surfaces_wiped')} />
                    Desks / Lab Bench Surfaces Wiped
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.floor_vacuumed_mopped === 'YES'} onChange={() => handleCheckboxChange('floor_vacuumed_mopped')} />
                    Floor Vacuumed & Mopped
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input type="checkbox" checked={formData.bins_emptied === 'YES'} onChange={() => handleCheckboxChange('bins_emptied')} />
                    Office Waste Bins Emptied
                  </label>
                </div>
                <div className="form-group">
                  <label className="input-label">Sanitation Status</label>
                  <select className="text-input" value={formData.status || 'Clean'} onChange={e => handleInputChange('status', e.target.value)}>
                    <option value="Clean">Clean (OK)</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </>
            )}

            {/* Incubator temperature */}
            {templateId === 'incubator-temp' && (
              <>
                <div className="form-group">
                  <label className="input-label">Incubator ID *</label>
                  <select className="text-input" value={formData.incubator_id || 'Incubator 1'} onChange={e => handleInputChange('incubator_id', e.target.value)}>
                    <option value="Incubator 1">Incubator 1 (Micro lab)</option>
                    <option value="Incubator 2">Incubator 2 (Pathogen lab)</option>
                    <option value="Incubator 3">Incubator 3 (Reserve)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="input-label">Temperature Reading (°C) *</label>
                    <input type="number" step="0.1" className="text-input" required value={formData.temperature || ''} onChange={e => handleInputChange('temperature', parseFloat(e.target.value) || 0.0)} />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Relative Humidity (%) *</label>
                    <input type="number" step="0.1" className="text-input" required value={formData.humidity || ''} onChange={e => handleInputChange('humidity', parseFloat(e.target.value) || 0.0)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Reading Status</label>
                  <select className="text-input" value={formData.status || 'Normal'} onChange={e => handleInputChange('status', e.target.value)}>
                    <option value="Normal">Normal</option>
                    <option value="Alert">Alert (Out of Range)</option>
                  </select>
                </div>
              </>
            )}

            {/* Balance Calibration */}
            {templateId === 'balance-calib' && (
              <>
                <div className="form-group">
                  <label className="input-label">Balance Unit ID *</label>
                  <select className="text-input" value={formData.balance_id || 'Analytical Balance'} onChange={e => handleInputChange('balance_id', e.target.value)}>
                    <option value="Analytical Balance">Analytical Balance (Precisa)</option>
                    <option value="Top Pan Balance">Top Pan Balance (Ohaus)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="input-label">Standard (g) *</label>
                    <input type="number" step="0.0001" className="text-input" required value={formData.weight_standard || ''} onChange={e => handleInputChange('weight_standard', parseFloat(e.target.value) || 0.0)} />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Measured (g) *</label>
                    <input type="number" step="0.0001" className="text-input" required value={formData.weight_measured || ''} onChange={e => handleInputChange('weight_measured', parseFloat(e.target.value) || 0.0)} />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Variance (g)</label>
                    <input type="text" className="text-input" style={{ backgroundColor: '#f3f4f6' }} readOnly value={formData.variance !== undefined ? formData.variance : '0.0000'} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Calibration Verification</label>
                  <div className="form-input" style={{
                    backgroundColor: formData.status === 'Pass' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: formData.status === 'Pass' ? 'var(--success)' : 'var(--danger)',
                    fontWeight: '700',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}>
                    Status: {formData.status || 'Pass'}
                  </div>
                </div>
              </>
            )}

            {/* Sanitation */}
            {templateId === 'sanitation' && (
              <>
                <div className="form-group">
                  <label className="input-label">Equipment/Line Cleaned *</label>
                  <select className="text-input" value={formData.equipment_sanitized || 'Syrup Tank'} onChange={e => handleInputChange('equipment_sanitized', e.target.value)}>
                    <option value="Syrup Tank">Syrup Tank</option>
                    <option value="Filling Valves">Filling Valves (CSD)</option>
                    <option value="Capping Machine">Capping Machine</option>
                    <option value="Pipes">Product Pipelines</option>
                    <option value="Bottle Conveyor">Bottle Conveyor Track</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="input-label">Chemical/Method Used *</label>
                    <select className="text-input" value={formData.chemical_used || 'Chlorine'} onChange={e => handleInputChange('chemical_used', e.target.value)}>
                      <option value="Chlorine">Chlorine Solution (XY-12)</option>
                      <option value="Caustic Soda">Caustic Soda (Sodium Hydroxide)</option>
                      <option value="Acid Sanitizer">Acid Sanitizer (Peracetic Acid)</option>
                      <option value="Hot Water">Hot Water Flushing (CIP)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Concentration (ppm / %)</label>
                    <input type="number" className="text-input" value={formData.concentration_ppm || ''} onChange={e => handleInputChange('concentration_ppm', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="input-label">Contact Time (mins) *</label>
                    <input type="number" className="text-input" required value={formData.contact_time_mins || ''} onChange={e => handleInputChange('contact_time_mins', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Sanitation Result *</label>
                    <select className="text-input" value={formData.status || 'Satisfactory'} onChange={e => handleInputChange('status', e.target.value)}>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Unsatisfactory">Unsatisfactory</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Overall observations / remarks */}
            <div className="form-group">
              <label className="input-label">Observations / Remarks</label>
              <textarea className="text-input" style={{ minHeight: '50px' }} value={formData.remarks || ''} onChange={e => handleInputChange('remarks', e.target.value)} placeholder="Enter details..." />
            </div>

          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}>Save Log Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for viewing submitted report details
function CleaningRecordDetailModal({ record, onClose }) {
  if (!record) return null;
  const tpl = CLEANING_TEMPLATES.find(t => t.doctype === record.type) || { name: record.type };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-panel" style={{ width: '500px', maxWidth: '95%' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>📄 QC Clean Record: {record.id}</h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-content" style={{ padding: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Document Type:</span><br /><strong>{tpl.name}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Logged Timestamp:</span><br /><strong>{record.timestamp}</strong></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>
                {record.type === 'Incubator Temperature Record' ? 'Recorded By:' :
                  record.type === 'Balance Check or Callibration' ? 'Checked By:' :
                    record.type === 'Sanitation' ? 'Performed By:' : 'Cleaner Name:'}
              </span><br />
              <strong>{record.cleaner || record.recorded_by || record.checked_by || record.performed_by || 'N/A'}</strong>
            </div>
            {record.supervisor && (
              <div><span style={{ color: 'var(--text-muted)' }}>Verified By:</span><br /><strong>{record.supervisor}</strong></div>
            )}
          </div>

          <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontWeight: '700', fontSize: '13px', color: 'var(--text-heading)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Parameters & Checklist</h4>
            <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                {Object.entries(record).map(([key, val]) => {
                  if (['id', 'type', 'timestamp', 'cleaner', 'recorded_by', 'checked_by', 'performed_by', 'supervisor', 'remarks'].includes(key)) return null;
                  const cleanKey = key.replace(/_/g, ' ').toUpperCase();
                  const isPass = val === 'YES' || val === 'Clean' || val === 'Pass' || val === 'Satisfactory' || val === 'Normal';
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: 'var(--text-muted)' }}>{cleanKey}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: isPass ? 'var(--success)' : 'var(--danger)' }}>
                        {String(val)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {record.remarks && (
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Observations / Remarks:</span>
              <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: '#444' }}>{record.remarks}</p>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          <button className="primary-btn" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  );
}

export default App;


