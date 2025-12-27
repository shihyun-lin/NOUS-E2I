import { useCallback, useRef, useState } from 'react'
import Header from './components/Header'
import { API_BASE } from './api'
import { useEffect } from 'react'
import { QueryBuilder } from './components/QueryBuilder'
import { Studies } from './components/Studies'
import { NiiViewer } from './components/NiiViewer'
import { Filters } from './components/Filters'
import { FILTER_DEFAULTS } from './components/filterConstants'
import { useUrlQueryState } from './hooks/useUrlQueryState'
import BookmarksPage from './components/BookmarksPage'
import './App.css'

const AUTHOR_PROFILES = [
  {
    name: 'Dr. Anonymous One',
    role: 'Lead Neuroscientist',
    affiliation: 'Neuro Search Collective',
    bio: 'Guides the NOUS programme with reproducible pipelines that convert population evidence into clear clinical guidance.',
    publications: 34,
    focus: 'Functional MRI'
  },
  {
    name: 'Dr. Anonymous Two',
    role: 'Data Science Director',
    affiliation: 'Evidence-to-Inference Lab',
    bio: 'Designs the evidence-to-inference (E2I) models that power provenance-first search while balancing statistical rigour and usability.',
    publications: 27,
    focus: 'Bayesian Inference'
  },
  {
    name: 'Dr. Anonymous Three',
    role: 'Clinical Collaborator',
    affiliation: 'Provenance Medicine Network',
    bio: 'Connects NOUS E2I with clinicians by validating model assumptions, curating case studies, and quality checking citation-ready outputs.',
    publications: 18,
    focus: 'Translational Neuroscience'
  }
]

const AuthorSpotlight = () => (
  <section className="author-spotlight">
    <div className="author-spotlight__header">
      <h2>Author Spotlight</h2>
      <p>Meet the scientists guiding NOUS from evidence gathering to inference-ready insight.</p>
    </div>
    <div className="author-spotlight__grid">
      {AUTHOR_PROFILES.map((profile) => {
        const initials = profile.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        return (
          <article key={profile.name} className="author-card">
            <div className="author-card__avatar">
              <span>{initials}</span>
            </div>
            <div className="author-card__body">
              <h3>{profile.name}</h3>
              <p className="author-card__role">
                {profile.role} · {profile.affiliation}
              </p>
              <p className="author-card__bio">{profile.bio}</p>
            </div>
            <div className="author-card__footer">
              <div>
                <strong>{profile.publications}</strong>
                <span>publications</span>
              </div>
              <div>
                <strong>{profile.focus}</strong>
                <span>primary focus</span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  </section>
)
export default function App() {
  const [activeView, setActiveView] = useState('home')
  const [query, setQuery] = useUrlQueryState('q', '')
  // Track if user manually picked a term
  const [pickedTerm, setPickedTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Clear hero search inputs on first mount
  useEffect(() => {
    setSearchTerm('')
    setPickedTerm('')
  }, [])

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
  const [filters, setFilters] = useState(() => ({ ...FILTER_DEFAULTS }))
  const [studiesData, setStudiesData] = useState([])

  // appendTerm removed (unused) to satisfy lint rules

  const handleFilterChange = useCallback((next) => {
    setFilters(next)
  }, [])

  const handleFilterReset = useCallback(() => {
    setFilters({ ...FILTER_DEFAULTS })
  }, [])

  const submitSearch = useCallback((term) => {
    const sanitized = (term || '').trim()
    if (!sanitized) return
    setPickedTerm(sanitized)
    setQuery(sanitized)
    setSearchTerm('')
    setActiveView('home')
  }, [setQuery])

  // --- resizable panes state ---
  const gridRef = useRef(null)
  // Initial column ratio: left, middle, right
  const [sizes, setSizes] = useState([24, 52, 24]) // [left, middle, right]
  const MIN_PX = 240

  const startDrag = (which, e) => {
    e.preventDefault()
    const startX = e.clientX
    const rect = gridRef.current.getBoundingClientRect()
    const total = rect.width
    const curPx = sizes.map(p => (p / 100) * total)

    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 0) {
        let newLeft = curPx[0] + dx
        let newMid = curPx[1] - dx
        if (newLeft < MIN_PX) { newMid -= (MIN_PX - newLeft); newLeft = MIN_PX }
        if (newMid < MIN_PX) { newLeft -= (MIN_PX - newMid); newMid = MIN_PX }
        const s0 = (newLeft / total) * 100
        const s1 = (newMid / total) * 100
        const s2 = 100 - s0 - s1
        setSizes([s0, s1, Math.max(s2, 0)])
      } else {
        let newMid = curPx[1] + dx
        let newRight = curPx[2] - dx
        if (newMid < MIN_PX) { newRight -= (MIN_PX - newMid); newMid = MIN_PX }
        if (newRight < MIN_PX) { newMid -= (MIN_PX - newRight); newRight = MIN_PX }
        const s1 = (newMid / total) * 100
        const s2 = (newRight / total) * 100
        const s0 = (curPx[0] / total) * 100
        setSizes([s0, s1, Math.max(s2, 0)])
      }
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Listen for table updates so bookmarks view sees the latest rows
  // Assumes the Studies component exposes an onRowsChange callback
  const handleStudiesRowsChange = (rows) => {
    setStudiesData(rows)
  }

  const showHome = useCallback(() => setActiveView('home'), [])
  const showBookmarks = useCallback(() => setActiveView('bookmarks'), [])
  const showAuthors = useCallback(() => setActiveView('authors'), [])

  return (
    <div className="app">
      <Header
        activeView={activeView}
        onSelectHome={showHome}
        onSelectBookmarks={showBookmarks}
        onSelectAuthors={showAuthors}
      />
      {activeView === 'home' && (
        <>
          <div style={{width:'100%',background:'#f5f5f5',padding:'48px 0 0 0',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '3em',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: '1.1',
              marginBottom: '18px',
              letterSpacing: '-0.02em',
            }}>Evidence. Search. Inference.</h1>
            <div style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: '1.25em',
              color: '#444',
              textAlign: 'center',
              maxWidth: '700px',
              marginBottom: '32px',
              letterSpacing: '-0.01em',
            }}>
              NOUS E2I converts evidence into inference and offers provenance-first, citation-ready neuro search.
            </div>
            <div style={{position:'relative',width:'100%',maxWidth:'420px',margin:'0 auto 32px auto'}}>
              <input
                type="text"
                placeholder="Search terms..."
                style={{
                  width:'100%',
                  height:'54px',
                  fontSize:'1.15em',
                  borderRadius:'32px',
                  border:'2px solid #e0e0e0',
                  background:'#fff',
                  boxShadow:'0 2px 16px #0001',
                  padding:'0 56px 0 24px',
                  outline:'none',
                  transition:'border-color 0.2s',
                }}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setPickedTerm('') // reset pickedTerm when typing
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitSearch(searchTerm)
                  }
                }}
                autoComplete="off"
              />
              {(searchTerm.length > 0 && !loading && !err) && (
                <div
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
                  {terms.filter(t => t.toLowerCase().includes(searchTerm.trim().toLowerCase())).length === 0 ? (
                    <div style={{ padding: '18px', color: '#888', textAlign: 'center' }}>No matching terms found</div>
                  ) : (
                    terms.filter(t => t.toLowerCase().includes(searchTerm.trim().toLowerCase())).map((t, idx) => (
                      <div
                        key={t + idx}
                        style={{
                          padding: '16px 24px',
                          cursor: 'pointer',
                          fontSize: '1.15em',
                          borderBottom: idx !== terms.length - 1 ? '1px solid #f0f0f0' : 'none',
                          color: '#222',
                          background: '#fff',
                        }}
                        onMouseDown={() => {
                          submitSearch(t)
                          setSearchTerm('') // hide dropdown after pick
                        }}
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
          </div>
          <main className="app__grid" ref={gridRef}>
            <section className="card card--stack" style={{ flexBasis: `${Math.max(sizes[0], 16)}%`, minWidth: 220 }}>
              <Filters
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleFilterReset}
              />
            </section>

            <div className="resizer" aria-label="Resize left/middle" onMouseDown={(e) => startDrag(0, e)} />

            <section className="card card--stack" style={{ flexBasis: `${Math.max(sizes[1], 16)}%` }}>
              <QueryBuilder query={query} setQuery={setQuery} />
              <div className="divider" />
              <Studies
                query={pickedTerm
                  ? pickedTerm
                  : (searchTerm && terms.filter(t => t.toLowerCase().includes(searchTerm.trim().toLowerCase()))[0])
                    ? terms.filter(t => t.toLowerCase().includes(searchTerm.trim().toLowerCase()))[0]
                    : query}
                filters={filters}
                onRowsChange={handleStudiesRowsChange}
              />
            </section>

            <div className="resizer" aria-label="Resize middle/right" onMouseDown={(e) => startDrag(1, e)} />

            <section className="card" style={{ flexBasis: `${Math.max(sizes[2], 16)}%` }}>
              <NiiViewer query={query} />
            </section>
          </main>
        </>
      )}
      {activeView === 'bookmarks' && (
        <div style={{padding:'32px'}}>
          <BookmarksPage
            studies={studiesData}
            activeQuery={query}
            onClose={showHome}
          />
        </div>
      )}
      {activeView === 'authors' && (
        <AuthorSpotlight />
      )}
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-title">NOUS</span>
        <span className="footer-desc">NOUS E2I converts evidence into inference and offers provenance-first, citation-ready neuro search.</span>
        <span className="footer-links">
          <button type="button" onClick={showHome}>Home</button> ·{' '}
          <button type="button" onClick={showBookmarks}>Bookmarks</button> ·{' '}
          <button type="button" onClick={showAuthors}>Authors</button>
        </span>
      </div>
    </footer>
  </div>
  )
}
