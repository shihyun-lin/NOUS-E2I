import React, { useMemo, useState, useEffect } from 'react'
import { NiiViewer } from './NiiViewer'

const SIDEPANEL_BASE = {
  position: 'fixed',
  top: '72px',
  right: '0',
  width: 'min(540px, 100vw)',
  maxWidth: '540px',
  height: 'calc(100vh - 88px)',
  background: '#f3fbfc',
  boxShadow: '-26px 0 42px rgba(12,44,72,0.18)',
  borderRadius: '32px 0 0 32px',
  border: '1px solid rgba(184,227,231,0.85)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1100,
  overflow: 'hidden',
  transition: 'transform 0.25s ease'
}

const SIDEPANEL_HEADER = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  background: '#d7f2f5',
  borderBottom: '1px solid rgba(146,205,210,0.6)'
}

const CONTROL_BTN = {
  background: '#fff',
  borderRadius: '999px',
  padding: '8px 14px',
  border: '1px solid rgba(101,177,186,0.6)',
  color: '#145a64',
  fontSize: '0.9em',
  cursor: 'pointer',
  boxShadow: '0 6px 14px rgba(18,89,98,0.18)'
}

const COLLAPSED_ARROW = {
  position: 'fixed',
  top: 'calc(50% - 40px)',
  right: '0',
  width: '48px',
  height: '80px',
  background: 'linear-gradient(180deg,#0f7280,#12949d)',
  borderRadius: '16px 0 0 16px',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '-12px 10px 28px rgba(12,44,72,0.26)',
  zIndex: 1050
}

export function NiiMiniWidget ({
  coords,
  query,
  expandKey = 0
}) {
  const [open, setOpen] = useState(false)

  const effectiveQuery = useMemo(() => {
    if (query && query.trim()) return query.trim()
    if (coords && typeof coords.x === 'number' && typeof coords.y === 'number' && typeof coords.z === 'number') {
      return `[${coords.x},${coords.y},${coords.z}]`
    }
    return ''
  }, [coords, query])

  const openPanel = () => {
    setOpen(true)
  }

  useEffect(() => {
    if (expandKey) {
      openPanel()
    }
  }, [expandKey])

  if (!open) {
    return (
      <div style={COLLAPSED_ARROW} onClick={openPanel} aria-label="Expand NIfTI viewer panel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    )
  }

  return (
    <aside style={SIDEPANEL_BASE}>
      <div style={SIDEPANEL_HEADER}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '1.2em', fontWeight: 600, color: '#0f4652', letterSpacing: '0.04em' }}>NIfTI Viewer</span>
          <span style={{ fontSize: '0.88em', color: '#295b62' }}>
            {coords
              ? `Coordinate: (${coords.x}, ${coords.y}, ${coords.z})`
              : effectiveQuery
                ? `Query: ${effectiveQuery}`
                : 'No coordinate selected yet'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
            }}
            style={CONTROL_BTN}
          >
            Hide
          </button>
        </div>
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 0 12px 0',
        background: '#fff'
      }}>
        <div style={{ padding: '0 12px' }}>
          <NiiViewer key={effectiveQuery} query={effectiveQuery} />
        </div>
      </div>
    </aside>
  )
}

export default NiiMiniWidget
