import 'package:flutter/material.dart';
 

class BiometricSetupSection extends StatelessWidget {
  final bool activated;
  final ValueChanged<bool> onChanged;
  final String title;
  final String infoText;

  const BiometricSetupSection({
    super.key,
    required this.activated,
    required this.onChanged,
    this.title = 'Activate Biometric Authentication',
    this.infoText = 'Ensure biometrics are enrolled in your device settings before enabling.',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Use your device fingerprint during sign in to add an extra layer of security.',
                      style: TextStyle(fontSize: 13),
                    ),
                  ],
                ),
              ),
              Switch(
                value: activated,
                onChanged: onChanged,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  infoText,
                  style: TextStyle(fontSize: 13, color: Colors.blue.shade900, height: 1.3),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
