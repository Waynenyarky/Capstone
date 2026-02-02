import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/mock/inspector_mock_data.dart';
import 'inspection_detail_screen.dart';

class AssignedInspectionsScreen extends StatefulWidget {
  final String? initialDateFrom;
  final String? initialDateTo;
  final VoidCallback? onClearDateFilter;

  const AssignedInspectionsScreen({
    super.key,
    this.initialDateFrom,
    this.initialDateTo,
    this.onClearDateFilter,
  });

  @override
  State<AssignedInspectionsScreen> createState() => _AssignedInspectionsScreenState();
}

class _AssignedInspectionsScreenState extends State<AssignedInspectionsScreen> {
  List<dynamic> _inspections = [];
  Map<String, dynamic> _pagination = {};
  bool _loading = true;
  String? _error;
  String? _statusFilter;
  String? _dateFrom;
  String? _dateTo;
  int _page = 1;
  final int _limit = 20;

  @override
  void initState() {
    super.initState();
    _dateFrom = widget.initialDateFrom;
    _dateTo = widget.initialDateTo;
    _loadInspections();
  }

  @override
  void didUpdateWidget(AssignedInspectionsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialDateFrom != widget.initialDateFrom ||
        oldWidget.initialDateTo != widget.initialDateTo) {
      setState(() {
        _dateFrom = widget.initialDateFrom;
        _dateTo = widget.initialDateTo;
        _page = 1;
      });
      _loadInspections();
    }
  }

  List<Map<String, dynamic>> _filterMockInspections(List<Map<String, dynamic>> list) {
    var out = list;
    if (_statusFilter != null && _statusFilter!.isNotEmpty) {
      out = out.where((e) => e['status'] == _statusFilter).toList();
    }
    if (_dateFrom != null) {
      try {
        final from = DateTime.parse(_dateFrom!);
        out = out.where((e) {
          final s = e['scheduledDate'] as String?;
          if (s == null) return false;
          final d = DateTime.parse(s);
          return !d.isBefore(DateTime(from.year, from.month, from.day));
        }).toList();
      } catch (_) {}
    }
    if (_dateTo != null) {
      try {
        final to = DateTime.parse('${_dateTo}T23:59:59');
        out = out.where((e) {
          final s = e['scheduledDate'] as String?;
          if (s == null) return false;
          final d = DateTime.parse(s);
          return !d.isAfter(to);
        }).toList();
      } catch (_) {}
    }
    return out;
  }

  Future<void> _loadInspections() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await MongoDBService.getInspectorInspections(
        status: _statusFilter,
        dateFrom: _dateFrom,
        dateTo: _dateTo,
        page: _page,
        limit: _limit,
      );
      if (res['success'] == true) {
        final list = List<dynamic>.from(res['inspections'] ?? []);
        if (list.isEmpty && _page == 1) {
          final mockList = _filterMockInspections(InspectorMockData.getInspections());
          setState(() {
            _inspections = mockList;
            _pagination = {'page': 1, 'limit': _limit, 'total': mockList.length, 'totalPages': 1};
            _loading = false;
            _error = null;
          });
          return;
        }
        setState(() {
          _inspections = list;
          _pagination = Map<String, dynamic>.from(res['pagination'] ?? {});
          _loading = false;
          _error = null;
        });
      } else {
        if (_page == 1) {
          final mockList = _filterMockInspections(InspectorMockData.getInspections());
          setState(() {
            _inspections = mockList;
            _pagination = {'page': 1, 'limit': _limit, 'total': mockList.length, 'totalPages': 1};
            _loading = false;
            _error = null;
          });
          return;
        }
        setState(() {
          _loading = false;
          _error = res['message'] ?? 'Failed to load inspections';
        });
      }
    } catch (e) {
      if (_page == 1) {
        final mockList = _filterMockInspections(InspectorMockData.getInspections());
        setState(() {
          _inspections = mockList;
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

  void _openDetail(String inspectionId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InspectionDetailScreen(inspectionId: inspectionId),
      ),
    ).then((_) => _loadInspections());
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      builder: (context) => _InspectionFilterSheet(
        initialStatus: _statusFilter,
        initialDateFrom: _dateFrom,
        initialDateTo: _dateTo,
        onApply: (status, dateFrom, dateTo) {
          setState(() {
            _statusFilter = status;
            _dateFrom = dateFrom;
            _dateTo = dateTo;
            _page = 1;
          });
          Navigator.pop(context);
          _loadInspections();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _inspections.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _inspections.isEmpty) {
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
              FilledButton.icon(
                onPressed: _loadInspections,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        _page = 1;
        await _loadInspections();
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.filter_list),
                  onPressed: _showFilters,
                  tooltip: 'Filter',
                ),
                if (_dateFrom != null || _dateTo != null)
                  IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      setState(() {
                        _dateFrom = null;
                        _dateTo = null;
                        _page = 1;
                      });
                      widget.onClearDateFilter?.call();
                      _loadInspections();
                    },
                    tooltip: 'Clear date filter',
                  ),
                Text(
                  '${_inspections.length} inspection(s)',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          Expanded(
            child: _inspections.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.assignment_outlined, size: 80, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text(
                          'No inspections assigned',
                          style: TextStyle(fontSize: 18, color: Colors.grey.shade700),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _inspections.length + 1,
                    itemBuilder: (context, i) {
                      if (i == _inspections.length) {
                        final total = _pagination['total'] ?? 0;
                        final totalPages = _pagination['totalPages'] ?? 1;
                        if (_page < totalPages && total > _limit) {
                          return Padding(
                            padding: const EdgeInsets.all(16),
                            child: Center(
                              child: TextButton(
                                onPressed: () {
                                  setState(() => _page++);
                                  _loadInspections();
                                },
                                child: const Text('Load more'),
                              ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      }
                      final inv = _inspections[i] as Map<String, dynamic>;
                      final id = inv['_id'] as String?;
                      final businessName = inv['businessName'] as String? ?? 'Unknown';
                      final permitType = inv['permitType'] as String? ?? '';
                      final inspectionType = inv['inspectionType'] as String? ?? '';
                      final scheduledDate = inv['scheduledDate'];
                      final status = inv['status'] as String? ?? 'pending';
                      String dateStr = '';
                      if (scheduledDate != null) {
                        try {
                          final d = DateTime.parse(scheduledDate.toString());
                          dateStr = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
                        } catch (_) {
                          dateStr = scheduledDate.toString();
                        }
                      }
                      Color statusColor = Colors.grey;
                      if (status == 'completed') statusColor = Colors.green;
                      else if (status == 'in_progress') statusColor = Colors.blue;
                      else if (status == 'pending') statusColor = Colors.orange;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          title: Text(
                            businessName,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text('$permitType • $inspectionType'),
                              Text('Scheduled: $dateStr'),
                              const SizedBox(height: 4),
                              Chip(
                                label: Text(status, style: const TextStyle(fontSize: 12)),
                                backgroundColor: statusColor.withValues(alpha: 0.2),
                                padding: EdgeInsets.zero,
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: id != null ? () => _openDetail(id) : null,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _InspectionFilterSheet extends StatefulWidget {
  final String? initialStatus;
  final String? initialDateFrom;
  final String? initialDateTo;
  final void Function(String? status, String? dateFrom, String? dateTo) onApply;

  const _InspectionFilterSheet({
    this.initialStatus,
    this.initialDateFrom,
    this.initialDateTo,
    required this.onApply,
  });

  @override
  State<_InspectionFilterSheet> createState() => _InspectionFilterSheetState();
}

class _InspectionFilterSheetState extends State<_InspectionFilterSheet> {
  late String? _status;
  late TextEditingController _fromCtrl;
  late TextEditingController _toCtrl;

  @override
  void initState() {
    super.initState();
    _status = widget.initialStatus;
    _fromCtrl = TextEditingController(text: widget.initialDateFrom ?? '');
    _toCtrl = TextEditingController(text: widget.initialDateTo ?? '');
  }

  @override
  void dispose() {
    _fromCtrl.dispose();
    _toCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Filter', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          DropdownButtonFormField<String?>(
            value: _status,
            decoration: const InputDecoration(labelText: 'Status'),
            items: const [
              DropdownMenuItem(value: null, child: Text('All')),
              DropdownMenuItem(value: 'pending', child: Text('Pending')),
              DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
              DropdownMenuItem(value: 'completed', child: Text('Completed')),
            ],
            onChanged: (v) => setState(() => _status = v),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _fromCtrl,
            decoration: const InputDecoration(labelText: 'Date from (YYYY-MM-DD)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _toCtrl,
            decoration: const InputDecoration(labelText: 'Date to (YYYY-MM-DD)'),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              TextButton(
                onPressed: () {
                  setState(() {
                    _status = null;
                    _fromCtrl.clear();
                    _toCtrl.clear();
                  });
                },
                child: const Text('Clear'),
              ),
              const Spacer(),
              FilledButton(
                onPressed: () {
                  final from = _fromCtrl.text.trim().isEmpty ? null : _fromCtrl.text.trim();
                  final to = _toCtrl.text.trim().isEmpty ? null : _toCtrl.text.trim();
                  widget.onApply(_status, from, to);
                },
                child: const Text('Apply'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
