export const defaultSections = {
  show: true,
  year: true,
  title: false,
  author: false,
  studyId: false,
}

export const SHOW_OPTIONS = [
  { value: 'all', label: 'All Results' },
  { value: 'withCoordinates', label: 'Coordinates Only' },
  { value: 'open', label: 'Open Data' },
]

export const FILTER_DEFAULTS = {
  show: 'all',
  yearMode: 'range',
  yearStart: '',
  yearEnd: '',
  singleYear: '',
  title: '',
  author: '',
  studyId: '',
}
