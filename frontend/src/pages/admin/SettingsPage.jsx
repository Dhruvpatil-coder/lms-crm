import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import filterConfig from '../../utils/filterConfig';

const SECTIONS = [
  { key: 'DISTRICTS', label: 'Districts', placeholder: 'e.g. Patna' },
  { key: 'BLOCKS', label: 'Blocks', placeholder: 'e.g. Block F' },
  { key: 'REGIONS', label: 'Regions', placeholder: 'e.g. West Bihar' },
  { key: 'STATES', label: 'States', placeholder: 'e.g. Jharkhand' },
  { key: 'DOMAINS', label: 'Domains', placeholder: 'e.g. Finance' },
  { key: 'COURSES', label: 'Courses', placeholder: 'e.g. Python' },
  { key: 'STATUSES', label: 'Placement Statuses', placeholder: 'e.g. On Hold' },
  { key: 'QUALS', label: 'Qualifications', placeholder: 'e.g. B.Tech' },
];

export default function SettingsPage() {
  const [data, setData] = useState({});
  const [newVals, setNewVals] = useState({});
  const [activeTab, setActiveTab] = useState('DISTRICTS');

  useEffect(() => {
    const obj = {};
    SECTIONS.forEach(s => { obj[s.key] = filterConfig.getFilter(s.key); });
    setData(obj);
  }, []);

  const save = (key, values) => {
    filterConfig.setFilter(key, values);
    toast.success(`${SECTIONS.find(s => s.key === key).label} saved!`);
  };

  const add = (key) => {
    const val = (newVals[key] || '').trim();
    if (!val) return;
    const arr = [...(data[key] || []), val];
    setData(p => ({ ...p, [key]: arr }));
    setNewVals(p => ({ ...p, [key]: '' }));
    save(key, arr);
  };

  const remove = (key, idx) => {
    const arr = (data[key] || []).filter((_, i) => i !== idx);
    setData(p => ({ ...p, [key]: arr }));
    save(key, arr);
  };

  const reset = () => {
    if (!window.confirm('Reset ALL filters to default? This cannot be undone.')) return;
    filterConfig.resetAll();
    const obj = {};
    SECTIONS.forEach(s => { obj[s.key] = filterConfig.getFilter(s.key); });
    setData(obj);
    toast.success('All filters reset to default');
  };

  const activeSection = SECTIONS.find(s => s.key === activeTab);
  const items = data[activeTab] || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage filter options used across the entire app</p>
        </div>
        <button onClick={reset} className="btn-secondary text-sm">Reset All</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveTab(s.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeTab === s.key ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">{activeSection?.label}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{items.length} items</span>
        </div>

        <div className="flex gap-2">
          <input className="input flex-1" placeholder={activeSection?.placeholder} value={newVals[activeTab] || ''} onChange={e => setNewVals(p => ({ ...p, [activeTab]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && add(activeTab)} />
          <button onClick={() => add(activeTab)} className="btn-primary px-4">+ Add</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-xl text-sm font-medium">
              {item}
              <button onClick={() => remove(activeTab, idx)} className="w-5 h-5 rounded-full bg-green-200 text-green-700 hover:bg-red-200 hover:text-red-600 flex items-center justify-center text-xs transition-colors">x</button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No items yet. Add your first one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
