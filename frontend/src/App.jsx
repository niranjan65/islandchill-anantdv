import React, { useState, useEffect } from 'react';
import { PRODUCTS, BOMS, INITIAL_INVENTORY, INITIAL_WORK_ORDERS } from './data/mockData';
import { frappe } from './services/frappe';
import { generateSecret, verifyTOTP } from './services/totp';
import SupportModule from './modules/SupportModule';
import HRMSModule from './modules/HRMSModule';
import { CONFIG } from './config';
import './App.css';
import logo from "../public/logo.png";

// Extracted modular components
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import DashboardTab from './components/DashboardTab';
import WorkflowTab from './components/WorkflowTab';
import WorkOrdersTab from './components/WorkOrdersTab';
import InventoryTab from './components/InventoryTab';
import BOMTab from './components/BOMTab';
import SalesTab, { SalesInvoiceFormModal, DeliveryNoteFormModal } from './components/SalesTab';
import MaintenanceTab, { MaintWeightCheckModal, MaintBreakdownModal } from './components/MaintenanceTab';
import SafetyTab, { SafetyIncidentFormModal, SafetyFirstAidFormModal, SafetySwabFormModal, SafetyReportViewerModal, SafetyForm37Modal } from './components/SafetyTab';
import LaboratoryTab, { LabForm1Modal, LabForm9Modal, LabForm11Modal, LabForm21Modal, LabReportViewerModal, LabForm36Modal, LabForm100Modal, LabForm103Modal } from './components/LaboratoryTab';
import CleaningTab, { CleaningFormModal, CleaningRecordDetailModal } from './components/CleaningTab';
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

const MAINTENANCE_TEMPLATES_STATIC = [
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
    equipment: 'Glycol Chilling Plant & Grasso Refrigerator',
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
    equipment: 'CSD / RTD Filler',
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
    equipment: 'Conveyors',
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
    equipment: 'Bottle / Can Washer',
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
    name: 'Daily Preventive Maintenance Schedule (Air Compressor)',
    equipment: 'Air Compressor',
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
  const [operatorEmployeeId, setOperatorEmployeeId] = useState('');
  const [operatorRemarks, setOperatorRemarks] = useState('');
  const [activeTimelineJC, setActiveTimelineJC] = useState(null); // { woId, jcId, operation, remarksList }

  // Job Card actual start/end time states
  const [jcActualStartTime, setJcActualStartTime] = useState('');
  const [jcActualEndTime, setJcActualEndTime] = useState('');

  // Job Card completion quantity states
  const [jcFinishForQuantity, setJcFinishForQuantity] = useState('');
  const [jcFinishCompletedQty, setJcFinishCompletedQty] = useState('');
  const [jcFinishProcessLossQty, setJcFinishProcessLossQty] = useState('');
  const [woActionLoading, setWoActionLoading] = useState(false);

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
      if (field === 'pauseModal' || field === 'remarksModal') {
        setOperatorEmployeeId('');
      }
    }

    setActiveSearchField(field);
    const emps = await frappe.getEmployees(query.trim(), 20);
    setEmployeeList(emps);
    setShowEmployeeDropdown(true);
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
  const [maintTemplates, setMaintTemplates] = useState(MAINTENANCE_TEMPLATES_STATIC);

  useEffect(() => {
    if (!isLoggedIn) {
      setMaintTemplates(MAINTENANCE_TEMPLATES_STATIC);
    }
  }, [isLoggedIn]);

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

    console.log("Saving safety record:", type, data);
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
    const template = maintTemplates[activeMaintTemplate];

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
      tasks: template.tasks,
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
  const [totalWOPagesLive, setTotalWOPagesLive] = useState(5);
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
          // Dynamic page estimation or count query
          try {
            const count = await frappe.getWorkOrdersCount();
            if (count > 0) {
              setTotalWOPagesLive(Math.max(1, Math.ceil(count / recordsPerPage)));
            } else {
              if (liveWOs.length < recordsPerPage) {
                setTotalWOPagesLive(currentPage);
              } else {
                setTotalWOPagesLive(currentPage + 1);
              }
            }
          } catch (cntErr) {
            console.warn("Failed to fetch Work Orders count from ERPNext:", cntErr);
            if (liveWOs.length < recordsPerPage) {
              setTotalWOPagesLive(currentPage);
            } else {
              setTotalWOPagesLive(currentPage + 1);
            }
          }

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

  const loadMaintenanceTemplatesFromERPNext = async () => {
    const conn = frappe.getConnectionSettings();
    if (conn.isLive && conn.connected) {
      try {
        const templates = await frappe.getMaintenanceTemplates();
        if (templates && templates.length > 0) {
          setMaintTemplates(templates);
        }
      } catch (err) {
        console.error("Failed to load Maintenance Templates from ERPNext:", err);
      }
    }
  };

  const loadMaintenanceSchedules = async () => {
    const conn = frappe.getConnectionSettings();
    if (conn.isLive && conn.connected) {
      try {
        await loadMaintenanceTemplatesFromERPNext();
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

  const openJobCardAction = (wo, jc, action) => {
    setOperatorName('');
    setOperatorEmployeeId('');
    setOperatorRemarks('');
    setJcActualStartTime('');
    setJcActualEndTime('');

    if (action === 'finish') {
      const forQty = Number(jc?.forQuantity || wo?.quantity || 0);
      const existingCompleted = Number(jc?.totalCompletedQty || 0);
      const completedQty = existingCompleted > 0 ? existingCompleted : forQty;
      const processLossQty = Math.max(0, forQty - completedQty);

      setJcFinishForQuantity(String(forQty || ''));
      setJcFinishCompletedQty(String(completedQty || ''));
      setJcFinishProcessLossQty(String(Number(processLossQty.toFixed(6)) || 0));
    } else {
      setJcFinishForQuantity('');
      setJcFinishCompletedQty('');
      setJcFinishProcessLossQty('');
    }

    setActiveJCOp({
      woId: wo.id,
      jcId: jc.id,
      operation: jc.operation,
      action
    });
  };

  const isWorkOrderReadyForFinish = (wo) => {
    if (!wo || ['Completed', 'Closed', 'Cancelled', 'Stopped'].includes(wo.status)) return false;
    if (!wo.jobCards || wo.jobCards.length === 0) return false;
    return wo.jobCards.every(jc => jc.status === 'Completed');
  };

  const handleFinishWorkOrder = async (wo) => {
    if (!wo) return;
    if (!isWorkOrderReadyForFinish(wo)) {
      showAlert('All Job Cards must be completed before finishing the Work Order.', 'warning', 'Work Order Not Ready');
      return;
    }

    if (!window.confirm(`Create and submit Manufacture Stock Entry for Work Order ${wo.id}?`)) return;

    setWoActionLoading(true);
    try {
      const res = await frappe.finishWorkOrder(wo.id, { submit: 1 });
      if (!res || res.success === false) {
        throw new Error(res?.error || 'Failed to finish Work Order');
      }

      showAlert(`Work Order ${wo.id} finished. Manufacture Stock Entry ${res.stock_entry || ''} created/submitted.`, 'success', 'Work Order Finished');
      await loadWorkOrders();
    } catch (err) {
      showAlert(`Failed to finish Work Order: ${err.message}`, 'error', 'ERPNext Error');
    } finally {
      setWoActionLoading(false);
    }
  };

  const handleChangeWorkOrderStatus = async (wo, status) => {
    if (!wo) return;
    const label = status === 'Resumed' ? 'Re-open' : status;
    if (!window.confirm(`${label} Work Order ${wo.id}?`)) return;

    setWoActionLoading(true);
    try {
      const res = await frappe.changeWorkOrderStatus(wo.id, status);
      if (!res || res.success === false) {
        throw new Error(res?.error || `Failed to update Work Order to ${status}`);
      }

      showAlert(`Work Order ${wo.id} updated to ${res.status || status}.`, 'success', 'Work Order Updated');
      await loadWorkOrders();
    } catch (err) {
      showAlert(`Failed to update Work Order: ${err.message}`, 'error', 'ERPNext Error');
    } finally {
      setWoActionLoading(false);
    }
  };

  // Job Card State modifiers (Start, Pause, Resume, Finish, Add Remarks)
  const handleStartJobCard = async (woId, jcId, operator, employeeId, remarksText = '') => {
    const cleanOp = (operator || '').trim();
    const cleanEmployeeId = (employeeId || '').trim();

    if (!cleanOp || !cleanEmployeeId) {
      showAlert('Please select a valid Employee from the dropdown before starting the Job Card.', 'warning', 'Employee Required');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanRemarks = remarksText || 'Job started.';
    const log = {
      timestamp,
      operator: cleanOp,
      employeeId: cleanEmployeeId,
      text: `Started: ${cleanRemarks}`,
      actualStartTime: jcActualStartTime
    };

    const targetWO = workOrders.find(wo => wo.id === woId);
    const targetJC = targetWO?.jobCards?.find(jc => jc.id === jcId);
    const finalRemarks = formatRemarksList([...(targetJC?.remarksList || []), log]);

    try {
      const conn = frappe.getConnectionSettings();

      if (conn.isLive && conn.connected) {
        const jcRes = await frappe.startJobCard(jcId, {
          employee: cleanEmployeeId,
          remarks: finalRemarks,
          actualStartTime: jcActualStartTime
        });

        if (!jcRes || jcRes.success === false) {
          throw new Error(jcRes?.error || 'Failed to start Job Card in ERPNext');
        }

        await frappe.forceWorkOrderInProgress(woId);
        await loadWorkOrders();
      } else {
        setWorkOrders(prevWOs => prevWOs.map(wo => {
          if (wo.id !== woId) return wo;

          const updatedJobCards = wo.jobCards.map(jc => {
            if (jc.id === jcId) {
              const updatedRemarksList = [...(jc.remarksList || []), log];
              return {
                ...jc,
                status: 'Work In Progress',
                operator: cleanOp,
                employeeId: cleanEmployeeId,
                remarksList: updatedRemarksList,
                remarks: formatRemarksList(updatedRemarksList),
                actualStartTime: jcActualStartTime || jc.actualStartTime
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
      }

      setActiveJCOp(null);
      setOperatorName('');
      setOperatorEmployeeId('');
      setOperatorRemarks('');
      setJcActualStartTime('');
      setJcActualEndTime('');
    } catch (err) {
      showAlert(`Failed to start Job Card: ${err.message}`, 'error', 'ERPNext Error');
      loadWorkOrders();
    }
  };

  const handlePauseJobCard = async (woId, jcId, operator, employeeId, remarksText) => {
    // ERPNext pause does not need a new employee selection.
    // It closes the currently open Job Card Time Log row and sets is_paused = 1.
    const cleanOp = (operator || currentUser || 'Operator').trim();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanRemarks = remarksText || 'Operation paused.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: `Paused: ${cleanRemarks}`,
      actualEndTime: jcActualEndTime
    };

    const targetWO = workOrders.find(wo => wo.id === woId);
    const targetJC = targetWO?.jobCards?.find(jc => jc.id === jcId);
    const finalRemarks = formatRemarksList([...(targetJC?.remarksList || []), log]);

    try {
      const conn = frappe.getConnectionSettings();

      if (conn.isLive && conn.connected) {
        const jcRes = await frappe.pauseJobCard(jcId, {
          remarks: finalRemarks,
          actualEndTime: jcActualEndTime
        });

        if (!jcRes || jcRes.success === false) {
          throw new Error(jcRes?.error || 'Failed to pause Job Card in ERPNext');
        }

        await loadWorkOrders();
      } else {
        setWorkOrders(prevWOs => prevWOs.map(wo => {
          if (wo.id !== woId) return wo;

          const updatedJobCards = wo.jobCards.map(jc => {
            if (jc.id === jcId) {
              const updatedRemarksList = [...(jc.remarksList || []), log];
              return {
                ...jc,
                status: 'On Hold',
                is_paused: 1,
                operator: cleanOp,
                remarksList: updatedRemarksList,
                remarks: formatRemarksList(updatedRemarksList),
                actualEndTime: jcActualEndTime || jc.actualEndTime
              };
            }
            return jc;
          });

          return { ...wo, jobCards: updatedJobCards };
        }));
      }

      setActiveJCOp(null);
      setOperatorName('');
      setOperatorEmployeeId('');
      setOperatorRemarks('');
      setJcActualStartTime('');
      setJcActualEndTime('');
    } catch (err) {
      showAlert(`Failed to pause Job Card: ${err.message}`, 'error', 'ERPNext Error');
      loadWorkOrders();
    }
  };

  const handleResumeJobCard = async (woId, jcId, operator, employeeId, remarksText = '') => {
    // ERPNext resume does not need a new employee selection.
    // It uses the existing Job Card employee table and adds a new Time Log row.
    const cleanOp = (operator || currentUser || 'Operator').trim();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanRemarks = remarksText || 'Job resumed.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: `Resumed: ${cleanRemarks}`,
      actualStartTime: jcActualStartTime
    };

    const targetWO = workOrders.find(wo => wo.id === woId);
    const targetJC = targetWO?.jobCards?.find(jc => jc.id === jcId);
    const finalRemarks = formatRemarksList([...(targetJC?.remarksList || []), log]);

    try {
      const conn = frappe.getConnectionSettings();

      if (conn.isLive && conn.connected) {
        const jcRes = await frappe.resumeJobCard(jcId, {
          remarks: finalRemarks,
          actualStartTime: jcActualStartTime
        });

        if (!jcRes || jcRes.success === false) {
          throw new Error(jcRes?.error || 'Failed to resume Job Card in ERPNext');
        }

        await loadWorkOrders();
      } else {
        setWorkOrders(prevWOs => prevWOs.map(wo => {
          if (wo.id !== woId) return wo;

          const updatedJobCards = wo.jobCards.map(jc => {
            if (jc.id === jcId) {
              const updatedRemarksList = [...(jc.remarksList || []), log];
              return {
                ...jc,
                status: 'Work In Progress',
                is_paused: 0,
                operator: cleanOp,
                remarksList: updatedRemarksList,
                remarks: formatRemarksList(updatedRemarksList),
                actualStartTime: jcActualStartTime || jc.actualStartTime
              };
            }
            return jc;
          });

          return { ...wo, jobCards: updatedJobCards };
        }));
      }

      setActiveJCOp(null);
      setOperatorName('');
      setOperatorEmployeeId('');
      setOperatorRemarks('');
      setJcActualStartTime('');
      setJcActualEndTime('');
    } catch (err) {
      showAlert(`Failed to resume Job Card: ${err.message}`, 'error', 'ERPNext Error');
      loadWorkOrders();
    }
  };

  const handleFinishJobCard = async (woId, jcId, operator, employeeId, remarksText) => {
    // ERPNext completion closes the active time log, calculates time_in_mins,
    // fills completed_qty, submits the Job Card, and updates Work Order operation.
    const cleanOp = (operator || currentUser || 'Operator').trim();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanRemarks = remarksText || 'Operation finished.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: `Finished: ${cleanRemarks}`,
      actualEndTime: jcActualEndTime
    };

    const targetWO = workOrders.find(wo => wo.id === woId);
    const targetJC = targetWO?.jobCards?.find(jc => jc.id === jcId);
    const finalRemarks = formatRemarksList([...(targetJC?.remarksList || []), log]);
    const forQty = Number(jcFinishForQuantity || targetJC?.forQuantity || targetWO?.quantity || 0);
    const completedQty = Number(jcFinishCompletedQty || forQty || 0);
    const processLossQty = Number(jcFinishProcessLossQty || Math.max(0, forQty - completedQty) || 0);

    if (!forQty || forQty <= 0) {
      showAlert('Qty to Manufacture must be greater than 0.', 'warning', 'Invalid Quantity');
      return;
    }

    if (completedQty < 0) {
      showAlert('Total Completed Qty cannot be negative.', 'warning', 'Invalid Quantity');
      return;
    }

    if ((completedQty + processLossQty) > forQty + 0.0001) {
      showAlert('Total Completed Qty + Process Loss Qty cannot be greater than Qty to Manufacture.', 'warning', 'Invalid Quantity');
      return;
    }

    try {
      const conn = frappe.getConnectionSettings();

      if (conn.isLive && conn.connected) {
        const jcRes = await frappe.submitJobCard(jcId, {
          remarks: finalRemarks,
          actualEndTime: jcActualEndTime,
          qty: completedQty,
          forQuantity: forQty,
          looseQty: 0,
          processLossQty
        });

        if (!jcRes || jcRes.success === false) {
          throw new Error(jcRes?.error || 'Failed to submit Job Card in ERPNext');
        }

        await loadWorkOrders();
      } else {
        setWorkOrders(prevWOs => prevWOs.map(wo => {
          if (wo.id !== woId) return wo;

          const updatedCards = wo.jobCards.map(jc => {
            if (jc.id === jcId) {
              const updatedRemarksList = [...(jc.remarksList || []), log];
              return {
                ...jc,
                status: 'Completed',
                operator: cleanOp,
                remarksList: updatedRemarksList,
                remarks: formatRemarksList(updatedRemarksList),
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

          if (isLastCard) {
            addFinishedGoodsStock(wo.product, wo.quantity);
          }

          return {
            ...wo,
            status: isLastCard ? 'Completed' : 'In Process',
            produced: isLastCard ? wo.quantity : wo.produced,
            jobCards: updatedCards
          };
        }));
      }

      setActiveJCOp(null);
      setOperatorName('');
      setOperatorEmployeeId('');
      setOperatorRemarks('');
      setJcActualStartTime('');
      setJcActualEndTime('');
    } catch (err) {
      showAlert(`Failed to finish Job Card: ${err.message}`, 'error', 'ERPNext Error');
      loadWorkOrders();
    }
  };

  const handleAddRemarkJobCard = async (woId, jcId, operator, remarksText) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cleanOp = operator || currentUser;
    const cleanRemarks = remarksText || 'Comment added.';
    const log = {
      timestamp,
      operator: cleanOp,
      text: cleanRemarks
    };

    setWorkOrders(prevWOs => prevWOs.map(wo => {
      if (wo.id !== woId) return wo;

      const updatedJobCards = wo.jobCards.map(jc => {
        if (jc.id === jcId) {
          const updatedRemarksList = [...(jc.remarksList || []), log];
          return {
            ...jc,
            remarksList: updatedRemarksList,
            remarks: formatRemarksList(updatedRemarksList)
          };
        }
        return jc;
      });

      return { ...wo, jobCards: updatedJobCards };
    }));

    try {
      const conn = frappe.getConnectionSettings();
      if (conn.isLive && conn.connected) {
        await frappe.addJobCardComment(jcId, cleanRemarks, cleanOp);
        await loadWorkOrders();
      }
    } catch (err) {
      showAlert(`Failed to add Job Card comment: ${err.message}`, 'error', 'ERPNext Error');
    }

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
    ? totalWOPagesLive
    : Math.max(1, Math.ceil(filteredWorkOrders.length / recordsPerPage));

  // Render Login page if offline/not authenticated
  if (!isLoggedIn) {
    return (
      <LoginPage
        is2FAPhase={is2FAPhase}
        setIs2FAPhase={setIs2FAPhase}
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        loginLoading={loginLoading}
        use2FA={use2FA}
        setUse2FA={setUse2FA}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        tempSecret={tempSecret}
        totpQrUrl={totpQrUrl}
        copiedKey={copiedKey}
        handleLoginSubmit={handleLoginSubmit}
        handleVerify2FASetup={handleVerify2FASetup}
        handleVerify2FALogin={handleVerify2FALogin}
        handleCopyMFAKey={handleCopyMFAKey}
        handleReset2FA={handleReset2FA}
        handleLaunchDemoMode={handleLaunchDemoMode}
      />
    );
  }

  // DEAD CODE BELOW - original login JSX replaced by LoginPage component above
  if (false) {
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

      {/* Sidebar Navigation - extracted to Sidebar component */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
        setSelectedWOId={setSelectedWOId}
      />

      {/* Main Workspace Area */}
      <main className="main-workspace">
        <AppHeader
          currentUser={currentUser}
          currentTime={currentTime}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          lowStockCount={lowStockCount}
          inventory={inventory}
          tickets={tickets}
          setCurrentTab={setCurrentTab}
          setShowSettingsModal={setShowSettingsModal}
          setSettingsUrl={setSettingsUrl}
          setSettingsApiKey={setSettingsApiKey}
          setSettingsApiSecret={setSettingsApiSecret}
          setSyncStatusMsg={setSyncStatusMsg}
        />

        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <DashboardTab
            workOrders={workOrders}
            inventory={inventory}
            activeWOsCount={activeWOsCount}
            pendingWOsCount={pendingWOsCount}
            inProgressJobCardsCount={inProgressJobCardsCount}
            lowStockCount={lowStockCount}
            totalProduction={totalProduction}
            goodProduction={goodProduction}
            looseProduction={looseProduction}
            woMonitorPage={woMonitorPage}
            setWoMonitorPage={setWoMonitorPage}
            setCurrentTab={setCurrentTab}
            setSelectedWOId={setSelectedWOId}
            fullscreenElement={fullscreenElement}
            setFullscreenElement={setFullscreenElement}
            WORK_ORDER_ACTIVE_STATUSES={WORK_ORDER_ACTIVE_STATUSES}
          />
        )}

        {/* Work Orders Tab */}
        {currentTab === 'work-orders' && (
          <WorkOrdersTab
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            woLoading={woLoading}
            displayedWorkOrders={displayedWorkOrders}
            selectedWOId={selectedWOId}
            setSelectedWOId={setSelectedWOId}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalWOPages={totalWOPages}
            woProductsList={woProductsList}
            selectedWoProduct={selectedWoProduct}
            setSelectedWoProduct={setSelectedWoProduct}
            woBomsList={woBomsList}
            selectedWoBom={selectedWoBom}
            setSelectedWoBom={setSelectedWoBom}
            woItemsLoading={woItemsLoading}
            woBomsLoading={woBomsLoading}
            woProductSearch={woProductSearch}
            setWoProductSearch={setWoProductSearch}
            woBomSearch={woBomSearch}
            setWoBomSearch={setWoBomSearch}
            filteredWoProductsList={filteredWoProductsList}
            filteredWoBomsList={filteredWoBomsList}
            showNewWODrawer={showNewWODrawer}
            setShowNewWODrawer={setShowNewWODrawer}
            handleCreateNewWO={handleCreateNewWO}
            handleDeleteWorkOrder={handleDeleteWorkOrder}
            showAlert={showAlert}
            setStockEntryModal={setStockEntryModal}
            loadWorkOrders={loadWorkOrders}
            syncJobCardToERP={frappe.syncJobCardToERP}
            WORK_ORDER_STARTABLE_STATUSES={WORK_ORDER_STARTABLE_STATUSES}
            WORK_ORDER_ACTIVE_STATUSES={WORK_ORDER_ACTIVE_STATUSES}
            JOB_CARD_STARTABLE_STATUSES={JOB_CARD_STARTABLE_STATUSES}
            JOB_CARD_RUNNING_STATUSES={JOB_CARD_RUNNING_STATUSES}
            JOB_CARD_PAUSED_STATUSES={JOB_CARD_PAUSED_STATUSES}
            isLoggedIn={isLoggedIn}
            recordsPerPage={recordsPerPage}
            logo={logo}
            handleStartWorkOrder={handleStartWorkOrder}
            isWorkOrderReadyForFinish={isWorkOrderReadyForFinish}
            woActionLoading={woActionLoading}
            handleFinishWorkOrder={handleFinishWorkOrder}
            handleChangeWorkOrderStatus={handleChangeWorkOrderStatus}
            openJobCardAction={openJobCardAction}
            setOperatorName={setOperatorName}
            currentUser={currentUser}
            setOperatorRemarks={setOperatorRemarks}
            setActiveTimelineJC={setActiveTimelineJC}
            operatorName={operatorName}
            operatorEmployeeId={operatorEmployeeId}
            setOperatorEmployeeId={setOperatorEmployeeId}
            operatorRemarks={operatorRemarks}
            activeTimelineJC={activeTimelineJC}
            jcActualStartTime={jcActualStartTime}
            setJcActualStartTime={setJcActualStartTime}
            jcActualEndTime={jcActualEndTime}
            setJcActualEndTime={setJcActualEndTime}
            jcFinishForQuantity={jcFinishForQuantity}
            setJcFinishForQuantity={setJcFinishForQuantity}
            jcFinishCompletedQty={jcFinishCompletedQty}
            setJcFinishCompletedQty={setJcFinishCompletedQty}
            jcFinishProcessLossQty={jcFinishProcessLossQty}
            setJcFinishProcessLossQty={setJcFinishProcessLossQty}
            handleStartJobCard={handleStartJobCard}
            handlePauseJobCard={handlePauseJobCard}
            handleResumeJobCard={handleResumeJobCard}
            handleFinishJobCard={handleFinishJobCard}
            handleAddRemarkJobCard={handleAddRemarkJobCard}
            handleReplyToRemarkJobCard={handleReplyToRemarkJobCard}
            replyingToIdx={replyingToIdx}
            setReplyingToIdx={setReplyingToIdx}
            replyText={replyText}
            setReplyText={setReplyText}
            employeeList={employeeList}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
            handleSearchEmployees={handleSearchEmployees}
            activeJCOp={activeJCOp}
            setActiveJCOp={setActiveJCOp}
          />
        )}

        {/* Inventory Tab */}
        {currentTab === 'inventory' && (
          <InventoryTab
            erpItems={erpItems}
            inventory={inventory}
            showAdjustStockModal={showAdjustStockModal}
            setShowAdjustStockModal={setShowAdjustStockModal}
            adjustItemCode={adjustItemCode}
            setAdjustItemCode={setAdjustItemCode}
            adjustQty={adjustQty}
            setAdjustQty={setAdjustQty}
            handleAdjustStockSubmit={handleAdjustStockSubmit}
            invSearchQuery={invSearchQuery}
            setInvSearchQuery={setInvSearchQuery}
            invPage={invPage}
            setInvPage={setInvPage}
            selectedItemCode={selectedItemCode}
            setSelectedItemCode={setSelectedItemCode}
            itemsLoading={itemsLoading}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* BOM Tab */}
        {currentTab === 'bom' && (
          <BOMTab
            BOMS={BOMS}
            PRODUCTS={PRODUCTS}
            bomLoading={bomLoading}
            bomList={bomList}
            selectedBomId={selectedBomId}
            setSelectedBomId={setSelectedBomId}
            bomPage={bomPage}
            setBomPage={setBomPage}
            activeBomMaterials={activeBomMaterials}
          />
        )}

        {/* Sales Tab */}
        {currentTab === 'sales' && (
          <SalesTab
            salesInvoicesList={salesInvoicesList}
            setSalesInvoicesList={setSalesInvoicesList}
            deliveryNotesList={deliveryNotesList}
            setDeliveryNotesList={setDeliveryNotesList}
            showCreateInvoiceModal={showCreateInvoiceModal}
            setShowCreateInvoiceModal={setShowCreateInvoiceModal}
            showCreateDeliveryNoteModal={showCreateDeliveryNoteModal}
            setShowCreateDeliveryNoteModal={setShowCreateDeliveryNoteModal}
            showAmendInvoiceModal={showAmendInvoiceModal}
            setShowAmendInvoiceModal={setShowAmendInvoiceModal}
            showAmendDeliveryNoteModal={showAmendDeliveryNoteModal}
            setShowAmendDeliveryNoteModal={setShowAmendDeliveryNoteModal}
            salesLoading={salesLoading}
            setSalesLoading={setSalesLoading}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            selectedDeliveryNote={selectedDeliveryNote}
            setSelectedDeliveryNote={setSelectedDeliveryNote}
            salesSearchQuery={salesSearchQuery}
            setSalesSearchQuery={setSalesSearchQuery}
            salesInvoicePage={salesInvoicePage}
            setSalesInvoicePage={setSalesInvoicePage}
            deliveryNotePage={deliveryNotePage}
            setDeliveryNotePage={setDeliveryNotePage}
            salesSubTab={salesSubTab}
            setSalesSubTab={setSalesSubTab}
            showAlert={showAlert}
            PRODUCTS={PRODUCTS}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* Maintenance Tab */}
        {currentTab === 'maintenance' && (
          <MaintenanceTab
            maintenanceRecords={maintenanceRecords}
            setMaintenanceRecords={setMaintenanceRecords}
            maintSearchQuery={maintSearchQuery}
            setMaintSearchQuery={setMaintSearchQuery}
            maintFilterEquipment={maintFilterEquipment}
            setMaintFilterEquipment={setMaintFilterEquipment}
            maintSaving={maintSaving}
            setMaintSaving={setMaintSaving}
            MAINTENANCE_TEMPLATES={maintTemplates}
            showAlert={showAlert}
            filteredMaintRecords={filteredMaintRecords}
            activeMaintSubTab={activeMaintSubTab}
            setActiveMaintSubTab={setActiveMaintSubTab}
            maintViewMode={maintViewMode}
            setMaintViewMode={setMaintViewMode}
            getWeekNumber={getWeekNumber}
            activeMaintTemplate={activeMaintTemplate}
            setActiveMaintTemplate={setActiveMaintTemplate}
            maintWeekNo={maintWeekNo}
            setMaintWeekNo={setMaintWeekNo}
            maintFromDate={maintFromDate}
            setMaintFromDate={setMaintFromDate}
            maintToDate={maintToDate}
            setMaintToDate={setMaintToDate}
            maintCheckgrid={maintCheckgrid}
            setMaintCheckgrid={setMaintCheckgrid}
            maintRemarks={maintRemarks}
            setMaintRemarks={setMaintRemarks}
            maintOperator={maintOperator}
            setMaintOperator={setMaintOperator}
            maintSupervisor={maintSupervisor}
            setMaintSupervisor={setMaintSupervisor}
            activeMaintForm={activeMaintForm}
            setActiveMaintForm={setActiveMaintForm}
            maintPage={maintPage}
            setMaintPage={setMaintPage}
            viewingRecord={viewingRecord}
            setViewingRecord={setViewingRecord}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* Safety Tab */}
        {currentTab === 'safety' && (
          <SafetyTab
            safetyRecords={safetyRecords}
            setSafetyRecords={setSafetyRecords}
            safetySearchQuery={safetySearchQuery}
            setSafetySearchQuery={setSafetySearchQuery}
            safetyFilterType={safetyFilterType}
            setSafetyFilterType={setSafetyFilterType}
            filteredSafetyRecords={filteredSafetyRecords}
            safetyPage={safetyPage}
            setSafetyPage={setSafetyPage}
            activeSafetyForm={activeSafetyForm}
            setActiveSafetyForm={setActiveSafetyForm}
            viewingSafetyRecord={viewingSafetyRecord}
            setViewingSafetyRecord={setViewingSafetyRecord}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
            setEmailModal={setEmailModal}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* Workflow Tab */}
        {currentTab === 'workflow' && (
          <WorkflowTab
            WORKFLOW_STAGES={WORKFLOW_STAGES}
            simStep={simStep}
            setSimStep={setSimStep}
            simPlaying={simPlaying}
            setSimPlaying={setSimPlaying}
            simSpeed={simSpeed}
            setSimSpeed={setSimSpeed}
          />
        )}

        {/* Laboratory Tab */}
        {currentTab === 'laboratory' && (
          <LaboratoryTab
            laboratoryRecords={laboratoryRecords}
            setLaboratoryRecords={setLaboratoryRecords}
            labSearchQuery={labSearchQuery}
            setLabSearchQuery={setLabSearchQuery}
            labFilterType={labFilterType}
            setLabFilterType={setLabFilterType}
            filteredLabRecords={filteredLabRecords}
            labPage={labPage}
            setLabPage={setLabPage}
            labViewMode={labViewMode}
            setLabViewMode={setLabViewMode}
            activeLabForm={activeLabForm}
            setActiveLabForm={setActiveLabForm}
            viewingLabRecord={viewingLabRecord}
            setViewingLabRecord={setViewingLabRecord}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
            setEmailModal={setEmailModal}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* Cleaning Tab */}
        {currentTab === 'cleaning' && (
          <CleaningTab
            cleaningRecords={cleaningRecords}
            setCleaningRecords={setCleaningRecords}
            CLEANING_TEMPLATES={CLEANING_TEMPLATES}
            cleaningSearchQuery={cleaningSearchQuery}
            setCleaningSearchQuery={setCleaningSearchQuery}
            cleaningFilterType={cleaningFilterType}
            setCleaningFilterType={setCleaningFilterType}
            cleaningPage={cleaningPage}
            setCleaningPage={setCleaningPage}
            activeCleaningForm={activeCleaningForm}
            setActiveCleaningForm={setActiveCleaningForm}
            viewingCleaningRecord={viewingCleaningRecord}
            setViewingCleaningRecord={setViewingCleaningRecord}
            employeeList={employeeList}
            handleSearchEmployees={handleSearchEmployees}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            activeSearchField={activeSearchField}
            setActiveSearchField={setActiveSearchField}
            isLoggedIn={isLoggedIn}
          />
        )}

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
                {activeJCOp.action === 'start' && '▶ Start Job Card'}
                {activeJCOp.action === 'pause' && '⏸ Pause Job Card'}
                {activeJCOp.action === 'resume' && '▶ Resume Job Card'}
                {activeJCOp.action === 'finish' && '✓ Complete & Submit Job Card'}
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

              {activeJCOp.action === 'start' && (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Select Employee / Operator</label>
                  <input
                    type="text"
                    className="form-input"
                    value={operatorName}
                    onChange={(e) => {
                      setOperatorEmployeeId('');
                      handleSearchEmployees(e.target.value, 'pauseModal');
                    }}
                    onFocus={() => {
                      setActiveSearchField('pauseModal');
                      if (operatorName.trim().length >= 3 || employeeList.length > 0) {
                        setShowEmployeeDropdown(true);
                      }
                    }}
                    placeholder="Search employee and select from dropdown"
                    required
                    autoComplete="off"
                  />
                  {operatorEmployeeId && (
                    <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px', fontWeight: '600' }}>
                      Selected Employee ID: {operatorEmployeeId}
                    </div>
                  )}
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
                            setOperatorName(emp.employee_name || emp.name);
                            setOperatorEmployeeId(emp.name);
                            setShowEmployeeDropdown(false);
                          }}
                          className="employee-dropdown-item"
                        >
                          <strong>{emp.employee_name || emp.name}</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({emp.name})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeJCOp.action !== 'start' && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(14, 165, 233, 0.08)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  ERPNext will use the existing Job Card Time Log employee. Pause/Resume/Finish will not create a new employee assignment.
                </div>
              )}

              {['start', 'resume'].includes(activeJCOp.action) && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Actual Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={jcActualStartTime}
                    onChange={(e) => setJcActualStartTime(e.target.value)}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Used only for Start/Resume. Leave blank to use current ERPNext time.
                  </div>
                </div>
              )}

              {['pause', 'finish'].includes(activeJCOp.action) && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Actual End Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={jcActualEndTime}
                    onChange={(e) => setJcActualEndTime(e.target.value)}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Used only for Pause/Finish. Leave blank to use current ERPNext time.
                  </div>
                </div>
              )}

              {activeJCOp.action === 'finish' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Qty to Manufacture</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={jcFinishForQuantity}
                      onChange={(e) => {
                        const nextForQty = Number(e.target.value || 0);
                        const completed = Number(jcFinishCompletedQty || 0);
                        setJcFinishForQuantity(e.target.value);
                        setJcFinishProcessLossQty(String(Number(Math.max(0, nextForQty - completed).toFixed(6))));
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Total Completed Qty</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={jcFinishCompletedQty}
                      onChange={(e) => {
                        const completed = Number(e.target.value || 0);
                        const forQty = Number(jcFinishForQuantity || 0);
                        setJcFinishCompletedQty(e.target.value);
                        setJcFinishProcessLossQty(String(Number(Math.max(0, forQty - completed).toFixed(6))));
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      This becomes completed_qty in the Job Card Time Log.
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Process Loss Qty</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={jcFinishProcessLossQty}
                      onChange={(e) => setJcFinishProcessLossQty(e.target.value)}
                    />
                  </div>
                </div>
              )}

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
                      : activeJCOp.action === 'start'
                        ? "Enter start notes (optional)..."
                        : activeJCOp.action === 'resume'
                          ? "Enter resume notes (optional)..."
                          : "Enter completion details (e.g. pH check 3.2, seal checks normal)..."
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
                  if (activeJCOp.action === 'start') {
                    handleStartJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorEmployeeId, operatorRemarks);
                  } else if (activeJCOp.action === 'pause') {
                    handlePauseJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorEmployeeId, operatorRemarks);
                  } else if (activeJCOp.action === 'resume') {
                    handleResumeJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorEmployeeId, operatorRemarks);
                  } else if (activeJCOp.action === 'finish') {
                    handleFinishJobCard(activeJCOp.woId, activeJCOp.jcId, operatorName, operatorEmployeeId, operatorRemarks);
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
                                setOperatorName(emp.employee_name || emp.name);
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
                  <div style={{ padding: '8px 10px', backgroundColor: 'rgba(14, 165, 233, 0.08)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Remarks do not update Job Card time logs. Start time is controlled by Start/Resume, and end time is controlled by Pause/Finish.
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
        const template = maintTemplates[activeMaintTemplate];
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

        const template = maintTemplates.find(t => t.id === viewingRecord.templateId) || maintTemplates[0];
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

export default App;


