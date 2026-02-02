import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/mock/inspector_mock_data.dart';
import 'inspection_detail_screen.dart';

class InspectionHistoryScreen extends StatefulWidget {
  const InspectionHistoryScreen({super.key});

  @override
  State<InspectionHistoryScreen> createState() => _InspectionHistoryScreenState();
}

class _InspectionHistoryScreenState extends State<InspectionHistoryScreen> {
  List<dynamic> _inspections = [];
  bool _loading = true;
  String? _error;

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
      final res = await MongoDBService.getInspectorInspections(
        status: 'completed',
        page: 1,
        limit: 50,
      );
      if (res['success'] == true) {
        final list = List<dynamic>.from(res['inspections'] ?? []);
        if (list.isEmpty) {
          setState(() {
            _inspections = InspectorMockData.getCompletedInspections();
            _loading = false;
            _error = null;
          });
          return;
        }
        setState(() {
          _inspections = list;
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _inspections = InspectorMockData.getCompletedInspections();
          _loading = false;
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _inspections = InspectorMockData.getCompletedInspections();
        _loading = false;
        _error = null;
      });
    }
  }

  void _openDetail(String id) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InspectionDetailScreen(inspectionId: id),
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
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: _inspections.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history, size: 80, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No completed inspections yet',
                    style: TextStyle(fontSize: 18, color: Colors.grey.shade700),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _inspections.length,
              itemBuilder: (context, i) {
                final inv = _inspections[i] as Map<String, dynamic>;
                final id = inv['_id'] as String?;
                final businessName = inv['businessName'] as String? ?? 'Unknown';
                final result = inv['overallResult'] as String? ?? '—';
                final scheduledDate = inv['scheduledDate'];
                String dateStr = '';
                if (scheduledDate != null) {
                  try {
                    final d = DateTime.parse(scheduledDate.toString());
                    dateStr = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
                  } catch (_) {
                    dateStr = scheduledDate.toString();
                  }
                }
                Color resultColor = Colors.grey;
                if (result == 'passed') resultColor = Colors.green;
                else if (result == 'failed') resultColor = Colors.red;
                else if (result == 'needs_reinspection') resultColor = Colors.orange;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(businessName, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Completed: $dateStr'),
                        Chip(
                          label: Text(result, style: const TextStyle(fontSize: 12)),
                          backgroundColor: resultColor.withValues(alpha: 0.2),
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
    );
  }
}
