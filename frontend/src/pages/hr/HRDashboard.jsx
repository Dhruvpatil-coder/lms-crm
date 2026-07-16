import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from '../../components/shared/KPICard';
import Modal from '../../components/shared/Modal';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import filterConfig from '../../utils/filterConfig';
import { safeDateStr } from '../../utils/safeDate';

const COLORS = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2','#ea580c','#db2777'];

function toISO(d) {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  return date.toISOString().split('T')[0];
}

// ── Settings Modal ──────────────────────────────────────────────────────────
function FilterSettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('DISTRICTS');
  const [lists, setLists] = useState(() => {
    const result = {};
    Object.keys(filterConfig.DEFAULTS).forEach(k => { result[k] = [...filterConfig.getFilter(k)]; });
    return result;
  });
  const [newVal, setNewVal] = useState('');

  const tabs = Object.keys(filterConfig.DEFAULTS);

  const handleAdd = () => {
    const v = newVal.trim();
    if (!v) return;
    if (lists[activeTab].includes(v)) { toast.error('Already exists'); return; }
    setLists(p => ({ ...p, [activeTab]: [...p[activeTab], v] }));
    setNewVal('');
  };

  const handleDelete = (val) => {
    setLists(p => ({ ...p, [activeTab]: p[activeTab].filter(x => x !== val) }));
  };

  const handleSave = () => {
    Object.keys(lists).forEach(k => filterConfig.setFilter(k, lists[k]));
    toast.success('Filter settings saved!');
    onClose();
    window.location.reload();
  };

  const handleReset = () => {
    setLists(p => {
      const r = { ...p };
      r[activeTab] = [...filterConfig.DEFAULTS[activeTab]];
      return r;
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="⚙️ Filter Settings — Manage All Filter Lists" size="xl">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Add, edit, or remove options from each filter list. Changes apply to all Placement pages.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-100 pb-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all ${
                activeTab === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <input className="input flex-1" placeholder={`Add new ${activeTab.replace(/_/g, ' ').toLowerCase()}…`}
            value={newVal} onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="btn-primary">+ Add</button>
          <button onClick={handleReset} className="btn-secondary text-xs">Reset to Default</button>
        </div>

        {/* List */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
          {lists[activeTab].length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No items — add some above</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lists[activeTab].map((v, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white transition-colors">
                  <span className="text-sm text-gray-700">{v}</span>
                  <button onClick={() => handleDelete(v)}
                    className="text-red-400 hover:bg-red-50 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Default hint */}
        {filterConfig.DEFAULTS[activeTab] && (
          <p className="text-xs text-gray-400">
            Default: {filterConfig.DEFAULTS[activeTab].join(', ')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">💾 Save Settings</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HRDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({});
  const [vacByDomain, setVacByDomain] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [reminders, setReminders] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [region, setRegion] = useState('');
  const [state, setState] = useState('');
  const [block, setBlock] = useState('');
  const [donorId, setDonorId] = useState('');
  const [domain, setDomain] = useState('');
  const [course, setCourse] = useState('');
  const [donors, setDonors] = useState([]);
  const [lastMsgCount, setLastMsgCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 3);
    return { from: toISO(from), to: toISO(to) };
  });

  const REGIONS = filterConfig.getFilter('REGIONS');
  const STATES = filterConfig.getFilter('STATES');
  const BLOCKS = filterConfig.getFilter('BLOCKS');
  const DOMAINS = filterConfig.getFilter('DOMAINS');
  const COURSES = filterConfig.getFilter('COURSES');

  useEffect(() => {
    api.get('/api/donors/').then(r => setDonors(r.data.data)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    const params = { from: dateRange.from, to: dateRange.to };
    if (region)  params.region  = region;
    if (state)   params.state   = state;
    if (block)   params.block   = block;
    if (donorId) params.donorId = donorId;
    if (domain)  params.domain  = domain;
    if (course)  params.course  = course;
    try {
      const [s, vd, tc, mt, sd, rem] = await Promise.all([
        api.get('/api/dashboard/summary', { params }),
        api.get('/api/dashboard/vacancies-by-domain'),
        api.get('/api/dashboard/top-hiring-companies'),
        api.get('/api/dashboard/monthly-placement-trend'),
        api.get('/api/dashboard/placement-status-distribution'),
        api.get('/api/dashboard/reminders'),
      ]);
      setSummary(s.data); setVacByDomain(vd.data); setTopCompanies(tc.data);
      setMonthlyTrend(mt.data); setStatusDist(sd.data); setReminders(rem.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [region, state, block, donorId, domain, course, dateRange.from, dateRange.to]);

  // Chat notification polling
  useEffect(() => {
    const checkChat = async () => {
      try {
        const r = await api.get('/api/chat/messages');
        const msgs = r.data || [];
        if (lastMsgCount > 0 && msgs.length > lastMsgCount) {
          const newMsgs = msgs.slice(lastMsgCount);
          newMsgs.forEach(m => {
            if (m.senderId !== user?.id) {
              toast(`${m.senderName}: ${m.content.substring(0, 40)}${m.content.length > 40 ? '...' : ''}`, { icon: '💬', duration: 4000 });
            }
          });
        }
        setLastMsgCount(msgs.length);
      } catch {}
    };
    checkChat();
    const t = setInterval(checkChat, 5000);
    return () => clearInterval(t);
  }, [lastMsgCount]);

  // Import / Export
  const importExcel = async (e) => {
    const fd = new FormData(); fd.append('file', e.target.files[0]);
    try {
      await api.post('/api/companies/import/excel', fd);
      toast.success('Companies imported!'); load(); e.target.value = '';
    } catch { toast.error('Import failed'); }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get('/api/companies/export/excel', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      Object.assign(document.createElement('a'), { href: url, download: 'companies.xlsx' }).click();
    } catch { toast.error('Export failed'); }
  };

  const hasFilters = region || state || block || donorId || domain || course ||
    dateRange.from !== toISO(new Date(new Date().setMonth(new Date().getMonth() - 3))) ||
    dateRange.to !== toISO(new Date());

  const clearFilters = () => {
    setRegion(''); setState(''); setBlock(''); setDonorId(''); setDomain(''); setCourse('');
    setDateRange({ from: toISO(new Date(new Date().setMonth(new Date().getMonth() - 3))), to: toISO(new Date()) });
  };

  const totalReminders = (reminders.companyFollowups?.length || 0) +
    (reminders.candidateFollowups?.length || 0) + (reminders.upcomingFairs?.length || 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Dashboard</h1>
          <p className="text-sm text-gray-500">{safeDateStr(new Date(), 'full')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {totalReminders > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <span className="animate-bounce">🔔</span>
              <span className="text-sm font-semibold text-amber-700">{totalReminders} pending actions</span>
            </div>
          )}
          <button onClick={() => setShowSettings(true)} className="btn-secondary flex items-center gap-1.5" title="Manage filters">
            ⚙️ Settings
          </button>
          <label className="btn-secondary cursor-pointer flex items-center gap-1.5">
            📥 Import <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
          </label>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-1.5">📤 Export</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500">From</label>
          <input type="date" className="input w-36" value={dateRange.from}
            onChange={e => setDateRange(p => ({...p, from: e.target.value}))} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500">To</label>
          <input type="date" className="input w-36" value={dateRange.to}
            onChange={e => setDateRange(p => ({...p, to: e.target.value}))} />
        </div>

        {/* State */}
        <select className="select w-36" value={state} onChange={e => setState(e.target.value)}>
          <option value="">All States</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>

        {/* Region */}
        <select className="select w-40" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>

        {/* Block */}
        <select className="select w-36" value={block} onChange={e => setBlock(e.target.value)}>
          <option value="">All Blocks</option>
          {BLOCKS.map(b => <option key={b}>{b}</option>)}
        </select>

        {/* Domain */}
        <select className="select w-40" value={domain} onChange={e => setDomain(e.target.value)}>
          <option value="">All Domains</option>
          {DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>

        {/* Course */}
        <select className="select w-44" value={course} onChange={e => setCourse(e.target.value)}>
          <option value="">All Courses</option>
          {COURSES.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Donor */}
        <select className="select w-40" value={donorId} onChange={e => setDonorId(e.target.value)}>
          <option value="">All Donors</option>
          {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters} className="btn-secondary text-xs whitespace-nowrap">Clear All</button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Clients"      value={summary.totalClients}        icon="🏢" color="green" />
        <KPICard title="New Clients"         value={summary.newClients}          icon="⭐" color="blue" />
        <KPICard title="Total Vacancies"     value={summary.totalVacancies}      icon="💼" color="purple" />
        <KPICard title="Total Placements"    value={summary.totalPlacements}     icon="✅" color="orange" />
        <KPICard title="Urgent Hiring"          value={summary.urgentHiringCompanies}  icon="🔥" color="red" />
        <KPICard title="Upcoming Job Fairs"  value={summary.upcomingJobFairs}    icon="🎪" color="indigo" />
        <KPICard title="Today Follow-ups"    value={summary.todayFollowups}      icon="📅" color="yellow" />
        <KPICard title="Pending Follow-ups"  value={summary.pendingFollowups}    icon="⏰" color="red" />
      </div>

      {/* Reminders */}
      {totalReminders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">📋 Today's Action Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'companyFollowups', label: '🏢 Company Follow-ups', items: reminders.companyFollowups },
              { key: 'candidateFollowups', label: '👥 Candidate Follow-ups', items: reminders.candidateFollowups },
              { key: 'upcomingFairs', label: '🎪 Job Fairs Starting Soon', items: reminders.upcomingFairs },
            ].map(section => section.items?.length > 0 && (
              <div key={section.key} className="bg-white rounded-xl p-3 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 mb-2">{section.label} ({section.items.length})</p>
                {section.items.slice(0, 3).map(item => (
                  <div key={item.id} className="text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                    {item.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Vacancies by Domain</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={vacByDomain} dataKey="vacancies" nameKey="domain" cx="50%" cy="50%" outerRadius={95} innerRadius={40}>
                {vacByDomain.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Top 5 Hiring Companies</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topCompanies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0df4" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="vacancies" fill="#16a34a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Placement Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0df4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="placements" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Candidate Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={35}>
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <FilterSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
