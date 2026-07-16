import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import KPICard from '../../components/shared/KPICard';
import filterConfig from '../../utils/filterConfig';

const DISTRICTS = filterConfig.getFilter('DISTRICTS');
const BLOCKS    = filterConfig.getFilter('BLOCKS');
const DOMAINS   = filterConfig.getFilter('DOMAINS');
const REGIONS   = filterConfig.getFilter('REGIONS');

// Safety helper - ensure value is renderable
const safeStr = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const safeNum = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val) || 0;
  return 0;
};

export default function UrgentHiring() {
  const [companies, setCompanies]   = useState([]);
  const [stats, setStats]           = useState({});
  const [filters, setFilters]       = useState({ district:'', block:'', domain:'', region:'' });
  const [loading, setLoading]       = useState(true);
  const F = f => setFilters(p => ({ ...p, ...f }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { urgentHiring: true, limit: 200, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      console.log('UrgentHiring: fetching with params', params);
      const [res, sRes] = await Promise.all([
        api.get('/api/companies/', { params }),
        api.get('/api/companies/stats/summary'),
      ]);
      console.log('UrgentHiring: companies response', res.data);
      console.log('UrgentHiring: stats response', sRes.data);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setCompanies(data);
      setStats(typeof sRes.data === 'object' && !Array.isArray(sRes.data) ? sRes.data : {});
    } catch (e) {
      console.error('Urgent Hiring load error:', e);
      setCompanies([]);
      setStats({});
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totalVac      = companies.reduce((s, c) => s + (safeNum(c.totalVacancies)), 0);
  const today         = new Date().toISOString().split('T')[0];
  const todayFU       = companies.filter(c => {
    const d = c.nextFollowupDate;
    return typeof d === 'string' && d.split('T')[0] === today;
  }).length;
  const pendingFU     = companies.filter(c => {
    const d = c.nextFollowupDate;
    return typeof d === 'string' && d.split('T')[0] < today;
  }).length;

  const urgency = (c) => {
    const d = c.nextFollowupDate;
    if (!d || typeof d !== 'string') return 'none';
    const date = d.split('T')[0];
    if (!date) return 'none';
    if (date < today) return 'overdue';
    if (date === today) return 'today';
    return 'upcoming';
  };
  const urgencyStyle = { overdue:'border-red-300 bg-red-50', today:'border-amber-300 bg-amber-50', upcoming:'border-green-200 bg-white', none:'border-gray-200 bg-white' };
  const urgencyBadge = { overdue:'bg-red-100 text-red-700', today:'bg-amber-100 text-amber-700', upcoming:'', none:'' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔥 Urgent Hiring</h1>
          <p className="text-sm text-gray-500 mt-0.5">Companies actively seeking candidates right now</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Hot Hiring"       value={companies.length} icon="🔥" color="red"    />
        <KPICard title="Total Vacancies"  value={totalVac}         icon="💼" color="green"  />
        <KPICard title="Follow-up Today"  value={todayFU}          icon="📅" color="yellow" />
        <KPICard title="Pending Follow-up"value={pendingFU}        icon="⏰" color="orange" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="select" value={filters.region} onChange={e => F({ region: e.target.value })}>
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select" value={filters.district} onChange={e => F({ district: e.target.value })}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.block} onChange={e => F({ block: e.target.value })}>
          <option value="">All Blocks</option>
          {BLOCKS.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="select" value={filters.domain} onChange={e => F({ domain: e.target.value })}>
          <option value="">All Domains</option>
          {DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading companies...</p>
          </div>
        </div>
      ) : !Array.isArray(companies) || companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-3">🔥</div>
          <h3 className="text-lg font-bold text-gray-700">No Hot Hiring Companies</h3>
          <p className="text-gray-400 text-sm mt-1">Mark companies as Hot Hiring in Client Management.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c, idx) => {
            const u = urgency(c);
            // Ensure c is an object
            if (!c || typeof c !== 'object') return null;
            return (
              <div key={c.id || idx} className={`rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-all ${urgencyStyle[u]}`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 leading-tight">{safeStr(c.companyName)}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{safeStr(c.district)} · {safeStr(c.block)}</p>
                  </div>
                  <span className="text-2xl ml-2 flex-shrink-0">🔥</span>
                </div>

                {/* Domain & Vacancies */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-blue">{safeStr(c.domain)}</span>
                  <span className="font-bold text-green-700">{safeNum(c.totalVacancies)} vacancies</span>
                </div>

                {/* Contact */}
                <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3">
                  <span className="font-semibold text-gray-800">{safeStr(c.contactPerson)}</span>
                  {c.contactNumber && <span className="text-gray-500 ml-2">· {safeStr(c.contactNumber)}</span>}
                </div>

                {/* Follow-up status */}
                {typeof c.nextFollowupDate === 'string' && c.nextFollowupDate !== '' && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${urgencyBadge[u]}`}>
                    <span>📅</span>
                    Follow-up: {(() => {
                      try {
                        const d = new Date(c.nextFollowupDate);
                        if (isNaN(d.getTime())) return c.nextFollowupDate.split('T')[0];
                        const day = d.getDate().toString().padStart(2, '0');
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      } catch {
                        return c.nextFollowupDate.split('T')[0];
                      }
                    })()}
                    {u === 'overdue' && <span className="ml-1">⚠️ OVERDUE</span>}
                    {u === 'today'   && <span className="ml-1">— Today!</span>}
                  </div>
                )}

                {c.remarks && (
                  <p className="text-xs text-gray-400 italic mt-2 truncate">{safeStr(c.remarks)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
