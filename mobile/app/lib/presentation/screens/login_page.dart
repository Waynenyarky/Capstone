import 'package:flutter/material.dart';
import 'signup_page.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'profile.dart';
import 'deletion_scheduled_page.dart';
import 'security/login_mfa_screen.dart';
 
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';
 

class LoginScreen extends StatefulWidget {
  final String? deletionScheduledForISO;
  const LoginScreen({super.key, this.deletionScheduledForISO});

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
  bool _showAccountFields = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    
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

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (_autoFpAttempted) return;
      _autoFpAttempted = true;
      try {
        final prefs = await SharedPreferences.getInstance();
        var email = (prefs.getString('lastLoginEmail') ?? '').trim();
        if (email.isEmpty || !_isValidEmail(email)) {
          final typed = _emailController.text.trim();
          if (typed.isNotEmpty && _isValidEmail(typed)) {
            email = typed;
            await prefs.setString('lastLoginEmail', email);
          } else {
            if (mounted) setState(() => _fingerprintEnabled = false);
            return;
          }
        }
        final status = await MongoDBService.getMfaStatusDetail(email: email);
        final fingerEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
        if (mounted) setState(() => _fingerprintEnabled = fingerEnabled);
        if (fingerEnabled && mounted && !_isLoading) {
          if (!mounted) return;
          await _loginWithFingerprint();
        }
      } catch (_) {}
    });
  }

  @override
  void dispose() {
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

  void _showForgotPasswordDialog() {
    final emailController = TextEditingController();
    final newPwdController = TextEditingController();
    final confirmPwdController = TextEditingController();
    bool obscureNew = true;
    bool obscureConfirm = true;
    int step = 1;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          final size = MediaQuery.of(context).size;
          final isSmall = size.width < 360;
          final subtitleSize = isSmall ? 14.0 : 16.0;
          final validEmail = _isValidEmail(emailController.text.trim());
          final newPwd = newPwdController.text;
          final confirmPwd = confirmPwdController.text;
          final passwordsOk = newPwd.isNotEmpty && confirmPwd.isNotEmpty && newPwd == confirmPwd && newPwd.length >= 6;

          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text(
              'Forgot Password?',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (step == 1)
                    TextField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email',
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
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  if (step == 2) ...[
                    TextField(
                      controller: newPwdController,
                      obscureText: obscureNew,
                      decoration: InputDecoration(
                        labelText: 'New Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => obscureNew = !obscureNew),
                        ),
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
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: confirmPwdController,
                      obscureText: obscureConfirm,
                      decoration: InputDecoration(
                        labelText: 'Confirm Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => obscureConfirm = !obscureConfirm),
                        ),
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
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    if (newPwd.isNotEmpty && confirmPwd.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: passwordsOk ? Colors.green.shade50 : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: passwordsOk ? Colors.green.shade200 : Colors.red.shade200,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              passwordsOk ? Icons.check_circle : Icons.error_outline,
                              color: passwordsOk ? Colors.green : Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                passwordsOk ? 'Passwords match' : 'Passwords do not match or too short (min 6 characters)',
                                style: TextStyle(
                                  fontSize: subtitleSize - 2,
                                  color: passwordsOk ? Colors.green.shade800 : Colors.red.shade800,
                                  fontWeight: FontWeight.w500,
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
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  'Cancel',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              ),
              if (step == 2)
                TextButton(
                  onPressed: () => setState(() => step = 1),
                  child: const Text('Back'),
                ),
              if (step == 1)
                FilledButton(
                  onPressed: validEmail ? () => setState(() => step = 2) : null,
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Next'),
                ),
              if (step == 2)
                FilledButton(
                  onPressed: passwordsOk ? () => Navigator.of(context).pop() : null,
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Reset Password'),
                ),
            ],
          );
        },
      ),
    );
  }

  

  Future<void> _loginWithFingerprint() async {
    final messenger = ScaffoldMessenger.of(context);
    String email = '';
    try {
      final prefs = await SharedPreferences.getInstance();
      email = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
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
      final status = await MongoDBService.getMfaStatusDetail(email: email);
      final fpEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
      if (!fpEnabled) {
        messenger.showSnackBar(const SnackBar(content: Text('Fingerprint is not enabled for this account')));
        return;
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
        final msg = (start['message'] is String) ? start['message'] as String : 'Fingerprint login not available';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
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
        final avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
        final navigator = Navigator.of(context);
        final profileRes = await MongoDBService.fetchProfile(email: email);
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
                token: '',
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
              token: '',
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
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1.5),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
      filled: true,
      fillColor: Colors.grey.shade50,
    );
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
                      _squareAction(
                        icon: Icons.fingerprint,
                        label: 'Login Using Biometrics',
                        onTap: _isLoading ? null : _loginWithFingerprint,
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
                      // Email Field
                      TextFormField(
                        controller: _emailController,
                        focusNode: _emailFocus,
                        keyboardType: TextInputType.emailAddress,
                        enabled: !_isLoading,
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
                            onPressed: _isLoading ? null : _showForgotPasswordDialog,
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
                        onPressed: _isLoading ? null : _loginAccountOnly,
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
                            : Text(
                                'Login',
                                style: TextStyle(
                                  fontSize: subtitleFontSize + 1,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                      SizedBox(height: spacing),
                    ],
                    
                    
                    // Sign Up Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have an account? ",
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
      final result = await MongoDBService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        bypassFingerprint: true,
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
        final navigator = Navigator.of(context);
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('lastLoginEmail', email);
        } catch (_) {}
        final profileRes = await MongoDBService.fetchProfile(email: email);
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
                token: '',
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
              token: '',
              avatarUrl: avatarUrl,
            ),
          ),
          (route) => false,
        );
      } else {
        final code = (result['code'] is String) ? (result['code'] as String).toLowerCase() : '';
        if (code == 'mfa_required') {
          if (!mounted) return;
          final email = _emailController.text.trim();
          final nav = Navigator.of(context);
          nav.push(
            MaterialPageRoute(builder: (_) => LoginMfaScreen(email: email)),
          );
          return;
        }
        final msg = (result['message'] is String && (result['message'] as String).trim().isNotEmpty)
            ? result['message'] as String
            : 'Incorrect email or password';
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
}
