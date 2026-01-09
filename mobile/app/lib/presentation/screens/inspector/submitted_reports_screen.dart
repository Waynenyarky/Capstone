import 'package:flutter/material.dart';

class SubmittedReportsScreen extends StatelessWidget {
  final String token;

  const SubmittedReportsScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Submitted Reports'));
  }
}
