import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import filterConfig from '../../utils/filterConfig';

const ACTIVITIES = ['Theory Session','Practical Session','Guest Lecture','Assessment','Placement Activity','Industry Visit','Counseling Session','Other'];
const DISTRICTS = filterConfig.getFilter('DISTRICTS');
const BLOCKS = filterConfig.getFilter('BLOCKS');

const ACTIVITY_ICONS = { 'Theory Session':'📖', 'Practical Session':'🔬', 'Guest Lecture':'🎤', 'Assessment':'📝', 'Placement Activity':'🏢', 'Industry Visit':'🏭', 'Counseling Session':'🤝', 'Other':'💼' };

export default function TrainerDailyTracker() {
  const { user } = useAuth();
  const [status, setStatus] = useState({ checkedIn: false, checkedOut: false });
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState('view');
  const [loading, setLoading] = useState(false);
  const [checkinForm, setCheckinForm] = useState({ vdcName:'', district: user?.district||'', block:'', activityType: ACTIVITIES[0], workDetails:'' });
  const [checkoutForm, setCheckoutForm] = useState({ workDetails:'' });
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    const [s, h] = await Promise.all([api.get('/api/trainer/today-status'), api.get('/api/trainer/attendance-history')]);
    setStatus(s.data); setHistory(h.data);
  };
  useEffect(() => { load(); }, []);

  const checkin = async () => {
    if (!checkinForm.vdcName) { toast.error('Please enter VDC Name'); return; }
    setLoading(true);
    try { await api.post('/api/trainer/checkin', checkinForm); toast.success('✅ Checked in!'); setStep('view'); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const checkout = async () => {
    setLoading(true);
    try { await api.post('/api/trainer/checkout', checkoutForm); toast.success('✅ Day complete! Great work!'); setStep('view'); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Please check in first'); }
    finally { setLoading(false); }
  };

  const F = (f) => setCheckinForm(p => ({...p,...f}));
  const today = (() => { const d = new Date(); const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const months = ['January','February','March','April','May','June','July','August','September','October','November','December']; return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); })();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">📋 Daily Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </div>

      {/* Live Clock */}
      <div className="text-center py-4 bg-green-50 border border-green-100 rounded-2xl">
        <div className="text-4xl font-mono font-bold text-green-700">{(String(time.getHours()).padStart(2,'0') + ':' + String(time.getMinutes()).padStart(2,'0') + ':' + String(time.getSeconds()).padStart(2,'0'))}</div>
        <div className="text-xs text-green-600 font-medium mt-1">{(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][time.getDay()])}</div>
      </div>

      {/* Status Card */}
      {step === 'view' && (
        <>
          {!status.checkedIn ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
              <div className="text-5xl mb-3">🌅</div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Good Morning, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-gray-400 text-sm mb-6">You haven't checked in today. Tap below to start your day.</p>
              <button onClick={() => setStep('checkin')} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:scale-105">
                🟢 Check In Now
              </button>
            </div>
          ) : !status.checkedOut ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">💪</div>
              <h2 className="text-xl font-bold text-green-800 mb-4">You're Checked In!</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[['Check-in', status.checkinTime?.split('T')[1]?.slice(0,5), 'text-green-700'],
                  ['Activity', status.activityType, 'text-blue-700 text-xs'],
                  ['Location', status.vdcName, 'text-gray-700 text-xs']].map(([label, val, cls]) => (
                  <div key={label} className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <div className={`font-bold truncate ${cls}`}>{val || '—'}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('checkout')} className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all hover:scale-105">
                🔴 Check Out
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-green-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-green-700 mb-4">Day Complete!</h2>
              <div className="flex justify-center items-center gap-4">
                <div className="text-center"><div className="text-xs text-gray-400">In</div><div className="text-lg font-bold text-green-600">{status.checkinTime?.split('T')[1]?.slice(0,5)}</div></div>
                <div className="text-gray-300 text-2xl">→</div>
                <div className="text-center"><div className="text-xs text-gray-400">Out</div><div className="text-lg font-bold text-orange-500">{status.checkoutTime?.split('T')[1]?.slice(0,5)}</div></div>
              </div>
              <p className="text-gray-400 text-sm mt-4">Great work today! See you tomorrow. 👋</p>
            </div>
          )}
        </>
      )}

      {/* Check-in Form */}
      {step === 'checkin' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">📍 Check-In Details</h2>
          <div><label className="label">VDC / Training Center Name *</label><input className="input text-base" placeholder="Enter center name" value={checkinForm.vdcName} onChange={e=>F({vdcName:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">District</label><select className="select" value={checkinForm.district} onChange={e=>F({district:e.target.value})}><option value="">Select</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="label">Block</label><select className="select" value={checkinForm.block} onChange={e=>F({block:e.target.value})}><option value="">Select</option>{BLOCKS.map(b=><option key={b}>{b}</option>)}</select></div>
          </div>
          <div>
            <label className="label">Today's Activity</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map(a => (
                <button key={a} onClick={() => F({activityType:a})}
                  className={`flex items-center gap-2 text-sm py-3 px-3 rounded-xl border-2 transition-all text-left ${checkinForm.activityType === a ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50/50'}`}>
                  <span>{ACTIVITY_ICONS[a]}</span>{a}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Work Plan for Today (optional)</label><textarea className="input" rows={3} placeholder="Brief plan for today's session..." value={checkinForm.workDetails} onChange={e=>F({workDetails:e.target.value})} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep('view')} className="btn-secondary flex-1">Cancel</button>
            <button onClick={checkin} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all">
              {loading ? 'Checking In...' : '✅ Confirm Check-In'}
            </button>
          </div>
        </div>
      )}

      {/* Check-out Form */}
      {step === 'checkout' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">📝 End of Day Summary</h2>
          <div><label className="label">What did you accomplish today?</label><textarea className="input" rows={5} placeholder="Describe your work: sessions conducted, topics covered, student progress, issues faced..." value={checkoutForm.workDetails} onChange={e=>setCheckoutForm({workDetails:e.target.value})} /></div>
          <div className="flex gap-3">
            <button onClick={() => setStep('view')} className="btn-secondary flex-1">Cancel</button>
            <button onClick={checkout} disabled={loading} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all">
              {loading ? 'Checking Out...' : '🔴 Confirm Check-Out'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">📅 Recent Attendance</h2>
          <span className="text-xs text-gray-400">Last 14 days</span>
        </div>
        <div className="divide-y divide-gray-50">
          {history.slice(0,14).map(r => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="w-12 text-center flex-shrink-0">
                <div className="text-xs text-gray-400">{(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(r.date).getDay()])}</div>
                <div className="text-base font-bold text-gray-800">{new Date(r.date).getDate()}</div>
                <div className="text-xs text-gray-400">{(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(r.date).getMonth()])}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm truncate">{r.vdcName||'—'}</div>
                <div className="text-xs text-gray-400">{r.activityType||'—'}</div>
              </div>
              <div className="text-right flex-shrink-0 text-xs">
                <div className="text-green-600 font-semibold">{r.checkinTime ? (String(new Date(r.checkinTime).getHours()).padStart(2,'0') + ':' + String(new Date(r.checkinTime).getMinutes()).padStart(2,'0')) : '—'}</div>
                <div className="text-orange-500 font-semibold">{r.checkoutTime ? (String(new Date(r.checkoutTime).getHours()).padStart(2,'0') + ':' + String(new Date(r.checkoutTime).getMinutes()).padStart(2,'0')) : '—'}</div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.checkoutTime ? 'bg-green-400' : r.checkinTime ? 'bg-amber-400' : 'bg-gray-200'}`} />
            </div>
          ))}
          {history.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No attendance records yet</div>}
        </div>
      </div>
    </div>
  );
}
