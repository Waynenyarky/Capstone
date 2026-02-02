import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';

/// Bottom sheet for legal reference: ordinances and violations catalog
class LegalReferenceSheet extends StatefulWidget {
  const LegalReferenceSheet({super.key});

  @override
  State<LegalReferenceSheet> createState() => _LegalReferenceSheetState();
}

class _LegalReferenceSheetState extends State<LegalReferenceSheet> {
  List<dynamic> _ordinances = [];
  List<dynamic> _violations = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final ordRes = await MongoDBService.getOrdinances();
    final vioRes = await MongoDBService.getViolationsCatalog();
    if (mounted) {
      setState(() {
        _ordinances = List<dynamic>.from(ordRes['ordinances'] ?? []);
        _violations = List<dynamic>.from(vioRes['violations'] ?? []);
        _loading = false;
      });
    }
  }

  Future<void> _searchViolations(String q) async {
    final res = await MongoDBService.getViolationsCatalog(query: q);
    if (mounted) {
      setState(() => _violations = List<dynamic>.from(res['violations'] ?? []));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text('Legal Reference', style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 0, label: Text('Violations')),
                      ButtonSegment(value: 1, label: Text('Ordinances')),
                    ],
                    selected: {_tabIndex},
                    onSelectionChanged: (s) => setState(() => _tabIndex = s.first),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          if (_tabIndex == 0) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                controller: _searchCtrl,
                decoration: const InputDecoration(
                  hintText: 'Search violations...',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (v) => _searchViolations(v),
              ),
            ),
          ],
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _tabIndex == 0 ? _violations.length : _ordinances.length,
                    itemBuilder: (context, i) {
                      if (_tabIndex == 0) {
                        final v = _violations[i] as Map<String, dynamic>;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(
                              '${v['code'] ?? ''} - ${v['label'] ?? ''}',
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            subtitle: Text(
                              'Ordinance: ${v['ordinanceRef'] ?? '—'} • Severity: ${v['severity'] ?? '—'}',
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                          ),
                        );
                      } else {
                        final o = _ordinances[i] as Map<String, dynamic>;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(
                              o['title'] ?? '—',
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            subtitle: Text(
                              '${o['reference'] ?? '—'} • ${o['category'] ?? '—'}',
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                          ),
                        );
                      }
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
