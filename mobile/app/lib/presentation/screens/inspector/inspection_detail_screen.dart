import 'dart:io';
import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/data/services/connectivity_service.dart';
import 'package:app/data/local/inspection_local_store.dart';
import 'package:app/presentation/screens/inspector/legal_reference_sheet.dart';

class InspectionDetailScreen extends StatefulWidget {
  final String inspectionId;

  const InspectionDetailScreen({super.key, required this.inspectionId});

  @override
  State<InspectionDetailScreen> createState() => _InspectionDetailScreenState();
}

class _InspectionDetailScreenState extends State<InspectionDetailScreen> {
  Map<String, dynamic>? _inspection;
  Map<String, dynamic>? _riskIndicators;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    if (widget.inspectionId.startsWith('mock-')) {
      if (mounted) {
        setState(() {
          _inspection = null;
          _loading = false;
          _error = 'Inspection not found. Pull to refresh.';
        });
      }
      return;
    }
    try {
      final online = await ConnectivityService.instance.isOnline;
      Map<String, dynamic>? data;
      if (online) {
        final res = await MongoDBService.getInspectionDetail(widget.inspectionId);
        if (res['success'] == true) {
          data = res['inspection'] as Map<String, dynamic>?;
          if (data != null) {
            InspectionLocalStore.cacheInspection(widget.inspectionId, data);
          }
        }
      } else {
        data = await InspectionLocalStore.getCachedInspection(widget.inspectionId);
      }
      if (mounted) {
        setState(() {
          _inspection = data;
          _loading = false;
          _error = data == null ? (online ? 'Failed to load' : 'Offline - no cached data') : null;
        });
        if (data != null && online) {
          _loadRiskIndicators();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _loadRiskIndicators() async {
    try {
      final res = await MongoDBService.getInspectionRiskIndicators(widget.inspectionId);
      if (res['success'] == true && mounted) {
        setState(() => _riskIndicators = Map<String, dynamic>.from(res));
      }
    } catch (_) {}
  }

  Future<void> _startInspection() async {
    Map<String, dynamic>? gpsAtStart;
    String? gpsSkipReason;
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        final req = await Geolocator.requestPermission();
        if (req == LocationPermission.denied || req == LocationPermission.deniedForever) {
          if (!mounted) return;
          gpsSkipReason = await _showGpsSkipReasonDialog();
          if (gpsSkipReason == null) return;
        }
      }
      if (gpsSkipReason == null) {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
        );
        gpsAtStart = {
          'lat': pos.latitude,
          'lng': pos.longitude,
          'accuracy': pos.accuracy,
          'capturedAt': pos.timestamp?.toIso8601String() ?? DateTime.now().toIso8601String(),
        };
      }
    } catch (e) {
      if (!mounted) return;
      gpsSkipReason = await _showGpsSkipReasonDialog(errorDetail: e.toString());
      if (gpsSkipReason == null) return;
    }
    if (gpsSkipReason != null) {
      gpsAtStart = {'skipped': true, 'reason': gpsSkipReason};
    }

    final res = await MongoDBService.startInspection(
      widget.inspectionId,
      gpsAtStart: gpsAtStart,
    );
    debugPrint('startInspection response: $res');
    if (res['success'] == true) {
      await _loadDetail();
      if (mounted && res['gpsMismatch'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location mismatch detected. Please provide a reason if proceeding.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to start')),
        );
      }
    }
  }

  Future<String?> _showGpsSkipReasonDialog({String? errorDetail}) async {
    final ctrl = TextEditingController();
    return showDialog<String?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Location Unavailable'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              errorDetail != null
                  ? 'Could not get GPS location. Please provide a reason to continue without location.'
                  : 'GPS permission was denied. Please provide a reason to continue without location.',
              style: const TextStyle(height: 1.5),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              decoration: const InputDecoration(
                labelText: 'Reason (required)',
                hintText: 'e.g. Indoor location, GPS hardware issue',
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, null),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final reason = ctrl.text.trim();
              if (reason.isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Please provide a reason')),
                );
                return;
              }
              Navigator.pop(ctx, reason);
            },
            child: const Text('Proceed Without GPS'),
          ),
        ],
      ),
    );
  }

  Future<void> _showGpsMismatchReasonDialog() async {
    final ctrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('GPS Mismatch - Proceed Anyway'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(
            labelText: 'Reason for proceeding (required)',
            hintText: 'e.g. GPS inaccuracy, multi-building site',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final reason = ctrl.text.trim();
              if (reason.isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Please provide a reason')),
                );
                return;
              }
              Navigator.pop(ctx);
              final res = await MongoDBService.setGpsMismatchReason(widget.inspectionId, reason);
              if (res['success'] == true) {
                await _loadDetail();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Reason recorded')),
                  );
                }
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateChecklist(List<dynamic> checklist) async {
    final list = checklist.map((e) => e is Map<String, dynamic> ? e : Map<String, dynamic>.from(e as Map)).toList();
    final online = await ConnectivityService.instance.isOnline;
    if (!online) {
      await InspectionLocalStore.queueChecklistUpdate(widget.inspectionId, list);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saved locally — will sync when back online'), backgroundColor: Colors.orange),
        );
      }
      return;
    }
    final res = await MongoDBService.updateChecklist(widget.inspectionId, list);
    if (res['success'] == true) {
      await _loadDetail();
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to update checklist')),
        );
      }
    }
  }

  void _showLegalReference() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => const LegalReferenceSheet(),
    );
  }

  void _showIssueViolation() {
    final typeCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final legalCtrl = TextEditingController();
    String severity = 'minor';
    DateTime deadline = DateTime.now().add(const Duration(days: 14));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 24,
          right: 24,
          top: 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Issue Violation', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextField(
                controller: typeCtrl,
                decoration: const InputDecoration(labelText: 'Violation type'),
              ),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 3,
              ),
              DropdownButtonFormField<String>(
                value: severity,
                decoration: const InputDecoration(labelText: 'Severity'),
                items: const [
                  DropdownMenuItem(value: 'minor', child: Text('Minor')),
                  DropdownMenuItem(value: 'major', child: Text('Major')),
                  DropdownMenuItem(value: 'critical', child: Text('Critical')),
                ],
                onChanged: (v) => severity = v ?? severity,
              ),
              TextField(
                decoration: const InputDecoration(labelText: 'Legal basis (optional)'),
                controller: legalCtrl,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  Navigator.pop(context);
                  final res = await MongoDBService.issueViolation(
                    inspectionId: widget.inspectionId,
                    violationType: typeCtrl.text.trim(),
                    description: descCtrl.text.trim(),
                    severity: severity,
                    complianceDeadline: deadline,
                    legalBasis: legalCtrl.text.trim().isEmpty ? null : legalCtrl.text.trim(),
                  );
                  if (res['success'] == true) {
                    await _loadDetail();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Violation issued')));
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed')));
                    }
                  }
                },
                child: const Text('Issue'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _uploadEvidence() async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    if (xfile == null) return;
    final path = xfile.path;
    if (path.isEmpty) return;

    final fileSize = await File(path).length();
    const maxFileSize = 10 * 1024 * 1024; // 10 MB
    if (fileSize > maxFileSize) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo exceeds 10 MB limit. Please try again.'), backgroundColor: Colors.red),
        );
      }
      return;
    }

    final inv = _inspection;
    final checklist = inv != null ? List<dynamic>.from(inv['checklist'] ?? []) : <dynamic>[];
    final notesCtrl = TextEditingController();
    final violationAreaCtrl = TextEditingController();
    final selectedChecklistId = <String?>[null];

    if (!mounted) return;
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Add Evidence', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(path),
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Notes (optional)',
                    hintText: 'Describe what this evidence shows',
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: violationAreaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Violation area / label (optional)',
                    hintText: 'e.g. Kitchen, Storage room',
                  ),
                ),
                if (checklist.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    value: selectedChecklistId[0],
                    decoration: const InputDecoration(labelText: 'Link to checklist item (optional)'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('None')),
                      ...checklist.map((c) {
                        final m = c as Map<String, dynamic>;
                        final id = m['id'] as String? ?? '';
                        final label = m['label'] as String? ?? id;
                        return DropdownMenuItem(value: id.isEmpty ? null : id, child: Text(label));
                      }),
                    ],
                    onChanged: (v) => setModalState(() => selectedChecklistId[0] = v),
                  ),
                ],
                const SizedBox(height: 24),
                Row(
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancel'),
                    ),
                    const Spacer(),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Upload'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (ok != true) return;

    final metadata = <String, dynamic>{
      'notes': notesCtrl.text.trim(),
      'violationArea': violationAreaCtrl.text.trim(),
    };
    final cid = selectedChecklistId[0];
    if (cid != null && cid.isNotEmpty) {
      metadata['checklistItemId'] = cid;
    }

    final res = await MongoDBService.uploadEvidence(
      inspectionId: widget.inspectionId,
      filePath: path,
      type: 'photo',
      metadata: metadata.isNotEmpty ? metadata : null,
    );
    if (res['success'] == true) {
      await _loadDetail();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Evidence uploaded')));
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Upload failed')));
      }
    }
  }

  void _showSubmitDialog() async {
    final checklist = _inspection?['checklist'] as List<dynamic>? ?? [];
    if (checklist.isNotEmpty) {
      final incomplete = checklist.where((c) {
        final m = c is Map<String, dynamic> ? c : <String, dynamic>{};
        return m['checked'] != true;
      }).toList();
      if (incomplete.isNotEmpty) {
        if (!mounted) return;
        final proceed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Incomplete Checklist'),
            content: Text('${incomplete.length} of ${checklist.length} checklist items are not completed. Submit anyway?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Go Back')),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: FilledButton.styleFrom(backgroundColor: Colors.orange),
                child: const Text('Submit Anyway'),
              ),
            ],
          ),
        );
        if (proceed != true) return;
      }
    }

    final online = await ConnectivityService.instance.isOnline;
    if (!online) {
      if (!mounted) return;
      final queueOffline = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('No Connection'),
          content: const Text('You are offline. Queue this submission to sync automatically when you reconnect?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Queue for Sync')),
          ],
        ),
      );
      if (queueOffline != true) return;
    }
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Submit Inspection', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                const Text('Choose the overall result to submit this inspection.'),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    FilledButton(
                      onPressed: () => _submitInspection(ctx, 'passed'),
                      child: const Text('Passed'),
                    ),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: BizClearColors.primaryButtonPadding,
                        minimumSize: BizClearColors.primaryButtonMinimumSize,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        textStyle: BizClearColors.primaryButtonTextStyle,
                      ),
                      onPressed: () => _submitInspection(ctx, 'needs_reinspection'),
                      child: const Text('Needs Re-inspection'),
                    ),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.red,
                        padding: BizClearColors.primaryButtonPadding,
                        minimumSize: BizClearColors.primaryButtonMinimumSize,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        textStyle: BizClearColors.primaryButtonTextStyle,
                      ),
                      onPressed: () => _submitInspection(ctx, 'failed'),
                      child: const Text('Failed'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submitInspection(BuildContext ctx, String overallResult) async {
    Navigator.pop(ctx);

    final payload = {
      'overallResult': overallResult,
    };

    final isOnline = await ConnectivityService.instance.isOnline;
    if (!isOnline) {
      await InspectionLocalStore.queueSubmission(widget.inspectionId, payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Queued for sync. Will submit automatically when back online.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    final res = await MongoDBService.submitInspection(
      widget.inspectionId,
      overallResult,
    );
    if (res['success'] == true) {
      await _loadDetail();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Inspection submitted: $overallResult')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inspection Detail'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _loadDetail, child: const Text('Retry')),
                    ],
                  ),
                )
              : _inspection == null
                  ? const Center(child: Text('Inspection not found'))
                  : _buildContent(),
    );
  }

  Widget _buildContent() {
    final inv = _inspection!;
    final isMock = inv['_isMock'] == true;
    final status = inv['status'] as String? ?? 'pending';
    final isImmutable = inv['isImmutable'] == true || isMock;
    final canStart = !isMock && status == 'pending' && !isImmutable;
    final canEdit = !isMock && status == 'in_progress' && !isImmutable;
    final businessProfile = inv['businessProfile'] as Map<String, dynamic>? ?? (inv['businessName'] != null ? {'businessName': inv['businessName']} : null);
    final checklist = List<dynamic>.from(inv['checklist'] ?? []);
    final evidence = List<dynamic>.from(inv['evidence'] ?? []);
    final parentInspectionId = inv['parentInspectionId'] as String?;

    final gpsMismatch = inv['gpsMismatch'] == true;
    final gpsMismatchReason = (inv['gpsMismatchReason'] as String?)?.trim().isNotEmpty == true;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isMock)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              color: BizClearColors.webPrimaryTintLight,
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: BizClearColors.webPrimaryTintText, size: 22),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Demo data – connect to backend for full details and actions.',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: BizClearColors.webPrimaryTintText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (isMock) const SizedBox(height: 12),
          if (isImmutable)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              color: Colors.green.shade100,
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green.shade800, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Submitted - read only',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Colors.green.shade900,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          if (gpsMismatch && status == 'in_progress')
            Card(
              color: Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber, color: Colors.orange.shade700),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Location mismatch: You may not be at the business address.',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.orange.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (!gpsMismatchReason) ...[
                      const SizedBox(height: 12),
                      FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.orange,
                          padding: BizClearColors.primaryButtonPadding,
                          minimumSize: BizClearColors.primaryButtonMinimumSize,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: _showGpsMismatchReasonDialog,
                        child: const Text('Proceed anyway (add reason)'),
                      ),
                    ] else
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Reason: ${inv['gpsMismatchReason']}',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          if (gpsMismatch && status == 'in_progress') const SizedBox(height: 16),
          if (parentInspectionId != null)
            Card(
              color: BizClearColors.webPrimaryTintLight,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(Icons.replay, color: BizClearColors.webPrimaryTintIcon, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Re-inspection',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: BizClearColors.webPrimaryTintText,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (parentInspectionId != null) const SizedBox(height: 16),
          if (_riskIndicators != null) _buildRiskIndicatorsBanner(_riskIndicators!),
          if (_riskIndicators != null) const SizedBox(height: 16),
          _buildBusinessProfile(businessProfile),
          const SizedBox(height: 24),
          _buildChecklistSection(checklist, canEdit),
          const SizedBox(height: 24),
          _buildViolationsSection(canEdit),
          const SizedBox(height: 24),
          _buildEvidenceSection(evidence, canEdit),
          const SizedBox(height: 24),
          if (canStart || canEdit) ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (canStart)
                  FilledButton(
                    onPressed: _startInspection,
                    child: const Text('Start Inspection'),
                  ),
                if (canEdit) ...[
                  IconButton.filled(
                    onPressed: _uploadEvidence,
                    icon: const Icon(Icons.camera_alt),
                    tooltip: 'Add evidence',
                  ),
                  TextButton.icon(
                    onPressed: _showLegalReference,
                    icon: const Icon(Icons.gavel, size: 18),
                    label: const Text('Legal Reference'),
                  ),
                  FilledButton(
                    onPressed: _showIssueViolation,
                    child: const Text('Issue Violation'),
                  ),
                  FilledButton(
                    onPressed: _showSubmitDialog,
                    child: const Text('Submit'),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRiskIndicatorsBanner(Map<String, dynamic> ri) {
    final items = <Widget>[];
    if (ri['repeatViolations'] == true) {
      items.add(_riskChip('Repeat violator', ri['repeatViolationsCount']));
    }
    if (ri['pastFailedInspections'] == true) {
      items.add(_riskChip('Past failed inspection', ri['pastFailedCount']));
    }
    if (ri['pendingAppeals'] == true) {
      items.add(_riskChip('Pending appeal', ri['pendingAppealsCount']));
    }
    if (items.isEmpty) return const SizedBox.shrink();
    return Card(
      color: Colors.orange.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning_amber, color: Colors.orange.shade700, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Risk indicators',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.orange.shade900,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: items),
          ],
        ),
      ),
    );
  }

  Widget _riskChip(String label, dynamic count) {
    return Chip(
      label: Text(
        count != null ? '$label ($count)' : label,
        style: const TextStyle(fontSize: 12),
      ),
      backgroundColor: Colors.orange.shade200,
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildBusinessProfile(Map<String, dynamic>? bp) {
    if (bp == null) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Business Profile', style: Theme.of(context).textTheme.titleMedium),
            const Divider(),
            _profileRow('Name', bp['businessName'] ?? '—'),
            _profileRow('Owner', bp['ownerFullName'] ?? '—'),
            _profileRow('Permit', bp['permitNumber'] ?? '—'),
            _profileRow('Category', bp['category'] ?? '—'),
            _profileRow('Address', bp['address'] ?? '—'),
            if (bp['openViolations'] != null) _profileRow('Open Violations', '${bp['openViolations']}'),
          ],
        ),
      ),
    );
  }

  Widget _profileRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w500))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildChecklistSection(List<dynamic> checklist, bool canEdit) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Checklist', style: Theme.of(context).textTheme.titleMedium),
            const Divider(),
            ...checklist.asMap().entries.map((e) {
              final i = e.key;
              final item = e.value as Map<String, dynamic>;
              final id = item['id'] ?? '';
              final label = item['label'] ?? '';
              final result = item['result'] ?? 'pending';
              final remarks = item['remarks'] ?? '';
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w500))),
                        if (canEdit)
                          DropdownButton<String>(
                            value: result,
                            items: const [
                              DropdownMenuItem(value: 'pending', child: Text('Pending')),
                              DropdownMenuItem(value: 'pass', child: Text('Pass')),
                              DropdownMenuItem(value: 'fail', child: Text('Fail')),
                              DropdownMenuItem(value: 'na', child: Text('N/A')),
                            ],
                            onChanged: (v) async {
                              final updated = List<Map<String, dynamic>>.from(
                                checklist.map((x) => Map<String, dynamic>.from(x as Map)),
                              );
                              if (i < updated.length) {
                                updated[i] = {...updated[i], 'result': v ?? result};
                                await _updateChecklist(updated);
                              }
                            },
                          )
                        else
                          Chip(label: Text(result)),
                      ],
                    ),
                    if (remarks.isNotEmpty) Text(remarks, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildViolationsSection(bool canEdit) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Violations', style: Theme.of(context).textTheme.titleMedium),
                if (canEdit)
                  TextButton(
                    onPressed: _showIssueViolation,
                    child: const Text('+ Issue'),
                  ),
              ],
            ),
            const Divider(),
            const Text('Violations are shown in the Violations screen.', style: TextStyle(fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildEvidenceSection(List<dynamic> evidence, bool canEdit) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Evidence (${evidence.length})', style: Theme.of(context).textTheme.titleMedium),
            const Divider(),
            if (evidence.isEmpty)
              const Text('No evidence uploaded.', style: TextStyle(fontSize: 13))
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: evidence.map((e) {
                  final url = (e as Map)['url'] ?? '';
                  return Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: url.toString().contains('/uploads/')
                          ? Image.network(
                              '${MongoDBService.baseUrl}$url',
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
                            )
                          : const Icon(Icons.photo),
                    ),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
}
