import '@ant-design/v5-patch-for-react-19'
import 'antd/dist/reset.css'
import '../src/index.css'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { http, HttpResponse } from 'msw'

initialize({ onUnhandledRequest: 'bypass' })

const mockBusinessProfile = { status: 'draft' }
const mockUser = {
  email: 'owner@example.com',
  firstName: 'Story',
  role: { slug: 'business_owner' },
  token: 'story-token'
}

const wizardHandlers = [
  http.get('/api/business/profile', () => HttpResponse.json(mockBusinessProfile)),
  http.post('/api/business/profile', () => HttpResponse.json(mockBusinessProfile)),
  http.get('/api/auth/me', () => HttpResponse.json(mockUser)),
  http.get('/api/auth/mfa/status', () => HttpResponse.json({ enabled: false })),
  http.get('/api/auth/profile/email/change-status', () => HttpResponse.json({
    pendingChange: true,
    oldEmail: 'old@example.com',
    newEmail: 'new@example.com',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    canRevert: true
  }))
]

function AppDecorator(Story, context) {
  if (typeof window !== 'undefined' && context.parameters?.seedAuth) {
    const expiresAt = Date.now() + 86400000
    try {
      localStorage.setItem('auth__currentUser', JSON.stringify({ user: mockUser, expiresAt }))
      sessionStorage.setItem('auth__sessionUser', JSON.stringify({ user: mockUser, expiresAt }))
    } catch (_) { /* ignore */ }
  }
  return React.createElement(
    MemoryRouter,
    { initialEntries: ['/owner'] },
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(AntdApp, null, React.createElement(Story))
    )
  )
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [AppDecorator],
  loaders: [mswLoader],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      test: "todo"
    },
    msw: {
      handlers: { wizard: wizardHandlers }
    }
  },
};

export default preview;
