import React, { useState, useEffect } from 'react';
import { toggleBookmark, loadBookmarks } from '../lib/bookmarks';

export default function BookmarkButton({ studyId }) {
  const [saved, setSaved] = useState(() => !!loadBookmarks()[studyId]);

  useEffect(() => {
    const sync = () => setSaved(!!loadBookmarks()[studyId]);
    window.addEventListener('bookmarks:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('bookmarks:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [studyId]);

  function handleClick(e) {
    e.stopPropagation();
    setSaved(toggleBookmark(studyId));
  }

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove bookmark' : 'Add bookmark'}
      aria-pressed={saved}
      onClick={handleClick}
      className={
        'bookmark-btn h-8 w-8 rounded-full flex items-center justify-center transition shadow ' +
        (saved ? 'bg-teal-400 text-white' : 'bg-white border border-teal-400 text-teal-400')
      }
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
    >
      {/* Bookmark icon */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v14a.5.5 0 0 1-.8.4l-4.2-3.1-4.2 3.1a.5.5 0 0 1-.8-.4v-14Z" stroke="currentColor" strokeWidth="1.5" fill={saved ? 'currentColor' : 'none'} />
      </svg>
    </button>
  );
}
