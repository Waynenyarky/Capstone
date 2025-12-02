import 'dart:convert';
import 'package:http/http.dart' as http;

class MongoDBService {
  // Ensure the baseUrl points to the correct backend server
  static const String baseUrl = 'http://192.168.1.38:5000'; // Update with your backend URL

  static Future<Map<String, dynamic>> signUp({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      final body = {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
        'confirmPassword': confirmPassword,
      };

      print('Sending signup request: $body');

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      print('Signup response status: ${response.statusCode}');
      print('Signup response body: ${response.body}');

      // Decode the response body
      final data = json.decode(response.body);

      // Check if the response status code indicates success
      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'Signup successful',
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Signup failed',
        };
      }
    } catch (e) {
      print('Signup error: $e');
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final body = {
        'email': email,
        'password': password,
      };

      print('Sending login request: $body');

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      print('Login response status: ${response.statusCode}');
      print('Login response body: ${response.body}');

      // Decode the response body
      final data = json.decode(response.body);

      // Check if the response status code indicates success
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Login successful',
          'user': data['user'],
          'token': data['token'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      print('Login error: $e');
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }
}