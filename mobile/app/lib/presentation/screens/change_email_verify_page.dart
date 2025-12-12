import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'change_email_new_page.dart';
import 'profile.dart';

class ChangeEmailVerifyPage extends StatefulWidget {
  final String currentEmail;
  final String? newEmail;
  const ChangeEmailVerifyPage({super.key, required this.currentEmail, this.newEmail});

  @override
  State<ChangeEmailVerifyPage> createState() => _ChangeEmailVerifyPageState();
}

class _ChangeEmailVerifyPageState extends State<ChangeEmailVerifyPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  bool _resending = false;
  String? _errorMessage;
  int _attemptsRemaining = 5;
  int _cooldownSec = 0;

  @override
  void dispose() {
    for (var c in _controllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _otpCode => _controllers.map((c) => c.text).join();
  bool get _complete => _otpCode.length == 6;

  void _onChanged(int i, String v) {
    final d = v.replaceAll(RegExp(r'\D'), '');
    if (d.isEmpty) {
      _controllers[i].text = '';
      if (i > 0) _focusNodes[i - 1].requestFocus();
      return;
    }
    final ch = d.substring(0, 1);
    _controllers[i].text = ch;
    _controllers[i].selection = const TextSelection.collapsed(offset: 1);
    if (d.length > 1) {
      final rest = d.substring(1);
      for (int j = i + 1, k = 0; j < 6 && k < rest.length; j++, k++) {
        _controllers[j].text = rest[k];
        _controllers[j].selection = const TextSelection.collapsed(offset: 1);
      }
      final last = (i + rest.length).clamp(0, 5);
      _focusNodes[last].requestFocus();
    } else {
      if (i < 5) _focusNodes[i + 1].requestFocus();
    }
    setState(() => _errorMessage = null);
  }

  // Removed clipboard paste-all autofill to require manual entry

  void _clearOtp() {
    for (var c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _verify() async {
    if (_loading) return;
    if (!_complete) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      return;
    }
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final bool ok;
      String updated = widget.newEmail ?? widget.currentEmail;
      if (widget.newEmail != null && widget.newEmail!.isNotEmpty) {
        final res = await MongoDBService.changeEmailVerify(currentEmail: widget.currentEmail, code: _otpCode);
        ok = res['success'] == true;
        if (res['email'] is String) updated = res['email'] as String;
      } else {
        final res = await MongoDBService.changeEmailConfirmVerify(email: widget.currentEmail, code: _otpCode);
        ok = res['success'] == true;
      }
      if (!mounted) return;
      if (ok) {
        if (widget.newEmail != null && widget.newEmail!.isNotEmpty) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              contentPadding: const EdgeInsets.all(24),
              title: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle,
                      color: Colors.green.shade600,
                      size: 48,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Email Updated Successfully!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              content: Text(
                'Your email address has been updated to $updated',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: Color(0xFF64748B),
                ),
              ),
              actions: [
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      final nav = Navigator.of(context);
                      if (nav.canPop()) {
                        nav.pop(updated);
                      } else {
                        nav.pushAndRemoveUntil(
                          MaterialPageRoute(
                            builder: (_) => ProfilePage(
                              email: updated,
                              firstName: '',
                              lastName: '',
                              phoneNumber: '',
                              token: '',
                            ),
                          ),
                          (route) => false,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Continue',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        } else {
          final navigator = Navigator.of(context);
          await navigator.push(
            MaterialPageRoute(builder: (_) => ChangeEmailNewPage(currentEmail: widget.currentEmail)),
          );
          if (mounted && Navigator.of(context).canPop()) Navigator.of(context).pop();
        }
      } else {
        setState(() {
          _loading = false;
          _errorMessage = 'Invalid code. Please try again';
          _attemptsRemaining = (_attemptsRemaining > 0) ? _attemptsRemaining - 1 : 0;
        });
        _clearOtp();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMessage = 'Verification failed. Please try again';
        _attemptsRemaining = (_attemptsRemaining > 0) ? _attemptsRemaining - 1 : 0;
      });
    }
  }

  Future<void> _resend() async {
    if (_resending || _cooldownSec > 0) return;
    setState(() {
      _resending = true;
      _errorMessage = null;
    });
    try {
      final sent = (widget.newEmail != null && widget.newEmail!.isNotEmpty)
          ? await MongoDBService.changeEmailStart(currentEmail: widget.currentEmail, newEmail: widget.newEmail!)
          : await MongoDBService.changeEmailConfirmStart(email: widget.currentEmail);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      if (sent['success'] == true) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('New verification code sent'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() {
          _cooldownSec = 60;
        });
        _clearOtp();
        _startCooldown();
      } else {
        messenger.showSnackBar(
          SnackBar(
            content: Text((sent['message'] is String) ? sent['message'] as String : 'Failed to resend code'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  void _startCooldown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() {
        _cooldownSec = (_cooldownSec > 0) ? _cooldownSec - 1 : 0;
      });
      return _cooldownSec > 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify Email'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(
                'Email Verification',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Enter the 6-digit code we sent to verify your email address.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.textTheme.bodySmall?.color,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.shade100, width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.mark_email_read_outlined,
                            size: 20,
                            color: Colors.blue.shade700,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Verification code sent to',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF334155),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.newEmail ?? widget.currentEmail,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF0F172A),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.schedule, size: 16, color: Color(0xFF0369A1)),
                          SizedBox(width: 8),
                          Text(
                            'Code expires in 10 minutes',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF0369A1),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Enter Verification Code',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (ctx, constraints) {
                  const spacing = 10.0;
                  final available = constraints.maxWidth;
                  final boxWidth = (available - spacing * 5) / 6;
                  final boxHeight = (boxWidth * 1.35).clamp(56.0, 92.0);
              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (i) {
                  return _OtpBox(
                    controller: _controllers[i],
                    focusNode: _focusNodes[i],
                    hasError: _errorMessage != null,
                    size: boxWidth,
                    height: boxHeight,
                    onChanged: (v) => _onChanged(i, v),
                  );
                }),
              );
                },
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, size: 18, color: Colors.red.shade700),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(
                            color: Colors.red.shade700,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _loading
                      ? SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              theme.colorScheme.onPrimary,
                            ),
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              widget.newEmail != null ? 'Verify & Update Email' : 'Verify Email',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Icon(
                              Icons.check_circle_outline,
                              size: 20,
                              color: theme.colorScheme.onPrimary,
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton(
                  onPressed: (_cooldownSec > 0 || _resending) ? null : _resend,
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    side: BorderSide(
                      color: (_cooldownSec > 0 || _resending)
                          ? theme.disabledColor
                          : theme.colorScheme.primary,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_resending)
                        SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              theme.colorScheme.primary,
                            ),
                          ),
                        )
                      else ...[
                        Icon(
                          _cooldownSec > 0 ? Icons.timer_outlined : Icons.refresh,
                          size: 20,
                          color: (_cooldownSec > 0 || _resending)
                              ? theme.disabledColor
                              : theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _cooldownSec > 0 ? 'Resend Code (${_cooldownSec}s)' : 'Resend Code',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: (_cooldownSec > 0 || _resending)
                                ? theme.disabledColor
                                : theme.colorScheme.primary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 16,
                        color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Attempts remaining: $_attemptsRemaining',
                        style: TextStyle(
                          fontSize: 13,
                          color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
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
  final double size;
  final double height;
  final void Function(String v) onChanged;
  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.size,
    required this.height,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    
    return SizedBox(
      width: size,
      height: height,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        style: TextStyle(
          fontSize: (height * 0.38).clamp(20.0, 30.0),
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(6),
        ],
        decoration: InputDecoration(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.grey.shade400,
              width: 1.5,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.grey.shade400,
              width: 1.5,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.grey.shade600,
              width: 2,
            ),
          ),
          filled: true,
          fillColor: hasError
              ? Colors.grey.shade200
              : Colors.grey.shade200,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
        onChanged: onChanged,
      ),
    );
  }
}
