import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/data/services/mongodb_service.dart';

class ChangePasswordOtpPage extends StatefulWidget {
  final String email;
  final String token;
  final String currentPassword;
  final String newPassword;
  final bool alreadySent;
  final String? devCode;
  const ChangePasswordOtpPage({
    super.key,
    required this.email,
    required this.token,
    required this.currentPassword,
    required this.newPassword,
    this.alreadySent = false,
    this.devCode,
  });
  @override
  State<ChangePasswordOtpPage> createState() => _ChangePasswordOtpPageState();
}

class _ChangePasswordOtpPageState extends State<ChangePasswordOtpPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _verifying = false;
  bool _resending = false;
  String? _errorMessage;
  bool _serverMode = false;
  String? _code;
  late DateTime _expiresAt;
  Timer? _timer;
  Duration _remaining = const Duration(minutes: 10);
  int _attemptsLeft = 5;
  int _cooldownSec = 0;
  String? _resendMessage;
  bool _resendSuccess = false;
  bool _successShown = false;

  String get _otpCode => _controllers.map((c) => c.text).join();
  bool get _isComplete => _otpCode.length == 6;

  @override
  void initState() {
    super.initState();
    if (widget.alreadySent) {
      _serverMode = true;
      _expiresAt = DateTime.now().add(const Duration(minutes: 10));
      _startTimer();
      _cooldownSec = 60;
      setState(() {});
    } else {
      _generateAndSendCode();
    }
  }

  @override
  void dispose() {
    for (var c in _controllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _generateAndSendCode() async {
    _expiresAt = DateTime.now().add(const Duration(minutes: 10));
    _startTimer();
    _cooldownSec = 60;
    _serverMode = true;
    setState(() {
      _errorMessage = null;
    });
    final messenger = ScaffoldMessenger.of(context);
    try {
      final res = await MongoDBService.resetStart(email: widget.email);
      if (res['success'] == true) {
        if (_resending) {
          setState(() {
            _resendMessage = 'Verification code sent via email';
            _resendSuccess = true;
          });
        } else {
          messenger.showSnackBar(const SnackBar(
            content: Text('Verification code sent via email'),
            backgroundColor: Colors.green,
          ));
        }
      } else {
        final msg = (res['message'] is String) ? res['message'] as String : 'Failed to send verification code';
        if (_resending) {
          setState(() {
            _resendMessage = msg;
            _resendSuccess = false;
          });
        } else {
          messenger.showSnackBar(SnackBar(content: Text(msg)));
        }
        setState(() => _errorMessage = msg.toLowerCase().contains('smtp not configured')
            ? 'Email delivery is not configured on the server.'
            : 'Unable to send OTP. Try again or check email settings.');
      }
    } catch (e) {
      if (_resending) {
        setState(() {
          _resendMessage = 'Connection error: ${e.toString()}';
          _resendSuccess = false;
        });
      } else {
        messenger.showSnackBar(SnackBar(content: Text('Connection error: ${e.toString()}')));
      }
      setState(() => _errorMessage = 'Unable to send OTP. Try again or check email settings.');
    }
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

  void _clearOtp() {
    for (var c in _controllers) {
      c.clear();
    }
    _focusNodes.first.requestFocus();
  }

  Future<void> _verify() async {
    if (!_isComplete) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      return;
    }
    if (_remaining == Duration.zero) {
      setState(() => _errorMessage = 'Code expired. Resend to try again');
      return;
    }
    if (_attemptsLeft <= 0) return;
    if (!_serverMode) {
      if (_code == null || _code!.isEmpty) {
        setState(() => _errorMessage = 'Code not generated. Please resend the code.');
        return;
      }
      if (_otpCode != _code) {
        setState(() {
          _attemptsLeft = (_attemptsLeft > 0) ? _attemptsLeft - 1 : 0;
          _errorMessage = 'Invalid verification code';
        });
        _clearOtp();
        return;
      }
    }
    setState(() {
      _verifying = true;
      _errorMessage = null;
    });
    try {
      final messenger = ScaffoldMessenger.of(context);
      String? resetToken;
      if (_serverMode) {
        final v = await MongoDBService.resetVerifyCode(email: widget.email, code: _otpCode);
        if (v['success'] != true) {
          setState(() {
            _verifying = false;
            _attemptsLeft = (_attemptsLeft > 0) ? _attemptsLeft - 1 : 0;
            _errorMessage = (v['message'] is String) ? v['message'] as String : 'Invalid verification code';
          });
          _clearOtp();
          return;
        }
        resetToken = (v['resetToken'] is String) ? v['resetToken'] as String : null;
      }
      final res = await MongoDBService.resetChangePassword(
        email: widget.email,
        resetToken: resetToken ?? '',
        newPassword: widget.newPassword,
      );
      final ok = res['success'] == true;
      if (ok) {
        if (!_successShown) {
          messenger.showSnackBar(SnackBar(
            content: Text((res['message'] is String) ? res['message'] as String : 'Password changed successfully'),
            backgroundColor: Colors.green,
          ));
          _successShown = true;
        }
        if (!mounted) return;
        Navigator.of(context).pop(true);
      } else {
        messenger.showSnackBar(SnackBar(content: Text((res['message'] is String) ? res['message'] as String : 'Password update failed')));
        setState(() => _verifying = false);
      }
    } catch (e) {
      setState(() {
        _verifying = false;
        _errorMessage = 'Connection error: ${e.toString()}';
      });
    }
  }

  Future<void> _resend() async {
    if (_cooldownSec > 0) return;
    setState(() => _resending = true);
    await _generateAndSendCode();
    setState(() => _resending = false);
    _clearOtp();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 360;
    final hPad = isSmall ? 16.0 : 24.0;
    final titleSize = isSmall ? 24.0 : 26.0;
    final subtitleSize = isSmall ? 14.0 : 15.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(hPad),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.blue.shade50, shape: BoxShape.circle),
              child: Icon(Icons.mail_outline, size: 56, color: Colors.blue.shade700),
            ),
            const SizedBox(height: 16),
            Text(
              'For your security, enter the One-Time Password sent to you',
              style: TextStyle(fontSize: titleSize, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'We sent a 6-digit code to your current login account',
              style: TextStyle(fontSize: subtitleSize, color: Colors.grey.shade700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              widget.email,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
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
                        controller: _controllers[i],
                        focusNode: _focusNodes[i],
                        hasError: _errorMessage != null,
                        onChanged: (v) {
                          if (v.isNotEmpty && i < 5) {
                            _focusNodes[i + 1].requestFocus();
                          } else if (v.isEmpty && i > 0) {
                            _focusNodes[i - 1].requestFocus();
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
            if (_errorMessage != null)
              Text(
                _errorMessage!,
                style: const TextStyle(color: Colors.red, fontSize: 14),
              ),
            const SizedBox(height: 16),
            Text(
              'Attempts remaining: $_attemptsLeft',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Text(
              'Code expires in ${_fmt(_remaining)}',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: isSmall ? 48 : 52,
              child: ElevatedButton(
                onPressed: _verifying ? null : _verify,
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _verifying
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                    : const Text('Verify and Change Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: isSmall ? 48 : 52,
              child: OutlinedButton(
                onPressed: (_cooldownSec > 0 || _resending) ? null : _resend,
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_cooldownSec > 0 ? 'Resend in ${_cooldownSec}s' : 'Resend Code', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
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
            const SizedBox(height: 24),
            Center(
              child: Text(
                'Didn\'t receive the code? Check your spam folder\nMake sure your email is correct.',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600, height: 1.5),
                textAlign: TextAlign.center,
              ),
            ),
              ],
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
  final Function(String) onChanged;
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
      width: 48,
      height: 56,
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
