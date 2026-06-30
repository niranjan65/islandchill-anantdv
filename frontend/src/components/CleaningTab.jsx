import React, { useState, useEffect } from 'react';
import { frappe } from '../services/frappe';

export function CleaningFormModal({ templateId, onClose, onSubmit, employeeList, handleSearchEmployees, showEmployeeDropdown, setShowEmployeeDropdown, activeSearchField, setActiveSearchField }) {
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

export function CleaningRecordDetailModal({ record, onClose }) {
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

export default function CleaningTab({
  cleaningRecords,
  CLEANING_TEMPLATES,
  cleaningSearchQuery,
  setCleaningSearchQuery,
  cleaningFilterType,
  setCleaningFilterType,
  cleaningPage,
  setCleaningPage,
  setActiveCleaningForm,
  setViewingCleaningRecord
}) {
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
}