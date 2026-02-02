import 'dart:io' as io;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/services/connectivity_service.dart';
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
  late String _avatarUrl;
  late String _firstName;
  late String _lastName;
  String? _dateFromForAssigned;
  String? _dateToForAssigned;
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    _avatarUrl = widget.avatarUrl;
    _firstName = widget.firstName;
    _lastName = widget.lastName;
    _loadCachedAvatar();
    _initConnectivity();
  }

  Future<void> _initConnectivity() async {
    _isOnline = await ConnectivityService.instance.isOnline;
    if (mounted) setState(() {});
    ConnectivityService.instance.isOnlineStream.listen((online) {
      if (mounted) setState(() => _isOnline = online);
    });
  }

  @override
  void didUpdateWidget(InspectorShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.avatarUrl != widget.avatarUrl) {
      _avatarUrl = widget.avatarUrl;
    }
    if (oldWidget.firstName != widget.firstName) _firstName = widget.firstName;
    if (oldWidget.lastName != widget.lastName) _lastName = widget.lastName;
  }

  Future<void> _loadCachedAvatar() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = (prefs.getString('avatar_url_${widget.email.toLowerCase()}') ?? '').trim();
      if (cached.isNotEmpty && mounted) {
        setState(() => _avatarUrl = cached);
      }
    } catch (_) {}
  }

  void _onProfileUpdated({String? avatarUrl, String? firstName, String? lastName}) {
    if (!mounted) return;
    setState(() {
      if (avatarUrl != null) _avatarUrl = avatarUrl;
      if (firstName != null) _firstName = firstName;
      if (lastName != null) _lastName = lastName;
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
          email: widget.email,
          firstName: _firstName,
          lastName: _lastName,
          phoneNumber: widget.phoneNumber,
          token: widget.token,
          avatarUrl: _avatarUrl,
          embeddedInShell: true,
          showDeviceTrust: true,
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
            ),
            onPressed: () async {
              final nav = Navigator.of(context);
              Navigator.pop(context); // Close dialog
              bool preFingerprintEnabled = false;
              String? preFingerprintEmail;
              try {
                final prefs = await SharedPreferences.getInstance();
                final fpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
                if (fpEmail.isNotEmpty) {
                  final s = await MongoDBService.getMfaStatusDetail(email: fpEmail).timeout(const Duration(seconds: 3));
                  preFingerprintEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
                  preFingerprintEmail = preFingerprintEnabled ? fpEmail : null;
                }
              } catch (_) {}
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
                  builder: (_) => LoginScreen(
                    preFingerprintEnabled: preFingerprintEnabled,
                    preFingerprintEmail: preFingerprintEmail,
                  ),
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

  Widget _buildAvatarFallback() {
    return Container(
      width: 56,
      height: 56,
      color: Colors.white.withValues(alpha: 0.2),
      alignment: Alignment.center,
      child: Text(
        _firstName.isNotEmpty
            ? _firstName[0].toUpperCase()
            : widget.email.isNotEmpty
                ? widget.email[0].toUpperCase()
                : 'I',
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  String _resolveAvatarUrl(String url) {
    final u = (url).trim();
    if (u.isEmpty) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) {
      try {
        final uri = Uri.parse(u);
        final host = uri.host.toLowerCase();
        if (host.contains('googleusercontent.com')) {
          final path = uri.path.replaceAll(RegExp(r's\d{2,4}-c'), 's1024-c');
          final query = uri.query.replaceAll(RegExp(r'(?<=^|[&])sz=\d{2,4}'), 'sz=1024');
          return uri.replace(path: path, query: query).toString();
        }
      } catch (_) {}
      return u;
    }
    String base = MongoDBService.baseUrl;
    if (io.Platform.isAndroid && (base.contains('localhost') || base.contains('127.0.0.1'))) {
      base = base.replaceFirst('localhost', '10.0.2.2').replaceFirst('127.0.0.1', '10.0.2.2');
    }
    return '$base$u';
  }

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
            fontSize: 18,
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
                          height: 56,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: _avatarUrl.trim().isNotEmpty
                                ? Image.network(
                                    _resolveAvatarUrl(_avatarUrl),
                                    fit: BoxFit.cover,
                                    width: 56,
                                    height: 56,
                                    errorBuilder: (_, __, ___) => _buildAvatarFallback(),
                                  )
                                : _buildAvatarFallback(),
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
                                  fontSize: 17,
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
                                widget.email,
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
