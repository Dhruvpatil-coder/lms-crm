import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';

export default function AdminTrainerMonitoring() {
  const [records, setRecords] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [filters, setFilters] = useState({ trainerId:'', fromDate:'', toDate:'' });
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = { ...filters };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    const res = await api.get('/api/admin/trainer-attendance', { params });
    setRecords(res.data); setLoading(false);
  }, [filters]);

  useEffect(() => {
    api.get('/api/admin/trainers').then(r => setTrainers(r.data));
    fetchRecords();
  }, [fetchRecords]);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date?.split('T')[0] === today);

  const trainerStats = trainers.map(t => {
    const recs = records.filter(r => r.trainerId === t.id);
    return { ...t, present: recs.filter(r => r.checkinTime).length, records: recs };
  });

  const fmtTime = (ts) => ts ? (String(new Date(ts).getHours()).padStart(2,'0') + ':' + String(new Date(ts).getMinutes()).padStart(2,'0')) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔍 Trainer Monitoring</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track trainer attendance and daily activities</p>
      </div>

      {/* Today Live Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="font-bold text-gray-800">Today's Status — {(String(new Date().getDate()).padStart(2,'0') + '/' + String(new Date().getMonth()+1).padStart(2,'0') + '/' + new Date().getFullYear())}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trainers.map(t => {
            const rec = todayRecords.find(r => r.trainerId === t.id);
            const state = rec?.checkoutTime ? 'done' : rec?.checkinTime ? 'in' : 'absent';
            return (
              <div key={t.id} className={`rounded-xl border-2 p-4 ${state==='done' ? 'bg-green-50 border-green-200' : state==='in' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-full border flex items-center justify-center font-bold text-sm text-gray-700">{t.name?.charAt(0)}</div>
                  <span className="text-sm font-semibold text-gray-800 truncate">{t.name?.split(' ')[0]}</span>
                </div>
                {rec?.checkinTime ? (
                  <div className="text-xs space-y-0.5">
                    <div className="text-green-700 font-semibold">✅ In: {fmtTime(rec.checkinTime)}</div>
                    {rec.checkoutTime ? <div className="text-orange-600 font-semibold">🔴 Out: {fmtTime(rec.checkoutTime)}</div>
                    : <div className="text-blue-600 font-medium">🟡 Working</div>}
                    <div className="text-gray-400 truncate">{rec.vdcName}</div>
                  </div>
                ) : <div className="text-xs text-gray-400 font-medium">⭕ Not checked in</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end shadow-sm">
        <div className="flex-1 min-w-40">
          <label className="label text-xs">Trainer</label>
          <select className="select" value={filters.trainerId} onChange={e => setFilters(f=>({...f,trainerId:e.target.value}))}>
            <option value="">All Trainers</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div><label className="label text-xs">From Date</label><input type="date" className="input w-auto" value={filters.fromDate} onChange={e => setFilters(f=>({...f,fromDate:e.target.value}))} /></div>
        <div><label className="label text-xs">To Date</label><input type="date" className="input w-auto" value={filters.toDate} onChange={e => setFilters(f=>({...f,toDate:e.target.value}))} /></div>
        <button onClick={fetchRecords} className="btn-primary">Apply</button>
        <button onClick={() => { setFilters({trainerId:'',fromDate:'',toDate:''}); setTimeout(fetchRecords,50); }} className="btn-secondary">Reset</button>
      </div>

      {/* Trainer Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trainerStats.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold">{t.name?.charAt(0)}</div>
              <div><div className="font-semibold text-gray-800 text-sm">{t.name}</div><div className="text-xs text-gray-400">{t.district||'—'}</div></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Attendance</span><span className="font-bold text-green-700">{t.present} days</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width:`${Math.min((t.present/14)*100,100)}%`}}/></div>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Attendance Log</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{records.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="table-th">Trainer</th><th className="table-th">Date</th>
                <th className="table-th">VDC</th><th className="table-th">Check-In</th>
                <th className="table-th">Check-Out</th><th className="table-th">Activity</th>
                <th className="table-th">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              : records.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">No records found</td></tr>
              : records.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-td font-semibold text-gray-800">{r.trainerName}</td>
                  <td className="table-td font-medium">{r.date ? (String(new Date(r.date).getDate()).padStart(2,'0') + '/' + String(new Date(r.date).getMonth()+1).padStart(2,'0') + '/' + new Date(r.date).getFullYear()) : '—'}</td>
                  <td className="table-td text-gray-500">{r.vdcName||'—'}</td>
                  <td className="table-td">{fmtTime(r.checkinTime) ? <span className="text-green-700 font-semibold">{fmtTime(r.checkinTime)}</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="table-td">{fmtTime(r.checkoutTime) ? <span className="text-orange-600 font-semibold">{fmtTime(r.checkoutTime)}</span> : r.checkinTime ? <span className="badge-yellow">In Progress</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="table-td"><span className="badge-green text-xs">{r.activityType||'—'}</span></td>
                  <td className="table-td text-gray-400 text-xs max-w-[180px] truncate">{r.workDetails||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
