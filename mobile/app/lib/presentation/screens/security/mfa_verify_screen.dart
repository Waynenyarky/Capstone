import 'package:flutter/material.dart';
import '../../../domain/usecases/verify_mfa.dart';

class MfaVerifyScreen extends StatefulWidget {
  final VerifyMfa verifyMfa;
  final String method;

  const MfaVerifyScreen({
    super.key,
    required this.verifyMfa,
    required this.method,
  });

  @override
  State<MfaVerifyScreen> createState() => _MfaVerifyScreenState();
}

class _MfaVerifyScreenState extends State<MfaVerifyScreen> {
  final _codeController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      final code = (widget.method == 'fingerprint' || widget.method == 'face')
          ? 'biometric:${widget.method}'
          : _codeController.text.trim();
      final ok = await widget.verifyMfa.call(code: code);
      if (!mounted) return;
      if (ok) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Success'),
            content: const Text('Multi-Factor Authentication is enabled.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('Done'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid verification')),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification failed')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBiometric = widget.method == 'fingerprint' || widget.method == 'face';
    return Scaffold(
      appBar: AppBar(title: const Text('Verify MFA')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                isBiometric
                    ? (widget.method == 'face'
                        ? 'Use face recognition to verify'
                        : 'Use fingerprint to verify')
                    : 'Enter the verification code from your authenticator app',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              if (!isBiometric) ...[
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Code',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
              ],
              ElevatedButton(
                onPressed: _loading ? null : _verify,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(isBiometric ? 'Verify' : 'Verify'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
