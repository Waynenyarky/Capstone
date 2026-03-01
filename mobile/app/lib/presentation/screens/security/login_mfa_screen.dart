import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../core/theme/bizclear_colors.dart';
import '../../../data/services/mongodb_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../deletion_scheduled_page.dart';
import '../inspector/inspector_shell.dart';
import '../inspector/inspector_onboarding_screen.dart';

class LoginMfaScreen extends StatefulWidget {
  final String email;
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
    for (var c in _controllers) {
      c.dispose();
    }
    for (var n in _focusNodes) {
      n.dispose();
    }
    super.dispose();
  }

  String get _otpCode => _controllers.map((c) => c.text).join();
  bool get _isOtpComplete => _otpCode.length == 6;

  void _clearOtp() {
    for (var c in _controllers) {
      c.clear();
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
            content: Text((res['message'] ?? 'Code sent').toString()),
            backgroundColor: BizClearColors.success,
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
            backgroundColor: BizClearColors.error,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to resend'), backgroundColor: BizClearColors.error),
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
          _errorMessage = 'Enter all 6 digits';
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
              content: Text('This app is for inspectors only. Please use the web portal for other roles.'),
              backgroundColor: BizClearColors.error,
              duration: Duration(seconds: 5),
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
        final mustChange = profileUser['mustChangeCredentials'] == true;
        final mustMfa = profileUser['mustSetupMfa'] == true;
        if (mustChange || mustMfa) {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => InspectorOnboardingScreen(
                email: email,
                token: token,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                avatarUrl: avatarUrl,
                mustChangeCredentials: mustChange,
                mustSetupMfa: mustMfa,
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
        final msg = (verify['message'] is String) ? verify['message'] as String : 'Invalid code';
        setState(() => _errorMessage = msg);
        _clearOtp();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: BizClearColors.error));
      }
    } catch (e) {
      setState(() => _errorMessage = 'Connection error');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connection error'), backgroundColor: BizClearColors.error),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmallScreen = size.width < 360;
    final horizontalPadding = isSmallScreen ? 16.0 : 24.0;
    final verticalPadding = isSmallScreen ? 16.0 : 20.0;
    final titleFontSize = isSmallScreen ? 18.0 : 20.0;
    final subtitleFontSize = isSmallScreen ? 14.0 : 16.0;
    final spacing = isSmallScreen ? 14.0 : 18.0;
    final largeSpacing = isSmallScreen ? 24.0 : 28.0;
    final iconSize = isSmallScreen ? 72.0 : 88.0;

    return Scaffold(
      backgroundColor: BizClearColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: BizClearColors.textPrimary),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: verticalPadding),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 500),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: SvgPicture.asset(
                            'assets/bizclear_logo.svg',
                            height: iconSize,
                            width: iconSize,
                            fit: BoxFit.contain,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Enter code',
                          style: TextStyle(
                            fontSize: titleFontSize,
                            fontWeight: FontWeight.bold,
                            color: BizClearColors.textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.isEmailOtp
                              ? 'We sent a 6-digit code to your email.'
                              : 'Enter the 6-digit code from your authenticator app.',
                          style: TextStyle(
                            fontSize: subtitleFontSize,
                            color: BizClearColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: largeSpacing),

                        LayoutBuilder(
                          builder: (context, constraints) {
                            const gap = 8.0;
                            final w = constraints.maxWidth;
                            final boxSize = ((w - gap * 5) / 6).clamp(40.0, 52.0);
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

                        if (_errorMessage != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: BizClearColors.error,
                              fontSize: 14,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],

                        SizedBox(height: _errorMessage != null ? 16 : largeSpacing),

                        ElevatedButton(
                          onPressed: (_loading || !_isOtpComplete) ? null : _verify,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: BizClearColors.webPrimary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 2,
                            padding: BizClearColors.primaryButtonPadding,
                            minimumSize: BizClearColors.primaryButtonMinimumSize,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            textStyle: BizClearColors.primaryButtonTextStyle,
                          ),
                          child: _loading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Text('Verify', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        ),

                        if (widget.isEmailOtp) ...[
                          const SizedBox(height: 16),
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
                                  : Icon(
                                      Icons.refresh,
                                      size: 18,
                                      color: _resendCooldownSec > 0 ? BizClearColors.textSecondary : BizClearColors.accent,
                                    ),
                              label: Text(
                                _resendCooldownSec > 0
                                    ? 'Resend code in ${_resendCooldownSec}s'
                                    : 'Resend verification code',
                                style: TextStyle(
                                  fontSize: subtitleFontSize,
                                  fontWeight: FontWeight.w600,
                                  color: _resendCooldownSec > 0 ? BizClearColors.textSecondary : BizClearColors.accent,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

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
    return SizedBox(
      width: size,
      height: size * 1.1,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.oneTimeCode],
        style: TextStyle(
          fontSize: (size * 0.45).clamp(16.0, 22.0),
          fontWeight: FontWeight.w600,
          color: BizClearColors.textPrimary,
        ),
        decoration: InputDecoration(
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: hasError ? BizClearColors.error : BizClearColors.inputBorder,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: hasError ? BizClearColors.error : BizClearColors.inputBorder,
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
