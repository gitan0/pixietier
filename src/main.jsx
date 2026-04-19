import './tokens.css'
import './components.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import PixieTierList from './PixieTierList'

ReactDOM.createRoot(document.getElementById('pixie-tier-root')).render(
  <React.StrictMode>
    <PixieTierList />
    <Analytics />
  </React.StrictMode>,
)
