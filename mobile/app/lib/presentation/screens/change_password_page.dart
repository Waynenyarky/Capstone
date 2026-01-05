import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'change_password_otp_page.dart';

class ChangePasswordPage extends StatefulWidget {
  final String email;
  final String token;
  const ChangePasswordPage({super.key, required this.email, required this.token});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _touchedCurrent = false;
  bool _touchedNew = false;
  bool _touchedConfirm = false;
  String? _currentError;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  InputDecoration _decoration(String label, IconData icon, {Widget? suffix}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      suffixIcon: suffix,
      errorMaxLines: 3,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Colors.blue, width: 2)),
      errorBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Colors.red, width: 1.5)),
      focusedErrorBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Colors.red, width: 2)),
      filled: true,
      fillColor: Colors.grey.shade50,
    );
  }

  Future<void> _submit() async {
    setState(() {
      _touchedCurrent = true;
      _touchedNew = true;
      _touchedConfirm = true;
    });
    final same = _currentController.text == _newController.text;
    if (same) {
      setState(() {});
      if (!_formKey.currentState!.validate()) return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final messenger = ScaffoldMessenger.of(context);
    _currentError = null;
    final netOk = await MongoDBService.isNetworkAvailable();
    if (!netOk) {
      setState(() => _loading = false);
      messenger.showSnackBar(const SnackBar(content: Text('No internet connection. Please check your network.')));
      return;
    }
    final health = await MongoDBService.serverHealth(timeout: const Duration(seconds: 4));
    if (health['ok'] != true) {
      setState(() => _loading = false);
      messenger.showSnackBar(const SnackBar(content: Text('Server unavailable. Please try again later.')));
      return;
    }
    final check = await MongoDBService.login(email: widget.email, password: _currentController.text, bypassFingerprint: true);
    if (check['success'] != true) {
      final code = (check['code'] is String) ? check['code'] as String : '';
      if (code.isEmpty || code.toUpperCase().contains('INVALID')) {
        setState(() {
          _loading = false;
          _currentError = 'Incorrect current password. Please try again.';
        });
        return;
      }
    }
    if (!mounted) return;
    try {
      final sent = await MongoDBService.resetStart(email: widget.email);
      if (sent['success'] == true) {
        if (!mounted) return;
        final nav = Navigator.of(context);
        final result = await nav.push<bool>(
          MaterialPageRoute(
            builder: (_) => ChangePasswordOtpPage(
              email: widget.email,
              token: widget.token,
              currentPassword: _currentController.text,
              newPassword: _newController.text,
              alreadySent: true,
              devCode: (sent['devCode'] is String) ? sent['devCode'] as String : null,
            ),
          ),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (result == true) {
          Navigator.of(context).pop(true);
        }
      } else {
        final msg = (sent['message'] is String) ? sent['message'] as String : 'Failed to send verification code';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
        setState(() => _loading = false);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      messenger.showSnackBar(SnackBar(content: Text('Connection error: ${e.toString()}')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 360;
    final isMedium = size.width >= 360 && size.width < 600;
    final hPad = isSmall ? 16.0 : (isMedium ? 24.0 : 32.0);
    final vPad = isSmall ? 16.0 : 20.0;
    final titleSize = isSmall ? 26.0 : 30.0;
    final subtitleSize = isSmall ? 14.0 : 16.0;

    return Scaffold(
      appBar: AppBar(title: const Text('Change Password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.blue.shade50, shape: BoxShape.circle),
                      child: const Icon(Icons.lock_reset, size: 80, color: Colors.blue),
                    ),
                    const SizedBox(height: 24),
                    Text('Update Your Password', style: TextStyle(fontSize: titleSize, fontWeight: FontWeight.bold, color: Colors.black87), textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    Text('Enter your current password and choose a new one', style: TextStyle(fontSize: subtitleSize, color: Colors.grey.shade600), textAlign: TextAlign.center),
                    const SizedBox(height: 24),

                    TextFormField(
                      controller: _currentController,
                      obscureText: _obscureCurrent,
                      enabled: !_loading,
                      decoration: _decoration(
                        'Current Password',
                        Icons.lock_outline,
                        suffix: _currentController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(_obscureCurrent ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                              )
                            : null,
                      ),
                      onChanged: (_) => setState(() {
                        _touchedCurrent = true;
                        _currentError = null;
                      }),
                      validator: (v) {
                        if (!_touchedCurrent) return null;
                        if (v == null || v.isEmpty) return 'Please enter your current password';
                        if (_currentError != null) return _currentError;
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _newController,
                      obscureText: _obscureNew,
                      enabled: !_loading,
                      decoration: _decoration(
                        'New Password',
                        Icons.lock,
                        suffix: _newController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscureNew = !_obscureNew),
                              )
                            : null,
                      ),
                      onChanged: (_) => setState(() => _touchedNew = true),
                      validator: (v) {
                        if (!_touchedNew) return null;
                        if (v == null || v.isEmpty) return 'Please enter a new password';
                        if (v == _currentController.text) return 'Please choose a new password different from your current password';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _confirmController,
                      obscureText: _obscureConfirm,
                      enabled: !_loading,
                      decoration: _decoration(
                        'Confirm New Password',
                        Icons.lock,
                        suffix: _confirmController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                              )
                            : null,
                      ),
                      onChanged: (_) => setState(() => _touchedConfirm = true),
                      validator: (v) {
                        if (!_touchedConfirm) return null;
                        if (v == null || v.isEmpty) return 'Please confirm your new password';
                        if (v != _newController.text) return 'Passwords do not match';
                        return null;
                      },
                    ),

                    const SizedBox(height: 24),
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                        ),
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                            : const Text('Change Password'),
                      ),
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
