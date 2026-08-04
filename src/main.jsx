import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// App resolves the theme on mount, but set the stored palette first so the
// page doesn't flash cream before landing on navy.
const stored = localStorage.getItem('diary_theme')
document.documentElement.dataset.theme =
  stored === 'nuit' || stored === 'jour'
    ? stored
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'nuit'
      : 'jour'

createRoot(document.getElementById('root')).render(<App />)
