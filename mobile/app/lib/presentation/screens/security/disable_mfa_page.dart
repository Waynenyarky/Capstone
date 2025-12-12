import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../domain/usecases/get_mfa_status_detail.dart';
import '../../../domain/usecases/request_disable_mfa.dart';
import '../../../domain/usecases/undo_disable_mfa.dart';

class DisableMfaPage extends StatefulWidget {
  final GetMfaStatusDetail getStatus;
  final RequestDisableMfa requestDisable;
  final UndoDisableMfa undoDisable;
  const DisableMfaPage({super.key, required this.getStatus, required this.requestDisable, required this.undoDisable});

  @override
  State<DisableMfaPage> createState() => _DisableMfaPageState();
}

class _DisableMfaPageState extends State<DisableMfaPage> {
  DateTime? _scheduledFor;
  bool _pending = false;
  bool _enabled = false;
  Duration _remaining = Duration.zero;
  Timer? _ticker;
  Timer? _poll;
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initFlow();
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _refreshStatus());
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _poll?.cancel();
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

  Future<void> _initFlow() async {
    final status = await widget.getStatus.call();
    if (mounted) {
      _enabled = status.enabled;
      _pending = status.disablePending;
      _scheduledFor = status.scheduledFor;
    }
    if (!_pending) {
      final dt = await widget.requestDisable.call();
      if (mounted) {
        _pending = dt != null;
        _scheduledFor = dt;
      }
    }
    _syncCountdown();
    if (mounted) setState(() {});
  }

  Future<void> _refreshStatus() async {
    final status = await widget.getStatus.call();
    if (!mounted) return;
    setState(() {
      _enabled = status.enabled;
      _pending = status.disablePending;
      _scheduledFor = status.scheduledFor;
    });
    _syncCountdown();
  }

  void _syncCountdown() {
    _ticker?.cancel();
    if (_pending && _scheduledFor != null) {
      _tick();
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    } else {
      setState(() => _remaining = Duration.zero);
    }
  }

  void _tick() {
    final target = _scheduledFor;
    if (target == null) return;
    final diff = target.difference(DateTime.now());
    setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
  }

  String _fmt(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  String _fmtDateTimeAmPm(DateTime dt) {
    final local = dt.toLocal();
    final y = local.year.toString().padLeft(4, '0');
    final mo = local.month.toString().padLeft(2, '0');
    final d2 = local.day.toString().padLeft(2, '0');
    final h24 = local.hour;
    final h12 = (h24 % 12 == 0) ? 12 : (h24 % 12);
    final min = local.minute.toString().padLeft(2, '0');
    final ampm = h24 >= 12 ? 'PM' : 'AM';
    return '$y-$mo-$d2 $h12:$min $ampm';
  }

  Future<void> _pasteAllFromClipboard() async {
    final data = await Clipboard.getData('text/plain');
    final raw = data?.text ?? '';
    final d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.length >= 6) {
      for (int i = 0; i < 6; i++) {
        _controllers[i].text = d[i];
      }
      if (!mounted) return;
      setState(() => _errorMessage = null);
      FocusManager.instance.primaryFocus?.unfocus();
    }
  }

  Future<void> _undo() async {
    final code = _otpCode;
    final messenger = ScaffoldMessenger.of(context);
    final valid = RegExp(r'^[0-9]{6}$').hasMatch(code);
    if (!valid) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      messenger.showSnackBar(const SnackBar(content: Text('Enter a valid 6-digit code')));
      return;
    }
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final ok = await widget.undoDisable.call(code: code);
      if (mounted) {
        if (ok) {
          _clearOtp();
          await _refreshStatus();
          messenger.showSnackBar(const SnackBar(
            content: Text('Disable request canceled'),
            backgroundColor: Colors.green,
          ));
          if (mounted) Navigator.pop(context);
        } else {
          setState(() => _errorMessage = 'Invalid verification code');
          _clearOtp();
          messenger.showSnackBar(const SnackBar(content: Text('Invalid code')));
        }
      }
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
          'Disable Two-Factor Auth',
          style: TextStyle(color: Colors.black87),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_enabled && !_pending) ...[
              // No Disable Scheduled State
              Center(
                child: Column(
                  children: [
                    const SizedBox(height: 40),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.shield_outlined,
                        size: 80,
                        color: Colors.grey.shade400,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'No Disable Request',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Your two-factor authentication is currently active and protected.',
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
            if (_pending && _scheduledFor != null) ...[
              // Warning Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Disable Request Pending',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.orange.shade900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your 2FA will be disabled soon',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.orange.shade800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Countdown Section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.red.shade50, Colors.orange.shade50],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.red.shade100),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.access_time, color: Colors.red.shade700, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Time Remaining',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.red.shade900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _fmt(_remaining),
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.red.shade700,
                        letterSpacing: 2,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Scheduled: ${_fmtDateTimeAmPm(_scheduledFor!)}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Instructions
              Text(
                'Cancel Disable Request',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter the 6-digit code from your TOTP authenticator to cancel this request and keep your account protected.',
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),

              // OTP Input Boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return _OtpBox(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    hasError: _errorMessage != null,
                    onPasteAll: _pasteAllFromClipboard,
                    onChanged: (value) async {
                      setState(() => _errorMessage = null);
                      final d = value.replaceAll(RegExp(r'\D'), '');
                      if (d.length >= 6) {
                        for (int i = 0; i < 6; i++) {
                          _controllers[i].text = d[i];
                        }
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
                        if (nextIndex <= 5) {
                          _focusNodes[nextIndex].requestFocus();
                        } else {
                          FocusManager.instance.primaryFocus?.unfocus();
                        }
                        if (_isOtpComplete) {
                          FocusManager.instance.primaryFocus?.unfocus();
                        }
                        return;
                      }
                      _controllers[index].text = d.isEmpty ? '' : d[0];
                      if (d.isNotEmpty && index < 5) {
                        _focusNodes[index + 1].requestFocus();
                      }
                      if (d.isEmpty && index > 0) {
                        _focusNodes[index - 1].requestFocus();
                      }
                      if (_isOtpComplete) {
                        FocusManager.instance.primaryFocus?.unfocus();
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

              const SizedBox(height: 24),

              // Info Note
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
                            'Helpful Note',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Canceling this request will immediately restore your two-factor authentication protection. You can request to disable it again at any time.',
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

              // Undo Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading || !_isOtpComplete ? null : _undo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
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
                      : const Text(
                          'Cancel Disable Request',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 16),

              // Security Note
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.shield_outlined, color: Colors.grey.shade600, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Keeping 2FA enabled protects your account from unauthorized access',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade700,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
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
  final Future<void> Function() onPasteAll;
  final Function(String) onChanged;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onPasteAll,
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
