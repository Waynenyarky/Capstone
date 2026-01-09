import 'package:flutter/material.dart';

class AssignedInspectionsScreen extends StatelessWidget {
  final String token;

  const AssignedInspectionsScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Assigned Inspections'));
  }
}
