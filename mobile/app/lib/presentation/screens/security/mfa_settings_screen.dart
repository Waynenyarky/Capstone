import 'package:flutter/material.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import '../../../data/services/mongodb_service.dart';
import 'mfa_setup_screen.dart';
import 'mfa_verify_screen.dart';

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
    final enable = _EnableMfaStub();
    final verify = _VerifyMfaStub();
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
    );
  }

  void _openVerify(String method) {
    final verify = _VerifyMfaStub();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MfaVerifyScreen(verifyMfa: verify, method: method),
      ),
    );
  }

  void _select(String method) {
    setState(() => _selected = (_selected == method) ? null : method);
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
          onToggle: (v) => setState(() => _authEnabled = v),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Use a time-based one-time password (TOTP) app like Google Authenticator or Authy.'),
              const SizedBox(height: 8),
              const Text('During setup, you will scan a QR code and enter the generated 6-digit code to verify.'),
              const SizedBox(height: 16),
              Row(
                children: [
                  ElevatedButton(onPressed: () => _openSetupFor('authenticator'), child: const Text('Set Up')),
                  const SizedBox(width: 12),
                  OutlinedButton(onPressed: () => _openVerify('authenticator'), child: const Text('Verify')),
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
                  const SizedBox(width: 12),
                  OutlinedButton(onPressed: () => _openVerify('fingerprint'), child: const Text('Verify')),
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
                  const SizedBox(width: 12),
                  OutlinedButton(onPressed: () => _openVerify('face'), child: const Text('Verify')),
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

class _EnableMfaStub implements EnableMfa {
  @override
  Future<void> call({required String method}) async {}
}

class _VerifyMfaStub implements VerifyMfa {
  @override
  Future<bool> call({required String code}) async {
    return true;
  }
}

