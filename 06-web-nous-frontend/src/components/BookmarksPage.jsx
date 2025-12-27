import React, { useEffect, useMemo, useState } from 'react';
import { clearBookmarks, getBookmarkedIds, removeBookmarks } from '../lib/bookmarks';
import { NiiMiniWidget } from './NiiMiniWidget';

const COLUMN_DEFS = [
  { key: 'title', label: 'Title', minWidth: 260 },
  { key: 'journal', label: 'Journal', minWidth: 200 },
  { key: 'study_id', label: 'Study ID', minWidth: 160 },
  { key: 'year', label: 'Year', minWidth: 120 },
  { key: 'authors', label: 'Authors', minWidth: 260 },
  { key: 'coordinates', label: 'Coordinates', minWidth: 200 },
  { key: 'notes', label: 'Notes', minWidth: 220 }
];

const FilterIcon = ({ color = '#5c6a78', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="4" y1="5" x2="20" y2="5" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="19" x2="13" y2="19" />
  </svg>
);

// Studies data is expected to be provided by the parent component
export default function BookmarksPage({ studies = [], activeQuery = '', onClose }) {
  const [bookmarkedIds, setBookmarkedIds] = useState(() => getBookmarkedIds());
  const bookmarkedStudies = useMemo(
    () => studies.filter((s) => bookmarkedIds.includes(String(s.study_id))),
    [studies, bookmarkedIds]
  );
  const [notes, setNotes] = useState(() => {
    // Read persisted notes from localStorage
    try {
      return JSON.parse(localStorage.getItem('bookmarkNotes') || '{}');
    } catch {
      return {};
    }
  });

  const [columnFilters, setColumnFilters] = useState({});
  const [openFilter, setOpenFilter] = useState('');
  const [columnWidths, setColumnWidths] = useState(() =>
    COLUMN_DEFS.map((col) => col.minWidth ?? 160)
  );
  const [hoveredRow, setHoveredRow] = useState(null);
  const [viewerExpandToken, setViewerExpandToken] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [widgetCoords, setWidgetCoords] = useState(null);
  const [widgetQuery, setWidgetQuery] = useState(activeQuery || '');

  useEffect(() => {
    const sync = () => setBookmarkedIds(getBookmarkedIds());
    window.addEventListener('bookmarks:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('bookmarks:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    setSelectedIds(prev => {
      if (!prev.size) return prev
      const next = new Set()
      for (const id of bookmarkedIds) {
        if (prev.has(String(id))) next.add(String(id))
      }
      return next
    })
  }, [bookmarkedIds])

  useEffect(() => {
    if (!bookmarkedStudies.length) {
      setWidgetCoords(null);
      setWidgetQuery(activeQuery || '');
    }
  }, [bookmarkedStudies.length, activeQuery]);

  useEffect(() => {
    setWidgetQuery(activeQuery || '');
  }, [activeQuery]);

  const startResize = (index, event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = columnWidths[index];
    const minWidth = COLUMN_DEFS[index].minWidth ?? 120;

    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      setColumnWidths((prev) => {
        const next = [...prev];
        next[index] = Math.max(minWidth, startWidth + delta);
        return next;
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const totalWidth = columnWidths.reduce((sum, value) => sum + value, 0);
  const hasActiveFilters = useMemo(
    () => Object.values(columnFilters).some((value) => (value ?? '').trim() !== ''),
    [columnFilters]
  );

  const filteredStudies = useMemo(() => {
    if (!bookmarkedStudies.length) return [];
    return bookmarkedStudies.filter((study) => COLUMN_DEFS.every(({ key }) => {
      const rawFilter = (columnFilters[key] ?? '').trim().toLowerCase();
      if (!rawFilter) return true;
      if (key === 'coordinates') {
        const coords = Array.isArray(study.peaks)
          ? study.peaks.map((p) => `${p.x},${p.y},${p.z}`).join(' ')
          : '';
        return coords.toLowerCase().includes(rawFilter);
      }
      if (key === 'notes') {
        const note = notes[study.study_id] || '';
        return String(note).toLowerCase().includes(rawFilter);
      }
      const fieldValue = study[key];
      return String(fieldValue ?? '').toLowerCase().includes(rawFilter);
    }));
  }, [bookmarkedStudies, columnFilters, notes]);

  const toggleFilter = (key) => {
    setOpenFilter((prev) => (prev === key ? '' : key));
  };

  const handleFilterInput = (key, value) => {
    setColumnFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (!value || value.trim() === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const clearFilter = (key) => {
    setColumnFilters((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const hasBookmarks = bookmarkedIds.length > 0;
  const hasMatches = filteredStudies.length > 0;
  const selectedCount = selectedIds.size;
  const allSelected = hasMatches && filteredStudies.every((study) => selectedIds.has(String(study.study_id)));

  const handleClearAll = () => {
    if (!hasBookmarks) return;
    const confirmed = window.confirm('Remove all saved bookmarks?');
    if (!confirmed) return;
    clearBookmarks();
    localStorage.removeItem('bookmarkNotes');
    setColumnFilters({});
    setOpenFilter('');
    setNotes({});
    setBookmarkedIds([]);
    setSelectedIds(new Set());
  };

  function handleNoteChange(studyId, value) {
    const next = { ...notes, [studyId]: value };
    setNotes(next);
    localStorage.setItem('bookmarkNotes', JSON.stringify(next));
  }

  const toggleSelect = (id) => {
    const key = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    if (!hasMatches) {
      setSelectedIds(new Set());
      return;
    }
    if (checked) {
      setSelectedIds(new Set(filteredStudies.map((study) => String(study.study_id))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    const confirmed = window.confirm(`Remove the selected ${selectedCount} bookmark(s)?`);
    if (!confirmed) return;
    removeBookmarks(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBookmarkedIds(getBookmarkedIds());
  };

  return (
  <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',background:'#fff',minHeight:'100vh'}}>
    <div style={{width:'100%',maxWidth:'1100px',margin:'8px auto 0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'24px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
        <button
          onClick={onClose}
          style={{background:'#159a9c',color:'#fff',borderRadius:'24px',padding:'10px 28px',fontSize:'1.1em',border:'none',boxShadow:'0 2px 16px #eaf4f3',cursor:onClose ? 'pointer' : 'default',opacity:onClose ? 1 : 0.6}}
          disabled={!onClose}
        >← Back</button>
        <h1
          style={{
            background: 'transparent',
            color: '#1a2a36',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: '2.1em',
            textAlign: 'left',
            letterSpacing: '-0.01em',
            margin: 0,
            padding: 0
          }}
        >
          My Bookmarks
        </h1>
      </div>
      {hasBookmarks && (
        <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedCount === 0}
            style={{
              background:selectedCount === 0 ? '#d9eaea' : '#fff',
              color:selectedCount === 0 ? '#7a9a9c' : '#0f4e58',
              borderRadius:'22px',
              padding:'9px 20px',
              fontSize:'0.95em',
              border:'1px solid #9ed6d8',
              boxShadow:selectedCount === 0 ? 'none' : '0 4px 16px #0b182411',
              cursor:selectedCount === 0 ? 'not-allowed' : 'pointer',
              transition:'all 0.18s ease'
            }}
          >
            Remove Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background:'#fff',
              color:'#0f4e58',
              borderRadius:'22px',
              padding:'9px 20px',
              fontSize:'0.95em',
              border:'1px solid #9ed6d8',
              boxShadow:'0 4px 16px #0b182411',
              cursor:'pointer',
              transition:'all 0.18s ease'
            }}
          >
            Clear All Bookmarks
          </button>
        </div>
      )}
    </div>
      <div style={{
        width:'100%',
        maxWidth:'1800px',
        minHeight:'600px',
        background:'#effcfc',
        padding:'48px',
        margin:'16px auto 0 auto',
        boxShadow:'0 24px 48px rgba(12,44,72,0.16)',
        borderRadius:'28px',
        border:'1px solid #caecec',
        boxSizing:'border-box'
      }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{
            width:'100%',
            minWidth: totalWidth + 80,
            borderCollapse:'collapse',
            fontFamily:'Sora, sans-serif'
          }}>
            <colgroup>
              <col style={{ width: 56 }} />
              {COLUMN_DEFS.map((col, idx) => (
                <col
                  key={col.key}
                  style={{
                    width: columnWidths[idx],
                    minWidth: col.minWidth ?? 120
                  }}
                />
              ))}
            </colgroup>
            <thead>
              <tr style={{borderBottom:'2px solid #e0e0e0'}}>
                <th
                  style={{
                    width:'56px',
                    padding:'12px',
                    textAlign:'center'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected && hasMatches}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all bookmarks"
                    disabled={!hasMatches}
                  />
                </th>
                {COLUMN_DEFS.map((col, idx) => {
                  const isActive = (columnFilters[col.key] ?? '').trim() !== '';
                  const isOpen = openFilter === col.key;
                  return (
                    <th
                      key={col.key}
                      style={{
                        position:'relative',
                        textAlign:'left',
                        fontWeight:700,
                        fontSize:'1.18em',
                        color:'#1f2f3d',
                        padding:'14px 16px',
                        paddingRight:'44px',
                        userSelect:'none',
                        whiteSpace:'nowrap',
                        background:isOpen ? '#edf7f7' : 'transparent'
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', justifyContent:'space-between' }}>
                        <span>{col.label}</span>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); toggleFilter(col.key); }}
                          aria-label={`Filter ${col.label}`}
                          aria-pressed={isOpen}
                          style={{
                            background:isActive || isOpen ? '#c1eced' : 'transparent',
                            border:'1px solid ' + (isActive || isOpen ? '#5fb0b2' : '#c5d4d8'),
                            borderRadius:'8px',
                            padding:'4px 6px',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            cursor:'pointer',
                            transition:'all 0.18s ease'
                          }}
                        >
                          <FilterIcon color={isActive || isOpen ? '#1f555a' : '#6b7a87'} size={18} />
                        </button>
                      </div>
                      <span
                        onMouseDown={(event) => startResize(idx, event)}
                        style={{
                          position:'absolute',
                          top:0,
                          right:0,
                          width:'10px',
                          height:'100%',
                          cursor:'col-resize',
                          userSelect:'none'
                        }}
                      />
                    </th>
                  );
                })}
              </tr>
              {(openFilter || hasActiveFilters) && (
                <tr>
                  <th />
                  {COLUMN_DEFS.map((col) => {
                    const value = columnFilters[col.key] ?? '';
                    const isOpen = openFilter === col.key;
                    const shouldRender = isOpen || value;
                    return (
                      <th
                        key={`${col.key}-filter`}
                        style={{
                          padding:'10px 16px 12px 16px',
                          background:'#eff7f7',
                          borderBottom:'1px solid #dceaea'
                        }}
                      >
                        {shouldRender && (
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <input
                              type="text"
                              value={value}
                              onChange={(event) => handleFilterInput(col.key, event.target.value)}
                              placeholder={`Filter ${col.label}...`}
                              style={{
                                flex:'1 1 auto',
                                padding:'8px 10px',
                                borderRadius:'10px',
                                border:'1px solid #b9d9d9',
                                fontSize:'0.98em',
                                background:'#fff'
                              }}
                            />
                            {value && (
                              <button
                                type="button"
                                onClick={() => clearFilter(col.key)}
                                style={{
                                  background:'#fff',
                                  border:'1px solid #d0e4e4',
                                  borderRadius:'8px',
                                  padding:'6px 10px',
                                  cursor:'pointer',
                                  fontSize:'0.85em',
                                  color:'#3c5a5a'
                                }}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>
            <tbody>
              {!hasBookmarks ? (
                <tr>
                  <td colSpan={COLUMN_DEFS.length} style={{ textAlign: 'center', padding:'32px', color:'#888' }}>
                    No bookmarks yet
                  </td>
                </tr>
              ) : !hasMatches ? (
                <tr>
                  <td colSpan={COLUMN_DEFS.length} style={{ textAlign: 'center', padding:'32px', color:'#668' }}>
                    No results match the current filters
                  </td>
                </tr>
              ) : (
                filteredStudies.map((study) => (
                  <tr
                    key={study.study_id}
                    onMouseEnter={() => setHoveredRow(study.study_id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom:'1px solid #f0f0f0',
                      transition:'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
                      transform: hoveredRow === study.study_id ? 'scale(1.015)' : 'scale(1)',
                      boxShadow: hoveredRow === study.study_id ? '0 10px 32px #0b182412' : 'none',
                    transformOrigin:'center left',
                    background: hoveredRow === study.study_id ? '#f7fbfb' : 'transparent'
                  }}
                >
                    <td style={{padding:'12px',textAlign:'center'}}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(String(study.study_id))}
                        onChange={() => toggleSelect(study.study_id)}
                    aria-label={`Select ${study.title || study.study_id}`}
                      />
                    </td>
                    <td style={{padding:'14px 14px',verticalAlign:'top',fontSize:'1.08em',lineHeight:'1.6',color:'#1f2a35'}}>{study.title}</td>
                    <td style={{padding:'14px 14px',verticalAlign:'top',fontSize:'1.08em',lineHeight:'1.6',color:'#1f2a35'}}>{study.journal}</td>
                    <td style={{padding:'14px 14px',verticalAlign:'top',fontSize:'1.08em',lineHeight:'1.6',color:'#1f2a35'}}>{study.study_id}</td>
                    <td style={{padding:'14px 14px',verticalAlign:'top',fontSize:'1.08em',lineHeight:'1.6',color:'#1f2a35'}}>{study.year}</td>
                    <td style={{padding:'14px 14px',verticalAlign:'top',fontSize:'1.08em',lineHeight:'1.6',color:'#1f2a35'}}>{study.authors}</td>
                    <td style={{padding:'14px 14px',verticalAlign:'top'}}>
                    {Array.isArray(study.peaks) && study.peaks.length > 0 ? (
                        <select
                          style={{
                            width:'100%',
                            padding:'8px 12px',
                            borderRadius:'10px',
                            border:'1px solid #d5e6e6',
                            fontSize:'1.03em',
                            background:'#f4f9f9',
                            color:'#1f2a35'
                          }}
                          onChange={e => {
                            const { value } = e.target;
                            if (value === '') {
                              setWidgetCoords(null);
                              setWidgetQuery(activeQuery || '');
                              return;
                            }
                            const index = Number(value);
                            if (Number.isNaN(index)) return;
                            const coord = study.peaks[index];
                            if (!coord) return;
                            setWidgetCoords(coord);
                            const fallbackQuery = activeQuery?.trim() ? activeQuery : `[${coord.x},${coord.y},${coord.z}]`;
                            setWidgetQuery(fallbackQuery);
                            setViewerExpandToken(Date.now());
                            window.dispatchEvent(new CustomEvent('nii-viewer-set-coords', { detail: coord }));
                          }}>
                        <option value="">Select coordinate</option>
                          {study.peaks.map((p, i) => (
                            <option key={i} value={i}>{`(${p.x}, ${p.y}, ${p.z})`}</option>
                          ))}
                        </select>
                      ) : '—'}
                    </td>
                    <td style={{padding:'14px 14px',verticalAlign:'top'}}>
                      <input
                        type="text"
                        value={notes[study.study_id] || ''}
                        onChange={e => handleNoteChange(study.study_id, e.target.value)}
                      placeholder="Add a note..."
                        style={{
                          width:'100%',
                          padding:'9px 14px',
                          borderRadius:'10px',
                          border:'1px solid #d5e6e6',
                          fontSize:'1.05em',
                          background:'#f4f9f9',
                          color:'#1f2a35'
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
    </div>
    <NiiMiniWidget
      coords={widgetCoords}
      query={widgetQuery}
      expandKey={viewerExpandToken}
    />
  </div>
  );
}
