import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

/* --- Convo Modular CSS System --- */
/* Order matters: Variables must load first for tokens to be available */
import './styles/variables.css'
import './styles/global.css'
import './styles/typography.css'
import './styles/animations.css'
import './styles/utilities.css'
import './styles/forms.css'
/* Responsive is last to ensure media query specificity wins */
import './styles/responsive.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
