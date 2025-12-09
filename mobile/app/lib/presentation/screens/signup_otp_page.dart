import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../domain/usecases/verify_signup_code.dart';
import '../../domain/usecases/send_signup_code.dart';
import 'login_page.dart';

class SignupOtpPage extends StatefulWidget {
  final String email;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String password;
  final bool termsAccepted;
  final int maxAttempts;
  final int cooldownSec;
  final int ttlMin;
  const SignupOtpPage({
    super.key,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.password,
    required this.termsAccepted,
    this.maxAttempts = 5,
    this.cooldownSec = 60,
    this.ttlMin = 10,
  });

  @override
  State<SignupOtpPage> createState() => _SignupOtpPageState();
}

class _SignupOtpPageState extends State<SignupOtpPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  int _attemptsLeft = 0;
  int _cooldownLeft = 0;
  bool _verifying = false;
  bool _resending = false;
  String? _errorMessage;
  late final VerifySignupCode _verifyUsecase;
  late final SendSignupCode _sendUsecase;

  @override
  void initState() {
    super.initState();
    _attemptsLeft = widget.maxAttempts;
    _cooldownLeft = 0;
    _verifyUsecase = VerifySignupCode();
    _sendUsecase = SendSignupCode();
  }

  @override
  void dispose() {
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

  Future<void> _verify() async {
    final code = _otpCode;
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      return;
    }
    if (_attemptsLeft <= 0) return;

    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      setState(() {
        _verifying = true;
        _errorMessage = null;
      });

      final res = await _verifyUsecase.call(email: widget.email, code: code);
      final ok = res['success'] == true;

      if (ok) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Account created successfully! Ready for login.'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        if (!mounted) return;
        navigator.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      } else {
        setState(() {
          _attemptsLeft = (_attemptsLeft > 0) ? _attemptsLeft - 1 : 0;
          _errorMessage = 'Invalid verification code';
        });
        _clearOtp();
        messenger.showSnackBar(
          SnackBar(
            content: Text((res['message'] is String) ? res['message'] as String : 'Verification failed'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    if (_cooldownLeft > 0) return;

    final messenger = ScaffoldMessenger.of(context);

    try {
      setState(() {
        _resending = true;
      });

      final sent = await _sendUsecase.call(
        firstName: widget.firstName,
        lastName: widget.lastName,
        email: widget.email,
        phoneNumber: widget.phoneNumber,
        password: widget.password,
        termsAccepted: widget.termsAccepted,
      );

      if (sent['success'] == true) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('New verification code sent'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() {
          _cooldownLeft = widget.cooldownSec;
          _errorMessage = null;
        });
        _clearOtp();
        _startCooldownTimer();
      } else {
        messenger.showSnackBar(
          SnackBar(
            content: Text((sent['message'] is String) ? sent['message'] as String : 'Failed to send verification code'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  void _startCooldownTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _cooldownLeft = _cooldownLeft > 0 ? _cooldownLeft - 1 : 0);
      return _cooldownLeft > 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
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
                'Verify Your Email',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'We sent a verification code to',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.email,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 40),

              // OTP Input Boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return _OtpBox(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    hasError: _errorMessage != null,
                    onChanged: (value) {
                      setState(() => _errorMessage = null);
                      if (value.isNotEmpty && index < 5) {
                        _focusNodes[index + 1].requestFocus();
                      }
                      if (value.isEmpty && index > 0) {
                        _focusNodes[index - 1].requestFocus();
                      }
                      // Auto-verify when all boxes are filled
                      if (_isOtpComplete) {
                        FocusScope.of(context).unfocus();
                      }
                    },
                  );
                }),
              ),

              // Error Message
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 32),

              // Info Cards
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Column(
                  children: [
                    _InfoRow(
                      icon: Icons.access_time_outlined,
                      label: 'Code expires in',
                      value: '${widget.ttlMin} minutes',
                    ),
                    const SizedBox(height: 12),
                    _InfoRow(
                      icon: Icons.refresh,
                      label: 'Attempts remaining',
                      value: '$_attemptsLeft/${widget.maxAttempts}',
                      valueColor: _attemptsLeft <= 2 ? Colors.red : Colors.blue.shade900,
                    ),
                    if (_cooldownLeft > 0) ...[
                      const SizedBox(height: 12),
                      _InfoRow(
                        icon: Icons.timer_outlined,
                        label: 'Resend available in',
                        value: '${_cooldownLeft}s',
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _verifying || _attemptsLeft <= 0 || !_isOtpComplete ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade300,
                    disabledForegroundColor: Colors.grey.shade500,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _verifying
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Verify Code',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 16),

              // Resend Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: (_resending || _cooldownLeft > 0) ? null : _resend,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.blue,
                    disabledForegroundColor: Colors.grey.shade400,
                    side: BorderSide(
                      color: (_resending || _cooldownLeft > 0) ? Colors.grey.shade300 : Colors.blue,
                      width: 1.5,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _resending
                      ? SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                          ),
                        )
                      : Text(
                          _cooldownLeft > 0 ? 'Resend in ${_cooldownLeft}s' : 'Resend Code',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 24),

              // Help Text
              Center(
                child: Text(
                  'Didn\'t receive the code? Check your spam folder',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
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
    return Container(
      width: 50,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasError
              ? Colors.red
              : (focusNode.hasFocus ? Colors.blue : Colors.grey.shade300),
          width: hasError || focusNode.hasFocus ? 2 : 1.5,
        ),
        boxShadow: focusNode.hasFocus
            ? [
                BoxShadow(
                  color: Colors.blue.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
        decoration: const InputDecoration(
          border: InputBorder.none,
          counterText: '',
          contentPadding: EdgeInsets.zero,
        ),
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
        ],
        onChanged: onChanged,
      ),
    );
  }
}

// Info Row Widget
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.blue.shade700),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? Colors.blue.shade900,
          ),
        ),
      ],
    );
  }
}
