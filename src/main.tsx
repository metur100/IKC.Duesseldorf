import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './context/LanguageContext'
import { SiteProvider } from './cms/site'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import '@fontsource/amiri/400.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <SiteProvider>
        {/* The site is served from a sub-path on GitHub Pages (e.g. /IKC.Duesseldorf/). */}
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <App />
        </BrowserRouter>
      </SiteProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
