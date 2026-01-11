import '@ant-design/v5-patch-for-react-19'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import 'antd/dist/reset.css'
import "@/index.css"
import App from "@/App.jsx"
import ErrorBoundary from "@/shared/errors/ErrorBoundary.jsx"
import { initializeGlobalErrorHandlers } from "@/shared/errors/globalErrorHandlers.js"
import GlobalNotificationInit from "@/shared/errors/GlobalNotificationInit.jsx"

// Initialize browser-wide error listeners so you get toasts without DevTools
initializeGlobalErrorHandlers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={{ 
      algorithm: theme.defaultAlgorithm,
      token: {
        fontFamily: 'Raleway, sans-serif'
      }
    }}>
      <AntdApp>
        <GlobalNotificationInit />
        <BrowserRouter>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
