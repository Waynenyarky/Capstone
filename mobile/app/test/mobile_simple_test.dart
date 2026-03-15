import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app/main.dart';
import 'package:app/presentation/screens/login_page.dart';
import 'package:app/presentation/screens/deletion_scheduled_page.dart';
import 'package:app/presentation/screens/inspector/inspector_shell.dart';
import 'package:app/presentation/widgets/session_timeout_manager.dart';

void main() {
  group('Mobile App Tests - Simple Version', () {
    setUp(() {
      // Reset shared preferences before each test
      SharedPreferences.setMockInitialValues({});
    });

    testWidgets('App loads login screen', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      
      // Wait for app to initialize
      await tester.pumpAndSettle();

      // Assert - LoginScreen should be displayed
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('App shows loading state initially', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      
      // Assert - Should show loading state initially
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('App navigates to profile when logged in', (WidgetTester tester) async {
      // Arrange - Simulate logged in user
      SharedPreferences.setMockInitialValues({
        'loggedInEmail': 'test@example.com',
        'accessToken': 'mock_token',
        'cachedFirstName': 'Test',
        'cachedLastName': 'User',
        'cachedPhoneNumber': '+1234567890'
      });

      // Act
      await tester.pumpWidget(const MyApp());
      
      // Wait for initialization
      await tester.pumpAndSettle();

      // Assert - Should show InspectorShell (profile) for logged in user
      expect(find.byType(InspectorShell), findsOneWidget);
    });

    testWidgets('App handles deletion scheduled state', (WidgetTester tester) async {
      // Arrange - Simulate user with pending deletion
      SharedPreferences.setMockInitialValues({
        'loggedInEmail': 'test@example.com',
        'accessToken': 'mock_token',
        'deletionPending': 'true',
        'deletionScheduledFor': '2024-12-31T23:59:59Z'
      });

      // Act
      await tester.pumpWidget(const MyApp());
      
      // Wait for initialization
      await tester.pumpAndSettle();

      // Assert - Should show deletion scheduled page
      expect(find.byType(DeletionScheduledPage), findsOneWidget);
    });

    testWidgets('App handles session expiry gracefully', (WidgetTester tester) async {
      // Arrange - Simulate expired session
      SharedPreferences.setMockInitialValues({
        'loggedInEmail': 'test@example.com',
        'accessToken': 'expired_token'
      });

      // Act
      await tester.pumpWidget(const MyApp());
      
      // Wait for initialization and session check
      await tester.pumpAndSettle();

      // Assert - Should redirect back to login screen
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('App handles network errors gracefully', (WidgetTester tester) async {
      // Arrange - Simulate network issues by not providing proper setup
      SharedPreferences.setMockInitialValues({
        'loggedInEmail': 'test@example.com',
        'accessToken': 'valid_token'
      });

      // Act
      await tester.pumpWidget(const MyApp());
      
      // Wait for initialization (might timeout due to network)
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Assert - Should not crash and should show some UI
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('App theme is applied correctly', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();

      // Assert - Check if theme is applied by looking for themed widgets
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme?.primaryColor, isNotNull);
      expect(materialApp.theme?.textTheme, isNotNull);
    });

    testWidgets('SessionTimeoutManager is integrated', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();

      // Assert - SessionTimeoutManager should be part of the widget tree
      expect(find.byType(SessionTimeoutManager), findsOneWidget);
    });

    testWidgets('App handles empty SharedPreferences', (WidgetTester tester) async {
      // Arrange - Completely empty preferences
      SharedPreferences.setMockInitialValues({});

      // Act
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();

      // Assert - Should still load login screen without crashing
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('App handles corrupted SharedPreferences', (WidgetTester tester) async {
      // Arrange - Corrupted data scenario
      SharedPreferences.setMockInitialValues({
        'loggedInEmail': 'invalid@email',
        'accessToken': '',
        'cachedFirstName': '',
        'cachedLastName': ''
      });

      // Act
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();

      // Assert - Should handle gracefully and show login screen
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('App navigation key is properly set', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      
      // Assert - Check if navigator key is set
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.navigatorKey, isNotNull);
      expect(materialApp.navigatorKey, isA<GlobalKey<NavigatorState>>());
    });

    testWidgets('App debug banner is disabled', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      
      // Assert - Debug banner should be disabled
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.debugShowCheckedModeBanner, isFalse);
    });

    testWidgets('App title is set correctly', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(const MyApp());
      
      // Assert - App title should be set
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.title, equals('Auth Demo'));
    });

    testWidgets('App handles inspector role validation', (WidgetTester tester) async {
      // Arrange - Simulate non-inspector user
      SharedPreferences.setMockInitialValues({
        'loggedInEmail': 'noninspector@example.com',
        'accessToken': 'mock_token',
        'userRole': 'business_owner' // Non-inspector role
      });

      // Act
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();

      // Assert - Should redirect to login for non-inspector
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('App handles MFA pre-authentication detection', (WidgetTester tester) async {
      // Arrange - Simulate user with MFA enabled
      SharedPreferences.setMockInitialValues({
        'lastLoginEmail': 'mfa_user@example.com',
        'auth_cache_enabled_mfa_user@example.com': true,
        'mfa_cache_ts_mfa_user@example.com': DateTime.now().millisecondsSinceEpoch
      });

      // Act
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();

      // Assert - Should detect MFA and pass to LoginScreen
      final loginScreen = tester.widget<LoginScreen>(find.byType(LoginScreen));
      expect(loginScreen.preAuthenticatorEnabled, isTrue);
    });
  });
}
