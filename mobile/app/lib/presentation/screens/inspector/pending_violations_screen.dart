import 'package:flutter/material.dart';

class PendingViolationsScreen extends StatelessWidget {
  final String token;

  const PendingViolationsScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Pending Violations'));
  }
}
