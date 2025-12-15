import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:app/presentation/screens/login_page.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:app/presentation/screens/profile.dart';
import 'package:app/presentation/screens/deletion_scheduled_page.dart';

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
      title: 'Auth Demo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: const ColorScheme.light(
          primary: Colors.black,
          onPrimary: Colors.white,
          secondary: Colors.black,
          onSecondary: Colors.white,
          surface: Colors.white,
          onSurface: Colors.black,
          error: Colors.red,
          onError: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: Colors.black,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.black,
            side: const BorderSide(color: Colors.black),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
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
  Future<Map<String, dynamic>> _prepare() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final email = (prefs.getString('loggedInEmail') ?? '').trim().toLowerCase();
      String preFpEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
      if (preFpEmail.isEmpty) {
        preFpEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
      }
      bool preFpEnabled = false;
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
      final profile = await MongoDBService.fetchProfile(email: email).timeout(const Duration(seconds: 3));
      if (profile['success'] != true) {
        return {
          'screen': 'profile',
          'email': email,
          'firstName': '',
          'lastName': '',
          'phoneNumber': '',
          'avatarUrl': '',
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
        };
      }
      final user = (profile['user'] is Map<String, dynamic>) ? (profile['user'] as Map<String, dynamic>) : <String, dynamic>{};
      final pending = profile['deletionPending'] == true;
      final scheduledISO = (profile['deletionScheduledFor'] is String) ? profile['deletionScheduledFor'] as String : null;
      final firstName = (user['firstName'] is String) ? user['firstName'] as String : '';
      final lastName = (user['lastName'] is String) ? user['lastName'] as String : '';
      final phoneNumber = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : '';
      if (pending && scheduledISO != null) {
        return {
          'screen': 'deletion',
          'email': email,
          'scheduledISO': scheduledISO,
          'firstName': firstName,
          'lastName': lastName,
          'phoneNumber': phoneNumber,
          'avatarUrl': '',
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
        };
      }
      return {
        'screen': 'profile',
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
        'avatarUrl': '',
        'preFpEnabled': preFpEnabled,
        'preFpEmail': preFpEmail,
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
        return {
          'screen': 'profile',
          'email': email,
          'firstName': '',
          'lastName': '',
          'phoneNumber': '',
          'avatarUrl': '',
          'preFpEnabled': preFpEnabled,
          'preFpEmail': preFpEmail,
        };
      } catch (_) {
        return {'screen': 'login', 'preFpEnabled': false, 'preFpEmail': ''};
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _prepare(),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final data = snap.data ?? const {'screen': 'login'};
        final screen = (data['screen'] ?? 'login').toString();
        if (screen == 'profile') {
          return ProfilePage(
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
        );
      },
    );
  }
}
