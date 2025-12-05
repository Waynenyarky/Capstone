import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'login_page.dart';

class ProfilePage extends StatefulWidget {
  final String email;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  const ProfilePage({super.key, required this.email, required this.firstName, required this.lastName, required this.phoneNumber, required this.token});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String email = '';
  String firstName = '';
  String lastName = '';
  String phoneNumber = '';
  bool _saving = false;

  bool _isValidName(String v) {
    final s = v.trim();
    if (s.length < 2 || s.length > 50) return false;
    return RegExp(r'^[A-Za-z][A-Za-z\-\s]*$').hasMatch(s);
  }

  bool _isValidPhone(String v) {
    return RegExp(r'^09\d{9}$').hasMatch(v);
  }

  @override
  void initState() {
    super.initState();
    email = widget.email;
    firstName = widget.firstName;
    lastName = widget.lastName;
    phoneNumber = widget.phoneNumber;
  }

  void _showEditProfileDialog() {
    final firstNameController = TextEditingController(text: firstName);
    final lastNameController = TextEditingController(text: lastName);
    final phoneController = TextEditingController(text: phoneNumber);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Profile'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: firstNameController,
                decoration: const InputDecoration(
                  labelText: 'First Name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: lastNameController,
                decoration: const InputDecoration(
                  labelText: 'Last Name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(11),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final f = firstNameController.text.trim();
              final l = lastNameController.text.trim();
              final p = phoneController.text.trim();
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              if (!_isValidName(f)) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('First Name must be 2-50 letters, spaces or hyphen')),
                );
                return;
              }
              if (!_isValidName(l)) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Last Name must be 2-50 letters, spaces or hyphen')),
                );
                return;
              }
              if (!_isValidPhone(p)) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Phone must be 11 digits starting with 09')),
                );
                return;
              }
              setState(() {
                _saving = true;
              });
              final result = await MongoDBService.updateProfile(
                email: email,
                token: widget.token,
                firstName: f,
                lastName: l,
                phoneNumber: p,
              );
              setState(() {
                _saving = false;
              });
              if (result['success'] == true) {
                final user = (result['user'] is Map<String, dynamic>) ? (result['user'] as Map<String, dynamic>) : <String, dynamic>{};
                final nextFirst = (user['firstName'] is String) ? user['firstName'] as String : firstName;
                final nextLast = (user['lastName'] is String) ? user['lastName'] as String : lastName;
                final nextPhone = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : phoneNumber;
                setState(() {
                  firstName = nextFirst;
                  lastName = nextLast;
                  phoneNumber = nextPhone;
                });
                navigator.pop();
                messenger.showSnackBar(
                  SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Profile updated successfully')),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Update failed')),
                );
              }
            },
            child: _saving ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        bool obscureNew = true;
        bool obscureConfirm = true;
        return StatefulBuilder(
          builder: (context, setState) => AlertDialog(
            title: const Text('Change Password'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: currentPasswordController,
                    decoration: const InputDecoration(
                      labelText: 'Current Password',
                      border: OutlineInputBorder(),
                    ),
                    obscureText: true,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: newPasswordController,
                    decoration: InputDecoration(
                      labelText: 'New Password',
                      border: const OutlineInputBorder(),
                      suffixIcon: newPasswordController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                              onPressed: () {
                                setState(() {
                                  obscureNew = !obscureNew;
                                });
                              },
                            )
                          : null,
                    ),
                    obscureText: obscureNew,
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: confirmPasswordController,
                    decoration: InputDecoration(
                      labelText: 'Confirm New Password',
                      border: const OutlineInputBorder(),
                      suffixIcon: confirmPasswordController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                              onPressed: () {
                                setState(() {
                                  obscureConfirm = !obscureConfirm;
                                });
                              },
                            )
                          : null,
                    ),
                    obscureText: obscureConfirm,
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final current = currentPasswordController.text;
                  final next = newPasswordController.text;
                  final confirm = confirmPasswordController.text;
                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  if (current.isEmpty || next.isEmpty || confirm.isEmpty) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('All fields are required')),
                    );
                    return;
                  }
                  if (next != confirm) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Passwords do not match')),
                    );
                    return;
                  }
                  final result = await MongoDBService.updatePassword(
                    email: email,
                    token: widget.token,
                    currentPassword: current,
                    newPassword: next,
                  );
                  if (result['success'] == true) {
                    navigator.pop();
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Password changed successfully')),
                    );
                  } else {
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Password update failed')),
                    );
                  }
                },
                child: const Text('Change'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showDeleteAccountDialog() {
    final passwordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Are you sure you want to delete your account? This action cannot be undone.',
              style: TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              decoration: const InputDecoration(
                labelText: 'Enter Password to Confirm',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
              ElevatedButton(
                onPressed: () async {
                  final pwd = passwordController.text;
                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  if (pwd.isEmpty) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Password is required')),
                    );
                    return;
                  }
                  final result = await MongoDBService.deleteAccount(
                    email: email,
                    token: widget.token,
                    password: pwd,
                  );
                  if (result['success'] == true) {
                    navigator.pop();
                    navigator.pushAndRemoveUntil(
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                      (route) => false,
                    );
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Account deleted')),
                    );
                  } else {
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Delete failed')),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                ),
                child: const Text('Delete'),
              ),
        ],
      ),
    );
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
              ),
              padding: const EdgeInsets.only(bottom: 30),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.person, size: 60, color: Colors.blue),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '$firstName $lastName',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    email,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _buildInfoCard(),
            const SizedBox(height: 20),
            _buildSettingsSection(),
            const SizedBox(height: 12),
            _buildLogoutSection(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoRow(Icons.email, 'Email', email),
          _buildDivider(),
          _buildInfoRow(Icons.person, 'First Name', firstName),
          _buildDivider(),
          _buildInfoRow(Icons.person_outline, 'Last Name', lastName),
          _buildDivider(),
          _buildInfoRow(Icons.phone, 'Phone Number', phoneNumber),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(height: 1, color: Colors.grey[200]);
  }

  Widget _buildSettingsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.edit,
            title: 'Edit Profile',
            onTap: _showEditProfileDialog,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: _showChangePasswordDialog,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.delete_outline,
            title: 'Delete Account',
            onTap: _showDeleteAccountDialog,
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
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
    return ListTile(
      leading: Icon(
        icon,
        color: isDestructive ? Colors.red : Colors.blue,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isDestructive ? Colors.red : Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: Colors.grey[400],
      ),
      onTap: onTap,
    );
  }
}
