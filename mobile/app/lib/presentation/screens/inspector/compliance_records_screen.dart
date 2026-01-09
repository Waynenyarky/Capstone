import 'package:flutter/material.dart';

class ComplianceRecordsScreen extends StatelessWidget {
  final String token;

  const ComplianceRecordsScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Compliance Records'));
  }
}
