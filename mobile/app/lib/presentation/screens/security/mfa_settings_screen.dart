import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import '../../../core/theme/bizclear_colors.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import 'disable_mfa_page.dart';
import '../../../domain/usecases/get_mfa_status_detail.dart';
import '../../../domain/usecases/request_disable_mfa.dart';
import '../../../domain/usecases/undo_disable_mfa.dart';
import '../../../data/services/mongodb_service.dart';
import 'mfa_setup_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:local_auth/local_auth.dart';

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
  bool _disablePending = false;
  DateTime? _scheduledFor;
  Duration _disableRemaining = Duration.zero;
  Timer? _disableTicker;
  final LocalAuthentication _localAuth = LocalAuthentication();
  bool _deviceSupportsFingerprint = false;
  bool _deviceSupportChecked = false;

  @override
  void initState() {
    super.initState();
    _loadAuthDetail();
    _checkDeviceSupport();
  }

  Future<void> _checkDeviceSupport() async {
    try {
      final supported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;
      final types = await _localAuth.getAvailableBiometrics();
      final hasFingerprint = types.contains(BiometricType.fingerprint) || types.contains(BiometricType.strong) || types.contains(BiometricType.weak);
      if (!mounted) return;
      setState(() {
        _deviceSupportsFingerprint = supported && canCheck && hasFingerprint;
        _deviceSupportChecked = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _deviceSupportsFingerprint = false;
        _deviceSupportChecked = true;
      });
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
          email: widget.email,
        ),
      ),
    ).then((result) async {
      final selected = (result is String && result.isNotEmpty) ? result : null;
      setState(() {
        _selected = selected;
      });
      if (selected == 'fingerprint') {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', widget.email);
          await prefs.setString('fingerprintEmail', widget.email.toLowerCase());
        } catch (_) {}
      }
      _loadAuthDetail();
    });
  }


  void _select(String method) {
    setState(() => _selected = (_selected == method) ? null : method);
  }

  Future<void> _loadAuthDetail() async {
    try {
      final raw = await MongoDBService.getMfaStatusDetail(email: widget.email);
      if (!mounted) return;
      setState(() {
        final currentMethod = (raw['method'] is String) ? (raw['method'] as String) : '';
        final methodNorm = currentMethod.toLowerCase().trim();
        final fpEnabledFromServer = (raw['fprintEnabled'] == true) || (raw['isFingerprintEnabled'] == true);
        final isAuthMethod = methodNorm == 'authenticator' || methodNorm == 'totp' || methodNorm == 'microsoft' || methodNorm.contains('auth');
        _authEnabled = (raw['enabled'] == true) && isAuthMethod;
        _disablePending = raw['disablePending'] == true;
        final s = raw['scheduledFor'];
        _scheduledFor = s is String ? DateTime.tryParse(s) : null;
        _fingerEnabled = fpEnabledFromServer;
        
        // Do not override selection here; details will render based on enabled flags
      });
      if (_selected == 'authenticator') {
        _syncDisableCountdown();
      } else if (_selected == 'fingerprint') {
        setState(() {});
      }
      _syncDisableCountdown();
    } catch (_) {}
  }

  void _syncDisableCountdown() {
    _disableTicker?.cancel();
    if (_disablePending && _scheduledFor != null) {
      _tickDisable();
      _disableTicker = Timer.periodic(const Duration(seconds: 1), (_) => _tickDisable());
    } else {
      setState(() => _disableRemaining = Duration.zero);
    }
  }

  void _tickDisable() {
    final target = _scheduledFor;
    if (target == null) return;
    final diff = target.difference(DateTime.now());
    setState(() => _disableRemaining = diff.isNegative ? Duration.zero : diff);
  }

  void _openDisablePage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DisableMfaPage(
          getStatus: GetMfaStatusDetailImpl(email: widget.email),
          requestDisable: RequestDisableMfaImpl(email: widget.email),
          undoDisable: UndoDisableMfaImpl(email: widget.email),
        ),
      ),
    ).then((_) => _loadAuthDetail());
  }

  Future<void> _toggleFingerprint(bool value) async {
    if (value) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final existingFpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
        if (existingFpEmail.isNotEmpty && existingFpEmail != widget.email.toLowerCase()) {
          bool stillEnabled = true;
          try {
            final s = await MongoDBService.getMfaStatusDetail(email: existingFpEmail);
            stillEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
          } catch (_) {}
          if (!stillEnabled) {
            try { await prefs.remove('fingerprintEmail'); } catch (_) {}
          } else {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Colors.red,
                  content: Text(
                    'You cannot use biometrics to log in to multiple accounts on the same device.',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              );
            }
            return;
          }
        }
      } catch (_) {}
      if (!_deviceSupportChecked) {
        await _checkDeviceSupport();
      }
      if (!_deviceSupportsFingerprint) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fingerprint not supported on this device')));
        }
        return;
      }
      _openSetupFor('fingerprint');
      return;
    }
    final proceed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        final w = MediaQuery.of(ctx).size.width;
        final isCompact = w < 360;
        return AlertDialog(
          scrollable: true,
          insetPadding: EdgeInsets.symmetric(horizontal: isCompact ? 12 : 24, vertical: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          titlePadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
          contentPadding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
          title: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle),
                child: Icon(Icons.warning_amber_rounded, color: Colors.red.shade600, size: 24),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Text(
                  'Disable Biometrics Login',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.shade100),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 18, color: Colors.red.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Disabling fingerprint will remove biometric login for this device/account.',
                        style: TextStyle(fontSize: 13, color: Colors.red.shade900, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Your TOTP Authenticator (if enabled) remains active.',
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Disable Biometrics Login'),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        );
      },
    ) ?? false;
    if (!mounted) return;
    if (!proceed) {
      setState(() {});
      return;
    }
    try {
      final res = await MongoDBService.disableFingerprintLogin(email: widget.email);
      final ok = res['success'] == true;
      if (!mounted) return;
      setState(() => _fingerEnabled = ok ? false : _fingerEnabled);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ok ? 'Biometrics login disabled' : (res['message'] ?? 'Update failed').toString())),
      );
      if (ok) {
        try {
          final prefs = await SharedPreferences.getInstance();
          final existing = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
          if (existing.isNotEmpty && existing == widget.email.toLowerCase()) {
            await prefs.remove('fingerprintEmail');
          }
        } catch (_) {}
        _loadAuthDetail();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error')));
      }
    }
  }

  Future<void> _toggleAuthenticator(bool value) async {
    if (value) {
      _openSetupFor('authenticator');
      return;
    }
    try {
      final detail = await GetMfaStatusDetailImpl(email: widget.email).call();
      if (!mounted) return;
      if (detail.disablePending) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DisableMfaPage(
              getStatus: GetMfaStatusDetailImpl(email: widget.email),
              requestDisable: RequestDisableMfaImpl(email: widget.email),
              undoDisable: UndoDisableMfaImpl(email: widget.email),
            ),
          ),
        ).then((_) => _loadAuthDetail());
        return;
      }
      final proceed = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('Disable TOTP Authenticator'),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Note:'),
              SizedBox(height: 8),
              Text('• Disabling 2FA is scheduled and completes after 24 hours.'),
              SizedBox(height: 4),
              Text('• You can undo the request anytime in the next 24 hours by entering a valid OTP.'),
              SizedBox(height: 4),
              Text('• Until disabled, you will still need your current 2FA code to sign in.'),
            ],
          ),
          actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(null),
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
      if (!mounted) return;
      if (!proceed) {
        setState(() {});
        return;
      }
      final verified = await _requireOtpVerification();
      if (!mounted) return;
      if (verified != true) {
        final msg = verified == null ? 'Action canceled.' : 'Invalid Microsoft Authenticator code';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        return;
      }
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DisableMfaPage(
            getStatus: GetMfaStatusDetailImpl(email: widget.email),
            requestDisable: RequestDisableMfaImpl(email: widget.email),
            undoDisable: UndoDisableMfaImpl(email: widget.email),
          ),
        ),
      ).then((_) => _loadAuthDetail());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          'Security',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Multi-Factor Authentication',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enhance your account security by enabling an additional authentication method.',
                style: TextStyle(fontSize: 15, color: Colors.grey.shade600, height: 1.4),
              ),
              const SizedBox(height: 32),

              // TOTP Section
              _buildSection(
                id: 'authenticator',
                title: 'TOTP Authenticator',
                subtitle: 'Use time-based codes from an app',
                icon: Icons.qr_code_rounded,
                isEnabled: _authEnabled,
                isSelected: _selected == 'authenticator',
                onTap: () => _select('authenticator'),
                content: _buildDetailFor('authenticator'),
              ),
              
              const SizedBox(height: 16),

              // Biometrics Section
              _buildSection(
                id: 'fingerprint',
                title: 'Biometrics',
                subtitle: 'Use fingerprint or system biometrics',
                icon: Icons.fingerprint_rounded,
                isEnabled: _fingerEnabled,
                isSelected: _selected == 'fingerprint',
                onTap: () => _select('fingerprint'),
                content: _buildDetailFor('fingerprint'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required String id,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isEnabled,
    required bool isSelected,
    required VoidCallback onTap,
    required Widget content,
  }) {
    final showDetails = isSelected || isEnabled;
    
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: showDetails ? Colors.blue.withAlpha(76) : Colors.transparent,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header (Always visible, but acts as toggle if not enabled)
          // If details are shown, we might hide this OR keep it as a header?
          // The previous logic had a separate card for details.
          // Let's integrate them. 
          // If showDetails is true, the content (which is _buildMethodCard) is shown.
          // _buildMethodCard HAS a header inside it.
          // So if showDetails is true, we ONLY show content.
          // If showDetails is false, we show the summary tile.
          
          if (showDetails)
            content
          else
            Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(20),
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: Colors.blue.shade700, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              subtitle,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 16,
                        color: Colors.grey.shade300,
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _disableTicker?.cancel();
    super.dispose();
  }

  Widget _buildDetailFor(String method) {
    const titleStyle = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.black87);
    const bodyStyle = TextStyle(fontSize: 14, color: Colors.black54, height: 1.5);

    switch (method) {
      case 'authenticator':
        return _buildMethodCard(
          icon: Icons.qr_code_rounded,
          title: 'TOTP Authenticator',
          enabled: _authEnabled,
          onToggle: _toggleAuthenticator,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: titleStyle),
              const SizedBox(height: 8),
              const Text('Use a time-based one-time password (TOTP) app like Google Authenticator or Authy.', style: bodyStyle),
              const SizedBox(height: 8),
              const Text('During setup, you will scan a QR code and enter the generated 6-digit code to verify.', style: bodyStyle),
              const SizedBox(height: 24),
              
              if (_authEnabled && _disablePending && _scheduledFor != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.schedule, size: 20, color: Colors.orange.shade800),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Deactivation Scheduled',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.orange.shade900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Scheduled for: ${_fmtDateTimeAmPm(_scheduledFor!)}', style: TextStyle(fontSize: 13, color: Colors.orange.shade900)),
                      Text('Time remaining: ${_formatDuration(_disableRemaining)}', style: TextStyle(fontSize: 13, color: Colors.orange.shade900)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _openDisablePage,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: BorderSide(color: Colors.grey.shade300),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Manage Request'),
                  ),
                ),
              ] else if (_authEnabled) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_outline, size: 20, color: Colors.green.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'The authenticator is active and protecting your account.',
                          style: TextStyle(color: Colors.green.shade900, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
              ]
              else
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => _openSetupFor('authenticator'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Text('Set Up Authenticator', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
            ],
          ),
        );
      case 'fingerprint':
        return _buildMethodCard(
          icon: Icons.fingerprint_rounded,
          title: 'Biometrics',
          enabled: _fingerEnabled,
          onToggle: _toggleFingerprint,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: titleStyle),
              const SizedBox(height: 8),
              const Text('Use your device\'s biometrics to verify your identity during sign in.', style: bodyStyle),
              const SizedBox(height: 8),
              const Text('Make sure biometrics are enrolled in your device settings.', style: bodyStyle),
              const SizedBox(height: 24),
              if (_fingerEnabled) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_outline, size: 20, color: Colors.green.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Biometric login is enabled.',
                          style: TextStyle(color: Colors.green.shade900, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (!_fingerEnabled) ...[
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      try {
                        final prefs = await SharedPreferences.getInstance();
                        final existingFpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
                        if (existingFpEmail.isNotEmpty && existingFpEmail != widget.email.toLowerCase()) {
                          bool stillEnabled = true;
                          try {
                            final s = await MongoDBService.getMfaStatusDetail(email: existingFpEmail);
                            stillEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
                          } catch (_) {}
                          if (!stillEnabled) {
                            try { await prefs.remove('fingerprintEmail'); } catch (_) {}
                          } else {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  backgroundColor: Colors.red,
                                  content: Text(
                                    'You cannot use biometrics to log in to multiple accounts on the same device.',
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                              );
                            }
                            return;
                          }
                        }
                      } catch (_) {}
                      if (!_deviceSupportChecked) {
                        await _checkDeviceSupport();
                      }
                      if (!_deviceSupportsFingerprint) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fingerprint not supported on this device')));
                        }
                        return;
                      }
                      _openSetupFor('fingerprint');
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Text('Set Up Biometrics', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
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
    // No Card wrapper - parent handles container
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: enabled ? Colors.green.shade50 : Colors.blue.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: enabled ? Colors.green.shade700 : Colors.blue.shade700,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                    if (enabled)
                      Text(
                        'Enabled',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.green.shade600,
                        ),
                      ),
                  ],
                ),
              ),
              Transform.scale(
                scale: 0.9,
                child: Switch.adaptive(
                  value: enabled,
                  onChanged: loading ? null : onToggle,
                  activeThumbColor: Colors.green,
                  activeTrackColor: Colors.green.shade200,
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Divider(height: 1, color: Colors.grey.shade100),
          ),
          child,
          if (loading)
            const Padding(
              padding: EdgeInsets.only(top: 20),
              child: LinearProgressIndicator(minHeight: 2),
            ),
        ],
      ),
    );
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}'
        ;
  }

  String _fmtDateTimeAmPm(DateTime dt) {
    final local = dt.toLocal();
    final y = local.year.toString().padLeft(4, '0');
    final mo = local.month.toString().padLeft(2, '0');
    final d2 = local.day.toString().padLeft(2, '0');
    final h24 = local.hour;
    final h12 = (h24 % 12 == 0) ? 12 : (h24 % 12);
    final min = local.minute.toString().padLeft(2, '0');
    final ampm = h24 >= 12 ? 'PM' : 'AM';
    return '$y-$mo-$d2 $h12:$min $ampm';
  }

  Future<bool?> _requireOtpVerification() async {
    return await showModalBottomSheet<bool?>(
          context: context,
          isScrollControlled: true,
          builder: (ctx) {
            final controllers = List.generate(6, (_) => TextEditingController());
            final nodes = List.generate(6, (_) => FocusNode());
            bool pasting = false;
            String? error;
            bool loading = false;
            void clearAll() {
              for (final c in controllers) {
                c.clear();
              }
              nodes.first.requestFocus();
            }
            String code() => controllers.map((c) => c.text).join();
            Future<void> pasteAll() async {
              pasting = true;
              final data = await Clipboard.getData('text/plain');
              final raw = data?.text ?? '';
              final d = raw.replaceAll(RegExp(r'\D'), '');
              if (d.length >= 6) {
                for (int i = 0; i < 6; i++) {
                  controllers[i].text = d[i];
                }
                nodes[5].requestFocus();
              }
              pasting = false;
            }
            Widget otpBox(int i, void Function(void Function()) setState, double boxSize) {
              return SizedBox(
                width: boxSize,
                height: boxSize * 1.2,
                child: TextField(
                  controller: controllers[i],
                  focusNode: nodes[i],
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  style: TextStyle(
                    fontSize: (boxSize * 0.5).clamp(18.0, 26.0),
                    fontWeight: FontWeight.bold,
                    color: BizClearColors.textPrimary,
                  ),
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: error != null ? BizClearColors.error : BizClearColors.inputBorder,
                        width: error != null ? 2 : 1.5,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: error != null ? BizClearColors.error : BizClearColors.inputBorder,
                        width: error != null ? 2 : 1.5,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: error != null ? BizClearColors.error : BizClearColors.inputFocusedBorder,
                        width: 2,
                      ),
                    ),
                    filled: true,
                    fillColor: BizClearColors.surface,
                    contentPadding: EdgeInsets.zero,
                  ),
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  contextMenuBuilder: (menuCtx, state) => AdaptiveTextSelectionToolbar(
                    anchors: state.contextMenuAnchors,
                    children: [
                      TextSelectionToolbarTextButton(
                        padding: const EdgeInsets.all(8),
                        onPressed: () async {
                          state.hideToolbar();
                          await pasteAll();
                          setState(() {});
                        },
                        child: const Text('Paste'),
                      ),
                    ],
                  ),
                  onChanged: (val) {
                    if (pasting) return;
                    setState(() {
                      error = null;
                      final d = val.replaceAll(RegExp(r'\D'), '');
                      if (d.length >= 6) {
                        for (int k = 0; k < 6; k++) {
                          controllers[k].text = d[k];
                        }
                        nodes[5].requestFocus();
                        return;
                      }
                      if (d.length > 1) {
                        final start = i;
                        final take = d.length >= (6 - start) ? d.substring(0, 6 - start) : d;
                        for (int k = 0; k < take.length; k++) {
                          controllers[start + k].text = take[k];
                        }
                        final next = start + take.length;
                        if (next <= 5) {
                          nodes[next].requestFocus();
                        } else {
                          nodes[5].requestFocus();
                        }
                        return;
                      }
                      controllers[i].text = d.isEmpty ? '' : d[0];
                      if (d.isNotEmpty && i < 5) {
                        nodes[i + 1].requestFocus();
                      }
                      if (d.isEmpty && i > 0) {
                        nodes[i - 1].requestFocus();
                      }
                    });
                  },
                ),
              );
            }
            return StatefulBuilder(
              builder: (ctx2, setState) {
                final valid = RegExp(r'^[0-9]{6}$').hasMatch(code());
                return Padding(
                  padding: EdgeInsets.only(bottom: MediaQuery.of(ctx2).viewInsets.bottom),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Verify to Proceed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: BizClearColors.textPrimary)),
                        const SizedBox(height: 8),
                        const Text('Enter your 6-digit authenticator code to access Disable Two-Factor Auth.', style: TextStyle(color: BizClearColors.textSecondary)),
                        const SizedBox(height: 16),
                        LayoutBuilder(
                          builder: (_, c) {
                            const spacing = 8.0;
                            final avail = c.maxWidth;
                            final sz = ((avail - spacing * 5) / 6).clamp(40.0, 56.0);
                            return Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: List.generate(6, (i) => otpBox(i, setState, sz)),
                            );
                          },
                        ),
                        if (error != null) ...[
                          const SizedBox(height: 12),
                          Row(children: [const Icon(Icons.error_outline, color: BizClearColors.error, size: 20), const SizedBox(width: 8), Expanded(child: Text(error!, style: const TextStyle(color: BizClearColors.error)))])
                        ],
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: loading || !valid
                                    ? null
                                    : () async {
                                        final nav = Navigator.of(ctx);
                                        setState(() {
                                          loading = true;
                                          error = null;
                                        });
                                        final res = await MongoDBService.loginVerifyTotp(email: widget.email, code: code());
                                        if (!mounted) return;
                                        if (res['success'] == true) {
                                          nav.pop(true);
                                        } else {
                                          final msg = (res['message'] is String) ? (res['message'] as String) : 'Invalid Microsoft Authenticator code';
                                          setState(() {
                                            loading = false;
                                            error = msg;
                                            clearAll();
                                          });
                                        }
                                      },
                                style: ElevatedButton.styleFrom(backgroundColor: BizClearColors.primary),
                                child: loading
                                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2.5, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                                    : const Text('Verify Microsoft Authenticator'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Center(
                            child: TextButton(
                            onPressed: () => Navigator.of(ctx).pop(false),
                            style: TextButton.styleFrom(
                              foregroundColor: BizClearColors.textSecondary,
                            ),
                            child: const Text('Cancel'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
  }
}
