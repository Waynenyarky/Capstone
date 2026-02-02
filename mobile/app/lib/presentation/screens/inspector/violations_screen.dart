import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/mock/inspector_mock_data.dart';

class ViolationsScreen extends StatefulWidget {
  const ViolationsScreen({super.key});

  @override
  State<ViolationsScreen> createState() => _ViolationsScreenState();
}

class _ViolationsScreenState extends State<ViolationsScreen> {
  List<dynamic> _violations = [];
  Map<String, dynamic> _pagination = {};
  bool _loading = true;
  String? _error;
  String? _statusFilter;
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
      final res = await MongoDBService.getInspectorViolations(
        status: _statusFilter,
        page: _page,
        limit: _limit,
      );
      if (res['success'] == true) {
        final list = List<dynamic>.from(res['violations'] ?? []);
        if (list.isEmpty && _page == 1) {
          var mockList = InspectorMockData.getViolations();
          if (_statusFilter != null && _statusFilter!.isNotEmpty) {
            mockList = mockList.where((e) => e['status'] == _statusFilter).toList();
          }
          setState(() {
            _violations = mockList;
            _pagination = {'page': 1, 'limit': _limit, 'total': mockList.length, 'totalPages': 1};
            _loading = false;
            _error = null;
          });
          return;
        }
        setState(() {
          _violations = list;
          _pagination = Map<String, dynamic>.from(res['pagination'] ?? {});
          _loading = false;
          _error = null;
        });
      } else {
        if (_page == 1) {
          var mockList = InspectorMockData.getViolations();
          if (_statusFilter != null && _statusFilter!.isNotEmpty) {
            mockList = mockList.where((e) => e['status'] == _statusFilter).toList();
          }
          setState(() {
            _violations = mockList;
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
        var mockList = InspectorMockData.getViolations();
        if (_statusFilter != null && _statusFilter!.isNotEmpty) {
          mockList = mockList.where((e) => e['status'] == _statusFilter).toList();
        }
        setState(() {
          _violations = mockList;
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
    if (_loading && _violations.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _violations.isEmpty) {
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              DropdownButton<String?>(
                value: _statusFilter,
                hint: const Text('Status'),
                items: const [
                  DropdownMenuItem(value: null, child: Text('All')),
                  DropdownMenuItem(value: 'open', child: Text('Open')),
                  DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
                  DropdownMenuItem(value: 'appealed', child: Text('Appealed')),
                ],
                onChanged: (v) {
                  setState(() {
                    _statusFilter = v;
                    _page = 1;
                  });
                  _load();
                },
              ),
              Text('${_violations.length} violation(s)', style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              _page = 1;
              await _load();
            },
            child: _violations.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.warning_amber_outlined, size: 80, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text(
                          'No violations issued',
                          style: TextStyle(fontSize: 18, color: Colors.grey.shade700),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _violations.length + 1,
                    itemBuilder: (context, i) {
                      if (i == _violations.length) {
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
                      final v = _violations[i] as Map<String, dynamic>;
                      final violationId = v['violationId'] ?? '';
                      final violationType = v['violationType'] ?? '';
                      final description = v['description'] ?? '';
                      final severity = v['severity'] ?? '';
                      final status = v['status'] ?? 'open';
                      final businessName = v['businessName'] ?? '—';
                      final complianceDeadline = v['complianceDeadline'];
                      String deadlineStr = '';
                      if (complianceDeadline != null) {
                        try {
                          final d = DateTime.parse(complianceDeadline.toString());
                          deadlineStr = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
                        } catch (_) {
                          deadlineStr = complianceDeadline.toString();
                        }
                      }
                      Color statusColor = Colors.grey;
                      if (status == 'open') statusColor = Colors.orange;
                      else if (status == 'resolved') statusColor = Colors.green;
                      else if (status == 'appealed') statusColor = Colors.blue;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ExpansionTile(
                          title: Text(
                            violationId,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text('$violationType • $businessName'),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(description, style: const TextStyle(height: 1.5)),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Chip(
                                        label: Text(severity, style: const TextStyle(fontSize: 12)),
                                        backgroundColor: Colors.amber.withValues(alpha: 0.3),
                                        padding: EdgeInsets.zero,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      const SizedBox(width: 8),
                                      Chip(
                                        label: Text(status, style: const TextStyle(fontSize: 12)),
                                        backgroundColor: statusColor.withValues(alpha: 0.2),
                                        padding: EdgeInsets.zero,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                    ],
                                  ),
                                  if (deadlineStr.isNotEmpty) Text('Deadline: $deadlineStr', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }
}
