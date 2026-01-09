import 'package:flutter/material.dart';

class RecentActivityScreen extends StatelessWidget {
  final String token;

  const RecentActivityScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Recent Activity'));
  }
}
