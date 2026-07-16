import React, { useEffect } from 'react';
import { getEmbedUrl, getYoutubeId } from './VideoCard';

export default function VideoPlayerModal({ session, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!session) return null;

  const embedUrl = getEmbedUrl(session.videoUrl);
  const isYoutube = !!getYoutubeId(session.videoUrl);
  const isDrive = session.videoUrl?.includes('drive.google.com');
  const isDirectVideo = !isYoutube && !isDrive && /\.(mp4|webm|ogg)(\?.*)?$/i.test(session.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">{session.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-300 flex-wrap">
              {session.trainerName && <span>👤 {session.trainerName}</span>}
              {session.domain && <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{session.domain}</span>}
              {session.course && <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{session.course}</span>}
              {session.duration && <span>⏱ {session.duration}</span>}
              {session.views > 0 && <span>👁 {session.views} views</span>}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all text-lg font-light">✕</button>
        </div>

        {/* Video */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
          {isDirectVideo ? (
            <video
              src={session.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              title={session.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}
        </div>

        {/* Description */}
        {session.description && (
          <div className="mt-3 bg-white/5 rounded-xl px-4 py-3">
            <p className="text-gray-300 text-sm leading-relaxed">{session.description}</p>
          </div>
        )}

        {/* Tags */}
        {session.tags && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {session.tags.split(',').map(t => (
              <span key={t.trim()} className="text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-full"># {t.trim()}</span>
            ))}
          </div>
        )}

        {/* Open in new tab */}
        <div className="mt-3 flex justify-end">
          <a href={session.videoUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
