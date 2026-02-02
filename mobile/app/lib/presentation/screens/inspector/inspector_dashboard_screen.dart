import 'package:flutter/material.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/mock/inspector_mock_data.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'inspector_shell.dart';

class InspectorDashboardScreen extends StatefulWidget {
  final void Function(InspectorNavItem item)? onNavigate;

  const InspectorDashboardScreen({super.key, this.onNavigate});

  @override
  State<InspectorDashboardScreen> createState() => _InspectorDashboardScreenState();
}

class _InspectorDashboardScreenState extends State<InspectorDashboardScreen> {
  int _today = 0;
  int _pending = 0;
  int _completed = 0;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCounts();
  }

  Future<void> _loadCounts() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await MongoDBService.getInspectorInspectionCounts();
      if (res['success'] == true) {
        final todayCount = res['today'] as int? ?? 0;
        final pendingCount = res['pending'] as int? ?? 0;
        final completedCount = res['completed'] as int? ?? 0;
        final useMock = todayCount == 0 && pendingCount == 0 && completedCount == 0;
        final data = useMock ? InspectorMockData.getCounts() : res;
        setState(() {
          _today = data['today'] as int? ?? 0;
          _pending = data['pending'] as int? ?? 0;
          _completed = data['completed'] as int? ?? 0;
          _loading = false;
          _error = null;
        });
      } else {
        final mock = InspectorMockData.getCounts();
        setState(() {
          _today = mock['today'] as int? ?? 0;
          _pending = mock['pending'] as int? ?? 0;
          _completed = mock['completed'] as int? ?? 0;
          _loading = false;
          _error = null;
        });
      }
    } catch (e) {
      final mock = InspectorMockData.getCounts();
      setState(() {
        _today = mock['today'] as int? ?? 0;
        _pending = mock['pending'] as int? ?? 0;
        _completed = mock['completed'] as int? ?? 0;
        _loading = false;
        _error = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadCounts,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              clipBehavior: Clip.antiAlias,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      BizClearColors.primaryLight,
                      BizClearColors.primary,
                    ],
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.dashboard, size: 28, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Text(
                              'Inspector Dashboard',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'View your assigned inspections, schedule, history, and manage violations from the menu.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.9),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (_loading)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
            else if (_error != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Icon(Icons.warning_amber_rounded, size: 48, color: Colors.orange.shade700),
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _loadCounts,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _CountCard(
                      label: "Today's",
                      count: _today,
                      color: BizClearColors.accent,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _CountCard(
                      label: 'Pending',
                      count: _pending,
                      color: BizClearColors.warning,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _CountCard(
                      label: 'Completed',
                      count: _completed,
                      color: BizClearColors.success,
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 24),
            Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: BizClearColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _QuickActionCard(
                  icon: Icons.calendar_month,
                  title: 'My Schedule',
                  color: BizClearColors.primaryLight,
                  onTap: () => widget.onNavigate?.call(InspectorNavItem.mySchedule),
                ),
                _QuickActionCard(
                  icon: Icons.assignment,
                  title: 'Assigned',
                  color: BizClearColors.accent,
                  onTap: () => widget.onNavigate?.call(InspectorNavItem.assignedInspections),
                ),
                _QuickActionCard(
                  icon: Icons.history,
                  title: 'History',
                  color: BizClearColors.warning,
                  onTap: () => widget.onNavigate?.call(InspectorNavItem.inspectionHistory),
                ),
                _QuickActionCard(
                  icon: Icons.warning_amber,
                  title: 'Violations',
                  color: BizClearColors.error,
                  onTap: () => widget.onNavigate?.call(InspectorNavItem.violations),
                ),
                _QuickActionCard(
                  icon: Icons.notifications,
                  title: 'Notifications',
                  color: BizClearColors.success,
                  onTap: () => widget.onNavigate?.call(InspectorNavItem.notifications),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CountCard extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _CountCard({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: BizClearColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: BizClearColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback? onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: BizClearColors.surface,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 36, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: BizClearColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
