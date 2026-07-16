import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';

// All constants defined RIGHT HERE - no external dependencies
const STATUSES = ['Upcoming','Ongoing','Completed','Cancelled'];
const DISTRICTS = ['Patna','Gaya','Muzaffarpur','Bhagalpur','Darbhanga','Nalanda','Vaishali','Other'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const REGIONS = ['Central Bihar','North Bihar','South Bihar','Other'];

const REGION_DISTRICTS = {
  'Central Bihar': ['Patna','Nalanda'],
  'North Bihar': ['Muzaffarpur','Vaishali','Darbhanga'],
  'South Bihar': ['Gaya','Bhagalpur'],
  'Other': ['Other']
};

const STATUS_ICON = { Upcoming:'🗓️', Ongoing:'🟢', Completed:'✅', Cancelled:'❌' };
const STATUS_COLOR = { Upcoming:'bg-blue-50 border-blue-200', Ongoing:'bg-green-50 border-green-200', Completed:'bg-gray-50 border-gray-200', Cancelled:'bg-red-50 border-red-200' };

const EMPTY = { eventName:'', companies:'', district:'', block:'', venue:'', vacancyCount:0, domain:'', startDate:'', endDate:'', coordinator:'', status:'Upcoming' };

function toISO(d) {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch { return '—'; }
}

export default function JobFairManagement() {
  const [fairs, setFairs]       = useState([]);
  const [calFairs, setCalFairs] = useState([]);
  const [modal, setModal]       = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [view, setView]         = useState('list');
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [saving, setSaving]     = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const F = f => setForm(p => ({ ...p, ...f }));

  const loadFairs = async () => {
    try {
      const res = await api.get('/api/jobfairs/');
      setFairs(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setFairs([]);
    }
  };

  const loadCalendar = async () => {
    try {
      const res = await api.get('/api/jobfairs/calendar', { params: { month: calMonth, year: calYear } });
      setCalFairs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCalFairs([]);
    }
  };

  useEffect(() => { loadFairs(); }, []);
  useEffect(() => { if (view === 'calendar') loadCalendar(); }, [view, calMonth, calYear]);

  const openAdd  = () => { setEditData(null); setForm(EMPTY); setModal(true); };
  const openEdit = jf => { setEditData(jf); setForm({ ...jf, startDate: toISO(jf.startDate), endDate: toISO(jf.endDate) }); setModal(true); };

  const save = async () => {
    if (!form.eventName.trim()) { toast.error('Event name required'); return; }
    setSaving(true);
    try {
      const p = { ...form, vacancyCount: +form.vacancyCount || 0 };
      editData ? await api.put(`/api/jobfairs/${editData.id}`, p) : await api.post('/api/jobfairs/', p);
      toast.success('Saved!'); setModal(false); loadFairs();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this event?')) return;
    await api.delete(`/api/jobfairs/${id}`); toast.success('Deleted'); loadFairs();
  };

  const filteredFairs = fairs.filter(f => {
    const regionMatch = !regionFilter || (REGION_DISTRICTS[regionFilter] || []).includes(f.district);
    const domainMatch = !domainFilter || (f.domain || '').toLowerCase().includes(domainFilter.toLowerCase());
    return regionMatch && domainMatch;
  });

  // Calendar helpers
  const daysInMonth  = (m, y) => new Date(y, m, 0).getDate();
  const firstDay     = (m, y) => new Date(y, m - 1, 1).getDay();
  const fairsOnDay   = d => {
    const s = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return calFairs.filter(f => toISO(f.startDate) === s || toISO(f.endDate) === s);
  };
  const prevMonth = () => calMonth === 1 ? (setCalMonth(12), setCalYear(y => y-1)) : setCalMonth(m => m-1);
  const nextMonth = () => calMonth === 12 ? (setCalMonth(1), setCalYear(y => y+1)) : setCalMonth(m => m+1);

  const today = new Date();
  const isToday = d => d === today.getDate() && calMonth === today.getMonth()+1 && calYear === today.getFullYear();

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Fair Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{fairs.length} events total</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            {['list','calendar'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view===v ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {v === 'list' ? '📋 List' : '📅 Calendar'}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary">+ Add Event</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <select className="select w-44" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <input className="input w-44" placeholder="Search domain..." value={domainFilter} onChange={e => setDomainFilter(e.target.value)} />
        {(regionFilter || domainFilter) && (
          <button onClick={() => { setRegionFilter(''); setDomainFilter(''); }} className="btn-secondary">Clear</button>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => {
          const count = filteredFairs.filter(f => f.status === s).length;
          return (
            <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${STATUS_COLOR[s]}`}>
              <span>{STATUS_ICON[s]}</span>{s}: {count}
            </div>
          );
        })}
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="btn-secondary w-9 h-9 p-0 flex items-center justify-center">‹</button>
            <h3 className="font-bold text-gray-800 text-lg">{MONTHS[calMonth-1]} {calYear}</h3>
            <button onClick={nextMonth} className="btn-secondary w-9 h-9 p-0 flex items-center justify-center">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
            ))}
            {Array(firstDay(calMonth, calYear)).fill(null).map((_,i) => <div key={`e${i}`}/>)}
            {Array(daysInMonth(calMonth, calYear)).fill(null).map((_,i) => {
              const d = i + 1;
              const dayFairs = fairsOnDay(d);
              return (
                <div key={d} className={`min-h-[64px] rounded-xl p-1.5 border transition-colors ${isToday(d) ? 'bg-green-50 border-green-300' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <div className={`text-xs font-bold mb-1 ${isToday(d) ? 'text-green-700' : 'text-gray-500'}`}>{d}</div>
                  {dayFairs.map(f => (
                    <div key={f.id} title={f.eventName}
                      className="text-xs bg-green-100 text-green-800 rounded-md px-1 py-0.5 mb-0.5 truncate font-medium">
                      {f.eventName}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFairs.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <div className="text-5xl mb-3">🎪</div>
              <h3 className="text-lg font-bold text-gray-700">No Job Fairs Yet</h3>
              <p className="text-gray-400 text-sm mt-1">Click &quot;+ Add Event&quot; to schedule your first job fair.</p>
            </div>
          ) : filteredFairs.map(f => (
            <div key={f.id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-all ${STATUS_COLOR[f.status]}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg">{STATUS_ICON[f.status]}</span>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{f.eventName}</h3>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">{f.companies || '—'}</p>
                </div>
                <StatusBadge status={f.status} />
              </div>

              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2"><span>📍</span><span>{f.venue} · {f.district}</span></div>
                {f.domain && <div className="flex items-center gap-2"><span>🏷️</span><span className="badge-green">{f.domain}</span><span className="font-semibold text-green-700">{f.vacancyCount} vacancies</span></div>}
                <div className="flex items-center gap-2"><span>📅</span>
                  <span>{fmtDate(f.startDate)} → {fmtDate(f.endDate)}</span>
                </div>
                {f.coordinator && <div className="flex items-center gap-2"><span>👤</span><span>{f.coordinator}</span></div>}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(f)} className="btn-secondary flex-1 text-xs py-1.5">✏️ Edit</button>
                <button onClick={() => del(f.id)} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs transition-colors font-medium border border-transparent hover:border-red-200">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Edit Job Fair' : 'Add New Job Fair'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Event Name *</label>
            <input className="input" placeholder="e.g. IT Job Fair 2025" value={form.eventName} onChange={e => F({ eventName: e.target.value })} />
          </div>
          <div>
            <label className="label">Companies (comma separated)</label>
            <input className="input" placeholder="e.g. TechCorp, Infosys, Wipro" value={form.companies || ''} onChange={e => F({ companies: e.target.value })} />
          </div>
          <div>
            <label className="label">Coordinators (comma separated)</label>
            <input className="input" placeholder="e.g. Rajesh, Priya, Amit" value={form.coordinator || ''} onChange={e => F({ coordinator: e.target.value })} />
          </div>
          <div>
            <label className="label">Venue</label>
            <input className="input" placeholder="Hall / Ground name" value={form.venue || ''} onChange={e => F({ venue: e.target.value })} />
          </div>
          <div>
            <label className="label">Vacancy Count</label>
            <input type="number" className="input" value={form.vacancyCount} onChange={e => F({ vacancyCount: e.target.value })} />
          </div>
          <div>
            <label className="label">Domain (type freely)</label>
            <input className="input" placeholder="e.g. IT, Healthcare, Construction" value={form.domain || ''} onChange={e => F({ domain: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => F({ status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">District</label>
            <select className="select" value={form.district || ''} onChange={e => F({ district: e.target.value })}>
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Block</label>
            <input className="input" placeholder="Block name" value={form.block || ''} onChange={e => F({ block: e.target.value })} />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={form.startDate} onChange={e => F({ startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input" value={form.endDate} onChange={e => F({ endDate: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
