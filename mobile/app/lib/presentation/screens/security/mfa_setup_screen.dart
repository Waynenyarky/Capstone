import 'package:flutter/material.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import 'mfa_verify_screen.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

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
  String? _otpauthUri;
  String? _secret;
  String? _issuer;

  String? _buildOtpauthUri() {
    if (_secret == null || _secret!.isEmpty) return null;
    final issuer = (_issuer == null || _issuer!.isEmpty) ? 'Account' : _issuer!;
    final label = Uri.encodeComponent(issuer);
    final secret = Uri.encodeComponent(_secret!);
    final issuerParam = Uri.encodeComponent(issuer);
    return 'otpauth://totp/$label?secret=$secret&issuer=$issuerParam&algorithm=SHA1&digits=6&period=30';
    }

  Future<void> _fetchSetup() async {
    setState(() => _loading = true);
    try {
      final res = await widget.enableMfa.call(method: _method);
      if (!mounted) return;
      _otpauthUri = res['otpauthUri'] as String?;
      _secret = res['secret'] as String?;
      _issuer = res['issuer'] as String?;
      setState(() {});
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Setup failed')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _method = widget.initialMethod;
    // Auto-generate setup for authenticator
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchSetup());
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 360;
    final isMedium = size.width >= 360 && size.width < 600;
    final horizontalPadding = isSmall ? 16.0 : (isMedium ? 20.0 : 24.0);
    final maxContentWidth = isSmall ? double.infinity : (isMedium ? 640.0 : 720.0);
    final qrSize = isSmall ? 160.0 : (isMedium ? 200.0 : 240.0);

    return Scaffold(
      appBar: AppBar(title: const Text('Set Up MFA')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 16),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxContentWidth),
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
                  ],
                  const SizedBox(height: 16),
                  if (_method == 'authenticator') ...[
                    if ((_otpauthUri ?? _buildOtpauthUri()) != null) ...[
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade300),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: QrImageView(
                            data: _otpauthUri ?? _buildOtpauthUri()!,
                            version: QrVersions.auto,
                            size: qrSize,
                            gapless: true,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Add to your authenticator app',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          if (_issuer != null) ...[
                            Text('Account Name', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey.shade300),
                              ),
                              child: Text(
                                _issuer!,
                                style: const TextStyle(fontSize: 15, fontFamily: 'monospace'),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          if (_secret != null) ...[
                            Text('Secret Key (manual entry)', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.grey.shade300),
                                    ),
                                    child: SelectableText(
                                      _secret!,
                                      style: const TextStyle(fontSize: 15, fontFamily: 'monospace'),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.copy, size: 20),
                                  tooltip: 'Copy',
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: _secret!));
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Secret Key copied')));
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Open Microsoft Authenticator → Add account → Other (custom) → scan QR or enter the Secret Key.',
                              style: TextStyle(fontSize: 13, color: Colors.blue.shade900, height: 1.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  if (isSmall) ...[
                    ElevatedButton(
                      onPressed: _loading ? null : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MfaVerifyScreen(verifyMfa: widget.verifyMfa, method: _method),
                          ),
                        );
                      },
                      child: _loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Verify Code'),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(onPressed: _loading ? null : _fetchSetup, child: const Text('Regenerate')),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _loading ? null : () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => MfaVerifyScreen(verifyMfa: widget.verifyMfa, method: _method),
                                ),
                              );
                            },
                            child: _loading
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text('Verify Code'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton(onPressed: _loading ? null : _fetchSetup, child: const Text('Regenerate')),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
