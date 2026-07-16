import React from 'react';

const variants = {
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  val: 'text-green-700',  border: 'border-green-100' },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    val: 'text-blue-700',   border: 'border-blue-100' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      val: 'text-red-700',    border: 'border-red-100' },
  yellow: { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',  val: 'text-amber-700',  border: 'border-amber-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',val: 'text-purple-700', border: 'border-purple-100' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600',val: 'text-orange-700', border: 'border-orange-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600',val: 'text-indigo-700', border: 'border-indigo-100' },
};

export default function KPICard({ title, value, icon, color = 'green', subtitle, trend }) {
  const v = variants[color] || variants.green;
  // Ensure value is renderable (not an object)
  const displayValue = (value === null || value === undefined) ? '—' : 
    (typeof value === 'object') ? JSON.stringify(value) : value;
  return (
    <div className={`${v.bg} border ${v.border} rounded-2xl p-5 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={`text-3xl font-bold ${v.val} mt-1.5 leading-none`}>{displayValue}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${v.icon} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
