import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:app/data/services/mongodb_service.dart';

class ForgotPasswordPage extends StatefulWidget {
  final String? prefillEmail;
  const ForgotPasswordPage({super.key, this.prefillEmail});
  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _newPwdController = TextEditingController();
  final _confirmPwdController = TextEditingController();
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  bool _sending = false;
  bool _verifying = false;
  bool _resetting = false;
  bool _resending = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  int _step = 1;
  String? _errorText;
  String? _resetToken;
  late DateTime _expiresAt;
  Timer? _timer;
  Duration _remaining = const Duration(minutes: 10);
  int _attemptsLeft = 5;
  int _cooldownSec = 0;
  String? _resendMessage;
  bool _resendSuccess = false;

  String _humanizeError(String raw) {
    final s = (raw).toLowerCase();
    if (s.contains('email not found')) return 'We couldn’t find an account with that email.';
    if (s.contains('request timeout')) return 'The request took too long. Please check your connection and try again.';
    if (s.contains('server unavailable')) return 'Our servers are unavailable. Please try again in a moment.';
    if (s.contains('connection error') || s.contains('failed to connect')) return 'We couldn’t reach the server. Please check your internet connection.';
    if (s.contains('smtp') || s.contains('email delivery')) return 'We couldn’t send the email right now. Please try again later.';
    if (s.contains('invalid') && s.contains('email')) return 'Please enter a valid email address.';
    return 'Something went wrong. Please try again.';
  }

  bool _hasNumber(String s) => RegExp(r'\d').hasMatch(s);
  bool _hasLower(String s) => RegExp(r'[a-z]').hasMatch(s);
  bool _hasUpper(String s) => RegExp(r'[A-Z]').hasMatch(s);
  bool _hasSpecial(String s) => RegExp(r'[^A-Za-z0-9]').hasMatch(s);
  bool _meetsPasswordReqs(String s) =>
      s.length >= 8 && _hasNumber(s) && _hasLower(s) && _hasUpper(s) && _hasSpecial(s);

  @override
  void initState() {
    super.initState();
    final s = (widget.prefillEmail ?? '').trim();
    if (s.isNotEmpty) _emailController.text = s;
    _expiresAt = DateTime.now().add(const Duration(minutes: 10));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _newPwdController.dispose();
    _confirmPwdController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  InputDecoration _decoration(String label, IconData icon, {Widget? suffix}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      suffixIcon: suffix,
      errorMaxLines: 3,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Colors.blue, width: 2)),
      errorBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Colors.red, width: 1.5)),
      focusedErrorBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Colors.red, width: 2)),
      filled: true,
      fillColor: Colors.grey.shade50,
    );
  }

  String get _otpCode => _otpControllers.map((c) => c.text).join();
  void _clearOtp() {
    for (final c in _otpControllers) {
      c.clear();
    }
    _otpFocusNodes.first.requestFocus();
  }
  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final now = DateTime.now();
      final diff = _expiresAt.difference(now);
      if (diff.isNegative) {
        _timer?.cancel();
        setState(() => _remaining = Duration.zero);
      } else {
        setState(() => _remaining = diff);
      }
      if (_cooldownSec > 0) {
        setState(() => _cooldownSec--);
      }
    });
  }
  String _fmt(Duration d) {
    final total = d.inSeconds;
    final m = (total ~/ 60).toString().padLeft(2, '0');
    final s = (total % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _sendCode() async {
    if (_sending) return;
    setState(() {
      _sending = true;
      _errorText = null;
    });
    try {
      final messenger = ScaffoldMessenger.of(context);
      final netOk = await MongoDBService.isNetworkAvailable();
      if (!netOk) {
        setState(() {
          _sending = false;
          _errorText = _humanizeError('No internet connection');
        });
        return;
      }
      final health = await MongoDBService.serverHealth(timeout: const Duration(seconds: 4));
      if (health['ok'] != true) {
        setState(() {
          _sending = false;
          _errorText = _humanizeError('Server unavailable');
        });
        return;
      }
      final res = await MongoDBService.resetStart(email: _emailController.text.trim());
      if (res['success'] == true) {
        setState(() {
          _sending = false;
          _step = 2;
          _expiresAt = DateTime.now().add(const Duration(minutes: 10));
          _cooldownSec = 60;
        });
        messenger.showSnackBar(const SnackBar(content: Text('Verification code sent')));
        _startTimer();
        _otpFocusNodes.first.requestFocus();
      } else {
        setState(() {
          _sending = false;
          _errorText = _humanizeError((res['message'] is String) ? res['message'] as String : 'Failed to send verification code');
        });
      }
    } catch (e) {
      setState(() {
        _sending = false;
        _errorText = _humanizeError(e.toString());
      });
    }
  }

  Future<void> _verifyCode() async {
    if (_verifying) return;
    if (_otpCode.length != 6) {
      setState(() => _errorText = 'Please enter all 6 digits');
      return;
    }
    setState(() {
      _verifying = true;
      _errorText = null;
    });
    try {
      final netOk = await MongoDBService.isNetworkAvailable();
      if (!netOk) {
        setState(() {
          _verifying = false;
          _errorText = _humanizeError('No internet connection');
        });
        return;
      }
      final health = await MongoDBService.serverHealth(timeout: const Duration(seconds: 4));
      if (health['ok'] != true) {
        setState(() {
          _verifying = false;
          _errorText = _humanizeError('Server unavailable');
        });
        return;
      }
      final v = await MongoDBService.resetVerifyCode(email: _emailController.text.trim(), code: _otpCode);
      if (v['success'] == true && v['resetToken'] is String) {
        setState(() {
          _verifying = false;
          _resetToken = v['resetToken'] as String;
          _step = 3;
        });
      } else {
        setState(() {
          _verifying = false;
          _attemptsLeft = (_attemptsLeft > 0) ? _attemptsLeft - 1 : 0;
          _errorText = _humanizeError((v['message'] is String) ? v['message'] as String : 'Invalid verification code');
        });
        _clearOtp();
      }
    } catch (e) {
      setState(() {
        _verifying = false;
        _errorText = _humanizeError(e.toString());
      });
    }
  }

  Future<void> _resend() async {
    if (_cooldownSec > 0 || _resending) return;
    setState(() {
      _resending = true;
      _resendMessage = null;
      _resendSuccess = false;
    });
    await _sendCode();
    setState(() {
      _resending = false;
      _resendMessage = _errorText ?? 'Code sent';
      _resendSuccess = _errorText == null;
    });
    _clearOtp();
  }

  Future<void> _resetPassword() async {
    if (_resetting) return;
    final newPwd = _newPwdController.text;
    final confirmPwd = _confirmPwdController.text;
    final ok = newPwd.isNotEmpty && confirmPwd.isNotEmpty && newPwd == confirmPwd && _meetsPasswordReqs(newPwd);
    if (!ok) return;
    if ((_resetToken ?? '').isEmpty) {
      setState(() => _errorText = 'Verification not completed yet');
      return;
    }
    setState(() {
      _resetting = true;
      _errorText = null;
    });
    try {
      final messenger = ScaffoldMessenger.of(context);
      final netOk = await MongoDBService.isNetworkAvailable();
      if (!netOk) {
        setState(() {
          _resetting = false;
          _errorText = _humanizeError('No internet connection');
        });
        return;
      }
      final health = await MongoDBService.serverHealth(timeout: const Duration(seconds: 4));
      if (health['ok'] != true) {
        setState(() {
          _resetting = false;
          _errorText = _humanizeError('Server unavailable');
        });
        return;
      }
      final res = await MongoDBService.resetChangePassword(
        email: _emailController.text.trim(),
        resetToken: _resetToken ?? '',
        newPassword: newPwd,
      );
      if (res['success'] == true) {
        messenger.showSnackBar(SnackBar(
          content: Text((res['message'] is String) ? res['message'] as String : 'Password changed successfully'),
          backgroundColor: Colors.green,
        ));
        if (!mounted) return;
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _resetting = false;
          _errorText = _humanizeError((res['message'] is String) ? res['message'] as String : 'Password update failed');
        });
      }
    } catch (e) {
      setState(() {
        _resetting = false;
        _errorText = _humanizeError(e.toString());
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 360;
    final isMedium = size.width >= 360 && size.width < 600;
    final hPad = isSmall ? 16.0 : (isMedium ? 24.0 : 32.0);
    final vPad = isSmall ? 16.0 : 20.0;
    final titleSize = isSmall ? 26.0 : 30.0;
    final subtitleSize = isSmall ? 14.0 : 16.0;

    return Scaffold(
      appBar: AppBar(title: const Text('Forgot Password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.blue.shade50, shape: BoxShape.circle),
                      child: const Icon(Icons.lock_reset, size: 80, color: Colors.blue),
                    ),
                    const SizedBox(height: 24),
                    Text('Reset Your Password', style: TextStyle(fontSize: titleSize, fontWeight: FontWeight.bold, color: Colors.black87), textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    Text('Enter your account email to receive a verification code', style: TextStyle(fontSize: subtitleSize, color: Colors.grey.shade600), textAlign: TextAlign.center),
                    const SizedBox(height: 24),

                    if (_step == 1) ...[
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9._@+\-]')),
                          LengthLimitingTextInputFormatter(254),
                        ],
                        decoration: _decoration('Email', Icons.email_outlined),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Please enter your email';
                          final ok = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
                          if (!ok) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _sending ? null : () {
                          if (!_formKey.currentState!.validate()) return;
                          _sendCode();
                        },
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                        ),
                        child: _sending
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                            : const Text('Send Code'),
                      ),
                    ),
                    if (_errorText != null && _step == 1) ...[
                      const SizedBox(height: 12),
                      Text(_errorText!, style: const TextStyle(color: Colors.red)),
                    ],
                  ],

                    if (_step == 2) ...[
                      Text('Enter the 6-digit code sent to your email', style: TextStyle(fontSize: subtitleSize, color: Colors.grey.shade700)),
                      const SizedBox(height: 16),
                      LayoutBuilder(
                        builder: (ctx, constraints) {
                          final maxW = constraints.maxWidth;
                          final spacing = isSmall ? 6.0 : 8.0;
                          final target = isSmall ? 44.0 : 52.0;
                          final available = maxW - (spacing * 5);
                          final calc = (available / 6).clamp(36.0, target);
                          final boxW = calc;
                          final boxH = isSmall ? (calc * 1.25) : (calc * 1.15);
                          return Wrap(
                            alignment: WrapAlignment.center,
                            spacing: spacing,
                            runSpacing: spacing,
                            children: List.generate(6, (i) {
                              return SizedBox(
                                width: boxW,
                                height: boxH,
                                child: _OtpBox(
                                  controller: _otpControllers[i],
                                  focusNode: _otpFocusNodes[i],
                                  hasError: _errorText != null,
                                  onChanged: (v) {
                                    if (v.isNotEmpty && i < 5) {
                                      _otpFocusNodes[i + 1].requestFocus();
                                    } else if (v.isEmpty && i > 0) {
                                      _otpFocusNodes[i - 1].requestFocus();
                                    }
                                    setState(() {});
                                  },
                                ),
                              );
                            }),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      if (_errorText != null)
                        Text(
                          _errorText!,
                          style: const TextStyle(color: Colors.red, fontSize: 14),
                        ),
                      const SizedBox(height: 16),
                      Text('Attempts remaining: $_attemptsLeft', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Text('Code expires in ${_fmt(_remaining)}', style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _verifying ? null : _verifyCode,
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 2,
                          ),
                          child: _verifying
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                              : const Text('Verify Code'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 52,
                        child: OutlinedButton(
                          onPressed: (_cooldownSec > 0 || _resending) ? null : _resend,
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _resending
                              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                              : Text(_cooldownSec > 0 ? 'Resend in ${_cooldownSec}s' : 'Resend Code', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      if (_resendMessage != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _resendMessage!,
                          style: TextStyle(fontSize: 14, color: _resendSuccess ? Colors.green : Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],

                    if (_step == 3) ...[
                      TextFormField(
                        controller: _newPwdController,
                        obscureText: _obscureNew,
                        decoration: _decoration(
                          'New Password',
                          Icons.lock,
                          suffix: _newPwdController.text.isNotEmpty
                              ? IconButton(
                                  icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility),
                                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                                )
                              : null,
                        ).copyWith(
                          hintText: 'Enter new password',
                          errorStyle: const TextStyle(height: 0, color: Colors.transparent),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedErrorBorder: const OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide(color: Colors.blue, width: 2),
                          ),
                        ),
                        validator: (v) => null,
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      Builder(builder: (ctx) {
                        final s = _newPwdController.text;
                        if (s.isEmpty) return const SizedBox.shrink();
                        final size = Theme.of(ctx).textTheme.bodyMedium?.fontSize ?? 14;
                        final items = <Map<String, dynamic>>[
                          {'label': 'At least 8 characters', 'ok': s.length >= 8},
                          {'label': 'At least 1 number', 'ok': _hasNumber(s)},
                          {'label': 'At least 1 lowercase', 'ok': _hasLower(s)},
                          {'label': 'At least 1 uppercase', 'ok': _hasUpper(s)},
                          {'label': 'At least 1 special character', 'ok': _hasSpecial(s)},
                        ];
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Password Requirements:',
                              style: TextStyle(
                                fontSize: size,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: items.map((it) {
                                  final ok = it['ok'] as bool;
                                  final label = it['label'] as String;
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 3),
                                    child: Row(
                                      children: [
                                        Icon(
                                          ok ? Icons.check_circle : Icons.close,
                                          size: 18,
                                          color: ok ? Colors.green : Colors.red,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          label,
                                          style: TextStyle(
                                            fontSize: size - 1,
                                            color: ok ? Colors.green.shade700 : Colors.red,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        );
                      }),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _confirmPwdController,
                        obscureText: _obscureConfirm,
                        decoration: _decoration(
                          'Confirm New Password',
                          Icons.lock,
                          suffix: _confirmPwdController.text.isNotEmpty
                              ? IconButton(
                                  icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                                )
                              : null,
                        ).copyWith(
                          hintText: 'Re-enter new password',
                          errorStyle: const TextStyle(height: 0, color: Colors.transparent),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedErrorBorder: const OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide(color: Colors.blue, width: 2),
                          ),
                        ),
                        validator: (v) => null,
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 20),
                      if (_newPwdController.text.isNotEmpty && _confirmPwdController.text.isNotEmpty)
                        Row(
                          children: [
                            Icon(
                              (_confirmPwdController.text == _newPwdController.text) ? Icons.check_circle : Icons.radio_button_unchecked,
                              size: 18,
                              color: (_confirmPwdController.text == _newPwdController.text) ? Colors.green : Colors.grey.shade500,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              (_confirmPwdController.text == _newPwdController.text) ? 'Passwords match' : 'Passwords do not match',
                              style: TextStyle(
                                fontSize: subtitleSize - 2,
                                color: (_confirmPwdController.text == _newPwdController.text) ? Colors.green.shade700 : Colors.grey.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _resetting ? null : () {
                            if (!_formKey.currentState!.validate()) return;
                            _resetPassword();
                          },
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 2,
                          ),
                          child: _resetting
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                              : const Text('Reset Password'),
                        ),
                      ),
                      if (_errorText != null) ...[
                        const SizedBox(height: 12),
                        Text(_errorText!, style: const TextStyle(color: Colors.red)),
                      ],
                    ],

                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasError;
  final void Function(String v) onChanged;
  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) {
    final isFocused = focusNode.hasFocus;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasError ? Colors.red : (isFocused ? Colors.blue : Colors.grey.shade300),
          width: hasError || isFocused ? 2 : 1.5,
        ),
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
        decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero),
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(1),
        ],
        onChanged: onChanged,
      ),
    );
  }
}
