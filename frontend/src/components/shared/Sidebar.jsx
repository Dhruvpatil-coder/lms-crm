import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ navItems, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColors = { admin: 'bg-green-600', manager: 'bg-amber-500', hr: 'bg-blue-500', trainer: 'bg-emerald-500' };
  const roleLabels = { admin: 'Administrator', manager: 'Manager', hr: 'Placement', trainer: 'Trainer' };

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-100 min-h-screen flex flex-col flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <img src="/logo-icon.png" alt="UNNATVA" className="h-10 w-10 rounded-xl object-cover flex-shrink-0 shadow-md" />
        {!collapsed && (
          <div>
            <div className="font-bold text-gray-900 text-base leading-tight">Unnatva</div>
            <div className="text-xs text-gray-400">{title}</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors" title={collapsed ? 'Expand' : 'Collapse'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <><path d="M13 5l7 7-7 7"/><path d="M5 5l7 7-7 7"/></>
            ) : (
              <><path d="M11 5l-7 7 7 7"/><path d="M19 5l-7 7 7 7"/></>
            )}
          </svg>
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5">
            <div className={`w-9 h-9 ${roleColors[user?.role] || 'bg-green-600'} rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">{roleLabels[user?.role] || user?.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Label */}
      {!collapsed && (
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-600 rounded-r-full" />}
                <span className={`text-lg flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>{item.icon}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {!collapsed && item.status && <span className="ml-auto w-2 h-2 bg-green-500 rounded-full" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
