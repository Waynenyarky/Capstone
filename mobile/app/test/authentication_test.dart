import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import 'package:app/main.dart';
import 'package:app/lib/presentation/screens/login_page.dart';
import 'package:app/lib/data/services/mongodb_service.dart';
import 'package:app/lib/data/services/google_auth_service.dart';

// Generate mocks
@GenerateMocks([MongoDBService, GoogleAuthService])
import 'authentication_test.mocks.dart';

void main() {
  group('Mobile Authentication Tests', () {
    late MockMongoDBService mockMongoDBService;
    late MockGoogleAuthService mockGoogleAuthService;

    setUp(() {
      // Reset shared preferences before each test
      SharedPreferences.setMockInitialValues({});
      
      // Initialize mocks
      mockMongoDBService = MockMongoDBService();
      mockGoogleAuthService = MockGoogleAuthService();
    });

    group('Login Flow Tests', () {
      testWidgets('Email/password login - success', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({});
        
        // Mock successful login response
        when(mockMongoDBService.loginUser(
          email: anyNamed('email'),
          password: anyNamed('password')
        )).thenAnswer((_) async => {
          return {
            'success': true,
            'token': 'mock_token_12345',
            'user': {
              'id': 'user_123',
              'email': 'test@example.com',
              'name': 'Test User'
            }
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        
        // Wait for login screen to load
        await tester.pumpAndSettle();
        
        // Find email and password fields
        final emailField = find.byKey(const Key('email_field'));
        final passwordField = find.byKey(const Key('password_field'));
        final loginButton = find.byKey(const Key('login_button'));

        // Enter credentials
        await tester.enterText(emailField, 'test@example.com');
        await tester.enterText(passwordField, 'password123');
        await tester.pump();

        // Tap login button
        await tester.tap(loginButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Welcome Test User'), findsOneWidget);
        verify(mockMongoDBService.loginUser(
          email: 'test@example.com',
          password: 'password123'
        )).called(1);
      });

      testWidgets('Email/password login - invalid credentials', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({});
        
        // Mock failed login response
        when(mockMongoDBService.loginUser(
          email: anyNamed('email'),
          password: anyNamed('password')
        )).thenAnswer((_) async => {
          return {
            'success': false,
            'error': 'Invalid credentials'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final emailField = find.byKey(const Key('email_field'));
        final passwordField = find.byKey(const Key('password_field'));
        final loginButton = find.byKey(const Key('login_button'));

        await tester.enterText(emailField, 'test@example.com');
        await tester.enterText(passwordField, 'wrongpassword');
        await tester.pump();

        await tester.tap(loginButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Invalid credentials'), findsOneWidget);
        expect(find.byKey(const Key('email_field')), findsOneWidget); // Still on login screen
      });

      testWidgets('Email/password login - network error', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({});
        
        // Mock network error
        when(mockMongoDBService.loginUser(
          email: anyNamed('email'),
          password: anyNamed('password')
        )).thenThrow(Exception('Network error'));

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final emailField = find.byKey(const Key('email_field'));
        final passwordField = find.byKey(const Key('password_field'));
        final loginButton = find.byKey(const Key('login_button'));

        await tester.enterText(emailField, 'test@example.com');
        await tester.enterText(passwordField, 'password123');
        await tester.pump();

        await tester.tap(loginButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Network error occurred'), findsOneWidget);
      });

      testWidgets('Remember me functionality', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({});
        
        when(mockMongoDBService.loginUser(
          email: anyNamed('email'),
          password: anyNamed('password')
        )).thenAnswer((_) async => {
          return {
            'success': true,
            'token': 'mock_token_12345',
            'user': {
              'id': 'user_123',
              'email': 'test@example.com',
              'name': 'Test User'
            }
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final emailField = find.byKey(const Key('email_field'));
        final passwordField = find.byKey(const Key('password_field'));
        final rememberMeCheckbox = find.byKey(const Key('remember_me_checkbox'));
        final loginButton = find.byKey(const Key('login_button'));

        await tester.enterText(emailField, 'test@example.com');
        await tester.enterText(passwordField, 'password123');
        
        // Check remember me
        await tester.tap(rememberMeCheckbox);
        await tester.pump();

        await tester.tap(loginButton);
        await tester.pumpAndSettle();

        // Assert - Check that credentials are saved
        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('saved_email'), 'test@example.com');
        expect(prefs.getBool('remember_me'), true);
      });
    });

    group('Passkey Authentication Tests', () {
      testWidgets('Passkey login - success', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({});
        
        when(mockGoogleAuthService.signInWithPasskey()).thenAnswer((_) async {
          return {
            'success': true,
            'token': 'passkey_token_12345',
            'user': {
              'id': 'user_456',
              'email': 'passkey@example.com',
              'name': 'Passkey User'
            }
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final passkeyButton = find.byKey(const Key('passkey_button'));
        
        await tester.tap(passkeyButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Welcome Passkey User'), findsOneWidget);
        verify(mockGoogleAuthService.signInWithPasskey()).called(1);
      });

      testWidgets('Passkey login - cancelled', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({});
        
        when(mockGoogleAuthService.signInWithPasskey()).thenAnswer((_) async {
          return {
            'success': false,
            'error': 'Passkey authentication cancelled'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final passkeyButton = find.byKey(const Key('passkey_button'));
        
        await tester.tap(passkeyButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Passkey authentication cancelled'), findsOneWidget);
        expect(find.byKey(const Key('email_field')), findsOneWidget); // Still on login screen
      });
    });

    group('MFA Verification Tests', () {
      testWidgets('MFA verification - success', (WidgetTester tester) async {
        // Arrange - Simulate user that needs MFA
        SharedPreferences.setMockInitialValues({
          'pending_mfa': 'true',
          'mfa_token': 'mfa_token_123'
        });
        
        when(mockMongoDBService.verifyMfaCode(
          token: anyNamed('token'),
          code: anyNamed('code')
        )).thenAnswer((_) async {
          return {
            'success': true,
            'verified': true
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final mfaCodeField = find.byKey(const Key('mfa_code_field'));
        final verifyButton = find.byKey(const Key('verify_mfa_button'));

        await tester.enterText(mfaCodeField, '123456');
        await tester.pump();

        await tester.tap(verifyButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Authentication successful'), findsOneWidget);
        verify(mockMongoDBService.verifyMfaCode(
          token: 'mfa_token_123',
          code: '123456'
        )).called(1);
      });

      testWidgets('MFA verification - invalid code', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({
          'pending_mfa': 'true',
          'mfa_token': 'mfa_token_123'
        });
        
        when(mockMongoDBService.verifyMfaCode(
          token: anyNamed('token'),
          code: anyNamed('code')
        )).thenAnswer((_) async {
          return {
            'success': false,
            'error': 'Invalid verification code'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final mfaCodeField = find.byKey(const Key('mfa_code_field'));
        final verifyButton = find.byKey(const Key('verify_mfa_button'));

        await tester.enterText(mfaCodeField, '000000');
        await tester.pump();

        await tester.tap(verifyButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Invalid verification code'), findsOneWidget);
        expect(find.byKey(const Key('mfa_code_field')), findsOneWidget); // Still on MFA screen
      });

      testWidgets('MFA verification - resend code', (WidgetTester tester) async {
        // Arrange
        SharedPreferences.setMockInitialValues({
          'pending_mfa': 'true',
          'mfa_token': 'mfa_token_123'
        });
        
        when(mockMongoDBService.resendMfaCode(
          token: anyNamed('token')
        )).thenAnswer((_) async {
          return {
            'success': true,
            'message': 'Code resent successfully'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final resendButton = find.byKey(const Key('resend_mfa_button'));

        await tester.tap(resendButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Code resent successfully'), findsOneWidget);
        verify(mockMongoDBService.resendMfaCode(
          token: 'mfa_token_123'
        )).called(1);
      });
    });

    group('Form Validation Tests', () {
      testWidgets('Email validation', (WidgetTester tester) async {
        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final emailField = find.byKey(const Key('email_field'));
        final loginButton = find.byKey(const Key('login_button'));

        // Test invalid email formats
        await tester.enterText(emailField, 'invalid-email');
        await tester.pump();

        await tester.tap(loginButton);
        await tester.pump();

        // Assert
        expect(find.text('Please enter a valid email'), findsOneWidget);
      });

      testWidgets('Password validation', (WidgetTester tester) async {
        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final emailField = find.byKey(const Key('email_field'));
        final passwordField = find.byKey(const Key('password_field'));
        final loginButton = find.byKey(const Key('login_button'));

        await tester.enterText(emailField, 'test@example.com');
        await tester.enterText(passwordField, '123'); // Too short
        await tester.pump();

        await tester.tap(loginButton);
        await tester.pump();

        // Assert
        expect(find.text('Password must be at least 6 characters'), findsOneWidget);
      });

      testWidgets('Empty fields validation', (WidgetTester tester) async {
        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final loginButton = find.byKey(const Key('login_button'));

        await tester.tap(loginButton);
        await tester.pump();

        // Assert
        expect(find.text('Email is required'), findsOneWidget);
        expect(find.text('Password is required'), findsOneWidget);
      });
    });

    group('Navigation Tests', () {
      testWidgets('Forgot password navigation', (WidgetTester tester) async {
        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final forgotPasswordButton = find.byKey(const Key('forgot_password_button'));

        await tester.tap(forgotPasswordButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Reset Password'), findsOneWidget);
        expect(find.byKey(const Key('reset_password_form')), findsOneWidget);
      });

      testWidgets('Sign up navigation', (WidgetTester tester) async {
        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final signUpButton = find.byKey(const Key('sign_up_button'));

        await tester.tap(signUpButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create Account'), findsOneWidget);
        expect(find.byKey(const Key('sign_up_form')), findsOneWidget);
      });
    });
  });
}
