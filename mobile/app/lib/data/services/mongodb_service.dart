import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class MongoDBService {
    static final String baseUrl = dotenv.env['BASE_URL'] ?? 'http://localhost:3000';

  static List<String> _candidateBaseUrls() {
    final urls = <String>[];
    final primary = baseUrl;
    urls.add(primary);
    try {
      final u = Uri.parse(primary);
      final host = u.host.toLowerCase();
      final port = (u.hasPort ? u.port : (u.scheme == 'https' ? 443 : 80));
      final altPort = port == 3000 ? 5001 : 5001;
      urls.add(Uri(scheme: u.scheme, host: u.host, port: altPort).toString());
      if (host == 'localhost' || host == '127.0.0.1') {
        urls.add(Uri(scheme: u.scheme, host: '10.0.2.2', port: port).toString());
        urls.add(Uri(scheme: u.scheme, host: '10.0.2.2', port: altPort).toString());
      }
    } catch (_) {}
    final seen = <String>{};
    final out = <String>[];
    for (final x in urls) {
      if (!seen.contains(x)) {
        seen.add(x);
        out.add(x);
      }
    }
    return out;
  }

  static Future<http.Response> _postJsonWithFallback(String path, Map<String, dynamic> body, {Duration timeout = const Duration(seconds: 12)}) async {
    final candidates = _candidateBaseUrls();
    final payload = json.encode(body);
    for (final origin in candidates) {
      final uri = Uri.parse('$origin$path');
      try {
        final res = await http
            .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: payload,
        )
            .timeout(timeout);
        return res;
      } on TimeoutException catch (_) {
        continue;
      } on SocketException catch (_) {
        continue;
      } catch (_) {
        continue;
      }
    }
    throw TimeoutException('All endpoints unreachable for $path');
  }


  static Future<Map<String, dynamic>> signUp({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      debugPrint('Posting to: $baseUrl/api/auth/signup');
      final body = {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
        'confirmPassword': confirmPassword,
        'termsAccepted': true,
        'role': 'user',
      };

      debugPrint('Sending signup request: $body');

      final response = await _postJsonWithFallback('/api/auth/signup', body);

      debugPrint('Signup response status: ${response.statusCode}');
      debugPrint('Signup response body: ${response.body}');

      final data = json.decode(response.body);
      if (response.statusCode == 201) {
        final user = data is Map<String, dynamic>
            ? (data['user'] ?? data)
            : data;
        return {
          'success': true,
          'message': 'Signup successful',
          'user': user,
        };
      } else {
        final msg = () {
          try {
            final m = (data is Map && data['error'] is Map)
                ? data['error']['message']
                : null;
            return m ?? (data is Map ? data['message'] : null);
          } catch (_) {
            return null;
          }
        }();
        return {
          'success': false,
          'message': msg ?? 'Signup failed',
        };
      }
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
    } catch (e) {
      debugPrint('Signup error: $e');
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
      debugPrint('Posting to: $baseUrl/api/auth/login');
      final body = {
        'email': email,
        'password': password,
      };

      debugPrint('Sending login request: $body');

      final response = await _postJsonWithFallback('/api/auth/login', body);

      debugPrint('Login response status: ${response.statusCode}');
      debugPrint('Login response body: ${response.body}');

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        final user = data;
        return {
          'success': true,
          'message': 'Login successful',
          'user': user,
          'token': null,
        };
      } else {
        final msg = () {
          try {
            final m = (data is Map && data['error'] is Map)
                ? data['error']['message']
                : null;
            return m ?? (data is Map ? data['message'] : null);
          } catch (_) {
            return null;
          }
        }();
        return {
          'success': false,
          'message': msg ?? 'Login failed',
        };
      }
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timeout. Check network and server availability.',
      };
    } catch (e) {
      debugPrint('Login error: $e');
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> updateProfile({
    required String email,
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
          .patch(
        Uri.parse('$baseUrl/api/auth/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-user-email': email,
        },
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));
      final ct = (response.headers['content-type'] ?? '').toLowerCase();
      final bool isJson = ct.contains('application/json');
      final dynamic parsed = isJson ? json.decode(response.body) : null;
      final Map<String, dynamic> data = (parsed is Map<String, dynamic>) ? parsed : <String, dynamic>{};
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': (data['message'] ?? (data['updated'] == true ? 'Profile updated' : 'Success')).toString(),
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? (
            isJson
              ? 'Update failed'
              : (response.statusCode == 401
                  ? 'Unauthorized: invalid or expired token'
                  : 'Server returned non-JSON (status ${response.statusCode})')
          ),
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
    required String email,
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
          .post(
        Uri.parse('$baseUrl/api/auth/change-password-authenticated'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-user-email': email,
        },
        body: json.encode(body),
      )
          .timeout(const Duration(seconds: 12));
      final ct = (response.headers['content-type'] ?? '').toLowerCase();
      final bool isJson = ct.contains('application/json');
      final dynamic parsed = isJson ? json.decode(response.body) : null;
      final Map<String, dynamic> data = (parsed is Map<String, dynamic>) ? parsed : <String, dynamic>{};
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': (data['message'] ?? 'Password updated successfully').toString(),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? (
            isJson
              ? 'Password update failed'
              : (response.statusCode == 401
                  ? 'Unauthorized: invalid or expired token'
                  : 'Server returned non-JSON (status ${response.statusCode})')
          ),
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
    required String email,
    required String token,
    required String password,
  }) async {
    try {
      // Initiate delete: send code
      final sendRes = await http.post(
        Uri.parse('$baseUrl/api/auth/delete-account/send-code'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-user-email': email,
        },
        body: json.encode({'email': email}),
      ).timeout(const Duration(seconds: 12));

      final sendCt = (sendRes.headers['content-type'] ?? '').toLowerCase();
      final sendJson = sendCt.contains('application/json');
      final sendData = sendJson ? json.decode(sendRes.body) : {};
      if (sendRes.statusCode != 200 || sendData == null || sendData['sent'] != true) {
        return {
          'success': false,
          'message': (sendData is Map && sendData['message'] is String)
              ? sendData['message']
              : 'Failed to initiate delete request',
        };
      }

      // In development, devCode is provided; use it to verify
      final code = (sendData is Map && sendData['devCode'] is String) ? sendData['devCode'] as String : '';
      if (code.isEmpty) {
        return {
          'success': false,
          'message': 'Verification code sent to email. Please implement code entry to proceed.',
        };
      }

      final verifyRes = await http.post(
        Uri.parse('$baseUrl/api/auth/delete-account/verify-code'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode({'email': email, 'code': code}),
      ).timeout(const Duration(seconds: 12));
      final verifyCt = (verifyRes.headers['content-type'] ?? '').toLowerCase();
      final verifyJson = verifyCt.contains('application/json');
      final verifyData = verifyJson ? json.decode(verifyRes.body) : {};
      final deleteToken = (verifyData is Map && verifyData['deleteToken'] is String) ? verifyData['deleteToken'] as String : '';
      if (verifyRes.statusCode != 200 || deleteToken.isEmpty) {
        return {
          'success': false,
          'message': (verifyData is Map && verifyData['message'] is String)
              ? verifyData['message']
              : 'Failed to verify delete code',
        };
      }

      final confirmRes = await http.post(
        Uri.parse('$baseUrl/api/auth/delete-account/confirm'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode({'email': email, 'deleteToken': deleteToken}),
      ).timeout(const Duration(seconds: 12));
      final confirmCt = (confirmRes.headers['content-type'] ?? '').toLowerCase();
      final confirmJson = confirmCt.contains('application/json');
      final confirmData = confirmJson ? json.decode(confirmRes.body) : {};

      if (confirmRes.statusCode == 200) {
        return {
          'success': true,
          'message': 'Account deleted',
        };
      }

      return {
        'success': false,
        'message': (confirmData is Map && confirmData['message'] is String)
            ? confirmData['message']
            : 'Delete failed',
      };
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
