import 'package:flutter/material.dart';

class InspectionHistoryScreen extends StatelessWidget {
  final String token;

  const InspectionHistoryScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Inspection History'));
  }
}
