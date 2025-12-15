// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app/main.dart';

void main() {
  testWidgets('App loads login screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    // Pump the app
    await tester.pumpWidget(const MyApp());
    // Avoid hanging: pump a few short frames until the login text appears
    for (var i = 0; i < 20; i++) {
      if (find.text('Welcome Back').evaluate().isNotEmpty) break;
      await tester.pump(const Duration(milliseconds: 200));
    }

    // Expect the login title is visible
    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('Login to your account'), findsOneWidget);

    // Smoke check: screen rendered without throwing
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
