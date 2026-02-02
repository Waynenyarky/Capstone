import 'package:flutter/material.dart';

/// BizClear brand color palette.
/// Matches web app ThemeProvider and design system.
class BizClearColors {
  BizClearColors._();

  // ─── Primary ─────────────────────────────────────────────────────────────
  /// Navy - primary brand color (web default theme)
  static const Color primary = Color(0xFF001529);

  /// Lighter navy - gradient accent, headings
  static const Color primaryLight = Color(0xFF003A70);

  /// Accent blue - theme_color, links, CTAs
  static const Color accent = Color(0xFF0175C2);

  // ─── Backgrounds ──────────────────────────────────────────────────────────
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF5F5F5);

  // ─── Text ─────────────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF001529);
  static const Color textSecondary = Color(0xFF666666);
  static const Color textHint = Color(0xFF8C8C8C);

  // ─── Borders & Dividers ───────────────────────────────────────────────────
  static const Color border = Color(0xFFE8E8E8);
  static const Color divider = Color(0xFFF0F0F0);

  // ─── Semantic ────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF52C41A);
  static const Color error = Color(0xFFFF4D4F);
  static const Color warning = Color(0xFFFAAD14);
  static const Color info = Color(0xFF1890FF);

  // ─── Login / Auth specific ────────────────────────────────────────────────
  static const Color inputBorder = Color(0xFFD9D9D9);
  static const Color inputFocusedBorder = accent;
  static const Color buttonPrimaryBg = primary;
  static const Color buttonPrimaryFg = Colors.white;
  static const Color linkColor = primary;
  static const Color iconTint = accent;
}
