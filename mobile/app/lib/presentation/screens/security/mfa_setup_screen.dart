import 'package:flutter/material.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import '../../../data/services/mongodb_service.dart';
import 'fingerprint_otp_verify_screen.dart';
import 'mfa_verify_screen.dart';
import 'widgets/biometric_setup_section.dart';
import 'widgets/authenticator_setup_section.dart';
import 'package:local_auth/local_auth.dart';

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
  bool _biometricActivated = false;
  final LocalAuthentication _localAuth = LocalAuthentication();
  bool _sendingFingerprintOtp = false;

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
    _method = widget.initialMethod;
    if (_method == 'authenticator') {
      WidgetsBinding.instance.addPostFrameCallback((_) => _fetchSetup());
    }
  }

  Future<void> _onBiometricToggle(bool v) async {
    if (!v) {
      setState(() => _biometricActivated = false);
      return;
    }
    try {
      setState(() => _sendingFingerprintOtp = true);
      final supported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;
      final types = await _localAuth.getAvailableBiometrics();
      final hasFingerprint = types.contains(BiometricType.fingerprint) || types.contains(BiometricType.strong) || types.contains(BiometricType.weak);
      if (!(supported && canCheck && hasFingerprint)) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fingerprint not supported on this device')));
        setState(() {
          _biometricActivated = false;
          _sendingFingerprintOtp = false;
        });
        return;
      }
      setState(() => _biometricActivated = true);
      final send = await MongoDBService.mfaFingerprintStart(email: widget.email);
      if (!mounted) return;
      if (send['success'] == true) {
        final nav = Navigator.of(context);
        Navigator.push<bool>(
          context,
          MaterialPageRoute(
            builder: (_) => FingerprintOtpVerifyScreen(email: widget.email),
          ),
        ).then((ok) {
          if (ok == true) {
            if (!mounted) return;
            nav.pop('fingerprint');
          }
          if (mounted) {
            setState(() => _sendingFingerprintOtp = false);
          }
        });
      } else {
        final msg = (send['message'] is String) ? (send['message'] as String) : 'Failed to send email';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        setState(() {
          _biometricActivated = false;
          _sendingFingerprintOtp = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to check device support')));
      setState(() {
        _biometricActivated = false;
        _sendingFingerprintOtp = false;
      });
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
                    AuthenticatorSetupSection(
                      otpauthUri: _otpauthUri ?? _buildOtpauthUri(),
                      secret: _secret,
                      issuer: _issuer,
                      qrSize: qrSize,
                    ),
                  ],
                  if (_method == 'fingerprint') ...[
                    Stack(
                      children: [
                        BiometricSetupSection(
                          activated: _biometricActivated,
                          onChanged: _onBiometricToggle,
                        ),
                        if (_sendingFingerprintOtp)
                          Positioned.fill(
                            child: IgnorePointer(
                              ignoring: true,
                              child: Container(
                                color: Colors.black.withValues(alpha: 0.06),
                                child: const Center(
                                  child: SizedBox(
                                    height: 40,
                                    width: 40,
                                    child: CircularProgressIndicator(strokeWidth: 3),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 24),
                  if (_method != 'fingerprint') ...[
                    if (isSmall) ...[
                      ElevatedButton(
                        onPressed: _loading ? null : () {
                          final nav = Navigator.of(context);
                          Navigator.push<bool>(
                            context,
                            MaterialPageRoute(
                              builder: (_) => MfaVerifyScreen(verifyMfa: widget.verifyMfa, method: _method),
                            ),
                          ).then((ok) {
                            if (ok == true) {
                              if (!mounted) return;
                              nav.pop(_method);
                            }
                          });
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
                                final nav = Navigator.of(context);
                                Navigator.push<bool>(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => MfaVerifyScreen(verifyMfa: widget.verifyMfa, method: _method),
                                  ),
                                ).then((ok) {
                                  if (ok == true) {
                                    if (!mounted) return;
                                    nav.pop(_method);
                                  }
                                });
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
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
