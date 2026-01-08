import 'package:flutter/material.dart';
import 'package:app/domain/entities/user_role.dart';
import 'package:app/domain/entities/menu_item.dart';
import 'package:app/presentation/widgets/role_based_drawer.dart';
import 'package:app/presentation/navigation/role_menu_config.dart';
import 'package:app/presentation/screens/profile.dart';
import '../business/permit_applications_screen.dart';
import '../business/cessation_screen.dart';
import '../business/payments_screen.dart';
import '../business/appeals_screen.dart';

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
    final menuItems = RoleMenuConfig.getMenuForRole(widget.role);
    _currentItem = menuItems.isNotEmpty
        ? menuItems.first
        : const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard);
  }

  void _onMenuItemSelected(AppMenuItem item) {
    setState(() {
      _currentItem = item;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDashboard = _currentItem.title == 'Dashboard';

    return PopScope(
      canPop: isDashboard,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        setState(() {
          final menuItems = RoleMenuConfig.getMenuForRole(widget.role);
          _currentItem = menuItems.firstWhere(
            (item) => item.title == 'Dashboard',
            orElse: () => const AppMenuItem(title: 'Dashboard', icon: Icons.dashboard),
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
      case 'Permit Applications':
        return const PermitApplicationsScreen();
      case 'Cessation':
        return const CessationScreen();
      case 'Payments':
        return const PaymentsScreen();
      case 'Appeals':
        return const AppealsScreen();
      case 'Dashboard':
      default:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back, ${widget.firstName}!',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Role: ${getRoleDisplayName(widget.role)}',
                style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 32),
              _buildDashboardCard(
                title: 'Quick Actions',
                icon: Icons.flash_on,
                content: 'Access your most used features here.',
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                title: 'Notifications',
                icon: Icons.notifications,
                content: 'You have no new notifications.',
              ),
            ],
          ),
        );
    }
  }

  Widget _buildDashboardCard({required String title, required IconData icon, required String content}) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.blue),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(content),
          ],
        ),
      ),
    );
  }
}
