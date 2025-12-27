// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

export function ErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null)
  React.useEffect(() => {
    const handler = (e) => setErr(e?.error || e?.reason || e)
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', handler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', handler)
    }
  }, [])
  if (err) {
    return (
      <div style={{ padding: 16, fontFamily: 'ui-sans-serif' }}>
        <h2>Runtime error!</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
{String(err?.stack || err?.message || err)}
        </pre>
      </div>
    )
  }
  return children
}

console.log('[main] booting...') // smoke test: visible in DevTools

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

