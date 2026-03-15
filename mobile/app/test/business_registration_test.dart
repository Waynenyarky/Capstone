import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:image_picker/image_picker.dart';

import 'package:app/main.dart';
import 'package:app/lib/data/services/mongodb_service.dart';
import 'package:app/lib/presentation/screens/edit_profile_page.dart';

// Generate mocks
@GenerateMocks([MongoDBService, ImagePicker])
import 'business_registration_test.mocks.dart';

void main() {
  group('Business Registration Tests', () {
    late MockMongoDBService mockMongoDBService;
    late MockImagePicker mockImagePicker;

    setUp(() {
      // Reset shared preferences before each test
      SharedPreferences.setMockInitialValues({
        'user_token': 'mock_user_token',
        'user_id': 'user_123'
      });
      
      // Initialize mocks
      mockMongoDBService = MockMongoDBService();
      mockImagePicker = MockImagePicker();
    });

    group('Form Validation Tests', () {
      testWidgets('Business name validation', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        // Navigate to business registration (assuming user is logged in)
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        final submitButton = find.byKey(const Key('submit_business_button'));
        
        // Try to submit without business name
        await tester.tap(submitButton);
        await tester.pump();

        // Assert
        expect(find.text('Business name is required'), findsOneWidget);
      });

      testWidgets('Business type validation', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        final businessNameField = find.byKey(const Key('business_name_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pump();

        // Assert
        expect(find.text('Business type is required'), findsOneWidget);
      });

      testWidgets('Address validation', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        final businessNameField = find.byKey(const Key('business_name_field'));
        final businessTypeDropdown = find.byKey(const Key('business_type_dropdown'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.tap(businessTypeDropdown);
        await tester.pump();
        await tester.tap(find.text('Restaurant').first);
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pump();

        // Assert
        expect(find.text('Business address is required'), findsOneWidget);
      });

      testWidgets('Contact number validation', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill all fields except contact
        final businessNameField = find.byKey(const Key('business_name_field'));
        final businessTypeDropdown = find.byKey(const Key('business_type_dropdown'));
        final addressField = find.byKey(const Key('address_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.tap(businessTypeDropdown);
        await tester.pump();
        await tester.tap(find.text('Restaurant').first);
        await tester.pump();
        
        await tester.enterText(addressField, '123 Test Street');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pump();

        // Assert
        expect(find.text('Contact number is required'), findsOneWidget);
      });

      testWidgets('Invalid contact number format', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        final contactField = find.byKey(const Key('contact_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(contactField, 'invalid-number');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pump();

        // Assert
        expect(find.text('Please enter a valid contact number'), findsOneWidget);
      });
    });

    group('Document Upload Tests', () {
      testWidgets('Document upload simulation', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Mock successful image pick
        when(mockImagePicker.pickImage(
          source: anyNamed('source')
        )).thenAnswer((_) async {
          return XFile('/mock/path/to/document.jpg');
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        final uploadDocumentButton = find.byKey(const Key('upload_document_button'));

        await tester.tap(uploadDocumentButton);
        await tester.pump();

        // Simulate image selection
        final cameraOption = find.text('Camera');
        if (cameraOption.evaluate().isNotEmpty) {
          await tester.tap(cameraOption);
          await tester.pumpAndSettle();
        }

        // Assert
        expect(find.byKey(const Key('uploaded_document_preview')), findsOneWidget);
        expect(find.text('Document uploaded successfully'), findsOneWidget);
      });

      testWidgets('Document upload failure', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Mock failed image pick
        when(mockImagePicker.pickImage(
          source: anyNamed('source')
        )).thenAnswer((_) async {
          return null; // User cancelled
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        final uploadDocumentButton = find.byKey(const Key('upload_document_button'));

        await tester.tap(uploadDocumentButton);
        await tester.pump();

        // Simulate cancellation
        final cancelButton = find.text('Cancel');
        if (cancelButton.evaluate().isNotEmpty) {
          await tester.tap(cancelButton);
          await tester.pumpAndSettle();
        }

        // Assert
        expect(find.text('Document upload cancelled'), findsOneWidget);
        expect(find.byKey(const Key('uploaded_document_preview')), findsNothing);
      });

      testWidgets('Multiple document uploads', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Mock multiple successful image picks
        when(mockImagePicker.pickImage(
          source: anyNamed('source')
        )).thenAnswer((_) async {
          return XFile('/mock/path/to/document_${DateTime.now().millisecondsSinceEpoch}.jpg');
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Upload first document
        final uploadDocumentButton = find.byKey(const Key('upload_document_button'));
        await tester.tap(uploadDocumentButton);
        await tester.pump();
        
        final cameraOption = find.text('Camera');
        if (cameraOption.evaluate().isNotEmpty) {
          await tester.tap(cameraOption);
          await tester.pumpAndSettle();
        }

        // Upload second document
        await tester.tap(uploadDocumentButton);
        await tester.pump();
        
        if (cameraOption.evaluate().isNotEmpty) {
          await tester.tap(cameraOption);
          await tester.pumpAndSettle();
        }

        // Assert
        expect(find.byKey(const Key('uploaded_document_preview')), findsWidgets);
        expect(find.text('2 documents uploaded'), findsOneWidget);
      });
    });

    group('Progress Indicators Tests', () {
      testWidgets('Registration progress tracking', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Check initial progress
        expect(find.byKey(const Key('progress_indicator')), findsOneWidget);
        expect(find.text('Step 1 of 4: Basic Information'), findsOneWidget);
        
        // Fill basic info
        final businessNameField = find.byKey(const Key('business_name_field'));
        await tester.enterText(businessNameField, 'Test Business');
        await tester.pump();
        
        final nextButton = find.byKey(const Key('next_button'));
        await tester.tap(nextButton);
        await tester.pump();
        
        // Assert progress updated
        expect(find.text('Step 2 of 4: Business Details'), findsOneWidget);
      });

      testWidgets('Loading states during submission', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Mock slow submission
        when(mockMongoDBService.createBusiness(
          businessData: anyNamed('businessData')
        )).thenAnswer((_) async {
          // Simulate network delay
          await Future.delayed(const Duration(seconds: 2));
          return {
            'success': true,
            'business_id': 'business_123'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill all required fields and submit
        final businessNameField = find.byKey(const Key('business_name_field'));
        final businessTypeDropdown = find.byKey(const Key('business_type_dropdown'));
        final addressField = find.byKey(const Key('address_field'));
        final contactField = find.byKey(const Key('contact_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.tap(businessTypeDropdown);
        await tester.pump();
        await tester.tap(find.text('Restaurant').first);
        await tester.pump();
        
        await tester.enterText(addressField, '123 Test Street');
        await tester.enterText(contactField, '+1234567890');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pump();

        // Assert loading state
        expect(find.byKey(const Key('loading_indicator')), findsOneWidget);
        expect(find.text('Submitting registration...'), findsOneWidget);
        expect(submitButton, findsNothing); // Button disabled during loading
        
        // Wait for completion
        await tester.pumpAndSettle(const Duration(seconds: 3));
        
        // Assert success
        expect(find.text('Business registered successfully!'), findsOneWidget);
      });
    });

    group('Error Handling and Recovery Tests', () {
      testWidgets('Network error during submission', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Mock network error
        when(mockMongoDBService.createBusiness(
          businessData: anyNamed('businessData')
        )).thenThrow(Exception('Network connection failed'));

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill form and submit
        final businessNameField = find.byKey(const Key('business_name_field'));
        final businessTypeDropdown = find.byKey(const Key('business_type_dropdown'));
        final addressField = find.byKey(const Key('address_field'));
        final contactField = find.byKey(const Key('contact_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.tap(businessTypeDropdown);
        await tester.pump();
        await tester.tap(find.text('Restaurant').first);
        await tester.pump();
        
        await tester.enterText(addressField, '123 Test Street');
        await tester.enterText(contactField, '+1234567890');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pumpAndSettle();

        // Assert error handling
        expect(find.text('Network connection failed'), findsOneWidget);
        expect(find.byKey(const Key('retry_button')), findsOneWidget);
        expect(find.byKey(const Key('submit_business_button')), findsOneWidget); // Button re-enabled
      });

      testWidgets('Retry mechanism after error', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // First call fails, second succeeds
        when(mockMongoDBService.createBusiness(
          businessData: anyNamed('businessData')
        )).thenThrow(Exception('Server error')).thenAnswer((_) async {
          return {
            'success': true,
            'business_id': 'business_123'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill form and submit (first attempt fails)
        final businessNameField = find.byKey(const Key('business_name_field'));
        final businessTypeDropdown = find.byKey(const Key('business_type_dropdown'));
        final addressField = find.byKey(const Key('address_field'));
        final contactField = find.byKey(const Key('contact_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.tap(businessTypeDropdown);
        await tester.pump();
        await tester.tap(find.text('Restaurant').first);
        await tester.pump();
        
        await tester.enterText(addressField, '123 Test Street');
        await tester.enterText(contactField, '+1234567890');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pumpAndSettle();

        // Assert error shown
        expect(find.text('Server error'), findsOneWidget);
        
        // Retry
        final retryButton = find.byKey(const Key('retry_button'));
        await tester.tap(retryButton);
        await tester.pumpAndSettle();

        // Assert success on retry
        expect(find.text('Business registered successfully!'), findsOneWidget);
      });

      testWidgets('Form data preservation after error', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        when(mockMongoDBService.createBusiness(
          businessData: anyNamed('businessData')
        )).thenThrow(Exception('Validation error'));

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill form
        final businessNameField = find.byKey(const Key('business_name_field'));
        final businessTypeDropdown = find.byKey(const Key('business_type_dropdown'));
        final addressField = find.byKey(const Key('address_field'));
        final contactField = find.byKey(const Key('contact_field'));
        final submitButton = find.byKey(const Key('submit_business_button'));

        await tester.enterText(businessNameField, 'Test Business');
        await tester.tap(businessTypeDropdown);
        await tester.pump();
        await tester.tap(find.text('Restaurant').first);
        await tester.pump();
        
        await tester.enterText(addressField, '123 Test Street');
        await tester.enterText(contactField, '+1234567890');
        await tester.pump();

        await tester.tap(submitButton);
        await tester.pumpAndSettle();

        // Assert error shown but data preserved
        expect(find.text('Validation error'), findsOneWidget);
        expect(find.byKey(const Key('business_name_field')), findsOneWidget);
        expect(find.byValue('Test Business'), findsOneWidget);
        expect(find.byValue('123 Test Street'), findsOneWidget);
        expect(find.byValue('+1234567890'), findsOneWidget);
      });
    });

    group('State Management Tests', () {
      testWidgets('Form state persistence across steps', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill step 1
        final businessNameField = find.byKey(const Key('business_name_field'));
        await tester.enterText(businessNameField, 'Test Business');
        await tester.pump();
        
        // Navigate to step 2
        final nextButton = find.byKey(const Key('next_button'));
        await tester.tap(nextButton);
        await tester.pump();
        
        // Navigate back to step 1
        final backButton = find.byKey(const Key('back_button'));
        await tester.tap(backButton);
        await tester.pump();

        // Assert data preserved
        expect(find.byValue('Test Business'), findsOneWidget);
      });

      testWidgets('Form reset functionality', (WidgetTester tester) async {
        // Arrange
        when(mockMongoDBService.getCurrentUser()).thenAnswer((_) async {
          return {
            'id': 'user_123',
            'email': 'test@example.com',
            'name': 'Test User'
          };
        });

        // Act
        await tester.pumpWidget(const MyApp());
        await tester.pumpAndSettle();
        
        final addBusinessButton = find.byKey(const Key('add_business_button'));
        await tester.tap(addBusinessButton);
        await tester.pumpAndSettle();
        
        // Fill form
        final businessNameField = find.byKey(const Key('business_name_field'));
        final addressField = find.byKey(const Key('address_field'));
        
        await tester.enterText(businessNameField, 'Test Business');
        await tester.enterText(addressField, '123 Test Street');
        await tester.pump();
        
        // Reset form
        final resetButton = find.byKey(const Key('reset_button'));
        await tester.tap(resetButton);
        await tester.pump();

        // Assert form cleared
        expect(find.byValue('Test Business'), findsNothing);
        expect(find.byValue('123 Test Street'), findsNothing);
        expect(find.byKey(const Key('business_name_field')), findsOneWidget);
        expect(find.byKey(const Key('address_field')), findsOneWidget);
      });
    });
  });
}
