# Phase 7: Mobile App — Mock Data Removal & Completion

## Overview
Replace all mock data fallbacks in inspector screens with proper empty/error states, fix the ThemeSettingsScreen placeholder, and verify all flows end-to-end with real API data.

## Prerequisites
Phase 4C (backend infrastructure), Phase 4D (notifications) should be complete so all APIs return real data.

---

## 7-1. Delete Mock Data File

**File to delete:** `mobile/app/lib/data/mock/inspector_mock_data.dart`

This file provides static mock data used as fallback in 7 inspector screens. After removing fallbacks from those screens, this file can be safely deleted.

---

## 7-2. Fix Each Inspector Screen

For each screen, the pattern is the same:
- **Remove** the import of `InspectorMockData`
- **Replace** mock fallback with proper empty state UI
- **Keep** real API calls
- **Add** proper error handling with retry button

### Screen 1: InspectorDashboardScreen
**File:** `mobile/app/lib/presentation/screens/inspector/inspector_dashboard_screen.dart`

**Current behavior:** When API counts are 0 or API fails, falls back to `InspectorMockData.getCounts()` which shows `today: 3, pending: 4, completed: 3`.

**Changes:**
- Remove `import` of `InspectorMockData`
- When counts are 0: show `0` values (real data, not fallback)
- When API fails: show an error card with "Could not load dashboard data" and a "Retry" button
- Empty state: "No inspections assigned yet"

### Screen 2: AssignedInspectionsScreen
**File:** `mobile/app/lib/presentation/screens/inspector/assigned_inspections_screen.dart`

**Current behavior:** Falls back to `InspectorMockData.getInspections()` when list is empty or API fails.

**Changes:**
- Remove mock import
- Empty list: Show centered illustration/icon + "No assigned inspections" text
- API error: Show error message with retry button
- Do NOT populate with fake data

### Screen 3: ScheduleScreen
**File:** `mobile/app/lib/presentation/screens/inspector/schedule_screen.dart`

**Current behavior:** Falls back to mock inspections when empty/error.

**Changes:**
- Remove mock import
- Empty calendar: Show "No scheduled inspections for this period"
- API error: Show inline error with retry
- Keep calendar bounds as-is (2020-2030 is reasonable)

### Screen 4: ViolationsScreen
**File:** `mobile/app/lib/presentation/screens/inspector/violations_screen.dart`

**Current behavior:** Falls back to `InspectorMockData.getViolations()`.

**Changes:**
- Remove mock import
- Empty list: "No violations recorded"
- API error: Error with retry

### Screen 5: NotificationsScreen
**File:** `mobile/app/lib/presentation/screens/inspector/notifications_screen.dart`

**Current behavior:** Falls back to `InspectorMockData.getNotifications()`.

**Changes:**
- Remove mock import
- Empty list: "No notifications" with bell icon
- API error: Error with retry

### Screen 6: InspectionHistoryScreen
**File:** `mobile/app/lib/presentation/screens/inspector/inspection_history_screen.dart`

**Current behavior:** Falls back to mock completed inspections.

**Changes:**
- Remove mock import
- Empty list: "No completed inspections yet"
- API error: Error with retry

### Screen 7: InspectionDetailScreen
**File:** `mobile/app/lib/presentation/screens/inspector/inspection_detail_screen.dart`

**Current behavior:** When `inspectionId.startsWith('mock-')`, loads mock data directly instead of calling API.

**Changes:**
- Remove mock import
- Remove the `if (inspectionId.startsWith('mock-'))` branch entirely
- Always fetch from API
- If inspection not found (404): Show "Inspection not found" with back button
- API error: Error with retry

---

## 7-3. Empty State Widget Pattern

Create a reusable empty state widget to use across all screens:

**New file:** `mobile/app/lib/presentation/widgets/empty_state_widget.dart`

```dart
import 'package:flutter/material.dart';

class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onRetry;

  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text(title, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle!, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline), textAlign: TextAlign.center),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

### Error State Widget

**New file:** `mobile/app/lib/presentation/widgets/error_state_widget.dart`

```dart
import 'package:flutter/material.dart';

class ErrorStateWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorStateWidget({
    super.key,
    this.message = 'Something went wrong',
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text(message, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 7-4. Fix ThemeSettingsScreen

**File:** `mobile/app/lib/presentation/screens/theme_settings_screen.dart`

### Current state:
Static placeholder text: "Theme presets and primary color picker coming soon."

### Target:
Implement real theme selection matching the web app's theme options:
1. **Theme Preset Selector**: Radio tiles or cards for: Default, Dark, Document, Blossom, Sunset, Royal
2. **Save Selection**: Persist to `shared_preferences` with key `theme_preset`
3. **Apply on Selection**: Use a `ChangeNotifier` or `ValueNotifier` in the app's root to reactively update `ThemeData`

### Theme definitions:
```dart
enum AppThemePreset {
  defaultLight,
  dark,
  document,
  blossom,
  sunset,
  royal,
}

// Each preset maps to:
// - primaryColor (Color)
// - brightness (Brightness.light or Brightness.dark)
// - Optional seedColor for Material 3 color scheme
```

### Implementation approach:
1. Read current preset from shared_preferences on app start
2. Show a list of theme cards with a preview swatch
3. On tap, save to shared_preferences and notify theme listener
4. The app root's `MaterialApp` theme parameter reads from the listener

---

## 7-5. Remove `mongo_dart` Dependency (if not already done in Phase 0)

**File:** `mobile/app/pubspec.yaml`

If `mongo_dart` is still listed, remove it and run `flutter pub get`.

---

## Edge Cases
- Screens that currently show mock data when API returns empty need to distinguish between "no data" (show empty state) and "API error" (show error with retry)
- `InspectionDetailScreen` must handle IDs that were previously prefixed with `mock-` — the router should never navigate with such IDs anymore
- Verify `MongoDBService` endpoints return proper error responses (not just empty lists) so error states trigger correctly

## Acceptance Criteria
1. `inspector_mock_data.dart` is deleted
2. All 7 inspector screens show proper empty states when no data exists
3. All 7 inspector screens show error state with retry when API fails
4. No screen displays mock/static data
5. `ThemeSettingsScreen` allows selecting and persisting a theme
6. Selected theme is applied app-wide
7. `flutter analyze` passes with no errors
8. `flutter build apk --debug` succeeds

## Rollback Plan
Restore `inspector_mock_data.dart` and revert screen changes. Theme feature is additive and can be reverted independently.
