import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/shared/theme/ThemeProvider.jsx'

/**
 * Render helper that mirrors the production provider stack but uses MemoryRouter
 * so we can control navigation in tests.
 */
export function renderWithProviders(
  ui,
  { route = '/', initialEntries = [route], routerProps = {}, ...options } = {}
) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries} {...routerProps}>
      <ThemeProvider>
        <AntdApp>{children}</AntdApp>
      </ThemeProvider>
    </MemoryRouter>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'
