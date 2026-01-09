import 'package:flutter/material.dart';

class ConductInspectionScreen extends StatelessWidget {
  final String token;

  const ConductInspectionScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Conduct Inspection'));
  }
}
