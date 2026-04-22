import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1A1714',
            color: '#F2EDE3',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            borderRadius: '2px',
            padding: '10px 16px',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
)