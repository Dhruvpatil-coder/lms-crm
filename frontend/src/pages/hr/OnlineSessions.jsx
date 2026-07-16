import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../context/AuthContext';
import filterConfig from '../../utils/filterConfig';

export default function OnlineSessions() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'hr' || role === 'manager';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', domain: '', course: '', sessionDate: '', duration: '' });
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [course, setCourse] = useState('');

  const [watchModal, setWatchModal] = useState(false);
  const [watchUrl, setWatchUrl] = useState('');

  const domains = filterConfig.getFilter('DOMAINS') || [];
  const courses = filterConfig.getFilter('COURSES') || [];

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (domain) params.append('domain', domain);
      if (course) params.append('course', course);

      const endpoint = isAdmin ? '/api/sessions/all' : '/api/sessions/public';
      const res = await api.get(`${endpoint}?${params.toString()}`);
      setSessions(res.data || []);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadSessions();
  };

  const clearFilters = () => {
    setSearch('');
    setDomain('');
    setCourse('');
    setTimeout(() => loadSessions(), 0);
  };

  const save = async () => {
    if (!form.title.trim() || !form.videoUrl.trim()) {
      toast.error('Title and Video URL are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/sessions/', form);
      toast.success('Session added!');
      setModal(false);
      setForm({ title: '', description: '', videoUrl: '', domain: '', course: '', sessionDate: '', duration: '' });
      loadSessions();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    await api.delete(`/api/sessions/${id}`);
    toast.success('Deleted');
    loadSessions();
  };

  const F = (f) => setForm(p => ({ ...p, ...f }));

  const [previewUrl, setPreviewUrl] = useState('');
  useEffect(() => { setPreviewUrl(getEmbedUrl(form.videoUrl)); }, [form.videoUrl]);

  const getGoogleDriveFileId = (url) => {
    const match = url?.match(/(?:drive\.google\.com\/file\/d\/|id=)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeId = (url) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url) => {
    const yId = getYouTubeId(url);
    if (yId) return `https://www.youtube.com/embed/${yId}`;
    return null; // Google Drive doesn't work in iframe - open in new tab
  };

  const isGoogleDrive = (url) => {
    return url?.includes('drive.google.com');
  };

  const openWatch = (url) => {
    if (isGoogleDrive(url)) {
      window.open(url, '_blank');
      return;
    }
    const embed = getEmbedUrl(url);
    if (embed) {
      setWatchUrl(embed);
      setWatchModal(true);
    } else {
      window.open(url, '_blank');
    }
  };

  const getVideoThumbnail = (url) => {
    const yId = getYouTubeId(url);
    if (yId) return `https://img.youtube.com/vi/${yId}/mqdefault.jpg`;
    return null;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video & Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessions.length} sessions</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5">
            <span>+</span> Add Session
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="label text-xs text-gray-500">Search</label>
            <input
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title..."
            />
          </div>
          <div className="w-full md:w-48">
            <label className="label text-xs text-gray-500">Domain</label>
            <select className="input" value={domain} onChange={e => setDomain(e.target.value)}>
              <option value="">All Domains</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="label text-xs text-gray-500">Course</label>
            <select className="input" value={course} onChange={e => setCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleFilter} className="btn-primary">Filter</button>
            <button onClick={clearFilters} className="btn-secondary">Clear</button>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="mx-auto mb-3">
            <rect x="2" y="2" width="20" height="20" rx="2.18" />
            <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
          </svg>
          <h3 className="text-lg font-bold text-gray-700">No Sessions Yet</h3>
          <p className="text-gray-400 text-sm mt-1">Click &quot;+ Add Session&quot; to add your first video session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(s => {
            const thumb = getVideoThumbnail(s.videoUrl);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                {thumb ? (
                  <div
                    className="relative w-full h-40 rounded-xl overflow-hidden mb-3 cursor-pointer group"
                    onClick={() => openWatch(s.videoUrl)}
                  >
                    <img src={thumb} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-all">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-green-600 font-bold text-sm shadow-lg">
                        Play
                      </div>
                    </div>
                  </div>
                ) : s.videoUrl ? (
                  <div
                    className="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center mb-3 cursor-pointer hover:bg-gray-200 transition-all border border-gray-200"
                    onClick={() => openWatch(s.videoUrl)}
                  >
                    <div className="text-center">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="mx-auto mb-2">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" />
                        <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
                      </svg>
                      <div className="text-sm font-bold text-gray-600">
                        {isGoogleDrive(s.videoUrl) ? 'Google Drive' : 'Watch Video'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {isGoogleDrive(s.videoUrl) ? 'Click to open' : 'Click to play'}
                      </div>
                    </div>
                  </div>
                ) : null}
                <h3 className="font-bold text-gray-900">{s.title || 'Untitled'}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description || 'No description'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.domain && <span className="badge-blue text-xs">{s.domain}</span>}
                  {s.course && <span className="badge-green text-xs">{s.course}</span>}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 items-center">
                  {s.videoUrl && (
                    <button onClick={() => openWatch(s.videoUrl)} className="text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                      {isGoogleDrive(s.videoUrl) ? 'Open in Google Drive' : 'Watch Video'}
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button onClick={() => del(s.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto">Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Session" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => F({ title: e.target.value })} placeholder="e.g. Python Basics" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Video URL *</label>
            <input className="input" value={form.videoUrl} onChange={e => F({ videoUrl: e.target.value })} placeholder="Paste Google Drive or YouTube link here" />
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>How to use Google Drive videos:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-0.5">
                <li>Upload video to your Google Drive folder</li>
                <li>Right-click the video → <strong>Share</strong> → <strong>Anyone with the link can view</strong></li>
                <li>Copy the link and paste it here</li>
                <li>Click <strong>Test Link</strong> below to verify it works before saving</li>
              </ol>
            </div>
            {form.videoUrl && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => window.open(form.videoUrl, '_blank')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium">
                    Test Link (opens new tab)
                  </button>
                </div>
                {isGoogleDrive(form.videoUrl) ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-sm text-gray-600 font-medium">Google Drive Video</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Test Link" to verify it opens</p>
                    <p className="text-xs text-amber-600 mt-2">Make sure the video is shared as "Anyone with the link can view"</p>
                  </div>
                ) : getEmbedUrl(form.videoUrl) ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-black">
                    <div className="text-xs text-gray-400 px-3 py-1 bg-gray-800 border-b border-gray-700">Preview</div>
                    <iframe
                      src={previewUrl}
                      title="Video Preview"
                      className="w-full h-48"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => F({ description: e.target.value })} placeholder="Session description..." />
          </div>
          <div>
            <label className="label">Domain</label>
            <select className="input" value={form.domain} onChange={e => F({ domain: e.target.value })}>
              <option value="">Select Domain</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Course</label>
            <select className="input" value={form.course} onChange={e => F({ course: e.target.value })}>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Session Date</label>
            <input type="date" className="input" value={form.sessionDate} onChange={e => F({ sessionDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" className="input" value={form.duration} onChange={e => F({ duration: e.target.value })} placeholder="60" />
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </Modal>

      {/* Watch Video Modal */}
      <Modal isOpen={watchModal} onClose={() => { setWatchModal(false); setWatchUrl(''); }} title="Watch Video" size="xl">
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
          {watchUrl ? (
            <iframe
              src={watchUrl}
              title="Video Player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">No video URL available</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
