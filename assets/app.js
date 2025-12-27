let sortOrder = 'desc';
const API_BASES = [
  'https://hpc.psy.ntu.edu.tw:5000',
  'https://mil.psy.ntu.edu.tw:5000'
];
let currentApiBase = 0;

const state = {
  terms: [],
  activeTerm: '',
  related: [],
  selectedRelated: '',
  studies: [],
  studiesShown: 0,
  sortedStudies: [],
  queryTokens: [],
  queryDirty: false
};

const SKELETON_COUNT = 8;
let queryDebounceId = null;
let lastRelatedTerm = '';
const queryCache = new Map();

const termInput = document.getElementById('termInput');
const termList = document.getElementById('termList');
const termCount = document.getElementById('termCount');
const termStatus = document.getElementById('termStatus');
const reloadBtn = document.getElementById('reloadTerms');

const selectedTermLabel = document.getElementById('selectedTerm');
const relatedHint = document.getElementById('relatedHint');
const relatedList = document.getElementById('relatedList');
const relationButtons = document.querySelectorAll('[data-rel-operator]');

const queryInput = document.getElementById('queryInput');
const queryStatus = document.getElementById('queryStatus');
const clearQueryBtn = document.getElementById('clearQuery');
const loadMoreBtn = document.getElementById('loadMoreStudies');
const studyList = document.getElementById('studyList');
const studyCount = document.getElementById('studyCount');
const sortToggle = document.getElementById('sortOrderToggle');
const queryEndpoint = document.getElementById('queryEndpoint');

async function fetchJSON(path) {
  let lastError;
  for (let i = 0; i < API_BASES.length; i += 1) {
    const idx = (currentApiBase + i) % API_BASES.length;
    const base = API_BASES[idx];
    try {
      const resp = await fetch(base + path);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      currentApiBase = idx;
      return resp.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function setTermStatus(status, message) {
  if (!termStatus) return;
  termStatus.className = 'mt-4 text-sm';
  if (status === 'loading') {
    termStatus.innerHTML = `<span class="inline-flex items-center gap-2 rounded-full bg-[color:rgba(191,226,222,0.35)] px-3 py-1 text-xs text-[color:var(--muted)] ring-1 ring-[color:var(--border)]">${message}</span>`;
  } else if (status === 'success') {
    termStatus.innerHTML = `<span class="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-200)] px-3 py-1 text-xs font-medium text-[color:var(--brand-600)] ring-1 ring-[color:rgba(47,140,143,0.3)]"><span class="h-2 w-2 rounded-full bg-[color:var(--brand-500)]"></span>${message}</span>`;
  } else if (status === 'error') {
    termStatus.innerHTML = `<span class="inline-flex items-center gap-2 rounded-full bg-[#FDECEC] px-3 py-1 text-xs text-[#C65353] ring-1 ring-[#F5B5B5]"><span class="h-2 w-2 rounded-full bg-[#E05858]"></span>${message}</span>`;
  } else {
    termStatus.textContent = message;
  }
}

async function loadTerms() {
  setTermStatus('loading', '正在向後端拉取全部術語…');
  termList.innerHTML = '';
  try {
    const data = await fetchJSON('/terms');
    state.terms = Array.isArray(data.terms)
      ? data.terms.slice().sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
      : [];
    renderTermList();
    setTermStatus('success', `成功載入 ${state.terms.length.toLocaleString()} 個術語`);
  } catch (err) {
    setTermStatus('error', `載入失敗：${err.message}`);
  }
}

function renderTermList() {
  const keyword = (termInput.value || '').trim().toLowerCase();
  const matches = state.terms
    .reduce((acc, term) => {
      const lower = term.toLowerCase();
      if (!keyword) {
        acc.push({ term, score: 1 });
        return acc;
      }
      if (!lower.includes(keyword)) return acc;
      let score = 2;
      if (lower === keyword) score = 0;
      else if (lower.startsWith(keyword)) score = 1;
      acc.push({ term, score });
      return acc;
    }, [])
    .sort((a, b) => a.score - b.score || a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
    .map(({ term }) => term);
  const limited = matches.slice(0, 24);
  termCount.textContent = keyword ? `${limited.length}/${matches.length} 筆` : `${limited.length}/${state.terms.length} 筆`;

  if (!limited.length) {
    termList.innerHTML = '<p class="col-span-full rounded-2xl border border-[color:var(--border)] bg-[color:rgba(191,226,222,0.35)] px-4 py-6 text-center text-sm text-[color:var(--subtle)]">沒有符合的術語</p>';
    return;
  }

  termList.innerHTML = limited.map((term) => `
      <button
        class="term-chip rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-left text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--brand-400)] hover:text-[color:var(--text-strong)] hover:shadow-sm"
        data-term="${term}"
      >
        ${term}
      </button>
    `).join('');

  autoActivateTerm(limited, keyword);
}

function autoActivateTerm(visibleTerms, keyword) {
  if (!visibleTerms.length) return;
  const first = visibleTerms[0];
  if (state.activeTerm === first) return;
  const currentQuery = (queryInput.value || '').trim();
  const isTypingTerms = document.activeElement === termInput;
  const shouldUpdateQuery = isTypingTerms
    || !state.queryDirty
    || !currentQuery
    || currentQuery === state.activeTerm;
  selectTerm(first, {
    updateTermInput: false,
    updateQueryInput: shouldUpdateQuery,
    skipIfSame: true
  });
}

function normalizeYear(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function sortStudiesByYear(list, order) {
  return list.slice().sort((a, b) => {
    const ay = normalizeYear(a.year);
    const by = normalizeYear(b.year);
    if (ay === by) return 0;
    if (ay === null) return order === 'desc' ? 1 : -1;
    if (by === null) return order === 'desc' ? -1 : 1;
    return order === 'desc' ? by - ay : ay - by;
  });
}

function updateSortIndicator() {
  if (!sortToggle) return;
  const hasData = Array.isArray(state.sortedStudies) && state.sortedStudies.length > 0;
  sortToggle.textContent = sortOrder === 'desc' ? '年份：新→舊' : '年份：舊→新';
  if (!hasData) {
    sortToggle.setAttribute('disabled', 'disabled');
  } else {
    sortToggle.removeAttribute('disabled');
  }
}

function resetStudyDisplays(message = '') {
  state.studies = [];
  state.sortedStudies = [];
  state.studiesShown = 0;
  state.queryTokens = [];
  state.queryDirty = false;
  if (studyList) {
    studyList.innerHTML = message
      ? `<p class="rounded-2xl border border-[color:var(--border)] bg-[color:rgba(191,226,222,0.35)] px-4 py-6 text-center text-sm text-[color:var(--subtle)]">${message}</p>`
      : '';
  }
  if (studyCount) studyCount.textContent = '';
  loadMoreBtn.classList.add('hidden');
  updateSortIndicator();
}

function applyStudySort(nextOrder = sortOrder) {
  sortOrder = nextOrder;
  state.sortedStudies = sortStudiesByYear(state.studies, sortOrder);
  if (!state.sortedStudies.length) {
    state.studiesShown = 0;
    renderStudies();
    updateSortIndicator();
    return;
  }
  state.studiesShown = Math.min(state.studiesShown || 25, state.sortedStudies.length);
  renderStudies();
  updateSortIndicator();
}

async function fetchRelated(term) {
  relatedHint.textContent = '載入相關術語中…';
  relatedHint.classList.remove('text-[#C65353]');
  relatedList.innerHTML = '<div class="w-full rounded-2xl border border-[color:var(--border)] bg-[color:rgba(191,226,222,0.35)] px-4 py-3 text-center text-sm text-[color:var(--subtle)]">請稍候</div>';
  try {
    const data = await fetchJSON(`/terms/${encodeURIComponent(term)}`);
    state.related = Array.isArray(data.related) ? data.related : [];
    renderRelatedTerms();
  } catch (err) {
    relatedHint.textContent = `載入失敗：${err.message}`;
    relatedHint.classList.add('text-[#C65353]');
    relatedList.innerHTML = '';
  }
}

function renderRelatedTerms() {
  if (!state.related.length) {
    relatedHint.textContent = '沒有相關資料';
    relatedList.innerHTML = '<p class="text-sm text-[color:var(--subtle)]">暫無共現詞</p>';
    state.selectedRelated = '';
    lastRelatedTerm = '';
    return;
  }

  relatedHint.classList.remove('text-[#C65353]');
  const compact = state.related.slice(0, 12);
  relatedHint.textContent = state.selectedRelated
    ? `已選取「${state.selectedRelated}」，在下方使用 AND / OR / NOT / ( / ) 即可加入查詢`
    : `共 ${state.related.length} 個關聯詞，可點擊選取後搭配 AND / OR / NOT / ( / )`;

  relatedList.innerHTML = compact.map(({ term, co_count, jaccard }) => {
    const active = state.selectedRelated === term;
    const baseClass = 'inline-flex flex-col rounded-2xl px-3 py-2 text-left text-sm transition';
    const cardClass = active
      ? `${baseClass} border border-[color:var(--brand-400)] bg-white text-[color:var(--text-strong)] shadow`
      : `${baseClass} border border-[color:var(--border)] bg-white text-[color:var(--text)] hover:border-[color:var(--brand-400)] hover:shadow-sm`;
    return `
      <button class="${cardClass}" data-term="${term}">
        <div class="font-semibold">${term}</div>
        <dl class="mt-1 flex items-center gap-2 text-xs text-[color:var(--subtle)]">
          <div class="flex items-center gap-1"><dt>co</dt><dd>${co_count?.toLocaleString?.() ?? co_count}</dd></div>
          <div class="flex items-center gap-1 text-[color:var(--brand-400)]"><dt>J</dt><dd>${jaccard?.toFixed?.(3) ?? jaccard}</dd></div>
        </dl>
      </button>
    `;
  }).join('');
}

async function fetchStudies(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    resetStudyDisplays();
    if (queryStatus) {
      queryStatus.textContent = '尚未查詢。輸入布林語句即可即時查詢結果。';
    }
    return;
  }

  state.queryTokens = extractQueryTokens(normalized);
  const cacheKey = normalized.toLowerCase();
  const cached = queryCache.get(cacheKey);

  if (cached) {
    state.studies = cached.results.slice();
    state.studiesShown = Math.min(25, state.studies.length);
    applyStudySort(sortOrder);
    state.queryDirty = false;
    if (queryStatus) {
      queryStatus.textContent = state.studies.length
        ? `已從快取載入 ${state.studies.length.toLocaleString()} 筆研究結果`
        : '沒有符合的研究結果。';
    }
    return;
  }

  if (queryStatus) {
    queryStatus.textContent = '查詢中…';
  }
  renderStudiesSkeleton();

  try {
    const data = await fetchJSON(`/query/${encodeURIComponent(normalized)}/studies`);
    const results = Array.isArray(data.results) ? data.results : [];
    const sourceHost = API_BASES[currentApiBase]?.replace('https://', '') ?? '';
    queryCache.set(cacheKey, { results, applied: data.applied, source: sourceHost, timestamp: Date.now() });
    state.studies = results.slice();
    state.studiesShown = Math.min(25, state.studies.length);
    applyStudySort(sortOrder);
    state.queryDirty = false;
    if (queryStatus) {
      queryStatus.textContent = state.studies.length
        ? `已載入 ${state.studies.length.toLocaleString()} 筆研究結果`
        : '沒有符合的研究結果。';
    }
  } catch (err) {
    if (queryStatus) {
      queryStatus.textContent = `查詢失敗：${err.message}`;
    }
    resetStudyDisplays('查詢失敗，請稍後再試。');
  }
}

function renderStudies() {
  const source = state.sortedStudies || [];
  if (!source.length) {
    studyList.innerHTML = '<p class="rounded-2xl border border-[color:var(--border)] bg-[color:rgba(191,226,222,0.35)] px-4 py-6 text-center text-sm text-[color:var(--subtle)]">沒有研究結果</p>';
    if (studyCount) studyCount.textContent = '0/0 筆';
    loadMoreBtn.classList.add('hidden');
    return;
  }

  const subset = source.slice(0, Math.min(state.studiesShown, source.length));
  const tokens = state.queryTokens || [];
  if (!subset.length) {
    studyList.innerHTML = '<p class="rounded-2xl border border-[color:var(--border)] bg-[color:rgba(191,226,222,0.35)] px-4 py-6 text-center text-sm text-[color:var(--subtle)]">沒有研究結果</p>';
  } else {
    studyList.innerHTML = subset.map((study) => `
      <article class="space-y-3 rounded-2xl border border-[color:var(--border)]/80 bg-white px-5 py-5 text-[color:var(--text-strong)] shadow-[0_20px_60px_rgba(34,211,238,0.1)]">
        <div class="flex flex-wrap items-center gap-2 text-sm tracking-wide text-[color:var(--subtle)]">
          <span>${escapeHtml(study.year ?? 'N/A')}</span>
          <span>•</span>
          <span>${highlightText(study.journal ?? '未知期刊', tokens)}</span>
        </div>
        <h3 class="text-lg font-semibold text-[color:var(--text-strong)] transition hover:text-[color:var(--brand-600)]">${highlightText(study.title ?? 'Untitled study', tokens)}</h3>
        <p class="text-sm text-[color:var(--muted)] leading-relaxed">${highlightText(study.authors ?? 'Unknown authors', tokens)}</p>
        <dl class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[color:var(--muted)]">
          <div>
            <dt class="text-xs uppercase tracking-[0.2em] text-[color:var(--subtle)]">Study ID</dt>
            <dd class="font-semibold text-[color:var(--text-strong)]">${escapeHtml(study.study_id ?? 'N/A')}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-[0.2em] text-[color:var(--subtle)]">Contrast</dt>
            <dd class="font-semibold text-[color:var(--text-strong)]">${escapeHtml(study.contrast_id ?? '-')}</dd>
          </div>
        </dl>
        <div class="flex flex-wrap gap-3 text-sm">
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/${study.study_id ?? ''}/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-[color:var(--brand-500)] hover:text-[color:var(--brand-400)]"
          >
            於 PubMed 開啟
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 6.75v10.5m-10.5-10.5v10.5M3 6.75h18M3 17.25h18" />
            </svg>
          </a>
        </div>
      </article>
    `).join('');
  }

  const shown = subset.length;
  const total = source.length;
  if (studyCount) studyCount.textContent = `${shown}/${total} 筆`;
  if (state.studiesShown < total) loadMoreBtn.classList.remove('hidden');
  else loadMoreBtn.classList.add('hidden');
}

function renderStudiesSkeleton(count = SKELETON_COUNT) {
  studyList.innerHTML = Array.from({ length: count }).map(() => `
      <div class="py-4">
        <div class="animate-pulse space-y-3">
          <div class="h-3 w-32 rounded bg-[color:var(--border)]/40"></div>
          <div class="h-4 w-5/6 rounded bg-[color:var(--border)]/30"></div>
          <div class="h-3 w-1/2 rounded bg-[color:var(--border)]/20"></div>
        </div>
      </div>
    `).join('');
  if (studyCount) studyCount.textContent = '';
  if (sortToggle) sortToggle.setAttribute('disabled', 'disabled');
}

function normalizeQuery(raw) {
  if (!raw) return '';
  let normalized = raw.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length < 2) return '';
  normalized = normalized.replace(/\s+(AND|OR|NOT)$/i, '').trim();
  if (!normalized) return '';
  const stripped = normalized.replace(/[()]/g, '').trim();
  if (!stripped || /^(AND|OR|NOT)$/i.test(stripped)) return '';
  return normalized;
}

function updateEndpointDisplay(raw) {
  if (!queryEndpoint) return;
  const normalized = normalizeQuery(raw ?? '');
  queryEndpoint.textContent = normalized ? `/query/${encodeURIComponent(normalized)}/studies` : '/query/<term>/studies';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return char;
    }
  });
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractQueryTokens(normalized) {
  if (!normalized) return [];
  const cleaned = normalized.replace(/[()]/g, ' ');
  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !/^(AND|OR|NOT)$/i.test(token))
    .map((token) => token.toLowerCase());
  return Array.from(new Set(tokens));
}

function highlightText(text, tokens) {
  const safe = escapeHtml(text ?? '');
  if (!tokens || !tokens.length || !safe) return safe;
  const pattern = tokens
    .map((token) => escapeRegExp(token))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .join('|');
  if (!pattern) return safe;
  const regex = new RegExp(`(${pattern})`, 'gi');
  return safe.replace(regex, '<mark class="rounded bg-[color:var(--brand-200)] px-1 text-[color:var(--brand-600)]">$1</mark>');
}

function insertAtCaret(input, token) {
  input.focus();
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);
  let next = `${before}${token}${after}`;
  next = next.replace(/\s{2,}/g, ' ');
  input.value = next.trimStart();
  const newPos = (before + token).replace(/\s{2,}/g, ' ').length;
  input.setSelectionRange(newPos, newPos);
  updateEndpointDisplay(input.value);
  return input.value;
}

function insertParenthesis(symbol) {
  const token = symbol === '(' ? ' ( ' : ' ) ';
  const next = insertAtCaret(queryInput, token);
  state.queryDirty = true;
  const normalized = normalizeQuery(next);
  if (normalized) fetchStudies(normalized);
}

function applyRelationOperator(operator, term) {
  const base = queryInput.value.trim();
  if (!base) {
    const next = insertAtCaret(queryInput, term);
    state.queryDirty = true;
    const normalized = normalizeQuery(next);
    if (normalized) fetchStudies(normalized);
    relatedHint.textContent = '已插入術語，結果將自動更新';
    return;
  }
  const next = insertAtCaret(queryInput, ` ${operator} ${term}`);
  state.queryDirty = true;
  const normalized = normalizeQuery(next);
  if (normalized) fetchStudies(normalized);
  relatedHint.textContent = '已插入術語，結果將自動更新';
}

function scheduleQueryFetch() {
  clearTimeout(queryDebounceId);
  queryDebounceId = setTimeout(() => {
    fetchStudies(queryInput.value);
  }, 140);
}

function selectTerm(term, options = {}) {
  const {
    updateTermInput = true,
    updateQueryInput = true,
    skipIfSame = false
  } = options;

  if (skipIfSame && state.activeTerm === term) return;

  state.activeTerm = term;
  state.selectedRelated = '';
  lastRelatedTerm = '';
  selectedTermLabel.textContent = term;

  if (updateTermInput) {
    termInput.value = term;
  }
  if (updateQueryInput) {
    queryInput.value = term;
    state.queryDirty = false;
  }

  const queryForFetch = updateQueryInput ? queryInput.value : term;

  updateEndpointDisplay(queryForFetch);
  fetchRelated(term);
  fetchStudies(queryForFetch);
}

termInput.addEventListener('input', () => {
  renderTermList();
});

termInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const firstChip = termList.querySelector('.term-chip');
    if (firstChip) selectTerm(firstChip.dataset.term);
  }
});

termList.addEventListener('click', (event) => {
  const target = event.target.closest('[data-term]');
  if (target) selectTerm(target.dataset.term);
});

relatedList.addEventListener('click', (event) => {
  const target = event.target.closest('[data-term]');
  if (!target) return;
  const term = target.dataset.term;
  state.selectedRelated = term;
  lastRelatedTerm = term;
  renderRelatedTerms();
});

relationButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const op = btn.dataset.relOperator;
    if (!op) return;
    if (op === '(' || op === ')') {
      insertParenthesis(op);
      return;
    }
    if (!lastRelatedTerm) {
      relatedHint.textContent = '請先在上方選擇一個相關術語';
      relatedHint.classList.add('text-[#C65353]');
      return;
    }
    applyRelationOperator(op, lastRelatedTerm);
    state.selectedRelated = '';
    lastRelatedTerm = '';
    renderRelatedTerms();
  });
});

clearQueryBtn.addEventListener('click', () => {
  queryInput.value = '';
  updateEndpointDisplay('');
  if (queryStatus) {
    queryStatus.textContent = '尚未查詢。輸入布林語句即可即時查詢結果。';
  }
  resetStudyDisplays();
  state.selectedRelated = '';
  lastRelatedTerm = '';
  state.queryDirty = false;
  renderRelatedTerms();
});

queryInput.addEventListener('input', () => {
  state.queryDirty = true;
  updateEndpointDisplay(queryInput.value);
  scheduleQueryFetch();
});

queryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    fetchStudies(queryInput.value);
  }
});

loadMoreBtn.addEventListener('click', () => {
  if (!Array.isArray(state.sortedStudies) || !state.sortedStudies.length) return;
  state.studiesShown = Math.min(state.studiesShown + 25, state.sortedStudies.length);
  renderStudies();
});

if (sortToggle) {
  sortToggle.addEventListener('click', () => {
    if (!Array.isArray(state.sortedStudies) || !state.sortedStudies.length) return;
    const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    applyStudySort(nextOrder);
  });
}

reloadBtn.addEventListener('click', loadTerms);

loadTerms();
updateEndpointDisplay(queryInput.value);
updateSortIndicator();
