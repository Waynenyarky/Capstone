import 'package:flutter/material.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import '../../../domain/usecases/get_mfa_status.dart';
import '../../../domain/usecases/disable_mfa.dart';
import '../../../data/services/mongodb_service.dart';
import 'mfa_setup_screen.dart';

class MfaSettingsScreen extends StatefulWidget {
  final String email;
  const MfaSettingsScreen({super.key, required this.email});

  @override
  State<MfaSettingsScreen> createState() => _MfaSettingsScreenState();
}

class _MfaSettingsScreenState extends State<MfaSettingsScreen> {
  String? _selected;
  bool _authEnabled = false;
  bool _fingerEnabled = false;
  bool _faceEnabled = false;
  bool _faceLoading = false;

  @override
  void initState() {
    super.initState();
    _loadFace();
    _loadAuthStatus();
  }

  Future<void> _loadFace() async {
    setState(() => _faceLoading = true);
    try {
      final status = await MongoDBService.getFaceUnlockStatus(email: widget.email);
      if (!mounted) return;
      setState(() => _faceEnabled = status);
    } catch (_) {} finally {
      if (mounted) setState(() => _faceLoading = false);
    }
  }

  Future<void> _toggleFace(bool value) async {
    setState(() => _faceLoading = true);
    try {
      final res = await MongoDBService.setFaceUnlockEnabled(email: widget.email, enabled: value);
      final ok = res['success'] == true;
      if (!mounted) return;
      setState(() => _faceEnabled = ok ? value : _faceEnabled);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ok ? 'Face recognition ${value ? 'enabled' : 'disabled'}' : (res['message'] ?? 'Update failed').toString())),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error')));
      }
    } finally {
      if (mounted) setState(() => _faceLoading = false);
    }
  }

  

  void _openSetupFor(String method) {
    final enable = EnableMfaImpl(email: widget.email);
    final verify = VerifyMfaImpl(email: widget.email);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MfaSetupScreen(
          enableMfa: enable,
          verifyMfa: verify,
          initialMethod: method,
          allowSelection: false,
        ),
      ),
    ).then((_) => _loadAuthStatus());
  }


  void _select(String method) {
    setState(() => _selected = (_selected == method) ? null : method);
  }

  Future<void> _loadAuthStatus() async {
    try {
      final get = GetMfaStatusImpl(email: widget.email);
      final enabled = await get.call();
      if (!mounted) return;
      setState(() {
        _authEnabled = enabled;
        if (enabled) {
          _selected = 'authenticator';
        } else if (_selected == 'authenticator') {
          _selected = null;
        }
      });
    } catch (_) {}
  }

  Future<void> _toggleAuthenticator(bool value) async {
    if (value) {
      _openSetupFor('authenticator');
      return;
    }
    final confirm = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Disable Authenticator App?'),
        content: const Text('Are you sure you want to disable the Authenticator App? You will no longer receive verification codes at login.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Disable'),
          ),
        ],
      ),
    ) ?? false;
    if (!confirm) {
      if (!mounted) return;
      setState(() {});
      return;
    }
    final disable = DisableMfaImpl(email: widget.email);
    final res = await disable.call();
    final ok = res['success'] == true;
    if (!mounted) return;
    setState(() {
      _authEnabled = ok ? false : _authEnabled;
      if (ok) _selected = null;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? 'Authenticator disabled' : (res['message'] ?? 'Disable failed').toString())),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Multi-Factor Authentication',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('Select a method to view details and enable or disable.'),
              const SizedBox(height: 16),

              Card(
                child: ListTile(
                  leading: const Icon(Icons.qr_code),
                  title: const Text('Authenticator App'),
                  subtitle: const Text('Use time-based codes from an app'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () => _select('authenticator'),
                ),
              ),
              if (_selected == 'authenticator') Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _buildDetailFor('authenticator'),
              ),
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.fingerprint),
                  title: const Text('Fingerprint'),
                  subtitle: const Text('Use your device fingerprint'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () => _select('fingerprint'),
                ),
              ),
              if (_selected == 'fingerprint') Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _buildDetailFor('fingerprint'),
              ),
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.face),
                  title: const Text('Face Recognition'),
                  subtitle: const Text('Use your device face recognition'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () => _select('face'),
                ),
              ),
              if (_selected == 'face') Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _buildDetailFor('face'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailFor(String method) {
    switch (method) {
      case 'authenticator':
        return _buildMethodCard(
          icon: Icons.qr_code,
          title: 'Authenticator App',
          enabled: _authEnabled,
          onToggle: _toggleAuthenticator,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Use a time-based one-time password (TOTP) app like Google Authenticator or Authy.'),
              const SizedBox(height: 8),
              const Text('During setup, you will scan a QR code and enter the generated 6-digit code to verify.'),
              const SizedBox(height: 16),
              if (_authEnabled)
                const Text('Authenticator is already set up.', style: TextStyle(color: Colors.green))
              else
                Row(
                  children: [
                    ElevatedButton(onPressed: () => _openSetupFor('authenticator'), child: const Text('Set Up')),
                  ],
                ),
            ],
          ),
        );
      case 'fingerprint':
        return _buildMethodCard(
          icon: Icons.fingerprint,
          title: 'Fingerprint',
          enabled: _fingerEnabled,
          onToggle: (v) => setState(() => _fingerEnabled = v),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Use your device\'s fingerprint sensor to verify your identity during sign in.'),
              const SizedBox(height: 8),
              const Text('Make sure fingerprint is enrolled in your device settings.'),
              const SizedBox(height: 16),
              Row(
                children: [
                  ElevatedButton(onPressed: () => _openSetupFor('fingerprint'), child: const Text('Set Up')),
                ],
              ),
            ],
          ),
        );
      case 'face':
        return _buildMethodCard(
          icon: Icons.face,
          title: 'Face Recognition',
          enabled: _faceEnabled,
          loading: _faceLoading,
          onToggle: _toggleFace,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Use your device\'s face recognition to add an additional check after password.'),
              const SizedBox(height: 8),
              const Text('Ensure face recognition is set up in your device settings.'),
              const SizedBox(height: 16),
              Row(
                children: [
                  ElevatedButton(onPressed: () => _openSetupFor('face'), child: const Text('Set Up')),
                ],
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildMethodCard({
    required IconData icon,
    required String title,
    required bool enabled,
    required Widget child,
    bool loading = false,
    required ValueChanged<bool> onToggle,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(icon, size: 24, color: Colors.blue),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const Spacer(),
                Switch(value: enabled, onChanged: loading ? null : onToggle),
              ],
            ),
            const SizedBox(height: 12),
            child,
            if (loading)
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: LinearProgressIndicator(minHeight: 2),
              ),
          ],
        ),
      ),
    );
  }
}
