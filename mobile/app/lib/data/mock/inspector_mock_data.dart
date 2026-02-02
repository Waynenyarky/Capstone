/// Static mock data for Inspector role so Dashboard, Schedule, Assigned,
/// History, Violations, and Notifications can be tested without the backend.
class InspectorMockData {
  InspectorMockData._();

  static Map<String, dynamic> getCounts() {
    return {
      'success': true,
      'today': 3,
      'pending': 4,
      'completed': 3,
    };
  }

  static List<Map<String, dynamic>> getInspections() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final tomorrow = today.add(const Duration(days: 1));
    final lastWeek = today.subtract(const Duration(days: 7));
    final nextWeek = today.add(const Duration(days: 7));

    return [
      {
        '_id': 'mock-inspection-1',
        'businessName': 'Seed Cafe & Restaurant',
        'businessId': 'biz_seed_1',
        'permitType': 'initial',
        'inspectionType': 'initial',
        'scheduledDate': today.toIso8601String(),
        'status': 'pending',
        'overallResult': null,
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-2',
        'businessName': 'Seed Retail Store',
        'businessId': 'biz_seed_2',
        'permitType': 'renewal',
        'inspectionType': 'renewal',
        'scheduledDate': today.add(const Duration(hours: 2)).toIso8601String(),
        'status': 'in_progress',
        'overallResult': null,
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-3',
        'businessName': 'Seed Cafe & Restaurant',
        'businessId': 'biz_seed_1',
        'permitType': 'initial',
        'inspectionType': 'follow_up',
        'scheduledDate': tomorrow.toIso8601String(),
        'status': 'pending',
        'overallResult': null,
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-4',
        'businessName': 'Seed Retail Store',
        'businessId': 'biz_seed_2',
        'permitType': 'renewal',
        'inspectionType': 'renewal',
        'scheduledDate': lastWeek.toIso8601String(),
        'status': 'pending',
        'overallResult': null,
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-5',
        'businessName': 'Seed Cafe & Restaurant',
        'businessId': 'biz_seed_1',
        'permitType': 'renewal',
        'inspectionType': 'renewal',
        'scheduledDate': yesterday.toIso8601String(),
        'status': 'completed',
        'overallResult': 'passed',
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-6',
        'businessName': 'Seed Retail Store',
        'businessId': 'biz_seed_2',
        'permitType': 'initial',
        'inspectionType': 'initial',
        'scheduledDate': lastWeek.toIso8601String(),
        'status': 'completed',
        'overallResult': 'failed',
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-7',
        'businessName': 'Seed Cafe & Restaurant',
        'businessId': 'biz_seed_1',
        'permitType': 'renewal',
        'inspectionType': 'follow_up',
        'scheduledDate': nextWeek.toIso8601String(),
        'status': 'pending',
        'overallResult': null,
        'assignedBy': 'Larry Officer',
      },
      {
        '_id': 'mock-inspection-8',
        'businessName': 'Demo Food Hub',
        'businessId': 'biz_mock_3',
        'permitType': 'initial',
        'inspectionType': 'initial',
        'scheduledDate': today.add(const Duration(hours: 4)).toIso8601String(),
        'status': 'pending',
        'overallResult': null,
        'assignedBy': 'Larry Officer',
      },
    ];
  }

  static List<Map<String, dynamic>> getViolations() {
    final now = DateTime.now();
    final deadline = now.add(const Duration(days: 14));

    return [
      {
        '_id': 'mock-violation-1',
        'violationId': 'VIO-MOCK-001',
        'violationType': 'sanitation',
        'description': 'Improper waste disposal observed',
        'severity': 'minor',
        'complianceDeadline': deadline.toIso8601String(),
        'status': 'open',
        'issuedAt': now.subtract(const Duration(days: 2)).toIso8601String(),
        'businessName': 'Seed Cafe & Restaurant',
        'inspectionId': 'mock-inspection-5',
      },
      {
        '_id': 'mock-violation-2',
        'violationId': 'VIO-MOCK-002',
        'violationType': 'fire_safety',
        'description': 'Fire extinguisher not properly mounted',
        'severity': 'major',
        'complianceDeadline': deadline.toIso8601String(),
        'status': 'resolved',
        'issuedAt': now.subtract(const Duration(days: 5)).toIso8601String(),
        'businessName': 'Seed Cafe & Restaurant',
        'inspectionId': 'mock-inspection-5',
      },
      {
        '_id': 'mock-violation-3',
        'violationId': 'VIO-MOCK-003',
        'violationType': 'health',
        'description': 'Food handling certificate expired',
        'severity': 'critical',
        'complianceDeadline': deadline.toIso8601String(),
        'status': 'open',
        'issuedAt': now.subtract(const Duration(days: 7)).toIso8601String(),
        'businessName': 'Seed Retail Store',
        'inspectionId': 'mock-inspection-6',
      },
      {
        '_id': 'mock-violation-4',
        'violationId': 'VIO-MOCK-004',
        'violationType': 'sanitation',
        'description': 'Storage area not properly labeled',
        'severity': 'minor',
        'complianceDeadline': deadline.toIso8601String(),
        'status': 'open',
        'issuedAt': now.subtract(const Duration(days: 1)).toIso8601String(),
        'businessName': 'Seed Cafe & Restaurant',
        'inspectionId': 'mock-inspection-5',
      },
    ];
  }

  static List<Map<String, dynamic>> getNotifications() {
    final now = DateTime.now();

    return [
      {
        '_id': 'mock-notif-1',
        'type': 'inspection_assigned',
        'title': 'New Inspection Assigned',
        'message': 'You have been assigned to inspect Seed Cafe & Restaurant today.',
        'relatedEntityType': 'inspection',
        'relatedEntityId': 'mock-inspection-1',
        'read': false,
        'createdAt': now.toIso8601String(),
      },
      {
        '_id': 'mock-notif-2',
        'type': 'inspection_assigned',
        'title': 'Inspection Scheduled',
        'message': 'Inspection for Seed Retail Store has been scheduled for tomorrow.',
        'relatedEntityType': 'inspection',
        'relatedEntityId': 'mock-inspection-3',
        'read': true,
        'createdAt': now.subtract(const Duration(hours: 2)).toIso8601String(),
      },
      {
        '_id': 'mock-notif-3',
        'type': 'inspection_schedule_changed',
        'title': 'Schedule Change',
        'message': 'The inspection for Seed Cafe has been rescheduled to next week.',
        'relatedEntityType': 'inspection',
        'relatedEntityId': 'mock-inspection-7',
        'read': false,
        'createdAt': now.subtract(const Duration(hours: 5)).toIso8601String(),
      },
      {
        '_id': 'mock-notif-4',
        'type': 'appeal_outcome',
        'title': 'Appeal Resolved',
        'message': 'The appeal for a violation has been resolved in your favor.',
        'relatedEntityType': 'violation',
        'relatedEntityId': 'mock-violation-2',
        'read': false,
        'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
      },
      {
        '_id': 'mock-notif-5',
        'type': 'inspection_assigned',
        'title': 'New Assignment',
        'message': 'Demo Food Hub – initial inspection scheduled for today.',
        'relatedEntityType': 'inspection',
        'relatedEntityId': 'mock-inspection-8',
        'read': false,
        'createdAt': now.subtract(const Duration(minutes: 30)).toIso8601String(),
      },
    ];
  }

  /// Inspections filtered by status for History (completed only).
  static List<Map<String, dynamic>> getCompletedInspections() {
    return getInspections().where((e) => e['status'] == 'completed').toList();
  }

  /// Inspections filtered by date range (for Schedule calendar).
  static List<Map<String, dynamic>> getInspectionsInRange(DateTime start, DateTime end) {
    final list = getInspections();
    final startDay = DateTime(start.year, start.month, start.day);
    final endDay = DateTime(end.year, end.month, end.day);
    return list.where((e) {
      final s = e['scheduledDate'] as String?;
      if (s == null) return false;
      try {
        final d = DateTime.parse(s);
        final day = DateTime(d.year, d.month, d.day);
        return !day.isBefore(startDay) && !day.isAfter(endDay);
      } catch (_) {
        return false;
      }
    }).toList();
  }
}
