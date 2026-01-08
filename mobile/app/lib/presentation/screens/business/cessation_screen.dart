import 'package:flutter/material.dart';

class CessationScreen extends StatelessWidget {
  const CessationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.cancel_presentation, size: 64, color: Colors.red),
            ),
            const SizedBox(height: 24),
            const Text(
              'Business Cessation',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Process business cessation requests here. If you are closing your business, you can submit the necessary documents.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
            const SizedBox(height: 32),
            OutlinedButton.icon(
              onPressed: () {
                // TODO: Implement request cessation
              },
              icon: const Icon(Icons.warning_amber_rounded),
              label: const Text('Request Cessation'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
