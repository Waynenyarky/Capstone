import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'change_email_verify_page.dart';

class ChangeEmailPage extends StatefulWidget {
  final String currentEmail;
  const ChangeEmailPage({super.key, required this.currentEmail});

  @override
  State<ChangeEmailPage> createState() => _ChangeEmailPageState();
}

class _ChangeEmailPageState extends State<ChangeEmailPage> {
  final TextEditingController _currentEmailController = TextEditingController();
  final FocusNode _emailFocusNode = FocusNode();

  bool _loading = false;
  String? _emailError;

  @override
  void dispose() {
    _currentEmailController.dispose();
    _emailFocusNode.dispose();
    super.dispose();
  }

  bool _isValidEmail(String v) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
  }

  Future<void> _submit() async {
    if (_loading) return;
    
    // Unfocus to dismiss keyboard
    _emailFocusNode.unfocus();
    
    final entered = _currentEmailController.text.trim();
    if (!_isValidEmail(entered)) {
      setState(() => _emailError = 'Please enter a valid email address');
      return;
    }
    if (entered.toLowerCase() != widget.currentEmail.toLowerCase()) {
      setState(() => _emailError = 'This email does not match your current email');
      return;
    }
    setState(() {
      _loading = true;
      _emailError = null;
    });
    try {
      final navigator = Navigator.of(context);
      final messenger = ScaffoldMessenger.of(context);
      final start = await MongoDBService.changeEmailConfirmStart(email: widget.currentEmail);
      if (start['success'] == true) {
        if (!mounted) return;
        final updated = await navigator.push<String>(
          MaterialPageRoute(
            builder: (_) => ChangeEmailVerifyPage(currentEmail: widget.currentEmail),
          ),
        );
        if (!mounted) return;
        if (updated is String && updated.isNotEmpty) {
          navigator.pop(updated);
        } else {
          setState(() => _loading = false);
        }
      } else {
        final msg = (start['message'] is String) ? start['message'] as String : 'Failed to send verification code';
        messenger.showSnackBar(
          SnackBar(
            content: Text(msg),
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() => _loading = false);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Change Email'),
        elevation: 0,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  Text(
                    'Verify Your Identity',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Please confirm your current email address to proceed with changing it.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.textTheme.bodySmall?.color,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _currentEmailController,
                    focusNode: _emailFocusNode,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    enabled: !_loading,
                    style: theme.textTheme.bodyLarge,
                    decoration: InputDecoration(
                      labelText: 'Current Email Address',
                      hintText: 'Enter your current email',
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: theme.dividerColor,
                          width: 1.5,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: theme.colorScheme.primary,
                          width: 2,
                        ),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: theme.colorScheme.error,
                          width: 1.5,
                        ),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: theme.colorScheme.error,
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: _loading 
                          ? theme.disabledColor.withValues(alpha: 0.05)
                          : theme.inputDecorationTheme.fillColor,
                      errorText: _emailError,
                      errorMaxLines: 2,
                    ),
                    onChanged: (_) {
                      if (_emailError != null) setState(() => _emailError = null);
                    },
                    onSubmitted: (_) => _submit(),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        disabledBackgroundColor: theme.disabledColor,
                      ),
                      child: _loading
                          ? SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  theme.colorScheme.onPrimary,
                                ),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  'Send Verification Code',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 20,
                                  color: theme.colorScheme.onPrimary,
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'A verification code will be sent to your email',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_loading)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.03),
              ),
            ),
        ],
      ),
    );
  }
}