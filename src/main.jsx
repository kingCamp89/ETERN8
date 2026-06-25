import React from 'react'
import { applyTheme, getGlobalTheme } from './lib/themes';
applyTheme(getGlobalTheme());
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)