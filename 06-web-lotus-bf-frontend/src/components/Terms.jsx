import { API_BASE } from '../api'
import { useEffect, useMemo, useRef, useState } from 'react'

export function Terms({ onPickTerm }) {
  const [terms, setTerms] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    let alive = true
    const ac = new AbortController()
    const load = async () => {
      setLoading(true)
      setErr('')
      try {
        const res = await fetch(`${API_BASE}/terms`, { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!alive) return
        setTerms(Array.isArray(data?.terms) ? data.terms : [])
      } catch (e) {
        if (!alive) return
        setErr(`Failed to fetch terms: ${e?.message || e}`)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false; ac.abort() }
  }, [])

  const filtered = useMemo(() => {
    const s = (search ?? '').trim().toLowerCase()
    if (!s) return []
  // Prioritize exact matches first
  const exact = terms.filter(t => t.toLowerCase() === s)
  // Then include prefix matches while preserving original order
  const rest = terms.filter(t => t.toLowerCase() !== s && t.toLowerCase().startsWith(s))
  return [...exact, ...rest]
  }, [terms, search])

  // Dropdown should show only when search is not empty
  const showDropdown = search.length > 0 && !loading && !err

  return (
    <div className="terms-autocomplete" style={{ position: 'relative', maxWidth: 420, margin: '0 auto' }}>
      <input
        ref={inputRef}
        type="text"
  placeholder="Search terms..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          height: '54px',
          fontSize: '1.15em',
          borderRadius: '32px',
          border: '2px solid #e0e0e0',
          background: '#fff',
          boxShadow: '0 2px 16px #0001',
          padding: '0 56px 0 24px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        autoComplete="off"
      />
      {showDropdown && (
        <div
          className="terms-dropdown"
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 24px #0002',
            zIndex: 10,
            maxHeight: '320px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '18px', color: '#888', textAlign: 'center' }}>No matching terms found</div>
          ) : (
            filtered.map((t, idx) => (
              <div
                key={t + idx}
                className="terms-dropdown-item"
                style={{
                  padding: '16px 24px',
                  cursor: 'pointer',
                  fontSize: '1.15em',
                  borderBottom: idx !== filtered.length - 1 ? '1px solid #f0f0f0' : 'none',
                  color: '#222',
                  background: '#fff',
                }}
                onMouseDown={() => onPickTerm?.(t)}
                onMouseOver={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseOut={e => (e.currentTarget.style.background = '#fff')}
              >
                {t}
              </div>
            ))
          )}
        </div>
      )}
      {loading && (
        <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px #0002', zIndex: 10, padding: '18px', textAlign: 'center', color: '#888' }}>
          Loading...
        </div>
      )}
      {err && (
        <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px #0002', zIndex: 10, padding: '18px', textAlign: 'center', color: '#d00' }}>
          {err}
        </div>
      )}
    </div>
  )
}
