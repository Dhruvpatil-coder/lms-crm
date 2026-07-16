import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import TrainerDailyTracker from './TrainerDailyTracker';
import TrainerBatches from './TrainerBatches';
import TrainerPlacementDashboard from './TrainerPlacementDashboard';
import TrainerOnlineSessions from './TrainerOnlineSessions';
import TrainerSchedule from './TrainerSchedule';

const navItems = [
  { path: '/trainer/daily-tracker', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: 'Daily Tracker' },
  { path: '/trainer/batches',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'My Batches' },
  { path: '/trainer/placements',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, label: 'Job Vacancies' },
  { path: '/trainer/sessions',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, label: 'Video Sessions' },
];

export default function TrainerLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar navItems={navItems} title="Trainer Portal" />
      <main className="flex-1 overflow-auto min-w-0">
        <Routes>
          <Route index element={<Navigate to="daily-tracker" replace />} />
          <Route path="daily-tracker" element={<TrainerDailyTracker />} />
          <Route path="batches"       element={<TrainerBatches />} />
          <Route path="sessions"      element={<TrainerOnlineSessions />} />
          <Route path="schedule"      element={<TrainerSchedule />} />
          <Route path="placements"    element={<TrainerPlacementDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
