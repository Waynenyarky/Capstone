import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
    final extra = (dotenv.env['ALT_BASE_URLS'] ?? '').split(',').map((s) => s.trim()).where((s) => s.isNotEmpty);
    for (final x in extra) {
      urls.add(x);
    }
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
      debugPrint('Trying endpoint: $uri');
      try {
        final res = await http
            .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: payload,
        )
            .timeout(timeout);
        debugPrint('Success with endpoint: $uri');
        return res;
      } on TimeoutException catch (e) {
        debugPrint('Timeout on $uri: $e');
        continue;
      } on SocketException catch (e) {
        debugPrint('SocketException on $uri: $e');
        continue;
      } catch (e) {
        debugPrint('Error on $uri: $e');
        continue;
      }
    }
    debugPrint('All endpoints failed. Candidates were: $candidates');
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
    try {
      final providedAuth = (headers ?? const {}).keys.map((k) => k.toLowerCase()).contains('authorization');
      if (!providedAuth) {
        final prefs = await SharedPreferences.getInstance();
        final t = (prefs.getString('accessToken') ?? '').trim();
        if (t.isNotEmpty) {
          baseHeaders['Authorization'] = 'Bearer $t';
          baseHeaders['x-auth-token'] = t;
          baseHeaders['x-access-token'] = t;
        }
      }
    } catch (_) {}
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
    try {
      final providedAuth = (headers ?? const {}).keys.map((k) => k.toLowerCase()).contains('authorization');
      if (!providedAuth) {
        final prefs = await SharedPreferences.getInstance();
        final t = (prefs.getString('accessToken') ?? '').trim();
        if (t.isNotEmpty) {
          baseHeaders['Authorization'] = 'Bearer $t';
          baseHeaders['x-auth-token'] = t;
          baseHeaders['x-access-token'] = t;
        }
      }
    } catch (_) {}
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

  static Future<http.Response> _getWithFallbackH(
    String path, {
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final candidates = _candidateBaseUrls();
    final baseHeaders = {
      'Accept': 'application/json',
      ...?headers,
    };
    try {
      final providedAuth = (headers ?? const {}).keys.map((k) => k.toLowerCase()).contains('authorization');
      if (!providedAuth) {
        final prefs = await SharedPreferences.getInstance();
        final t = (prefs.getString('accessToken') ?? '').trim();
        if (t.isNotEmpty) {
          baseHeaders['Authorization'] = 'Bearer $t';
          baseHeaders['x-auth-token'] = t;
          baseHeaders['x-access-token'] = t;
        }
      }
    } catch (_) {}
    for (final origin in candidates) {
      final uri = Uri.parse('$origin$path');
      debugPrint('Trying GET endpoint: $uri');
      try {
        final res = await http
            .get(
          uri,
          headers: baseHeaders,
        )
            .timeout(timeout);
        debugPrint('Success with GET endpoint: $uri');
        return res;
      } on TimeoutException catch (e) {
        debugPrint('Timeout on $uri: $e');
        continue;
      } on SocketException catch (e) {
        debugPrint('SocketException on $uri: $e');
        continue;
      } catch (e) {
        debugPrint('Error on $uri: $e');
        continue;
      }
    }
    debugPrint('All GET endpoints failed. Candidates were: $candidates');
    throw TimeoutException('All endpoints unreachable for $path');
  }

  static Future<bool> isNetworkAvailable({Duration timeout = const Duration(seconds: 3)}) async {
    try {
      final list = await InternetAddress.lookup('google.com').timeout(timeout);
      return list.isNotEmpty && list.first.rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> serverHealth({Duration timeout = const Duration(seconds: 5)}) async {
    try {
      final res = await _getWithFallbackH('/api/health', timeout: timeout);
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? (json.decode(res.body) as Map<String, dynamic>? ?? {}) : {};
      final ok = isJson ? (data['ok'] == true) : (res.statusCode == 200);
      return { 'ok': ok, 'status': res.statusCode, 'service': data['service'] };
    } catch (e) {
      return { 'ok': false, 'error': e.toString() };
    }
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
        'role': 'business_owner',
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

  static Future<Map<String, dynamic>> signupStart({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
    required bool termsAccepted,
  }) async {
    try {
      final body = {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
        'termsAccepted': termsAccepted,
        'role': 'business_owner',
      };
      final response = await _postJsonWithFallback('/api/auth/signup/start', body);
      final ct = (response.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(response.body) : {};
      if (response.statusCode == 200) {
        return { 'success': true };
      }
      String code = '';
      String msg = 'Failed to send verification code';
      if (data is Map) {
        final err = data['error'];
        if (err is Map) {
          if (err['code'] is String) code = err['code'] as String;
          if (err['message'] is String) msg = err['message'] as String;
        } else if (data['message'] is String) {
          msg = data['message'] as String;
        }
      }
      if (code == 'email_exists') {
        msg = 'This email is already registered. Please log in or choose another email.';
      }
      return { 'success': false, 'message': msg, if (code.isNotEmpty) 'code': code };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> signupVerify({
    required String email,
    required String code,
  }) async {
    try {
      final body = { 'email': email, 'code': code };
      final response = await _postJsonWithFallback('/api/auth/signup/verify', body);
      final ct = (response.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(response.body) : {};
      if (response.statusCode == 201 || response.statusCode == 200) {
        return { 'success': true, 'user': data };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] as String : 'Failed to verify signup';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    bool bypassFingerprint = false,
  }) async {
    try {
      debugPrint('Posting to: $baseUrl/api/auth/login');
      final body = {
        'email': email,
        'password': password,
      };

      debugPrint('Sending login request: $body');

      final response = bypassFingerprint
          ? await _postJsonWithFallbackH('/api/auth/login', body, headers: { 'x-bypass-fingerprint': 'true' })
          : await _postJsonWithFallback('/api/auth/login', body);

      debugPrint('Login response status: ${response.statusCode}');
      debugPrint('Login response body: ${response.body}');

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        final user = data;
        String? token;
        try {
          if (data is Map && data['token'] is String && (data['token'] as String).isNotEmpty) {
            token = data['token'] as String;
          }
        } catch (_) {}
        return {
          'success': true,
          'message': 'Login successful',
          'user': user,
          'token': token,
        };
      } else {
        String code = '';
        String fpToken = '';
        final msg = () {
          try {
            final err = (data is Map && data['error'] is Map) ? data['error'] as Map : null;
            if (err != null && err['code'] is String) code = err['code'] as String;
            if (err != null && err['details'] is Map && (err['details'] as Map)['loginToken'] is String) {
              fpToken = (err['details'] as Map)['loginToken'] as String;
            }
            final m = err != null ? err['message'] : null;
            return m ?? (data is Map ? data['message'] : null);
          } catch (_) {
            return null;
          }
        }();
        return {
          'success': false,
          'message': msg ?? 'Login failed',
          if (code.isNotEmpty) 'code': code,
          if (fpToken.isNotEmpty) 'fingerprintToken': fpToken,
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

  static Future<Map<String, dynamic>> loginWithGoogle({ required String idToken, String? email, String? providerId, bool? emailVerified, String? firstName, String? lastName }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/login/google',
        { 'idToken': idToken, if (email != null) 'email': email, if (providerId != null) 'providerId': providerId, if (emailVerified != null) 'emailVerified': emailVerified, if (firstName != null) 'firstName': firstName, if (lastName != null) 'lastName': lastName },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        String? token;
        try {
          if (data is Map && data['token'] is String && (data['token'] as String).isNotEmpty) {
            token = data['token'] as String;
          }
        } catch (_) {}
        return { 'success': true, 'user': data, if (token != null) 'token': token };
      }
      String msg = 'Google login failed';
      try {
        if (data is Map) {
          if ((data['error'] is Map) && ((data['error'] as Map)['message'] is String)) {
            msg = (data['error'] as Map)['message'] as String;
          } else if (data['message'] is String) {
            msg = data['message'] as String;
          }
        }
      } catch (_) {}
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> loginVerifyTotp({
    required String email,
    required String code,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/login/verify-totp',
        { 'email': email, 'code': code },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'user': data };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Invalid verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
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

  static Future<bool> getMfaStatus({ required String email }) async {
    try {
      final res = await _getWithFallbackH(
        '/api/auth/mfa/status',
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
        final flag = data['enabled'];
        return flag is bool ? flag : false;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> getMfaStatusDetail({ required String email }) async {
    try {
      final res = await _getWithFallbackH(
        '/api/auth/mfa/status',
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
              final enabled = data['enabled'] == true;
              
              String rawMethod = '';
              if (data['method'] is String) {
                rawMethod = data['method'];
              } else if (data['method'] is List) {
                rawMethod = (data['method'] as List).join(',');
              }
              
              final effectiveFp = data['isFingerprintEnabled'] == true;
              return {
                'success': true,
                'enabled': enabled,
                'disablePending': data['disablePending'] == true,
                'scheduledFor': data['scheduledFor'],
                'method': rawMethod,
                'isFingerprintEnabled': effectiveFp,
              };
            }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to fetch status';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> loginStartFingerprint({ required String email }) async {
    try {
      final e = email.trim().toLowerCase();
      // Primary attempt (POST)
      final response = await _postJsonWithFallbackH(
        '/api/auth/login/start-fingerprint',
        { 'email': e },
        headers: { 'x-user-email': e },
      );
      Map<String, dynamic> data = {};
      {
        final ct = (response.headers['content-type'] ?? '').toLowerCase();
        final isJson = ct.contains('application/json');
        data = isJson ? (json.decode(response.body) as Map<String, dynamic>? ?? {}) : {};
      }
      if (response.statusCode == 200 && (data['token'] is String) && (data['token'] as String).isNotEmpty) {
        return { 'success': true, 'token': data['token'], 'expiresAt': data['expiresAt'] };
      }
      String emsg = () {
        try {
          if (data['error'] is Map && (data['error'] as Map)['message'] is String) {
            return (data['error'] as Map)['message'] as String;
          }
          if (data['message'] is String) return data['message'] as String;
        } catch (_) {}
        final bodyText = response.body.toString();
        return bodyText.isNotEmpty ? bodyText : '';
      }();

      // Fallback 1 (GET same endpoint with header only)
      try {
        final res2 = await _getWithFallbackH(
          '/api/auth/login/start-fingerprint',
          headers: { 'x-user-email': e },
        );
        final ct2 = (res2.headers['content-type'] ?? '').toLowerCase();
        final isJson2 = ct2.contains('application/json');
        final data2 = isJson2 ? (json.decode(res2.body) as Map<String, dynamic>? ?? {}) : {};
        if (res2.statusCode == 200 && (data2['token'] is String) && (data2['token'] as String).isNotEmpty) {
          return { 'success': true, 'token': data2['token'], 'expiresAt': data2['expiresAt'] };
        }
        if (emsg.isEmpty) {
          try {
            if (data2['error'] is Map && (data2['error'] as Map)['message'] is String) {
              emsg = (data2['error'] as Map)['message'] as String;
            } else if (data2['message'] is String) {
              emsg = data2['message'] as String;
            } else {
              final bodyText2 = res2.body.toString();
              if (bodyText2.isNotEmpty) emsg = bodyText2;
            }
          } catch (_) {}
        }
      } catch (_) {}

      // Fallback 2 (alternate path order: POST)
      try {
        final res3 = await _postJsonWithFallbackH(
          '/api/auth/login/fingerprint/start',
          { 'email': e },
          headers: { 'x-user-email': e },
        );
        final ct3 = (res3.headers['content-type'] ?? '').toLowerCase();
        final isJson3 = ct3.contains('application/json');
        final data3 = isJson3 ? (json.decode(res3.body) as Map<String, dynamic>? ?? {}) : {};
        if (res3.statusCode == 200 && (data3['token'] is String) && (data3['token'] as String).isNotEmpty) {
          return { 'success': true, 'token': data3['token'], 'expiresAt': data3['expiresAt'] };
        }
        if (emsg.isEmpty) {
          try {
            if (data3['error'] is Map && (data3['error'] as Map)['message'] is String) {
              emsg = (data3['error'] as Map)['message'] as String;
            } else if (data3['message'] is String) {
              emsg = data3['message'] as String;
            } else {
              final bodyText3 = res3.body.toString();
              if (bodyText3.isNotEmpty) emsg = bodyText3;
            }
          } catch (_) {}
        }
      } catch (_) {}

      // Fallback 3 (alternate path order: GET)
      try {
        final res4 = await _getWithFallbackH(
          '/api/auth/login/fingerprint/start',
          headers: { 'x-user-email': e },
        );
        final ct4 = (res4.headers['content-type'] ?? '').toLowerCase();
        final isJson4 = ct4.contains('application/json');
        final data4 = isJson4 ? (json.decode(res4.body) as Map<String, dynamic>? ?? {}) : {};
        if (res4.statusCode == 200 && (data4['token'] is String) && (data4['token'] as String).isNotEmpty) {
          return { 'success': true, 'token': data4['token'], 'expiresAt': data4['expiresAt'] };
        }
        if (emsg.isEmpty) {
          try {
            if (data4['error'] is Map && (data4['error'] as Map)['message'] is String) {
              emsg = (data4['error'] as Map)['message'] as String;
            } else if (data4['message'] is String) {
              emsg = data4['message'] as String;
            } else {
              final bodyText4 = res4.body.toString();
              if (bodyText4.isNotEmpty) emsg = bodyText4;
            }
          } catch (_) {}
        }
      } catch (_) {}

      final msg = emsg.isNotEmpty ? emsg : 'Fingerprint start failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> mfaSetup({ required String email, required String method }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/setup',
        { 'method': method, 'email': email, 'channel': 'email' },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { 'success': true, ...(data is Map ? data : {}) };
      }
      final bodyText = res.body.toString();
      final msg = (data is Map && data['message'] is String)
          ? data['message']
          : (bodyText.isNotEmpty ? bodyText : 'Failed to setup MFA');
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> sendOtpEmail({ required String to, required String code }) async {
    try {
      final host = dotenv.env['SMTP_HOST'];
      final portStr = dotenv.env['SMTP_PORT'];
      final username = dotenv.env['SMTP_USERNAME'];
      final password = dotenv.env['SMTP_PASSWORD'];
      String fromAddr = (dotenv.env['SMTP_FROM'] ?? username) ?? '';
      final sslEnv = (dotenv.env['SMTP_SSL'] ?? 'false').toLowerCase() == 'true';
      final parsedPort = int.tryParse(portStr ?? '');
      final port = parsedPort ?? (sslEnv ? 465 : 587);
      final useSsl = (port == 465) ? true : (port == 587 ? false : sslEnv);
      final allowInsecure = (dotenv.env['SMTP_ALLOW_INSECURE'] ?? 'false').toLowerCase() == 'true';
      final ignoreBadCert = (dotenv.env['SMTP_IGNORE_BAD_CERT'] ?? 'false').toLowerCase() == 'true';
      final name = dotenv.env['SMTP_NAME'] ?? 'Verification Service';
      if (host == null || host.isEmpty || username == null || username.isEmpty || password == null || password.isEmpty) {
        return { 'success': false, 'message': 'SMTP not configured' };
      }
      if (fromAddr.isEmpty) {
        fromAddr = username;
      }
      debugPrint('SMTP send to $to via $host:$port ssl=$useSsl');
      final server = SmtpServer(
        host,
        port: port,
        username: username,
        password: password,
        ssl: useSsl,
        allowInsecure: allowInsecure,
        ignoreBadCertificate: ignoreBadCert,
      );
      final message = Message()
        ..from = Address(fromAddr, name)
        ..recipients.add(to)
        ..subject = 'Your verification code'
        ..text = 'Your verification code is: $code\nThis code expires in 10 minutes.';
      await send(message, server);
      return { 'success': true };
    } on MailerException catch (e) {
      try {
        final problems = e.problems.map((p) => p.toString()).join('; ');
        return { 'success': false, 'message': 'SMTP error: $problems' };
      } catch (_) {
        return { 'success': false, 'message': e.toString() };
      }
    } catch (e) {
      return { 'success': false, 'message': e.toString() };
    }
  }

  static Future<Map<String, dynamic>> sendChangePasswordOtpEmail({ required String to, required String code }) async {
    try {
      final host = dotenv.env['SMTP_HOST'];
      final portStr = dotenv.env['SMTP_PORT'];
      final username = dotenv.env['SMTP_USERNAME'];
      final password = dotenv.env['SMTP_PASSWORD'];
      String fromAddr = (dotenv.env['SMTP_FROM'] ?? username) ?? '';
      final sslEnv = (dotenv.env['SMTP_SSL'] ?? 'false').toLowerCase() == 'true';
      final parsedPort = int.tryParse(portStr ?? '');
      final port = parsedPort ?? (sslEnv ? 465 : 587);
      final useSsl = (port == 465) ? true : (port == 587 ? false : sslEnv);
      final allowInsecure = (dotenv.env['SMTP_ALLOW_INSECURE'] ?? 'false').toLowerCase() == 'true';
      final ignoreBadCert = (dotenv.env['SMTP_IGNORE_BAD_CERT'] ?? 'false').toLowerCase() == 'true';
      final name = dotenv.env['SMTP_NAME'] ?? 'Account Security';
      if (host == null || host.isEmpty || username == null || username.isEmpty || password == null || password.isEmpty) {
        return { 'success': false, 'message': 'SMTP not configured' };
      }
      if (fromAddr.isEmpty) {
        fromAddr = username;
      }
      debugPrint('SMTP send Change Password OTP to $to via $host:$port ssl=$useSsl');
      final server = SmtpServer(
        host,
        port: port,
        username: username,
        password: password,
        ssl: useSsl,
        allowInsecure: allowInsecure,
        ignoreBadCertificate: ignoreBadCert,
      );
      final message = Message()
        ..from = Address(fromAddr, name)
        ..recipients.add(to)
        ..subject = 'Change Password Verification Code'
        ..text = 'Use this code to change your password: $code\nThis code expires in 10 minutes.'
        ..html = '<p>Use this code to change your password:</p><h2>$code</h2><p>This code expires in 10 minutes.</p>';
      final timeoutSec = int.tryParse(dotenv.env['SMTP_TIMEOUT'] ?? '5') ?? 5;
      final maxRetries = int.tryParse(dotenv.env['SMTP_MAX_RETRIES'] ?? '1') ?? 1;
      final timeout = Duration(seconds: timeoutSec);
      int retries = 0;
      while (true) {
        try {
          await send(message, server).timeout(timeout);
          return { 'success': true };
        } on TimeoutException catch (e) {
          if (retries >= maxRetries) {
            return { 'success': false, 'message': 'SMTP timeout: ${e.toString()}' };
          }
          retries++;
          await Future.delayed(Duration(milliseconds: 500 * retries));
        } on MailerException catch (e) {
          if (retries >= maxRetries) {
            try {
              final problems = e.problems.map((p) => p.toString()).join('; ');
              return { 'success': false, 'message': 'SMTP error: $problems' };
            } catch (_) {
              return { 'success': false, 'message': e.toString() };
            }
          }
          retries++;
          await Future.delayed(Duration(milliseconds: 500 * retries));
        }
      }
    } catch (e) {
      return { 'success': false, 'message': e.toString() };
    }
  }

  static Future<Map<String, dynamic>> mfaFingerprintStart({ required String email }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/fingerprint/start',
        {},
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && (data is Map ? data['sent'] == true : true)) {
        return { 'success': true };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to send verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> mfaFingerprintVerify({ required String email, required String code }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/fingerprint/verify',
        { 'code': code },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'enabled': data is Map ? (data['enabled'] == true) : true };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to verify fingerprint';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> disableFingerprintLogin({ required String email }) async {
    try {
      final e = email.trim().toLowerCase();
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/fingerprint/disable',
        {},
        headers: { 'x-user-email': e },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? (json.decode(res.body) as Map<String, dynamic>? ?? {}) : {};
      if (res.statusCode == 200) {
        final disabled = (data['fingerprintDisabled'] == true) || (data['disabled'] == true);
        return { 'success': true, 'disabled': disabled, 'message': disabled ? 'Biometrics login disabled' : 'Success' };
      }
      final msg = data['message'] is String ? (data['message'] as String) : 'Request failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> mfaVerify({ required String email, required String code }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/verify',
        { 'code': code },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'enabled': data is Map ? (data['enabled'] == true) : true };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to verify MFA';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> mfaDisable({ required String email }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/disable',
        {},
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to disable MFA';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> mfaDisableRequest({ required String email }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/disable-request',
        {},
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
        return { 'success': true, 'scheduledFor': data['scheduledFor'] };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to request disable';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> mfaDisableUndo({ required String email, required String code }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/mfa/disable-undo',
        { 'code': code },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
        return { 'success': true, 'canceled': data['canceled'] == true };
      }
      if (res.statusCode == 401) {
        return { 'success': false, 'message': 'Invalid code' };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to undo disable';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
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

  static Future<Map<String, dynamic>> resetStart({ required String email }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/forgot-password',
        { 'email': email },
        headers: { 'Accept': 'application/json' },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? (json.decode(res.body) as Map<String, dynamic>? ?? {}) : {};
      if (res.statusCode == 200) {
        final devCode = (data['devCode'] is String) ? data['devCode'] as String : '';
        return { 'success': true, 'message': 'Verification code sent', 'devCode': devCode };
      }
      final bodyText = res.body.toString();
      final msg = (data['message'] is String)
          ? data['message'] as String
          : (bodyText.isNotEmpty ? bodyText : 'Failed to send verification code');
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> resetVerifyCode({ required String email, required String code }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/verify-code',
        { 'email': email, 'code': code },
        headers: { 'Accept': 'application/json' },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? (json.decode(res.body) as Map<String, dynamic>? ?? {}) : {};
      if (res.statusCode == 200) {
        final token = (data['resetToken'] is String) ? data['resetToken'] as String : '';
        return { 'success': true, 'resetToken': token };
      }
      final msg = (data['message'] is String) ? data['message'] as String : 'Invalid verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> resetChangePassword({
    required String email,
    required String resetToken,
    required String newPassword,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/change-password',
        { 'email': email, 'resetToken': resetToken, 'password': newPassword },
        headers: { 'Accept': 'application/json' },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? (json.decode(res.body) as Map<String, dynamic>? ?? {}) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'message': 'Password changed successfully' };
      }
      final msg = (data['message'] is String) ? data['message'] as String : 'Password update failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
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

  static Future<Map<String, dynamic>> changeEmailStart({
    required String currentEmail,
    required String newEmail,
  }) async {
    try {
      final body = { 'newEmail': newEmail };
      final res = await _postJsonWithFallbackH(
        '/api/auth/change-email/start',
        body,
        headers: { 'x-user-email': currentEmail },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && (data is Map ? data['sent'] == true : true)) {
        return { 'success': true, 'to': data is Map ? data['to'] : newEmail };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to send verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> changeEmailVerify({
    required String currentEmail,
    required String code,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/change-email/verify',
        { 'code': code },
        headers: { 'x-user-email': currentEmail },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return {
          'success': true,
          'email': (data is Map && data['email'] is String) ? data['email'] as String : currentEmail,
        };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Invalid verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> changeEmailConfirmStart({
    required String email,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/change-email/confirm/start',
        {},
        headers: { 'x-user-email': email },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && (data is Map ? data['sent'] == true : true)) {
        return { 'success': true, 'to': data is Map ? data['to'] : email };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to send verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> changeEmailConfirmVerify({
    required String email,
    required String code,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/change-email/confirm/verify',
        { 'code': code },
        headers: { 'x-user-email': email },
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'verified': data is Map ? (data['verified'] == true) : true };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Invalid verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
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

  static Future<Map<String, dynamic>> scheduleAccountDeletion({
    required String email,
    required String password,
  }) async {
    try {
      final loginRes = await _postJsonWithFallbackH(
        '/api/auth/login',
        { 'email': email, 'password': password },
        headers: { 'x-user-email': email },
      );
      final loginCt = (loginRes.headers['content-type'] ?? '').toLowerCase();
      final loginJson = loginCt.contains('application/json');
      final loginData = loginJson ? json.decode(loginRes.body) : {};
      if (loginRes.statusCode != 200) {
        final msg = (loginData is Map && loginData['message'] is String)
            ? loginData['message']
            : 'Invalid email or password';
        return { 'success': false, 'message': msg };
      }

      final sendRes = await _postJsonWithFallbackH(
        '/api/auth/delete-account/send-code',
        { 'email': email },
        headers: { 'x-user-email': email },
      );
      final sendCt = (sendRes.headers['content-type'] ?? '').toLowerCase();
      final sendJson = sendCt.contains('application/json');
      final sendData = sendJson ? json.decode(sendRes.body) : {};
      final devCode = (sendData is Map && sendData['devCode'] is String) ? sendData['devCode'] as String : '';
      if (sendRes.statusCode != 200) {
        final msg = (sendData is Map && sendData['message'] is String) ? sendData['message'] : 'Failed to send verification code';
        return { 'success': false, 'message': msg };
      }

      if (devCode.isEmpty) {
        return { 'success': false, 'message': 'Check your inbox for a verification code to schedule deletion.' };
      }

      final verifyRes = await _postJsonWithFallbackH(
        '/api/auth/delete-account/verify-code',
        { 'email': email, 'code': devCode },
        headers: { 'x-user-email': email },
      );
      final verifyCt = (verifyRes.headers['content-type'] ?? '').toLowerCase();
      final verifyJson = verifyCt.contains('application/json');
      final verifyData = verifyJson ? json.decode(verifyRes.body) : {};
      final deleteToken = (verifyData is Map && verifyData['deleteToken'] is String) ? verifyData['deleteToken'] as String : '';
      if (verifyRes.statusCode != 200 || deleteToken.isEmpty) {
        final msg = (verifyData is Map && verifyData['message'] is String) ? verifyData['message'] : 'Failed to verify delete code';
        return { 'success': false, 'message': msg };
      }

      final confirmRes = await _postJsonWithFallbackH(
        '/api/auth/delete-account/confirm',
        { 'email': email, 'deleteToken': deleteToken },
        headers: { 'x-user-email': email },
      );
      final ok = confirmRes.statusCode == 200;
      final confirmCt = (confirmRes.headers['content-type'] ?? '').toLowerCase();
      final confirmJson = confirmCt.contains('application/json');
      final confirmData = confirmJson ? json.decode(confirmRes.body) : {};
      if (ok) {
        final scheduledFor = () {
          try {
            final user = (confirmData is Map) ? confirmData['user'] : null;
            final v = (user is Map && user['deletionScheduledFor'] is String)
                ? user['deletionScheduledFor'] as String
                : null;
            return v;
          } catch (_) {
            return null;
          }
        }();
        return { 'success': true, 'message': 'Deletion scheduled', if (scheduledFor != null) 'scheduledFor': scheduledFor };
      }
      return {
        'success': false,
        'message': (confirmData is Map && confirmData['message'] is String)
            ? confirmData['message']
            : 'Failed to schedule deletion',
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

  static Future<Map<String, dynamic>> fetchProfile({
    required String email,
    String? token,
  }) async {
    try {
      final headers = {
        'x-user-email': email,
      };
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
      final res = await _getWithFallbackH(
        '/api/auth/me',
        headers: headers,
        timeout: const Duration(seconds: 12),
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200 && data is Map) {
              return {
                'success': true,
                'user': data,
                'deletionPending': data['deletionPending'] == true,
                'deletionScheduledFor': (data['deletionScheduledFor'] is String) ? data['deletionScheduledFor'] : null,
                'statusCode': 200,
              };
            }
            final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to load profile';
            return { 'success': false, 'message': msg, 'statusCode': res.statusCode };
          } on TimeoutException {
            return { 'success': false, 'message': 'Request timeout. Check network and server availability.', 'statusCode': 408 };
          } catch (e) {
            return { 'success': false, 'message': 'Connection error: ${e.toString()}', 'statusCode': 500 };
          }
        }

  static Future<Map<String, dynamic>> cancelAccountDeletion({
    required String email,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/delete-account/cancel',
        {},
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true, 'message': 'Deletion cancelled' };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to cancel deletion';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> sendDeleteAccountCode({
    required String email,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/delete-account/send-code',
        { 'email': email },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        final devCode = (data is Map && data['devCode'] is String) ? data['devCode'] as String : '';
        return { 'success': true, 'message': 'Verification code sent', 'devCode': devCode };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to send verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> verifyDeleteAccountCode({
    required String email,
    required String code,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/delete-account/verify-code',
        { 'email': email, 'code': code },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        final deleteToken = (data is Map && data['deleteToken'] is String) ? data['deleteToken'] as String : '';
        return { 'success': true, 'deleteToken': deleteToken };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Invalid verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> sendChangePasswordCode({
    required String email,
    required String token,
  }) async {
    try {
      final headers = {
        'x-user-email': email,
        'x-auth-token': token,
        'x-access-token': token,
        'Authorization': 'Bearer $token',
      };
      http.Response res;
      try {
        res = await _postJsonWithFallbackH(
          '/api/auth/change-password/send-code',
          { 'email': email },
          headers: headers,
        );
      } catch (_) {
        res = await _getWithFallbackH(
          '/api/auth/change-password/send-code',
          headers: headers,
        );
      }
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final dynamic parsed = isJson ? json.decode(res.body) : null;
      final Map<String, dynamic> data = (parsed is Map<String, dynamic>) ? parsed : <String, dynamic>{};
      if (res.statusCode == 200) {
        final devCode = (data['devCode'] is String) ? data['devCode'] as String : '';
        return { 'success': true, 'message': 'Verification code sent', 'devCode': devCode };
      }
      if (res.statusCode == 401 || res.statusCode == 403) {
        final msg = (data['message'] is String) ? data['message'] as String : 'Unauthorized: invalid or expired token';
        return { 'success': false, 'message': msg };
      }
      final bodyText = res.body.toString();
      final msg = (data['message'] is String)
          ? data['message'] as String
          : (bodyText.isNotEmpty ? bodyText : 'Failed to send verification code');
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> verifyChangePasswordCode({
    required String email,
    required String code,
    required String token,
  }) async {
    try {
      final headers = {
        'x-user-email': email,
        'x-auth-token': token,
        'x-access-token': token,
        'Authorization': 'Bearer $token',
      };
      http.Response res;
      try {
        res = await _postJsonWithFallbackH(
          '/api/auth/change-password/verify-code',
          { 'email': email, 'code': code },
          headers: headers,
        );
      } catch (_) {
        res = await _getWithFallbackH(
          '/api/auth/change-password/verify-code?email=$email&code=$code',
          headers: headers,
        );
      }
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        return { 'success': true };
      }
      if (res.statusCode == 401 || res.statusCode == 403) {
        final msg = (data is Map && data['message'] is String) ? data['message'] as String : 'Unauthorized: invalid or expired token';
        return { 'success': false, 'message': msg };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Invalid verification code';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }

  static Future<Map<String, dynamic>> confirmDeleteAccountDeletion({
    required String email,
    required String deleteToken,
  }) async {
    try {
      final res = await _postJsonWithFallbackH(
        '/api/auth/delete-account/confirm',
        { 'email': email, 'deleteToken': deleteToken },
        headers: { 'x-user-email': email },
      );
      final ct = (res.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(res.body) : {};
      if (res.statusCode == 200) {
        final user = (data is Map && data['user'] is Map<String, dynamic>) ? data['user'] as Map<String, dynamic> : <String, dynamic>{};
        final scheduledISO = (user['deletionScheduledFor'] is String) ? user['deletionScheduledFor'] as String : null;
        return { 'success': true, 'scheduledISO': scheduledISO, 'user': user };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] : 'Failed to schedule deletion';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
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
    final candidates = _candidateBaseUrls();
    // Retrieve auth token for upload
    String token = '';
    try {
      final prefs = await SharedPreferences.getInstance();
      token = (prefs.getString('accessToken') ?? '').trim();
    } catch (_) {}

    for (final origin in candidates) {
      try {
        final uri = Uri.parse('$origin/api/auth/profile/avatar-file');
        final req = http.MultipartRequest('POST', uri);
        req.headers.addAll({
          'Accept': 'application/json',
          'x-user-email': email,
        });
        if (token.isNotEmpty) {
           req.headers['Authorization'] = 'Bearer $token';
           req.headers['x-auth-token'] = token;
           req.headers['x-access-token'] = token;
        }

        req.files.add(await http.MultipartFile.fromPath('avatar', filePath));
        final streamed = await req.send().timeout(const Duration(seconds: 30));
        final res = await http.Response.fromStream(streamed);
        
        // Enhanced logging for debugging
        debugPrint('Upload avatar response: ${res.statusCode} ${res.body}');

        final ct = (res.headers['content-type'] ?? '').toLowerCase();
        final isJson = ct.contains('application/json');
        final data = isJson ? json.decode(res.body) : {};
        if (res.statusCode == 200 && data is Map) {
          return {'success': true, 'avatarUrl': data['avatarUrl']};
        }
        final msg = (data is Map && data['message'] is String) ? data['message'] : 'Upload failed with status ${res.statusCode}';
        return {'success': false, 'message': msg};
      } on TimeoutException catch (_) {
        continue;
      } on SocketException catch (_) {
        continue;
      } catch (e) {
        debugPrint('Upload error: $e');
        continue;
      }
    }
    return {'success': false, 'message': 'All endpoints unreachable for upload'};
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

  static Future<Map<String, dynamic>> loginCompleteFingerprint({
    required String email,
    required String token,
  }) async {
    try {
      final e = email.trim().toLowerCase();
      final response = await _postJsonWithFallbackH(
        '/api/auth/login/complete-fingerprint',
        { 'email': e, 'token': token },
        headers: { 'x-user-email': e },
      );
      final ct = (response.headers['content-type'] ?? '').toLowerCase();
      final isJson = ct.contains('application/json');
      final data = isJson ? json.decode(response.body) : {};
      if (response.statusCode == 200) {
        String? access;
        try {
          if (data is Map && data['token'] is String && (data['token'] as String).isNotEmpty) {
            access = data['token'] as String;
          }
        } catch (_) {}
        return { 'success': true, 'user': data, if (access != null) 'token': access };
      }
      final msg = (data is Map && data['message'] is String) ? data['message'] as String : 'Fingerprint login failed';
      return { 'success': false, 'message': msg };
    } on TimeoutException {
      return { 'success': false, 'message': 'Request timeout. Check network and server availability.' };
    } catch (e) {
      return { 'success': false, 'message': 'Connection error: ${e.toString()}' };
    }
  }
}
