import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/data/services/mongodb_service.dart';

class ActiveSessionsScreen extends StatefulWidget {
  const ActiveSessionsScreen({super.key});

  @override
  State<ActiveSessionsScreen> createState() => _ActiveSessionsScreenState();
}

class _ActiveSessionsScreenState extends State<ActiveSessionsScreen> {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await MongoDBService.getActiveSessions();
      if (!mounted) return;
      if (res['success'] == true && res['sessions'] is List) {
        setState(() {
          _sessions = List<Map<String, dynamic>>.from(res['sessions'] as List);
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _sessions = [];
          _loading = false;
          _error = (res['message'] is String) ? res['message'] as String : 'Failed to load sessions';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sessions = [];
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _invalidateSession(String sessionId) async {
    final res = await MongoDBService.invalidateSession(sessionId: sessionId);
    if (!mounted) return;
    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session signed out')),
      );
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text((res['message'] is String) ? res['message'] as String : 'Failed to sign out session')),
      );
    }
  }

  Future<void> _invalidateAllOthers() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out other devices'),
        content: const Text(
          'This will sign out all other devices. You will stay signed in on this device. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: BizClearColors.primaryButtonPadding,
              minimumSize: BizClearColors.primaryButtonMinimumSize,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: BizClearColors.primaryButtonTextStyle,
            ),
            child: const Text('Sign out others'),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    final res = await MongoDBService.invalidateAllSessions();
    if (!mounted) return;
    if (res['success'] == true) {
      final n = (res['sessionsInvalidated'] is int) ? res['sessionsInvalidated'] as int : 0;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(n > 0 ? 'Signed out $n other device(s)' : 'No other sessions to sign out')),
      );
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text((res['message'] is String) ? res['message'] as String : 'Failed')),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  String _formatDate(dynamic v) {
    if (v == null) return '—';
    if (v is DateTime) return '${v.toLocal().toString().split('.')[0]}';
    if (v is String) {
      final d = DateTime.tryParse(v);
      return d != null ? '${d.toLocal().toString().split('.')[0]}' : v;
    }
    return v.toString();
  }

  @override
  Widget build(BuildContext context) {
    final otherSessions = _sessions.where((s) => s['isCurrentSession'] != true).toList();
    return Scaffold(
      backgroundColor: BizClearColors.surfaceLight,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          'Active Sessions',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
        actions: [
          if (otherSessions.isNotEmpty)
            TextButton(
              onPressed: _loading ? null : _invalidateAllOthers,
              child: const Text('Sign out others'),
            ),
        ],
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.error_outline, size: 48, color: BizClearColors.textSecondary),
                          const SizedBox(height: 16),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: BizClearColors.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _load,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                      children: [
                        Text(
                          'Devices where you are signed in. Sign out any device you no longer use.',
                          style: TextStyle(fontSize: 14, color: BizClearColors.textSecondary, height: 1.4),
                        ),
                        const SizedBox(height: 20),
                        ..._sessions.map((session) {
                          final id = (session['id'] is String) ? session['id'] as String : '';
                          final userAgent = (session['userAgent'] is String) ? session['userAgent'] as String : 'Unknown device';
                          final ipAddress = (session['ipAddress'] is String) ? session['ipAddress'] as String : '—';
                          final isCurrent = session['isCurrentSession'] == true;
                          final isExpired = session['isExpired'] == true;
                          final lastActivityAt = session['lastActivityAt'];
                          final expiresAt = session['expiresAt'];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.devices_other,
                                        color: isCurrent ? BizClearColors.webPrimaryTintIcon : BizClearColors.textSecondary,
                                        size: 22,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          userAgent,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 15,
                                            color: Colors.black87,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (isCurrent)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: BizClearColors.webPrimaryTintLight,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            'This device',
                                            style: TextStyle(fontSize: 12, color: BizClearColors.webPrimaryTintText, fontWeight: FontWeight.w500),
                                          ),
                                        )
                                      else if (isExpired)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.red.shade50,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            'Expired',
                                            style: TextStyle(fontSize: 12, color: Colors.red.shade800, fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text('IP: $ipAddress', style: TextStyle(fontSize: 13, color: BizClearColors.textSecondary)),
                                  if (lastActivityAt != null)
                                    Text('Last activity: ${_formatDate(lastActivityAt)}', style: TextStyle(fontSize: 13, color: BizClearColors.textSecondary)),
                                  if (expiresAt != null)
                                    Text('Expires: ${_formatDate(expiresAt)}', style: TextStyle(fontSize: 13, color: BizClearColors.textSecondary)),
                                  if (!isCurrent && id.isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton(
                                        onPressed: () => _invalidateSession(id),
                                        style: TextButton.styleFrom(foregroundColor: Colors.red),
                                        child: const Text('Sign out this device'),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        }),
                        if (_sessions.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 32),
                              child: Text(
                                'No active sessions',
                                style: TextStyle(color: BizClearColors.textSecondary),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
      ),
    );
  }
}
