import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

export default function TrainerPlacementDashboard() {
  const [data, setData]   = useState({ vacancies: [], upcomingFairs: [] });
  const [loading, setL]   = useState(true);
  const [tab, setTab]     = useState('vacancies');

  useEffect(() => {
    api.get('/api/trainer/placement-vacancies').then(r => setData(r.data)).finally(() => setL(false));
  }, []);

  const urgentHiring   = data.vacancies.filter(v => v.urgentHiring);
  const totalVac    = data.vacancies.reduce((s, v) => s + (v.totalVacancies || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Vacancies</h1>
        <p className="text-sm text-gray-500 mt-0.5">Opportunities relevant to your batch domains</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-green-700">{data.vacancies.length}</div>
          <div className="text-xs font-semibold text-green-600 mt-1">Companies</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{urgentHiring.length}</div>
          <div className="text-xs font-semibold text-red-500 mt-1">🔥 Hot Hiring</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-700">{totalVac}</div>
          <div className="text-xs font-semibold text-blue-600 mt-1">Total Openings</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm w-fit">
        {[['vacancies',`💼 Vacancies (${data.vacancies.length})`],['fairs',`🎪 Job Fairs (${data.upcomingFairs.length})`]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors ${tab===t ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Vacancies tab */}
      {tab === 'vacancies' && (
        <div className="space-y-3">
          {data.vacancies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="font-bold text-gray-700">No Vacancies Found</h3>
              <p className="text-sm mt-1">Vacancies matching your domain will appear here.</p>
            </div>
          ) : data.vacancies.map(v => (
            <div key={v.id} className={`bg-white rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all ${v.urgentHiring ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-gray-900">{v.companyName}</span>
                    {v.urgentHiring && <span className="badge-red text-xs">🔥 Hot Hiring</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                    {v.domain  && <span>🏷️ {v.domain}</span>}
                    {v.district && <span>📍 {v.district} / {v.block}</span>}
                    {v.contactPerson && <span>👤 {v.contactPerson}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-green-700">{v.totalVacancies}</div>
                  <div className="text-xs text-gray-400">openings</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>💡</span> Share this opportunity with eligible candidates in your batch!
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fairs tab */}
      {tab === 'fairs' && (
        <div className="space-y-3">
          {data.upcomingFairs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center text-gray-400">
              <div className="text-5xl mb-3">🎪</div>
              <h3 className="font-bold text-gray-700">No Upcoming Job Fairs</h3>
              <p className="text-sm mt-1">Fairs will be listed here when announced.</p>
            </div>
          ) : data.upcomingFairs.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{f.eventName}</h3>
                  <p className="text-sm text-gray-500">{f.companyName}</p>
                </div>
                <StatusBadge status={f.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1.5"><span>📍</span><span>{f.district} / {f.block}</span></div>
                <div className="flex items-center gap-1.5"><span>📅</span><span>{f.startDate ? (String(new Date(f.startDate).getDate()).padStart(2,'0') + '/' + String(new Date(f.startDate).getMonth()+1).padStart(2,'0') + '/' + new Date(f.startDate).getFullYear()) : '—'}</span></div>
                <div className="flex items-center gap-1.5"><span>💼</span><span className="font-semibold text-green-700">{f.vacancyCount} vacancies</span></div>
              </div>
              <div className="mt-3 bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700 font-medium">
                💡 Prepare your eligible candidates — register them for this fair!
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
