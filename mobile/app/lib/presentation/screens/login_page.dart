import 'package:flutter/material.dart';
import 'dart:async';
import 'signup_page.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'profile.dart';
import 'deletion_scheduled_page.dart';
import 'security/login_mfa_screen.dart';
import 'forgot_password_page.dart';
 
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';
 
import 'package:app/data/services/google_auth_service.dart';
import '../../domain/usecases/sign_in_with_google.dart';
 
class LoginScreen extends StatefulWidget {
  final String? deletionScheduledForISO;
  final bool preFingerprintEnabled;
  final String? preFingerprintEmail;
  final bool preFaceEnabled;
  final bool preAuthenticatorEnabled;
  const LoginScreen({super.key, this.deletionScheduledForISO, this.preFingerprintEnabled = false, this.preFingerprintEmail, this.preFaceEnabled = false, this.preAuthenticatorEnabled = false});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  
  bool _rememberMe = false;
  bool _obscurePassword = true;
  bool _isLoading = false;
  
  // Track which fields have been touched
  bool _emailTouched = false;
  bool _passwordTouched = false;
  bool _autoFpAttempted = false;
  bool _fingerprintEnabled = false;
  bool _authenticatorEnabled = false;
  bool _fingerprintDeviceOk = true;
  bool _showAccountFields = false;
  String _authEmail = '';
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    
    () async {
      try {
        final prefs = await SharedPreferences.getInstance();
        final alreadyLoggedEmail = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
        if (alreadyLoggedEmail.isNotEmpty) {
          _autoFpAttempted = true;
          _fingerprintEnabled = false;
          return;
        }
      } catch (_) {}
    }();
    
    
    if (widget.preFingerprintEnabled) {
      _fingerprintEnabled = true;
    }
    if (widget.preFaceEnabled) {
      _fingerprintEnabled = true;
    }
    final preEmail = (widget.preFingerprintEmail ?? '').trim().toLowerCase();
    if (preEmail.isNotEmpty) {
      () async {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('fingerprintEmail', preEmail);
        } catch (_) {}
      }();
    }
    
    _emailController.addListener(_onEmailChanged);

    // Add focus listeners to track when fields are touched
    _emailFocus.addListener(() {
      if (!_emailFocus.hasFocus && _emailController.text.isNotEmpty) {
        setState(() => _emailTouched = true);
      }
    });
    
    _passwordFocus.addListener(() {
      if (!_passwordFocus.hasFocus && _passwordController.text.isNotEmpty) {
        setState(() => _passwordTouched = true);
      }
    });

    final iso = (widget.deletionScheduledForISO ?? '').trim();
    if (iso.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final dt = _tryParseDate(iso);
        final msg = dt != null
            ? 'Your account is scheduled for deletion in 30 days.\nScheduled for: ${_formatDateTime(dt)}'
            : 'Your account is scheduled for deletion in 30 days.';
        final messenger = ScaffoldMessenger.of(context);
        messenger.showMaterialBanner(
          MaterialBanner(
            content: Text(msg),
            leading: const Icon(Icons.warning_amber_rounded, color: Colors.orange),
            backgroundColor: Colors.orange.shade50,
            actions: [
              TextButton(
                onPressed: () => messenger.hideCurrentMaterialBanner(),
                child: const Text('Dismiss'),
              ),
            ],
          ),
        );
        Future.delayed(const Duration(seconds: 6), () {
          if (!mounted) return;
          messenger.hideCurrentMaterialBanner();
        });
      });
    }

    () async {
      try {
        final prefs = await SharedPreferences.getInstance();
        final disableOnce = prefs.getBool('disableAutoBiometricOnce') == true;
        if (disableOnce) {
          await prefs.setBool('disableAutoBiometricOnce', false);
          _autoFpAttempted = true;
          return;
        }
      } catch (_) {}
      if (widget.preFingerprintEnabled || widget.preFaceEnabled) {
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          if (!mounted || _isLoading) return;
          try {
            final supported = await _localAuth.isDeviceSupported();
            final canCheck = await _localAuth.canCheckBiometrics;
            final types = await _localAuth.getAvailableBiometrics();
            final hasFingerprint = types.contains(BiometricType.fingerprint) || types.contains(BiometricType.strong) || types.contains(BiometricType.weak);
            if (supported && canCheck && hasFingerprint) {
              await _loginWithFingerprint();
              return;
            }
          } catch (_) {}
          _detectFingerprintStatus(autoLogin: true);
        });
      } else {
        Future.microtask(() => _detectFingerprintStatus(autoLogin: true));
      }
    }();
    if (widget.preAuthenticatorEnabled) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        try {
          final prefs = await SharedPreferences.getInstance();
          final disableOnce = prefs.getBool('disableAutoAuthenticatorOnce') == true;
          if (disableOnce) {
            await prefs.setBool('disableAutoAuthenticatorOnce', false);
            return;
          }
          final alreadyLoggedEmail = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
          if (alreadyLoggedEmail.isNotEmpty) {
            return;
          }
          final email = (prefs.getString('loggedInEmail') ?? prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
          if (!mounted) return;
          if (email.isNotEmpty) {
            Navigator.push(context, MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)));
          }
        } catch (_) {}
      });
    }
  }

  @override
  void dispose() {
    _emailController.removeListener(_onEmailChanged);
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  bool _isValidEmail(String v) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
  }

  DateTime? _tryParseDate(String iso) {
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
    final s = _two(dt.second);
    return '$y-$m-$d $h:$min:$s $ampm';
  }

  String _biometricErrorText(Object e) {
    try {
      if (e is PlatformException) {
        final code = (e.code).toLowerCase();
        if (code.contains('cancel')) return '';
        if (code.contains('notavailable')) return 'Fingerprint not supported on this device';
        if (code.contains('notenrolled')) return 'No biometric enrolled on this device';
        if (code.contains('lockedout')) return 'Biometric is locked. Try again later';
      }
      final s = e.toString().toLowerCase();
      if (s.contains('cancel')) return '';
    } catch (_) {}
    return 'Fingerprint error: ${e.toString()}';
  }

  Future<void> _detectFingerprintStatus({bool autoLogin = false}) async {
    final preEmailArg = (widget.preFingerprintEmail ?? '').trim().toLowerCase();
    final preKnown = widget.preFingerprintEnabled || widget.preFaceEnabled;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload();
      final fpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
      final loggedInEmail = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
      final lastEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
      final typed = _emailController.text.trim().toLowerCase();
      final candidatesOrdered = <String>[
        if (preEmailArg.isNotEmpty && _isValidEmail(preEmailArg)) preEmailArg,
        if (loggedInEmail.isNotEmpty && _isValidEmail(loggedInEmail)) loggedInEmail,
        if (fpEmail.isNotEmpty && _isValidEmail(fpEmail)) fpEmail,
        if (lastEmail.isNotEmpty && _isValidEmail(lastEmail)) lastEmail,
        if (typed.isNotEmpty && _isValidEmail(typed)) typed,
      ];
      if (fpEmail.isNotEmpty && _isValidEmail(fpEmail)) {
        () async {
          try {
            final supported = await _localAuth.isDeviceSupported();
            final canCheck = await _localAuth.canCheckBiometrics;
            final types = await _localAuth.getAvailableBiometrics();
            final hasFingerprint = types.contains(BiometricType.fingerprint) || types.contains(BiometricType.strong) || types.contains(BiometricType.weak);
            if (!(supported && canCheck && hasFingerprint)) {
              if (mounted) setState(() => _fingerprintDeviceOk = false);
            } else {
              if (mounted) setState(() => _fingerprintDeviceOk = true);
            }
          } catch (_) {}
        }();
      }
      if (candidatesOrdered.isEmpty) {
        if (preKnown) {
          if (mounted) setState(() => _fingerprintEnabled = true);
          return;
        } else {
          if (mounted) setState(() => _fingerprintEnabled = false);
          return;
        }
      }
      final unique = <String>{};
      final candidates = <String>[];
      for (final e in candidatesOrdered) {
        if (unique.add(e)) candidates.add(e);
      }
      bool found = false;
      String chosen = '';
      try {
        for (final email in candidates) {
          final fpKey = 'fp_cache_enabled_$email';
          final authKey = 'auth_cache_enabled_$email';
          final tsKey = 'mfa_cache_ts_$email';
          
          final fpCached = prefs.getBool(fpKey) ?? false;
          final authCached = prefs.getBool(authKey) ?? false;
          final tsCached = prefs.getInt(tsKey) ?? 0;
          final ageMs = DateTime.now().millisecondsSinceEpoch - tsCached;
          
          // Cache validity: 30 days
          if ((fpCached || authCached) && ageMs < 30 * 24 * 60 * 60 * 1000 && chosen.isEmpty) {
            chosen = email;
            try { await prefs.setString('fingerprintEmail', chosen); } catch (_) {}
            if (mounted) {
              setState(() {
                _fingerprintEnabled = fpCached;
                _authenticatorEnabled = authCached;
                _authEmail = chosen;
              });
            }
          }
        }
      } catch (_) {}
      
      final futures = candidates.map((email) async {
        try {
          final status = await MongoDBService.getMfaStatusDetail(email: email).timeout(const Duration(milliseconds: 2500));
          final fpEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
          final mfaEnabled = status['success'] == true && status['enabled'] == true;
          final method = (status['method'] ?? '').toString().toLowerCase();
          final authEnabled = mfaEnabled && (method.isEmpty || method.contains('authenticator') || method.contains('otp') || method.contains('totp'));
          
          final effectiveEnabled = fpEnabled || authEnabled;

          if (!found && effectiveEnabled) {
            found = true;
            chosen = email;
            try { await prefs.setString('fingerprintEmail', chosen); } catch (_) {}
            
            if (mounted) {
              setState(() {
                _fingerprintEnabled = fpEnabled;
                _authenticatorEnabled = authEnabled;
                _authEmail = chosen;
              });
            }

            try {
              if (fpEnabled) {
                await prefs.setBool('fp_cache_enabled_$chosen', true);
              } else {
                await prefs.remove('fp_cache_enabled_$chosen');
              }
              
              if (authEnabled) {
                await prefs.setBool('auth_cache_enabled_$chosen', true);
              } else {
                await prefs.remove('auth_cache_enabled_$chosen');
              }
              
              await prefs.setInt('mfa_cache_ts_$chosen', DateTime.now().millisecondsSinceEpoch);
            } catch (_) {}

            if (fpEnabled) {
                if (autoLogin && mounted && !_isLoading && !_autoFpAttempted) {
                  _autoFpAttempted = true;
                  await _loginWithFingerprint();
                }
            } else if (authEnabled) {
                // Fingerprint not enabled, but Authenticator is.
                if (autoLogin && mounted && !_isLoading && !widget.preAuthenticatorEnabled) {
                   Navigator.push(context, MaterialPageRoute(builder: (_) => LoginMfaScreen(email: chosen)));
                }
            }
          }
          return {'email': email, 'enabled': effectiveEnabled};
        } catch (_) {
          return {'email': email, 'enabled': false};
        }
      }).toList();
      await Future.wait(futures);
      if (!found) {
        try {
          // Do not remove fingerprintEmail immediately if not found, to preserve manual retry
          // await prefs.remove('fingerprintEmail'); 
        } catch (_) {}
        if (!preKnown) {
          if (mounted) {
            setState(() {
              _fingerprintEnabled = false;
              _authenticatorEnabled = false;
              _authEmail = '';
            });
          }
        }
      }
      } catch (_) {
        if (!preKnown) {
          if (mounted) {
            setState(() {
              _fingerprintEnabled = false;
              _authenticatorEnabled = false;
              _authEmail = '';
            });
          }
        }
    }
  }

  

  

  Future<void> _loginWithFingerprint() async {
    final messenger = ScaffoldMessenger.of(context);
    String email = '';
    try {
      final prefs = await SharedPreferences.getInstance();
      final fpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
      email = fpEmail.isNotEmpty ? fpEmail : (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
    } catch (_) {}
    if (email.isEmpty || !_isValidEmail(email)) {
      final fallbackEmail = _emailController.text.trim().toLowerCase();
      if (fallbackEmail.isNotEmpty && _isValidEmail(fallbackEmail)) {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', fallbackEmail);
        } catch (_) {}
        email = fallbackEmail;
      } else {
        messenger.showSnackBar(const SnackBar(content: Text('Enable fingerprint in Security settings or enter your email once')));
        return;
      }
    }
    try {
      final assumeEnabled = widget.preFingerprintEnabled || _fingerprintEnabled;
      if (!assumeEnabled) {
        final status = await MongoDBService.getMfaStatusDetail(email: email);
        final fpEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
        if (!fpEnabled) {
          messenger.showSnackBar(const SnackBar(content: Text('Fingerprint is not enabled for this account')));
          return;
        }
      }
      final supported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;
      final types = await _localAuth.getAvailableBiometrics();
      final hasFingerprint = types.contains(BiometricType.fingerprint) || types.contains(BiometricType.strong) || types.contains(BiometricType.weak);
      if (!(supported && canCheck && hasFingerprint)) {
        messenger.showSnackBar(const SnackBar(content: Text('Fingerprint not supported on this device')));
        return;
      }
      final ok = await _localAuth.authenticate(localizedReason: 'Authentication Required');
      if (!ok) {
        return;
      }
      final start = await MongoDBService.loginStartFingerprint(email: email);
      if (start['success'] != true || start['token'] is! String || (start['token'] as String).isEmpty) {
        try {
          final status = await MongoDBService.getMfaStatusDetail(email: email);
          final fpEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
          if (!fpEnabled) {
            messenger.showSnackBar(const SnackBar(content: Text('Fingerprint is not enabled for this account')));
          } else {
            final msg = (start['message'] is String) ? start['message'] as String : 'Fingerprint login not available';
            messenger.showSnackBar(SnackBar(content: Text(msg)));
          }
        } catch (_) {
          final msg = (start['message'] is String) ? start['message'] as String : 'Fingerprint login not available';
          messenger.showSnackBar(SnackBar(content: Text(msg)));
        }
        return;
      }
      final token = start['token'] as String;
      final complete = await MongoDBService.loginCompleteFingerprint(email: email, token: token);
      if (!mounted) return;
      if (complete['success'] == true) {
        final user = (complete['user'] is Map<String, dynamic>) ? (complete['user'] as Map<String, dynamic>) : <String, dynamic>{};
        final firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
        final lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
        final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
        var avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
        final token = (user['token'] is String)
            ? (user['token'] as String)
            : ((complete['token'] is String) ? (complete['token'] as String) : '');
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.reload();
          final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
          final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
          bool isCustom = prefs.getBool(isCustomKey) == true;
          
          // Migration/Fallback: If per-email flag missing, check global
          if (!prefs.containsKey(isCustomKey) && prefs.getBool('avatarIsCustom') == true) {
             if (cachedSpecific.isNotEmpty) {
                isCustom = true;
                await prefs.setBool(isCustomKey, true);
             }
          }

          if (isCustom && cachedSpecific.isNotEmpty) {
             avatarUrl = cachedSpecific;
          } else if (cachedSpecific.isNotEmpty) {
             // Heuristic: If cached is NOT Google, and incoming IS Google, prefer cached.
             final isCachedGoogle = cachedSpecific.contains('googleusercontent.com');
             final isIncomingGoogle = avatarUrl.contains('googleusercontent.com');
             
             if (!isCachedGoogle && isIncomingGoogle) {
                avatarUrl = cachedSpecific;
                await prefs.setBool(isCustomKey, true);
                isCustom = true;
             }
          }
        } catch (_) {}

        if (avatarUrl.isEmpty) {
          try {
            final prefs = await SharedPreferences.getInstance();
            final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
            if (cachedSpecific.isNotEmpty) {
              avatarUrl = cachedSpecific;
            } else {
              final isCustom = prefs.getBool('avatarIsCustom') == true;
              final cached = (prefs.getString('lastAvatarUrl') ?? '').trim();
              if (isCustom && cached.isNotEmpty) {
                avatarUrl = cached;
              } else {
                final gPhoto = GoogleAuthService.getCurrentPhotoUrl();
                if (gPhoto != null && gPhoto.isNotEmpty) {
                  avatarUrl = gPhoto;
                }
              }
            }
          } catch (_) {}
        }
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', email);
          await prefs.setString('fingerprintEmail', email);
          await prefs.setString('loggedInEmail', email.toLowerCase());
          await prefs.setInt('sessionLoginAtMs', DateTime.now().millisecondsSinceEpoch);
          await prefs.setString('cachedFirstName', firstName);
          await prefs.setString('cachedLastName', lastName);
          await prefs.setString('cachedPhoneNumber', phoneNumber);
          if (token.isNotEmpty) {
            await prefs.setString('accessToken', token);
          }
          if (avatarUrl.isNotEmpty) {
             // Avoid overwriting custom avatar with backend default if custom flag is set
             final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
             var isCustom = prefs.getBool(isCustomKey) == true;
             if (!isCustom && prefs.getBool('avatarIsCustom') == true) isCustom = true;
             final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
             final lastCached = (prefs.getString('lastAvatarUrl') ?? '').trim();

             if (!isCustom || avatarUrl == cachedSpecific || avatarUrl == lastCached) {
                await prefs.setString('avatar_url_${email.toLowerCase()}', avatarUrl);
             }
          }
          final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
          var isCustom = prefs.getBool(isCustomKey) == true;
          if (!isCustom && prefs.getBool('avatarIsCustom') == true) isCustom = true;
          if (avatarUrl.isNotEmpty && !isCustom) {
             await prefs.setString('lastAvatarUrl', avatarUrl);
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
        final msg = (complete['message'] is String) ? complete['message'] as String : 'Fingerprint login failed';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      final msg = _biometricErrorText(e);
      if (msg.isNotEmpty) {
        messenger.showSnackBar(SnackBar(content: Text(msg)));
      }
    }
  }

  Widget _buildValidationIcon(bool isValid, bool isTouched, String text) {
    if (text.isEmpty || !isTouched) {
      return const SizedBox.shrink();
    }
    
    return Icon(
      isValid ? Icons.check_circle : Icons.error_outline,
      color: isValid ? Colors.green : Colors.red,
      size: 20,
    );
  }

  Widget _squareAction({
    required IconData icon,
    required String label,
    required VoidCallback? onTap,
    Widget? trailing,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 84,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.blue.shade700, size: 24),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                label,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 12),
              trailing,
            ],
          ],
        ),
      ),
    );
  }

  

  InputDecoration _buildInputDecoration({
    required String label,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(prefixIcon),
      suffixIcon: suffixIcon,
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
  );
}

  Future<void> _signInWithGoogle() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      if (!GoogleAuthService.isSupportedPlatform()) {
        setState(() => _isLoading = false);
        messenger.showSnackBar(const SnackBar(content: Text('Google Sign-In is only available on Android or iOS')));
        return;
      }
      try {
        final typedPre = _emailController.text.trim().toLowerCase();
        if (_isValidEmail(typedPre)) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', typedPre);
        }
      } catch (_) {}
      final auth = await GoogleAuthService.signInGetTokenAndEmail();
      final idToken = (auth['idToken'] ?? '').toString();
      final email = (auth['email'] ?? '').toString();
      final providerId = (auth['providerId'] ?? '').toString();
      final displayName = (auth['displayName'] ?? '').toString();
      final authPhotoUrl = (auth['photoUrl'] ?? '').toString();
      final errCode = (auth['errorCode'] ?? '').toString();
      final errMsg = (auth['errorMessage'] ?? '').toString();
      if (idToken.isEmpty && email.isEmpty) {
        setState(() => _isLoading = false);
        final detail = (errCode.isNotEmpty || errMsg.isNotEmpty) ? ' ($errCode${errMsg.isNotEmpty ? ': $errMsg' : ''})' : '';
        messenger.showSnackBar(SnackBar(content: Text('Google Sign-In canceled or failed$detail')));
        return;
      }
      // Derive names from displayName if available (first two words as first name)
      String? firstNameArg;
      String? lastNameArg;
      if (displayName.isNotEmpty) {
        final parts = displayName.trim().split(RegExp(r'\s+'));
        if (parts.isNotEmpty) {
          if (parts.length >= 2) {
            final f = '${parts[0].trim()} ${parts[1].trim()}'.trim();
            firstNameArg = f.isNotEmpty ? f : null;
            final l = parts.length > 2 ? parts.sublist(2).join(' ').trim() : '';
            lastNameArg = l.isNotEmpty ? l : null;
          } else {
            final f = parts.first.trim();
            firstNameArg = f.isNotEmpty ? f : null;
            lastNameArg = null;
          }
        }
      }
      if (firstNameArg != null && firstNameArg.trim().isEmpty) firstNameArg = null;
      if (lastNameArg != null && lastNameArg.trim().isEmpty) lastNameArg = null;
      final usecase = SignInWithGoogle();
      final result = await usecase.call(
        idToken: idToken.isNotEmpty ? idToken : 'none:${DateTime.now().millisecondsSinceEpoch}',
        email: email.isNotEmpty ? email : null,
        providerId: providerId.isNotEmpty ? providerId : null,
        emailVerified: true,
        firstName: firstNameArg,
        lastName: lastNameArg,
      );
      setState(() => _isLoading = false);
      if (result['success'] == true) {
        final user = (result['user'] is Map<String, dynamic>) ? (result['user'] as Map<String, dynamic>) : <String, dynamic>{};
        final email = (user['email'] is String) ? user['email'] as String : '';
        var firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
        var lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
        final token = (user['token'] is String)
            ? (user['token'] as String)
            : ((result['token'] is String) ? (result['token'] as String) : '');
        try {
          final status = await MongoDBService.getMfaStatusDetail(email: email);
          final enabledMfa = status['success'] == true && status['enabled'] == true;
          final method = (status['method'] ?? '').toString().toLowerCase();
          final hasAuthenticator = method.contains('authenticator');
          if (enabledMfa && hasAuthenticator) {
            if (!mounted) return;
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)),
            );
            return;
          }
        } catch (_) {}
        if (displayName.isNotEmpty) {
          final parts = displayName.trim().split(RegExp(r'\s+'));
          if (parts.isNotEmpty) {
            if (firstName.isEmpty || firstName.toLowerCase() == 'user') {
              if (parts.length >= 2) {
                firstName = '${parts[0].trim()} ${parts[1].trim()}'.trim();
              } else {
                firstName = parts.first.trim();
              }
            }
            if (lastName.isEmpty || lastName.toLowerCase() == 'user') {
              final l = parts.length > 2 ? parts.sublist(2).join(' ').trim() : '';
              lastName = l;
            }
          }
        }
        if ((firstName.isEmpty || firstName.toLowerCase() == 'user') && email.isNotEmpty) {
          final local = email.split('@').first;
          final tokens = local.split(RegExp(r'[._\- ]+')).where((t) => t.trim().isNotEmpty).toList();
          if (tokens.isNotEmpty) {
            if (firstName.isEmpty || firstName.toLowerCase() == 'user') firstName = tokens.first.trim();
            if (lastName.isEmpty && tokens.length > 1) lastName = tokens.sublist(1).join(' ').trim();
          }
        }
        final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
        var avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.reload();
          final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
          final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
          bool isCustom = prefs.getBool(isCustomKey) == true;
          
          // Migration/Fallback: If per-email flag missing, check global
          if (!prefs.containsKey(isCustomKey) && prefs.getBool('avatarIsCustom') == true) {
             if (cachedSpecific.isNotEmpty) {
                isCustom = true;
                await prefs.setBool(isCustomKey, true);
             }
          }

          if (isCustom && cachedSpecific.isNotEmpty) {
             avatarUrl = cachedSpecific;
          } else if (cachedSpecific.isNotEmpty) {
             // Heuristic: If cached is NOT Google, and incoming IS Google, prefer cached.
             final isCachedGoogle = cachedSpecific.contains('googleusercontent.com');
             final isIncomingGoogle = avatarUrl.contains('googleusercontent.com');
             
             if (!isCachedGoogle && isIncomingGoogle) {
                avatarUrl = cachedSpecific;
                await prefs.setBool(isCustomKey, true);
                isCustom = true;
             }
          }
        } catch (_) {}

        if (avatarUrl.isEmpty) {
          try {
            final prefs = await SharedPreferences.getInstance();
            final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
            if (cachedSpecific.isNotEmpty) {
              avatarUrl = cachedSpecific;
            } else {
              final isCustom = prefs.getBool('avatarIsCustom') == true;
              final cached = (prefs.getString('lastAvatarUrl') ?? '').trim();
              if (isCustom && cached.isNotEmpty) {
                avatarUrl = cached;
              } else if (authPhotoUrl.isNotEmpty) {
                avatarUrl = authPhotoUrl;
              } else {
                final gPhoto = GoogleAuthService.getCurrentPhotoUrl();
                if (gPhoto != null && gPhoto.isNotEmpty) {
                  avatarUrl = gPhoto;
                }
              }
            }
          } catch (_) {}
        }
        if (!mounted) return;
        final navigator = Navigator.of(context);
        try {
          final prefs = await SharedPreferences.getInstance();
          if (email.isNotEmpty) await prefs.setString('lastLoginEmail', email);
          if (email.isNotEmpty) await prefs.setString('loggedInEmail', email.toLowerCase());
          await prefs.setInt('sessionLoginAtMs', DateTime.now().millisecondsSinceEpoch);
          await prefs.setString('cachedFirstName', firstName);
          await prefs.setString('cachedLastName', lastName);
          await prefs.setString('cachedPhoneNumber', phoneNumber);
          if (token.isNotEmpty) {
            await prefs.setString('accessToken', token);
          }
          if (email.isNotEmpty) {
            try {
              final status = await MongoDBService.getMfaStatusDetail(email: email);
              final fpEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
              if (fpEnabled) {
                await prefs.setString('fingerprintEmail', email.toLowerCase());
              }
            } catch (_) {}
          }
          if (avatarUrl.isNotEmpty) {
             // Avoid overwriting custom avatar with backend default if custom flag is set
             final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
             var isCustom = prefs.getBool(isCustomKey) == true;
             if (!isCustom && prefs.getBool('avatarIsCustom') == true) isCustom = true;
             final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
             final lastCached = (prefs.getString('lastAvatarUrl') ?? '').trim();

             if (!isCustom || avatarUrl == cachedSpecific || avatarUrl == lastCached) {
                await prefs.setString('avatar_url_${email.toLowerCase()}', avatarUrl);
             }
          }
          final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
          var isCustom = prefs.getBool(isCustomKey) == true;
          if (!isCustom && prefs.getBool('avatarIsCustom') == true) isCustom = true;
          if (avatarUrl.isNotEmpty && !isCustom) {
             await prefs.setString('lastAvatarUrl', avatarUrl);
          }
        } catch (_) {}
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
        final msg = (result['message'] is String) ? result['message'] as String : 'Google login failed';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      setState(() => _isLoading = false);
      messenger.showSnackBar(SnackBar(content: Text('Google login error: ${e.toString()}')));
    }
  }



  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmallScreen = size.width < 360;
    final isMediumScreen = size.width >= 360 && size.width < 600;
    
    final horizontalPadding = isSmallScreen ? 16.0 : (isMediumScreen ? 24.0 : 32.0);
    final verticalPadding = isSmallScreen ? 16.0 : 20.0;
    final titleFontSize = isSmallScreen ? 26.0 : 30.0;
    final subtitleFontSize = isSmallScreen ? 14.0 : 16.0;
    final iconSize = isSmallScreen ? 70.0 : 90.0;
    final spacing = isSmallScreen ? 14.0 : 18.0;
    final largeSpacing = isSmallScreen ? 24.0 : 28.0;

    final emailValid = _isValidEmail(_emailController.text);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: horizontalPadding,
              vertical: verticalPadding,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo/Icon
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.lock_outline,
                        size: iconSize,
                        color: Colors.blue,
                      ),
                    ),
                    SizedBox(height: largeSpacing),
                    
                    // Title
                    Text(
                      'Welcome Back',
                      style: TextStyle(
                        fontSize: titleFontSize,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Login to your account',
                      style: TextStyle(
                        fontSize: subtitleFontSize,
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: largeSpacing + 8),
                    
                    if (_fingerprintEnabled) ...[
                      if (!_showAccountFields)
                        _squareAction(
                          icon: Icons.lock_outline,
                          label: 'Login Using Account',
                          onTap: _isLoading ? null : () => setState(() => _showAccountFields = true),
                        ),
                      if (!_showAccountFields) SizedBox(height: spacing),
                      if (!_showAccountFields)
                        _squareAction(
                          icon: Icons.fingerprint,
                          label: 'Login Using Biometrics',
                          onTap: _isLoading ? null : _loginWithFingerprint,
                          trailing: _fingerprintDeviceOk
                              ? null
                              : const Icon(Icons.error_outline, color: Colors.red, size: 20),
                        ),
                      SizedBox(height: spacing),
                    ] else ...[
                      if (!_showAccountFields)
                        _squareAction(
                          icon: Icons.lock_outline,
                          label: 'Login Using Account',
                          onTap: _isLoading ? null : () => setState(() => _showAccountFields = true),
                        ),
                      if (!_showAccountFields) SizedBox(height: spacing),
                    ],

                    if (_showAccountFields) ...[
                      if (_fingerprintEnabled) ...[
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: _isLoading ? null : _loginWithFingerprint,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.blue.shade700,
                              side: BorderSide(color: Colors.blue.shade300),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                            ),
                            icon: const Icon(Icons.fingerprint, size: 20),
                            label: const Text('Login Using Biometrics', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          ),
                        ),
                        SizedBox(height: spacing),
                      ],
                      // Email Field
                      TextFormField(
                        controller: _emailController,
                        focusNode: _emailFocus,
                        keyboardType: TextInputType.emailAddress,
                        enabled: !_isLoading,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9._@+\-]')),
                        ],
                        decoration: _buildInputDecoration(
                          label: 'Email',
                          prefixIcon: Icons.email_outlined,
                          suffixIcon: _buildValidationIcon(
                            emailValid,
                            _emailTouched,
                            _emailController.text,
                          ),
                        ),
                        onChanged: (_) => setState(() {}),
                        onFieldSubmitted: (_) => _refreshFingerprintStatusForEmail(),
                        validator: (value) {
                          if (!_emailTouched) return null;
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          final v = value.trim();
                          final looksEmail = v.contains('@');
                          final isDevAdmin = v == '1';
                          if (!looksEmail && !isDevAdmin) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                      if (_isValidEmail(_emailController.text.trim()) && _authenticatorEnabled && _emailController.text.trim().toLowerCase() == _authEmail)
                        Padding(
                          padding: const EdgeInsets.only(top: 8, left: 4),
                          child: Row(
                            children: [
                              Icon(Icons.shield_outlined, size: 16, color: Colors.green.shade700),
                              const SizedBox(width: 6),
                              Text(
                                'Two-Factor Authentication Enabled',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.green.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      SizedBox(height: spacing),

                      // Password Field
                      TextFormField(
                        controller: _passwordController,
                        focusNode: _passwordFocus,
                        obscureText: _obscurePassword,
                        enabled: !_isLoading,
                        decoration: _buildInputDecoration(
                          label: 'Password',
                          prefixIcon: Icons.lock_outlined,
                          suffixIcon: _passwordController.text.isNotEmpty
                              ? IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                )
                              : null,
                        ),
                        onChanged: (_) => setState(() {}),
                        validator: (value) {
                          if (!_passwordTouched) return null;
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: spacing / 2),

                      // Remember Me & Forgot Password
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          InkWell(
                            onTap: _isLoading ? null : () {
                              setState(() {
                                _rememberMe = !_rememberMe;
                              });
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Checkbox(
                                    value: _rememberMe,
                                    onChanged: _isLoading ? null : (value) {
                                      setState(() {
                                        _rememberMe = value ?? false;
                                      });
                                    },
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    visualDensity: VisualDensity.compact,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                  Text(
                                    'Remember me',
                                    style: TextStyle(
                                      fontSize: subtitleFontSize,
                                      color: Colors.grey.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _isLoading ? null : () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const ForgotPasswordPage(),
                                ),
                              );
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              minimumSize: const Size(0, 0),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Forgot Password?',
                              style: TextStyle(
                                fontSize: subtitleFontSize,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: largeSpacing),

                      // Login Button
                      ElevatedButton(
                        onPressed: _isLoading
                            ? null
                            : ((_isValidEmail(_emailController.text.trim()) && _authenticatorEnabled && _emailController.text.trim().toLowerCase() == _authEmail)
                                ? _navigateToMfa
                                : _loginAccountOnly),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.symmetric(
                            vertical: isSmallScreen ? 14 : 16,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : ((_isValidEmail(_emailController.text.trim()) && _authenticatorEnabled && _emailController.text.trim().toLowerCase() == _authEmail)
                                ? Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Login ',
                                        style: TextStyle(
                                          fontSize: subtitleFontSize + 1,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(999),
                                          border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.shield, size: 14, color: Colors.white),
                                            const SizedBox(width: 6),
                                            Text(
                                              'MFA',
                                              style: TextStyle(
                                                fontSize: subtitleFontSize,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  )
                                : Text(
                                    'Login',
                                    style: TextStyle(
                                      fontSize: subtitleFontSize + 1,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  )),
                       ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            Expanded(child: Divider(color: Colors.grey.shade300)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Text(
                                'Or',
                                style: TextStyle(
                                  fontSize: subtitleFontSize - 1,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ),
                            Expanded(child: Divider(color: Colors.grey.shade300)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : _signInWithGoogle,
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        ),
                        icon: const GoogleGIcon(size: 22),
                        label: const Text('Continue with Google', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                      
                      
                      SizedBox(height: spacing),
                    ],
                    
                    
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 4,
                      runSpacing: 4,
                      children: [
                        Text(
                          "Don't have an account?",
                          style: TextStyle(
                            fontSize: subtitleFontSize,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        TextButton(
                          onPressed: _isLoading ? null : () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SignUpScreen(),
                              ),
                            );
                          },
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: const Size(0, 0),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Sign Up',
                            style: TextStyle(
                              fontSize: subtitleFontSize,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _loginAccountOnly() async {
    setState(() {
      _emailTouched = true;
      _passwordTouched = true;
    });
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final messenger = ScaffoldMessenger.of(context);
      final emailVal = _emailController.text.trim().toLowerCase();
      
      // Attempt login. Note: We do NOT bypass fingerprint anymore to ensure strict enforcement.
      // If fingerprint is enabled/required, the backend will return 'fingerprint_required'.
      final result = await MongoDBService.login(
        email: emailVal,
        password: _passwordController.text,
        bypassFingerprint: false, 
      );
      setState(() => _isLoading = false);
      if (result['success']) {
        if (!mounted) return;
        final user = (result['user'] is Map<String, dynamic>) ? (result['user'] as Map<String, dynamic>) : <String, dynamic>{};
        final firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
        final lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
        final email = (user['email'] is String) ? user['email'] as String : '';
        final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
        final avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
        final token = (user['token'] is String)
            ? (user['token'] as String)
            : ((result['token'] is String) ? (result['token'] as String) : '');
        final navigator = Navigator.of(context);
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', email);
          await prefs.setString('loggedInEmail', email.toLowerCase());
          await prefs.setInt('sessionLoginAtMs', DateTime.now().millisecondsSinceEpoch);
          await prefs.setString('cachedFirstName', firstName);
          await prefs.setString('cachedLastName', lastName);
          await prefs.setString('cachedPhoneNumber', phoneNumber);
          if (token.isNotEmpty) {
            await prefs.setString('accessToken', token);
          }
          if (avatarUrl.isNotEmpty) {
            final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
            var isCustom = prefs.getBool(isCustomKey) == true;
            if (!isCustom && prefs.getBool('avatarIsCustom') == true) isCustom = true;
            final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
            final lastCached = (prefs.getString('lastAvatarUrl') ?? '').trim();
            
            if (!isCustom || avatarUrl == cachedSpecific || avatarUrl == lastCached) {
              await prefs.setString('avatar_url_${email.toLowerCase()}', avatarUrl);
            }
          }
          final isCustomKey = 'avatarIsCustom_${email.toLowerCase()}';
          var isCustom = prefs.getBool(isCustomKey) == true;
          if (!isCustom && prefs.getBool('avatarIsCustom') == true) isCustom = true;
          if (avatarUrl.isNotEmpty && !isCustom) {
            await prefs.setString('lastAvatarUrl', avatarUrl);
          }
        } catch (_) {}
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
        final code = (result['code'] is String) ? (result['code'] as String).toLowerCase() : '';
        final msg = (result['message'] is String && (result['message'] as String).trim().isNotEmpty)
            ? result['message'] as String
            : 'Incorrect email or password';
        
        final email = _emailController.text.trim().toLowerCase();
        final prefs = await SharedPreferences.getInstance();

        // Check for MFA requirement (Authenticator/OTP)
        if (code == 'mfa_required' || msg.toLowerCase().contains('mfa') || msg.toLowerCase().contains('verification code')) {
          if (!mounted) return;
          
          // Learn: Authenticator is enabled
          if (!_authenticatorEnabled) {
            setState(() {
              _authenticatorEnabled = true;
              _authEmail = email;
            });
            await prefs.setBool('auth_cache_enabled_$email', true);
            await prefs.setInt('mfa_cache_ts_$email', DateTime.now().millisecondsSinceEpoch);
          }
          
          if (!mounted) return;

          final nav = Navigator.of(context);
          nav.push(
            MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)),
          );
          return;
        }

        // Check for Fingerprint requirement
        if (code == 'fingerprint_required' || msg.toLowerCase().contains('fingerprint')) {
           if (!mounted) return;
           
           // Learn: Fingerprint is enabled
           if (!_fingerprintEnabled) {
              setState(() => _fingerprintEnabled = true);
              await prefs.setString('fingerprintEmail', email);
              await prefs.setBool('fp_cache_enabled_$email', true);
              await prefs.setInt('mfa_cache_ts_$email', DateTime.now().millisecondsSinceEpoch);
            }
            
            if (!mounted) return;
 
            // If Authenticator is also enabled, offer a choice or fallback
            if (_authenticatorEnabled) {
             final nav = Navigator.of(context);
             // Show a dialog to let user choose
             showDialog(
               context: context,
               barrierDismissible: false,
               builder: (ctx) => AlertDialog(
                 title: const Text('Authentication Required'),
                 content: const Text('Please verify your identity using Biometrics or your Authenticator App.'),
                 actions: [
                   TextButton(
                     onPressed: () {
                       Navigator.pop(ctx); // Close dialog
                       nav.push(MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)));
                     },
                     child: const Text('Use Authenticator'),
                   ),
                   FilledButton(
                     onPressed: () {
                       Navigator.pop(ctx); // Close dialog
                       _loginWithFingerprint();
                     },
                     child: const Text('Scan Fingerprint'),
                   ),
                 ],
               ),
             );
             return;
           }

           messenger.showSnackBar(const SnackBar(content: Text('Biometric authentication is required for this account')));
           // Trigger fingerprint flow
           _loginWithFingerprint();
           return;
        }
        
        messenger.showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _navigateToMfa() async {
    final messenger = ScaffoldMessenger.of(context);
    var email = _emailController.text.trim().toLowerCase();
    if (!_isValidEmail(email)) {
      try {
        final prefs = await SharedPreferences.getInstance();
        email = (prefs.getString('loggedInEmail') ?? prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
      } catch (_) {}
    }
    if (email.isEmpty || !_isValidEmail(email)) {
      messenger.showSnackBar(const SnackBar(content: Text('Enter your email first')));
      return;
    }
    if (!mounted) return;
    Navigator.push(context, MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)));
  }

  Timer? _fpDebounce;
  
  void _onEmailChanged() {
    _refreshFingerprintStatusForEmail();
  }

  void _refreshFingerprintStatusForEmail() {
    final email = _emailController.text.trim().toLowerCase();
    if (!_isValidEmail(email)) {
      return;
    }
    _fpDebounce?.cancel();
    _fpDebounce = Timer(const Duration(milliseconds: 400), () async {
      try {
        final status = await MongoDBService.getMfaStatusDetail(email: email);
        final fingerEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
        final mfaEnabled = status['success'] == true && status['enabled'] == true;
        final method = (status['method'] ?? '').toString().toLowerCase();
        // Fallback: If MFA is enabled but method is unspecified/empty, assume it's the standard Authenticator/OTP
        final authEnabled = mfaEnabled && (method.isEmpty || method.contains('authenticator') || method.contains('otp') || method.contains('totp'));
        
        if (mounted) {
          setState(() {
            if (fingerEnabled) {
              _fingerprintEnabled = true;
            }
            _authenticatorEnabled = authEnabled;
            _authEmail = authEnabled ? email : '';
          });
        }
        
        // Update cache for this email
        try {
          final prefs = await SharedPreferences.getInstance();
          if (fingerEnabled) {
            await prefs.setString('fingerprintEmail', email);
          }
          
          if (fingerEnabled) {
            await prefs.setBool('fp_cache_enabled_$email', true);
          } else {
            await prefs.remove('fp_cache_enabled_$email');
          }
          
          if (authEnabled) {
            await prefs.setBool('auth_cache_enabled_$email', true);
          } else {
            await prefs.remove('auth_cache_enabled_$email');
          }
          
          await prefs.setInt('mfa_cache_ts_$email', DateTime.now().millisecondsSinceEpoch);
        } catch (_) {}
      } catch (_) {
        if (mounted) {
          setState(() {
            _authenticatorEnabled = false;
            _authEmail = '';
          });
        }
      }
    });
  }
}

class GoogleGIcon extends StatelessWidget {
  final double size;
  const GoogleGIcon({super.key, this.size = 20});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _GoogleGPainter(),
      ),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.18;
    final rect = Rect.fromLTWH(stroke, stroke, size.width - stroke * 2, size.height - stroke * 2);
    Paint seg(Color c) => Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = c;
    final blue = seg(const Color(0xFF4285F4));
    final red = seg(const Color(0xFFDB4437));
    final yellow = seg(const Color(0xFFF4B400));
    final green = seg(const Color(0xFF0F9D58));

    canvas.drawArc(rect, _deg(315), _deg(90), false, blue);
    canvas.drawArc(rect, _deg(45), _deg(90), false, red);
    canvas.drawArc(rect, _deg(135), _deg(90), false, yellow);
    canvas.drawArc(rect, _deg(225), _deg(90), false, green);

    final cx = size.width / 2;
    final cy = size.height / 2;
    final cut = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFF4285F4);
    canvas.drawLine(Offset(cx, cy), Offset(cx + rect.width / 2, cy), cut);
  }
  double _deg(double d) => d * 3.1415926535 / 180.0;
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
