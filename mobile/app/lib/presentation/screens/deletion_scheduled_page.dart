import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'profile.dart';
import 'login_page.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/google_auth_service.dart';

class DeletionScheduledPage extends StatefulWidget {
  final String email;
  final String? scheduledISO;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;

  const DeletionScheduledPage({
    super.key,
    required this.email,
    required this.scheduledISO,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.token,
    required this.avatarUrl,
  });

  @override
  State<DeletionScheduledPage> createState() => _DeletionScheduledPageState();
}

class _DeletionScheduledPageState extends State<DeletionScheduledPage> {
  bool _undoLoading = false;

  DateTime? _tryParseDate(String? iso) {
    try {
      if (iso == null || iso.isEmpty) return null;
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

  int _getDaysRemaining(DateTime scheduledDate) {
    final now = DateTime.now();
    final difference = scheduledDate.difference(now);
    return difference.inDays;
  }

  @override
  Widget build(BuildContext context) {
    final dt = _tryParseDate(widget.scheduledISO);
    final when = dt != null ? _formatDateTime(dt) : (widget.scheduledISO ?? '');
    final daysRemaining = dt != null ? _getDaysRemaining(dt) : 0;
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Deletion'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Warning Banner
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: BizClearColors.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: BizClearColors.warning.withValues(alpha: 0.4), width: 2),
                ),
                child: Column(
                  children: [
                    Icon(Icons.event_busy, size: 64, color: BizClearColors.warning),
                    const SizedBox(height: 16),
                    const Text(
                      'Deletion Scheduled',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Your account is scheduled to be deleted',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Countdown Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [BizClearColors.error.withValues(alpha: 0.08), BizClearColors.warning.withValues(alpha: 0.08)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: BizClearColors.error.withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.timer, color: BizClearColors.error, size: 28),
                        const SizedBox(width: 12),
                        Text(
                          '$daysRemaining days remaining',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: BizClearColors.error,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Deletion Date',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: BizClearColors.textSecondary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.calendar_today, size: 18, color: BizClearColors.error),
                              const SizedBox(width: 8),
                              Text(
                                when,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: BizClearColors.webPrimaryTintText,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Information Cards
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: BizClearColors.webPrimaryTintLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: BizClearColors.webPrimaryTintBorder),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: BizClearColors.webPrimaryTintBorder,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.info_outline, color: BizClearColors.webPrimaryTintIcon, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'What happens next?',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: BizClearColors.webPrimaryTintText,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Your account will be permanently deleted on the scheduled date',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: BizClearColors.webPrimaryTintText,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: BizClearColors.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: BizClearColors.success.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: BizClearColors.success.withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.check_circle_outline, color: BizClearColors.success, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Changed your mind?',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: BizClearColors.webPrimaryTintText,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'You can cancel the deletion and keep your account anytime',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: BizClearColors.webPrimaryTintText,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Action Buttons
              SizedBox(
                width: double.infinity,
                height: 40,
                child: ElevatedButton.icon(
                  onPressed: _undoLoading
                      ? null
                      : () async {
                          setState(() => _undoLoading = true);
                          try {
                            final res = await MongoDBService.cancelAccountDeletion(email: widget.email);
                            final ok = res['success'] == true;
                            final msg = ok
                                ? 'Account deletion cancelled'
                                : ((res['message'] is String) ? res['message'] as String : 'Failed to cancel deletion');
                            messenger.showSnackBar(SnackBar(content: Text(msg)));
                            if (ok) {
                              navigator.pushAndRemoveUntil(
                                MaterialPageRoute(
                                  builder: (_) => ProfilePage(
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
                          } catch (e) {
                            messenger.showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
                          } finally {
                            if (mounted) setState(() => _undoLoading = false);
                          }
                        },
                  icon: _undoLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.undo, size: 22),
                  label: const Text(
                    'Cancel Deletion & Keep Account',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: BizClearColors.success,
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
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 40,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final nav = Navigator.of(context);
                    bool preAuthenticatorEnabled = false;
                    try {
                      GoogleAuthService.signOutAndReset();
                    } catch (_) {}
                    try {
                      final prefs = await SharedPreferences.getInstance();
                      String targetEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
                      if (targetEmail.isEmpty) targetEmail = widget.email;
                      if (targetEmail.isNotEmpty) {
                        final s = await MongoDBService.getMfaStatusDetail(email: targetEmail);
                        final enabledMfa = s['success'] == true && s['enabled'] == true;
                        final method = (s['method'] ?? '').toString().toLowerCase();
                        if (enabledMfa && (method.contains('authenticator') || method.contains('totp') || method.contains('otp'))) {
                          preAuthenticatorEnabled = true;
                        }
                      }
                      await prefs.remove('loggedInEmail');
                      await prefs.setBool('disableAutoAuthenticatorOnce', true);
                    } catch (_) {}
                    if (!mounted) return;
                    nav.pushAndRemoveUntil(
                      MaterialPageRoute(
                        builder: (_) => LoginScreen(
                          preAuthenticatorEnabled: preAuthenticatorEnabled,
                        ),
                      ),
                      (route) => false,
                    );
                  },
                  icon: const Icon(Icons.logout, size: 20),
                  label: const Text(
                    'Logout',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    side: const BorderSide(width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Footer Note
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: BizClearColors.divider,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(Icons.help_outline, size: 20, color: BizClearColors.textSecondary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Need help? Contact support before the deletion date',
                        style: TextStyle(
                          fontSize: 13,
                          color: BizClearColors.textSecondary,
                          height: 1.4,
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
