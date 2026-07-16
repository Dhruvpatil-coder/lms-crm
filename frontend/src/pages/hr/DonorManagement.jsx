import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import KPICard from '../../components/shared/KPICard';
import filterConfig from '../../utils/filterConfig';
import { useAuth } from '../../context/AuthContext';

const DISTRICTS = filterConfig.getFilter('DISTRICTS');
const BLOCKS    = filterConfig.getFilter('BLOCKS');
const DOMAINS   = filterConfig.getFilter('DOMAINS');
const REGIONS   = filterConfig.getFilter('REGIONS');

const EMPTY = {
  name:'', organization:'', contactPerson:'', email:'', phone:'',
  district:'', block:'', domain:'',
  date:'', remarks:'', isActive:true, managerId:''
};

const toInput = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

export default function DonorManagement() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isAdmin   = user?.role === 'admin';
  const [donors, setDonors]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editData, setEditData]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [filters, setFilters]     = useState({ search:'', district:'', block:'', domain:'', region:'', isActive:'' });
  const [managers, setManagers] = useState([]);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    const params = { ...filters, limit: 200 };
    Object.keys(params).forEach(k => !params[k] && params[k] !== false && delete params[k]);
    const res = await api.get('/api/donors/', { params });
    setDonors(res.data.data); setTotal(res.data.total);
    setLoading(false);
  }, [filters]);

  const fetchManagers = useCallback(async () => {
    try {
      const res = await api.get('/api/donors/managers');
      setManagers(res.data);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { fetchDonors(); fetchManagers(); }, [fetchDonors, fetchManagers]);

  const F = (f) => setForm(p => ({ ...p, ...f }));
  const Fl = (f) => setFilters(p => ({ ...p, ...f }));

  const openAdd = () => { setEditData(null); setForm(EMPTY); setModal(true); };
  const openEdit = (d) => {
    setEditData(d);
    setForm({ ...d, date: toInput(d.date), managerId: d.managerId || '' });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Donor name is required'); return; }
    try {
      editData ? await api.put(`/api/donors/${editData.id}`, form) : await api.post('/api/donors/', form);
      toast.success(editData ? 'Donor updated!' : 'Donor added!');
      setModal(false); fetchDonors();
    } catch { toast.error('Save failed'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this donor?')) return;
    await api.delete(`/api/donors/${id}`); toast.success('Deleted'); fetchDonors();
  };

  const exportExcel = async () => {
    const res = await api.get('/api/donors/export/excel', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    Object.assign(document.createElement('a'), { href: url, download: 'donors.xlsx' }).click();
  };

  const activeCount = donors.filter(d => d.isActive).length;
  const managerName = (id) => managers.find(m => m.id === id)?.name || '—';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Donor Management</h1>
          <p className="text-sm text-green-700 mt-0.5">{total} donors registered</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100">Export</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white">+ Add Donor</button>
        </div>
      </div>


      {/* Manager Notice */}
      {isManager && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span><strong>Manager View:</strong> You can only see the <strong>Swadesh</strong> donor and donors assigned to you.</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-green-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
          <div className="text-3xl font-bold text-green-900">{total}</div>
          <div className="text-xs text-green-600 font-medium uppercase tracking-wide mt-1">Total Donors</div>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <div className="text-3xl font-bold text-green-900">{activeCount}</div>
          <div className="text-xs text-green-600 font-medium uppercase tracking-wide mt-1">Active Donors</div>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          <div className="text-3xl font-bold text-green-900">{donors.filter(d => d.date && new Date(d.date).getMonth() === new Date().getMonth()).length}</div>
          <div className="text-xs text-green-600 font-medium uppercase tracking-wide mt-1">This Month</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-green-100 p-4 grid grid-cols-2 md:grid-cols-5 gap-3 shadow-sm">
        <input className="input border-green-200 focus:border-green-500 focus:ring-green-100" placeholder="Search donor..." value={filters.search} onChange={e => Fl({ search: e.target.value })} />
        <select className="select border-green-200 focus:border-green-500" value={filters.region} onChange={e => Fl({ region: e.target.value })}>
          <option value="">All Regions</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select border-green-200 focus:border-green-500" value={filters.district} onChange={e => Fl({ district: e.target.value })}>
          <option value="">All Districts</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select border-green-200 focus:border-green-500" value={filters.domain} onChange={e => Fl({ domain: e.target.value })}>
          <option value="">All Domains</option>{DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select border-green-200 focus:border-green-500" value={filters.isActive} onChange={e => Fl({ isActive: e.target.value })}>
          <option value="">All Status</option><option value="true">Active</option><option value="false">Inactive</option>
        </select>
        <button onClick={() => setFilters({ search:'', district:'', block:'', domain:'', region:'', isActive:'' })} className="btn-secondary text-xs col-span-2 md:col-span-1 bg-green-50 text-green-700 hover:bg-green-100">Clear</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-50 to-green-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Donor</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Location</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Domain</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Contact</th>
                {!isManager && <th className="px-5 py-3.5 text-left text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Assigned Manager</th>}
                <th className="px-5 py-3.5 text-center text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Status</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isManager?6:7} className="text-center py-16 text-green-400">
                  <div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/><span className="text-green-600">Loading...</span></div>
                </td></tr>
              ) : donors.length === 0 ? (
                <tr><td colSpan={isManager?6:7} className="text-center py-16 text-green-300"><div className="text-4xl mb-2">No donors found</div></td></tr>
              ) : donors.map(d => (
                <tr key={d.id} className="hover:bg-green-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-green-900">{d.name}</div>
                    <div className="text-xs text-green-400">{d.organization || '—'}</div>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <div className="text-green-800">{d.district}</div>
                    <div className="text-green-400">{d.block}</div>
                  </td>
                  <td className="px-5 py-4"><span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{d.domain || '—'}</span></td>
                  <td className="px-5 py-4 text-xs">
                    <div className="font-medium text-green-800">{d.contactPerson || '—'}</div>
                    <div className="text-green-400">{d.phone || d.email || '—'}</div>
                  </td>
                  {!isManager && (
                    <td className="px-5 py-4 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">
                        {managerName(d.managerId)}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(d)} className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => del(d.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Edit Donor' : 'Add New Donor'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label text-green-700">Donor Name *</label><input className="input border-green-200 focus:border-green-500" value={form.name} onChange={e=>F({name:e.target.value})} placeholder="e.g. Rajesh Foundation" /></div>
          <div><label className="label text-green-700">Organization</label><input className="input border-green-200 focus:border-green-500" value={form.organization} onChange={e=>F({organization:e.target.value})} placeholder="Company / NGO name" /></div>
          <div><label className="label text-green-700">Contact Person</label><input className="input border-green-200 focus:border-green-500" value={form.contactPerson} onChange={e=>F({contactPerson:e.target.value})} placeholder="Name" /></div>
          <div><label className="label text-green-700">Email</label><input type="email" className="input border-green-200 focus:border-green-500" value={form.email} onChange={e=>F({email:e.target.value})} placeholder="email@example.com" /></div>
          <div><label className="label text-green-700">Phone</label><input className="input border-green-200 focus:border-green-500" value={form.phone} onChange={e=>F({phone:e.target.value})} placeholder="9876543210" /></div>
          <div><label className="label text-green-700">District</label>
            <select className="select border-green-200 focus:border-green-500" value={form.district||''} onChange={e=>F({district:e.target.value})}>
              <option value="">Select</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="label text-green-700">Block</label>
            <select className="select border-green-200 focus:border-green-500" value={form.block||''} onChange={e=>F({block:e.target.value})}>
              <option value="">Select</option>{BLOCKS.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label className="label text-green-700">Domain</label>
            <select className="select border-green-200 focus:border-green-500" value={form.domain||''} onChange={e=>F({domain:e.target.value})}>
              <option value="">Select</option>{DOMAINS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="label text-green-700">Date</label><input type="date" className="input border-green-200 focus:border-green-500" value={form.date||''} onChange={e=>F({date:e.target.value})} /></div>

          {/* Manager Assignment — visible to Admin/Placement only */}
          {!isManager && (
            <div><label className="label text-green-700">Assigned Manager</label>
              <select className="select border-green-200 focus:border-green-500" value={form.managerId||''} onChange={e=>F({managerId:e.target.value})}>
                <option value="">— None —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <p className="text-xs text-green-400 mt-1">Manager will see this donor in their list</p>
            </div>
          )}

          <div className="md:col-span-2"><label className="label text-green-700">Remarks</label><textarea className="input border-green-200 focus:border-green-500" rows={2} value={form.remarks||''} onChange={e=>F({remarks:e.target.value})} /></div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={()=>F({isActive:!form.isActive})}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.isActive ? 'bg-green-600 border-green-600' : 'border-green-300'}`}>
              {form.isActive && <span className="text-white text-xs font-bold">&#10003;</span>}
            </div>
            <span className="text-sm font-medium text-green-800">Active Donor</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-green-100">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1 bg-green-50 text-green-700 hover:bg-green-100">Cancel</button>
          <button onClick={save} className="btn-primary flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white">Save Donor</button>
        </div>
      </Modal>
    </div>
  );
}
