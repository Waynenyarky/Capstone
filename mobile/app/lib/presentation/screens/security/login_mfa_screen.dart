import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../data/services/mongodb_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../deletion_scheduled_page.dart';
import '../profile.dart';

class LoginMfaScreen extends StatefulWidget {
  final String email;
  const LoginMfaScreen({super.key, required this.email});

  @override
  State<LoginMfaScreen> createState() => _LoginMfaScreenState();
}

class _LoginMfaScreenState extends State<LoginMfaScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String? _errorMessage;

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

  void _handleBulkPaste(String value, int startIndex) {
    final digits = value.replaceAll(RegExp('[^0-9]'), '');
    if (digits.isEmpty) return;
    int i = 0;
    for (int box = startIndex; box < 6 && i < digits.length; box++) {
      _controllers[box].text = digits[i];
      i++;
    }
    if (i < digits.length) {
      for (int box = 0; box < 6 && i < digits.length; box++) {
        _controllers[box].text = digits[i];
        i++;
      }
    }
    final nextIndex = digits.length >= 6 ? 5 : (startIndex + digits.length - 1).clamp(0, 5);
    _focusNodes[nextIndex].unfocus();
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
      final verify = await MongoDBService.loginVerifyTotp(email: widget.email, code: code);
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
            builder: (_) => ProfilePage(
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
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Two-Factor Authentication',
          style: TextStyle(color: Colors.black87),
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
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Enter the 6-digit code from your TOTP authenticator',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.email_outlined, size: 16, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        widget.email,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue.shade900,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
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

              // Info Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.shield_outlined,
                        color: Colors.blue.shade700,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Secure Login',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Check your TOTP authenticator for the verification code',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
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
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade300,
                    disabledForegroundColor: Colors.grey.shade500,
                    elevation: 3,
                    shadowColor: Colors.blue.shade200,
                    side: BorderSide(color: Colors.blue.shade300, width: 1.2),
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

              // Help Text
              Center(
                child: Column(
                  children: [
                    Text(
                      'Having trouble?',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () {
                        // Add help action here
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.blue,
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
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
        decoration: const InputDecoration(
          border: InputBorder.none,
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
