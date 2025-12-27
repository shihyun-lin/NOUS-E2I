import { API_BASE } from '../api'
import BookmarkButton from './BookmarkButton'
import { useEffect, useMemo, useState } from 'react'

const BOOLEAN_OPERATORS = new Set(['AND', 'OR', 'NOT', '(', ')'])

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlightMatches = (text, tokens) => {
  if (!text) return ''
  if (!tokens.length) return text
  const pattern = tokens.map(escapeRegExp).join('|')
  if (!pattern) return text
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = String(text).split(regex)
  return parts.map((part, idx) => {
    if (!part) return null
    const isMatch = tokens.some(t => t.toLowerCase() === part.toLowerCase())
    return isMatch
      ? <span key={`match-${idx}`} className="study__highlight">{part}</span>
      : <span key={`text-${idx}`}>{part}</span>
  })
}

export function Studies ({ query, filters, onRowsChange }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('relevance')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'title-asc', label: 'Publication Title A–Z' },
    { value: 'title-desc', label: 'Publication Title Z–A' }
  ]

  useEffect(() => {
    setPage(1)
    if (!query) {
      setRows([])
      setErr('')
      if (onRowsChange) onRowsChange([])
    }
  }, [query, onRowsChange])

  useEffect(() => {
    if (!query) return
    let alive = true
    const ac = new AbortController()
    function normalizeQuery(raw) {
      if (!raw) return ''
      let normalized = raw.trim().replace(/\s+/g, ' ')
      if (!normalized || normalized.length < 2) return ''
      normalized = normalized.replace(/\s+(AND|OR|NOT)$/i, '').trim()
      if (!normalized) return ''
      const stripped = normalized.replace(/[()]/g, '').trim()
      if (!stripped || /^(AND|OR|NOT)$/i.test(stripped)) return ''
      return normalized
    }
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const normalizedQuery = normalizeQuery(query)
        if (!normalizedQuery) {
          setRows([])
          setLoading(false)
          return
        }
        // fetch studies and locations in parallel
        const [studiesRes, locationsRes] = await Promise.all([
          fetch(`${API_BASE}/query/${encodeURIComponent(normalizedQuery)}/studies`, { signal: ac.signal }),
          fetch(`${API_BASE}/query/${encodeURIComponent(normalizedQuery)}/locations`, { signal: ac.signal })
        ])
        const studiesData = await studiesRes.json().catch(() => ({}))
        const locationsData = await locationsRes.json().catch(() => ({}))
        if (!studiesRes.ok) throw new Error(studiesData?.error || `HTTP ${studiesRes.status}`)
        if (!locationsRes.ok) throw new Error(locationsData?.error || `HTTP ${locationsRes.status}`)
        if (!alive) return
        const studyList = Array.isArray(studiesData?.results) ? studiesData.results : []
        const locations = Array.isArray(locationsData?.results) ? locationsData.results : []
        // get query tokens (terms/coordinates) for filtering
        const tokens = (normalizedQuery || '').split(/\s+/).map(t => t.trim()).filter(Boolean)
        // filter locations: only keep peaks that match any token (term or coordinate)
        // If locations API includes a 'term' or 'token' field, use it; otherwise, fallback to all
        // For now, assume all locations are relevant to the query (since API is /query/{term}/locations)
        // If you want to filter by coordinates, add logic here
        const peaksByStudy = {}
        for (const loc of locations) {
          if (!loc.study_id) continue
          // Example: if loc.term exists, filter by tokens
          if (loc.term) {
            const match = tokens.some(token => token.toLowerCase() === String(loc.term).toLowerCase())
            if (!match) continue
          }
          // If no term field, assume all returned locations are relevant
          if (!peaksByStudy[loc.study_id]) peaksByStudy[loc.study_id] = []
          peaksByStudy[loc.study_id].push(loc)
        }
        // merge filtered peaks into each study
        const merged = studyList.map(study => ({
          ...study,
          peaks: peaksByStudy[study.study_id] || []
        }))
  setRows(merged)
  if (onRowsChange) onRowsChange(merged)
      } catch (e) {
        if (!alive) return
        setErr(`Failed to fetch study list: ${e?.message || e}`)
        setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query])

  const queryTokens = useMemo(() => (
    (query || '')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(Boolean)
      .filter(t => !BOOLEAN_OPERATORS.has(t.toUpperCase()))
  ), [query])

  const filteredRows = useMemo(() => {
    if (!filters) return [...rows]

    const authorNeedles = (filters.author || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const studyIdNeedles = (filters.studyId || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const titleNeedle = (filters.title || '').toLowerCase()
    const startYear = Number.parseInt(filters.yearStart, 10)
    const endYear = Number.parseInt(filters.yearEnd, 10)
    const singleYear = Number.parseInt(filters.singleYear, 10)
    const mode = filters.yearMode || 'range'

    return rows.filter((row) => {
      if (!row) return false
      const year = Number.parseInt(row.year, 10)
      if (mode === 'single' && !Number.isNaN(singleYear)) {
        if (Number.isNaN(year) || year !== singleYear) return false
      } else {
        const min = Number.isNaN(startYear) ? -Infinity : startYear
        const max = Number.isNaN(endYear) ? Infinity : endYear
        if (!Number.isNaN(year) && (year < min || year > max)) return false
      }

      if (authorNeedles.length > 0) {
        const field = (row.authors || '').toLowerCase()
        if (!authorNeedles.every((needle) => field.includes(needle))) return false
      }

      if (titleNeedle) {
        const field = (row.title || '').toLowerCase()
        if (!field.includes(titleNeedle)) return false
      }

      if (studyIdNeedles.length > 0) {
        const idField = String(row.study_id || '').toLowerCase()
        if (!studyIdNeedles.every((needle) => idField.includes(needle))) return false
      }

      return true
    })
  }, [rows, filters])

  const sorted = useMemo(() => {
    const arr = [...filteredRows]
    switch (sortKey) {
      case 'oldest':
        arr.sort((a, b) => (Number.parseInt(a?.year, 10) || 0) - (Number.parseInt(b?.year, 10) || 0))
        break
      case 'title-asc':
        arr.sort((a, b) => String(a?.title || '').localeCompare(String(b?.title || ''), 'en', { sensitivity: 'base' }))
        break
      case 'title-desc':
        arr.sort((a, b) => String(b?.title || '').localeCompare(String(a?.title || ''), 'en', { sensitivity: 'base' }))
        break
      case 'newest':
      case 'relevance':
      default:
        arr.sort((a, b) => (Number.parseInt(b?.year, 10) || 0) - (Number.parseInt(a?.year, 10) || 0))
        break
    }
    return arr
  }, [filteredRows, sortKey])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)

  const activeFilterChips = useMemo(() => {
    if (!filters) return []
    const chips = []
    if (filters.yearMode === 'single' && filters.singleYear) {
  chips.push(`Year: ${filters.singleYear}`)
    } else if (filters.yearStart || filters.yearEnd) {
  chips.push(`Year: ${filters.yearStart || '…'}-${filters.yearEnd || '…'}`)
    }
  if (filters.title) chips.push(`Title contains "${filters.title}"`)
  if (filters.author) chips.push(`Author contains "${filters.author}"`)
  if (filters.studyId) chips.push(`Study ID contains "${filters.studyId}"`)
    return chips
  }, [filters])

  const renderStudyCard = (study, idx) => {
    const pubmedId = study?.study_id
    const pubmedUrl = pubmedId ? `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/` : null

    // Peak list: expects study.peaks to be an array of {x, y, z, value}
    // const peaks = Array.isArray(study?.peaks) ? study.peaks : []

    // Dispatch custom event to update NiiViewer coordinates
    // const handlePeakClick = (peak) => {
    //   window.dispatchEvent(new CustomEvent('nii-viewer-set-coords', { detail: { x: peak.x, y: peak.y, z: peak.z } }))
    // }

    // Do not show the peak list for now
    return (
      <article key={`${pubmedId || idx}-${idx}`} className="study-card" style={{ position: 'relative' }}>
        {/* Bookmark button */}
        <BookmarkButton studyId={String(study?.study_id ?? '')} />
        <div className="study-card__meta">
          <span className="study-card__year">{study?.year ?? 'N/A'}</span>
          <span className="study-card__dot">•</span>
          <span className="study-card__journal">
            {highlightMatches(study?.journal ?? 'Unknown journal', queryTokens)}
          </span>
        </div>
        <h3 className="study-card__title" style={{ paddingRight: 48 }}>
          {highlightMatches(study?.title ?? 'Untitled study', queryTokens)}
        </h3>
        <p className="study-card__authors">
          {highlightMatches(study?.authors ?? 'Unknown authors', queryTokens)}
        </p>
        <dl className="study-card__details">
          <div>
            <dt>STUDY ID</dt>
            <dd>{study?.study_id ?? '—'}</dd>
          </div>
          <div>
            <dt>CONTRAST</dt>
            <dd>{study?.contrast_id ?? '—'}</dd>
          </div>
        </dl>
        {pubmedUrl && (
          <div className="study-card__actions">
            <a
              href={pubmedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="study-card__link"
            >
              Open in PubMed
              <span aria-hidden="true" className="study-card__link-icon">↗</span>
            </a>
          </div>
        )}
      </article>
    )
  }

  return (
    <div className="studies">
      <div className="studies__header">
        <div>
          <div className="card__title">Studies</div>
          <p className="studies__subtitle muted">
            {query ? `Found ${sorted.length} related studies.` : 'Results will be shown after building a query.'}
          </p>
        </div>
        {query && (
          <div className="studies__toolbar">
            <span className="studies__sortLabel">Sort By</span>
            <div className="studies__selectWrap">
              <select
                className="studies__select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                disabled={!sorted.length}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="studies__selectIcon" aria-hidden="true">▾</span>
            </div>
            <span className="studies__count muted">
              {pageRows.length}/{sorted.length} results
            </span>
          </div>
        )}
      </div>

      {activeFilterChips.length > 0 && (
        <div className="studies__filters">
          {activeFilterChips.map((chip, idx) => (
            <span key={idx} className="filters__chip">{chip}</span>
          ))}
        </div>
      )}

      {loading && (
        <div className="studies__skeleton">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="studies__skeleton-card">
              <div className="studies__skeleton-line" style={{ width: '32%' }} />
              <div className="studies__skeleton-line" style={{ width: '82%' }} />
              <div className="studies__skeleton-line" style={{ width: '64%' }} />
            </div>
          ))}
        </div>
      )}

      {err && !loading && (
        <div className="studies__alert">
          {err}
        </div>
      )}

      {query && !loading && !err && (
        <>
          {pageRows.length === 0 ? (
            <div className="studies__empty">No study results</div>
          ) : (
            <div className="studies__list">
              {pageRows.map((study, idx) => renderStudyCard(study, idx))}
            </div>
          )}

          {sorted.length > pageSize && (
            <div className="studies__pagination">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="btn-secondary"
              >
                First page
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary"
              >
                Previous page
              </button>
              <span className="studies__page muted">
                Page {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary"
              >
                Next page
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="btn-secondary"
              >
                Last page
              </button>
            </div>
          )}
        </>
      )}

      {!query && !loading && !err && (
        <div className="studies__placeholder">
          <p>Enter terms or coordinates to load study results.</p>
        </div>
      )}
    </div>
  )
}
