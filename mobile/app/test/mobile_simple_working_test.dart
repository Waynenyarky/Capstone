import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Test widget for state management
class TestStatefulWidget extends StatefulWidget {
  @override
  _TestStatefulWidgetState createState() => _TestStatefulWidgetState();
}

class _TestStatefulWidgetState extends State<TestStatefulWidget> {
  int _counter = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Text('Count: $_counter'),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _counter++;
              });
            },
            child: const Text('Increment'),
          ),
        ],
      ),
    );
  }
}

void main() {
  group('Mobile App Simple Working Tests', () {
    setUp(() {
      // Reset shared preferences before each test
      SharedPreferences.setMockInitialValues({});
    });

    testWidgets('MaterialApp renders without crashing', (WidgetTester tester) async {
      // Act - Create a simple MaterialApp
      await tester.pumpWidget(
        MaterialApp(
          title: 'Test App',
          home: Scaffold(
            appBar: AppBar(
              title: const Text('Test'),
            ),
            body: const Center(
              child: Text('Hello World'),
            ),
          ),
        ),
      );

      // Assert - Should render without crashing
      expect(find.byType(MaterialApp), findsOneWidget);
      expect(find.byType(Scaffold), findsOneWidget);
      expect(find.text('Hello World'), findsOneWidget);
    });

    testWidgets('Basic widgets render correctly', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                const Text('Title'),
                const Text('Subtitle'),
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Button'),
                ),
                const TextField(
                  decoration: InputDecoration(
                    labelText: 'Input',
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Title'), findsOneWidget);
      expect(find.text('Subtitle'), findsOneWidget);
      expect(find.text('Button'), findsOneWidget);
      expect(find.text('Input'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('Button interactions work', (WidgetTester tester) async {
      bool buttonPressed = false;

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {
                buttonPressed = true;
              },
              child: const Text('Press Me'),
            ),
          ),
        ),
      );

      // Tap the button
      await tester.tap(find.text('Press Me'));
      await tester.pump();

      // Assert
      expect(buttonPressed, isTrue);
    });

    testWidgets('Text input works', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: const TextField(
              decoration: InputDecoration(
                labelText: 'Test Input',
              ),
            ),
          ),
        ),
      );

      // Enter text
      await tester.enterText(find.byType(TextField), 'Hello Flutter');
      await tester.pump();

      // Assert
      expect(find.text('Hello Flutter'), findsOneWidget);
    });

    testWidgets('SharedPreferences mock works', (WidgetTester tester) async {
      // Arrange
      SharedPreferences.setMockInitialValues({
        'test_key': 'test_value',
        'number_key': 42,
      });

      // Act
      final prefs = await SharedPreferences.getInstance();
      final stringValue = prefs.getString('test_key');
      final intValue = prefs.getInt('number_key');

      // Assert
      expect(stringValue, equals('test_value'));
      expect(intValue, equals(42));
    });

    testWidgets('Theme configuration works', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
            textTheme: const TextTheme(
              bodyLarge: TextStyle(fontSize: 20),
            ),
          ),
          home: Scaffold(
            body: const Text('Themed Text'),
          ),
        ),
      );

      // Assert
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme?.colorScheme.primary, isNotNull);
      expect(materialApp.theme?.textTheme?.bodyLarge?.fontSize, equals(20));
    });

    testWidgets('Navigation works', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const Scaffold(
                          body: Text('Second Page'),
                        ),
                      ),
                    );
                  },
                  child: const Text('Navigate'),
                );
              },
            ),
          ),
        ),
      );

      // Navigate
      await tester.tap(find.text('Navigate'));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Second Page'), findsOneWidget);
    });

    testWidgets('List view works', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView(
              children: const [
                ListTile(title: Text('Item 1')),
                ListTile(title: Text('Item 2')),
                ListTile(title: Text('Item 3')),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
      expect(find.text('Item 3'), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('Form validation works', (WidgetTester tester) async {
      String? validationResult;
      GlobalKey<FormState> formKey = GlobalKey<FormState>();

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: Column(
                children: [
                  TextFormField(
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter some text';
                      }
                      return null;
                    },
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (formKey.currentState!.validate()) {
                        validationResult = 'valid';
                      } else {
                        validationResult = 'invalid';
                      }
                    },
                    child: const Text('Submit'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Submit without entering text
      await tester.tap(find.text('Submit'));
      await tester.pump();

      // Assert
      expect(validationResult, equals('invalid'));
      expect(find.text('Please enter some text'), findsOneWidget);

      // Enter text and submit
      await tester.enterText(find.byType(TextFormField), 'Some text');
      await tester.tap(find.text('Submit'));
      await tester.pump();

      // Assert
      expect(validationResult, equals('valid'));
      expect(find.text('Please enter some text'), findsNothing);
    });

    testWidgets('State management works', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: TestStatefulWidget(),
        ),
      );

      // Assert initial state
      expect(find.text('Count: 0'), findsOneWidget);

      // Increment counter
      await tester.tap(find.text('Increment'));
      await tester.pump();

      // Assert updated state
      expect(find.text('Count: 1'), findsOneWidget);
    });

    testWidgets('Error handling works', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    try {
                      throw Exception('Test error');
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Error handled')),
                      );
                    }
                  },
                  child: const Text('Trigger Error'),
                );
              },
            ),
          ),
        ),
      );

      // Trigger error
      await tester.tap(find.text('Trigger Error'));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Error handled'), findsOneWidget);
    });

    testWidgets('Async operations work', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FutureBuilder<String>(
              future: Future.delayed(
                const Duration(seconds: 1),
                () => 'Async Result',
              ),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircularProgressIndicator();
                } else if (snapshot.hasData) {
                  return Text(snapshot.data!);
                } else {
                  return const Text('Error');
                }
              },
            ),
          ),
        ),
      );

      // Assert loading state
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Wait for completion
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Assert result
      expect(find.text('Async Result'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });
  });
}
