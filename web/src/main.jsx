import '@ant-design/v5-patch-for-react-19'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import 'antd/dist/reset.css'
import "@/index.css"
import App from "@/App.jsx"
import ErrorBoundary from "@/shared/errors/ErrorBoundary.jsx"
import { initializeGlobalErrorHandlers } from "@/shared/errors/globalErrorHandlers.js"
import GlobalNotificationInit from "@/shared/errors/GlobalNotificationInit.jsx"
import { ThemeProvider } from "@/shared/theme/ThemeProvider.jsx"
import { DevToolsProvider } from "@/features/devtools/DevToolsProvider.jsx"
import DevFab from "@/features/devtools/DevFab.jsx"

// Initialize browser-wide error listeners so you get toasts without DevTools
initializeGlobalErrorHandlers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AntdApp>
          <GlobalNotificationInit />
          <ErrorBoundary>
            <DevToolsProvider>
              <App />
              <DevFab />
            </DevToolsProvider>
          </ErrorBoundary>
        </AntdApp>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
