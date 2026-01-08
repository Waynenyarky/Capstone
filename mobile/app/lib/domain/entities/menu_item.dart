import 'package:flutter/material.dart';

class AppMenuItem {
  final String title;
  final IconData icon;
  final String routeName; // For future navigation
  final bool isHeader; // To group items if needed

  const AppMenuItem({
    required this.title,
    required this.icon,
    this.routeName = '',
    this.isHeader = false,
  });
}
