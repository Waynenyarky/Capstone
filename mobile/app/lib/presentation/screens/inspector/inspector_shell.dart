import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/services/connectivity_service.dart';
import 'package:app/data/local/inspection_local_store.dart';
import '../login_page.dart';
import '../profile.dart';
import 'package:app/data/services/google_auth_service.dart';
import 'inspector_dashboard_screen.dart';
import 'assigned_inspections_screen.dart';
import 'schedule_screen.dart';
import 'inspection_history_screen.dart';
import 'violations_screen.dart';
import 'notifications_screen.dart';

enum InspectorNavItem {
  dashboard,
  mySchedule,
  assignedInspections,
  inspectionHistory,
  violations,
  notifications,
  profile,
  logout,
}

class InspectorShell extends StatefulWidget {
  final String email;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;

  const InspectorShell({
    super.key,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.token,
    this.avatarUrl = '',
  });

  @override
  State<InspectorShell> createState() => _InspectorShellState();
}

class _InspectorShellState extends State<InspectorShell> {
  InspectorNavItem _selected = InspectorNavItem.dashboard;
  late String _firstName;
  late String _lastName;
  late String _email;
  String? _dateFromForAssigned;
  String? _dateToForAssigned;
  bool _isOnline = true;
  bool _syncing = false;
  StreamSubscription<bool>? _connectivitySub;

  @override
  void initState() {
    super.initState();
    _firstName = widget.firstName;
    _lastName = widget.lastName;
    _email = widget.email;
    _initConnectivity();
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  Future<void> _initConnectivity() async {
    _isOnline = await ConnectivityService.instance.isOnline;
    if (mounted) setState(() {});
    _connectivitySub = ConnectivityService.instance.isOnlineStream.listen((online) {
      if (mounted) setState(() => _isOnline = online);
      if (online && !_syncing) _syncPendingItems();
    });
    if (_isOnline) _syncPendingItems();
  }

  Future<void> _syncPendingItems() async {
    if (_syncing) return;
    _syncing = true;
    try {
      final pending = await InspectionLocalStore.getPendingSync();
      if (pending.isEmpty) return;
      for (final item in pending) {
        final opType = item['op_type'] as String;
        final inspectionId = item['inspection_id'] as String;
        final payload = item['payload'] as Map<String, dynamic>;
        final itemId = item['id'] as int;

        Map<String, dynamic> res;
        if (opType == 'checklist') {
          final checklistData = (payload['checklist'] as List<dynamic>)
              .map((e) => e is Map<String, dynamic> ? e : Map<String, dynamic>.from(e as Map))
              .toList();
          res = await MongoDBService.updateChecklist(inspectionId, checklistData);
        } else if (opType == 'submit') {
          final serverInspection = await MongoDBService.getInspectionDetail(inspectionId);
          if (serverInspection['success'] == true) {
            final serverData = serverInspection['inspection'] as Map<String, dynamic>?;
            final serverUpdated = serverData?['updatedAt'] as String? ?? '';
            final cached = await InspectionLocalStore.getCachedInspection(inspectionId);
            final cachedUpdated = cached?['updatedAt'] as String? ?? '';
            if (serverUpdated.isNotEmpty && cachedUpdated.isNotEmpty && serverUpdated != cachedUpdated) {
              debugPrint('[Sync] Conflict detected for $inspectionId — server version is newer, skipping local submission');
              await InspectionLocalStore.removePendingSync(itemId);
              continue;
            }
          }
          res = await MongoDBService.submitInspection(
            inspectionId,
            payload['overallResult'] as String,
            inspectorSignature: payload['inspectorSignature'] as Map<String, dynamic>?,
          );
        } else {
          continue;
        }

        if (res['success'] == true) {
          await InspectionLocalStore.removePendingSync(itemId);
        }
      }
    } catch (e) {
      debugPrint('[Sync] Error syncing pending items: $e');
    } finally {
      _syncing = false;
    }
  }

  @override
  void didUpdateWidget(InspectorShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.firstName != widget.firstName) _firstName = widget.firstName;
    if (oldWidget.lastName != widget.lastName) _lastName = widget.lastName;
    if (oldWidget.email != widget.email) _email = widget.email;
  }

  void _onProfileUpdated({String? avatarUrl, String? firstName, String? lastName, String? email}) {
    if (!mounted) return;
    setState(() {
      if (firstName != null) _firstName = firstName;
      if (lastName != null) _lastName = lastName;
      if (email != null) _email = email;
    });
  }

  String _getTitle() {
    switch (_selected) {
      case InspectorNavItem.dashboard:
        return 'Dashboard';
      case InspectorNavItem.mySchedule:
        return 'My Schedule';
      case InspectorNavItem.assignedInspections:
        return 'Assigned Inspections';
      case InspectorNavItem.inspectionHistory:
        return 'Inspection History';
      case InspectorNavItem.violations:
        return 'Violations';
      case InspectorNavItem.notifications:
        return 'Notifications';
      case InspectorNavItem.profile:
        return 'Profile';
      case InspectorNavItem.logout:
        return 'Dashboard';
    }
  }

  void _onScheduleDaySelected(DateTime? dateFrom, DateTime? dateTo) {
    if (dateFrom == null) return;
    setState(() {
      _dateFromForAssigned = '${dateFrom.year}-${dateFrom.month.toString().padLeft(2, '0')}-${dateFrom.day.toString().padLeft(2, '0')}';
      _dateToForAssigned = dateTo != null
          ? '${dateTo.year}-${dateTo.month.toString().padLeft(2, '0')}-${dateTo.day.toString().padLeft(2, '0')}'
          : _dateFromForAssigned;
      _selected = InspectorNavItem.assignedInspections;
    });
  }

  Widget _buildBody() {
    switch (_selected) {
      case InspectorNavItem.dashboard:
        return InspectorDashboardScreen(
          onNavigate: (item) => _onNavTap(item, closeDrawer: false),
        );
      case InspectorNavItem.mySchedule:
        return ScheduleScreen(onDaySelected: _onScheduleDaySelected);
      case InspectorNavItem.assignedInspections:
        return AssignedInspectionsScreen(
          initialDateFrom: _dateFromForAssigned,
          initialDateTo: _dateToForAssigned,
          onClearDateFilter: () => setState(() {
            _dateFromForAssigned = null;
            _dateToForAssigned = null;
          }),
        );
      case InspectorNavItem.inspectionHistory:
        return const InspectionHistoryScreen();
      case InspectorNavItem.violations:
        return const ViolationsScreen();
      case InspectorNavItem.notifications:
        return const NotificationsScreen();
      case InspectorNavItem.profile:
        return ProfilePage(
          email: _email,
          firstName: _firstName,
          lastName: _lastName,
          phoneNumber: widget.phoneNumber,
          token: widget.token,
          avatarUrl: widget.avatarUrl,
          embeddedInShell: true,
          canEditProfile: false,
          onProfileUpdated: _onProfileUpdated,
        );
      case InspectorNavItem.logout:
        return InspectorDashboardScreen(
          onNavigate: (item) => _onNavTap(item, closeDrawer: false),
        );
    }
  }

  void _onNavTap(InspectorNavItem item, {bool closeDrawer = true}) {
    if (closeDrawer) Navigator.pop(context); // Close drawer when opened from drawer
    if (item == InspectorNavItem.logout) {
      _logout();
      return;
    }
    setState(() => _selected = item);
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout, color: Colors.black87),
            SizedBox(width: 8),
            Text('Logout'),
          ],
        ),
        content: const Text(
          'Are you sure you want to logout?',
          style: TextStyle(fontSize: 15, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: BizClearColors.primaryButtonPadding,
              minimumSize: BizClearColors.primaryButtonMinimumSize,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: BizClearColors.primaryButtonTextStyle,
            ),
            onPressed: () async {
              final nav = Navigator.of(context);
              Navigator.pop(context); // Close dialog
              try {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('loggedInEmail');
                await prefs.remove('accessToken');
                await prefs.setBool('disableAutoAuthenticatorOnce', true);
              } catch (_) {}
              GoogleAuthService.signOutAndReset();
              if (!mounted) return;
              nav.pushAndRemoveUntil(
                MaterialPageRoute(
                  builder: (_) => const LoginScreen(),
                ),
                (route) => false,
              );
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  static const Color _primaryColor = Color(0xFF003A70);
  static const Color _primaryLight = Color(0xFFE8EEF4);

  Widget _buildDrawerItem({
    required IconData icon,
    required IconData iconSelected,
    required String title,
    required InspectorNavItem item,
    bool isDestructive = false,
  }) {
    final isSelected = _selected == item;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _onNavTap(item, closeDrawer: true),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected && !isDestructive ? _primaryLight : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: isSelected && !isDestructive
                ? Border.all(color: _primaryColor.withValues(alpha: 0.2), width: 1)
                : null,
          ),
          child: Row(
            children: [
              Icon(
                isSelected && !isDestructive ? iconSelected : icon,
                size: 22,
                color: isDestructive
                    ? const Color(0xFFB91C1C)
                    : (isSelected ? _primaryColor : const Color(0xFF64748B)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isDestructive
                        ? const Color(0xFFB91C1C)
                        : (isSelected ? _primaryColor : const Color(0xFF334155)),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text(
          _getTitle(),
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontWeight: FontWeight.w600,
            fontSize: 16,
            letterSpacing: 0.3,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF334155), size: 24),
        scrolledUnderElevation: 1,
      ),
      drawer: Drawer(
        width: MediaQuery.of(context).size.width * 0.82,
        backgroundColor: Colors.white,
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF003A70),
                      Color(0xFF004C8C),
                    ],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.2),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            _firstName.isNotEmpty
                                ? _firstName[0].toUpperCase()
                                : _email.isNotEmpty
                                    ? _email[0].toUpperCase()
                                    : 'I',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$_firstName $_lastName'.trim().isEmpty
                                    ? 'Inspector'
                                    : '$_firstName $_lastName',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                  letterSpacing: 0.3,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Field Inspector',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _email,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.white.withValues(alpha: 0.7),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Navigation
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 0),
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Text(
                        'MAIN',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade600,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    _buildDrawerItem(
                      icon: Icons.dashboard_outlined,
                      iconSelected: Icons.dashboard,
                      title: 'Dashboard',
                      item: InspectorNavItem.dashboard,
                    ),
                    _buildDrawerItem(
                      icon: Icons.calendar_month_outlined,
                      iconSelected: Icons.calendar_month,
                      title: 'My Schedule',
                      item: InspectorNavItem.mySchedule,
                    ),
                    _buildDrawerItem(
                      icon: Icons.assignment_outlined,
                      iconSelected: Icons.assignment,
                      title: 'Assigned Inspections',
                      item: InspectorNavItem.assignedInspections,
                    ),
                    _buildDrawerItem(
                      icon: Icons.history_outlined,
                      iconSelected: Icons.history,
                      title: 'Inspection History',
                      item: InspectorNavItem.inspectionHistory,
                    ),
                    _buildDrawerItem(
                      icon: Icons.warning_amber_outlined,
                      iconSelected: Icons.warning_amber,
                      title: 'Violations',
                      item: InspectorNavItem.violations,
                    ),
                    _buildDrawerItem(
                      icon: Icons.notifications_outlined,
                      iconSelected: Icons.notifications,
                      title: 'Notifications',
                      item: InspectorNavItem.notifications,
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Text(
                        'ACCOUNT',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade600,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    _buildDrawerItem(
                      icon: Icons.person_outline,
                      iconSelected: Icons.person,
                      title: 'Profile',
                      item: InspectorNavItem.profile,
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                    ),
                    _buildDrawerItem(
                      icon: Icons.logout,
                      iconSelected: Icons.logout,
                      title: 'Logout',
                      item: InspectorNavItem.logout,
                      isDestructive: true,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          if (!_isOnline)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              color: Colors.amber.shade200,
              child: Row(
                children: [
                  Icon(Icons.cloud_off, size: 20, color: Colors.amber.shade900),
                  const SizedBox(width: 8),
                  Text(
                    'Offline - changes will sync when online',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.amber.shade900,
                    ),
                  ),
                ],
              ),
            ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }
}
