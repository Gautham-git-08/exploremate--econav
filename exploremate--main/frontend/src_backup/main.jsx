import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ModalProvider } from './context/ModalContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { AppProvider } from './context/AppContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <ModalProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ModalProvider>
    </SettingsProvider>
  </React.StrictMode>,
)
