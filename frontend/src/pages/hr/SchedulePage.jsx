import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/schedules/');
      setSchedules(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📅</div>
          <p>No schedules found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">{schedule.title || 'Untitled Schedule'}</h3>
              <p className="text-sm text-gray-500 mt-1">{schedule.description || 'No description'}</p>
              <p className="text-xs text-gray-400 mt-2">
                {schedule.startTime ? new Date(schedule.startTime).toLocaleString() : 'Time not set'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
