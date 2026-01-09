import 'package:flutter/material.dart';

class UploadInspectionReportScreen extends StatelessWidget {
  final String token;

  const UploadInspectionReportScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Upload Inspection Report'));
  }
}
