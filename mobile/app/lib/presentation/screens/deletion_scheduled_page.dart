import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'profile.dart';
import 'login_page.dart';

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

  @override
  Widget build(BuildContext context) {
    final dt = _tryParseDate(widget.scheduledISO);
    final when = dt != null ? _formatDateTime(dt) : (widget.scheduledISO ?? '');
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Account Deletion Scheduled')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your Account is Scheduled to be deleted on',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(when, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            const Text('You can undo this and keep your account'),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
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
                    child: const Text('Undo Deletion'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  navigator.pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                },
                child: const Text('Logout'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
