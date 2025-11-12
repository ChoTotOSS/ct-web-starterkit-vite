import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'clad-ui/css/baseline';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
