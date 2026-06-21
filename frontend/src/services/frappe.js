// frappe.js - ERPNext/Frappe Integration Service for Island Chill Bottling App
import { CONFIG } from '../config';

const STORAGE_KEYS = {
  CONNECTION: 'fiji_frappe_connection',
};

class FrappeService {
  constructor() {
    this.connection = this.getConnectionSettings();
  }

  getConnectionSettings() {
    const connStr = localStorage.getItem(STORAGE_KEYS.CONNECTION);
    if (connStr) {
      try {
        const conn = JSON.parse(connStr);
        if (!conn.url) conn.url = CONFIG.ERPNEXT_SERVER_URL;
        return conn;
      } catch {
        return { isLive: false, url: CONFIG.ERPNEXT_SERVER_URL, apiKey: '', apiSecret: '', username: '', password: '', connected: false };
      }
    }
    return { isLive: false, url: CONFIG.ERPNEXT_SERVER_URL, apiKey: '', apiSecret: '', username: '', password: '', connected: false };
  }

  setConnectionSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(settings));
    this.connection = settings;
  }

  resolveUrl(url) {
    if (!url) return '';
    const clean = url.endsWith('/') ? url.slice(0, -1) : url;
    if (clean.includes('vms.advtinni.com')) {
      return '';
    }
    return clean;
  }

  getAuthHeader() {
    const { apiKey, apiSecret } = this.connection;
    if (apiKey && apiSecret) {
      return `token ${apiKey}:${apiSecret}`;
    }
    return '';
  }

  async login(url, usernameOrKey, passwordOrSecret, isLive = false) {
    if (!isLive) {
      const mockSettings = { isLive: false, url: CONFIG.ERPNEXT_SERVER_URL, apiKey: '', apiSecret: '', username: '', password: '', connected: true, user: 'Alex Morgan', role: 'System Administrator' };
      this.setConnectionSettings(mockSettings);
      return { success: true, user: mockSettings.user, role: mockSettings.role };
    }

    try {
      const targetUrl = url || CONFIG.ERPNEXT_SERVER_URL;
      const baseUrl = this.resolveUrl(targetUrl);
      
      // Perform standard session-based login using POST to /api/method/login
      const response = await fetch(`${baseUrl}/api/method/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usr: usernameOrKey,
          pwd: passwordOrSecret
        })
      });

      if (!response.ok) {
        throw new Error('Connection failed: Invalid credentials or URL is unreachable.');
      }

      const loginRes = await response.json();
      
      // Now fetch user details using the session
      const userRes = await fetch(`${baseUrl}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!userRes.ok) {
        throw new Error('Failed to retrieve user session details.');
      }

      const resData = await userRes.json();
      const userEmail = resData.message;

      // Try fetching profile details
      let fullName = userEmail;
      try {
        const profileRes = await fetch(`${baseUrl}/api/resource/User/${userEmail}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          fullName = profileData.data.full_name || userEmail;
        }
      } catch (err) {
        console.warn('Profile fetch failed, using email instead', err);
      }

      const settings = {
        isLive: true,
        url: targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl, // store original url
        username: usernameOrKey,
        password: passwordOrSecret,
        apiKey: '',
        apiSecret: '',
        connected: true,
        user: fullName,
        role: 'ERPNext Administrator'
      };

      this.setConnectionSettings(settings);
      return { success: true, user: fullName, role: settings.role };
    } catch (error) {
      console.error('ERPNext login error:', error);
      return { success: false, message: error.message };
    }
  }

  logout() {
    this.setConnectionSettings({ isLive: false, url: CONFIG.ERPNEXT_SERVER_URL, apiKey: '', apiSecret: '', username: '', password: '', connected: false });
  }

  // Generic Fetch wrapper
  async fetchERP(doctype, options = {}) {
    if (!this.connection.isLive) return null;

    const { url } = this.connection;
    const baseUrl = this.resolveUrl(url);
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const auth = this.getAuthHeader();
    if (auth) headers['Authorization'] = auth;

    let queryParams = '';
    if (options.filters) queryParams += `&filters=${encodeURIComponent(JSON.stringify(options.filters))}`;
    if (options.fields) queryParams += `&fields=${encodeURIComponent(JSON.stringify(options.fields))}`;
    if (options.limit) queryParams += `&limit_page_length=${options.limit}`;
    if (options.start) queryParams += `&limit_start=${options.start}`;
    if (options.order_by) queryParams += `&order_by=${options.order_by}`;

    const fetchUrl = `${baseUrl}/api/resource/${doctype}?${queryParams.substring(1)}`;

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`ERPNext API Error: ${response.statusText}`);
    }

    const res = await response.json();
    return res.data;
  }

  // Generic Create / Update / Delete wrapper
  async makeRequest(method, doctype, docname = '', body = null) {
    if (!this.connection.isLive) return null;

    const { url } = this.connection;
    const baseUrl = this.resolveUrl(url);
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const auth = this.getAuthHeader();
    if (auth) headers['Authorization'] = auth;

    const fetchUrl = docname 
      ? `${baseUrl}/api/resource/${doctype}/${encodeURIComponent(docname)}`
      : `${baseUrl}/api/resource/${doctype}`;

    const response = await fetch(fetchUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.exception || `ERPNext Request Failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Fetch Work Orders (Paginated)
  async getWorkOrders(limit = 20, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Work Order', {
          fields: ['name', 'production_item', 'qty', 'produced_qty', 'planned_start_date', 'status', 'bom_no'],
          limit,
          start,
          order_by: 'creation desc'
        });
        
        if (res && res.length > 0) {
          return res.map(wo => ({
            id: wo.name,
            product: wo.production_item,
            item: wo.production_item,
            quantity: Number(wo.qty || 0),
            produced: Number(wo.produced_qty || 0),
            plannedStart: wo.planned_start_date || '',
            status: wo.status === 'Submitted' ? 'Pending' : (wo.status === 'Not Started' ? 'Pending' : wo.status),
            bomNo: wo.bom_no || '',
            lineNo: 'Filling Line 1', // Default map
            batchSize: Number(wo.qty || 0),
            jobCards: [] // Filled in locally or mock
          }));
        }
        return [];
      } catch (e) {
        console.error('Failed to fetch Work Orders from ERPNext:', e);
        throw e;
      }
    }
    return null;
  }

  // Create Work Order
  async createWorkOrder(woData) {
    if (this.connection.isLive) {
      try {
        let operations = [];
        try {
          const bomRes = await this.makeRequest('GET', 'BOM', woData.bomNo);
          if (bomRes && bomRes.data && bomRes.data.operations) {
            operations = bomRes.data.operations.map(op => ({
              operation: op.operation,
              workstation: op.workstation,
              time_in_mins: Number(op.time_in_mins || 1.0)
            }));
          }
        } catch (bomErr) {
          console.warn('Failed to fetch BOM operations for Work Order creation:', bomErr);
        }

        const payload = {
          production_item: woData.product,
          qty: woData.quantity,
          planned_start_date: woData.plannedStart.replace(' ', 'T'),
          bom_no: woData.bomNo,
          company: woData.company || "Anantdv (Demo)",
          wip_warehouse: woData.wipWarehouse || "Work In Progress - AD",
          source_warehouse: woData.sourceWarehouse || "Stores - AD",
          fg_warehouse: woData.fgWarehouse || "Finished Goods - AD",
          operations: operations,
          docstatus: 1
        };
        const response = await this.makeRequest('POST', 'Work Order', '', payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error('Failed to create Work Order on ERPNext:', e);
        throw e;
      }
    }
    return { success: true, name: `MFG-WO-2026-${Date.now().toString().slice(-5)}` };
  }

  // Create Stock Entry (Material Transfer for Manufacture)
  async createStockEntry(seData) {
    if (this.connection.isLive) {
      try {
        console.log("STOCK ENTRY DATA", seData);
        console.log("WORK ORDER SENT", seData.workOrder);
        const payload = {
          stock_entry_type: "Material Transfer for Manufacture",
          work_order: seData.workOrder,
          company: seData.company || "Anantdv (Demo)",
          posting_date: seData.postingDate,
          posting_time: seData.postingTime,
          docstatus: 1, // Submitted
          items: seData.items.map(item => ({
            item_code: item.code,
            qty: Number(item.qty),
            s_warehouse: item.sourceWarehouse || seData.sourceWarehouse || "Stores - AD",
            t_warehouse: item.targetWarehouse || seData.targetWarehouse || "Work In Progress - AD",
            uom: item.unit,
            stock_uom: item.unit
          }))
        };
        const response = await this.makeRequest('POST', 'Stock Entry', '', payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error('Failed to create Stock Entry on ERPNext:', e);
        throw e;
      }
    }
    return { success: true, name: `MAT-STE-2026-${Date.now().toString().slice(-5)}` };
  }

  // Fetch items filtered by Finished Goods group
  async getFinishedGoods(limit = 100) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Item', {
          fields: ['name', 'item_code', 'item_name', 'item_group', 'stock_uom'],
          filters: [
            ['item_group', '=', 'Finished Goods']
          ],
          limit
        });
        if (res && res.length > 0) {
          return res.map(item => ({
            code: item.item_code || item.name,
            name: item.item_name || item.name,
            unit: item.stock_uom || 'Nos'
          }));
        }
        return [];
      } catch (e) {
        console.error('Failed to fetch Finished Goods from ERPNext:', e);
        return [];
      }
    }
    return null;
  }

  // Fetch BOMs for specific production item
  async getBOMsForItem(itemCode, limit = 50) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('BOM', {
          fields: ['name', 'item', 'is_active'],
          filters: [
            ['item', '=', itemCode],
            ['is_active', '=', 1]
          ],
          limit
        });
        if (res && res.length > 0) {
          return res.map(bom => ({
            id: bom.name,
            name: bom.name,
            productName: bom.item,
            active: bom.is_active || 1
          }));
        }
        return [];
      } catch (e) {
        console.error(`Failed to fetch BOMs for ${itemCode} from ERPNext:`, e);
        return [];
      }
    }
    return [];
  }

  // Fetch BOM operations dynamically
  async getBOMOperations(bomId) {
    if (this.connection.isLive) {
      try {
        const res = await this.makeRequest('GET', 'BOM', bomId);
        if (res && res.data && res.data.operations && res.data.operations.length > 0) {
          return res.data.operations.map((op, idx) => ({
            id: op.name || `op-${idx}-${Date.now()}`,
            operation: op.operation,
            station: op.workstation || 'General Station',
            status: 'Not Started',
            operator: '',
            remarks: '',
            remarksList: []
          }));
        }
      } catch (e) {
        console.error(`Failed to fetch operations for BOM ${bomId}:`, e);
      }
    }
    return null;
  }

  // Update Work Order
  async updateWorkOrder(woId, updateData) {
    if (this.connection.isLive) {
      try {
        const payload = {};
        if (updateData.produced !== undefined) payload.produced_qty = updateData.produced;
        if (updateData.quantity !== undefined) payload.qty = updateData.quantity;

        if (Object.keys(payload).length > 0) {
          const response = await this.makeRequest('PUT', 'Work Order', woId, payload);
          return { success: true, data: response?.data };
        }
        return { success: true };
      } catch (e) {
        console.error('Failed to update Work Order on ERPNext:', e);
        throw e;
      }
    }
    return { success: true };
  }

  // Delete Work Order
  async deleteWorkOrder(woId) {
    if (this.connection.isLive) {
      try {
        await this.makeRequest('DELETE', 'Work Order', woId);
        return { success: true };
      } catch (e) {
        console.error('Failed to delete Work Order on ERPNext:', e);
        throw e;
      }
    }
    return { success: true };
  }

  // Push work order updates to ERPNext (if connected)
  async syncWorkOrderToERP(workOrder) {
    return this.updateWorkOrder(workOrder.id, workOrder);
  }

  // Push Job Card status to ERPNext
  async syncJobCardToERP(jobCardId, status, remarks = '') {
    if (!this.connection.isLive) return { success: true, localOnly: true };

    try {
      let erpStatus = 'Open';
      if (status === 'In Progress') erpStatus = 'Work In Progress';
      if (status === 'Paused') erpStatus = 'On Hold';
      if (status === 'Completed') erpStatus = 'Completed';

      const payload = {
        status: erpStatus,
        remarks: remarks
      };

      await this.makeRequest('PUT', 'Job Card', jobCardId, payload);

      if (remarks) {
        try {
          const lines = remarks.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const commentPayload = {
            comment_doctype: 'Job Card',
            comment_docname: jobCardId,
            content: lastLine || remarks,
            comment_by: this.connection.username || 'operator'
          };
          await this.makeRequest('POST', 'Comment', '', commentPayload);
        } catch (commentErr) {
          console.warn('Failed to post comment to Job Card:', commentErr);
        }
      }

      return { success: true };
    } catch (e) {
      console.error('Failed to sync Job Card to ERPNext:', e);
      return { success: false, error: e.message };
    }
  }

  // Push stock updates to ERPNext (if connected)
  async syncStockToERP(itemCode, currentQty) {
    if (!this.connection.isLive) return { success: true, localOnly: true };

    try {
      const payload = {
        item_code: itemCode,
        warehouse: "Finished Goods - CWFL",
        qty: currentQty
      };
      await this.makeRequest('POST', 'Stock Reconciliation', '', {
        purpose: 'Stock Reconciliation',
        items: [payload]
      });
      return { success: true };
    } catch (e) {
      console.warn('Failed to push stock update to ERPNext (Reconciliation schema may differ):', e);
      return { success: false, error: e.message };
    }
  }

  // Fetch Employees for operator select matching keywords
  async getEmployees(searchQuery = '', limit = 50) {
    if (this.connection.isLive) {
      try {
        const filters = searchQuery ? [['employee_name', 'like', `%${searchQuery}%`]] : undefined;
        const res = await this.fetchERP('Employee', {
          fields: ['name', 'employee_name', 'gender', 'date_of_birth', 'designation', 'status', 'image', 'department', 'company_email', 'personal_email', 'date_of_joining'],
          filters,
          limit
        });
        return res || [];
      } catch (e) {
        console.error('Failed to fetch Employees from ERPNext:', e);
        return [];
      }
    }
    // Mock employees for simulation
    const mockEmployees = [
      { name: 'EMP-00001', employee_name: 'S. Prasad', gender: 'Male', date_of_birth: '1985-05-12', designation: 'Mixing Operator', status: 'Active' },
      { name: 'EMP-00002', employee_name: 'A. Naidu', gender: 'Female', date_of_birth: '1990-08-22', designation: 'Lab Technician', status: 'Active' },
      { name: 'EMP-00003', employee_name: 'K. Kumar', gender: 'Male', date_of_birth: '1988-12-05', designation: 'Packer', status: 'Active' },
      { name: 'EMP-00004', employee_name: 'L. Chaudhry', gender: 'Female', date_of_birth: '1992-03-15', designation: 'Supervisor', status: 'Active' },
      { name: 'EMP-00005', employee_name: 'R. Singh', gender: 'Male', date_of_birth: '1987-11-20', designation: 'Maintenance Engineer', status: 'Active' },
      { name: 'EMP-00006', employee_name: 'M. Fiji', gender: 'Male', date_of_birth: '1995-07-02', designation: 'Plant Operator', status: 'Active' },
      { name: 'EMP-00007', employee_name: 'Amit Patel', gender: 'Male', date_of_birth: '1983-09-25', designation: 'Forklift Operator', status: 'Active' },
      { name: 'EMP-00008', employee_name: 'Bila Ravu', gender: 'Male', date_of_birth: '1991-01-30', designation: 'QC Inspector', status: 'Active' },
      { name: 'EMP-00009', employee_name: 'David Prasad', gender: 'Male', date_of_birth: '1989-06-18', designation: 'Shift lead', status: 'Active' },
      { name: 'EMP-00010', employee_name: 'Elena Whippy', gender: 'Female', date_of_birth: '1994-02-14', designation: 'HR Assistant', status: 'Active' },
      { name: 'EMP-00011', employee_name: 'Fariq Ali', gender: 'Male', date_of_birth: '1992-10-08', designation: 'Store Keeper', status: 'Active' },
      { name: 'EMP-00012', employee_name: 'Grace Lal', gender: 'Female', date_of_birth: '1993-04-04', designation: 'Administrative Assistant', status: 'Active' }
    ];
    if (searchQuery) {
      return mockEmployees.filter(emp => emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, limit);
    }
    return mockEmployees.slice(0, limit);
  }

  // Fetch BOMs (Paginated)
  async getBOMs(limit = 20, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('BOM', {
          fields: ['name', 'item', 'is_active'],
          limit,
          start,
          order_by: 'creation desc'
        });
        if (res && res.length > 0) {
          return res.map(bom => ({
            id: bom.name,
            name: bom.name,
            productName: bom.item,
            active: bom.is_active || 1,
            materials: []
          }));
        }
        return [];
      } catch (e) {
        console.error('Failed to fetch BOMs from ERPNext:', e);
        throw e;
      }
    }
    return null;
  }

  // Fetch BOM Details (raw materials)
  async getBOMDetails(bomId) {
    if (this.connection.isLive) {
      try {
        const res = await this.makeRequest('GET', 'BOM', bomId);
        if (res && res.data && res.data.items) {
          return res.data.items.map(item => ({
            code: item.item_code,
            name: item.item_name,
            qty: Number(item.qty || 0),
            unit: item.uom || 'Qty'
          }));
        }
      } catch (e) {
        console.error(`Failed to fetch BOM details for ${bomId}:`, e);
      }
    }
  }

  // Fetch Items (Paginated)
  async getItems(limit = 20, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Item', {
          fields: ['name', 'item_code', 'item_name', 'item_group', 'stock_uom', 'safety_stock'],
          limit,
          start,
          order_by: 'creation desc'
        });
        if (res && res.length > 0) {
          return res.map(item => ({
            code: item.item_code || item.name,
            name: item.item_name || item.name,
            category: item.item_group === 'Finished Goods' ? 'Finished Goods' : (item.item_group === 'Sub Assembly' || item.item_group === 'Raw Material' ? 'Raw Material' : 'Packaging'),
            qty: 0,
            unit: item.stock_uom || 'Nos',
            minLevel: Number(item.safety_stock || 100)
          }));
        }
        return [];
      } catch (e) {
        console.error('Failed to fetch Items from ERPNext:', e);
        throw e;
      }
    }
  }

  // Fetch Bin quantities for item codes
  async getBinQuantities(itemCodes) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Bin', {
          fields: ['item_code', 'warehouse', 'actual_qty'],
          filters: [
            ['item_code', 'in', itemCodes]
          ],
          limit: 100
        });
        return res || [];
      } catch (e) {
        console.error('Failed to fetch Bin quantities from ERPNext:', e);
        return [];
      }
    }
    return [];
  }

  // Fetch Daily Preventative Maintenance Schedules
  async getMaintenanceSchedules(limit = 100, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Daily Preventative Maintenance Schedule', {
          fields: ['name', 'template_id', 'equipment', 'area', 'week_no', 'from_date', 'to_date', 'operator', 'supervisor', 'checkgrid', 'remarks', 'total_checked', 'max_possible', 'creation'],
          limit,
          start,
          order_by: 'creation desc'
        });
        if (res && res.length > 0) {
          return res.map(rec => {
            let checkgrid = {};
            let remarks = {};
            try { checkgrid = JSON.parse(rec.checkgrid || '{}'); } catch {}
            try { remarks = JSON.parse(rec.remarks || '{}'); } catch {}
            return {
              id: rec.name,
              templateId: rec.template_id,
              equipment: rec.equipment,
              area: rec.area,
              name: rec.equipment,
              weekNo: rec.week_no,
              fromDate: rec.from_date,
              toDate: rec.to_date,
              operator: rec.operator,
              supervisor: rec.supervisor,
              checkgrid,
              remarks,
              totalChecked: Number(rec.total_checked || 0),
              maxPossible: Number(rec.max_possible || 0),
              timestamp: rec.creation ? rec.creation.replace('T', ' ').substring(0, 19) : ''
            };
          });
        }
        return [];
      } catch (e) {
        console.error('Failed to fetch Daily Preventative Maintenance Schedules from ERPNext:', e);
        return [];
      }
    }
    return null;
  }

  // Create Daily Preventative Maintenance Schedule
  async createMaintenanceSchedule(scheduleData) {
    if (this.connection.isLive) {
      try {
        const payload = {
          template_id: scheduleData.templateId,
          equipment: scheduleData.equipment,
          area: scheduleData.area,
          week_no: scheduleData.weekNo,
          from_date: scheduleData.fromDate,
          to_date: scheduleData.toDate,
          operator: scheduleData.operator,
          supervisor: scheduleData.supervisor,
          checkgrid: JSON.stringify(scheduleData.checkgrid || {}),
          remarks: JSON.stringify(scheduleData.remarks || {}),
          total_checked: scheduleData.totalChecked,
          max_possible: scheduleData.maxPossible
        };
        const response = await this.makeRequest('POST', 'Daily Preventative Maintenance Schedule', '', payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error('Failed to create Daily Preventative Maintenance Schedule on ERPNext:', e);
        throw e;
      }
    }
    return { success: true, name: `MAINT-${Date.now().toString().slice(-6)}` };
  }

  // Fetch Job Cards for a Work Order
  async getJobCardsForWorkOrder(workOrderId) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Job Card', {
          fields: ['name', 'operation', 'workstation', 'status', 'remarks', 'for_quantity'],
          filters: [
            ['work_order', '=', workOrderId]
          ],
          limit: 100
        });

        if (res && res.length > 0) {
          return res.map(jc => {
            let appStatus = 'Not Started';
            if (jc.status === 'Work In Progress' || jc.status === 'Work in Progress') appStatus = 'In Progress';
            else if (jc.status === 'On Hold') appStatus = 'Paused';
            else if (jc.status === 'Completed') appStatus = 'Completed';

            return {
              id: jc.name,
              operation: jc.operation,
              station: jc.workstation,
              status: appStatus,
              operator: '', 
              remarks: jc.remarks || '',
              remarksList: jc.remarks ? [{ timestamp: '', operator: 'System', text: jc.remarks }] : []
            };
          });
        }
      } catch (e) {
        console.error(`Failed to fetch Job Cards for Work Order ${workOrderId}:`, e);
      }
    }
    return null;
  }

  // Fetch Sales Invoices
  async getSalesInvoices(limit = 20, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Sales Invoice', {
          fields: ['name', 'customer', 'posting_date', 'posting_time', 'due_date', 'grand_total', 'status', 'docstatus'],
          limit,
          start,
          order_by: 'creation desc'
        });
        return res || [];
      } catch (e) {
        console.error('Failed to fetch Sales Invoices from ERPNext:', e);
        throw e;
      }
    }
    // Mock Sales Invoices
    const mockInvoices = [
      { name: 'ACC-SINV-2026-00001', customer: 'Fiji Retailers Ltd', posting_date: '2026-06-01', posting_time: '10:30:00', due_date: '2026-07-01', grand_total: 1250.00, status: 'Unpaid', docstatus: 1 },
      { name: 'ACC-SINV-2026-00002', customer: 'Suva Distributors', posting_date: '2026-06-02', posting_time: '11:15:00', due_date: '2026-07-02', grand_total: 3400.50, status: 'Paid', docstatus: 1 },
      { name: 'ACC-SINV-2026-00003', customer: 'Island Resort Group', posting_date: '2026-06-03', posting_time: '14:20:00', due_date: '2026-07-03', grand_total: 980.00, status: 'Draft', docstatus: 0 },
      { name: 'ACC-SINV-2026-00004', customer: 'Nadi Supermarket', posting_date: '2026-06-04', posting_time: '09:00:00', due_date: '2026-07-04', grand_total: 5120.00, status: 'Unpaid', docstatus: 1 }
    ];
    return mockInvoices.slice(start, start + limit);
  }

  // Fetch Sales Invoice Details
  async getSalesInvoiceDetails(invoiceId) {
    if (this.connection.isLive) {
      try {
        const res = await this.makeRequest('GET', 'Sales Invoice', invoiceId);
        return res?.data;
      } catch (e) {
        console.error(`Failed to fetch Sales Invoice ${invoiceId}:`, e);
        throw e;
      }
    }
    // Mock invoice details
    return {
      name: invoiceId,
      customer: invoiceId.endsWith('01') ? 'Fiji Retailers Ltd' : invoiceId.endsWith('02') ? 'Suva Distributors' : invoiceId.endsWith('03') ? 'Island Resort Group' : 'Nadi Supermarket',
      posting_date: '2026-06-01',
      posting_time: '10:30:00',
      due_date: '2026-07-01',
      grand_total: 1250.00,
      net_total: 1100.00,
      total_taxes_and_charges: 150.00,
      status: 'Unpaid',
      docstatus: 1,
      items: [
        { item_code: 'IC-500ML-PET', item_name: 'Island Chill 500ml PET', qty: 50, rate: 12.00, amount: 600.00, warehouse: 'Finished Goods - CWFL' },
        { item_code: 'IC-1L-PET', item_name: 'Island Chill 1L PET', qty: 25, rate: 20.00, amount: 500.00, warehouse: 'Finished Goods - CWFL' }
      ]
    };
  }

  // Create Sales Invoice
  async createSalesInvoice(invoiceData) {
    if (this.connection.isLive) {
      try {
        const payload = {
          customer: invoiceData.customer,
          posting_date: invoiceData.postingDate,
          due_date: invoiceData.dueDate || invoiceData.postingDate,
          company: invoiceData.company || "Anantdv (Demo)",
          docstatus: invoiceData.docstatus || 1, // 0 for Draft, 1 for Submitted
          items: invoiceData.items.map(item => ({
            item_code: item.code,
            qty: Number(item.qty),
            rate: Number(item.rate),
            warehouse: item.warehouse || "Finished Goods - AD"
          }))
        };
        const response = await this.makeRequest('POST', 'Sales Invoice', '', payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error('Failed to create Sales Invoice on ERPNext:', e);
        throw e;
      }
    }
    return { success: true, name: `ACC-SINV-2026-${Date.now().toString().slice(-5)}` };
  }

  // Amend/Update Sales Invoice
  async amendSalesInvoice(invoiceId, invoiceData) {
    if (this.connection.isLive) {
      try {
        // In ERPNext, to amend a submitted document, you cancel the old one and create a new amended one.
        // For simplicity, we perform a standard PUT if updating a Draft, or simulate cancellation/amendment
        const payload = {
          customer: invoiceData.customer,
          posting_date: invoiceData.postingDate,
          due_date: invoiceData.dueDate,
          items: invoiceData.items.map(item => ({
            item_code: item.code,
            qty: Number(item.qty),
            rate: Number(item.rate),
            warehouse: item.warehouse || "Finished Goods - AD"
          }))
        };
        const response = await this.makeRequest('PUT', 'Sales Invoice', invoiceId, payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error(`Failed to amend Sales Invoice ${invoiceId}:`, e);
        throw e;
      }
    }
    return { success: true, name: invoiceId };
  }

  // Fetch Delivery Notes
  async getDeliveryNotes(limit = 20, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Delivery Note', {
          fields: ['name', 'customer', 'posting_date', 'posting_time', 'grand_total', 'status', 'docstatus'],
          limit,
          start,
          order_by: 'creation desc'
        });
        return res || [];
      } catch (e) {
        console.error('Failed to fetch Delivery Notes from ERPNext:', e);
        throw e;
      }
    }
    // Mock Delivery Notes
    const mockNotes = [
      { name: 'MAT-DN-2026-00001', customer: 'Fiji Retailers Ltd', posting_date: '2026-06-01', posting_time: '10:30:00', grand_total: 1100.00, status: 'To Bill', docstatus: 1 },
      { name: 'MAT-DN-2026-00002', customer: 'Suva Distributors', posting_date: '2026-06-02', posting_time: '11:15:00', grand_total: 3000.00, status: 'Completed', docstatus: 1 },
      { name: 'MAT-DN-2026-00003', customer: 'Island Resort Group', posting_date: '2026-06-03', posting_time: '14:20:00', grand_total: 800.00, status: 'Draft', docstatus: 0 }
    ];
    return mockNotes.slice(start, start + limit);
  }

  // Fetch Delivery Note Details
  async getDeliveryNoteDetails(noteId) {
    if (this.connection.isLive) {
      try {
        const res = await this.makeRequest('GET', 'Delivery Note', noteId);
        return res?.data;
      } catch (e) {
        console.error(`Failed to fetch Delivery Note ${noteId}:`, e);
        throw e;
      }
    }
    // Mock Delivery Note details
    return {
      name: noteId,
      customer: noteId.endsWith('01') ? 'Fiji Retailers Ltd' : noteId.endsWith('02') ? 'Suva Distributors' : 'Island Resort Group',
      posting_date: '2026-06-01',
      posting_time: '10:30:00',
      grand_total: 1100.00,
      status: 'To Bill',
      docstatus: 1,
      items: [
        { item_code: 'IC-500ML-PET', item_name: 'Island Chill 500ml PET', qty: 50, rate: 12.00, amount: 600.00, warehouse: 'Finished Goods - CWFL' },
        { item_code: 'IC-1L-PET', item_name: 'Island Chill 1L PET', qty: 25, rate: 20.00, amount: 500.00, warehouse: 'Finished Goods - CWFL' }
      ]
    };
  }

  // Create Delivery Note
  async createDeliveryNote(noteData) {
    if (this.connection.isLive) {
      try {
        const payload = {
          customer: noteData.customer,
          posting_date: noteData.postingDate,
          company: noteData.company || "Anantdv (Demo)",
          docstatus: noteData.docstatus || 1,
          items: noteData.items.map(item => ({
            item_code: item.code,
            qty: Number(item.qty),
            rate: Number(item.rate),
            warehouse: item.warehouse || "Finished Goods - AD"
          }))
        };
        const response = await this.makeRequest('POST', 'Delivery Note', '', payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error('Failed to create Delivery Note on ERPNext:', e);
        throw e;
      }
    }
    return { success: true, name: `MAT-DN-2026-${Date.now().toString().slice(-5)}` };
  }

  // Amend/Update Delivery Note
  async amendDeliveryNote(noteId, noteData) {
    if (this.connection.isLive) {
      try {
        const payload = {
          customer: noteData.customer,
          posting_date: noteData.postingDate,
          items: noteData.items.map(item => ({
            item_code: item.code,
            qty: Number(item.qty),
            rate: Number(item.rate),
            warehouse: item.warehouse || "Finished Goods - AD"
          }))
        };
        const response = await this.makeRequest('PUT', 'Delivery Note', noteId, payload);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error(`Failed to amend Delivery Note ${noteId}:`, e);
        throw e;
      }
    }
    return { success: true, name: noteId };
  }

  // Fetch Customers for autocomplete
  async getCustomers(searchQuery = '', limit = 50) {
    if (this.connection.isLive) {
      try {
        const filters = searchQuery ? [['customer_name', 'like', `%${searchQuery}%`]] : undefined;
        const res = await this.fetchERP('Customer', {
          fields: ['name', 'customer_name'],
          filters,
          limit
        });
        return res || [];
      } catch (e) {
        console.error('Failed to fetch Customers from ERPNext:', e);
        return [];
      }
    }
    // Mock Customers
    const mockCustomers = [
      { name: 'CUST-00001', customer_name: 'Fiji Retailers Ltd' },
      { name: 'CUST-00002', customer_name: 'Suva Distributors' },
      { name: 'CUST-00003', customer_name: 'Island Resort Group' },
      { name: 'CUST-00004', customer_name: 'Nadi Supermarket' },
      { name: 'CUST-00005', customer_name: 'MH Supermarkets Fiji' }
    ];
    if (searchQuery) {
      return mockCustomers.filter(c => c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return mockCustomers;
  }

  // Fetch Items for child table autocomplete lookup
  async getItemsSearch(searchQuery = '', limit = 50) {
    if (this.connection.isLive) {
      try {
        const filters = searchQuery ? [
          ['item_code', 'like', `%${searchQuery}%`]
        ] : undefined;
        const res = await this.fetchERP('Item', {
          fields: ['name', 'item_code', 'item_name', 'stock_uom'],
          filters,
          limit
        });
        return res ? res.map(i => ({ code: i.item_code, name: i.item_name, unit: i.stock_uom })) : [];
      } catch (e) {
        console.error('Failed to fetch Items search from ERPNext:', e);
        return [];
      }
    }
    const mockItems = [
      { code: 'IC-500ML-PET', name: 'Island Chill 500ml PET', unit: 'Box' },
      { code: 'IC-1L-PET', name: 'Island Chill 1L PET', unit: 'Box' },
      { code: 'RUM-COLA-500', name: 'RUM Cola 500ml Can', unit: 'Box' },
      { code: 'RUM-COLA-330', name: 'RUM Cola 330ml Can', unit: 'Box' }
    ];
    if (searchQuery) {
      return mockItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return mockItems;
  }

  // Fetch Item Price list rate
  async getItemPrice(itemCode) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP('Item Price', {
          fields: ['price_list_rate'],
          filters: [
            ['item_code', '=', itemCode],
            ['price_list', '=', 'Standard Selling']
          ],
          limit: 1
        });
        if (res && res.length > 0) {
          return Number(res[0].price_list_rate || 0);
        }
      } catch (e) {
        console.warn(`Failed to fetch price list rate for ${itemCode} from ERPNext:`, e);
      }
    }
    // Mock prices
    const prices = {
      'IC-500ML-PET': 12.00,
      'IC-1L-PET': 20.00,
      'RUM-COLA-500': 15.50,
      'RUM-COLA-330': 11.20
    };
    return prices[itemCode] || 10.00;
  }

  // Fetch Warehouses for autocomplete lookup
  async getWarehouses(searchQuery = '', limit = 50) {
    if (this.connection.isLive) {
      try {
        const filters = searchQuery ? [['warehouse_name', 'like', `%${searchQuery}%`]] : undefined;
        const res = await this.fetchERP('Warehouse', {
          fields: ['name', 'warehouse_name'],
          filters,
          limit
        });
        return res || [];
      } catch (e) {
        console.error('Failed to fetch Warehouses from ERPNext:', e);
        return [];
      }
    }
    // Mock Warehouses
    const mockWarehouses = [
      { name: 'Finished Goods - CWFL', warehouse_name: 'Finished Goods - CWFL' },
      { name: 'Raw Materials - CWFL', warehouse_name: 'Raw Materials - CWFL' },
      { name: 'Stores - AD', warehouse_name: 'Stores - AD' },
      { name: 'Work In Progress - AD', warehouse_name: 'Work In Progress - AD' }
    ];
    if (searchQuery) {
      return mockWarehouses.filter(w => w.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return mockWarehouses;
  }

  // Create custom Cleaning and Sanitation log record
  async createCleaningSanitationRecord(doctype, data) {
    if (this.connection.isLive) {
      try {
        const response = await this.makeRequest('POST', doctype, '', {
          ...data,
          docstatus: 1
        });
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error(`Failed to create ${doctype} on ERPNext:`, e);
        throw e;
      }
    }
    return { success: true, name: `CS-${doctype.replace(/\s+/g, '-').slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}` };
  }

  // Fetch past logs for custom Cleaning and Sanitation DocTypes
  async getCleaningSanitationRecords(doctype, limit = 50, start = 0) {
    if (this.connection.isLive) {
      try {
        const res = await this.fetchERP(doctype, {
          fields: ['*'],
          limit,
          start,
          order_by: 'creation desc'
        });
        return res || [];
      } catch (e) {
        console.error(`Failed to fetch ${doctype} from ERPNext:`, e);
        throw e;
      }
    }
    return null;
  }

  // Update/amend custom Cleaning and Sanitation log record
  async updateCleaningSanitationRecord(doctype, name, data) {
    if (this.connection.isLive) {
      try {
        const response = await this.makeRequest('PUT', doctype, name, data);
        return { success: true, name: response.data.name };
      } catch (e) {
        console.error(`Failed to update ${doctype} on ERPNext:`, e);
        throw e;
      }
    }
    return { success: true, name };
  }

  // Delete custom Cleaning and Sanitation log record
  async deleteCleaningSanitationRecord(doctype, name) {
    if (this.connection.isLive) {
      try {
        await this.makeRequest('DELETE', doctype, name);
        return { success: true };
      } catch (e) {
        console.error(`Failed to delete ${doctype} from ERPNext:`, e);
        throw e;
      }
    }
    return { success: true };
  }
}

export const frappe = new FrappeService();


