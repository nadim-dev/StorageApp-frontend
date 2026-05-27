import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App  from './App'
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DriveProvider } from './context/driveContext';
import { AuthProvider } from './context/authContext';
   

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_Google_Client_Id}>
      <AuthProvider>
          <DriveProvider>
            <App />
          </DriveProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
