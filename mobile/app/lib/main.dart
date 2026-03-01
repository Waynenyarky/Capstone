import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/core/theme/app_theme.dart';
import 'package:app/core/theme/bizclear_colors.dart';
import 'package:app/presentation/screens/login_page.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/presentation/screens/profile.dart';
import 'package:app/presentation/screens/deletion_scheduled_page.dart';
import 'package:app/presentation/screens/inspector/inspector_shell.dart';

import 'package:app/presentation/widgets/session_timeout_manager.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// #region agent log
void _debugLog(String location, String message, Map<String, dynamic> data) {
  final payload = jsonEncode({
    'sessionId': 'b7ddfc',
    'location': location,
    'message': message,
    'data': data,
    'timestamp': DateTime.now().millisecondsSinceEpoch,
    'hypothesisId': 'primary-button-font',
  });
  http
      .post(
        Uri.parse('http://127.0.0.1:7275/ingest/739c2c06-95db-4955-a5f6-1b0d34de3f84'),
        headers: {'Content-Type': 'application/json', 'X-Debug-Session-Id': 'b7ddfc'},
        body: payload,
      )
      .catchError((_) {});
}
// #endregion

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
      // Theme: typography and button sizes from AppTheme (single place to change).
      theme: ThemeData(
        fontFamily: GoogleFonts.urbanist().fontFamily ?? AppTheme.appFontFamily,
        textTheme: AppTheme.buildTextTheme(
          GoogleFonts.urbanist().fontFamily ?? AppTheme.appFontFamily,
          BizClearColors.textPrimary,
          BizClearColors.textPrimary,
        ),
        colorScheme: const ColorScheme.light(
          primary: BizClearColors.webPrimary,
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
            backgroundColor: BizClearColors.webPrimary,
            foregroundColor: BizClearColors.buttonPrimaryFg,
            padding: AppTheme.primaryButtonPadding,
            minimumSize: AppTheme.primaryButtonMinimumSize,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            textStyle: () {
              final style = GoogleFonts.urbanist(
                fontSize: AppTheme.primaryButtonFontSize,
                fontWeight: FontWeight.w600,
              );
              _debugLog('main.dart:elevatedButtonTheme', 'button textStyle', {'fontFamily': style.fontFamily, 'fontSize': style.fontSize});
              return style;
            }(),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: BizClearColors.webPrimary,
            foregroundColor: BizClearColors.buttonPrimaryFg,
            padding: AppTheme.primaryButtonPadding,
            minimumSize: AppTheme.primaryButtonMinimumSize,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            textStyle: GoogleFonts.urbanist(
              fontSize: AppTheme.primaryButtonFontSize,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: BizClearColors.linkColor,
            padding: AppTheme.textButtonPadding,
            minimumSize: AppTheme.textButtonMinimumSize,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: BizClearColors.accent,
            side: const BorderSide(color: BizClearColors.border),
            padding: AppTheme.outlinedButtonPadding,
            minimumSize: AppTheme.outlinedButtonMinimumSize,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
          contentPadding: AppTheme.inputFieldContentPadding,
        ),
      ),
      builder: (context, child) {
        // Mobile: default 90 days so inspectors aren't logged out while in the field
        final ttlDaysStr = dotenv.env['SESSION_TTL_DAYS'];
        final ttlMinStr = dotenv.env['SESSION_TTL_MINUTES'];
        final Duration duration = ttlDaysStr != null && ttlDaysStr.isNotEmpty
            ? Duration(days: int.tryParse(ttlDaysStr) ?? 90)
            : Duration(minutes: int.tryParse(ttlMinStr ?? '') ?? 90 * 24 * 60); // default 90 days in minutes
        return SessionTimeoutManager(
          navigatorKey: navigatorKey,
          duration: duration,
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
      
      String preAuthEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
      if (preAuthEmail.isEmpty) preAuthEmail = email;
      bool preAuthenticatorEnabled = false;
      if (preAuthEmail.isNotEmpty) {
        try {
          final detail = await MongoDBService.getMfaStatusDetail(email: preAuthEmail).timeout(const Duration(seconds: 5));
          final enabledMfa = detail['success'] == true && detail['enabled'] == true;
          final method = (detail['method'] ?? '').toString().toLowerCase();
          if (enabledMfa && (method.contains('authenticator') || method.contains('totp') || method.contains('otp'))) {
            preAuthenticatorEnabled = true;
          }
        } catch (_) {}
      }
      if (email.isEmpty || token.isEmpty) {
        return {
          'screen': 'login',
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      }
      final profile = await MongoDBService.fetchProfile(email: email, token: token).timeout(const Duration(seconds: 3));
      try {
        final detailSelf = await MongoDBService.getMfaStatusDetail(email: email).timeout(const Duration(seconds: 2));
        final enabledSelfMfa = detailSelf['success'] == true && detailSelf['enabled'] == true;
        final methodSelf = (detailSelf['method'] ?? '').toString().toLowerCase();
        if (enabledSelfMfa && (methodSelf.contains('authenticator') || methodSelf.contains('totp') || methodSelf.contains('otp'))) {
          preAuthenticatorEnabled = true;
        }
      } catch (_) {}
      if (profile['success'] != true) {
        if (profile['statusCode'] == 401) {
           await prefs.remove('accessToken');
           await prefs.remove('loggedInEmail');
           return {
              'screen': 'login',
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
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      }
      final user = (profile['user'] is Map<String, dynamic>) ? (profile['user'] as Map<String, dynamic>) : <String, dynamic>{};
      final role = (user['role'] is String) ? (user['role'] as String).toLowerCase() : '';
      if (role != 'inspector') {
        await prefs.remove('accessToken');
        await prefs.remove('loggedInEmail');
        await prefs.remove('cachedFirstName');
        await prefs.remove('cachedLastName');
        await prefs.remove('cachedPhoneNumber');
        return {
          'screen': 'login',
          'notInspector': true,
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
        'preAuthenticatorEnabled': preAuthenticatorEnabled,
      };
    } catch (_) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final email = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
        bool preAuthenticatorEnabled = false;
        try {
          final keyEnabled = 'auth_cache_enabled_$email';
          final keyTs = 'mfa_cache_ts_$email';
          final enabledCached = prefs.getBool(keyEnabled) ?? false;
          final tsCached = prefs.getInt(keyTs) ?? 0;
          final ageMs = DateTime.now().millisecondsSinceEpoch - tsCached;
          if (enabledCached && ageMs < 7 * 24 * 60 * 60 * 1000) {
            preAuthenticatorEnabled = true;
          }
        } catch (_) {}
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
          'preAuthenticatorEnabled': preAuthenticatorEnabled,
        };
      } catch (_) {
        return {'screen': 'login', 'preAuthenticatorEnabled': false};
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
          preAuthenticatorEnabled: (data['preAuthenticatorEnabled'] ?? false) == true,
          notInspector: (data['notInspector'] ?? false) == true,
        );
      },
    );
  }
}
