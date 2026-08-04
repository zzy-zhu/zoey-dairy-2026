import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Theme is applied before paint in App, but set the stored value early so the
// dreamy background doesn't flash the wrong palette on load.
const stored = localStorage.getItem('diary_theme')
if (stored === 'night' || stored === 'day') {
  document.documentElement.dataset.theme = stored
}

createRoot(document.getElementById('root')).render(<App />)
