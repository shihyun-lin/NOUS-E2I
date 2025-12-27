import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../api'

const OPERATORS = ['AND', 'OR', 'NOT', '(', ')']
const BOOLEAN_TOKENS = new Set(['AND', 'OR', 'NOT'])

const extractPrimaryTerm = (value) => {
  if (!value) return ''
  const tokens = value
    .split(/\s+/)
    .map((t) => t.replace(/[()]/g, '').trim())
    .filter(Boolean)
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i]
    if (!token) continue
    if (BOOLEAN_TOKENS.has(token.toUpperCase())) continue
    return token
  }
  return ''
}

export function QueryBuilder ({ query, setQuery }) {
  const append = (token) => setQuery((q) => (q ? `${q} ${token}` : token))
  const tokens = (query || '').trim().split(/\s+/).filter(Boolean)

  const [related, setRelated] = useState({ loading: false, error: '', items: [] })
  const [selectedRelated, setSelectedRelated] = useState('')

  const primaryTerm = useMemo(() => extractPrimaryTerm(query), [query])

  useEffect(() => {
    setSelectedRelated('')
    if (!primaryTerm) {
      setRelated({ loading: false, error: '', items: [] })
      return
    }

    const controller = new AbortController()
    const load = async () => {
      setRelated((prev) => ({ ...prev, loading: true, error: '' }))
      try {
        const res = await fetch(`${API_BASE}/terms/${encodeURIComponent(primaryTerm)}`, {
          signal: controller.signal
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        const list = Array.isArray(data?.related) ? data.related : []
        setRelated({ loading: false, error: '', items: list })
      } catch (err) {
        if (controller.signal.aborted) return
        setRelated({ loading: false, error: err?.message || String(err), items: [] })
      }
    }
    load()
    return () => controller.abort()
  }, [primaryTerm])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setQuery(e.currentTarget.value)
    }
  }
  return (
    <div className="query">
      <div className="query__header">
        <div>
          <div className="card__title">Query Builder</div>
          <p className="query__subtitle muted">Quickly combine terms or coordinates using Boolean operations.</p>
        </div>
        {tokens.length > 0 && (
          <span className="pill query__pill">
            {tokens.length} tokens
          </span>
        )}
      </div>

      <div className="query__inputRow">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="query__input"
          placeholder="e.g.: amygdala NOT emotion or [-22,-4,18]"
        />
        <button
          type="button"
          onClick={() => setQuery('')}
          className="btn-secondary query__operator query__operator--reset"
        >
          Reset
        </button>
      </div>

  {/* Boolean logic and co-occurrence term insertion area */}
      <div className="query__actionBlock" style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap'}}>
          {['AND', 'OR', 'NOT', '(', ')'].map(op => (
            <button
              key={op}
              type="button"
              className="btn-secondary query__operator"
              style={{padding:'2px 10px',fontSize:'0.95em',borderRadius:'14px',border:'1px solid #8bb',background:'#fff',color:'#356',boxShadow:'0 1px 2px #0001',minWidth:'44px'}} 
              onClick={() => setQuery(q => (q ? `${q} ${op}` : op))}
            >
              {op}
            </button>
          ))}
        </div>
        {primaryTerm && (
          <div style={{display:'flex',alignItems:'center',gap:'4px',flex:1}}>
            <select
              value={selectedRelated}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedRelated(value);
                if (value) setQuery(q => (q ? `${q} ${value}` : value));
              }}
              disabled={!related.items.length}
              className="query__relatedSelect"
              style={{fontSize:'1em',padding:'6px 12px',borderRadius:'18px',border:'2px solid #5b9c9c',background:'#eaf1f1',color:'#357',width:'100%',minWidth:'80px'}}
            >
              <option value="">Select co-occurrence term</option>
              {related.items.slice(0, 24).map(({ term: t, co_count: co, jaccard: j }) => (
                <option key={t} value={t}>{`${t} · co ${co?.toLocaleString?.() ?? co} · J ${j?.toFixed?.(3) ?? j}`}</option>
              ))}
            </select>
            <span className="query__relatedSelectIcon" style={{marginLeft:'-18px',pointerEvents:'none'}}>▾</span>
          </div>
        )}
      </div>
    </div>
  )
}
