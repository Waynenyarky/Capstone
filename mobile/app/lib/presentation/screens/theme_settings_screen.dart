import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';

/// Placeholder for theme/appearance settings to align with web staff settings (Theme tab).
/// Web offers theme presets (Default, Dark, Document, Blossom, Sunset, Royal) and primary color.
class ThemeSettingsScreen extends StatelessWidget {
  const ThemeSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BizClearColors.surfaceLight,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          'Theme',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Appearance',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'On the website, staff can choose a theme (Default, Dark, Document, Blossom, Sunset, Royal) and a primary color. Theme options for the mobile app will match in a future update.',
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey.shade600,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Icon(Icons.palette_outlined, color: BizClearColors.webPrimaryTintIcon, size: 28),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          'Theme presets and primary color picker coming soon.',
                          style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
