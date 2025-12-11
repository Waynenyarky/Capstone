import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';
import 'disable_mfa_page.dart';
import '../../../domain/usecases/get_mfa_status_detail.dart';
import '../../../domain/usecases/request_disable_mfa.dart';
import '../../../domain/usecases/undo_disable_mfa.dart';
import '../../../data/services/mongodb_service.dart';
import 'mfa_setup_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  bool _disablePending = false;
  DateTime? _scheduledFor;
  Duration _disableRemaining = Duration.zero;
  Timer? _disableTicker;
  
  String? _selectOnReturn;
  bool _fingerLock = false;

  @override
  void initState() {
    super.initState();
    _loadFace();
    _loadAuthDetail();
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
    _selectOnReturn = method;
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
      final selected = (result is String && result.isNotEmpty) ? result : _selectOnReturn;
      setState(() {
        _selected = selected;
        if (selected == 'fingerprint') {
          _fingerEnabled = true;
          _fingerLock = true;
        }
      });
      if (selected == 'fingerprint') {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', widget.email);
        } catch (_) {}
      }
      _selectOnReturn = null;
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
        _authEnabled = raw['enabled'] == true;
        _disablePending = raw['disablePending'] == true;
        final s = raw['scheduledFor'];
        _scheduledFor = s is String ? DateTime.tryParse(s) : null;
        final fpDerived = (raw['enabled'] == true) && (methodNorm.isEmpty || methodNorm == 'fingerprint');
        final lockActive = _fingerLock && (methodNorm.isEmpty || methodNorm == 'fingerprint');
        _fingerEnabled = fpEnabledFromServer || fpDerived || lockActive;
        if (fpEnabledFromServer || isAuthMethod) {
          _fingerLock = false;
        }
        
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
                'Your Authenticator App (if enabled) remains active.',
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
          title: const Text('Disable Authenticator App'),
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
      appBar: AppBar(title: const Text('Security')),
      body: SafeArea(
        child: SingleChildScrollView(
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
              if (_selected == 'authenticator' || _authEnabled) Padding(
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
              if (_selected == 'fingerprint' || _fingerEnabled) Padding(
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

  @override
  void dispose() {
    _disableTicker?.cancel();
    super.dispose();
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
              
              
              if (_authEnabled && _disablePending && _scheduledFor != null) ...[
                const Text('The authenticator is currently active but has been scheduled for deactivation.', style: TextStyle(color: Colors.orange)),
                const SizedBox(height: 8),
                Text('Disable scheduled: ${_fmtDateTimeAmPm(_scheduledFor!)}'),
                const SizedBox(height: 4),
                Text('Time remaining: ${_formatDuration(_disableRemaining)}'),
                const SizedBox(height: 8),
                ElevatedButton(onPressed: _openDisablePage, child: const Text('Manage Disable')),
              ] else if (_authEnabled) ...[
                const Text('The authenticator is already configured.', style: TextStyle(color: Colors.green)),
              ]
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
          onToggle: _toggleFingerprint,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How it works', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Use your device\'s fingerprint sensor to verify your identity during sign in.'),
              const SizedBox(height: 8),
              const Text('Make sure fingerprint is enrolled in your device settings.'),
              const SizedBox(height: 16),
              if (_fingerEnabled) ...[
                const Text('Fingerprint is enabled.', style: TextStyle(color: Colors.green)),
                const SizedBox(height: 12),
              ],
              if (!_fingerEnabled) ...[
                Row(
                  children: [
                    ElevatedButton(onPressed: () => _openSetupFor('fingerprint'), child: const Text('Set Up')),
                  ],
                ),
              ],
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
              final d = raw.replaceAll(RegExp(r'\\D'), '');
              if (d.length >= 6) {
                for (int i = 0; i < 6; i++) {
                  controllers[i].text = d[i];
                }
                nodes[5].requestFocus();
              }
              pasting = false;
            }
            Widget otpBox(int i, void Function(void Function()) setState) {
              return Container(
                width: 50,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: error != null
                        ? Colors.red
                        : (nodes[i].hasFocus ? Colors.blue : Colors.grey.shade300),
                    width: error != null || nodes[i].hasFocus ? 2 : 1.5,
                  ),
                ),
                child: TextField(
                  controller: controllers[i],
                  focusNode: nodes[i],
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  maxLength: 1,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
                  decoration: const InputDecoration(border: InputBorder.none, counterText: '', contentPadding: EdgeInsets.zero),
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
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
                      final d = val.replaceAll(RegExp(r'\\D'), '');
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
                        const Text('Verify to Proceed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        const Text('Enter your 6-digit Microsoft Authenticator code to access Disable Two-Factor Auth.'),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: List.generate(6, (i) => otpBox(i, setState)),
                        ),
                        if (error != null) ...[
                          const SizedBox(height: 12),
                          Row(children: [const Icon(Icons.error_outline, color: Colors.red, size: 20), const SizedBox(width: 8), Expanded(child: Text(error!, style: const TextStyle(color: Colors.red)))])
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
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
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
                              foregroundColor: Colors.grey.shade700,
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
