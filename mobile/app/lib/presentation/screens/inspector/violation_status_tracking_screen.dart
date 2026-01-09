import 'package:flutter/material.dart';

class ViolationStatusTrackingScreen extends StatelessWidget {
  final String token;

  const ViolationStatusTrackingScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Violation Status Tracking'));
  }
}
