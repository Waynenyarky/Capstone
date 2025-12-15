import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../domain/usecases/send_signup_code.dart';
import 'signup_otp_page.dart';
import 'profile.dart';
import 'deletion_scheduled_page.dart';
import 'security/login_mfa_screen.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/services/google_auth_service.dart';
import '../../domain/usecases/sign_in_with_google.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  final _firstNameFocus = FocusNode();
  final _lastNameFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _confirmPasswordFocus = FocusNode();
  
  bool _acceptTerms = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  // Track which fields have been touched
  bool _firstNameTouched = false;
  bool _lastNameTouched = false;
  bool _emailTouched = false;
  bool _phoneTouched = false;
  bool _passwordTouched = false;
  bool _confirmPasswordTouched = false;

  bool _isValidName(String v) {
    final s = v.trim();
    if (s.length < 2 || s.length > 50) return false;
    return RegExp(r'^[A-Za-z][A-Za-z\-\s]*$').hasMatch(s);
  }

  bool _isValidEmail(String v) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
  }

  bool _isValidPhone(String v) {
    return RegExp(r'^09\d{9}$').hasMatch(v);
  }

  bool _hasLower(String v) => RegExp(r'[a-z]').hasMatch(v);
  bool _hasUpper(String v) => RegExp(r'[A-Z]').hasMatch(v);
  bool _hasNumber(String v) => RegExp(r'\d').hasMatch(v);
  bool _hasSpecial(String v) => RegExp(r'[^A-Za-z0-9]').hasMatch(v);
  bool _passwordLengthOk(String v) => v.length >= 8;

  @override
  void initState() {
    super.initState();
    
    // Add focus listeners to track when fields are touched
    _firstNameFocus.addListener(() {
      if (!_firstNameFocus.hasFocus && _firstNameController.text.isNotEmpty) {
        setState(() => _firstNameTouched = true);
      }
    });
    
    _lastNameFocus.addListener(() {
      if (!_lastNameFocus.hasFocus && _lastNameController.text.isNotEmpty) {
        setState(() => _lastNameTouched = true);
      }
    });
    
    _emailFocus.addListener(() {
      if (!_emailFocus.hasFocus && _emailController.text.isNotEmpty) {
        setState(() => _emailTouched = true);
      }
    });
    
    _phoneFocus.addListener(() {
      if (!_phoneFocus.hasFocus && _phoneController.text.isNotEmpty) {
        setState(() => _phoneTouched = true);
      }
    });
    
    _passwordFocus.addListener(() {
      if (!_passwordFocus.hasFocus && _passwordController.text.isNotEmpty) {
        setState(() => _passwordTouched = true);
      }
    });
    
    _confirmPasswordFocus.addListener(() {
      if (!_confirmPasswordFocus.hasFocus && _confirmPasswordController.text.isNotEmpty) {
        setState(() => _confirmPasswordTouched = true);
      }
    });
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    
    _firstNameFocus.dispose();
    _lastNameFocus.dispose();
    _emailFocus.dispose();
    _phoneFocus.dispose();
    _passwordFocus.dispose();
    _confirmPasswordFocus.dispose();
    
    super.dispose();
  }

  Future<void> _signUp() async {
    // Mark all fields as touched when submit is pressed
    setState(() {
      _firstNameTouched = true;
      _lastNameTouched = true;
      _emailTouched = true;
      _phoneTouched = true;
      _passwordTouched = true;
      _confirmPasswordTouched = true;
    });

    if (_formKey.currentState!.validate()) {
      if (!_acceptTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please accept the terms and conditions'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }

      setState(() => _isLoading = true);
      final messenger = ScaffoldMessenger.of(context);
      try {
        final usecase = SendSignupCode();
        final sent = await usecase.call(
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          email: _emailController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          password: _passwordController.text,
          termsAccepted: _acceptTerms,
        );
        setState(() => _isLoading = false);
        if (!mounted) return;
        if (sent['success'] == true) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => SignupOtpPage(
                email: _emailController.text.trim(),
                firstName: _firstNameController.text.trim(),
                lastName: _lastNameController.text.trim(),
                phoneNumber: _phoneController.text.trim(),
                password: _passwordController.text,
                termsAccepted: _acceptTerms,
                maxAttempts: 5,
                cooldownSec: 60,
                ttlMin: 10,
              ),
            ),
          );
        } else {
          final code = (sent['code'] is String) ? sent['code'] as String : '';
          final msg = code == 'email_exists'
              ? 'This email is already registered. Please log in or choose another email.'
              : ((sent['message'] is String) ? sent['message'] as String : 'Failed to send verification code');
          messenger.showSnackBar(
            SnackBar(content: Text(msg), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating),
          );
        }
      } catch (e) {
        setState(() => _isLoading = false);
        messenger.showSnackBar(
          SnackBar(content: Text('Connection error: ${e.toString()}'), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating),
        );
      }
    }
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
      final errCode = (auth['errorCode'] ?? '').toString();
      final errMsg = (auth['errorMessage'] ?? '').toString();
      if (idToken.isEmpty && email.isEmpty) {
        setState(() => _isLoading = false);
        final detail = (errCode.isNotEmpty || errMsg.isNotEmpty) ? ' ($errCode${errMsg.isNotEmpty ? ': $errMsg' : ''})' : '';
        messenger.showSnackBar(SnackBar(content: Text('Google Sign-In canceled or failed$detail')));
        return;
      }
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
        final avatarUrl = (user['avatarUrl'] is String) ? user['avatarUrl'] as String : '';
        if (!mounted) return;
        final navigator = Navigator.of(context);
        try {
          final prefs = await SharedPreferences.getInstance();
          if (email.isNotEmpty) await prefs.setString('lastLoginEmail', email);
          if (email.isNotEmpty) {
            try {
              final status = await MongoDBService.getMfaStatusDetail(email: email);
              final fpEnabled = status['success'] == true && status['isFingerprintEnabled'] == true;
              if (fpEnabled) {
                await prefs.setString('fingerprintEmail', email.toLowerCase());
              }
            } catch (_) {}
          }
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
        final msg = (result['message'] is String) ? result['message'] as String : 'Google signup failed';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      setState(() => _isLoading = false);
      messenger.showSnackBar(SnackBar(content: Text('Google signup error: ${e.toString()}')));
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

  Widget _buildPasswordRequirement(String text, bool isMet, bool showValidation) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.close,
            color: isMet ? Colors.green : Colors.red,
            size: 18,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: isMet ? Colors.green : Colors.red,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
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
    final titleFontSize = isSmallScreen ? 26.0 : 30.0;
    final subtitleFontSize = isSmallScreen ? 14.0 : 16.0;
    final spacing = isSmallScreen ? 14.0 : 18.0;
    final largeSpacing = isSmallScreen ? 24.0 : 28.0;

    final firstValid = _isValidName(_firstNameController.text);
    final lastValid = _isValidName(_lastNameController.text);
    final emailValid = _isValidEmail(_emailController.text);
    final phoneValid = _isValidPhone(_phoneController.text);
    
    final pwd = _passwordController.text;
    final pwdLen = _passwordLengthOk(pwd);
    final pwdNum = _hasNumber(pwd);
    final pwdLow = _hasLower(pwd);
    final pwdUp = _hasUpper(pwd);
    final pwdSpec = _hasSpecial(pwd);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Sign Up'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        centerTitle: true,
      ),
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
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Create Account',
                      style: TextStyle(
                        fontSize: titleFontSize,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign up to get started',
                      style: TextStyle(
                        fontSize: subtitleFontSize,
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: largeSpacing),
                    
                    // First Name
                    TextFormField(
                      controller: _firstNameController,
                      focusNode: _firstNameFocus,
                      textCapitalization: TextCapitalization.words,
                      enabled: !_isLoading,
                      decoration: _buildInputDecoration(
                        label: 'First Name',
                        prefixIcon: Icons.person_outline,
                        suffixIcon: _buildValidationIcon(
                          firstValid,
                          _firstNameTouched,
                          _firstNameController.text,
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                      validator: (value) {
                        if (!_firstNameTouched) return null;
                        if (value == null || value.isEmpty) {
                          return 'Please enter your first name';
                        }
                        if (!_isValidName(value)) {
                          return '2-50 letters, spaces or hyphen';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: spacing),
                    
                    // Last Name
                    TextFormField(
                      controller: _lastNameController,
                      focusNode: _lastNameFocus,
                      textCapitalization: TextCapitalization.words,
                      enabled: !_isLoading,
                      decoration: _buildInputDecoration(
                        label: 'Last Name',
                        prefixIcon: Icons.person_outline,
                        suffixIcon: _buildValidationIcon(
                          lastValid,
                          _lastNameTouched,
                          _lastNameController.text,
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                      validator: (value) {
                        if (!_lastNameTouched) return null;
                        if (value == null || value.isEmpty) {
                          return 'Please enter your last name';
                        }
                        if (!_isValidName(value)) {
                          return '2-50 letters, spaces or hyphen';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: spacing),
                    
                    // Email
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
                        if (!_isValidEmail(value)) {
                          return 'Enter a valid email';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: spacing),
                    
                    // Phone
                    TextFormField(
                      controller: _phoneController,
                      focusNode: _phoneFocus,
                      keyboardType: TextInputType.phone,
                      enabled: !_isLoading,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(11),
                      ],
                      decoration: _buildInputDecoration(
                        label: 'Phone Number',
                        prefixIcon: Icons.phone_outlined,
                        suffixIcon: _buildValidationIcon(
                          phoneValid,
                          _phoneTouched,
                          _phoneController.text,
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                      validator: (value) {
                        if (!_phoneTouched) return null;
                        final v = (value ?? '').trim();
                        if (v.isEmpty) {
                          return 'Please enter your phone number';
                        }
                        if (!RegExp(r'^\d+$').hasMatch(v)) {
                          return 'Phone must contain digits only';
                        }
                        if (v.length != 11) {
                          return 'Phone number must be 11 digits';
                        }
                        if (!RegExp(r'^09').hasMatch(v)) {
                          return 'Phone number must start with 09';
                        }
                        if (!_isValidPhone(v)) {
                          return 'Enter a valid phone number';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: spacing),
                    
                    // Password
                    TextFormField(
                      controller: _passwordController,
                      focusNode: _passwordFocus,
                      obscureText: _obscurePassword,
                      enabled: !_isLoading,
                      decoration: _buildInputDecoration(
                        label: 'Password',
                        prefixIcon: Icons.lock_outlined,
                        suffixIcon: pwd.isNotEmpty
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
                          return 'Please enter a password';
                        }
                        if (!(value.length >= 8 && _hasNumber(value) && 
                              _hasLower(value) && _hasUpper(value) && _hasSpecial(value))) {
                          return 'Password does not meet requirements';
                        }
                        return null;
                      },
                    ),
                    
                    // Password Requirements
                    if (pwd.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Password Requirements',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 8),
                            _buildPasswordRequirement('At least 8 characters', pwdLen, _passwordTouched),
                            _buildPasswordRequirement('At least 1 number', pwdNum, _passwordTouched),
                            _buildPasswordRequirement('At least 1 lowercase letter', pwdLow, _passwordTouched),
                            _buildPasswordRequirement('At least 1 uppercase letter', pwdUp, _passwordTouched),
                            _buildPasswordRequirement('At least 1 special character', pwdSpec, _passwordTouched),
                          ],
                        ),
                      ),
                    ],
                    SizedBox(height: spacing),
                    
                    // Confirm Password
                    TextFormField(
                      controller: _confirmPasswordController,
                      focusNode: _confirmPasswordFocus,
                      obscureText: _obscureConfirmPassword,
                      enabled: !_isLoading,
                      decoration: _buildInputDecoration(
                        label: 'Confirm Password',
                        prefixIcon: Icons.lock_outlined,
                        suffixIcon: _confirmPasswordController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(
                                  _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscureConfirmPassword = !_obscureConfirmPassword;
                                  });
                                },
                              )
                            : null,
                      ),
                      onChanged: (_) => setState(() {}),
                      validator: (value) {
                        if (!_confirmPasswordTouched) return null;
                        if (value == null || value.isEmpty) {
                          return 'Please confirm your password';
                        }
                        if (value != _passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: spacing),
                    
                    // Terms and Conditions
                    InkWell(
                      onTap: _isLoading ? null : () {
                        setState(() {
                          _acceptTerms = !_acceptTerms;
                        });
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Row(
                          children: [
                            Checkbox(
                              value: _acceptTerms,
                              onChanged: _isLoading ? null : (value) {
                                setState(() {
                                  _acceptTerms = value ?? false;
                                });
                              },
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                'I accept the Terms and Conditions',
                                style: TextStyle(
                                  fontSize: subtitleFontSize,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: largeSpacing),
                    
                    // Sign Up Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _signUp,
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
                              'Sign Up',
                              style: TextStyle(
                                fontSize: subtitleFontSize + 1,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                    SizedBox(height: spacing),
                    
                    Row(
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
                    
                    // Login Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Already have an account? ',
                          style: TextStyle(
                            fontSize: subtitleFontSize,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        TextButton(
                          onPressed: _isLoading ? null : () {
                            Navigator.pop(context);
                          },
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: const Size(0, 0),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Login',
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
    final stroke = size.width * 0.17;
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

    canvas.drawArc(rect, _deg(300), _deg(85), false, blue);
    canvas.drawArc(rect, _deg(25), _deg(100), false, red);
    canvas.drawArc(rect, _deg(135), _deg(80), false, yellow);
    canvas.drawArc(rect, _deg(215), _deg(95), false, green);

    final cx = size.width / 2;
    final cy = size.height / 2;
    final cut = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFF4285F4);
    canvas.drawLine(Offset(cx, cy), Offset(cx + rect.width * 0.42, cy), cut);
  }
  double _deg(double d) => d * 3.1415926535 / 180.0;
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
