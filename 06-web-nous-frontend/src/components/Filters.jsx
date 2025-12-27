import { useMemo, useState } from 'react'
import { defaultSections, SHOW_OPTIONS, FILTER_DEFAULTS } from './filterConstants'

export function Filters ({ filters, onChange, onReset }) {
  const [open, setOpen] = useState(defaultSections)

  const toggle = (key) => {
    setOpen((state) => ({ ...state, [key]: !state[key] }))
  }

  const handleUpdate = (partial) => {
    onChange?.({ ...filters, ...partial })
  }

  const clearYear = () => {
    handleUpdate({
      yearMode: 'range',
      yearStart: '',
      yearEnd: '',
      singleYear: ''
    })
  }

  const activeSummary = useMemo(() => {
    const summary = []
    if (filters?.yearMode === 'single' && filters?.singleYear) {
  summary.push(`Year: ${filters.singleYear}`)
    } else if (filters?.yearStart || filters?.yearEnd) {
  summary.push(`Year: ${filters.yearStart || '…'}-${filters.yearEnd || '…'}`)
    }
  if (filters?.title) summary.push(`Title contains "${filters.title}"`)
  if (filters?.author) summary.push(`Author contains "${filters.author}"`)
  if (filters?.studyId) summary.push(`Study ID contains "${filters.studyId}"`)
    return summary
  }, [filters])

  return (
    <div className="filters">
      <div className="filters__header">
  <div className="filters__title">Filters</div>
        <button type="button" className="filters__reset" onClick={onReset} disabled={activeSummary.length === 0}>
          Clear All
        </button>
      </div>

      <section className={`filters__section ${open.year ? 'is-open' : ''}`}>
        <button type="button" className="filters__toggle" onClick={() => toggle('year')}>
          <span>Year</span>
          <span className="filters__chevron">{open.year ? '▴' : '▾'}</span>
        </button>
        {open.year && (
          <div className="filters__body">
            <div className="filters__radioRow">
              <label className="filters__option">
                <input
                  type="radio"
                  value="range"
                  checked={filters.yearMode === 'range'}
                  onChange={(e) => handleUpdate({ yearMode: e.target.value })}
                />
                <span>Range</span>
              </label>
              <label className="filters__option">
                <input
                  type="radio"
                  value="single"
                  checked={filters.yearMode === 'single'}
                  onChange={(e) => handleUpdate({ yearMode: e.target.value })}
                />
                <span>Single Year</span>
              </label>
            </div>

            {filters.yearMode === 'single' ? (
              <input
                className="filters__input"
                type="number"
                placeholder="e.g. 2015"
                value={filters.singleYear}
                onChange={(e) => handleUpdate({ singleYear: e.target.value })}
              />
            ) : (
              <div className="filters__range">
                <input
                  className="filters__input"
                  type="number"
                  placeholder="Start Year"
                  value={filters.yearStart}
                  onChange={(e) => handleUpdate({ yearStart: e.target.value })}
                />
                <span className="filters__dash">—</span>
                <input
                  className="filters__input"
                  type="number"
                  placeholder="End Year"
                  value={filters.yearEnd}
                  onChange={(e) => handleUpdate({ yearEnd: e.target.value })}
                />
              </div>
            )}

            <div className="filters__actions">
              <button type="button" className="filters__link" onClick={clearYear}>Clear</button>
            </div>
          </div>
        )}
      </section>

      <section className={`filters__section ${open.title ? 'is-open' : ''}`}>
        <button type="button" className="filters__toggle" onClick={() => toggle('title')}>
          <span>Title</span>
          <span className="filters__chevron">{open.title ? '▴' : '▾'}</span>
        </button>
        {open.title && (
          <div className="filters__body">
            <input
              className="filters__input"
              type="text"
              placeholder="Enter title keyword"
              value={filters.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
            />
          </div>
        )}
      </section>

      <section className={`filters__section ${open.author ? 'is-open' : ''}`}>
        <button type="button" className="filters__toggle" onClick={() => toggle('author')}>
          <span>Author</span>
          <span className="filters__chevron">{open.author ? '▴' : '▾'}</span>
        </button>
        {open.author && (
          <div className="filters__body">
            <input
              className="filters__input"
              type="text"
              placeholder="Enter author name or keyword"
              value={filters.author}
              onChange={(e) => handleUpdate({ author: e.target.value })}
            />
            <p className="filters__hint">Supports multiple authors, separated by commas.</p>
          </div>
        )}
      </section>

      <section className={`filters__section ${open.studyId ? 'is-open' : ''}`}>
        <button type="button" className="filters__toggle" onClick={() => toggle('studyId')}>
          <span>Study ID</span>
          <span className="filters__chevron">{open.studyId ? '▴' : '▾'}</span>
        </button>
        {open.studyId && (
          <div className="filters__body">
            <input
              className="filters__input"
              type="text"
              placeholder="Enter Study ID or partial characters"
              value={filters.studyId}
              onChange={(e) => handleUpdate({ studyId: e.target.value })}
            />
            <p className="filters__hint">You can enter multiple IDs, separated by commas.</p>
          </div>
        )}
      </section>

      {activeSummary.length > 0 && (
        <div className="filters__summary">
          {activeSummary.map((item, idx) => (
            <span key={idx} className="filters__chip">{item}</span>
          ))}
        </div>
      )}
    </div>
  )
}
