import 'package:flutter/material.dart';
import 'package:app/domain/entities/user_role.dart';
import 'package:app/domain/entities/menu_item.dart';
import 'package:app/presentation/widgets/role_based_drawer.dart';
import 'package:app/presentation/navigation/role_menu_config.dart';
import 'package:app/presentation/screens/profile.dart';
import '../inspector/violations_log_screen.dart';
import '../inspector/inspector_dashboard.dart';
import '../inspector/assigned_inspections_screen.dart';
import '../inspector/pending_violations_screen.dart';
import '../inspector/recent_activity_screen.dart';
import '../inspector/conduct_inspection_screen.dart';
import '../inspector/upload_inspection_report_screen.dart';
import '../inspector/inspection_history_screen.dart';
import '../inspector/violation_status_tracking_screen.dart';
import '../inspector/submitted_reports_screen.dart';
import '../inspector/photo_evidence_uploads_screen.dart';
import '../inspector/compliance_records_screen.dart';

class MainDashboardScreen extends StatefulWidget {
  final UserRole role;
  final String firstName;
  final String lastName;
  final String email;
  final String phoneNumber;
  final String token;
  final String avatarUrl;

  const MainDashboardScreen({
    super.key,
    required this.role,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phoneNumber,
    required this.token,
    required this.avatarUrl,
  });

  @override
  State<MainDashboardScreen> createState() => _MainDashboardScreenState();
}

class _MainDashboardScreenState extends State<MainDashboardScreen> {
  late AppMenuItem _currentItem;

  @override
  void initState() {
    super.initState();
    // Default to the first item (usually Dashboard)
    final menuSections = RoleMenuConfig.getMenuForRole(widget.role);
    // Flatten the list to find the first item
    final allItems = menuSections.expand((section) => section.items).toList();
    _currentItem = allItems.isNotEmpty
        ? allItems.first
        : const AppMenuItem(title: 'Overview', icon: Icons.dashboard);
  }

  void _onMenuItemSelected(AppMenuItem item) {
    setState(() {
      _currentItem = item;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDashboard = _currentItem.title == 'Overview';

    return PopScope(
      canPop: isDashboard,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        setState(() {
          final menuSections = RoleMenuConfig.getMenuForRole(widget.role);
          final allItems = menuSections.expand((section) => section.items).toList();
          _currentItem = allItems.firstWhere(
            (item) => item.title == 'Overview',
            orElse: () => const AppMenuItem(title: 'Overview', icon: Icons.dashboard),
          );
        });
      },
      child: _buildScreenContent(),
    );
  }

  Widget _buildScreenContent() {
    if (_currentItem.title == 'Profile' || _currentItem.title == 'Settings' || _currentItem.title == 'Profile/Settings') {
      return ProfilePage(
        // role: widget.role, // Removed undefined parameter
        email: widget.email,
        firstName: widget.firstName,
        lastName: widget.lastName,
        phoneNumber: widget.phoneNumber,
        token: widget.token,
        avatarUrl: widget.avatarUrl,
        drawer: RoleBasedDrawer(
          role: widget.role,
          firstName: widget.firstName,
          lastName: widget.lastName,
          email: widget.email,
          avatarUrl: widget.avatarUrl,
          onItemSelected: _onMenuItemSelected,
          selectedItem: _currentItem,
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_currentItem.title),
        centerTitle: true,
      ),
      drawer: RoleBasedDrawer(
        role: widget.role,
        firstName: widget.firstName,
        lastName: widget.lastName,
        email: widget.email,
        avatarUrl: widget.avatarUrl,
        onItemSelected: _onMenuItemSelected,
        selectedItem: _currentItem,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (_currentItem.title) {
      // Dashboard Section
      case 'Overview':
        return InspectorDashboard(
          firstName: widget.firstName,
          lastName: widget.lastName,
          token: widget.token,
        );
      case 'Assigned Inspections':
        return AssignedInspectionsScreen(token: widget.token);
      case 'Pending Violations':
        return PendingViolationsScreen(token: widget.token);
      case 'Recent Activity':
        return RecentActivityScreen(token: widget.token);
      
      // Inspections & Violations Section
      case 'Conduct Inspection':
        return ConductInspectionScreen(token: widget.token);
      case 'Log New Violation':
        return ViolationsLogScreen(token: widget.token);
      case 'Upload Inspection Report':
        return UploadInspectionReportScreen(token: widget.token);
      case 'View Inspection History':
        return InspectionHistoryScreen(token: widget.token);
      case 'Violation Status Tracking':
        return ViolationStatusTrackingScreen(token: widget.token);

      // Reports & Records Section
      case 'Submitted Reports':
        return SubmittedReportsScreen(token: widget.token);
      case 'Photo & Evidence Uploads':
        return PhotoEvidenceUploadsScreen(token: widget.token);
      case 'Compliance Records':
        return ComplianceRecordsScreen(token: widget.token);

      default:
        return InspectorDashboard(
          firstName: widget.firstName,
          lastName: widget.lastName,
          token: widget.token,
        );
    }
  }
}
