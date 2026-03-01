import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import 'mfa_verify_screen.dart';
import 'widgets/authenticator_setup_section.dart';

class MfaSetupScreen extends StatefulWidget {
  final EnableMfa enableMfa;
  final VerifyMfa verifyMfa;
  final String initialMethod;
  final bool allowSelection;
  final String email;

  const MfaSetupScreen({
    super.key,
    required this.enableMfa,
    required this.verifyMfa,
    this.initialMethod = 'authenticator',
    this.allowSelection = true,
    required this.email,
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
    if (_method != 'authenticator') {
      return;
    }
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
    _method = widget.initialMethod == 'fingerprint' ? 'authenticator' : widget.initialMethod;
    if (_method == 'authenticator') {
      WidgetsBinding.instance.addPostFrameCallback((_) => _fetchSetup());
    }
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
                      'Verification method',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: 'authenticator',
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        contentPadding: BizClearColors.inputFieldContentPadding,
                      ),
                      items: const [
                        DropdownMenuItem(value: 'authenticator', child: Text('Authenticator app')),
                      ],
                      onChanged: (_) {},
                    ),
                    const SizedBox(height: 16),
                  ] else ...[
                    const Text(
                      'Authenticator app',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (_method == 'authenticator') ...[
                    AuthenticatorSetupSection(
                      otpauthUri: _otpauthUri ?? _buildOtpauthUri(),
                      secret: _secret,
                      issuer: _issuer,
                      qrSize: qrSize,
                    ),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _loading ? null : () {
                            final nav = Navigator.of(context);
                            Navigator.push<bool>(
                              context,
                              MaterialPageRoute(
                                builder: (_) => MfaVerifyScreen(verifyMfa: widget.verifyMfa, method: _method),
                              ),
                            ).then((ok) {
                              if (ok == true && mounted) nav.pop(_method);
                            });
                          },
                          child: _loading
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Verify code'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton(
                        onPressed: _loading ? null : _fetchSetup,
                        child: const Text('Regenerate'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
