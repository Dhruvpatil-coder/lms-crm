import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import KPICard from '../../components/shared/KPICard';
import Modal from '../../components/shared/Modal';
import filterConfig from '../../utils/filterConfig';
import { safeDateStr } from '../../utils/safeDate';

const DISTRICTS = filterConfig.getFilter('DISTRICTS');
const BLOCKS    = filterConfig.getFilter('BLOCKS');
const DOMAINS   = filterConfig.getFilter('DOMAINS');
const REGIONS   = filterConfig.getFilter('REGIONS');

const EMPTY = {
  companyName:'', address:'', district:'', block:'', domain:'',
  contactPerson:'', contactNumber:'', totalVacancies:0,
  urgentHiring:false, nextFollowupDate:'', remarks:'', isNewClient:true, donorId:'',
};

export default function NewClientAcquisition() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats]         = useState({});
  const [donors, setDonors]       = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [filters, setFilters]     = useState({ district:'', block:'', domain:'', region:'', donorId:'' });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const F = f => setForm(p => ({ ...p, ...f }));
  const Filt = f => setFilters(p => ({ ...p, ...f }));

  const load = useCallback(async () => {
    setLoading(true);
    const params = { isNewClient: true, limit: 200, ...filters };
    Object.keys(params).forEach(k => params[k] === '' && delete params[k]);
    const [res, sRes] = await Promise.all([
      api.get('/api/companies/', { params }),
      api.get('/api/companies/stats/summary'),
    ]);
    setCompanies(res.data.data);
    setStats(sRes.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/api/donors/').then(r => setDonors(r.data.data)).catch(() => {}); }, []);

  const save = async () => {
    if (!form.companyName.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      await api.post('/api/companies/', { ...form, isNewClient: true, totalVacancies: +form.totalVacancies || 0 });
      toast.success('New client added!');
      setModal(false);
      setForm(EMPTY);
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const exportExcel = async () => {
    const res = await api.get('/api/companies/export/excel', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    Object.assign(document.createElement('a'), { href: url, download: 'new-clients.xlsx' }).click();
  };

  const importExcel = async (e) => {
    const fd = new FormData(); fd.append('file', e.target.files[0]);
    await api.post('/api/companies/import/excel', fd);
    toast.success('Imported!'); load(); e.target.value = '';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Client Acquisition</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage newly onboarded companies</p>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary flex items-center gap-1.5 cursor-pointer">
            <span>📥</span> Import
            <input type="file" accept=".xlsx" className="hidden" onChange={importExcel} />
          </label>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-1.5"><span>📤</span> Export</button>
          <button onClick={() => { setForm(EMPTY); setModal(true); }} className="btn-primary">
            + Add New Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard title="Added Today"      value={stats.newToday       ?? 0} icon="🌟" color="green"  />
        <KPICard title="Added This Week"  value={stats.newThisWeek    ?? 0} icon="📅" color="blue"   />
        <KPICard title="Added This Month" value={stats.newThisMonth   ?? 0} icon="📆" color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select className="select" value={filters.region} onChange={e => Filt({ region: e.target.value })}>
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select" value={filters.district} onChange={e => Filt({ district: e.target.value })}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.block} onChange={e => Filt({ block: e.target.value })}>
          <option value="">All Blocks</option>
          {BLOCKS.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="select" value={filters.domain} onChange={e => Filt({ domain: e.target.value })}>
          <option value="">All Domains</option>
          {DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.donorId} onChange={e => Filt({ donorId: e.target.value })}>
          <option value="">All Donors</option>
          {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">New Clients</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{companies.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="table-th">Company</th>
                <th className="table-th">Location</th>
                <th className="table-th">Domain</th>
                <th className="table-th">Contact</th>
                <th className="table-th text-center">Vacancies</th>
                <th className="table-th">Added On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-2">⭐</div>
                  No new clients yet. Add the first one!
                </td></tr>
              ) : companies.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-td">
                    <div className="font-semibold text-gray-900">{c.companyName}</div>
                    {c.urgentHiring && <span className="badge-red text-xs mt-0.5 inline-block">🔥 URGENT</span>}
                  </td>
                  <td className="table-td text-xs">
                    <div className="text-gray-700">{c.district}</div>
                    <div className="text-gray-400">{c.block}</div>
                  </td>
                  <td className="table-td"><span className="badge-blue">{c.domain || '—'}</span></td>
                  <td className="table-td text-xs">
                    <div className="font-medium text-gray-800">{c.contactPerson || '—'}</div>
                    <div className="text-gray-400">{c.contactNumber}</div>
                  </td>
                  <td className="table-td text-center font-bold text-gray-900">{c.totalVacancies}</td>
                  <td className="table-td text-xs text-gray-500">
                    {c.createdAt ? safeDateStr(c.createdAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Client" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Company Name *</label>
            <input className="input" placeholder="e.g. TechCorp India" value={form.companyName} onChange={e => F({ companyName: e.target.value })} />
          </div>
          <div>
            <label className="label">Contact Person</label>
            <input className="input" placeholder="Manager name" value={form.contactPerson} onChange={e => F({ contactPerson: e.target.value })} />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" placeholder="9876543210" value={form.contactNumber} onChange={e => F({ contactNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Total Vacancies</label>
            <input type="number" className="input" value={form.totalVacancies} onChange={e => F({ totalVacancies: e.target.value })} />
          </div>
          <div>
            <label className="label">Domain</label>
            <select className="select" value={form.domain} onChange={e => F({ domain: e.target.value })}>
              <option value="">Select Domain</option>
              {DOMAINS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">District</label>
            <select className="select" value={form.district} onChange={e => F({ district: e.target.value })}>
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Block</label>
            <select className="select" value={form.block} onChange={e => F({ block: e.target.value })}>
              <option value="">Select Block</option>
              {BLOCKS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Donor (optional)</label>
            <select className="select" value={form.donorId||''} onChange={e => F({ donorId: e.target.value })}>
              <option value="">No Donor</option>
              {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Next Follow-up Date</label>
            <input type="date" className="input" value={form.nextFollowupDate} onChange={e => F({ nextFollowupDate: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <textarea className="input" rows={2} placeholder="Company address" value={form.address} onChange={e => F({ address: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} placeholder="Any notes about this client..." value={form.remarks} onChange={e => F({ remarks: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => F({ urgentHiring: !form.urgentHiring })}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.urgentHiring ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
              {form.urgentHiring && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm font-medium text-gray-700">🔥 Mark as Hot Hiring</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
