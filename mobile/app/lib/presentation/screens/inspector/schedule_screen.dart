import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/mock/inspector_mock_data.dart';
import 'inspection_detail_screen.dart';

class ScheduleScreen extends StatefulWidget {
  final void Function(DateTime? dateFrom, DateTime? dateTo)? onDaySelected;

  const ScheduleScreen({super.key, this.onDaySelected});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  CalendarFormat _format = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  List<dynamic> _inspections = [];
  bool _loading = true;
  String? _error;
  Map<DateTime, List<Map<String, dynamic>>> _events = {};

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _loadInspectionsForMonth();
  }

  void _loadInspectionsForMonth() {
    final start = DateTime(_focusedDay.year, _focusedDay.month, 1);
    final end = DateTime(_focusedDay.year, _focusedDay.month + 1, 0);
    _loadInspections(
      dateFrom: '${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}',
      dateTo: '${end.year}-${end.month.toString().padLeft(2, '0')}-${end.day.toString().padLeft(2, '0')}',
    );
  }

  void _applyInspectionsToList(List<dynamic> list) {
    final events = <DateTime, List<Map<String, dynamic>>>{};
    for (final inv in list) {
      final m = inv as Map<String, dynamic>;
      final scheduledDate = m['scheduledDate'];
      if (scheduledDate != null) {
        try {
          final d = DateTime.parse(scheduledDate.toString());
          final day = DateTime(d.year, d.month, d.day);
          events.putIfAbsent(day, () => []).add(Map<String, dynamic>.from(m));
        } catch (_) {}
      }
    }
    setState(() {
      _inspections = list;
      _events = events;
      _loading = false;
      _error = null;
    });
  }

  Future<void> _loadInspections({
    String? dateFrom,
    String? dateTo,
  }) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await MongoDBService.getInspectorInspections(
        dateFrom: dateFrom,
        dateTo: dateTo,
        page: 1,
        limit: 100,
      );
      if (res['success'] == true) {
        final list = List<dynamic>.from(res['inspections'] ?? []);
        if (list.isEmpty && dateFrom != null && dateTo != null) {
          try {
            final start = DateTime.parse('$dateFrom');
            final end = DateTime.parse('$dateTo');
            final mockList = InspectorMockData.getInspectionsInRange(start, end);
            _applyInspectionsToList(mockList);
            return;
          } catch (_) {}
        }
        _applyInspectionsToList(list);
      } else {
        if (dateFrom != null && dateTo != null) {
          try {
            final start = DateTime.parse('$dateFrom');
            final end = DateTime.parse('$dateTo');
            _applyInspectionsToList(InspectorMockData.getInspectionsInRange(start, end));
            return;
          } catch (_) {}
        }
        setState(() {
          _loading = false;
          _error = res['message'] ?? 'Failed to load inspections';
        });
      }
    } catch (e) {
      if (dateFrom != null && dateTo != null) {
        try {
          final start = DateTime.parse('$dateFrom');
          final end = DateTime.parse('$dateTo');
          _applyInspectionsToList(InspectorMockData.getInspectionsInRange(start, end));
          return;
        } catch (_) {}
      }
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  List<Map<String, dynamic>> _getEventsForDay(DateTime day) {
    final d = DateTime(day.year, day.month, day.day);
    return _events[d] ?? [];
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'in_progress':
        return Colors.blue;
      case 'pending':
      default:
        return Colors.amber;
    }
  }

  String _formatTimeWindow(dynamic tw) {
    if (tw == null || tw is! Map) return '';
    final start = tw['start'];
    final end = tw['end'];
    if (start == null || end == null) return '';
    try {
      final s = DateTime.parse(start.toString());
      final e = DateTime.parse(end.toString());
      return '${s.hour.toString().padLeft(2, '0')}:${s.minute.toString().padLeft(2, '0')} - ${e.hour.toString().padLeft(2, '0')}:${e.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  void _openDetail(String inspectionId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InspectionDetailScreen(inspectionId: inspectionId),
      ),
    ).then((_) => _loadInspectionsForMonth());
  }

  void _onDaySelected(DateTime selected, DateTime focused) {
    setState(() {
      _selectedDay = selected;
      _focusedDay = focused;
    });
    widget.onDaySelected?.call(
      DateTime(selected.year, selected.month, selected.day),
      DateTime(selected.year, selected.month, selected.day, 23, 59, 59),
    );
  }

  void _onPageChanged(DateTime focused) {
    setState(() => _focusedDay = focused);
    _loadInspectionsForMonth();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => _loadInspectionsForMonth(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: TableCalendar(
                firstDay: DateTime.utc(2020, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                calendarFormat: _format,
                selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                onDaySelected: _onDaySelected,
                onFormatChanged: (f) => setState(() => _format = f),
                onPageChanged: _onPageChanged,
                eventLoader: _getEventsForDay,
                calendarStyle: CalendarStyle(
                  markerDecoration: BoxDecoration(
                    color: Colors.blue.shade400,
                    shape: BoxShape.circle,
                  ),
                  todayDecoration: BoxDecoration(
                    color: Colors.blue.shade200,
                    shape: BoxShape.circle,
                  ),
                  selectedDecoration: const BoxDecoration(
                    color: Color(0xFF003A70),
                    shape: BoxShape.circle,
                  ),
                ),
                headerStyle: HeaderStyle(
                  formatButtonVisible: true,
                  titleCentered: true,
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_loading && _inspections.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
            else if (_error != null && _inspections.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: Colors.red.shade700)),
                    ],
                  ),
                ),
              )
            else ...[
              Text(
                _selectedDay != null
                    ? 'Inspections on ${_selectedDay!.year}-${_selectedDay!.month.toString().padLeft(2, '0')}-${_selectedDay!.day.toString().padLeft(2, '0')}'
                    : 'Select a day',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 12),
              Builder(
                builder: (context) {
                  final events = _selectedDay != null ? _getEventsForDay(_selectedDay!) : <Map<String, dynamic>>[];
                  if (events.isEmpty) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(
                          child: Text(
                            'No inspections scheduled',
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                        ),
                      ),
                    );
                  }
                  return Column(
                    children: events.map((e) {
                      final id = e['_id'] as String?;
                      final businessName = e['businessName'] as String? ?? 'Unknown';
                      final status = e['status'] as String? ?? 'pending';
                      final tw = e['scheduledTimeWindow'];
                      final timeStr = _formatTimeWindow(tw);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            width: 8,
                            height: 40,
                            decoration: BoxDecoration(
                              color: _statusColor(status),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          title: Text(
                            businessName,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (timeStr.isNotEmpty) Text(timeStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              Chip(
                                label: Text(status, style: const TextStyle(fontSize: 11)),
                                backgroundColor: _statusColor(status).withValues(alpha: 0.2),
                                padding: EdgeInsets.zero,
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: id != null ? () => _openDetail(id) : null,
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
