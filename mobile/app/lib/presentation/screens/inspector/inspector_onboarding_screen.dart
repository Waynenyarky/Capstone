import 'package:flutter/material.dart';
import '../../../core/theme/bizclear_colors.dart';
import '../../../data/services/mongodb_service.dart';
import 'inspector_shell.dart';
import '../security/mfa_setup_screen.dart';
import '../../../domain/usecases/enable_mfa.dart';
import '../../../domain/usecases/verify_mfa.dart';

/// Inspector onboarding: set new password (if mustChangeCredentials) and/or MFA (if mustSetupMfa).
/// Shown after login when backend sets these flags (same as web staff onboarding).
class InspectorOnboardingScreen extends StatefulWidget {
  final String email;
  final String token;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String avatarUrl;
  final bool mustChangeCredentials;
  final bool mustSetupMfa;

  const InspectorOnboardingScreen({
    super.key,
    required this.email,
    required this.token,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.avatarUrl,
    required this.mustChangeCredentials,
    required this.mustSetupMfa,
  });

  @override
  State<InspectorOnboardingScreen> createState() => _InspectorOnboardingScreenState();
}

class _InspectorOnboardingScreenState extends State<InspectorOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  String? _errorMessage;
  bool _passwordDone = false;
  bool _mfaDone = false;
  bool _mfaSetupTriggered = false;

  @override
  void dispose() {
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _goToShell() {
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => InspectorShell(
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

  Future<void> _submitPassword() async {
    final newPass = _newController.text;
    final confirm = _confirmController.text;
    if (newPass.isEmpty || newPass.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters');
      return;
    }
    if (newPass != confirm) {
      setState(() => _errorMessage = 'Passwords do not match');
      return;
    }
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final res = await MongoDBService.firstLoginChangeCredentials(
        email: widget.email,
        token: widget.token,
        newPassword: newPass,
      );
      if (!mounted) return;
      if (res['success'] == true) {
        setState(() {
          _passwordDone = true;
          _loading = false;
        });
        if (widget.mustSetupMfa) {
          _openMfaSetup();
        } else {
          _goToShell();
        }
      } else {
        setState(() {
          _loading = false;
          _errorMessage = (res['message'] is String) ? res['message'] as String : 'Failed to set password';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMessage = 'Connection error';
        });
      }
    }
  }

  void _openMfaSetup() {
    final enable = EnableMfaImpl(email: widget.email);
    final verify = VerifyMfaImpl(email: widget.email);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MfaSetupScreen(
          enableMfa: enable,
          verifyMfa: verify,
          initialMethod: 'authenticator',
          allowSelection: true,
          email: widget.email,
        ),
      ),
    ).then((_) {
      if (!mounted) return;
      setState(() => _mfaDone = true);
      _goToShell();
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmallScreen = size.width < 360;
    final horizontalPadding = isSmallScreen ? 16.0 : 24.0;
    final verticalPadding = isSmallScreen ? 16.0 : 20.0;
    final titleFontSize = isSmallScreen ? 18.0 : 20.0;
    final subtitleFontSize = isSmallScreen ? 14.0 : 16.0;
    final spacing = isSmallScreen ? 14.0 : 18.0;
    final largeSpacing = isSmallScreen ? 24.0 : 28.0;

    final showPasswordStep = widget.mustChangeCredentials && !_passwordDone;
    final showMfaStep = widget.mustSetupMfa && (!widget.mustChangeCredentials || _passwordDone) && !_mfaDone;

    if (showMfaStep && !showPasswordStep) {
      if (!_mfaSetupTriggered) {
        _mfaSetupTriggered = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_mfaDone || !mounted) return;
          _openMfaSetup();
        });
      }
      return Scaffold(
        backgroundColor: BizClearColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Account setup',
                    style: TextStyle(
                      fontSize: titleFontSize,
                      fontWeight: FontWeight.bold,
                      color: BizClearColors.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: spacing),
                  CircularProgressIndicator(color: BizClearColors.webPrimary),
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (!showPasswordStep) {
      return Scaffold(
        backgroundColor: BizClearColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Account setup complete',
                    style: TextStyle(
                      fontSize: titleFontSize,
                      fontWeight: FontWeight.bold,
                      color: BizClearColors.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: largeSpacing),
                  CircularProgressIndicator(color: BizClearColors.webPrimary),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: BizClearColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: verticalPadding),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Set new password',
                      style: TextStyle(
                        fontSize: titleFontSize,
                        fontWeight: FontWeight.bold,
                        color: BizClearColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Choose a secure password for your account.',
                      style: TextStyle(
                        fontSize: subtitleFontSize,
                        color: BizClearColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: largeSpacing),
                    TextFormField(
                      controller: _newController,
                      obscureText: _obscureNew,
                      enabled: !_loading,
                      decoration: InputDecoration(
                        labelText: 'New password',
                        suffixIcon: IconButton(
                          icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscureNew = !_obscureNew),
                        ),
                        contentPadding: BizClearColors.inputFieldContentPadding,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: BizClearColors.inputBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: BizClearColors.inputFocusedBorder, width: 2),
                        ),
                      ),
                      onChanged: (_) => setState(() => _errorMessage = null),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Enter a password';
                        if (v.length < 6) return 'At least 6 characters';
                        return null;
                      },
                    ),
                    SizedBox(height: spacing),
                    TextFormField(
                      controller: _confirmController,
                      obscureText: _obscureConfirm,
                      enabled: !_loading,
                      decoration: InputDecoration(
                        labelText: 'Confirm password',
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                        ),
                        contentPadding: BizClearColors.inputFieldContentPadding,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: BizClearColors.inputBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: BizClearColors.inputFocusedBorder, width: 2),
                        ),
                      ),
                      onChanged: (_) => setState(() => _errorMessage = null),
                      validator: (v) {
                        if (v != _newController.text) return 'Passwords do not match';
                        return null;
                      },
                    ),
                    if (_errorMessage != null) ...[
                      SizedBox(height: spacing),
                      Text(
                        _errorMessage!,
                        style: TextStyle(color: BizClearColors.error, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    SizedBox(height: largeSpacing),
                    ElevatedButton(
                      onPressed: _loading ? null : () {
                        if (_formKey.currentState!.validate()) _submitPassword();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: BizClearColors.webPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 2,
                        padding: BizClearColors.primaryButtonPadding,
                        minimumSize: BizClearColors.primaryButtonMinimumSize,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        textStyle: BizClearColors.primaryButtonTextStyle,
                      ),
                      child: _loading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('Set password', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
