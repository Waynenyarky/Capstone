import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/google_auth_service.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/presentation/screens/login_page.dart';

class SessionTimeoutManager extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final GlobalKey<NavigatorState>? navigatorKey;
  
  const SessionTimeoutManager({
    super.key,
    required this.child,
    this.duration = const Duration(minutes: 5),
    this.navigatorKey,
  });

  @override
  State<SessionTimeoutManager> createState() => _SessionTimeoutManagerState();
}

class _SessionTimeoutManagerState extends State<SessionTimeoutManager> with WidgetsBindingObserver {
  Timer? _idleTimer;
  Timer? _logoutTimer;
  bool _isDialogVisible = false;
  int _lastActiveUpdate = 0;
  int _lastTimerReset = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Wait for frame to ensure Navigator is mounted
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkStatusAndStart();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _idleTimer?.cancel();
    _logoutTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkStatusAndStart();
    }
  }

  Future<void> _checkStatusAndStart() async {
    _idleTimer?.cancel();
    
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString('loggedInEmail');
    if (email == null || email.isEmpty) {
      // Not logged in, no timer needed yet.
      return;
    }

    final lastActive = prefs.getInt('sessionLastActiveAtMs') ?? 0;
    if (lastActive == 0) {
      // First run or missing, start full timer
      _startIdleTimer(widget.duration);
      return;
    }

    final now = DateTime.now().millisecondsSinceEpoch;
    final elapsed = now - lastActive;
    final maxMs = widget.duration.inMilliseconds;

    if (elapsed >= maxMs) {
      // Already expired
      _handleIdleTimeout();
    } else {
      // Resume timer for remaining time
      final remaining = Duration(milliseconds: maxMs - elapsed);
      _startIdleTimer(remaining);
    }
  }

  void _startIdleTimer(Duration d) {
    _idleTimer?.cancel();
    _idleTimer = Timer(d, _handleIdleTimeout);
  }

  void _resetTimer() {
    if (_isDialogVisible) return;
    
    final now = DateTime.now().millisecondsSinceEpoch;
    // Throttle timer resets to avoid excessive Timer creation on scroll/move
    if (now - _lastTimerReset < 1000) return; 
    _lastTimerReset = now;

    // Reset to full duration
    _startIdleTimer(widget.duration);
    _updateLastActive();
  }

  Future<void> _updateLastActive() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    // Throttle writing to prefs to avoid lag
    if (now - _lastActiveUpdate < 10000) return; // 10s throttle
    _lastActiveUpdate = now;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.containsKey('loggedInEmail')) {
        await prefs.setInt('sessionLastActiveAtMs', now);
      }
    } catch (_) {}
  }

  Future<void> _handleIdleTimeout() async {
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString('loggedInEmail');
    if (email == null || email.isEmpty) {
      return;
    }

    if (!mounted) return;
    if (_isDialogVisible) return;

    setState(() => _isDialogVisible = true);
    
    // Start force logout timer (60 seconds)
    // _logoutTimer?.cancel();
    // _logoutTimer = Timer(const Duration(seconds: 60), _performLogout);
    // REMOVE THIS: The dialog itself will handle the 60s countdown now.

    if (widget.navigatorKey != null && widget.navigatorKey!.currentState == null) {
      // Navigator might not be ready. Wait briefly.
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;
    }

    // If we can't find the navigator context, or the navigator state, we can't show the dialog.
    if (widget.navigatorKey?.currentState == null) {
      if (mounted) setState(() => _isDialogVisible = false);
      _performLogout();
      return;
    }

    // Use the navigator state directly to push the dialog, avoiding context lookup issues
    // when the SessionTimeoutManager is above the Navigator in the tree.
    final shouldStay = await widget.navigatorKey!.currentState!.push<bool>(
      DialogRoute<bool>(
        context: widget.navigatorKey!.currentContext!, // Used for theme lookup
        barrierDismissible: false,
        builder: (ctx) => _SessionExpiredDialog(
          onLogout: () => Navigator.of(ctx).pop(false),
        ),
      ),
    );

    if (mounted) {
      setState(() => _isDialogVisible = false);
    }

    _logoutTimer?.cancel();

    if (shouldStay == true) {
      // User wants to stay. Reset logic.
      _updateLastActive(); // Update timestamp to NOW
      _resetTimer();
    } else {
      _performLogout();
    }
  }

  Future<void> _performLogout() async {
    final prefs = await SharedPreferences.getInstance();
    // Check biometrics status before clearing token (API requires auth). Only pass to login when enabled.
    bool preFingerprintEnabled = false;
    String? preFingerprintEmail;
    try {
      final fpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
      if (fpEmail.isNotEmpty) {
        final s = await MongoDBService.getMfaStatusDetail(email: fpEmail).timeout(const Duration(seconds: 3));
        preFingerprintEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
        preFingerprintEmail = preFingerprintEnabled ? fpEmail : null; // only pass email when enabled so login shows biometrics only then
      }
    } catch (_) {}

    await prefs.remove('loggedInEmail');
    await prefs.remove('accessToken');
    await GoogleAuthService.signOutAndReset();

    if (!mounted) return;

    final nav = widget.navigatorKey?.currentState ?? Navigator.of(context);
    nav.pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => LoginScreen(
          preFingerprintEnabled: preFingerprintEnabled,
          preFingerprintEmail: preFingerprintEmail,
        ),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _resetTimer(),
      onPointerMove: (_) => _resetTimer(),
      onPointerUp: (_) => _resetTimer(),
      child: widget.child,
    );
  }
}

class _SessionExpiredDialog extends StatefulWidget {
  final VoidCallback onLogout;

  const _SessionExpiredDialog({required this.onLogout});

  @override
  State<_SessionExpiredDialog> createState() => _SessionExpiredDialogState();
}

class _SessionExpiredDialogState extends State<_SessionExpiredDialog> {
  Timer? _timer;
  int _secondsRemaining = 60;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        _timer?.cancel();
        widget.onLogout();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Prevent back button from closing it
      child: Dialog(
        elevation: 0,
        backgroundColor: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(25), // 0.1 * 255 ~= 25
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header with Icon
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 32),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                ),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.lock_clock_outlined,
                      size: 40,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
              
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const Text(
                      'Session Paused',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                        letterSpacing: -0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'For your security, we have paused your session due to inactivity.',
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.black54,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    
                    // Info Note
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.shield_outlined, size: 20, color: Colors.grey.shade700),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Automatic Protection',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.grey.shade800,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Your account will be logged out automatically in 1 minute to prevent unauthorized access.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey.shade600,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: FilledButton(
                        onPressed: widget.onLogout,
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'Return to Login',
                              style: TextStyle(
                                fontSize: 16, 
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white24,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '$_secondsRemaining',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
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
