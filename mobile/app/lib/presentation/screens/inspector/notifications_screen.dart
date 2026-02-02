import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/mock/inspector_mock_data.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  Map<String, dynamic> _pagination = {};
  bool _loading = true;
  String? _error;
  int _page = 1;
  final int _limit = 20;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await MongoDBService.getInspectorNotifications(
        page: _page,
        limit: _limit,
      );
      if (res['success'] == true) {
        final list = List<dynamic>.from(res['notifications'] ?? []);
        if (list.isEmpty && _page == 1) {
          final mockList = InspectorMockData.getNotifications();
          setState(() {
            _notifications = mockList;
            _pagination = {'page': 1, 'limit': _limit, 'total': mockList.length, 'totalPages': 1};
            _loading = false;
            _error = null;
          });
          return;
        }
        setState(() {
          _notifications = list;
          _pagination = Map<String, dynamic>.from(res['pagination'] ?? {});
          _loading = false;
          _error = null;
        });
      } else {
        if (_page == 1) {
          final mockList = InspectorMockData.getNotifications();
          setState(() {
            _notifications = mockList;
            _pagination = {'page': 1, 'limit': _limit, 'total': mockList.length, 'totalPages': 1};
            _loading = false;
            _error = null;
          });
          return;
        }
        setState(() {
          _loading = false;
          _error = res['message'] ?? 'Failed to load';
        });
      }
    } catch (e) {
      if (_page == 1) {
        final mockList = InspectorMockData.getNotifications();
        setState(() {
          _notifications = mockList;
          _pagination = {'page': 1, 'limit': _limit, 'total': mockList.length, 'totalPages': 1};
          _loading = false;
          _error = null;
        });
        return;
      }
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _notifications.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _notifications.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: Colors.red.shade700)),
              const SizedBox(height: 16),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        _page = 1;
        await _load();
      },
      child: _notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_outlined, size: 80, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications',
                    style: TextStyle(fontSize: 18, color: Colors.grey.shade700),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _notifications.length + 1,
              itemBuilder: (context, i) {
                if (i == _notifications.length) {
                  final totalPages = _pagination['totalPages'] ?? 1;
                  if (_page < totalPages) {
                    return Padding(
                      padding: const EdgeInsets.all(16),
                      child: Center(
                        child: TextButton(
                          onPressed: () {
                            setState(() => _page++);
                            _load();
                          },
                          child: const Text('Load more'),
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                }
                final n = _notifications[i] as Map<String, dynamic>;
                final title = n['title'] as String? ?? 'Notification';
                final message = n['message'] as String? ?? '';
                final read = n['read'] == true;
                final createdAt = n['createdAt'];
                String timeStr = '';
                if (createdAt != null) {
                  try {
                    final d = DateTime.parse(createdAt.toString());
                    timeStr = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
                  } catch (_) {
                    timeStr = createdAt.toString();
                  }
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: read ? null : Colors.blue.withValues(alpha: 0.05),
                  child: ListTile(
                    leading: Icon(
                      Icons.notifications_outlined,
                      color: read ? Colors.grey : Theme.of(context).colorScheme.primary,
                    ),
                    title: Text(
                      title,
                      style: TextStyle(
                        fontWeight: read ? FontWeight.normal : FontWeight.w600,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (message.isNotEmpty) Text(message, maxLines: 2, overflow: TextOverflow.ellipsis),
                        if (timeStr.isNotEmpty) Text(timeStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                      ],
                    ),
                    isThreeLine: true,
                  ),
                );
              },
            ),
    );
  }
}
