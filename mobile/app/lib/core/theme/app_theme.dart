import 'package:flutter/material.dart';

/// Global design tokens for typography and component sizes (Ant Design–style).
/// Change sizes here to affect the whole app.
class AppTheme {
  AppTheme._();

  /// Single font for the app. Use this so buttons and text never fall back to platform font.
  static const String appFontFamily = 'Urbanist';

  // ─── Size mode: scale factor applied to typography and components (1.0 = default, 0.95 = slightly compact, 0.9 = compact)
  static const double sizeScale = 1;

  // ─── Typography scale (font sizes, one place to edit)
  static const double _displaySize = 22.0;
  static const double _title1Size = 20.0;
  static const double _title2Size = 18.0;
  static const double _title3Size = 16.0;
  static const double _title4Size = 15.0;
  static const double _title5Size = 14.0;
  static const double _bodySize = 14.0;
  static const double _bodySmallSize = 13.0;
  static const double _captionSize = 12.0;
  static const double _buttonLabelSize = 14.0;

  /// Scaled value: [base] * [sizeScale].
  static double scale(double base) => base * sizeScale;

  // ─── Button tokens (single source for padding, min height, label style)
  static const EdgeInsets primaryButtonPadding = EdgeInsets.symmetric(horizontal: 14, vertical: 8);
  static const Size primaryButtonMinimumSize = Size(0, 42);
  static const EdgeInsets textButtonPadding = EdgeInsets.symmetric(horizontal: 12, vertical: 6);
  static const Size textButtonMinimumSize = Size(0, 32);
  static const EdgeInsets outlinedButtonPadding = EdgeInsets.symmetric(horizontal: 14, vertical: 8);
  static const Size outlinedButtonMinimumSize = Size(0, 42);

  // ─── Input field tokens (same height as primary buttons: 42)
  /// Minimum height for text fields. Matches [primaryButtonMinimumSize].height.
  static const double inputFieldMinHeight = 42;
  /// Content padding for inputs so total height matches primary buttons (42px). Vertical 13 + ~16 line height + 13 ≈ 42.
  static const EdgeInsets inputFieldContentPadding = EdgeInsets.symmetric(horizontal: 16, vertical: 13);

  /// Primary button label style (used by Elevated/Filled buttons).
  /// Uses [appFontFamily] when [fontFamily] is null so buttons always match app font.
  static TextStyle primaryButtonTextStyle(String? fontFamily) => TextStyle(
        fontFamily: fontFamily ?? appFontFamily,
        fontSize: scale(_buttonLabelSize),
        fontWeight: FontWeight.w600,
      );

  /// Convenience getter for primary button label (Urbanist, scaled size). Use for styleFrom(textStyle: ...).
  static TextStyle get primaryButtonLabelStyle => primaryButtonTextStyle(null);

  /// Font size for primary button label (scaled). Use with GoogleFonts.urbanist() for correct font resolution.
  static double get primaryButtonFontSize => scale(_buttonLabelSize);

  /// Text theme built from the typography scale. Pass [fontFamily] (e.g. Urbanist).
  static TextTheme buildTextTheme(String? fontFamily, Color primaryColor, Color bodyColor) {
    final family = fontFamily ?? appFontFamily;
    TextStyle style(double size, [FontWeight w = FontWeight.normal]) => TextStyle(
          fontFamily: family,
          fontSize: scale(size),
          fontWeight: w,
          color: bodyColor,
        );
    return TextTheme(
      displayLarge: style(_displaySize, FontWeight.w600).copyWith(color: primaryColor),
      displayMedium: style(_displaySize - 1, FontWeight.w600).copyWith(color: primaryColor),
      displaySmall: style(_displaySize - 2, FontWeight.w600).copyWith(color: primaryColor),
      headlineLarge: style(_title1Size, FontWeight.w600).copyWith(color: primaryColor),
      headlineMedium: style(_title2Size, FontWeight.w600).copyWith(color: primaryColor),
      headlineSmall: style(_title3Size, FontWeight.w600).copyWith(color: primaryColor),
      titleLarge: style(_title3Size, FontWeight.w600),
      titleMedium: style(_title4Size, FontWeight.w600),
      titleSmall: style(_title5Size, FontWeight.w600),
      bodyLarge: style(_bodySize),
      bodyMedium: style(_bodySize),
      bodySmall: style(_bodySmallSize),
      labelLarge: style(_bodySize, FontWeight.w500),
      labelMedium: style(_bodySmallSize, FontWeight.w500),
      labelSmall: style(_captionSize, FontWeight.w500),
    );
  }

  /// Typography levels (Ant Design–style names). Use from context via [AppThemeTypography.of].
  static AppThemeTypography typography(String? fontFamily, Color bodyColor) {
    return AppThemeTypography(fontFamily: fontFamily, bodyColor: bodyColor);
  }
}

/// Typography levels: title 1–5, body, caption, button. Access via [AppThemeTypography.of].
class AppThemeTypography {
  const AppThemeTypography({this.fontFamily, this.bodyColor = const Color(0xFF001529)});

  final String? fontFamily;
  final Color bodyColor;

  double _s(double base) => AppTheme.scale(base);
  String get _family => fontFamily ?? AppTheme.appFontFamily;

  TextStyle get display => TextStyle(fontFamily: _family, fontSize: _s(22), fontWeight: FontWeight.w600, color: bodyColor);
  TextStyle get title1 => TextStyle(fontFamily: _family, fontSize: _s(20), fontWeight: FontWeight.w600, color: bodyColor);
  TextStyle get title2 => TextStyle(fontFamily: _family, fontSize: _s(18), fontWeight: FontWeight.w600, color: bodyColor);
  TextStyle get title3 => TextStyle(fontFamily: _family, fontSize: _s(16), fontWeight: FontWeight.w600, color: bodyColor);
  TextStyle get title4 => TextStyle(fontFamily: _family, fontSize: _s(15), fontWeight: FontWeight.w600, color: bodyColor);
  TextStyle get title5 => TextStyle(fontFamily: _family, fontSize: _s(14), fontWeight: FontWeight.w600, color: bodyColor);
  TextStyle get body => TextStyle(fontFamily: _family, fontSize: _s(14), color: bodyColor);
  TextStyle get bodySmall => TextStyle(fontFamily: _family, fontSize: _s(13), color: bodyColor);
  TextStyle get caption => TextStyle(fontFamily: _family, fontSize: _s(12), color: bodyColor);
  TextStyle get buttonLabel => TextStyle(fontFamily: _family, fontSize: _s(14), fontWeight: FontWeight.w600, color: bodyColor);

  /// From BuildContext: typography using theme font and color.
  static AppThemeTypography of(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final color = textTheme.bodyLarge?.color ?? const Color(0xFF001529);
    final family = theme.textTheme.bodyLarge?.fontFamily ?? AppTheme.appFontFamily;
    return AppThemeTypography(fontFamily: family, bodyColor: color);
  }
}
