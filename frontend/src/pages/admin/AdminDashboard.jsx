import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from '../../components/shared/KPICard';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({});
  const [vacByDomain, setVacByDomain] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [reminders, setReminders] = useState({});
  const [trainerSummary, setTrainerSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month');
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date(new Date().setMonth(new Date().getMonth() - 3));
    return { from: toISO(from), to: toISO(to) };
  });
  const [region, setRegion] = useState('');
  const [state, setState] = useState('');
  const [block, setBlock] = useState('');
  const [donorId, setDonorId] = useState('');
  const [donors, setDonors] = useState([]);
  const [lastMsgCount, setLastMsgCount] = useState(0);

  const REGIONS = filterConfig.getFilter('REGIONS');
  const STATES = filterConfig.getFilter('STATES');
  const BLOCKS = filterConfig.getFilter('BLOCKS');

  useEffect(() => {
    api.get('/api/donors/').then(r => setDonors(r.data.data)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const params = { from: dateRange.from, to: dateRange.to };
    if (region) params.region = region;
    if (state) params.state = state;
    if (block) params.block = block;
    if (donorId) params.donorId = donorId;
    const trendEndpoint = viewMode === 'day' ? '/api/dashboard/daily-trend' : '/api/dashboard/monthly-trend-range';

    try {
      const [s, vd, tc, mt, sd, rem, ta] = await Promise.all([
        api.get('/api/dashboard/summary', { params }),
        api.get('/api/dashboard/vacancies-by-domain'),
        api.get('/api/dashboard/top-hiring-companies'),
        api.get(trendEndpoint, { params }),
        api.get('/api/dashboard/placement-status-distribution'),
        api.get('/api/dashboard/reminders'),
        api.get('/api/admin/trainer-attendance', { params: { fromDate: sevenDaysAgo.toISOString().split('T')[0] } }),
      ]);
      setSummary(s.data); setVacByDomain(vd.data); setTopCompanies(tc.data);
      setTrendData(mt.data); setStatusDist(sd.data); setReminders(rem.data);
      const byTrainer = {};
      ta.data.forEach(r => {
        if (!byTrainer[r.trainerName]) byTrainer[r.trainerName] = { name: r.trainerName, days: 0 };
        if (r.checkinTime) byTrainer[r.trainerName].days++;
      });
      setTrainerSummary(Object.values(byTrainer));
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateRange.from, dateRange.to, viewMode, region, state, block, donorId]);

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
              toast(`💬 ${m.senderName}: ${m.content.substring(0, 40)}${m.content.length > 40 ? '...' : ''}`, { icon: '💬', duration: 4000 });
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

  const totalReminders = (reminders.companyFollowups?.length||0) + (reminders.candidateFollowups?.length||0) + (reminders.upcomingFairs?.length||0);
  const hasFilters = region || state || block || donorId || dateRange.from !== toISO(new Date(new Date().setMonth(new Date().getMonth() - 3))) || dateRange.to !== toISO(new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">{safeDateStr(new Date(), 'full')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {totalReminders > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <span className="animate-bounce">🔔</span>
              <span className="text-sm font-semibold text-amber-700">{totalReminders} pending actions</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Range & View Toggle & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">From</label>
          <input type="date" className="input w-36" value={dateRange.from} onChange={e => setDateRange(p => ({...p, from: e.target.value}))} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">To</label>
          <input type="date" className="input w-36" value={dateRange.to} onChange={e => setDateRange(p => ({...p, to: e.target.value}))} />
        </div>
        <select className="select w-36" value={state} onChange={e => setState(e.target.value)}>
          <option value="">All States</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select w-36" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select w-36" value={block} onChange={e => setBlock(e.target.value)}>
          <option value="">All Blocks</option>
          {BLOCKS.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="select w-36" value={donorId} onChange={e => setDonorId(e.target.value)}>
          <option value="">All Donors</option>
          {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setRegion(''); setState(''); setBlock(''); setDonorId(''); setDateRange({ from: toISO(new Date(new Date().setMonth(new Date().getMonth() - 3))), to: toISO(new Date()) }); }} className="btn-secondary text-xs">Clear</button>
        )}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm ml-auto">
          {[
            ['month', '📆 Month Wise'],
            ['day', '📅 Day Wise']
          ].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === v ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Clients"     value={summary.totalClients}       icon="🏢" color="green" />
        <KPICard title="New Clients"        value={summary.newClients}         icon="⭐" color="blue" />
        <KPICard title="Total Vacancies"    value={summary.totalVacancies}     icon="💼" color="purple" />
        <KPICard title="Total Placements"   value={summary.totalPlacements}    icon="✅" color="orange" />
        <KPICard title="Urgent Hiring"         value={summary.urgentHiringCompanies} icon="🔥" color="red" />
        <KPICard title="Job Fairs"          value={summary.upcomingJobFairs}   icon="🎪" color="yellow" />
        <KPICard title="All Candidates"     value={summary.totalCandidates}    icon="👥" color="indigo" />
        <KPICard title="Follow-ups Pending" value={summary.pendingFollowups}   icon="⏰" color="red" />
      </div>

      {/* Trainer Live Status */}
      {trainerSummary.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"/>Trainer Attendance — Last 7 Days</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trainerSummary.map(t => (
              <div key={t.name} className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold text-lg mx-auto mb-2">{t.name?.charAt(0)}</div>
                <div className="text-center text-sm font-semibold text-gray-800 truncate">{t.name}</div>
                <div className="text-center text-xs text-green-600 mt-0.5">{t.days}/7 days</div>
                <div className="mt-2 bg-white rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((t.days/7)*100,100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Vacancies by Domain</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={vacByDomain} dataKey="vacancies" nameKey="domain" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                {vacByDomain.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Top 5 Hiring Companies</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topCompanies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4"/>
              <XAxis type="number" tick={{fontSize:11}}/>
              <YAxis dataKey="name" type="category" width={110} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
              <Bar dataKey="vacancies" fill="#16a34a" radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">{viewMode === 'day' ? 'Daily' : 'Monthly'} Placement Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4"/>
              <XAxis dataKey={viewMode === 'day' ? 'date' : 'month'} tick={{fontSize:11}} angle={viewMode === 'day' ? 45 : 0} textAnchor={viewMode === 'day' ? 'start' : 'middle'} height={viewMode === 'day' ? 60 : 30}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
              <Bar dataKey="placements" fill="#16a34a" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Candidate Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75} innerRadius={30}>
                {statusDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
