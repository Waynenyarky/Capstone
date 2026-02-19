# BizClear Color Palette

Unified design system for Web and Mobile apps.

## Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary (Navy)** | `#001529` | Primary buttons, sidebar, headings, links |
| **Primary Light** | `#003A70` | Gradient accent, hover states |
| **Accent** | `#0175C2` | Theme color, CTAs, focused inputs, icons |

## Backgrounds

| Name | Hex | Usage |
|------|-----|-------|
| **Background** | `#FFFFFF` | Page background |
| **Surface** | `#FFFFFF` | Cards, inputs |
| **Surface Light** | `#F5F5F5` | Subtle sections |

## Text

| Name | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#001529` | Headings, body |
| **Text Secondary** | `#666666` | Secondary text, labels |
| **Text Hint** | `#8C8C8C` | Placeholders |

## Borders & Dividers

| Name | Hex | Usage |
|------|-----|-------|
| **Border** | `#E8E8E8` | Input borders, cards |
| **Divider** | `#F0F0F0` | Section dividers |
| **Input Border** | `#D9D9D9` | Default input outline |

## Semantic

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#52C41A` | Success states, MFA enabled |
| **Error** | `#FF4D4F` | Errors, validation |
| **Warning** | `#FAAD14` | Warnings |
| **Info** | `#1890FF` | Info messages |

## Logo Colors (from BizClear.png)

- Blue (buildings, magnifying glass): `#003A70` / `#0175C2`
- Orange (swoosh): `#FF6B35` (approx)
- Green (checkmarks): `#52C41A`
- Grey (checklist): `#8C8C8C`

## Usage

### Web (React/Ant Design)
- Theme: `ThemeProvider` uses `colorPrimary: '#001529'`
- Links: `color: '#001529'`
- Manifest: `theme_color: '#0175C2'`

### Mobile (Flutter)
- Import: `package:app/core/theme/bizclear_colors.dart`
- Use: `BizClearColors.primary`, `BizClearColors.accent`, etc.
