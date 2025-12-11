import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../domain/usecases/verify_mfa.dart';

class MfaVerifyScreen extends StatefulWidget {
  final VerifyMfa verifyMfa;
  final String method;

  const MfaVerifyScreen({
    super.key,
    required this.verifyMfa,
    required this.method,
  });

  @override
  State<MfaVerifyScreen> createState() => _MfaVerifyScreenState();
}

class _MfaVerifyScreenState extends State<MfaVerifyScreen> {
  final _codeController = TextEditingController();
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String? _errorMessage;
  String get _otpCode => _controllers.map((c) => c.text).join();
  bool get _isOtpComplete => _otpCode.length == 6;

  @override
  void dispose() {
    _codeController.dispose();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final n in _focusNodes) {
      n.dispose();
    }
    super.dispose();
  }

  void _clearOtp() {
    for (var controller in _controllers) {
      controller.clear();
    }
    _codeController.clear();
    _focusNodes[0].requestFocus();
  }

  Future<void> _pasteAllFromClipboard() async {
    final data = await Clipboard.getData('text/plain');
    final raw = data?.text ?? '';
    final d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.isEmpty) return;
    for (int i = 0; i < 6; i++) {
      _controllers[i].text = i < d.length ? d[i] : '';
    }
    setState(() => _errorMessage = null);
    _codeController.text = _otpCode;
    if (_isOtpComplete) {
      FocusManager.instance.primaryFocus?.unfocus();
    } else {
      final next = _controllers.indexWhere((c) => c.text.isEmpty);
      if (next != -1) {
        _focusNodes[next].requestFocus();
      }
    }
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final isBiometric = widget.method == 'fingerprint' || widget.method == 'face';
      if (!isBiometric && !_isOtpComplete) {
        setState(() => _errorMessage = 'Please enter all 6 digits');
        return;
      }
      final code = isBiometric
          ? 'biometric:${widget.method}'
          : _otpCode;
      final ok = await widget.verifyMfa.call(code: code);
      if (!mounted) return;
      if (ok) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.check_circle, color: Colors.green.shade600, size: 28),
                ),
                const SizedBox(width: 12),
                const Text('Success!'),
              ],
            ),
            content: const Text(
              'Multi-Factor Authentication has been successfully enabled. Your account is now more secure.',
              style: TextStyle(fontSize: 15, height: 1.4),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pop(true);
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: const Text(
                  'Done',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        );
      } else {
        setState(() => _errorMessage = 'Invalid verification code');
        _clearOtp();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid verification'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (_) {
      setState(() => _errorMessage = 'Verification failed');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification failed'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBiometric = widget.method == 'fingerprint' || widget.method == 'face';
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 360;
    final boxSize = isSmallScreen ? 45.0 : (screenWidth < 400 ? 48.0 : 50.0);
    final spacing = isSmallScreen ? 6.0 : 8.0;

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
          'Verify MFA',
          style: TextStyle(color: Colors.black87),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: isSmallScreen ? 16 : 24,
            vertical: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              Text(
                'Enable Two-Factor Auth',
                style: TextStyle(
                  fontSize: isSmallScreen ? 24 : 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                isBiometric
                    ? (widget.method == 'face'
                        ? 'Use face recognition to verify and enable 2FA'
                        : 'Use fingerprint to verify and enable 2FA')
                    : 'Enter the 6-digit code from your authenticator app to complete setup',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              SizedBox(height: isBiometric ? 40 : 32),

              if (!isBiometric) ...[
                // Method Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.phone_android, size: 16, color: Colors.green.shade700),
                      const SizedBox(width: 8),
                      Text(
                        'Authenticator App',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.green.shade900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // OTP Input Boxes - Responsive
                LayoutBuilder(
                  builder: (context, constraints) {
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) {
                        return _OtpBox(
                          controller: _controllers[index],
                          focusNode: _focusNodes[index],
                          hasError: _errorMessage != null,
                          onPasteAll: _pasteAllFromClipboard,
                          size: boxSize,
                          spacing: spacing,
                          onChanged: (value) {
                            setState(() => _errorMessage = null);
                            final d = value.replaceAll(RegExp(r'\D'), '');
                            if (d.length >= 6) {
                              for (int i = 0; i < 6; i++) {
                                _controllers[i].text = d[i];
                              }
                              _codeController.text = _otpCode;
                              FocusManager.instance.primaryFocus?.unfocus();
                              return;
                            }
                            if (d.length > 1) {
                              final start = index;
                              final take = d.length >= (6 - start) ? d.substring(0, 6 - start) : d;
                              for (int i = 0; i < take.length; i++) {
                                _controllers[start + i].text = take[i];
                              }
                              final nextIndex = start + take.length;
                              _codeController.text = _otpCode;
                              if (nextIndex <= 5) {
                                _focusNodes[nextIndex].requestFocus();
                              } else {
                                FocusManager.instance.primaryFocus?.unfocus();
                              }
                              return;
                            }
                            _controllers[index].text = d.isEmpty ? '' : d[0];
                            _codeController.text = _otpCode;
                            if (d.isNotEmpty && index < 5) {
                              _focusNodes[index + 1].requestFocus();
                            }
                            if (d.isEmpty && index > 0) {
                              _focusNodes[index - 1].requestFocus();
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

                const SizedBox(height: 24),

                // Info Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade100),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Helpful Tip',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.blue.shade900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Open your authenticator app (Google Authenticator, Authy, etc.) to get the current 6-digit verification code.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.blue.shade800,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Security Note
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade100),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.shield_outlined, color: Colors.green.shade700, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Why Enable 2FA?',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.green.shade900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Two-factor authentication adds an extra layer of security to your account, protecting it from unauthorized access even if your password is compromised.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.green.shade800,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              if (isBiometric) ...[
                // Biometric Visual
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          widget.method == 'face' ? Icons.face : Icons.fingerprint,
                          size: 80,
                          color: Colors.blue.shade700,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Tap the verify button below to authenticate with your ${widget.method}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.blue.shade800,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 32),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading || (!isBiometric && !_isOtpComplete) ? null : _verify,
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
                  child: _loading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          isBiometric ? 'Verify with ${widget.method == 'face' ? 'Face' : 'Fingerprint'}' : 'Verify & Enable 2FA',
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
                  'Having trouble? Contact support for assistance',
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

// Responsive OTP Box Widget
class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasError;
  final Future<void> Function() onPasteAll;
  final double size;
  final double spacing;
  final Function(String) onChanged;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onPasteAll,
    required this.size,
    required this.spacing,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size + 10,
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
        style: TextStyle(
          fontSize: size * 0.48,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
        decoration: const InputDecoration(
          border: InputBorder.none,
          counterText: '',
          contentPadding: EdgeInsets.zero,
        ),
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        contextMenuBuilder: (ctx, editableTextState) {
          return AdaptiveTextSelectionToolbar(
            anchors: editableTextState.contextMenuAnchors,
            children: [
              TextSelectionToolbarTextButton(
                padding: const EdgeInsets.all(8),
                onPressed: () async {
                  editableTextState.hideToolbar();
                  await onPasteAll();
                },
                child: const Text('Paste'),
              ),
            ],
          );
        },
        onChanged: onChanged,
      ),
    );
  }
}
