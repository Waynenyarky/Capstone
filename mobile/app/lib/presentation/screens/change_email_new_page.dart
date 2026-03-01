import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/core/theme/app_theme.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'profile.dart';

class ChangeEmailNewPage extends StatefulWidget {
  final String currentEmail;
  final bool embeddedInShell;
  final bool canEditProfile;
  const ChangeEmailNewPage({
    super.key,
    required this.currentEmail,
    this.embeddedInShell = false,
    this.canEditProfile = true,
  });

  @override
  State<ChangeEmailNewPage> createState() => _ChangeEmailNewPageState();
}

class _ChangeEmailNewPageState extends State<ChangeEmailNewPage> {
  final TextEditingController _newEmailController = TextEditingController();
  final FocusNode _emailFocusNode = FocusNode();
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _sending = false;
  bool _verifying = false;
  bool _resending = false;
  String? _emailError;
  String? _errorMessage;
  int _attemptsRemaining = 5;
  int _cooldownSec = 0;
  bool _codeSent = false;
  bool _emailLocked = false;

  @override
  void dispose() {
    _newEmailController.dispose();
    _emailFocusNode.dispose();
    for (var c in _controllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  bool _isValidEmail(String v) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
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

  

  void _clearOtp() {
    for (var c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _sendCode() async {
    if (_sending) return;
    _emailFocusNode.unfocus();
    final messenger = ScaffoldMessenger.of(context);
    final email = _newEmailController.text.trim();
    if (!_isValidEmail(email)) {
      setState(() => _emailError = 'Please enter a valid email address');
      return;
    }
    if (email.toLowerCase() == widget.currentEmail.toLowerCase()) {
      setState(() => _emailError = 'This is your current email. Please select a different email');
      return;
    }
    setState(() {
      _sending = true;
      _emailError = null;
      _errorMessage = null;
    });
    try {
      final res = await MongoDBService.changeEmailStart(currentEmail: widget.currentEmail, newEmail: email);
      if (res['success'] == true) {
        setState(() {
          _codeSent = true;
          _cooldownSec = 60;
          _emailLocked = true;
        });
        _clearOtp();
        _startCooldown();
      } else {
        final msg = (res['message'] is String) ? res['message'] as String : 'Failed to send verification code';
        if (msg.toLowerCase().contains('email') && msg.toLowerCase().contains('in use')) {
          setState(() => _emailError = 'This email is already in use');
        } else if (msg.toLowerCase().contains('same email')) {
          setState(() => _emailError = 'This is your current email. Please select a different email');
        } else {
          messenger.showSnackBar(
            SnackBar(
              content: Text(msg),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _saveNewEmail() async {
    if (_verifying) return;
    if (!_complete) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      return;
    }
    setState(() {
      _verifying = true;
      _errorMessage = null;
    });
    try {
      final res = await MongoDBService.changeEmailVerify(currentEmail: widget.currentEmail, code: _otpCode);
      final ok = res['success'] == true;
      if (!mounted) return;
      if (ok) {
        final updated = (res['email'] is String) ? res['email'] as String : _newEmailController.text.trim();
        if (widget.embeddedInShell) {
          if (!mounted) return;
          Navigator.of(context).pop(updated);
          return;
        }
        try {
          final profileRes = await MongoDBService.fetchProfile(email: updated);
          final user = (profileRes['user'] is Map<String, dynamic>) ? (profileRes['user'] as Map<String, dynamic>) : <String, dynamic>{};
          final firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
          final lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
          final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
          final avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
          if (!mounted) return;
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => ProfilePage(
                email: updated,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                token: '',
                avatarUrl: avatarUrl,
                canEditProfile: widget.canEditProfile,
              ),
            ),
            (route) => false,
          );
        } catch (_) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => ProfilePage(
                email: updated,
                firstName: '',
                lastName: '',
                phoneNumber: '',
                token: '',
                avatarUrl: '',
                canEditProfile: widget.canEditProfile,
              ),
            ),
            (route) => false,
          );
        }
      } else {
        setState(() {
          _verifying = false;
          _errorMessage = 'Invalid code. Please try again';
          _attemptsRemaining = (_attemptsRemaining > 0) ? _attemptsRemaining - 1 : 0;
        });
        _clearOtp();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _verifying = false;
        _errorMessage = 'Verification failed. Please try again';
        _attemptsRemaining = (_attemptsRemaining > 0) ? _attemptsRemaining - 1 : 0;
      });
    }
  }

  Future<void> _resend() async {
    if (_resending || _cooldownSec > 0) return;
    final messenger = ScaffoldMessenger.of(context);
    final email = _newEmailController.text.trim();
    if (!_isValidEmail(email)) {
      setState(() => _emailError = 'Please enter a valid email address');
      return;
    }
    setState(() {
      _resending = true;
      _errorMessage = null;
    });
    try {
      final sent = await MongoDBService.changeEmailStart(currentEmail: widget.currentEmail, newEmail: email);
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
      messenger.showSnackBar(
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
        title: const Text('Change Email Address'),
        elevation: 0,
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (ctx, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 48),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    Text(
                      _codeSent ? 'Verify New Email' : 'Enter New Email',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _codeSent
                          ? 'Enter the 6-digit code to confirm your new email.'
                          : 'Enter your new email address. A verification code will be sent to confirm.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.textTheme.bodySmall?.color,
                        height: 1.5,
                      ),
                    ),
                    SizedBox(height: _codeSent ? 16 : 32),
                    if (!_codeSent) ...[
                      TextField(
                        controller: _newEmailController,
                        focusNode: _emailFocusNode,
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        enabled: !_emailLocked,
                        style: theme.textTheme.bodyLarge,
                        decoration: InputDecoration(
                          labelText: 'New Email Address',
                          hintText: 'Enter your new email',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: theme.dividerColor,
                              width: 1.5,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: theme.colorScheme.primary,
                              width: 2,
                            ),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: theme.colorScheme.error,
                              width: 1.5,
                            ),
                          ),
                          focusedErrorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: theme.colorScheme.error,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _emailLocked
                              ? theme.disabledColor.withValues(alpha: 0.05)
                              : theme.inputDecorationTheme.fillColor,
                          errorText: _emailError,
                          errorMaxLines: 2,
                        ),
                        onChanged: (value) {
                          final v = value.trim();
                          if (v.toLowerCase() == widget.currentEmail.toLowerCase()) {
                            setState(() => _emailError = 'This is your current email. Please select a different email');
                          } else if (_emailError != null) {
                            setState(() => _emailError = null);
                          }
                        },
                        onSubmitted: (_) => !_emailLocked ? _sendCode() : null,
                      ),
                      const SizedBox(height: 20),
                      if (!_emailLocked)
                        SizedBox(
                          width: double.infinity,
                          height: 40,
                          child: ElevatedButton(
                            onPressed: _sending ? null : _sendCode,
                            style: ElevatedButton.styleFrom(
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding: BizClearColors.primaryButtonPadding,
                              minimumSize: BizClearColors.primaryButtonMinimumSize,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              textStyle: BizClearColors.primaryButtonTextStyle,
                            ),
                            child: _sending
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
                                      const Text(
                                        'Send Verification Code',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Icon(
                                        Icons.arrow_forward_rounded,
                                        size: 20,
                                        color: theme.colorScheme.onPrimary,
                                      ),
                                    ],
                                  ),
                          ),
                        )
                      else
                        SizedBox(
                          width: double.infinity,
                          height: 40,
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() {
                                _emailLocked = false;
                                _codeSent = false;
                                _errorMessage = null;
                                _attemptsRemaining = 5;
                                _cooldownSec = 0;
                              });
                              _clearOtp();
                            },
                            style: OutlinedButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: BorderSide(
                                color: theme.colorScheme.primary,
                                width: 1.5,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.edit_outlined,
                                  size: 20,
                                  color: theme.colorScheme.primary,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Change Email Address',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                    if (_codeSent && _emailLocked) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: BizClearColors.webPrimaryTintLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: BizClearColors.webPrimaryTintBorder, width: 1.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: BizClearColors.webPrimaryTintBorder,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    Icons.mark_email_read_outlined,
                                    size: 20,
                                    color: BizClearColors.webPrimaryTintIcon,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Code sent to',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Color(0xFF334155),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _newEmailController.text.trim(),
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
                          ],
                        ),
                      ),
                      const SizedBox(height: 28),
                      LayoutBuilder(
                        builder: (ctx, constraints) {
                          const spacing = 10.0;
                          final available = constraints.maxWidth;
                          final boxWidth = (available - spacing * 5) / 6;
                          final boxHeight = AppTheme.inputFieldMinHeight;
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
                            color: BizClearColors.error.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: BizClearColors.error.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, size: 18, color: BizClearColors.error),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: TextStyle(
                                    color: BizClearColors.error,
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
                        height: 40,
                        child: ElevatedButton(
                          onPressed: _verifying ? null : _saveNewEmail,
                          style: ElevatedButton.styleFrom(
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: BizClearColors.primaryButtonPadding,
                            minimumSize: BizClearColors.primaryButtonMinimumSize,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            textStyle: BizClearColors.primaryButtonTextStyle,
                          ),
                          child: _verifying
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
                                    const Text(
                                      'Confirm Email Change',
                                      style: TextStyle(
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
                        height: 40,
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
                    ],
                  ],
                ),
              ),
            );
          },
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
          fontSize: 14,
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
              color: hasError ? BizClearColors.error : BizClearColors.inputBorder,
              width: 1.5,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: hasError ? BizClearColors.error : BizClearColors.inputBorder,
              width: 1.5,
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
          fillColor: hasError
              ? BizClearColors.error.withValues(alpha: 0.06)
              : BizClearColors.surface,
          contentPadding: BizClearColors.inputFieldContentPadding,
        ),
        onChanged: onChanged,
      ),
    );
  }
}
