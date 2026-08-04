import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// App resolves the theme on mount, but set the stored skin first so the page
// doesn't flash silver before landing on the terminal.
const stored = localStorage.getItem('diary_theme')
document.documentElement.dataset.theme =
  stored === 'terminal' || stored === 'desktop'
    ? stored
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'terminal'
      : 'desktop'

createRoot(document.getElementById('root')).render(<App />)
