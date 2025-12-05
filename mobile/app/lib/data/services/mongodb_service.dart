import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class MongoDBService {
  static final String baseUrl = dotenv.env['BASE_URL'] ?? 'http://localhost:3000';

  static Future<Map<String, dynamic>> signUp({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      print('Posting to: $baseUrl/api/auth/signup');
      final body = {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
        'confirmPassword': confirmPassword,
      };

      print('Sending signup request: $body');

      final response = await http
          .post(
        Uri.parse('$baseUrl/api/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));

      print('Signup response status: ${response.statusCode}');
      print('Signup response body: ${response.body}');

      final data = json.decode(response.body);
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
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
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
      print('Posting to: $baseUrl/api/auth/login');
      final body = {
        'email': email,
        'password': password,
      };

      print('Sending login request: $body');

      final response = await http
          .post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));

      print('Login response status: ${response.statusCode}');
      print('Login response body: ${response.body}');

      final data = json.decode(response.body);
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
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
    } catch (e) {
      print('Login error: $e');
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> updateProfile({
    required String token,
    required String firstName,
    required String lastName,
    required String phoneNumber,
  }) async {
    try {
      final body = {
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
      };
      final response = await http
          .put(
        Uri.parse('$baseUrl/api/user/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Profile updated',
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Update failed',
        };
      }
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> updatePassword({
    required String token,
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final body = {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      };
      final response = await http
          .put(
        Uri.parse('$baseUrl/api/user/password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Password updated successfully',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Password update failed',
        };
      }
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> deleteAccount({
    required String token,
    required String password,
  }) async {
    try {
      final body = {
        'password': password,
      };
      final response = await http
          .delete(
        Uri.parse('$baseUrl/api/user/account'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Account deleted',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Delete failed',
        };
      }
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }
}
