import 'package:flutter/material.dart';
import 'package:app/core/theme/bizclear_colors.dart';
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
                border: Border.all(color: BizClearColors.inputBorder),
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
          const SizedBox(height: 12),
          Text(
            'Scan with Google Authenticator, Microsoft Authenticator, or similar.',
            style: TextStyle(fontSize: 13, color: BizClearColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
        ],
        if (secret != null) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (issuer != null && issuer!.isNotEmpty)
                      Text('Account: $issuer', style: TextStyle(fontSize: 12, color: BizClearColors.textSecondary)),
                    const SizedBox(height: 4),
                    SelectableText(
                      secret!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 14) ?? const TextStyle(fontSize: 14),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy, size: 22),
                tooltip: 'Copy secret',
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: secret!));
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Secret copied')));
                },
              ),
            ],
          ),
        ],
      ],
    );
  }
}
