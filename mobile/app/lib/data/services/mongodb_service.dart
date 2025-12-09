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

  static Future<http.Response> _postJsonWithFallbackH(
    String path,
    Map<String, dynamic> body, {
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final candidates = _candidateBaseUrls();
    final payload = json.encode(body);
    final baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?headers,
    };
    for (final origin in candidates) {
      final uri = Uri.parse('$origin$path');
      try {
        final res = await http
            .post(
          uri,
          headers: baseHeaders,
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

  static Future<http.Response> _patchJsonWithFallbackH(
    String path,
    Map<String, dynamic> body, {
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final candidates = _candidateBaseUrls();
    final payload = json.encode(body);
    final baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?headers,
    };
    for (final origin in candidates) {
      final uri = Uri.parse('$origin$path');
      try {
        final res = await http
            .patch(
          uri,
          headers: baseHeaders,
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
        'role': 'customer',
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

  static Future<Map<String, dynamic>> setFaceUnlockEnabled({
    required String email,
    required bool enabled,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/face/${enabled ? 'enable' : 'disable'}',
        { 'email': email },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'message': 'Face unlock ${enabled ? 'enabled' : 'disabled'}' };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Request failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<bool> getFaceUnlockStatus({ required String email }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/status',
        { 'email': email },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
        final flag = data['isFaceUnlockEnabled'];
        return flag is bool ? flag : false;
      }
      return false;
    } catch (_) {
      return false;
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
      final response = await _patchJsonWithFallbackH(
        '/api/auth/profile',
        body,
        headers: { 'x-user-email': email },
        timeout: const Duration(seconds: 12),
      );
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

  static Future<Map<String, dynamic>> updateEmail({
    required String email,
    required String password,
    required String newEmail,
  }) async {
    try {
      final body = {
        'password': password,
        'newEmail': newEmail,
      };
      final response = await _postJsonWithFallbackH(
        '/api/auth/change-email-authenticated',
        body,
        headers: { 'x-user-email': email },
        timeout: const Duration(seconds: 12),
      );
      final ct = (response.headers['content-type'] ?? '').toLowerCase();
      final bool isJson = ct.contains('application/json');
      final dynamic parsed = isJson ? json.decode(response.body) : null;
      final Map<String, dynamic> data = (parsed is Map<String, dynamic>) ? parsed : <String, dynamic>{};
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': (data['message'] ?? 'Email updated successfully').toString(),
          'email': data['email'] ?? newEmail,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? (
            isJson
              ? 'Email update failed'
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
      final hardRes = await _postJsonWithFallbackH(
        '/api/auth/delete-account/authenticated',
        { 'password': password },
        headers: { 'x-user-email': email },
      );
      final hardCt = (hardRes.headers['content-type'] ?? '').toLowerCase();
      final hardJson = hardCt.contains('application/json');
      final hardData = hardJson ? json.decode(hardRes.body) : {};
      if (hardRes.statusCode == 200 && (hardData is Map) && (hardData['deleted'] == true)) {
        return { 'success': true, 'message': 'Account deleted' };
      }
      if (hardRes.statusCode != 404) {
        final msg = (hardData is Map && hardData['message'] is String)
            ? hardData['message']
            : 'Delete failed';
        return { 'success': false, 'message': msg };
      }

      final loginRes = await _postJsonWithFallbackH('/api/auth/login', {
        'email': email,
        'password': password,
      }, headers: { 'x-user-email': email });
      final loginCt = (loginRes.headers['content-type'] ?? '').toLowerCase();
      final loginJson = loginCt.contains('application/json');
      final loginData = loginJson ? json.decode(loginRes.body) : {};
      if (loginRes.statusCode != 200) {
        final msg = (loginData is Map && loginData['message'] is String)
            ? loginData['message']
            : 'Invalid email or password';
        return { 'success': false, 'message': msg };
      }

      // Attempt to schedule deletion automatically in dev using verification shortcut
      final sendRes = await _postJsonWithFallbackH('/api/auth/delete-account/send-code', {
        'email': email,
      }, headers: { 'x-user-email': email });
      final sendCt = (sendRes.headers['content-type'] ?? '').toLowerCase();
      final sendJson = sendCt.contains('application/json');
      final sendData = sendJson ? json.decode(sendRes.body) : {};
      final devCode = (sendData is Map && sendData['devCode'] is String) ? sendData['devCode'] as String : '';

      if (sendRes.statusCode == 200 && devCode.isNotEmpty) {
        final verifyRes = await _postJsonWithFallbackH('/api/auth/delete-account/verify-code', {
          'email': email,
          'code': devCode,
        }, headers: { 'x-user-email': email });
        final verifyCt = (verifyRes.headers['content-type'] ?? '').toLowerCase();
        final verifyJson = verifyCt.contains('application/json');
        final verifyData = verifyJson ? json.decode(verifyRes.body) : {};
        final deleteToken = (verifyData is Map && verifyData['deleteToken'] is String) ? verifyData['deleteToken'] as String : '';
        if (verifyRes.statusCode == 200 && deleteToken.isNotEmpty) {
          final confirmRes = await _postJsonWithFallbackH('/api/auth/delete-account/confirm', {
            'email': email,
            'deleteToken': deleteToken,
          }, headers: { 'x-user-email': email });
          final ok = confirmRes.statusCode == 200;
          if (ok) {
            return { 'success': true, 'message': 'Account deleted' };
          }
          final confirmCt = (confirmRes.headers['content-type'] ?? '').toLowerCase();
          final confirmJson = confirmCt.contains('application/json');
          final confirmData = confirmJson ? json.decode(confirmRes.body) : {};
          return {
            'success': false,
            'message': (confirmData is Map && confirmData['message'] is String)
                ? confirmData['message']
                : 'Delete failed',
          };
        }
      }

      return {
        'success': false,
        'message': 'Delete requires email verification; check your inbox for a code.',
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

  static Future<Map<String, dynamic>> uploadAvatar({
    required String email,
    required String imageBase64,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/profile/avatar',
        { 'imageBase64': imageBase64 },
        headers: { 'x-user-email': email },
        timeout: const Duration(seconds: 20),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
        return {
          'success': true,
          'avatarUrl': data['avatarUrl'],
        };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Upload failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> uploadAvatarFile({
    required String email,
    required String filePath,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/auth/profile/avatar-file');
      final req = http.MultipartRequest('POST', uri);
      req.headers.addAll({
        'Accept': 'application/json',
        'x-user-email': email,
      });
      req.files.add(await http.MultipartFile.fromPath('avatar', filePath));
      final streamed = await req.send().timeout(const Duration(seconds: 30));
      final res = await http.Response.fromStream(streamed);
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
        return {'success': true, 'avatarUrl': data['avatarUrl']};
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Upload failed';
      return {'success': false, 'message': msg};
    } on TimeoutException {
      return {'success': false, 'message': 'Request timeout. Check network and server availability.'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> deleteAvatar({
    required String email,
    String? token,
  }) async {
    try {
      final headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-user-email': email,
        if (token != null && token.isNotEmpty) 'x-auth-token': token,
      };

      try {
        final delRes = await http
            .delete(
          Uri.parse('$baseUrl/api/auth/profile/avatar'),
          headers: headers,
        )
            .timeout(const Duration(seconds: 12));
        final delCt = (delRes.headers['content-type'] ?? '').toLowerCase();
        final delIsJson = delCt.contains('application/json');
        final delData = delIsJson ? json.decode(delRes.body) : {};
        if (delRes.statusCode == 200 || delRes.statusCode == 204) {
          return {
            'success': true,
            'message': (delData is Map && delData['message'] is String) ? delData['message'] : 'Avatar deleted',
          };
        }
      } catch (_) {}

      final res = await _postJsonWithFallbackH(
        '/api/auth/profile/avatar/delete',
        {},
        headers: { 'x-user-email': email, if (token != null && token.isNotEmpty) 'x-auth-token': token },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'message': (data is Map && data['message'] is String) ? data['message'] : 'Avatar deleted' };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Delete failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }
}
