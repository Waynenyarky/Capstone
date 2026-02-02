import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/presentation/screens/login_page.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/presentation/screens/profile.dart';
import 'package:app/presentation/screens/deletion_scheduled_page.dart';
import 'package:app/presentation/screens/inspector/inspector_shell.dart';

import 'package:app/presentation/widgets/session_timeout_manager.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Auth Demo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: const ColorScheme.light(
          primary: BizClearColors.primary,
          onPrimary: BizClearColors.buttonPrimaryFg,
          secondary: BizClearColors.accent,
          onSecondary: Colors.white,
          surface: BizClearColors.surface,
          onSurface: BizClearColors.textPrimary,
          error: BizClearColors.error,
          onError: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: BizClearColors.background,
          foregroundColor: BizClearColors.textPrimary,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: BizClearColors.primary,
            foregroundColor: BizClearColors.buttonPrimaryFg,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: BizClearColors.primary,
            foregroundColor: BizClearColors.buttonPrimaryFg,
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: BizClearColors.linkColor,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: BizClearColors.accent,
            side: const BorderSide(color: BizClearColors.border),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: BizClearColors.inputBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: BizClearColors.inputFocusedBorder, width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      builder: (context, child) {
        // Default to 1 minute as requested for stricter security
        final ttlStr = dotenv.env['SESSION_TTL_MINUTES'] ?? '1';
        final ttlMin = int.tryParse(ttlStr) ?? 1;
        return SessionTimeoutManager(
          navigatorKey: navigatorKey,
          duration: Duration(minutes: ttlMin),
          child: child!,
        );
      },
      home: const AppRoot(),
    );
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});
  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  bool _likelyLoggedIn = false;
  String _earlyEmail = '';
  String _earlyFirstName = '';
  String _earlyLastName = '';
  String _earlyPhoneNumber = '';
  String _earlyAvatarUrl = '';

  @override
  void initState() {
    super.initState();
    () async {
      try {
        final prefs = await SharedPreferences.getInstance();
        final email = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
        
        // We defer session expiry checks to SessionTimeoutManager so the Modal can be shown.
        // Just load profile data here.

        final firstName = (prefs.getString('cachedFirstName') ?? '').trim();
        final lastName = (prefs.getString('cachedLastName') ?? '').trim();
        final phoneNumber = (prefs.getString('cachedPhoneNumber') ?? '').trim();
        var avatar = (prefs.getString('avatar_url_$email') ?? '').trim();
        if (avatar.isEmpty) {
           avatar = (prefs.getString('lastAvatarUrl') ?? '').trim();
        }

        if (mounted) {
          setState(() {
            _likelyLoggedIn = email.isNotEmpty;
            _earlyEmail = email;
            _earlyFirstName = firstName;
            _earlyLastName = lastName;
            _earlyPhoneNumber = phoneNumber;
            _earlyAvatarUrl = avatar;
          });
        }
      } catch (_) {}
    }();
  }
  Future<Map<String, dynamic>> _prepare() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload();
      final email = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
      final token = (prefs.getString('accessToken') ?? '').trim();
      
      // Let SessionTimeoutManager handle expiry dialogs.
      // We just check if we have a user.
      
      String preFpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
      if (preFpEmail.isEmpty) {
        preFpEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
      }
      bool preFpEnabled = false;
      bool preFaceEnabled = false;
      bool preAuthenticatorEnabled = false;
      if (preFpEmail.isNotEmpty) {
        try {
          final detail = await MongoDBService.getMfaStatusDetail(email: preFpEmail).timeout(const Duration(seconds: 5));
          preFpEnabled = detail['success'] == true && detail['isFingerprintEnabled'] == true;
          final enabledMfa = detail['success'] == true && detail['enabled'] == true;
          final method = (detail['method'] ?? '').toString().toLowerCase();
          if (enabledMfa) {
            if (method.contains('face')) preFaceEnabled = true;
            if (method.contains('authenticator')) preAuthenticatorEnabled = true;
          }
        } catch (_) {}
      }
      if (email.isEmpty || token.isEmpty) {
        return {
          'screen': 'login',
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
          'preFaceEnabled': preFaceEnabled,
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      }
      final profile = await MongoDBService.fetchProfile(email: email, token: token).timeout(const Duration(seconds: 3));
      try {
        final detailSelf = await MongoDBService.getMfaStatusDetail(email: email).timeout(const Duration(seconds: 2));
        final selfEnabled = detailSelf['success'] == true && detailSelf['isFingerprintEnabled'] == true;
        preFpEnabled = preFpEnabled || selfEnabled;
        final enabledSelfMfa = detailSelf['success'] == true && detailSelf['enabled'] == true;
        final methodSelf = (detailSelf['method'] ?? '').toString().toLowerCase();
        if (enabledSelfMfa) {
          if (methodSelf.contains('face')) preFaceEnabled = true;
          if (methodSelf.contains('authenticator')) preAuthenticatorEnabled = true;
        }
        try {
          final keyEnabled = 'fp_cache_enabled_$email';
          final keyTs = 'fp_cache_ts_$email';
          await prefs.setBool(keyEnabled, selfEnabled);
          await prefs.setInt(keyTs, DateTime.now().millisecondsSinceEpoch);
          if (selfEnabled) {
            await prefs.setString('fingerprintEmail', email);
          }
        } catch (_) {}
      } catch (_) {}
      if (profile['success'] != true) {
        if (profile['statusCode'] == 401) {
           await prefs.remove('accessToken');
           await prefs.remove('loggedInEmail');
           return {
              'screen': 'login',
              'preFpEnabled': preFpEnabled,
              'preFpEmail': preFpEmail,
              'preFaceEnabled': preFaceEnabled,
              'preAuthenticatorEnabled': preAuthenticatorEnabled,
           };
        }
        final cachedFirstName = (prefs.getString('cachedFirstName') ?? '').trim();
        final cachedLastName = (prefs.getString('cachedLastName') ?? '').trim();
        final cachedPhoneNumber = (prefs.getString('cachedPhoneNumber') ?? '').trim();
        return {
          'screen': 'profile',
          'email': email,
          'firstName': cachedFirstName,
          'lastName': cachedLastName,
          'phoneNumber': cachedPhoneNumber,
          'avatarUrl': '',
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
          'preFaceEnabled': preFaceEnabled,
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      }
      final user = (profile['user'] is Map<String, dynamic>) ? (profile['user'] as Map<String, dynamic>) : <String, dynamic>{};
      final role = (user['role'] is String) ? (user['role'] as String).toLowerCase() : '';
      // Mobile app is Inspector-only: reject non-Inspector users
      if (role != 'inspector') {
        await prefs.remove('accessToken');
        await prefs.remove('loggedInEmail');
        await prefs.remove('cachedFirstName');
        await prefs.remove('cachedLastName');
        await prefs.remove('cachedPhoneNumber');
        return {
          'screen': 'login',
          'notInspector': true,
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
          'preFaceEnabled': preFaceEnabled,
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      }
      final pending = profile['deletionPending'] == true;
      final scheduledISO = (profile['deletionScheduledFor'] is String) ? profile['deletionScheduledFor'] as String : null;
      final firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
      final lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
      final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
      final fetchedAvatarUrl = (user['avatarUrl'] is String) ? (user['avatarUrl'] as String) : '';
      var cachedAvatarUrl = (prefs.getString('avatar_url_$email') ?? '').trim();
      if (cachedAvatarUrl.isEmpty) {
        cachedAvatarUrl = (prefs.getString('lastAvatarUrl') ?? '').trim();
      }
      final effectiveAvatar = fetchedAvatarUrl.isNotEmpty ? fetchedAvatarUrl : cachedAvatarUrl;
      if (pending && scheduledISO != null) {
        return {
          'screen': 'deletion',
          'email': email,
          'scheduledISO': scheduledISO,
          'firstName': firstName,
          'lastName': lastName,
          'phoneNumber': phoneNumber,
          'avatarUrl': effectiveAvatar,
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
          'preFaceEnabled': preFaceEnabled,
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      }
      return {
        'screen': 'profile',
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
        'avatarUrl': effectiveAvatar,
        'preFpEnabled': preFpEnabled,
        'preFpEmail': preFpEmail,
        'preFaceEnabled': preFaceEnabled,
        'preAuthenticatorEnabled': preAuthenticatorEnabled,
      };
    } catch (_) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final email = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
        String preFpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
        if (preFpEmail.isEmpty) {
          preFpEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
        }
        bool preFpEnabled = false;
        bool preFaceEnabled = false;
        bool preAuthenticatorEnabled = false;
        if (preFpEmail.isNotEmpty) {
          try {
            final keyEnabled = 'fp_cache_enabled_$preFpEmail';
            final keyTs = 'fp_cache_ts_$preFpEmail';
            final enabledCached = prefs.getBool(keyEnabled) ?? false;
            final tsCached = prefs.getInt(keyTs) ?? 0;
            final ageMs = DateTime.now().millisecondsSinceEpoch - tsCached;
            if (enabledCached && ageMs < 7 * 24 * 60 * 60 * 1000) {
              preFpEnabled = true;
            }
          } catch (_) {}
        }
        if (email.isEmpty) return {'screen': 'login'};
        var cachedAvatarUrl = (prefs.getString('avatar_url_$email') ?? '').trim();
        if (cachedAvatarUrl.isEmpty) {
          cachedAvatarUrl = (prefs.getString('lastAvatarUrl') ?? '').trim();
        }
        final cachedFirstName = (prefs.getString('cachedFirstName') ?? '').trim();
        final cachedLastName = (prefs.getString('cachedLastName') ?? '').trim();
        final cachedPhoneNumber = (prefs.getString('cachedPhoneNumber') ?? '').trim();
        return {
          'screen': 'profile',
          'email': email,
          'firstName': cachedFirstName,
          'lastName': cachedLastName,
          'phoneNumber': cachedPhoneNumber,
          'avatarUrl': cachedAvatarUrl,
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
          'preFaceEnabled': preFaceEnabled,
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      } catch (_) {
        return {'screen': 'login', 'preFpEnabled': false, 'preFpEmail': '', 'preFaceEnabled': false, 'preAuthenticatorEnabled': false};
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _prepare(),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          if (_likelyLoggedIn) {
            return InspectorShell(
              email: _earlyEmail,
              firstName: _earlyFirstName,
              lastName: _earlyLastName,
              phoneNumber: _earlyPhoneNumber,
              token: '',
              avatarUrl: _earlyAvatarUrl,
            );
          }
          return const LoginScreen();
        }
        final data = snap.data ?? const {'screen': 'login'};
        final screen = (data['screen'] ?? 'login').toString();
        if (screen == 'profile') {
          return InspectorShell(
            email: (data['email'] ?? '').toString(),
            firstName: (data['firstName'] ?? '').toString(),
            lastName: (data['lastName'] ?? '').toString(),
            phoneNumber: (data['phoneNumber'] ?? '').toString(),
            token: '',
            avatarUrl: (data['avatarUrl'] ?? '').toString(),
          );
        }
        if (screen == 'deletion') {
          return DeletionScheduledPage(
            email: (data['email'] ?? '').toString(),
            scheduledISO: (data['scheduledISO'] ?? '').toString(),
            firstName: (data['firstName'] ?? '').toString(),
            lastName: (data['lastName'] ?? '').toString(),
            phoneNumber: (data['phoneNumber'] ?? '').toString(),
            token: '',
            avatarUrl: (data['avatarUrl'] ?? '').toString(),
          );
        }
        return LoginScreen(
          preFingerprintEnabled: (data['preFpEnabled'] ?? false) == true,
          preFingerprintEmail: (data['preFpEmail'] ?? '').toString(),
          preFaceEnabled: (data['preFaceEnabled'] ?? false) == true,
          preAuthenticatorEnabled: (data['preAuthenticatorEnabled'] ?? false) == true,
          notInspector: (data['notInspector'] ?? false) == true,
        );
      },
    );
  }
}
