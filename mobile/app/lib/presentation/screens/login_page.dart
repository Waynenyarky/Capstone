import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/core/theme/app_theme.dart';
import 'dart:async';
import 'package:app/data/services/mongodb_service.dart';
import 'deletion_scheduled_page.dart';
import 'inspector/inspector_shell.dart';
import 'inspector/inspector_onboarding_screen.dart';
import 'security/login_mfa_screen.dart';

import 'package:shared_preferences/shared_preferences.dart';
 
class LoginScreen extends StatefulWidget {
  final String? deletionScheduledForISO;
  final bool preAuthenticatorEnabled;
  final bool notInspector;
  const LoginScreen({super.key, this.deletionScheduledForISO, this.preAuthenticatorEnabled = false, this.notInspector = false});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  
  bool _obscurePassword = true;
  bool _isLoading = false;

  bool _emailTouched = false;
  bool _passwordTouched = false;
  bool _authenticatorEnabled = false;
  String _authEmail = '';

  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onEmailChanged);

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

    if (widget.notInspector) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final messenger = ScaffoldMessenger.of(context);
        messenger.showSnackBar(
          const SnackBar(
            content: Text('This app is for inspectors only. Please use the web portal for other roles.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      });
    }

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

  /// Uses BizClearColors (theme) so fields match the rest of the app and the web.
  InputDecoration _buildInputDecoration({
    required String label,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      suffixIcon: suffixIcon,
      contentPadding: BizClearColors.inputFieldContentPadding,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: BizClearColors.inputBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: BizClearColors.inputFocusedBorder, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmallScreen = size.width < 360;
    final isMediumScreen = size.width >= 360 && size.width < 600;
    
    final horizontalPadding = isSmallScreen ? 16.0 : (isMediumScreen ? 24.0 : 32.0);
    final verticalPadding = isSmallScreen ? 16.0 : 20.0;
    final titleFontSize = isSmallScreen ? 18.0 : 20.0;
    final subtitleFontSize = isSmallScreen ? 14.0 : 16.0;
    final iconSize = isSmallScreen ? 72.0 : 88.0;
    final spacing = isSmallScreen ? 14.0 : 18.0;
    final largeSpacing = isSmallScreen ? 24.0 : 28.0;

    return Scaffold(
      backgroundColor: BizClearColors.background,
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
                    // Logo (three circles - match web BizClearLogo)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: SvgPicture.asset(
                        'assets/bizclear_logo.svg',
                        height: iconSize,
                        width: iconSize,
                        fit: BoxFit.contain,
                      ),
                    ),
                    SizedBox(height: isSmallScreen ? 4.0 : 6.0),
                    
                    // Title (match web: "Sign In with BizClear")
                    Text(
                      'Sign In with BizClear',
                      style: TextStyle(
                        fontSize: titleFontSize,
                        fontWeight: FontWeight.bold,
                        color: BizClearColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: largeSpacing + 8),
                    
                    // Email Field
                    SizedBox(
                      height: AppTheme.inputFieldMinHeight,
                      child: TextFormField(
                        controller: _emailController,
                        focusNode: _emailFocus,
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        enableSuggestions: false,
                        enabled: !_isLoading,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9._@+\-]')),
                        ],
                        decoration: _buildInputDecoration(label: 'Email'),
                        onChanged: (_) => setState(() {}),
                        onFieldSubmitted: (_) => _refreshMfaStatusForEmail(),
                        validator: (value) {
                          if (!_emailTouched) return null;
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          final v = value.trim();
                          final looksEmail = v.contains('@');
                          final isDevAdmin = kDebugMode && v == '1';
                          if (!looksEmail && !isDevAdmin) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                    ),
                    if (_isValidEmail(_emailController.text.trim()) && _authenticatorEnabled && _emailController.text.trim().toLowerCase() == _authEmail)
                      Padding(
                        padding: const EdgeInsets.only(top: 8, left: 4),
                        child: Row(
                          children: [
                            Icon(Icons.shield_outlined, size: 16, color: BizClearColors.success),
                            const SizedBox(width: 6),
                            Text(
                              'Two-Factor Authentication Enabled',
                              style: TextStyle(
                                fontSize: 12,
                                color: BizClearColors.success,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    SizedBox(height: spacing),

                    // Password Field
                    SizedBox(
                      height: AppTheme.inputFieldMinHeight,
                      child: TextFormField(
                        controller: _passwordController,
                        focusNode: _passwordFocus,
                        obscureText: _obscurePassword,
                        enabled: !_isLoading,
                        decoration: _buildInputDecoration(
                          label: 'Password',
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
                    ),
                    SizedBox(height: spacing),

                    // Login Button
                    ElevatedButton(
                      onPressed: _isLoading
                          ? null
                          : ((_isValidEmail(_emailController.text.trim()) && _authenticatorEnabled && _emailController.text.trim().toLowerCase() == _authEmail)
                              ? _navigateToMfa
                              : _loginAccountOnly),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: BizClearColors.webPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                        padding: BizClearColors.primaryButtonPadding,
                        minimumSize: BizClearColors.primaryButtonMinimumSize,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        textStyle: BizClearColors.primaryButtonTextStyle,
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
                                  'Sign in',
                                  style: TextStyle(
                                    fontSize: subtitleFontSize + 1,
                                    fontWeight: FontWeight.w600,
                                  ),
                                )),
                    ),
                    SizedBox(height: spacing),


                    // Inspector-only app: no self signup (Inspectors are created by admin)
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
      
      // Attempt login. We bypass fingerprint to allow password-only login as requested.
      final result = await MongoDBService.login(
        email: emailVal,
        password: _passwordController.text,
        bypassFingerprint: true, 
      );
      setState(() => _isLoading = false);
      if (result['requiresTotp'] == true) {
        final loginEmail = (result['loginEmail'] ?? emailVal).toString();
        if (loginEmail.isNotEmpty && mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => LoginMfaScreen(email: loginEmail)),
          );
        } else {
          messenger.showSnackBar(SnackBar(content: Text((result['message'] ?? 'MFA required').toString())));
        }
        return;
      }
      if (result['requiresOtp'] == true) {
        final loginEmail = (result['loginEmail'] ?? emailVal).toString();
        if (loginEmail.isNotEmpty && mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => LoginMfaScreen(email: loginEmail, isEmailOtp: true),
            ),
          );
        } else {
          messenger.showSnackBar(
            SnackBar(
              content: Text((result['message'] ?? 'Check your email for the verification code').toString()),
              backgroundColor: BizClearColors.webPrimary,
            ),
          );
        }
        return;
      }
      if (result['success']) {
        if (!mounted) return;
        final user = (result['user'] is Map<String, dynamic>) ? (result['user'] as Map<String, dynamic>) : <String, dynamic>{};
        final role = (user['role'] is String) ? (user['role'] as String).toLowerCase() : '';
        if (role != 'inspector') {
          messenger.showSnackBar(
            const SnackBar(
              content: Text('This app is for inspectors only. Please use the web portal for other roles.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 5),
            ),
          );
          return;
        }
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
        final profileUser = (profileRes['user'] is Map<String, dynamic>) ? (profileRes['user'] as Map<String, dynamic>) : <String, dynamic>{};
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
        final mustChange = profileUser['mustChangeCredentials'] == true;
        final mustMfa = profileUser['mustSetupMfa'] == true;
        if (mustChange || mustMfa) {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => InspectorOnboardingScreen(
                email: email,
                token: token,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                avatarUrl: avatarUrl,
                mustChangeCredentials: mustChange,
                mustSetupMfa: mustMfa,
              ),
            ),
            (route) => false,
          );
          return;
        }
        navigator.pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => InspectorShell(
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

        // Server may still return fingerprint_required; redirect to MFA (authenticator only in app)
        if (code == 'fingerprint_required' || msg.toLowerCase().contains('fingerprint')) {
          if (!mounted) return;
          final nav = Navigator.of(context);
          nav.push(
            MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)),
          );
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Please sign in with your authenticator app.'),
              backgroundColor: BizClearColors.webPrimary,
            ),
          );
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

  Timer? _mfaDebounce;
  
  void _onEmailChanged() {
    _refreshMfaStatusForEmail();
  }

  void _refreshMfaStatusForEmail() {
    final email = _emailController.text.trim().toLowerCase();
    if (!_isValidEmail(email)) {
      return;
    }
    _mfaDebounce?.cancel();
    _mfaDebounce = Timer(const Duration(milliseconds: 400), () async {
      try {
        final status = await MongoDBService.getMfaStatusDetail(email: email);
        final mfaEnabled = status['success'] == true && status['enabled'] == true;
        final method = (status['method'] ?? '').toString().toLowerCase();
        final authEnabled = mfaEnabled && (method.isEmpty || method.contains('authenticator') || method.contains('otp') || method.contains('totp'));
        
        if (mounted) {
          setState(() {
            _authenticatorEnabled = authEnabled;
            _authEmail = authEnabled ? email : '';
          });
        }
        
        try {
          final prefs = await SharedPreferences.getInstance();
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
