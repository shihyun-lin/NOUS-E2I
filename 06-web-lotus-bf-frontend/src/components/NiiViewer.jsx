
// Display settings: Make x>0 appear on the right side (right brain on the right)
const X_RIGHT_ON_SCREEN_RIGHT = true;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as nifti from 'nifti-reader-js'
import { API_BASE } from '../api'

const MNI_BG_URL = 'static/mni_2mm.nii.gz'

// Detect MNI152 2mm template dims & spacing (91x109x91, 2mm iso)
function isStandardMNI2mm(dims, voxelMM) {
  const okDims = Array.isArray(dims) && dims[0]===91 && dims[1]===109 && dims[2]===91;
  const okSp   = voxelMM && Math.abs(voxelMM[0]-2)<1e-3 && Math.abs(voxelMM[1]-2)<1e-3 && Math.abs(voxelMM[2]-2)<1e-3;
  return okDims && okSp;
}
// Standard MNI152 2mm affine (voxel i,j,k -> MNI mm):
// x = -2*i + 90;  y = 2*j - 126;  z = 2*k - 72
const MNI2MM = { x0: 90, y0: -126, z0: -72, vx: 2, vy: 2, vz: 2 };

export function NiiViewer({ query }) {
  const [dims, setDims] = useState([0,0,0]) // canvas dims (prefer BG; overlay only if same dims)
  const [canvasVersion, setCanvasVersion] = useState(0)

  const [ix, setIx] = useState(0) // sagittal (X)
  const [iy, setIy] = useState(0) // coronal  (Y)
  const [iz, setIz] = useState(0) // axial    (Z)

  const [cx, setCx] = useState('0')
  const [cy, setCy] = useState('0')
  const [cz, setCz] = useState('0')

  const canvases = [useRef(null), useRef(null), useRef(null)]

  const suppressSyncRef = useRef(false)
  const pendingSlicesRef = useRef(null)

  const setSlicesFromCoords = useCallback(({ x, y, z }) => {
    const [nx, ny, nz] = dims
    if (!nx || !ny || !nz) return false
    suppressSyncRef.current = true
    setIx(coord2idx(x, nx, 'x'))
    setIy(coord2idx(y, ny, 'y'))
    setIz(coord2idx(z, nz, 'z'))
    return true
  }, [dims])

  // Listen for peak click events from Studies / Bookmarks
  useEffect(() => {
    const handler = (e) => {
      const { x, y, z } = e.detail || {}
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        setCx(String(x))
        setCy(String(y))
        setCz(String(z))
        const applied = setSlicesFromCoords({ x, y, z })
        if (!applied) pendingSlicesRef.current = { x, y, z }
        else pendingSlicesRef.current = null
      }
    }
    window.addEventListener('nii-viewer-set-coords', handler)
    return () => window.removeEventListener('nii-viewer-set-coords', handler)
  }, [setSlicesFromCoords])

  useEffect(() => {
    if (pendingSlicesRef.current) {
      const applied = setSlicesFromCoords(pendingSlicesRef.current)
      if (applied) pendingSlicesRef.current = null
    }
  }, [dims, setSlicesFromCoords])

  // Fetch an initial peak for the active query and sync the viewer
  useEffect(() => {
    if (!query) return
    let alive = true
    ;(async () => {
      try {
        const u = new URL(`${API_BASE}/query/${encodeURIComponent(query)}/locations`)
        u.searchParams.set('limit', '1')
        const res = await fetch(u.toString())
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null
        if (first) {
          setCx(String(first.x))
          setCy(String(first.y))
          setCz(String(first.z))
          const applied = setSlicesFromCoords(first)
          if (!applied) pendingSlicesRef.current = first
          else pendingSlicesRef.current = null
        }
      } catch {
        // ignore auto-fill errors
      }
    })()
    return () => { alive = false }
  }, [query, setSlicesFromCoords])
  const [loadingBG, setLoadingBG] = useState(false)
  const [loadingMap, setLoadingMap] = useState(false)
  const [errBG, setErrBG] = useState('')
  const [errMap, setErrMap] = useState('')

  // backend params (map generation)
  const [voxel, setVoxel] = useState(2.0)
  const [fwhm, setFwhm] = useState(10.0)
  const [kernel, setKernel] = useState('gauss')
  const [r, setR] = useState(6.0)

  // overlay controls
  const [overlayAlpha, setOverlayAlpha] = useState(0.5)
  const [posOnly, setPosOnly] = useState(true)
  const [useAbs, setUseAbs] = useState(false)
  const [thrMode, setThrMode] = useState('pctl') // default: Percentile (per request)
  const [pctl, setPctl] = useState(95)
  const [thrValue, setThrValue] = useState(0)     // used when mode === 'value'

  // volumes
  const bgRef  = useRef(null)   // { data, dims:[nx,ny,nz], voxelMM:[vx,vy,vz], min, max }
  const mapRef = useRef(null)   // { data, dims:[nx,ny,nz], voxelMM:[vx,vy,vz], min, max }
  const getVoxelMM = () => {
    const vm = bgRef.current?.voxelMM ?? mapRef.current?.voxelMM ?? [1,1,1]
    return { x: vm[0], y: vm[1], z: vm[2] }
  }
  const mapUrl = useMemo(() => {
    if (!query) return ''
    const u = new URL(`${API_BASE}/query/${encodeURIComponent(query)}/nii`)
    u.searchParams.set('voxel', String(voxel))
    u.searchParams.set('fwhm', String(fwhm))
    u.searchParams.set('kernel', String(kernel))
    u.searchParams.set('r', String(r))
    return u.toString()
  }, [query, voxel, fwhm, kernel, r])

  // ---------- utils ----------
  function asTypedArray (header, buffer) {
    switch (header.datatypeCode) {
      case nifti.NIFTI1.TYPE_INT8:    return new Int8Array(buffer)
      case nifti.NIFTI1.TYPE_UINT8:   return new Uint8Array(buffer)
      case nifti.NIFTI1.TYPE_INT16:   return new Int16Array(buffer)
      case nifti.NIFTI1.TYPE_UINT16:  return new Uint16Array(buffer)
      case nifti.NIFTI1.TYPE_INT32:   return new Int32Array(buffer)
      case nifti.NIFTI1.TYPE_UINT32:  return new Uint32Array(buffer)
      case nifti.NIFTI1.TYPE_FLOAT32: return new Float32Array(buffer)
      case nifti.NIFTI1.TYPE_FLOAT64: return new Float64Array(buffer)
      default: return new Float32Array(buffer)
    }
  }
  function minmax (arr) {
    let mn =  Infinity, mx = -Infinity
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    return [mn, mx]
  }
  function percentile(arr, p, step=Math.ceil(arr.length/200000)) {
    if (!arr.length) return 0
    const samp = []
    for (let i=0; i<arr.length; i+=step) samp.push(arr[i])
    samp.sort((a,b)=>a-b)
    const k = Math.floor((p/100) * (samp.length - 1))
    return samp[Math.max(0, Math.min(samp.length-1, k))]
  }
  async function loadNifti(url) {
    const res = await fetch(url)
    if (!res.ok) {
      const t = await res.text().catch(()=> '')
      throw new Error(`GET ${url} → ${res.status} ${t}`)
    }
    let ab = await res.arrayBuffer()
    if (nifti.isCompressed(ab)) ab = nifti.decompress(ab)
    if (!nifti.isNIFTI(ab)) throw new Error('not a NIfTI file')
    const header = nifti.readHeader(ab)
    const image  = nifti.readImage(header, ab)
    const ta     = asTypedArray(header, image)
    let f32
    if (ta instanceof Float32Array) f32 = ta
    else if (ta instanceof Float64Array) f32 = Float32Array.from(ta)
    else {
      const [mn, mx] = minmax(ta)
      const range = (mx - mn) || 1
      f32 = new Float32Array(ta.length)
      for (let i=0;i<ta.length;i++) f32[i] = (ta[i] - mn) / range
    }
    const nx = header.dims[1] | 0
    const ny = header.dims[2] | 0
    const nz = header.dims[3] | 0
    if (!nx || !ny || !nz) throw new Error('invalid dims')
    const [mn, mx] = minmax(f32)
    const vx = Math.abs(header.pixDims?.[1] ?? 1)
    const vy = Math.abs(header.pixDims?.[2] ?? 1)
    const vz = Math.abs(header.pixDims?.[3] ?? 1)
    return { data: f32, dims:[nx,ny,nz], voxelMM:[vx,vy,vz], min: mn, max: mx }
  }

  // clamp helper removed (unused) to satisfy linter

  // helpers: convert between index [0..N-1] and neurosynth-style signed coord centered at mid voxel
  // Display conventions to match Neurosynth-like UI:
  //  - X: right-positive
  //  - Y: anterior-positive (but screen vertical is flipped), so invert sign
  //  - Z: superior-positive (also vertical), invert sign
  const AXIS_SIGN = { x: -1, y: 1, z: 1 } // X is neg for index<->coord mapping only when not using standard MNI affine
  const idx2coord = (i, n, axis) => {
    const [nx, ny, nz] = dims;
    const { x: vx, y: vy, z: vz } = getVoxelMM();
    const isStd = isStandardMNI2mm([nx, ny, nz], [vx, vy, vz]);
    if (isStd) {
      if (axis === 'x') return (-MNI2MM.vx * i + MNI2MM.x0);
      if (axis === 'y') return ( MNI2MM.vy * i + MNI2MM.y0);
      if (axis === 'z') return ( MNI2MM.vz * i + MNI2MM.z0);
    }
    const mmPerVoxel = axis === 'x' ? vx : axis === 'y' ? vy : vz;
    return AXIS_SIGN[axis] * (i - Math.floor(n/2)) * mmPerVoxel;
  }
const coord2idx = (c_mm, n, axis) => {
    const [nx, ny, nz] = dims;
    const { x: vx, y: vy, z: vz } = getVoxelMM();
    const isStd = isStandardMNI2mm([nx, ny, nz], [vx, vy, vz]);
    if (isStd) {
      let v;
      if (axis === 'x') v = ( (MNI2MM.x0 - c_mm) / MNI2MM.vx );
      else if (axis === 'y') v = ( (c_mm - MNI2MM.y0) / MNI2MM.vy );
      else v = ( (c_mm - MNI2MM.z0) / MNI2MM.vz );
      const idx = Math.round(v);
      return Math.max(0, Math.min(n-1, idx));
    }
    const mmPerVoxel = axis === 'x' ? vx : axis === 'y' ? vy : vz;
    const sign = AXIS_SIGN[axis];
    const v = (sign * (c_mm / mmPerVoxel)) + Math.floor(n/2);
    const idx = Math.round(v);
    return Math.max(0, Math.min(n-1, idx));
  }
  // load background on mount
  useEffect(() => {
    let alive = true
    setLoadingBG(true); setErrBG('')
    ;(async () => {
      try {
        const bg = await loadNifti(MNI_BG_URL)
        if (!alive) return
        bgRef.current = bg
        // Always prefer BG dims for the canvas
        setDims(bg.dims)
        const [nx,ny,nz] = bg.dims
        const mx = Math.floor(nx/2), my = Math.floor(ny/2), mz = Math.floor(nz/2)
        setIx(mx); setIy(my); setIz(mz)
        setCx('0'); setCy('0'); setCz('0')
      } catch (e) {
        if (!alive) return
        setErrBG(e?.message || String(e))
        bgRef.current = null
      } finally {
        // avoid returning from finally (unsafe); only set state when still alive
        if (alive) setLoadingBG(false)
      }
    })()
    return () => { alive = false }
  }, [])

  
  // keep thrValue within current map range when map changes
  useEffect(() => {
    const mn = mapRef.current?.min ?? 0
    const mx = mapRef.current?.max ?? 1
    if (thrValue < mn || thrValue > mx) {
      setThrValue(Math.min(mx, Math.max(mn, thrValue)))
    }
  }, [mapRef.current, dims])

// load meta-analytic map when query/params change
  useEffect(() => {
    if (!mapUrl) { mapRef.current = null; return }
    let alive = true
    setLoadingMap(true); setErrMap('')
    ;(async () => {
      try {
        const mv = await loadNifti(mapUrl)
        if (!alive) return
        mapRef.current = mv
        if (!bgRef.current) {
          setDims(mv.dims)
          const [nx,ny,nz] = mv.dims
          const mx = Math.floor(nx/2), my = Math.floor(ny/2), mz = Math.floor(nz/2)
          setIx(mx); setIy(my); setIz(mz)
          setCx('0'); setCy('0'); setCz('0')
        }
      } catch (e) {
        if (!alive) return
        setErrMap(e?.message || String(e))
        mapRef.current = null
      } finally {
        // avoid returning from finally (unsafe); only set state when still alive
        if (alive) setLoadingMap(false)
      }
    })()
    return () => { alive = false }
  }, [mapUrl])

  const mapThreshold = useMemo(() => {
    const mv = mapRef.current
    if (!mv) return null
    if (thrMode === 'value') return Number(thrValue) || 0
    return percentile(mv.data, Math.max(0, Math.min(100, Number(pctl) || 95)))
  }, [thrMode, thrValue, pctl, mapRef.current])

  useEffect(() => {
    const nodes = canvases.map(ref => ref.current).filter(Boolean)
    if (!nodes.length) return
    if (typeof ResizeObserver === 'undefined') {
      const handler = () => setCanvasVersion(v => v + 1)
      window.addEventListener('resize', handler)
      return () => window.removeEventListener('resize', handler)
    }
    const ro = new ResizeObserver(() => setCanvasVersion(v => v + 1))
    nodes.forEach(node => ro.observe(node))
    return () => ro.disconnect()
  }, [dims[0], dims[1], dims[2]])

  // draw one slice (upright orientation via vertical flip)
  function drawSlice (canvas, axis /* 'z' | 'y' | 'x' */, index) {
    if (!canvas) return
    const [nx, ny, nz] = dims
    if (!nx || !ny || !nz) return

    const bg = bgRef.current
    const map = mapRef.current
    const dimsStr = dims.join('x')
    const bgOK = !!(bg && bg.dims.join('x') === dimsStr)
    const mapOK = !!(map && map.dims.join('x') === dimsStr)

    const sx = (x) => (X_RIGHT_ON_SCREEN_RIGHT ? (nx - 1 - x) : x)

    let w = 0
    let h = 0
    let getBG = null
    let getMap = null
    if (axis === 'z') { w = nx; h = ny; if (bgOK) getBG = (x, y) => bg.data[sx(x) + y * nx + index * nx * ny]; if (mapOK) getMap = (x, y) => map.data[sx(x) + y * nx + index * nx * ny] }
    if (axis === 'y') { w = nx; h = nz; if (bgOK) getBG = (x, y) => bg.data[sx(x) + index * nx + y * nx * ny]; if (mapOK) getMap = (x, y) => map.data[sx(x) + index * nx + y * nx * ny] }
    if (axis === 'x') { w = ny; h = nz; if (bgOK) getBG = (x, y) => bg.data[index + x * nx + y * nx * ny]; if (mapOK) getMap = (x, y) => map.data[index + x * nx + y * nx * ny] }
    if (!w || !h) return
    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const offCtx = offscreen.getContext('2d', { willReadFrequently: false })
    const img = offCtx.createImageData(w, h)
    const bgMin = bg?.min ?? 0
    const bgMax = bg?.max ?? 1
    const bgRange = (bgMax - bgMin) || 1
    const alpha = Math.max(0, Math.min(1, overlayAlpha))
    const R = 255; const G = 0; const B = 0
    const thr = mapThreshold

    let p = 0
    for (let yy = 0; yy < h; yy++) {
      const srcY = h - 1 - yy
      for (let xx = 0; xx < w; xx++) {
        let gray = 0
        if (getBG) {
          const vbg = getBG(xx, srcY)
          let g = (vbg - bgMin) / bgRange
          if (g < 0) g = 0
          if (g > 1) g = 1
          gray = (g * 255) | 0
        }
        img.data[p] = gray
        img.data[p + 1] = gray
        img.data[p + 2] = gray
        img.data[p + 3] = 255

        if (getMap) {
          let mv = getMap(xx, srcY)
          const raw = mv
          if (useAbs) mv = Math.abs(mv)
          let pass = (thr == null) ? (mv > 0) : (mv >= thr)
          if (posOnly && raw <= 0) pass = false
          if (pass) {
            img.data[p] = ((1 - alpha) * img.data[p] + alpha * R) | 0
            img.data[p + 1] = ((1 - alpha) * img.data[p + 1] + alpha * G) | 0
            img.data[p + 2] = ((1 - alpha) * img.data[p + 2] + alpha * B) | 0
          }
        }
        p += 4
      }
    }
    offCtx.putImageData(img, 0, 0)

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const baseSide = rect.width || rect.height || Math.max(w, h)
    const targetSide = Math.max(1, Math.round(baseSide * dpr))
    canvas.width = targetSide
    canvas.height = targetSide
    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    ctx.imageSmoothingEnabled = true
    ctx.clearRect(0, 0, targetSide, targetSide)
    const scale = Math.min(targetSide / w, targetSide / h)
    const drawW = w * scale
    const drawH = h * scale
    const offsetX = (targetSide - drawW) / 2
    const offsetY = (targetSide - drawH) / 2
    ctx.drawImage(offscreen, 0, 0, w, h, offsetX, offsetY, drawW, drawH)

    ctx.save()
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = Math.max(1, Math.round(dpr))
    let crossX = 0
    let crossY = 0
    if (axis === 'z') {
      crossX = Math.max(0, Math.min(w - 1, (X_RIGHT_ON_SCREEN_RIGHT ? (w - 1 - ix) : ix)))
      crossY = Math.max(0, Math.min(h - 1, iy))
    } else if (axis === 'y') {
      crossX = Math.max(0, Math.min(w - 1, (X_RIGHT_ON_SCREEN_RIGHT ? (w - 1 - ix) : ix)))
      crossY = Math.max(0, Math.min(h - 1, iz))
    } else {
      crossX = Math.max(0, Math.min(w - 1, iy))
      crossY = Math.max(0, Math.min(h - 1, iz))
    }

    const denomX = w > 1 ? (w - 1) : 1
    const denomY = h > 1 ? (h - 1) : 1
    const crossXDisplay = offsetX + (crossX / denomX) * drawW
    const crossYDisplay = offsetY + ((h - 1 - crossY) / denomY) * drawH

    ctx.beginPath()
    ctx.moveTo(crossXDisplay + 0.5, offsetY)
    ctx.lineTo(crossXDisplay + 0.5, offsetY + drawH)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(offsetX, crossYDisplay + 0.5)
    ctx.lineTo(offsetX + drawW, crossYDisplay + 0.5)
    ctx.stroke()
    ctx.restore()
  }

  // click-to-move crosshairs
  function onCanvasClick (e, axis) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * canvas.width / rect.width)
    const y = Math.floor((e.clientY - rect.top) * canvas.height / rect.height)
    const srcY = canvas.height - 1 - y // invert because we draw with vertical flip
    const [nx,ny,nz] = dims
    
    const toIdxX = (screenX) => (X_RIGHT_ON_SCREEN_RIGHT ? (nx - 1 - screenX) : screenX);
    if (axis === 'z') { const xi = toIdxX(x); setIx(xi); setIy(srcY); setCx(String(idx2coord(xi, nx, 'x'))); setCy(String(idx2coord(srcY, ny, 'y'))) }
    else if (axis === 'y') { const xi = toIdxX(x); setIx(xi); setIz(srcY); setCx(String(idx2coord(xi, nx, 'x'))); setCz(String(idx2coord(srcY, nz, 'z'))) }
    else { setIy(x); setIz(srcY); setCy(String(idx2coord(x, ny, 'y'))); setCz(String(idx2coord(srcY, nz, 'z'))) }
  }

  // keep display coords in sync when ix/iy/iz/dims change (e.g., after loads)
  useEffect(() => {
    const [nx,ny,nz] = dims
    if (!nx) return
    setCx(String(idx2coord(ix, nx, 'x')))
    setCy(String(idx2coord(iy, ny, 'y')))
    setCz(String(idx2coord(iz, nz, 'z')))
  }, [ix,iy,iz,dims])

  // commit handlers: parse signed integer, map to index, clamp to volume
  const commitCoord = (axis) => {
    const [nx,ny,nz] = dims
    let vStr = axis==='x' ? cx : axis==='y' ? cy : cz
    // allow empty / '-' temporary states
    if (vStr === '' || vStr === '-' ) return
    const parsed = parseFloat(vStr)
    if (Number.isNaN(parsed)) return
    if (axis==='x') setIx(coord2idx(parsed, nx, 'x'))
    if (axis==='y') setIy(coord2idx(parsed, ny, 'y'))
    if (axis==='z') setIz(coord2idx(parsed, nz, 'z'))
  }

  const dimsKey = dims.join('x')

  // redraw on state changes
  useEffect(() => {
    const [nx, ny, nz] = dims
    if (!nx) return
    const c0 = canvases[0].current, c1 = canvases[1].current, c2 = canvases[2].current
    if (c0 && iz >=0 && iz < nz) drawSlice(c0, 'z', iz)
    if (c1 && iy >=0 && iy < ny) drawSlice(c1, 'y', iy)
    if (c2 && ix >=0 && ix < nx) drawSlice(c2, 'x', ix)
  }, [
    dimsKey, ix, iy, iz,
    overlayAlpha, posOnly, useAbs, thrMode, pctl, thrValue,
    loadingBG, loadingMap, errBG, errMap, query,
    canvasVersion
  ])

  const [nx, ny, nz] = dims

  // slice configs (labels only; numbers removed)
  const sliceConfigs = [
    { key: 'y', name: 'Coronal Y', axisLabel: 'Y', canvasRef: canvases[1], width: nx, height: nz },
    { key: 'x', name: 'Sagittal X', axisLabel: 'X', canvasRef: canvases[2], width: ny, height: nz },
    { key: 'z', name: 'Axial Z', axisLabel: 'Z', canvasRef: canvases[0], width: nx, height: ny }
  ]

  return (
    <div className='viewer'>
      <div className='viewer__header'>
        <div className='card__title'>NIfTI Viewer</div>
        {query && (
          <a href={mapUrl} className='viewer__download'>
            Download NIfTI
          </a>
        )}
      </div>

      <div className='viewer__section'>
        <div className='viewer__field'>
          <label htmlFor='viewer-threshold-mode'>Threshold mode</label>
          <select
            id='viewer-threshold-mode'
            value={thrMode}
            onChange={e => setThrMode(e.target.value)}
            className='viewer__select'
          >
            <option value='value'>Value</option>
            <option value='pctl'>Percentile</option>
          </select>
        </div>

        {thrMode === 'value' ? (
          <div className='viewer__field viewer__field--inline'>
            <label htmlFor='viewer-threshold-value'>Threshold</label>
            <input
              id='viewer-threshold-value'
              type='number'
              step='0.01'
              value={thrValue}
              onChange={e => setThrValue(Number(e.target.value))}
              className='viewer__input viewer__input--short'
            />
          </div>
        ) : (
          <div className='viewer__field viewer__field--inline'>
            <label htmlFor='viewer-percentile'>Percentile</label>
            <input
              id='viewer-percentile'
              type='number'
              min={50}
              max={99.9}
              step={0.5}
              value={pctl}
              onChange={e => setPctl(Number(e.target.value) || 95)}
              className='viewer__input viewer__input--short'
            />
          </div>
        )}

        <div className='viewer__coords'>
          <div className='viewer__coord'>
            <label htmlFor='viewer-x'>X (mm)</label>
            <input
              id='viewer-x'
              type='text'
              inputMode='decimal'
              pattern='-?[0-9]*([.][0-9]+)?'
              className='viewer__coordInput'
              value={cx}
              onChange={e => setCx(e.target.value)}
              onBlur={() => commitCoord('x')}
              onKeyDown={e => { if (e.key === 'Enter') commitCoord('x') }}
              aria-label='X coordinate (centered)'
            />
          </div>
          <div className='viewer__coord'>
            <label htmlFor='viewer-y'>Y (mm)</label>
            <input
              id='viewer-y'
              type='text'
              inputMode='decimal'
              pattern='-?[0-9]*([.][0-9]+)?'
              className='viewer__coordInput'
              value={cy}
              onChange={e => setCy(e.target.value)}
              onBlur={() => commitCoord('y')}
              onKeyDown={e => { if (e.key === 'Enter') commitCoord('y') }}
              aria-label='Y coordinate (centered)'
            />
          </div>
          <div className='viewer__coord'>
            <label htmlFor='viewer-z'>Z (mm)</label>
            <input
              id='viewer-z'
              type='text'
              inputMode='decimal'
              pattern='-?[0-9]*([.][0-9]+)?'
              className='viewer__coordInput'
              value={cz}
              onChange={e => setCz(e.target.value)}
              onBlur={() => commitCoord('z')}
              onKeyDown={e => { if (e.key === 'Enter') commitCoord('z') }}
              aria-label='Z coordinate (centered)'
            />
          </div>
        </div>

      </div>

      {(loadingBG || loadingMap) && (
        <div className='viewer__skeletonGrid'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='viewer__skeletonTile' />
          ))}
        </div>
      )}

      {(errBG || errMap) && (
        <div className='viewer__alert'>
          {errBG && <div>Background: {errBG}</div>}
          {errMap && <div>Map: {errMap}</div>}
        </div>
      )}

      {!!nx && (
        <div className='viewer__slices'>
          {sliceConfigs.map(({ key, name, axisLabel, canvasRef, width, height }) => (
            <div key={key} className='viewer__slice'>
              <div className='viewer__sliceLabel' style={{whiteSpace:'nowrap'}}>{name} ({axisLabel})</div>
              <canvas
                ref={canvasRef}
                className='viewer__canvas'
                onClick={(e) => onCanvasClick(e, key)}
                style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
              />
            </div>
          ))}
        </div>
      )}

      <div className='viewer__section viewer__section--compact'>
        <div className='viewer__field viewer__field--inline'>
          <label htmlFor='viewer-fwhm'>Gaussian FWHM</label>
          <input
            id='viewer-fwhm'
            type='number'
            step='0.5'
            value={fwhm}
            onChange={e => setFwhm(Number(e.target.value) || 0)}
            className='viewer__input viewer__input--short'
          />
        </div>

        <div className='viewer__field viewer__field--inline'>
          <label htmlFor='viewer-voxel'>Voxel (mm)</label>
          <input
            id='viewer-voxel'
            type='number'
            step='0.5'
            min={1}
            max={6}
            value={voxel}
            onChange={e => setVoxel(Number(e.target.value) || 1)}
            className='viewer__input viewer__input--short'
          />
        </div>

        <div className='viewer__field viewer__field--inline'>
          <label htmlFor='viewer-kernel'>Kernel</label>
          <select
            id='viewer-kernel'
            value={kernel}
            onChange={e => setKernel(e.target.value)}
            className='viewer__select viewer__select--short'
          >
            <option value='gauss'>Gaussian</option>
            <option value='sinc'>Sinc</option>
            <option value='uniform'>Uniform</option>
          </select>
        </div>

        <div className='viewer__field viewer__field--inline'>
          <label htmlFor='viewer-r'>r</label>
          <input
            id='viewer-r'
            type='number'
            step='0.5'
            value={r}
            onChange={e => setR(Number(e.target.value) || 0)}
            className='viewer__input viewer__input--short'
          />
        </div>
      </div>

      <div className='viewer__section viewer__section--compact'>
        <div className='viewer__toggles'>
          <label className='viewer__toggle'>
            <input
              type='checkbox'
              checked={posOnly}
              onChange={e => setPosOnly(e.target.checked)}
            />
            <span>Positive only</span>
          </label>
          <label className='viewer__toggle'>
            <input
              type='checkbox'
              checked={useAbs}
              onChange={e => setUseAbs(e.target.checked)}
            />
            <span>Abs values</span>
          </label>
        </div>

        <div className='viewer__sliderRow'>
          <label htmlFor='viewer-alpha'>Overlay alpha</label>
          <input
            id='viewer-alpha'
            type='range'
            min={0}
            max={1}
            step={0.05}
            value={overlayAlpha}
            onChange={e => setOverlayAlpha(Number(e.target.value))}
            className='viewer__slider'
          />
          <span className='viewer__sliderValue'>{overlayAlpha.toFixed(2)}</span>
        </div>
      </div>

      <div className='viewer__status'>
        {loadingBG && <div>Loading background…</div>}
        {loadingMap && <div>Loading map…</div>}
      </div>
    </div>
  )
}
