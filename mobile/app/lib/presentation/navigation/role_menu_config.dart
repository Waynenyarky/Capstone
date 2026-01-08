import 'package:flutter/material.dart';
import 'package:app/domain/entities/user_role.dart';
import 'package:app/domain/entities/menu_item.dart';

class RoleMenuConfig {
  static List<AppMenuItem> getMenuForRole(UserRole role) {
    switch (role) {
      case UserRole.businessOwner:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'Permit Applications', icon: Icons.assignment),
          const AppMenuItem(title: 'Cessation', icon: Icons.cancel_presentation),
          const AppMenuItem(title: 'Payments', icon: Icons.payment),
          const AppMenuItem(title: 'Appeals', icon: Icons.gavel),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
      case UserRole.lguOfficer:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'Permit Applications (Review)', icon: Icons.rate_review),
          const AppMenuItem(title: 'Cessation (Review)', icon: Icons.free_cancellation),
          const AppMenuItem(title: 'Violations/Inspections', icon: Icons.warning_amber),
          const AppMenuItem(title: 'Appeals', icon: Icons.gavel),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
      case UserRole.lguManager:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'Reports/Analytics', icon: Icons.analytics),
          const AppMenuItem(title: 'Permit Applications (Overview)', icon: Icons.summarize),
          const AppMenuItem(title: 'Cessation (Overview)', icon: Icons.assignment_turned_in),
          const AppMenuItem(title: 'Violations/Inspections (Overview)', icon: Icons.report_problem),
          const AppMenuItem(title: 'Appeals (Overview)', icon: Icons.gavel),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
      case UserRole.inspector:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'Violations/Inspections (Log/Upload)', icon: Icons.camera_alt),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
      case UserRole.admin:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'User Management', icon: Icons.people),
          const AppMenuItem(title: 'Permit Applications', icon: Icons.assignment),
          const AppMenuItem(title: 'Cessation', icon: Icons.cancel_presentation),
          const AppMenuItem(title: 'Payments', icon: Icons.payment),
          const AppMenuItem(title: 'Violations/Inspections', icon: Icons.warning_amber),
          const AppMenuItem(title: 'Appeals', icon: Icons.gavel),
          const AppMenuItem(title: 'Reports/Analytics', icon: Icons.analytics),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
      case UserRole.cso:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'Customer Support / Inquiry', icon: Icons.support_agent),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
      default:
        return [
          const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
          const AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ];
    }
  }
}
