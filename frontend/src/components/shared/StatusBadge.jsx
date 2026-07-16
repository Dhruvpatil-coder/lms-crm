import React from 'react';

const STATUS_MAP = {
  'Interested':          'bg-blue-100 text-blue-700',
  'Not Interested':      'bg-red-100 text-red-700',
  'Already Working':     'bg-gray-100 text-gray-600',
  'Self Employed':       'bg-purple-100 text-purple-700',
  'Not Responded':       'bg-amber-100 text-amber-700',
  'Interview Scheduled': 'bg-indigo-100 text-indigo-700',
  'Selected':            'bg-emerald-100 text-emerald-700',
  'Offer Received':      'bg-teal-100 text-teal-700',
  'Joined':              'bg-green-100 text-green-800',
  'Rejected':            'bg-red-100 text-red-700',
  'Upcoming':            'bg-blue-100 text-blue-700',
  'Ongoing':             'bg-green-100 text-green-700',
  'Completed':           'bg-gray-100 text-gray-600',
  'Cancelled':           'bg-red-100 text-red-600',
  'Active':              'bg-green-100 text-green-700',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'bg-gray-100 text-gray-600';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}
