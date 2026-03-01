import 'package:flutter/material.dart';
import 'package:app/core/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';

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

  /// Web app primary (buttons) - BRAND_COLORS.blue from ThemeProvider
  static const Color webPrimary = Color(0xFF0038A8);

  /// Light tint for info boxes, selected state (replaces Colors.blue.shade50)
  static const Color webPrimaryTintLight = Color(0xFFE8EEFA);
  /// Border for info boxes (replaces Colors.blue.shade100/200)
  static const Color webPrimaryTintBorder = Color(0xFFB8CCF0);
  /// Icon/text on primary tint (replaces Colors.blue.shade700/800)
  static const Color webPrimaryTintIcon = Color(0xFF0038A8);
  /// Darker text on primary tint (replaces Colors.blue.shade900)
  static const Color webPrimaryTintText = Color(0xFF002966);

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
  static const Color inputFocusedBorder = webPrimary;
  static const Color buttonPrimaryBg = webPrimary;
  static const Color buttonPrimaryFg = Colors.white;
  static const Color linkColor = webPrimary;
  static const Color iconTint = webPrimary;

  /// Compact primary button dimensions (use in ElevatedButton.styleFrom / FilledButton.styleFrom).
  /// Sourced from [AppTheme] for single place to change sizes.
  static EdgeInsets get primaryButtonPadding => AppTheme.primaryButtonPadding;
  static Size get primaryButtonMinimumSize => AppTheme.primaryButtonMinimumSize;
  /// Input field padding (same height as primary buttons). Sourced from [AppTheme].
  static EdgeInsets get inputFieldContentPadding => AppTheme.inputFieldContentPadding;
  /// Default text style for primary buttons (Urbanist, scaled). Use in styleFrom(textStyle: ...).
  /// Uses [GoogleFonts.urbanist] so the font resolves correctly; plain TextStyle(fontFamily: 'Urbanist') can fall back to platform font on buttons.
  static TextStyle get primaryButtonTextStyle => GoogleFonts.urbanist(
        fontSize: AppTheme.primaryButtonFontSize,
        fontWeight: FontWeight.w600,
      );
}
