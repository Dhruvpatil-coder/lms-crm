import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';
import filterConfig from '../../utils/filterConfig';
import { safeDateStr } from '../../utils/safeDate';

const STATUSES   = filterConfig.getFilter('STATUSES');
const DISTRICTS  = filterConfig.getFilter('DISTRICTS');
const BLOCKS     = filterConfig.getFilter('BLOCKS');
const COURSES    = filterConfig.getFilter('COURSES');
const DOMAINS    = filterConfig.getFilter('DOMAINS');
const QUALS      = filterConfig.getFilter('QUALS');
const GENDERS    = ['Male','Female','Other'];
const REGIONS    = filterConfig.getFilter('REGIONS');
const STATES     = filterConfig.getFilter('STATES');

const EMPTY_C = { fullName:'', mobileNumber:'', alternateNumber:'', whatsappNumber:'', email:'', gender:'', dateOfBirth:'', state:'', district:'', block:'', address:'', qualification:'', course:'', batch:'', month:'', domain:'', trainerId:'', passoutDate:'', batchStartDate:'', batchEndDate:'', caste:'', aadharCard:'', beforeCourseEmploymentStatus:'Unemployed', batchStatus:'Ongoing', employmentAfterCourse:'Unemployed', placementStatus:'Interested', companyName:'', companyAddress:'', salary:'', monthlyEarning:'', location:'', businessName:'', helper:'', document:'', remark:'', lastFollowupDate:'', nextFollowupDate:'' };
const EMPTY_F = { followupDate: new Date().toISOString().split('T')[0], nextFollowupDate:'', status:'Interested', remark:'' };
const toISO   = d => d ? new Date(d).toISOString().split('T')[0] : '';

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [trainers, setTrainers]     = useState([]);
  const [selected, setSelected]     = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Modals
  const [addModal, setAddModal]         = useState(false);
  const [editData, setEditData]         = useState(null);
  const [followModal, setFollowModal]   = useState(false);
  const [histModal, setHistModal]       = useState(false);
  const [activeCand, setActiveCand]     = useState(null);

  const [form, setForm]         = useState(EMPTY_C);
  const [followForm, setFollowForm] = useState(EMPTY_F);
  const [history, setHistory]   = useState([]);
  const [saving, setSaving]     = useState(false);

  const [filters, setFilters] = useState({ search:'', course:'', district:'', block:'', status:'', domain:'', region:'', state:'' });
  const F  = f => setForm(p => ({ ...p, ...f }));
  const FF = f => setFollowForm(p => ({ ...p, ...f }));
  const Fl = f => setFilters(p => ({ ...p, ...f }));

  const load = useCallback(async () => {
    setLoading(true);
    const params = { ...filters, limit: 200 };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    const res = await api.get('/api/candidates/', { params });
    setCandidates(res.data.data); setTotal(res.data.total);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/api/admin/trainers').then(r => setTrainers(r.data)).catch(() => {}); }, []);

  const openAdd  = ()  => { setEditData(null); setForm(EMPTY_C); setAddModal(true); };
  const openEdit = c   => {
    setEditData(c);
    setForm({
      ...c,
      dateOfBirth: toISO(c.dateOfBirth),
      passoutDate: toISO(c.passoutDate),
      batchStartDate: toISO(c.batchStartDate),
      batchEndDate: toISO(c.batchEndDate),
      lastFollowupDate: toISO(c.lastFollowupDate),
      nextFollowupDate: toISO(c.nextFollowupDate),
      trainerId: c.trainerId || '',
      salary: c.salary || '',
      monthlyEarning: c.monthlyEarning || ''
    });
    setAddModal(true);
  };
  const openFollow = c => { setActiveCand(c); setFollowForm({ ...EMPTY_F, status: c.placementStatus }); setFollowModal(true); };
  const openHist   = async c => {
    setActiveCand(c);
    const res = await api.get(`/api/candidates/${c.id}/followups`);
    setHistory(res.data); setHistModal(true);
  };

  const save = async () => {
    if (!form.fullName.trim()) { toast.error('Full name required'); return; }
    setSaving(true);
    try {
      const p = { ...form, trainerId: form.trainerId ? +form.trainerId : undefined };
      editData ? await api.put(`/api/candidates/${editData.id}`, p) : await api.post('/api/candidates/', p);
      toast.success(editData ? 'Updated!' : 'Candidate added!');
      setAddModal(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const saveFollow = async () => {
    await api.post(`/api/candidates/${activeCand.id}/followup`, followForm);
    toast.success('Follow-up saved!'); setFollowModal(false); load();
  };

  const del = async id => {
    if (!window.confirm('Delete this candidate?')) return;
    await api.delete(`/api/candidates/${id}`); toast.success('Deleted'); load();
  };

  const bulkUpdate = async () => {
    if (!bulkStatus || !selected.length) return;
    await api.post('/api/candidates/bulk/status', { candidateIds: selected, placementStatus: bulkStatus });
    toast.success(`Updated ${selected.length} candidates`);
    setSelected([]); setBulkStatus(''); load();
  };

  const exportXlsx = async () => {
    const res = await api.get('/api/candidates/export/excel', { responseType: 'blob' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(res.data), download: 'candidates.xlsx' }).click();
  };
  const importXlsx = async e => {
    const fd = new FormData(); fd.append('file', e.target.files[0]);
    await api.post('/api/candidates/import/excel', fd);
    toast.success('Imported!'); load(); e.target.value = '';
  };

  const toggleOne = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === candidates.length ? [] : candidates.map(c => c.id));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} candidates registered</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer flex items-center gap-1.5">
            📥 Import <input type="file" accept=".xlsx" className="hidden" onChange={importXlsx} />
          </label>
          <button onClick={exportXlsx} className="btn-secondary flex items-center gap-1.5">📤 Export</button>
          <button onClick={openAdd} className="btn-primary">+ Add Candidate</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 md:grid-cols-7 gap-3">
        <input className="input col-span-2 md:col-span-1" placeholder="🔍 Search name / mobile..." value={filters.search} onChange={e => Fl({ search: e.target.value })} />
        <select className="select" value={filters.state} onChange={e => Fl({ state: e.target.value })}>
          <option value="">All States</option>{STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={filters.region} onChange={e => Fl({ region: e.target.value })}>
          <option value="">All Regions</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select" value={filters.district} onChange={e => Fl({ district: e.target.value })}>
          <option value="">All Districts</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.domain} onChange={e => Fl({ domain: e.target.value })}>
          <option value="">All Domains</option>{DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.course} onChange={e => Fl({ course: e.target.value })}>
          <option value="">All Courses</option>{COURSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="select" value={filters.status} onChange={e => Fl({ status: e.target.value })}>
          <option value="">All Status</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setFilters({ search:'', course:'', district:'', block:'', status:'', domain:'', region:'', state:'' })} className="btn-secondary text-xs">Clear</button>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3 flex-wrap">
          <span className="badge-green font-bold">{selected.length} selected</span>
          <select className="select w-auto flex-1 min-w-40" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
            <option value="">Change Status…</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={bulkUpdate} className="btn-primary text-sm">Apply</button>
          <button onClick={() => setSelected([])} className="btn-secondary text-sm">Deselect</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="table-th w-10">
                  <input type="checkbox" onChange={toggleAll} checked={selected.length === candidates.length && candidates.length > 0} className="w-4 h-4 accent-green-600" />
                </th>
                <th className="table-th">Candidate</th>
                <th className="table-th">Contact</th>
                <th className="table-th">Course / Batch ID</th>
                <th className="table-th">Location</th>
                <th className="table-th">Company</th>
                <th className="table-th text-center">Salary</th>
                <th className="table-th text-center">Status</th>
                <th className="table-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>Loading...
                </td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-2">👥</div>No candidates found
                </td></tr>
              ) : candidates.map(c => (
                <tr key={c.id} className={`table-row ${selected.includes(c.id) ? 'bg-green-50' : ''}`}>
                  <td className="table-td w-10">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} className="w-4 h-4 accent-green-600" />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${c.gender==='Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                        {c.fullName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{c.fullName}</div>
                        <div className="text-xs text-gray-400">{c.candidateId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-xs">
                    <div className="text-gray-800">{c.mobileNumber || '—'}</div>
                    <div className="text-gray-400 truncate max-w-[120px]">{c.email}</div>
                  </td>
                  <td className="table-td text-xs">
                    <div className="font-medium text-gray-700">{c.course || '—'}</div>
                    <div className="text-gray-400">{c.batch}</div>
                  </td>
                  <td className="table-td text-xs">
                    <div className="text-gray-700">{c.state || c.district || '—'}</div>
                    <div className="text-gray-400">{c.block}</div>
                  </td>
                  <td className="table-td text-xs">
                    <div className="text-gray-700">{c.companyName || '—'}</div>
                    <div className="text-gray-400">{c.location || '—'}</div>
                  </td>
                  <td className="table-td text-center text-xs font-medium">{c.salary ? `₹${c.salary.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="table-td text-center"><StatusBadge status={c.placementStatus} /></td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openFollow(c)} title="Add Follow-up" className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center text-sm">📝</button>
                      <button onClick={() => openHist(c)}   title="View History"  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center text-sm">📋</button>
                      <button onClick={() => openEdit(c)}   title="Edit"          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center text-sm">✏️</button>
                      <button onClick={() => del(c.id)}     title="Delete"        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center text-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title={editData ? 'Edit Candidate' : 'Add New Candidate'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><h3 className="font-bold text-gray-700 text-sm mb-1 pb-1 border-b border-gray-100">Basic Information</h3></div>
          {[['fullName','Full Name *','text'],['mobileNumber','Mobile Number','text'],['alternateNumber','Alternate Number','text'],['whatsappNumber','WhatsApp Number','text'],['email','Email','email']].map(([k,l,t]) => (
            <div key={k}><label className="label">{l}</label><input type={t} className="input" value={form[k]||''} onChange={e => F({ [k]: e.target.value })} /></div>
          ))}
          <div><label className="label">Gender</label>
            <select className="select" value={form.gender||''} onChange={e => F({ gender:e.target.value })}>
              <option value="">Select</option>{GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth||''} onChange={e => F({ dateOfBirth:e.target.value })} /></div>
          <div><label className="label">Caste</label><input className="input" placeholder="e.g. General" value={form.caste||''} onChange={e => F({ caste:e.target.value })} /></div>
          <div><label className="label">Aadhar Card Number</label><input className="input" placeholder="e.g. 1234 5678 9012" value={form.aadharCard||''} onChange={e => F({ aadharCard:e.target.value })} /></div>

          <div className="md:col-span-2"><h3 className="font-bold text-gray-700 text-sm mb-1 pb-1 border-b border-gray-100">Location & Education</h3></div>
          <div><label className="label">State</label>
            <select className="select" value={form.state||''} onChange={e => F({ state:e.target.value })}>
              <option value="">Select</option>{STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">District</label>
            <select className="select" value={form.district||''} onChange={e => F({ district:e.target.value })}>
              <option value="">Select</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="label">Block</label>
            <select className="select" value={form.block||''} onChange={e => F({ block:e.target.value })}>
              <option value="">Select</option>{BLOCKS.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label className="label">Qualification</label>
            <select className="select" value={form.qualification||''} onChange={e => F({ qualification:e.target.value })}>
              <option value="">Select</option>{QUALS.map(q=><option key={q}>{q}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address||''} onChange={e => F({ address:e.target.value })} /></div>

          <div className="md:col-span-2"><h3 className="font-bold text-gray-700 text-sm mb-1 pb-1 border-b border-gray-100">Course & Batch ID</h3></div>
          <div><label className="label">Course</label>
            <select className="select" value={form.course||''} onChange={e => F({ course:e.target.value })}>
              <option value="">Select</option>{COURSES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Domain</label>
            <select className="select" value={form.domain||''} onChange={e => F({ domain:e.target.value })}>
              <option value="">Select Domain</option>{DOMAINS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="label">Batch ID</label><input className="input" placeholder="e.g. Batch-1" value={form.batch||''} onChange={e => F({ batch:e.target.value })} /></div>
          <div><label className="label">Month</label><input className="input" placeholder="e.g. January 2025" value={form.month||''} onChange={e => F({ month:e.target.value })} /></div>
          <div><label className="label">Trainer</label>
            <select className="select" value={form.trainerId||''} onChange={e => F({ trainerId:e.target.value })}>
              <option value="">Select Trainer</option>{trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2"><h3 className="font-bold text-gray-700 text-sm mb-1 pb-1 border-b border-gray-100">Batch Dates</h3></div>
          <div><label className="label">Batch Start Date</label><input type="date" className="input" value={form.batchStartDate||''} onChange={e => F({ batchStartDate:e.target.value })} /></div>
          <div><label className="label">Batch End Date</label><input type="date" className="input" value={form.batchEndDate||''} onChange={e => F({ batchEndDate:e.target.value })} /></div>
          <div><label className="label">Passout Date</label><input type="date" className="input" value={form.passoutDate||''} onChange={e => F({ passoutDate:e.target.value })} /></div>
          <div><label className="label">Batch Status</label>
            <select className="select" value={form.batchStatus||''} onChange={e => F({ batchStatus:e.target.value })}>
              <option value="">Select</option>
              <option>Ongoing</option>
              <option>Completed</option>
              <option>Dropped</option>
            </select>
          </div>

          <div className="md:col-span-2"><h3 className="font-bold text-gray-700 text-sm mb-1 pb-1 border-b border-gray-100">Employment</h3></div>
          <div><label className="label">Before Course Employment</label>
            <select className="select" value={form.beforeCourseEmploymentStatus||''} onChange={e => F({ beforeCourseEmploymentStatus:e.target.value })}>
              <option value="">Select</option>
              <option>Employed</option>
              <option>Unemployed</option>
              <option>Self-Employed</option>
              <option>Student</option>
            </select>
          </div>
          <div><label className="label">Employment After Course</label>
            <select className="select" value={form.employmentAfterCourse||''} onChange={e => F({ employmentAfterCourse:e.target.value })}>
              <option value="">Select</option>
              <option>Employed</option>
              <option>Unemployed</option>
              <option>Self-Employed</option>
              <option>Higher Studies</option>
            </select>
          </div>
          <div><label className="label">Placement Status</label>
            <select className="select" value={form.placementStatus} onChange={e => F({ placementStatus:e.target.value })}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Company Name</label><input className="input" placeholder="e.g. TechCorp" value={form.companyName||''} onChange={e => F({ companyName:e.target.value })} /></div>
          <div><label className="label">Company Address</label><input className="input" placeholder="e.g. Patna, Bihar" value={form.companyAddress||''} onChange={e => F({ companyAddress:e.target.value })} /></div>
          <div><label className="label">Location</label><input className="input" placeholder="e.g. Mumbai" value={form.location||''} onChange={e => F({ location:e.target.value })} /></div>
          <div><label className="label">Business Name</label><input className="input" placeholder="e.g. ABC Traders" value={form.businessName||''} onChange={e => F({ businessName:e.target.value })} /></div>
          <div><label className="label">Salary (₹)</label><input type="number" className="input" placeholder="e.g. 25000" value={form.salary||''} onChange={e => F({ salary:e.target.value })} /></div>
          <div><label className="label">Monthly Earning (₹)</label><input type="number" className="input" placeholder="e.g. 30000" value={form.monthlyEarning||''} onChange={e => F({ monthlyEarning:e.target.value })} /></div>
          <div><label className="label">Helper / Mentor</label><input className="input" placeholder="e.g. John Doe" value={form.helper||''} onChange={e => F({ helper:e.target.value })} /></div>
          <div><label className="label">Document URL</label><input className="input" placeholder="e.g. https://drive.google.com/..." value={form.document||''} onChange={e => F({ document:e.target.value })} /></div>

          <div className="md:col-span-2"><h3 className="font-bold text-gray-700 text-sm mb-1 pb-1 border-b border-gray-100">Remarks</h3></div>
          <div className="md:col-span-2"><label className="label">Remark</label><textarea className="input" rows={3} placeholder="General remarks about candidate..." value={form.remark||''} onChange={e => F({ remark:e.target.value })} /></div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Save Candidate'}</button>
        </div>
      </Modal>

      {/* Follow-up Modal */}
      <Modal isOpen={followModal} onClose={() => setFollowModal(false)} title={`Follow-up: ${activeCand?.fullName}`} size="md">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 text-sm">
            Current: <StatusBadge status={activeCand?.placementStatus} />
          </div>
          <div><label className="label">New Status</label>
            <select className="select" value={followForm.status} onChange={e => FF({ status:e.target.value })}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Follow-up Date</label><input type="date" className="input" value={followForm.followupDate} onChange={e => FF({ followupDate:e.target.value })} /></div>
          <div><label className="label">Next Follow-up Date</label><input type="date" className="input" value={followForm.nextFollowupDate} onChange={e => FF({ nextFollowupDate:e.target.value })} /></div>
          <div><label className="label">Remarks</label><textarea className="input" rows={3} placeholder="What was discussed? Any update?" value={followForm.remark} onChange={e => FF({ remark:e.target.value })} /></div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setFollowModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={saveFollow} className="btn-primary flex-1">Save Follow-up</button>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={histModal} onClose={() => setHistModal(false)} title={`History: ${activeCand?.fullName}`} size="md">
        {history.length === 0 ? (
          <div className="py-10 text-center text-gray-400"><div className="text-4xl mb-2">📋</div>No follow-up history yet</div>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="border-l-4 border-green-300 pl-4 py-2 bg-green-50/30 rounded-r-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">
                    {h.followupDate ? safeDateStr(h.followupDate) : '—'}
                  </span>
                  <StatusBadge status={h.status} />
                </div>
                {h.remark && <p className="text-sm text-gray-600">{h.remark}</p>}
                {h.nextFollowupDate && <p className="text-xs text-gray-400 mt-1">Next: {safeDateStr(h.nextFollowupDate)}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
