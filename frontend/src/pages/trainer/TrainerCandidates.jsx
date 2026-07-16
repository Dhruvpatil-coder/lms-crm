import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';

const STATUSES = ['Interested','Not Interested','Already Working','Self Employed','Not Responded','Interview Scheduled','Selected','Offer Received','Joined','Rejected'];

export default function TrainerCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [activeCand, setActive]     = useState(null);
  const [followModal, setFollowM]   = useState(false);
  const [histModal, setHistM]       = useState(false);
  const [history, setHistory]       = useState([]);
  const [followForm, setFF]         = useState({ followupDate: new Date().toISOString().split('T')[0], nextFollowupDate:'', status:'Interested', remark:'' });

  const load = async () => {
    const r = await api.get('/api/trainer/my-candidates');
    setCandidates(r.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = candidates.filter(c => {
    const ms = !search || c.fullName?.toLowerCase().includes(search.toLowerCase()) || c.mobileNumber?.includes(search);
    const ss = !statusFilter || c.placementStatus === statusFilter;
    return ms && ss;
  });

  const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: candidates.filter(c => c.placementStatus === s).length }), {});

  const openFollow = c => { setActive(c); setFF({ followupDate: new Date().toISOString().split('T')[0], nextFollowupDate:'', status: c.placementStatus, remark:'' }); setFollowM(true); };
  const openHist   = async c => {
    setActive(c);
    const r = await api.get(`/api/candidates/${c.id}/followups`);
    setHistory(r.data); setHistM(true);
  };

  const saveFollow = async () => {
    try {
      await api.post(`/api/candidates/${activeCand.id}/followup`, followForm);
      toast.success('Follow-up saved!'); setFollowM(false); load();
    } catch { toast.error('Failed'); }
  };

  const needsAttention = candidates.filter(c => ['Interview Scheduled','Not Responded','Offer Received'].includes(c.placementStatus));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">👥 My Candidates</h1>
        <p className="text-sm text-gray-500 mt-0.5">{candidates.length} candidates assigned to you</p>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
        {[
          { label:'All',          val:'',                    count: candidates.length,   cls:'bg-gray-100 text-gray-700' },
          { label:'✅ Joined',    val:'Joined',              count: counts['Joined'],    cls:'bg-green-100 text-green-700' },
          { label:'🎯 Selected',  val:'Selected',            count: counts['Selected'],  cls:'bg-emerald-100 text-emerald-700' },
          { label:'📅 Interview', val:'Interview Scheduled', count: counts['Interview Scheduled'], cls:'bg-indigo-100 text-indigo-700' },
          { label:'🤔 Interested',val:'Interested',          count: counts['Interested'],cls:'bg-blue-100 text-blue-700' },
          { label:'❌ Rejected',  val:'Rejected',            count: counts['Rejected'],  cls:'bg-red-100 text-red-700' },
        ].map(chip => (
          <button key={chip.val} onClick={() => setStatus(chip.val)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${statusFilter === chip.val ? chip.cls+' border-current' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
            {chip.label} {chip.count > 0 && <span className="ml-1 font-bold">{chip.count}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <input className="input" placeholder="🔍 Search by name or mobile number…" value={search} onChange={e => setSearch(e.target.value)} />

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5"><span>⚡</span> Needs Immediate Attention</p>
          <div className="flex flex-wrap gap-2">
            {needsAttention.map(c => (
              <div key={c.id} className="text-xs bg-white border border-amber-200 text-amber-700 rounded-lg px-2.5 py-1.5 font-medium flex items-center gap-1.5">
                <span>{c.fullName}</span><span className="text-amber-400">·</span><span>{c.placementStatus}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards list */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>No candidates found
          </div>
        ) : filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
            {/* Avatar */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${c.gender==='Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
              {c.fullName?.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{c.fullName}</span>
                <span className="text-xs text-gray-400">{c.candidateId}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap mt-0.5">
                <span>📱 {c.mobileNumber || '—'}</span>
                <span>📚 {c.course} · {c.batch}</span>
                <span>📍 {c.district}</span>
              </div>
            </div>

            {/* Status */}
            <StatusBadge status={c.placementStatus} />

            {/* Actions */}
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => openFollow(c)} className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">📝 Update</button>
              <button onClick={() => openHist(c)}   className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">📋 History</button>
            </div>
          </div>
        ))}
      </div>

      {/* Follow-up Modal */}
      <Modal isOpen={followModal} onClose={() => setFollowM(false)} title={`Update: ${activeCand?.fullName}`} size="md">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 text-sm">
            Current: <StatusBadge status={activeCand?.placementStatus} />
          </div>
          <div><label className="label">New Status</label>
            <select className="select text-base" value={followForm.status} onChange={e => setFF(p=>({...p,status:e.target.value}))}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Follow-up Date</label><input type="date" className="input" value={followForm.followupDate} onChange={e => setFF(p=>({...p,followupDate:e.target.value}))} /></div>
          <div><label className="label">Next Follow-up Date</label><input type="date" className="input" value={followForm.nextFollowupDate} onChange={e => setFF(p=>({...p,nextFollowupDate:e.target.value}))} /></div>
          <div><label className="label">Remarks</label><textarea className="input" rows={3} placeholder="What was discussed? Any update on placement?" value={followForm.remark} onChange={e => setFF(p=>({...p,remark:e.target.value}))} /></div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setFollowM(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={saveFollow} className="btn-primary flex-1">✅ Save Update</button>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={histModal} onClose={() => setHistM(false)} title={`History: ${activeCand?.fullName}`} size="md">
        {history.length === 0 ? (
          <div className="py-10 text-center text-gray-400"><div className="text-4xl mb-2">📋</div>No history yet</div>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="border-l-4 border-green-300 pl-4 py-2 bg-green-50/40 rounded-r-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">{h.followupDate ? (String(new Date(h.followupDate).getDate()).padStart(2,'0') + '/' + String(new Date(h.followupDate).getMonth()+1).padStart(2,'0') + '/' + new Date(h.followupDate).getFullYear()) : '—'}</span>
                  <StatusBadge status={h.status} />
                </div>
                {h.remark && <p className="text-sm text-gray-600">{h.remark}</p>}
                {h.nextFollowupDate && <p className="text-xs text-gray-400 mt-1">Next: {(String(new Date(h.nextFollowupDate).getDate()).padStart(2,'0') + '/' + String(new Date(h.nextFollowupDate).getMonth()+1).padStart(2,'0') + '/' + new Date(h.nextFollowupDate).getFullYear())}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
