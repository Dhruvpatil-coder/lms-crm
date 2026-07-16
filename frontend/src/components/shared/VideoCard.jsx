import React from 'react';

// Extract YouTube video ID from various URL formats
export function getYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getEmbedUrl(url) {
  const ytId = getYoutubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;
  // Google Drive: convert /view to /preview
  if (url.includes('drive.google.com')) {
    return url.replace('/view', '/preview').replace('/edit', '/preview');
  }
  return url;
}

export function getThumbnail(session) {
  if (session.thumbnailUrl) return session.thumbnailUrl;
  const ytId = getYoutubeId(session.videoUrl);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  return null;
}

const DOMAIN_COLORS = {
  'IT': 'bg-blue-100 text-blue-700',
  'Healthcare': 'bg-red-100 text-red-700',
  'Retail': 'bg-orange-100 text-orange-700',
  'Manufacturing': 'bg-yellow-100 text-yellow-700',
  'Agriculture': 'bg-green-100 text-green-700',
  'Construction': 'bg-stone-100 text-stone-700',
  'Hospitality': 'bg-purple-100 text-purple-700',
};

export default function VideoCard({ session, onPlay, onEdit, onDelete, onTogglePublish, role }) {
  const thumb = getThumbnail(session);
  const domainCls = DOMAIN_COLORS[session.domain] || 'bg-gray-100 text-gray-600';
  const canEdit = role === 'admin' || role === 'hr' || (role === 'trainer' && session.trainerId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
      {/* Thumbnail */}
      <div
        className="relative h-44 bg-gray-100 cursor-pointer overflow-hidden"
        onClick={() => onPlay(session)}
      >
        {thumb ? (
          <img src={thumb} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-50">
            <span className="text-5xl opacity-40">🎬</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-6 h-6 text-green-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        {session.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-medium">
            {session.duration}
          </div>
        )}
        {/* Published/Draft badge */}
        <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-md ${session.isPublished ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'}`}>
          {session.isPublished ? '● Live' : '◌ Draft'}
        </div>
        {/* Views */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          {session.views}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">{session.title}</h3>
        </div>
        {session.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{session.description}</p>
        )}

        {/* Meta tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {session.domain && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${domainCls}`}>{session.domain}</span>}
          {session.course && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{session.course}</span>}
          {session.batch && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">📦 {session.batch.batchName}</span>}
          {session.tags && session.tags.split(',').slice(0,2).map(t => (
            <span key={t.trim()} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t.trim()}</span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="text-xs text-gray-400 truncate">
            {session.trainerName && <span>👤 {session.trainerName}</span>}
            {session.sessionDate && (
              <span className="ml-2">📅 {(String(new Date(session.sessionDate).getDate()).padStart(2,'0') + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(session.sessionDate).getMonth()] + ' ' + new Date(session.sessionDate).getFullYear())}</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => onPlay(session)}
              className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all"
            >
              ▶ Watch
            </button>
            {canEdit && onEdit && (
              <button onClick={() => onEdit(session)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
            )}
            {(role === 'admin' || role === 'hr') && onTogglePublish && (
              <button onClick={() => onTogglePublish(session)} className={`p-1.5 rounded-lg transition-all ${session.isPublished ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`} title={session.isPublished ? 'Unpublish' : 'Publish'}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={session.isPublished ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}/></svg>
              </button>
            )}
            {canEdit && onDelete && (
              <button onClick={() => onDelete(session)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
