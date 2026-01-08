import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/domain/entities/user_role.dart';
import 'package:app/domain/entities/menu_item.dart';
import 'package:app/presentation/navigation/role_menu_config.dart';
import 'package:app/data/services/google_auth_service.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/presentation/screens/login_page.dart';

class RoleBasedDrawer extends StatelessWidget {
  final UserRole role;
  final String firstName;
  final String lastName;
  final String email;
  final String avatarUrl;
  final Function(AppMenuItem) onItemSelected;
  final AppMenuItem? selectedItem;

  const RoleBasedDrawer({
    super.key,
    required this.role,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.avatarUrl,
    required this.onItemSelected,
    this.selectedItem,
  });

  @override
  Widget build(BuildContext context) {
    final menuItems = RoleMenuConfig.getMenuForRole(role);

    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            accountName: Text('$firstName $lastName'),
            accountEmail: Text(email),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
              child: avatarUrl.isEmpty
                  ? Text(
                      firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U',
                      style: const TextStyle(fontSize: 24, color: Colors.black),
                    )
                  : null,
            ),
            decoration: const BoxDecoration(
              color: Colors.black, // Matching the app theme
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.zero,
              itemCount: menuItems.length,
              itemBuilder: (context, index) {
                final item = menuItems[index];
                final isSelected = selectedItem?.title == item.title;

                return Container(
                  color: isSelected ? Colors.grey.shade200 : null,
                  child: ListTile(
                    leading: Icon(
                      item.icon,
                      color: isSelected ? Colors.black : Colors.grey.shade700,
                    ),
                    title: Text(
                      item.title,
                      style: TextStyle(
                        color: isSelected ? Colors.black : Colors.grey.shade800,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    selected: isSelected,
                    onTap: () {
                      Navigator.pop(context); // Close drawer
                      onItemSelected(item);
                    },
                  ),
                );
              },
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () {
              showDialog(
                context: context,
                builder: (dialogContext) => AlertDialog(
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
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue.shade700, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                "You're about to sign out of this device. Your account and data stay safe—nothing will be deleted. You can sign back in anytime with your email and password, or with biometrics if enabled.",
                                style: TextStyle(fontSize: 13, color: Colors.blue.shade900, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(dialogContext),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                      onPressed: () {
                        GoogleAuthService.signOutAndReset();
                        final nav = Navigator.of(dialogContext);
                        () async {
                          try {
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.remove('loggedInEmail');
                            await prefs.setBool('disableAutoAuthenticatorOnce', true);
                          } catch (_) {}
                        }();
                        Navigator.pop(dialogContext);
                        () async {
                          bool preFpEnabled = false;
                          bool preFaceEnabled = false;
                          bool preAuthenticatorEnabled = false;
                          String preFpEmail = '';
                          try {
                            final prefs = await SharedPreferences.getInstance();
                            String targetEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
                            if (targetEmail.isEmpty) {
                              targetEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
                            }
                            if (targetEmail.isEmpty) {
                              targetEmail = email;
                            }
                            final s = await MongoDBService.getMfaStatusDetail(email: targetEmail);
                            preFpEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
                            final enabledMfa = s['success'] == true && s['enabled'] == true;
                            final method = (s['method'] ?? '').toString().toLowerCase();
                            if (enabledMfa) {
                              if (method.contains('face')) preFaceEnabled = true;
                              if (method.contains('authenticator')) preAuthenticatorEnabled = true;
                            }
                            preFpEmail = targetEmail;
                          } catch (_) {}
                          if (context.mounted) {
                            nav.pushAndRemoveUntil(
                              MaterialPageRoute(
                                builder: (_) => LoginScreen(
                                  preFingerprintEnabled: preFpEnabled,
                                  preFingerprintEmail: preFpEmail,
                                  preFaceEnabled: preFaceEnabled,
                                  preAuthenticatorEnabled: preAuthenticatorEnabled,
                                ),
                              ),
                              (route) => false,
                            );
                          }
                        }();
                      },
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
