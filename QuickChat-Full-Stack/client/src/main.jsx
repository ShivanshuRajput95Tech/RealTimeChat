import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'
import { WorkspaceProvider } from './context/WorkspaceContext.jsx'
import { GroupProvider } from './context/GroupContext.jsx'
import { AIProvider } from './context/AIContext.jsx'
import { VoiceProvider } from './context/VoiceContext.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ChatProvider>
          <WorkspaceProvider>
            <GroupProvider>
              <AIProvider>
                <VoiceProvider>
                  <App />
                </VoiceProvider>
              </AIProvider>
            </GroupProvider>
          </WorkspaceProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)