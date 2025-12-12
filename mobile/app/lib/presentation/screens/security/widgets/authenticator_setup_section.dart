import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

class AuthenticatorSetupSection extends StatelessWidget {
  final String? otpauthUri;
  final String? secret;
  final String? issuer;
  final double qrSize;

  const AuthenticatorSetupSection({
    super.key,
    required this.otpauthUri,
    required this.secret,
    required this.issuer,
    required this.qrSize,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (otpauthUri != null) ...[
          Center(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2)),
                ],
              ),
              child: QrImageView(
                data: otpauthUri!,
                version: QrVersions.auto,
                size: qrSize,
                gapless: true,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add to your TOTP authenticator',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              if (issuer != null) ...[
                Text('Account Name', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Text(
                    issuer!,
                    style: const TextStyle(fontSize: 15, fontFamily: 'monospace'),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (secret != null) ...[
                Text('Secret Key (manual entry)', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: SelectableText(
                          secret!,
                          style: const TextStyle(fontSize: 15, fontFamily: 'monospace'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 20),
                      tooltip: 'Copy',
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: secret!));
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Secret Key copied')));
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
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
                  'Open Microsoft Authenticator → Add account → Other (custom) → scan QR or enter the Secret Key.',
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
