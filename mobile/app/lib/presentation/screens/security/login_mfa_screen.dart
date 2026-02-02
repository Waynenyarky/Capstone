import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/bizclear_colors.dart';
import '../../../data/services/mongodb_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../deletion_scheduled_page.dart';
import '../profile.dart';
import '../inspector/inspector_shell.dart';

class LoginMfaScreen extends StatefulWidget {
  final String email;
  /// When true, uses email OTP verification (login/verify). When false, uses TOTP (login/verify-totp).
  final bool isEmailOtp;
  const LoginMfaScreen({super.key, required this.email, this.isEmailOtp = false});

  @override
  State<LoginMfaScreen> createState() => _LoginMfaScreenState();
}

class _LoginMfaScreenState extends State<LoginMfaScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String? _errorMessage;
  bool _resendLoading = false;
  int _resendCooldownSec = 0;
  Timer? _resendTimer;

  @override
  void dispose() {
    _resendTimer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _otpCode => _controllers.map((c) => c.text).join();

  bool get _isOtpComplete => _otpCode.length == 6;

  void _clearOtp() {
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _resendCode() async {
    if (_resendLoading || _resendCooldownSec > 0) return;
    setState(() => _resendLoading = true);
    try {
      final res = await MongoDBService.loginResendOtp(email: widget.email);
      if (!mounted) return;
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text((res['message'] ?? 'Verification code sent to your email').toString()),
            backgroundColor: Colors.green,
          ),
        );
        setState(() => _resendCooldownSec = 60);
        _resendTimer?.cancel();
        _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
          if (!mounted) {
            t.cancel();
            return;
          }
          setState(() {
            _resendCooldownSec = (_resendCooldownSec - 1).clamp(0, 60);
            if (_resendCooldownSec <= 0) t.cancel();
          });
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text((res['message'] ?? 'Failed to resend').toString()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to resend code'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _resendLoading = false);
    }
  }

  void _handleBulkPaste(String value, int _) {
    final digits = value.replaceAll(RegExp('[^0-9]'), '');
    if (digits.isEmpty) return;
    for (int i = 0; i < 6 && i < digits.length; i++) {
      _controllers[i].text = digits[i];
    }
    if (digits.length >= 6) {
      _focusNodes[5].unfocus();
    } else {
      _focusNodes[digits.length.clamp(0, 5)].requestFocus();
    }
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final code = _otpCode;
      if (code.length != 6) {
        setState(() {
          _loading = false;
          _errorMessage = 'Please enter all 6 digits';
        });
        return;
      }
      final verify = widget.isEmailOtp
          ? await MongoDBService.loginVerifyOtp(email: widget.email, code: code)
          : await MongoDBService.loginVerifyTotp(email: widget.email, code: code);
      if (verify['success'] == true) {
        final user = (verify['user'] is Map<String, dynamic>) ? (verify['user'] as Map<String, dynamic>) : <String, dynamic>{};
        final firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
        final lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
        final email = (user['email'] is String) ? user['email'] as String : '';
        final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
        final avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
        final token = (user['token'] is String) ? user['token'] as String : '';
        try {
          final prefs = await SharedPreferences.getInstance();
          if (email.isNotEmpty) {
            await prefs.setString('loggedInEmail', email.toLowerCase());
            await prefs.setString('lastLoginEmail', email.toLowerCase());
            await prefs.remove('disableAutoBiometricOnce');
          }
          if (token.isNotEmpty) {
            await prefs.setString('accessToken', token);
          }
        } catch (_) {}
        if (!mounted) return;
        final navigator = Navigator.of(context);
        final profileRes = await MongoDBService.fetchProfile(email: email, token: token);
        final profileUser = (profileRes['user'] is Map<String, dynamic>) ? (profileRes['user'] as Map<String, dynamic>) : <String, dynamic>{};
        final role = (profileUser['role'] is String) ? (profileUser['role'] as String).toLowerCase() : '';
        if (role != 'inspector') {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('accessToken');
          await prefs.remove('loggedInEmail');
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('This app is for Inspector role only. Please use an Inspector account.'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
        final pending = profileRes['deletionPending'] == true;
        final scheduledISO = (profileRes['deletionScheduledFor'] is String) ? profileRes['deletionScheduledFor'] as String : null;
        if (pending && scheduledISO != null) {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => DeletionScheduledPage(
                email: email,
                scheduledISO: scheduledISO,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                token: token,
                avatarUrl: avatarUrl,
              ),
            ),
            (route) => false,
          );
          return;
        }
        navigator.pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => InspectorShell(
              email: email,
              firstName: firstName,
              lastName: lastName,
              phoneNumber: phoneNumber,
              token: token,
              avatarUrl: avatarUrl,
            ),
          ),
          (route) => false,
        );
      } else {
        final msg = (verify['message'] is String) ? verify['message'] as String : 'Invalid verification code';
        setState(() => _errorMessage = msg);
        _clearOtp();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
      }
    } catch (e) {
      setState(() => _errorMessage = 'Connection error');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connection error: ${e.toString()}'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BizClearColors.background,
      appBar: AppBar(
        backgroundColor: BizClearColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: BizClearColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.isEmailOtp ? 'Email Verification' : 'Two-Factor Authentication',
          style: const TextStyle(color: BizClearColors.textPrimary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              const Text(
                'Verify Your Identity',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: BizClearColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.isEmailOtp
                    ? 'Enter the 6-digit code sent to your email'
                    : 'Enter the 6-digit code from your TOTP authenticator',
                style: const TextStyle(
                  fontSize: 16,
                  color: BizClearColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: BizClearColors.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.email_outlined, size: 16, color: BizClearColors.accent),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        widget.email,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: BizClearColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // OTP Input Boxes - responsive layout
              LayoutBuilder(
                builder: (context, constraints) {
                  const spacing = 8.0;
                  final available = constraints.maxWidth;
                  final boxSize = ((available - spacing * 5) / 6).clamp(40.0, 56.0);
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(6, (index) {
                      return _OtpBox(
                        size: boxSize,
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        hasError: _errorMessage != null,
                        onChanged: (value) {
                          setState(() => _errorMessage = null);
                          final digits = value.replaceAll(RegExp('[^0-9]'), '');
                          if (digits.length > 1) {
                            _handleBulkPaste(digits, index);
                            return;
                          }
                          if (digits.isEmpty) {
                            _controllers[index].text = '';
                            if (index > 0) _focusNodes[index - 1].requestFocus();
                            return;
                          }
                          _controllers[index].text = digits[0];
                          if (index < 5) {
                            _focusNodes[index + 1].requestFocus();
                          } else {
                            FocusScope.of(context).unfocus();
                          }
                        },
                      );
                    }),
                  );
                },
              ),

              // Error Message
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.error_outline, color: BizClearColors.error, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: BizClearColors.error,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 32),

              // Info Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: BizClearColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: BizClearColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: BizClearColors.accent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.shield_outlined,
                        color: BizClearColors.accent,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Secure Login',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: BizClearColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.isEmailOtp
                                ? 'Check your email for the verification code'
                                : 'Check your TOTP authenticator for the verification code',
                            style: const TextStyle(
                              fontSize: 13,
                              color: BizClearColors.textSecondary,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _loading || !_isOtpComplete ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: BizClearColors.primary,
                    foregroundColor: BizClearColors.buttonPrimaryFg,
                    disabledBackgroundColor: BizClearColors.border,
                    disabledForegroundColor: BizClearColors.textSecondary,
                    elevation: 3,
                    shadowColor: BizClearColors.accent.withValues(alpha: 0.2),
                    side: const BorderSide(color: BizClearColors.primaryLight, width: 1.2),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: _loading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.verified, size: 22),
                  label: const Text(
                    'Verify & Continue',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Resend (email OTP) or Help (TOTP)
              if (widget.isEmailOtp)
                Center(
                  child: TextButton.icon(
                    onPressed: (_resendLoading || _resendCooldownSec > 0) ? null : _resendCode,
                    style: TextButton.styleFrom(
                      foregroundColor: BizClearColors.accent,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    icon: _resendLoading
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: BizClearColors.accent,
                            ),
                          )
                        : Icon(Icons.refresh, size: 18, color: _resendCooldownSec > 0 ? BizClearColors.textSecondary : BizClearColors.accent),
                    label: Text(
                      _resendCooldownSec > 0
                          ? 'Resend code in ${_resendCooldownSec}s'
                          : 'Resend verification code',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _resendCooldownSec > 0 ? BizClearColors.textSecondary : BizClearColors.accent,
                      ),
                    ),
                  ),
                )
              else
                Center(
                  child: Column(
                    children: [
                      const Text(
                        'Having trouble?',
                        style: TextStyle(
                          fontSize: 14,
                          color: BizClearColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          // Add help action here
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: BizClearColors.accent,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text(
                          'Contact Support',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// OTP Box Widget
class _OtpBox extends StatelessWidget {
  final double size;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasError;
  final Function(String) onChanged;

  const _OtpBox({
    required this.size,
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final height = size * 1.2;
    return SizedBox(
      width: size,
      height: height,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.oneTimeCode],
        style: TextStyle(
          fontSize: (size * 0.5).clamp(18.0, 26.0),
          fontWeight: FontWeight.bold,
          color: BizClearColors.textPrimary,
        ),
        decoration: InputDecoration(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: hasError ? BizClearColors.error : BizClearColors.inputBorder,
              width: hasError ? 2 : 1.5,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: hasError ? BizClearColors.error : BizClearColors.inputBorder,
              width: hasError ? 2 : 1.5,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: hasError ? BizClearColors.error : BizClearColors.inputFocusedBorder,
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
        onChanged: onChanged,
      ),
    );
  }
}
