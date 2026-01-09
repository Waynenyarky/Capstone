import 'package:flutter/material.dart';
import 'package:app/domain/entities/user_role.dart';
import 'package:app/domain/entities/menu_item.dart';

class RoleMenuConfig {
  static List<MenuSection> getMenuForRole(UserRole role) {
    // Always return Inspector menu since that's the only supported role
    return [
      const MenuSection(
        title: 'Dashboard',
        items: [
          AppMenuItem(title: 'Overview', icon: Icons.dashboard),
          AppMenuItem(title: 'Assigned Inspections', icon: Icons.assignment_ind),
          AppMenuItem(title: 'Pending Violations', icon: Icons.warning_amber),
          AppMenuItem(title: 'Recent Activity', icon: Icons.history),
        ],
      ),
      const MenuSection(
        title: 'Inspections & Violations',
        items: [
          AppMenuItem(title: 'Conduct Inspection', icon: Icons.playlist_add_check),
          AppMenuItem(title: 'Log New Violation', icon: Icons.note_add),
          AppMenuItem(title: 'Upload Inspection Report', icon: Icons.upload_file),
          AppMenuItem(title: 'View Inspection History', icon: Icons.history_edu),
          AppMenuItem(title: 'Violation Status Tracking', icon: Icons.track_changes),
        ],
      ),
      const MenuSection(
        title: 'Reports & Records',
        items: [
          AppMenuItem(title: 'Submitted Reports', icon: Icons.summarize),
          AppMenuItem(title: 'Photo & Evidence Uploads', icon: Icons.photo_library),
          AppMenuItem(title: 'Compliance Records', icon: Icons.folder_shared),
        ],
      ),
      const MenuSection(
        title: 'Settings',
        items: [
          AppMenuItem(title: 'Profile/Settings', icon: Icons.settings),
        ],
      ),
    ];
  }
}
