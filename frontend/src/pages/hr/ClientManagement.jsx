import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';
import filterConfig from '../../utils/filterConfig';

const DISTRICTS = filterConfig.getFilter('DISTRICTS');
const BLOCKS    = filterConfig.getFilter('BLOCKS');
const DOMAINS   = filterConfig.getFilter('DOMAINS');
const REGIONS   = filterConfig.getFilter('REGIONS');

const EMPTY = { companyName:'', email:'', address:'', district:'', block:'', domain:'', contactPerson:'', contactNumber:'', totalVacancies:0, nextFollowupDate:'', lastFollowupDate:'', remarks:'', isNewClient:false, urgentHiring:false, donorId:'' };

// INLINE date formatter - no external imports needed
function fmtDate(d) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch { return '—'; }
}

function toInput(d) {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

export default function ClientManagement() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [donors, setDonors]     = useState([]);
  const [modal, setModal]       = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [filters, setFilters]   = useState({ search:'', district:'', block:'', domain:'', region:'', donorId:'' });
  const F = (f) => setForm(p => ({ ...p, ...f }));

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 200 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/api/companies/', { params });
      setCompanies(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(res.data?.total || 0);
    } catch {
      setCompanies([]); setTotal(0);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { api.get('/api/donors/').then(r => setDonors(r.data?.data || [])).catch(() => {}); }, []);

  const openAdd  = () => { setEditData(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = (c) => { setEditData(c); setForm({ ...c, email: c.email || '', lastFollowupDate: toInput(c.lastFollowupDate), nextFollowupDate: toInput(c.nextFollowupDate), donorId: c.donorId || '' }); setModal(true); };

  const save = async () => {
    if (!form.companyName || !form.companyName.trim()) { toast.error('Company Name is required'); return; }
    try {
      const p = { ...form, totalVacancies: Number(form.totalVacancies) || 0 };
      editData ? await api.put(`/api/companies/${editData.id}`, p) : await api.post('/api/companies/', p);
      toast.success(editData ? 'Company updated!' : 'Company added!');
      setModal(false); fetchCompanies();
    } catch { toast.error('Save failed'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    await api.delete(`/api/companies/${id}`); toast.success('Deleted'); fetchCompanies();
  };

  const exportExcel = async () => {
    const res = await api.get('/api/companies/export/excel', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    Object.assign(document.createElement('a'), { href: url, download: 'companies.xlsx' }).click();
  };

  const importExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      await api.post('/api/companies/import/excel', fd);
      toast.success('Companies imported!'); fetchCompanies();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} companies registered</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer flex items-center gap-1.5">
            <span>📥</span> Import
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
          </label>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-1.5"><span>📤</span> Export</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-1.5"><span>+</span> Add Company</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-6 gap-3 shadow-sm">
        <input className="input" placeholder="🔍 Search company..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} />
        <select className="select" value={filters.region} onChange={e => setFilters(f => ({...f, region: e.target.value}))}>
          <option value="">All Regions</option>{REGIONS.map(r=><option key={r}>{r}</option>)}
        </select>
        <select className="select" value={filters.district} onChange={e => setFilters(f => ({...f, district: e.target.value}))}>
          <option value="">All Districts</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.block} onChange={e => setFilters(f => ({...f, block: e.target.value}))}>
          <option value="">All Blocks</option>{BLOCKS.map(b=><option key={b}>{b}</option>)}
        </select>
        <select className="select" value={filters.domain} onChange={e => setFilters(f => ({...f, domain: e.target.value}))}>
          <option value="">All Domains</option>{DOMAINS.map(d=><option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.donorId} onChange={e => setFilters(f => ({...f, donorId: e.target.value}))}>
          <option value="">All Donors</option>{donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => setFilters({ search:'', district:'', block:'', domain:'', region:'', donorId:'' })} className="btn-secondary text-xs col-span-2 md:col-span-1">Clear</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="table-th">Company</th><th className="table-th">Location</th>
                <th className="table-th">Domain</th><th className="table-th">Contact</th>
                <th className="table-th text-center">Vacancies</th>
                <th className="table-th">Next Follow-up</th><th className="table-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"/><span>Loading...</span></div>
                </td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400"><div className="text-4xl mb-2">🏢</div><div>No companies found</div></td></tr>
              ) : companies.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-td">
                    <div className="font-semibold text-gray-900">{c.companyName || '—'}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[160px]">{c.address || ''}</div>
                    {c.email && <div className="text-xs text-blue-500 truncate max-w-[160px]">{c.email}</div>}
                    {c.isNewClient && <span className="badge-green text-xs mt-0.5 inline-block">New</span>}
                    {c.urgentHiring && <span className="badge-red text-xs mt-0.5 inline-block ml-1">🔥 URGENT</span>}
                  </td>
                  <td className="table-td text-xs">{c.district || '—'}<br/><span className="text-gray-400">{c.block || ''}</span></td>
                  <td className="table-td"><span className="badge-blue">{c.domain || '—'}</span></td>
                  <td className="table-td text-xs"><div className="font-medium text-gray-800">{c.contactPerson || '—'}</div><div className="text-gray-400">{c.contactNumber || ''}</div></td>
                  <td className="table-td text-center font-bold text-gray-900">{c.totalVacancies || 0}</td>
                  <td className="table-td text-xs text-gray-500">{c.nextFollowupDate ? fmtDate(c.nextFollowupDate) : '—'}</td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center text-sm">✏️</button>
                      <button onClick={() => del(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center text-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Edit Company' : 'Add New Company'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Company Name *</label><input className="input" value={form.companyName || ''} onChange={e=>F({companyName:e.target.value})} placeholder="e.g. TechCorp India" /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={e=>F({email:e.target.value})} placeholder="company@email.com" /></div>
          <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson || ''} onChange={e=>F({contactPerson:e.target.value})} /></div>
          <div><label className="label">Contact Number</label><input className="input" value={form.contactNumber || ''} onChange={e=>F({contactNumber:e.target.value})} /></div>
          <div><label className="label">Total Vacancies</label><input type="number" className="input" value={form.totalVacancies || 0} onChange={e=>F({totalVacancies:e.target.value})} /></div>
          <div><label className="label">District</label><select className="select" value={form.district || ''} onChange={e=>F({district:e.target.value})}><option value="">Select</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select></div>
          <div><label className="label">Block</label><select className="select" value={form.block || ''} onChange={e=>F({block:e.target.value})}><option value="">Select</option>{BLOCKS.map(b=><option key={b}>{b}</option>)}</select></div>
          <div><label className="label">Domain</label><select className="select" value={form.domain || ''} onChange={e=>F({domain:e.target.value})}><option value="">Select</option>{DOMAINS.map(d=><option key={d}>{d}</option>)}</select></div>
          <div><label className="label">Donor (optional)</label><select className="select" value={form.donorId || ''} onChange={e=>F({donorId:e.target.value})}><option value="">No Donor</option>{donors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="label">Last Follow-up</label><input type="date" className="input" value={form.lastFollowupDate || ''} onChange={e=>F({lastFollowupDate:e.target.value})} /></div>
          <div><label className="label">Next Follow-up</label><input type="date" className="input" value={form.nextFollowupDate || ''} onChange={e=>F({nextFollowupDate:e.target.value})} /></div>
          <div className="md:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ''} onChange={e=>F({address:e.target.value})} /></div>
          <div className="md:col-span-2"><label className="label">Remarks</label><textarea className="input" rows={2} value={form.remarks || ''} onChange={e=>F({remarks:e.target.value})} /></div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form.urgentHiring} onChange={e=>F({urgentHiring:e.target.checked})} className="w-4 h-4 accent-green-600" /><span className="text-sm font-medium text-gray-700">🔥 Urgent Hiring</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form.isNewClient} onChange={e=>F({isNewClient:e.target.checked})} className="w-4 h-4 accent-green-600" /><span className="text-sm font-medium text-gray-700">New Client</span></label>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">Save Company</button>
        </div>
      </Modal>
    </div>
  );
}
