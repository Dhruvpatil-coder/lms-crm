import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import filterConfig from '../../utils/filterConfig';

const ROLES = [
  { val:'admin',label:'Admin',icon:'A',color:'bg-violet-100 text-violet-700 border-violet-200'},
  { val:'manager',label:'Manager',icon:'M',color:'bg-amber-100 text-amber-700 border-amber-200'},
  { val:'hr',label:'Placement',icon:'P',color:'bg-blue-100 text-blue-700 border-blue-200'},
  { val:'trainer',label:'Trainer',icon:'T',color:'bg-green-100 text-green-700 border-green-200'}
];
const DISTRICTS = filterConfig.getFilter('DISTRICTS');
const EMPTY = { name:'', email:'', password:'', role:'hr', phone:'', district:'' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const F = f => setForm(p => ({...p,...f}));

  const load = () => api.get('/api/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await api.post('/api/admin/users', form);
      toast.success('User created!'); setModal(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const deactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    await api.delete(`/api/admin/users/${id}`); toast.success('User deactivated'); load();
  };

  const roleCfg = (role) => ROLES.find(r => r.val === role) || ROLES[1];
  const counts = ROLES.reduce((a,r) => ({...a,[r.val]: users.filter(u=>u.role===r.val).length}), {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-sm text-gray-500 mt-0.5">{users.length} active users</p></div>
        <button onClick={() => { setForm(EMPTY); setModal(true); }} className="btn-primary">+ Add User</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {ROLES.map(r => (
          <div key={r.val} className={`rounded-2xl border p-5 text-center ${r.color}`}>
            <div className="text-3xl mb-2">{r.icon}</div>
            <div className="text-3xl font-bold">{counts[r.val]||0}</div>
            <div className="text-sm font-semibold capitalize mt-1">{r.label}s</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">User</th><th className="table-th">Email</th>
              <th className="table-th">Role</th><th className="table-th">District</th>
              <th className="table-th">Phone</th><th className="table-th text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            : users.map(u => {
              const rc = roleCfg(u.role);
              return (
                <tr key={u.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${rc.color}`}>{u.name?.charAt(0)}</div>
                      <span className="font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td"><span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${rc.color}`}>{rc.icon} {u.role}</span></td>
                  <td className="table-td text-gray-500">{u.district||'—'}</td>
                  <td className="table-td text-gray-500">{u.phone||'—'}</td>
                  <td className="table-td text-center">
                    <button onClick={() => deactivate(u.id, u.name)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200">
                      Deactivate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create New User" size="md">
        <div className="space-y-4">
          <div><label className="label">Full Name *</label><input className="input" placeholder="e.g. Priya Sharma" value={form.name} onChange={e=>F({name:e.target.value})} /></div>
          <div><label className="label">Email *</label><input type="email" className="input" placeholder="user@example.com" value={form.email} onChange={e=>F({email:e.target.value})} /></div>
          <div><label className="label">Password *</label><input type="password" className="input" placeholder="Create a strong password" value={form.password} onChange={e=>F({password:e.target.value})} /></div>
          <div>
            <label className="label">Role *</label>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map(r => (
                <button key={r.val} onClick={() => F({role:r.val})}
                  className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${form.role===r.val ? r.color+' border-current shadow-sm' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                  <span className="text-xl">{r.icon}</span>{r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" placeholder="9876543210" value={form.phone} onChange={e=>F({phone:e.target.value})} /></div>
            <div><label className="label">District</label><select className="select" value={form.district} onChange={e=>F({district:e.target.value})}><option value="">Select</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select></div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">Create User</button>
        </div>
      </Modal>
    </div>
  );
}
