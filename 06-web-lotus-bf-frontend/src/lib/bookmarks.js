// Bookmark utilities: localStorage helpers
const STORAGE_KEY = 'bookmarkedStudies';
const INVALID_IDS = new Set(['', 'undefined', 'null', 'NaN']);

const normalizeBookmarks = (value) => {
  const result = {};
  const add = (id) => {
    const key = String(id ?? '').trim();
    if (!key || INVALID_IDS.has(key)) return;
    result[key] = true;
  };

  if (!value) return result;
  if (Array.isArray(value)) {
    value.forEach(add);
    return result;
  }
  if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      if (!val) continue;
      add(key);
    }
    return result;
  }
  add(value);
  return result;
};

export function loadBookmarks() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return {};
    const parsed = JSON.parse(rawValue);
    const normalized = normalizeBookmarks(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return {};
  }
}

export function saveBookmarks(bookmarks) {
  const normalized = normalizeBookmarks(bookmarks);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event('bookmarks:changed'));
  return normalized;
}

export function toggleBookmark(studyId) {
  const key = String(studyId ?? '').trim();
  if (!key || INVALID_IDS.has(key)) return false;
  const bookmarks = loadBookmarks();
  if (bookmarks[key]) delete bookmarks[key];
  else bookmarks[key] = true;
  const updated = saveBookmarks(bookmarks);
  return !!updated[key];
}

export function getBookmarkedIds() {
  return Object.keys(loadBookmarks());
}

export function clearBookmarks() {
  saveBookmarks({});
}

export function removeBookmarks(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return loadBookmarks();
  const bookmarks = loadBookmarks();
  let changed = false;
  for (const id of ids) {
    const key = String(id ?? '').trim();
    if (!key) continue;
    if (bookmarks[key]) {
      delete bookmarks[key];
      changed = true;
    }
  }
  if (!changed) return bookmarks;
  return saveBookmarks(bookmarks);
}
