import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/services/mongodb_service.dart';
import 'dart:async';

class FingerprintOtpVerifyScreen extends StatefulWidget {
  final String email;
  const FingerprintOtpVerifyScreen({super.key, required this.email});

  @override
  State<FingerprintOtpVerifyScreen> createState() => _FingerprintOtpVerifyScreenState();
}

class _FingerprintOtpVerifyScreenState extends State<FingerprintOtpVerifyScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String? _errorMessage;
  int _attemptsRemaining = 5;
  DateTime _expiresAt = DateTime.now().add(const Duration(minutes: 10));
  Duration _expiryRemaining = const Duration(minutes: 10);
  Timer? _expiryTicker;

  String get _otpCode => _controllers.map((c) => c.text).join();
  bool get _isOtpComplete => _otpCode.length == 6;

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      if (!_isOtpComplete) {
        setState(() {
          _loading = false;
          _errorMessage = 'Please enter all 6 digits';
        });
        return;
      }
      if (_expiryRemaining == Duration.zero) {
        setState(() {
          _loading = false;
          _errorMessage = 'Code expired';
        });
        return;
      }
      final res = await MongoDBService.mfaFingerprintVerify(email: widget.email, code: _otpCode);
      final ok = res['success'] == true;
      if (!mounted) return;
      if (ok) {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', widget.email);
        } catch (_) {}
        if (!mounted) return;
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.green.shade50, shape: BoxShape.circle),
                  child: Icon(Icons.check_circle, color: Colors.green.shade600, size: 28),
                ),
                const SizedBox(width: 12),
                const Text('Success!'),
              ],
            ),
            content: const Text(
              'Fingerprint verification is enabled. Your account is now more secure.',
              style: TextStyle(fontSize: 15, height: 1.4),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pop(true);
                },
                child: const Text('Done'),
              ),
            ],
          ),
        );
      } else {
        setState(() {
          _loading = false;
          _errorMessage = 'Invalid code. Try again';
          _attemptsRemaining = (_attemptsRemaining > 0) ? _attemptsRemaining - 1 : 0;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMessage = 'Verification failed';
        _attemptsRemaining = (_attemptsRemaining > 0) ? _attemptsRemaining - 1 : 0;
      });
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    _expiryTicker?.cancel();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _startExpiryCountdown();
  }

  void _startExpiryCountdown() {
    _expiryTicker?.cancel();
    _expiryRemaining = _expiresAt.difference(DateTime.now());
    _expiryTicker = Timer.periodic(const Duration(seconds: 1), (_) {
      final diff = _expiresAt.difference(DateTime.now());
      setState(() {
        _expiryRemaining = diff.isNegative ? Duration.zero : diff;
      });
    });
  }

  Future<void> _resend() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final res = await MongoDBService.mfaFingerprintStart(email: widget.email);
      final ok = res['success'] == true;
      if (!mounted) return;
      if (ok) {
        _attemptsRemaining = 5;
        _expiresAt = DateTime.now().add(const Duration(minutes: 10));
        _startExpiryCountdown();
        for (final c in _controllers) {
          c.clear();
        }
        FocusManager.instance.primaryFocus?.unfocus();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code resent')));
      } else {
        final msg = (res['message'] is String) ? (res['message'] as String) : 'Resend failed';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmall = screenWidth < 360;
    final spacing = isSmall ? 6.0 : 8.0;
    String formatDuration(Duration d) {
      final m = d.inMinutes;
      final s = d.inSeconds % 60;
      final mm = m.toString().padLeft(2, '0');
      final ss = s.toString().padLeft(2, '0');
      return '$mm:$ss';
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Verify Fingerprint', style: TextStyle(color: Colors.black87)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: isSmall ? 16 : 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter the code sent to',
                style: TextStyle(fontSize: isSmall ? 22 : 26, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              const SizedBox(height: 6),
              Text(
                widget.email,
                style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 18, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'We sent a 6-digit code to your registered email. Check spam if you do not see it.',
                        style: TextStyle(fontSize: 13, color: Colors.blue.shade900, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              LayoutBuilder(
                builder: (ctx, constraints) {
                  final available = constraints.maxWidth;
                  final boxWidth = (available - spacing * 5) / 6;
                  final boxHeight = (boxWidth * 1.35).clamp(56.0, 92.0);
                  final children = List.generate(6, (i) {
                    return _OtpBox(
                      controller: _controllers[i],
                      focusNode: _focusNodes[i],
                      hasError: _errorMessage != null,
                      onPasteAll: () async {
                        final data = await Clipboard.getData('text/plain');
                        final text = data?.text?.replaceAll(RegExp(r'\s'), '') ?? '';
                        if (text.length >= 6) {
                          for (var j = 0; j < 6; j++) {
                            _controllers[j].text = text[j];
                          }
                          setState(() {});
                          FocusManager.instance.primaryFocus?.unfocus();
                        }
                      },
                      size: boxWidth,
                      height: boxHeight,
                      spacing: spacing,
                      onChanged: (v) {
                        final digits = v.replaceAll(RegExp(r'[^0-9]'), '');
                        if (digits.length > 1) {
                          for (var k = 0; k < digits.length && (i + k) < 6; k++) {
                            _controllers[i + k].text = digits[k];
                          }
                          final nextIndex = (i + digits.length) >= 6 ? 5 : (i + digits.length);
                          _focusNodes[nextIndex].requestFocus();
                          setState(() {});
                          return;
                        }
                        if (digits.isNotEmpty) {
                          if (i < 5) {
                            _focusNodes[i + 1].requestFocus();
                          } else {
                            FocusManager.instance.primaryFocus?.unfocus();
                          }
                        } else {
                          if (i > 0) _focusNodes[i - 1].requestFocus();
                        }
                        setState(() {});
                      },
                    );
                  });
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: children,
                  );
                },
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Attempts remaining: $_attemptsRemaining of 5',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                    ),
                  ),
                  Text(
                    _expiryRemaining == Duration.zero
                        ? 'Code expired'
                        : 'Code expires in ${formatDuration(_expiryRemaining)}',
                    style: TextStyle(fontSize: 13, color: _expiryRemaining == Duration.zero ? Colors.red : Colors.grey.shade700),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (_errorMessage != null) ...[
                Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 8),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading || !_isOtpComplete ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade300,
                    disabledForegroundColor: Colors.grey.shade500,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2.5, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                        )
                      : const Text('Verify & Enable Fingerprint', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: OutlinedButton(
                  onPressed: _loading ? null : _resend,
                  child: const Text('Resend Code'),
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
  final Future<void> Function() onPasteAll;
  final double size;
  final double height;
  final double spacing;
  final Function(String) onChanged;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onPasteAll,
    required this.size,
    required this.height,
    required this.spacing,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: height,
      child: GestureDetector(
        onLongPress: onPasteAll,
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.oneTimeCode],
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
          style: TextStyle(fontSize: (height * 0.5).clamp(20.0, 28.0), fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey.shade50,
            isDense: true,
            contentPadding: EdgeInsets.symmetric(vertical: (height * 0.14).clamp(8.0, 12.0)),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Colors.blue)),
            errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Colors.red)),
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
