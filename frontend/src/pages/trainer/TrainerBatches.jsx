import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const STATUS_STYLE = {
  Active:    'bg-green-50 border-green-200 text-green-700',
  Completed: 'bg-gray-50 border-gray-200 text-gray-600',
  Upcoming:  'bg-blue-50 border-blue-200 text-blue-700',
};

export default function TrainerBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/trainer/batches').then(r => setBatches(r.data)).finally(() => setLoading(false));
  }, []);

  const daysLeft = end => {
    if (!end) return null;
    return Math.ceil((new Date(end) - new Date()) / 86400000);
  };

  const counts = { Active: batches.filter(b => b.status==='Active').length, Upcoming: batches.filter(b => b.status==='Upcoming').length, Completed: batches.filter(b => b.status==='Completed').length };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        Loading batches…
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎓 My Batches</h1>
        <p className="text-sm text-gray-500 mt-0.5">{batches.length} batches assigned to you</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[['Active','🟢','bg-green-50 border-green-200 text-green-700'],['Upcoming','🔵','bg-blue-50 border-blue-200 text-blue-700'],['Completed','✅','bg-gray-50 border-gray-200 text-gray-600']].map(([s,icon,cls]) => (
          <div key={s} className={`rounded-2xl border-2 p-4 text-center ${cls}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-3xl font-bold">{counts[s]}</div>
            <div className="text-xs font-semibold mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <div className="text-5xl mb-3">📚</div>
          <h3 className="font-bold text-gray-700 text-lg">No Batches Yet</h3>
          <p className="text-gray-400 text-sm mt-1">Your assigned batches will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map(b => {
            const dl = daysLeft(b.endDate);
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <h3 className="font-bold text-gray-900">{b.batchName}</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-7 mt-0.5">{b.course}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[b.status] || STATUS_STYLE.Active}`}>
                    {b.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[['🏷️','Domain',b.domain],['👥','Students',b.totalStudents],['📍','Location',`${b.district||'—'} / ${b.block||'—'}`],['🏫','VDC Center',b.vdcName]].map(([ic,lbl,val]) => (
                    <div key={lbl} className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0 mt-0.5">{ic}</span>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-400">{lbl}</div>
                        <div className="text-sm font-semibold text-gray-700 truncate">{val || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Date bar */}
                <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-xs mb-3">
                  <div className="text-center"><div className="text-gray-400 mb-0.5">Start</div><div className="font-bold text-gray-700">{b.startDate ? (String(new Date(b.startDate).getDate()).padStart(2,'0') + '/' + String(new Date(b.startDate).getMonth()+1).padStart(2,'0') + '/' + new Date(b.startDate).getFullYear()) : '—'}</div></div>
                  <div className="flex-1 mx-3 h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{width:'50%'}}/></div>
                  <div className="text-center"><div className="text-gray-400 mb-0.5">End</div><div className="font-bold text-gray-700">{b.endDate ? (String(new Date(b.endDate).getDate()).padStart(2,'0') + '/' + String(new Date(b.endDate).getMonth()+1).padStart(2,'0') + '/' + new Date(b.endDate).getFullYear()) : '—'}</div></div>
                </div>

                {/* Days left */}
                {b.status === 'Active' && dl !== null && (
                  <div className={`text-center text-xs font-semibold py-2 rounded-xl ${dl < 0 ? 'bg-red-50 text-red-600' : dl <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                    {dl < 0 ? '⚠️ Batch has ended' : dl === 0 ? '⏰ Ends today!' : `⏳ ${dl} days remaining`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
