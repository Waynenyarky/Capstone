import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class GoogleAuthService {
  static GoogleSignIn? _singleton;
  static bool isSupportedPlatform() {
    if (kIsWeb) return true;
    return Platform.isAndroid || Platform.isIOS;
  }

  static GoogleSignIn _buildClientBasic() {
    final webId = dotenv.env['GOOGLE_SERVER_CLIENT_ID'] ?? dotenv.env['GOOGLE_CLIENT_ID'];
    final androidId = dotenv.env['GOOGLE_ANDROID_CLIENT_ID'];
    final useAndroidClientId = !kIsWeb && Platform.isAndroid && (androidId != null && androidId.isNotEmpty);
    final client = GoogleSignIn(
      scopes: const ['email', 'profile'],
      serverClientId: webId,
      clientId: useAndroidClientId ? androidId : null,
    );
    _singleton = client;
    return client;
  }

  static Future<Map<String, String?>> signInGetTokenAndEmail() async {
    if (!isSupportedPlatform()) return {'idToken': null, 'email': null, 'providerId': null, 'displayName': null};
    final serverClient = _buildClientBasic();
    GoogleSignInAccount? account;
    String? errCode;
    String? errMsg;
    try {
      try { await serverClient.disconnect(); } catch (_) {}
      try { await serverClient.signOut(); } catch (_) {}
      account = await serverClient.signIn();
    } on PlatformException catch (e) {
      debugPrint('Google sign-in failed: ${e.code} ${e.message}');
      errCode = e.code;
      errMsg = e.message;
      account = null;
    }
    if (account != null) {
      String? idToken;
      try {
        final auth = await account.authentication;
        idToken = auth.idToken;
      } catch (_) {
        idToken = null;
      }
      return {'idToken': idToken, 'email': account.email, 'providerId': account.id, 'displayName': account.displayName};
    }
    return {'idToken': null, 'email': null, 'providerId': null, 'displayName': null, 'errorCode': errCode, 'errorMessage': errMsg};
  }

  static Future<void> signOutAndReset() async {
    try {
      final c = _singleton;
      if (c != null) {
        await c.signOut();
        await c.disconnect();
      } else {
        // no-op
      }
    } catch (_) {}
  }
}
