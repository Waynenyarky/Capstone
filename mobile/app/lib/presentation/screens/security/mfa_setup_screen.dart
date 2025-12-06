import 'package:flutter/material.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import 'mfa_verify_screen.dart';

class MfaSetupScreen extends StatefulWidget {
  final EnableMfa enableMfa;
  final VerifyMfa verifyMfa;
  final String initialMethod;
  final bool allowSelection;

  const MfaSetupScreen({
    super.key,
    required this.enableMfa,
    required this.verifyMfa,
    this.initialMethod = 'authenticator',
    this.allowSelection = true,
  });

  @override
  State<MfaSetupScreen> createState() => _MfaSetupScreenState();
}

class _MfaSetupScreenState extends State<MfaSetupScreen> {
  late String _method;
  bool _loading = false;

  Future<void> _continue() async {
    setState(() => _loading = true);
    try {
      await widget.enableMfa.call(method: _method);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => MfaVerifyScreen(verifyMfa: widget.verifyMfa, method: _method),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Setup failed')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _method = widget.initialMethod;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set Up MFA')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (widget.allowSelection) ...[
                const Text(
                  'Choose a verification method',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _method,
                  items: const [
                    DropdownMenuItem(value: 'authenticator', child: Text('Authenticator app')),
                    DropdownMenuItem(value: 'fingerprint', child: Text('Fingerprint')),
                    DropdownMenuItem(value: 'face', child: Text('Face recognition')),
                  ],
                  onChanged: (v) => setState(() => _method = v ?? 'authenticator'),
                ),
                const SizedBox(height: 12),
              ] else ...[
                Text(
                  _method == 'authenticator'
                      ? 'Authenticator App'
                      : (_method == 'fingerprint' ? 'Fingerprint' : 'Face Recognition'),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
              ],
              _MethodInfo(method: _method),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _continue,
                child: _loading
                    ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                    : const Text('Continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MethodInfo extends StatelessWidget {
  final String method;
  const _MethodInfo({required this.method});

  @override
  Widget build(BuildContext context) {
    String text;
    switch (method) {
      case 'fingerprint':
        text = 'Use your device\'s fingerprint sensor to verify.';
        break;
      case 'face':
        text = 'Use your device\'s face recognition to verify.';
        break;
      default:
        text = 'Use an authenticator app to generate codes.';
    }
    return Row(
      children: [
        const Icon(Icons.info_outline, size: 16, color: Colors.grey),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: TextStyle(color: Colors.grey[700]))),
      ],
    );
  }
}
