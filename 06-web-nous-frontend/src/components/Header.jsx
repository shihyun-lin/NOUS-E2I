import React from 'react';

function BookmarksBadge({ count }) {
  return (
    <span style={{
      background: 'var(--primary, #159a9c)',
      color: '#fff',
      borderRadius: '9999px',
      padding: '2px 8px',
      fontSize: '0.85em',
      marginLeft: '6px',
      fontWeight: 500
    }}>{count}</span>
  )
}

import { useEffect, useState } from 'react';
import { getBookmarkedIds } from '../lib/bookmarks';

export default function Header({
  activeView,
  onSelectHome,
  onSelectBookmarks,
  onSelectAuthors
}) {
  const [bookmarksCount, setBookmarksCount] = useState(0);
  useEffect(() => {
    const sync = () => setBookmarksCount(getBookmarkedIds().length);
    sync();
    window.addEventListener('bookmarks:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('bookmarks:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const linkStyle = (view) => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    font: 'inherit',
    color: activeView === view ? '#159a9c' : 'inherit',
    display: 'flex',
    alignItems: 'center'
  })

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      height: '56px',
      width: '100%',
      background: '#fff',
      borderBottom: '1px solid var(--border, #e0e0e0)',
      padding: '0 32px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <img src="/static/logo.png" alt="NOUS logo" style={{height: '44px'}} />
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', height: '100%' }}>
        <nav>
          <ul style={{ display: 'flex', alignItems: 'center', gap: '32px', listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <button type="button" onClick={onSelectHome} style={linkStyle('home')}>
                Home
              </button>
            </li>
            <li>
              <button type="button" onClick={onSelectBookmarks} style={linkStyle('bookmarks')}>
                Bookmarks <BookmarksBadge count={bookmarksCount} />
              </button>
            </li>
            <li>
              <button type="button" onClick={onSelectAuthors} style={linkStyle('authors')}>
                Authors
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
