import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/bizclear_colors.dart';
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
      final isBiometric = widget.method == 'fingerprint';
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
    final isBiometric = widget.method == 'fingerprint';

    return Scaffold(
      backgroundColor: BizClearColors.background,
      appBar: AppBar(
        backgroundColor: BizClearColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: BizClearColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Verify MFA',
          style: TextStyle(color: BizClearColors.textPrimary),
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
                'Enable Two-Factor Auth',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: BizClearColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                isBiometric
                  ? 'Use biometrics to verify and enable 2FA'
                  : 'Enter the 6-digit code from your TOTP authenticator to complete setup',
                style: const TextStyle(
                  fontSize: 16,
                  color: BizClearColors.textSecondary,
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
                        'TOTP Authenticator',
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

                // OTP Input Boxes - Responsive layout
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
                          onPasteAll: _pasteAllFromClipboard,
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
                              'Open your TOTP authenticator (Google Authenticator, Authy, etc.) to get the current 6-digit verification code.',
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
                        child: Icon(Icons.fingerprint, size: 80, color: Colors.blue.shade700),
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
                    backgroundColor: BizClearColors.primary,
                    foregroundColor: BizClearColors.buttonPrimaryFg,
                    disabledBackgroundColor: BizClearColors.border,
                    disabledForegroundColor: BizClearColors.textSecondary,
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
                          isBiometric ? 'Verify with Fingerprint' : 'Verify & Enable 2FA',
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
                  style: const TextStyle(
                    fontSize: 14,
                    color: BizClearColors.textSecondary,
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
  final double size;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasError;
  final Future<void> Function() onPasteAll;
  final Function(String) onChanged;

  const _OtpBox({
    required this.size,
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onPasteAll,
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
