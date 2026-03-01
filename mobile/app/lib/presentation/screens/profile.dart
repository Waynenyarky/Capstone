import 'package:flutter/material.dart';
import 'dart:async';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'login_page.dart';
import 'security/mfa_settings_screen.dart';
import 'security/active_sessions_screen.dart';
import 'change_email_page.dart';
import 'change_password_page.dart';
import 'edit_profile_page.dart';
import 'package:app/data/services/google_auth_service.dart';

/// Callback when profile (name, email) is updated - used by shell to refresh sidebar/drawer.
typedef OnProfileUpdated = void Function({String? avatarUrl, String? firstName, String? lastName, String? email});

class ProfilePage extends StatefulWidget {
  final String email;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;
  /// When true, renders only the body content (no Scaffold/AppBar) for embedding in a shell.
  final bool embeddedInShell;
  /// When false, hides Edit Profile and Personal Information (e.g. inspector cannot edit profile).
  final bool canEditProfile;
  /// Called when avatar or profile is updated so shell can refresh sidebar.
  final OnProfileUpdated? onProfileUpdated;
  const ProfilePage({super.key, required this.email, required this.firstName, required this.lastName, required this.phoneNumber, required this.token, this.avatarUrl = '', this.embeddedInShell = false, this.canEditProfile = true, this.onProfileUpdated});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String email = '';
  String firstName = '';
  String lastName = '';
  String phoneNumber = '';
  String avatarUrl = '';

  @override
  void initState() {
    super.initState();
    email = widget.email;
    firstName = widget.firstName;
    lastName = widget.lastName;
    phoneNumber = widget.phoneNumber;
    avatarUrl = widget.avatarUrl;
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _openSecurity() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MfaSettingsScreen(email: email),
      ),
    );
  }

  void _openChangeEmailPage() async {
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (_) => ChangeEmailPage(
          currentEmail: email,
          embeddedInShell: widget.embeddedInShell,
          canEditProfile: widget.canEditProfile,
        ),
      ),
    );
    if (result is String && result.isNotEmpty) {
      setState(() {
        email = result;
      });
      widget.onProfileUpdated?.call(email: result);
    }
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.logout, color: Colors.black87),
            const SizedBox(width: 8),
            const Text('Logout'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to logout?', style: TextStyle(fontSize: 15, height: 1.5)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: BizClearColors.webPrimaryTintLight,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: BizClearColors.webPrimaryTintBorder),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, color: BizClearColors.webPrimaryTintIcon, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "You're about to sign out of this device. Your account and data stay safe—nothing will be deleted. You can sign back in anytime with your email and password.",
                      style: TextStyle(fontSize: 13, color: BizClearColors.webPrimaryTintText, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: BizClearColors.error,
              foregroundColor: Colors.white,
              padding: BizClearColors.primaryButtonPadding,
              minimumSize: BizClearColors.primaryButtonMinimumSize,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: BizClearColors.primaryButtonTextStyle,
            ),
            onPressed: () {
              GoogleAuthService.signOutAndReset();
              final nav = Navigator.of(context);
              () async {
                try {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.remove('loggedInEmail');
                  await prefs.setBool('disableAutoAuthenticatorOnce', true);
                } catch (_) {}
              }();
              Navigator.pop(context);
              () async {
                bool preAuthenticatorEnabled = false;
                try {
                  final prefs = await SharedPreferences.getInstance();
                  String targetEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
                  if (targetEmail.isEmpty) targetEmail = email;
                  if (targetEmail.isNotEmpty) {
                    final s = await MongoDBService.getMfaStatusDetail(email: targetEmail);
                    final enabledMfa = s['success'] == true && s['enabled'] == true;
                    final method = (s['method'] ?? '').toString().toLowerCase();
                    if (enabledMfa && (method.contains('authenticator') || method.contains('totp') || method.contains('otp'))) {
                      preAuthenticatorEnabled = true;
                    }
                  }
                } catch (_) {}
                if (!mounted) return;
                nav.pushAndRemoveUntil(
                  MaterialPageRoute(
                    builder: (_) => LoginScreen(
                      preAuthenticatorEnabled: preAuthenticatorEnabled,
                    ),
                  ),
                  (route) => false,
                );
              }();
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileBody() {
    return SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(30)),
                boxShadow: [
                  BoxShadow(
                    color: BizClearColors.surfaceLight,
                    spreadRadius: 1,
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.only(bottom: 30, top: 10),
              child: Column(
                children: [
                  Text(
                    '$firstName $lastName',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Colors.black87,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: BizClearColors.divider,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      email,
                      style: TextStyle(
                        fontSize: 14,
                        color: BizClearColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (widget.canEditProfile) ...[
              _buildSectionTitle('Personal Information'),
              _buildInfoCard(),
              const SizedBox(height: 24),
            ],
            _buildSectionTitle(''),
            _buildSecuritySection(),
            const SizedBox(height: 16),
            _buildLogoutSection(),
            const SizedBox(height: 30),
          ],
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embeddedInShell) {
      return _buildProfileBody();
    }
    return Scaffold(
      backgroundColor: BizClearColors.surfaceLight,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w700, fontSize: 20)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: _buildProfileBody(),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: BizClearColors.divider,
            spreadRadius: 0,
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoRow(Icons.email_outlined, 'Email', email),
          _buildDivider(),
          _buildInfoRow(Icons.person_outline, 'First Name', firstName),
          _buildDivider(),
          _buildInfoRow(Icons.person_outline, 'Last Name', lastName),
          _buildDivider(),
          _buildInfoRow(Icons.phone_outlined, 'Phone Number', phoneNumber.isNotEmpty ? phoneNumber : 'Not set'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Material(
      color: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: BizClearColors.webPrimary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: BizClearColors.webPrimaryTintIcon, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: BizClearColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(height: 1, color: BizClearColors.divider, indent: 60);
  }

  Widget _buildSecuritySection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: BizClearColors.divider,
            spreadRadius: 0,
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          if (widget.canEditProfile) ...[
            _buildSettingsTile(
              icon: Icons.edit_outlined,
              title: 'Edit Profile',
              onTap: () async {
                final result = await Navigator.push<Map<String, dynamic>>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => EditProfilePage(
                      email: email,
                      token: widget.token,
                      firstName: firstName,
                      lastName: lastName,
                      phoneNumber: phoneNumber,
                      avatarUrl: avatarUrl,
                    ),
                  ),
                );
                if (result is Map<String, dynamic>) {
                  setState(() {
                    firstName = (result['firstName'] is String) ? result['firstName'] as String : firstName;
                    lastName = (result['lastName'] is String) ? result['lastName'] as String : lastName;
                    phoneNumber = (result['phoneNumber'] is String) ? result['phoneNumber'] as String : phoneNumber;
                    avatarUrl = (result['avatarUrl'] is String) ? result['avatarUrl'] as String : avatarUrl;
                  });
                }
              },
            ),
            _buildDivider(),
          ],
          _buildSettingsTile(
            icon: Icons.alternate_email,
            title: 'Change Email',
            onTap: _openChangeEmailPage,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () async {
              final nav = Navigator.of(context);
              await nav.push<bool>(
                MaterialPageRoute(
                  builder: (_) => ChangePasswordPage(
                    email: email,
                    token: widget.token,
                  ),
                ),
              );
            },
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.security_outlined,
            title: 'Multi-Factor Authentication',
            onTap: _openSecurity,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.desktop_windows_outlined,
            title: 'Active Sessions',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ActiveSessionsScreen(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: BizClearColors.divider,
            spreadRadius: 0,
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.logout,
            title: 'Logout',
            onTap: _logout,
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                color: isDestructive ? BizClearColors.error.withValues(alpha: 0.1) : BizClearColors.webPrimary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: isDestructive ? BizClearColors.error : BizClearColors.webPrimaryTintIcon,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDestructive ? BizClearColors.error : Colors.black87,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: BizClearColors.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 2),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
                color: BizClearColors.textPrimary,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

// Removed face unlock stubs

