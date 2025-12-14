import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'login_page.dart';
import 'profile.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'dart:async';

class DeleteAccountNextPage extends StatefulWidget {
  final String email;
  final String? scheduledISO;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;
  const DeleteAccountNextPage({
    super.key,
    required this.email,
    required this.scheduledISO,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.token,
    this.avatarUrl = '',
  });

  @override
  State<DeleteAccountNextPage> createState() => _DeleteAccountNextPageState();
}

class _DeleteAccountNextPageState extends State<DeleteAccountNextPage> {
  bool _undoLoading = false;
  bool _scheduling = false;
  String? _errorMessage;
  final TextEditingController _emailController = TextEditingController();
  String? _scheduledISO;

  DateTime? _tryParseDate(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    try {
      return DateTime.parse(iso).toLocal();
    } catch (_) {
      return null;
    }
  }

  String _two(int n) => n.toString().padLeft(2, '0');
  String _formatDateTime(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = _two(dt.month);
    final d = _two(dt.day);
    final hour = dt.hour;
    final ampm = hour >= 12 ? 'PM' : 'AM';
    final h12 = hour % 12 == 0 ? 12 : hour % 12;
    final h = _two(h12);
    final min = _two(dt.minute);
    return '$y-$m-$d $h:$min $ampm';
  }

  @override
  void initState() {
    super.initState();
    _emailController.text = widget.email;
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _scheduledISO ??= widget.scheduledISO;
    final dt = _tryParseDate(_scheduledISO);
    final when = dt != null ? _formatDateTime(dt) : (_scheduledISO ?? '');
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Deletion'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: (_scheduledISO == null || _scheduledISO!.isEmpty)
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Colors.red.shade700, size: 28),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'This action is irreversible',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.red.shade700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    const Text(
                      'Delete Account',
                      style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Your account will be scheduled for deletion in 30 days.',
                      style: TextStyle(fontSize: 16, height: 1.5),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline, color: Colors.grey.shade700, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'What happens to your data:',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                  color: Colors.grey.shade800,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _InfoRow(
                            icon: Icons.check_circle_outline,
                            text: 'Profile and personal data will be deleted',
                          ),
                          const SizedBox(height: 8),
                          _InfoRow(
                            icon: Icons.history,
                            text: 'Transaction and service records will be retained for auditing',
                          ),
                          const SizedBox(height: 8),
                          _InfoRow(
                            icon: Icons.schedule,
                            text: 'You have 30 days to change your mind',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    Text(
                      'Confirm your email address',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      readOnly: true,
                      enabled: false,
                      style: const TextStyle(fontSize: 16),
                      decoration: InputDecoration(
                        labelText: 'Current Email Address',
                        hintText: 'your.email@example.com',
                        prefixIcon: const Icon(Icons.email_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.blue, width: 2),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.red, width: 2),
                        ),
                        errorText: _errorMessage,
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _scheduling
                            ? null
                            : () async {
                                final emailInput = widget.email;
                                setState(() {
                                  _scheduling = true;
                                  _errorMessage = null;
                                });
                                try {
                                  final nav = Navigator.of(context);
                                  final res = await MongoDBService.sendDeleteAccountCode(email: emailInput);
                                  final ok = res['success'] == true;
                                  final msg = (res['message'] is String) ? res['message'] as String : (ok ? 'Verification code sent' : 'Failed to send verification code');
                                  messenger.showSnackBar(SnackBar(content: Text(msg)));
                                  if (!ok) {
                                    setState(() => _errorMessage = msg);
                                  } else {
                                    if (!mounted) return;
                                    nav.push(
                                      MaterialPageRoute(
                                        builder: (_) => DeleteAccountOtpPage(
                                          email: emailInput,
                                          firstName: widget.firstName,
                                          lastName: widget.lastName,
                                          phoneNumber: widget.phoneNumber,
                                          token: widget.token,
                                          avatarUrl: widget.avatarUrl,
                                        ),
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  final msg = 'Error: ${e.toString()}';
                                  setState(() => _errorMessage = msg);
                                  messenger.showSnackBar(SnackBar(content: Text(msg)));
                                } finally {
                                  if (mounted) setState(() => _scheduling = false);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: _scheduling
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                            : const Text('Send Verification Code', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.orange.shade200, width: 2),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.event_busy, size: 56, color: Colors.orange.shade700),
                          const SizedBox(height: 16),
                          const Text(
                            'Deletion Scheduled',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Your account is scheduled to be deleted in 30 days',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 16, height: 1.5),
                          ),
                          if (when.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.schedule, size: 20, color: Colors.orange.shade700),
                                  const SizedBox(width: 8),
                                  Text(
                                    when,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.orange.shade900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.lightbulb_outline, color: Colors.blue.shade700, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Changed your mind? You can cancel the deletion below.',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.blue.shade900,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: OutlinedButton.icon(
                        onPressed: _undoLoading
                            ? null
                            : () async {
                                setState(() => _undoLoading = true);
                                try {
                                  final res = await MongoDBService.cancelAccountDeletion(email: widget.email);
                                  final ok = res['success'] == true;
                                  final msg = ok
                                      ? 'Account deletion cancelled'
                                      : ((res['message'] is String) ? res['message'] as String : 'Failed to cancel deletion');
                                  messenger.showSnackBar(SnackBar(content: Text(msg)));
                                  if (ok) {
                                    navigator.pushAndRemoveUntil(
                                      MaterialPageRoute(
                                        builder: (_) => ProfilePage(
                                          email: widget.email,
                                          firstName: widget.firstName,
                                          lastName: widget.lastName,
                                          phoneNumber: widget.phoneNumber,
                                          token: widget.token,
                                          avatarUrl: widget.avatarUrl,
                                        ),
                                      ),
                                      (route) => false,
                                    );
                                  }
                                } catch (e) {
                                  messenger.showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
                                } finally {
                                  if (mounted) setState(() => _undoLoading = false);
                                }
                              },
                        icon: _undoLoading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.undo),
                        label: const Text('Cancel Deletion', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          side: const BorderSide(width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          navigator.pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => LoginScreen(deletionScheduledForISO: _scheduledISO)),
                            (route) => false,
                          );
                        },
                        icon: const Icon(Icons.login),
                        label: const Text('Go to Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
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
      width: 50,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasError
              ? Colors.red
              : (isFocused ? Colors.blue : Colors.grey.shade300),
          width: hasError || isFocused ? 2 : 1.5,
        ),
        boxShadow: isFocused
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
          LengthLimitingTextInputFormatter(1),
        ],
        onChanged: onChanged,
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey.shade600),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}

class DeleteAccountOtpPage extends StatefulWidget {
  final String email;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;
  const DeleteAccountOtpPage({
    super.key,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.token,
    this.avatarUrl = '',
  });
  @override
  State<DeleteAccountOtpPage> createState() => _DeleteAccountOtpPageState();
}

class _DeleteAccountOtpPageState extends State<DeleteAccountOtpPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _verifying = false;
  String? _errorMessage;
  int _attemptsLeft = 5;
  late DateTime _expiresAt;
  Timer? _timer;
  Duration _remaining = const Duration(minutes: 10);
  bool _resending = false;
  String? _resendMessage;
  bool _resendIsError = false;

  String get _otpCode => _controllers.map((c) => c.text).join();
  bool get _isComplete => _otpCode.length == 6;

  @override
  void initState() {
    super.initState();
    _expiresAt = DateTime.now().add(const Duration(minutes: 10));
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final now = DateTime.now();
      final left = _expiresAt.difference(now);
      if (!mounted) return;
      setState(() {
        _remaining = left.isNegative ? Duration.zero : left;
      });
    });
  }

  @override
  void dispose() {
    for (final c in _controllers) { c.dispose(); }
    for (final n in _focusNodes) { n.dispose(); }
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _verifying = true;
      _errorMessage = null;
    });
    try {
      final messenger = ScaffoldMessenger.of(context);
      final nav = Navigator.of(context);
      if (_remaining == Duration.zero) {
        setState(() => _errorMessage = 'Code expired. Please resend.');
        messenger.showSnackBar(const SnackBar(content: Text('Code expired. Please resend.'), backgroundColor: Colors.red));
        return;
      }
      if (_attemptsLeft <= 0) {
        setState(() => _errorMessage = 'No attempts remaining. Please resend code.');
        messenger.showSnackBar(const SnackBar(content: Text('No attempts remaining. Please resend code.'), backgroundColor: Colors.red));
        return;
      }
      final code = _otpCode;
      if (code.length != 6) {
        setState(() => _errorMessage = 'Please enter all 6 digits');
        return;
      }
      final res = await MongoDBService.verifyDeleteAccountCode(email: widget.email, code: code);
      final ok = res['success'] == true;
      final token = (res['deleteToken'] is String) ? res['deleteToken'] as String : '';
      if (ok && token.isNotEmpty) {
        if (!mounted) return;
        nav.push(
          MaterialPageRoute(
            builder: (_) => DeleteAccountConfirmPage(
              email: widget.email,
              deleteToken: token,
              firstName: widget.firstName,
              lastName: widget.lastName,
              phoneNumber: widget.phoneNumber,
              token: widget.token,
              avatarUrl: widget.avatarUrl,
            ),
          ),
        );
      } else {
        final msg = (res['message'] is String) ? res['message'] as String : 'Invalid verification code';
        setState(() {
          _errorMessage = msg;
          _attemptsLeft = (_attemptsLeft > 0) ? (_attemptsLeft - 1) : 0;
        });
        messenger.showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
      }
    } catch (e) {
      setState(() => _errorMessage = 'Connection error');
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(SnackBar(content: Text('Connection error: ${e.toString()}'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resendCode() async {
    try {
      setState(() => _resending = true);
      setState(() {
        _resendMessage = null;
        _resendIsError = false;
      });
      final res = await MongoDBService.sendDeleteAccountCode(email: widget.email);
      final ok = res['success'] == true;
      if (ok) {
        setState(() {
          _attemptsLeft = 5;
          _expiresAt = DateTime.now().add(const Duration(minutes: 10));
          _remaining = const Duration(minutes: 10);
          for (final c in _controllers) { c.text = ''; }
          _errorMessage = null;
          _resendMessage = 'We sent you a new verification code. Please check your email.';
          _resendIsError = false;
        });
      } else {
        final msg = (res['message'] is String)
            ? res['message'] as String
            : 'Sorry, we couldn’t resend the code right now. Please try again in a moment.';
        setState(() {
          _resendMessage = msg;
          _resendIsError = true;
        });
      }
    } catch (e) {
      setState(() {
        _resendMessage = 'Something went wrong while resending the code. Please try again.';
        _resendIsError = true;
      });
    }
    finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  String _fmt(Duration d) {
    final total = d.inSeconds;
    final m = (total ~/ 60).toString().padLeft(2, '0');
    final s = (total % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.mail_outline, size: 56, color: Colors.blue.shade700),
              ),
              const SizedBox(height: 24),
              const Text(
                'Check your email',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'We sent a 6-digit verification code to',
                style: TextStyle(fontSize: 15, color: Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                widget.email,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
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
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.security, size: 18, color: Colors.grey.shade700),
                            const SizedBox(width: 8),
                            Text(
                              'Attempts: $_attemptsLeft of 5',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Icon(
                              _remaining == Duration.zero ? Icons.error_outline : Icons.timer_outlined,
                              size: 18,
                              color: _remaining == Duration.zero ? Colors.red : Colors.grey.shade700,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _remaining == Duration.zero ? 'Expired' : _fmt(_remaining),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: _remaining == Duration.zero ? Colors.red : Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (_resendMessage != null) ...[
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _resendMessage!,
                          style: TextStyle(
                            fontSize: 14,
                            color: _resendIsError ? Colors.red.shade700 : Colors.green.shade700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: (_verifying || _resending) ? null : _resendCode,
                icon: _resending
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.refresh, size: 20),
                label: const Text('Resend Code', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red.shade700, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(color: Colors.red.shade700, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _verifying || !_isComplete ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _verifying
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                      : const Text('Verify Code', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DeleteAccountConfirmPage extends StatelessWidget {
  final String email;
  final String deleteToken;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;
  const DeleteAccountConfirmPage({
    super.key,
    required this.email,
    required this.deleteToken,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.token,
    this.avatarUrl = '',
  });

  @override
  Widget build(BuildContext context) {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Action'),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.verified_user, size: 64, color: Colors.green.shade700),
            ),
            const SizedBox(height: 24),
            const Text(
              'Identity Verified',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'What would you like to do next?',
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                children: [
                  _OptionCard(
                    icon: Icons.delete_forever,
                    iconColor: Colors.red.shade700,
                    backgroundColor: Colors.red.shade50,
                    title: 'Schedule Deletion',
                    description: 'Proceed with account deletion in 30 days',
                  ),
                  const SizedBox(height: 16),
                  const Text('OR', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey)),
                  const SizedBox(height: 16),
                  _OptionCard(
                    icon: Icons.cancel_outlined,
                    iconColor: Colors.blue.shade700,
                    backgroundColor: Colors.blue.shade50,
                    title: 'Keep Account',
                    description: 'Cancel deletion and return to profile',
                  ),
                ],
              ),
            ),
            const Spacer(),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          title: Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: Colors.red.shade700),
                              const SizedBox(width: 12),
                              const Expanded(child: Text('Confirm Deletion')),
                            ],
                          ),
                          content: const Text(
                            'Schedule account deletion in 30 days? You will be logged out immediately.',
                            style: TextStyle(fontSize: 15, height: 1.5),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Go Back', style: TextStyle(fontSize: 15)),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Confirm', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ) ??
                      false;
                  if (!confirmed) return;
                  try {
                    final res = await MongoDBService.confirmDeleteAccountDeletion(email: email, deleteToken: deleteToken);
                    final ok = res['success'] == true;
                    if (ok) {
                      messenger.showSnackBar(const SnackBar(content: Text('Account deletion scheduled')));
                      final scheduledISO = (res['scheduledISO'] is String) ? res['scheduledISO'] as String : null;
                      navigator.pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => LoginScreen(deletionScheduledForISO: scheduledISO)),
                        (route) => false,
                      );
                    } else {
                      final msg = (res['message'] is String) ? res['message'] as String : 'Failed to schedule deletion';
                      messenger.showSnackBar(SnackBar(content: Text(msg)));
                    }
                  } catch (e) {
                    messenger.showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text('Schedule Deletion', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          title: const Text('Keep Your Account'),
                          content: const Text(
                            'Cancel the deletion process and return to your profile?',
                            style: TextStyle(fontSize: 15, height: 1.5),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('No', style: TextStyle(fontSize: 15)),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Yes, Keep Account', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ) ??
                      false;
                  if (!confirmed) return;
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
                },
                icon: const Icon(Icons.arrow_back),
                label: const Text('Keep My Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(width: 2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final String title;
  final String description;

  const _OptionCard({
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
