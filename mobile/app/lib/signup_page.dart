import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'mongodb_service.dart';

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
  bool _acceptTerms = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  bool _isValidName(String v) {
    final s = v.trim();
    if (s.length < 2 || s.length > 50) return false;
    return RegExp(r'^[A-Za-z][A-Za-z\-\s]*$').hasMatch(s);
  }

  bool _isValidEmail(String v) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
  }

  bool _isValidPhone(String v) {
    return RegExp(r'^\d{11}$').hasMatch(v);
  }

  bool _hasLower(String v) => RegExp(r'[a-z]').hasMatch(v);
  bool _hasUpper(String v) => RegExp(r'[A-Z]').hasMatch(v);
  bool _hasNumber(String v) => RegExp(r'\d').hasMatch(v);
  bool _hasSpecial(String v) => RegExp(r'[^A-Za-z0-9]').hasMatch(v);
  bool _passwordLengthOk(String v) => v.length >= 8;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _signUp() async {
    if (_formKey.currentState!.validate()) {
      if (!_acceptTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please accept the terms and conditions'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      setState(() {
        _isLoading = true;
      });

      try {
        print('Sending signup request...');
        final result = await MongoDBService.signUp(
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          email: _emailController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          password: _passwordController.text,
          confirmPassword: _confirmPasswordController.text, // Include confirmPassword
        );
        print('Signup response: $result');

        setState(() {
          _isLoading = false;
        });

        if (result['success']) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account created successfully! Please login.'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context);
        } else {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        print('Signup error: $e'); // Log error
        setState(() {
          _isLoading = false;
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connection error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmallScreen = size.width < 360;
    final isMediumScreen = size.width >= 360 && size.width < 600;
    
    final horizontalPadding = isSmallScreen ? 16.0 : (isMediumScreen ? 24.0 : 32.0);
    final verticalPadding = isSmallScreen ? 12.0 : 16.0;
    final titleFontSize = isSmallScreen ? 24.0 : 28.0;
    final subtitleFontSize = isSmallScreen ? 14.0 : 16.0;
    final spacing = isSmallScreen ? 12.0 : 16.0;
    final largeSpacing = isSmallScreen ? 20.0 : 24.0;
    final extraLargeSpacing = isSmallScreen ? 24.0 : 32.0;

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
    final passwordAllOk = pwdLen && pwdNum && pwdLow && pwdUp && pwdSpec;
    final confirmText = _confirmPasswordController.text;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Sign Up',
          style: TextStyle(fontSize: subtitleFontSize + 2),
        ),
        elevation: 0,
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Center(
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
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Sign up to get started',
                          style: TextStyle(
                            fontSize: subtitleFontSize,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: extraLargeSpacing),
                        TextFormField(
                          controller: _firstNameController,
                          textCapitalization: TextCapitalization.words,
                          enabled: !_isLoading,
                          decoration: InputDecoration(
                            labelText: 'First Name',
                            prefixIcon: const Icon(Icons.person_outline),
                            suffixIcon: Icon(
                              firstValid ? Icons.check_circle : Icons.error_outline,
                              color: firstValid ? Colors.green : Colors.red,
                            ),
                          ),
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
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
                        TextFormField(
                          controller: _lastNameController,
                          textCapitalization: TextCapitalization.words,
                          enabled: !_isLoading,
                          decoration: InputDecoration(
                            labelText: 'Last Name',
                            prefixIcon: const Icon(Icons.person_outline),
                            suffixIcon: Icon(
                              lastValid ? Icons.check_circle : Icons.error_outline,
                              color: lastValid ? Colors.green : Colors.red,
                            ),
                          ),
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
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
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          enabled: !_isLoading,
                          decoration: InputDecoration(
                            labelText: 'Email',
                            prefixIcon: const Icon(Icons.email_outlined),
                            suffixIcon: Icon(
                              emailValid ? Icons.check_circle : Icons.error_outline,
                              color: emailValid ? Colors.green : Colors.red,
                            ),
                          ),
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
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
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          enabled: !_isLoading,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(11),
                          ],
                          decoration: InputDecoration(
                            labelText: 'Phone Number',
                            prefixIcon: const Icon(Icons.phone_outlined),
                            suffixIcon: Icon(
                              phoneValid ? Icons.check_circle : Icons.error_outline,
                              color: phoneValid ? Colors.green : Colors.red,
                            ),
                          ),
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your phone number';
                            }
                            if (!_isValidPhone(value)) {
                              return 'Phone number must be 11 digits';
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: spacing),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          enabled: !_isLoading,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outlined),
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
                            if (value == null || value.isEmpty) {
                              return 'Please enter a password';
                            }
                            if (!(value.length >= 8 && _hasNumber(value) && _hasLower(value) && _hasUpper(value) && _hasSpecial(value))) {
                              return 'Password does not meet requirements';
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 8),
                        pwd.isNotEmpty
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(pwdLen ? Icons.check_circle : Icons.cancel, color: pwdLen ? Colors.green : Colors.red, size: 18),
                                      const SizedBox(width: 6),
                                      const Text('At least 8 characters'),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(pwdNum ? Icons.check_circle : Icons.cancel, color: pwdNum ? Colors.green : Colors.red, size: 18),
                                      const SizedBox(width: 6),
                                      const Text('At least 1 number'),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(pwdLow ? Icons.check_circle : Icons.cancel, color: pwdLow ? Colors.green : Colors.red, size: 18),
                                      const SizedBox(width: 6),
                                      const Text('At least 1 lowercase'),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(pwdUp ? Icons.check_circle : Icons.cancel, color: pwdUp ? Colors.green : Colors.red, size: 18),
                                      const SizedBox(width: 6),
                                      const Text('At least 1 uppercase'),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(pwdSpec ? Icons.check_circle : Icons.cancel, color: pwdSpec ? Colors.green : Colors.red, size: 18),
                                      const SizedBox(width: 6),
                                      const Text('At least 1 special character'),
                                    ],
                                  ),
                                ],
                              )
                            : const SizedBox.shrink(),
                        SizedBox(height: spacing),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirmPassword,
                          enabled: !_isLoading,
                          decoration: InputDecoration(
                            labelText: 'Confirm Password',
                            prefixIcon: const Icon(Icons.lock_outlined),
                            suffixIcon: confirmText.isNotEmpty
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
                        InkWell(
                          onTap: _isLoading ? null : () {
                            setState(() {
                              _acceptTerms = !_acceptTerms;
                            });
                          },
                          child: Row(
                            children: [
                              Checkbox(
                                value: _acceptTerms,
                                onChanged: _isLoading ? null : (value) {
                                  setState(() {
                                    _acceptTerms = value ?? false;
                                  });
                                },
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                visualDensity: VisualDensity.compact,
                              ),
                              Expanded(
                                child: Text(
                                  'I accept the Terms and Conditions',
                                  style: TextStyle(fontSize: subtitleFontSize),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: largeSpacing),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _signUp,
                          style: ElevatedButton.styleFrom(
                            padding: EdgeInsets.symmetric(
                              vertical: isSmallScreen ? 12 : 16,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
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
                                  style: TextStyle(fontSize: subtitleFontSize),
                                ),
                        ),
                        SizedBox(height: spacing),
                        Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Text(
                              'Already have an account? ',
                              style: TextStyle(fontSize: subtitleFontSize),
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
                                style: TextStyle(fontSize: subtitleFontSize),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
