import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

// Quick-login demo buttons are for local development only.
// They are hidden unless REACT_APP_SHOW_DEMO_LOGINS=true is set (e.g. in a local .env),
// so real credentials are never shipped/visible in a production/public build.
const SHOW_DEMO_LOGINS = process.env.REACT_APP_SHOW_DEMO_LOGINS === 'true';

const QUICK_LOGINS = [
  { role: 'admin',    label: 'Admin',     email: 'admin@lms.com',    password: 'admin123',    icon: 'A' },
  { role: 'manager',  label: 'Manager',   email: 'manager@lms.com',  password: 'manager123',  icon: 'M' },
  { role: 'hr',       label: 'Placement', email: 'hr@lms.com',       password: 'hr123',       icon: 'P' },
  { role: 'trainer',  label: 'Trainer',   email: 'trainer@lms.com',  password: 'trainer123',  icon: 'T' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [stats, setStats] = useState({ candidates: 0, activeUsers: 0, placements: 0 });
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/stats/public').then(res => {
      setStats(res.data);
    }).catch(() => {});
  }, []);

  const doLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'hr') navigate('/hr');
      else if (user.role === 'manager') navigate('/hr');
      else navigate('/trainer');
    } catch (err) {
      if (err.response?.data?.error) toast.error(err.response.data.error);
      else if (!err.response) toast.error('Cannot reach the server. Is the backend running on port 5000?');
      else toast.error('Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const handleQuickLogin = (q) => {
    setEmail(q.email);
    setPassword(q.password);
    doLogin(q.email, q.password);
  };

  const formatCount = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Green */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-green-500 to-green-700 flex-col justify-between p-12 relative overflow-hidden">
        {/* Logo */}
        <div className="z-10">
          <div className="bg-white rounded-xl px-4 py-2.5 inline-flex items-center gap-3 shadow-lg">
            <img src="/logo-icon.png" alt="UNNATVA" className="h-7 w-auto" />
            <span className="text-green-800 font-bold text-lg tracking-wide">UNNATVA</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="z-10 flex-1 flex flex-col justify-center py-10 max-w-md">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Your placement<br />command center.
          </h1>
          <p className="text-green-100 text-base leading-relaxed mb-10">
            Track leads, manage trainees and close placements — all in one secure workspace built for your team.
          </p>
          
          {/* Features */}
          <div className="space-y-4 mb-10">
            {[
              'Real-time lead pipeline tracking',
              'Role-based access for every team',
              'Placement analytics at a glance'
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-400/40 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-green-50 text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-green-200 text-sm font-medium">LIVE NOW</span>
          </div>
          
          {/* Stats - Real counts from API */}
          <div className="flex gap-10">
            <div>
              <div className="text-3xl font-bold text-white">{formatCount(stats.candidates)}</div>
              <div className="text-green-200 text-sm mt-1">Leads managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{formatCount(stats.activeUsers)}</div>
              <div className="text-green-200 text-sm mt-1">Team online now</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{formatCount(stats.placements)}</div>
              <div className="text-green-200 text-sm mt-1">Placed today</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - White */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h1>
          <p className="text-gray-400 text-sm mb-8">Welcome back. Please enter your details.</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 6l10 7 10-7" />
                </svg>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" placeholder="you@example.com" required />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-16 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-green-600 hover:text-green-700">
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-green-600 hover:text-green-700">Forgot password?</button>
            </div>
            
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:bg-green-800 transition-all disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
          
          {/* Quick Login - dev/demo only, hidden in production builds */}
          {SHOW_DEMO_LOGINS && (
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Login - Demo</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {QUICK_LOGINS.map(q => (
                  <button key={q.role} disabled={loading}
                    onClick={() => handleQuickLogin(q)}
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold transition-all hover:border-green-300 hover:bg-green-50 hover:text-green-700">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                      {q.icon}
                    </div>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-center text-gray-400 text-xs mt-6">
            Unnatva — Skill Development & Placement Platform
          </p>
        </div>
      </div>
    </div>
  );
}
