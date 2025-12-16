import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:app/data/services/mongodb_service.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io' as io;
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import '../../domain/usecases/upload_avatar.dart';
import 'login_page.dart';
import 'security/mfa_settings_screen.dart';
import 'change_email_page.dart';
import 'delete_account_next_page.dart';
import 'change_password_page.dart';
import 'edit_profile_page.dart';
import 'package:app/data/services/google_auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ProfilePage extends StatefulWidget {
  final String email;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String token;
  final String avatarUrl;
  const ProfilePage({super.key, required this.email, required this.firstName, required this.lastName, required this.phoneNumber, required this.token, this.avatarUrl = ''});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String email = '';
  String firstName = '';
  String lastName = '';
  String phoneNumber = '';
  String avatarUrl = '';
  String _localAvatarPath = '';
  bool _uploadingAvatar = false;
  Timer? _autoLogoutTimer;

  String _resolveAvatarUrl(String url) {
    final u = (url).trim();
    if (u.isEmpty) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) {
      try {
        final uri = Uri.parse(u);
        final host = uri.host.toLowerCase();
        if (host.contains('googleusercontent.com')) {
          String path = uri.path.replaceAll(RegExp(r's\d{2,4}-c'), 's1024-c');
          String query = uri.query.replaceAll(RegExp(r'(?<=^|[&])sz=\d{2,4}'), 'sz=1024');
          final upgraded = uri.replace(path: path, query: query).toString();
          return upgraded;
        }
      } catch (_) {}
      return u;
    }
    String base = MongoDBService.baseUrl;
    if (io.Platform.isAndroid && (base.contains('localhost') || base.contains('127.0.0.1'))) {
       base = base.replaceFirst('localhost', '10.0.2.2').replaceFirst('127.0.0.1', '10.0.2.2');
    }
    return '$base$u';
  }

 

  @override
  void initState() {
    super.initState();
    email = widget.email;
    firstName = widget.firstName;
    lastName = widget.lastName;
    phoneNumber = widget.phoneNumber;
    avatarUrl = widget.avatarUrl;
    () async {
      try {
        if (avatarUrl.isEmpty) {
          final prefs = await SharedPreferences.getInstance();
          final cachedSpecific = (prefs.getString('avatar_url_${email.toLowerCase()}') ?? '').trim();
          if (cachedSpecific.isNotEmpty) {
             if (mounted) setState(() => avatarUrl = cachedSpecific);
          } else {
            final cached = (prefs.getString('lastAvatarUrl') ?? '').trim();
            if (cached.isNotEmpty) {
              if (mounted) setState(() => avatarUrl = cached);
            }
          }
        }
      } catch (_) {}
    }();
    _autoLogoutTimer = Timer.periodic(const Duration(minutes: 1), (_) => _checkSessionExpiry());
  }

  @override
  void dispose() {
    _autoLogoutTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkSessionExpiry() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final loginAt = prefs.getInt('sessionLoginAtMs') ?? 0;
      final ttlStr = dotenv.env['SESSION_TTL_MINUTES'] ?? '';
      final ttlMin = int.tryParse(ttlStr) ?? 0;
      final nowMs = DateTime.now().millisecondsSinceEpoch;
      final expired = ttlMin > 0 && loginAt > 0 && (nowMs - loginAt) > ttlMin * 60 * 1000;
      if (!expired) return;
      _autoLogoutTimer?.cancel();
      if (!mounted) return;
      final minutes = ttlMin > 0 ? ttlMin : 5;
      final ok = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          contentPadding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
          actionsPadding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          title: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.blue.shade50,
                child: Icon(Icons.info_outline, color: Colors.blue.shade700),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text('Session Expired', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    SizedBox(height: 4),
                    Text('For your security, you have been signed out.', style: TextStyle(fontSize: 13, color: Colors.black54)),
                  ],
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.schedule, color: Colors.blue.shade700, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Auto logout time', style: TextStyle(fontSize: 12, color: Colors.black54)),
                          const SizedBox(height: 2),
                          Text('$minutes minutes', style: TextStyle(fontSize: 14, color: Colors.blue.shade900, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Okay'),
              ),
            )
          ],
        ),
      );
      if (!mounted) return;
      if (ok == true) {
        GoogleAuthService.signOutAndReset();
        final nav = Navigator.of(context);
        () async {
          bool preFpEnabled = false;
          bool preFaceEnabled = false;
          bool preAuthenticatorEnabled = false;
          String preFpEmail = '';
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove('loggedInEmail');
            await prefs.remove('fingerprintEmail');
            await prefs.setBool('disableAutoAuthenticatorOnce', true);
            String targetEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
            if (targetEmail.isEmpty) {
              targetEmail = email;
            }
            final s = await MongoDBService.getMfaStatusDetail(email: targetEmail);
            preFpEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
            final enabledMfa = s['success'] == true && s['enabled'] == true;
            final method = (s['method'] ?? '').toString().toLowerCase();
            if (enabledMfa) {
              if (method.contains('face')) preFaceEnabled = true;
              if (method.contains('authenticator')) preAuthenticatorEnabled = true;
            }
            preFpEmail = targetEmail;
          } catch (_) {}
          if (!mounted) return;
          nav.pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => LoginScreen(
                preFingerprintEnabled: preFpEnabled,
                preFingerprintEmail: preFpEmail,
                preFaceEnabled: preFaceEnabled,
                preAuthenticatorEnabled: preAuthenticatorEnabled,
              ),
            ),
            (route) => false,
          );
        }();
      }
    } catch (_) {}
  }
  Future<void> _changeAvatar() async {
    try {
      if (_uploadingAvatar) return;
      final messenger = ScaffoldMessenger.of(context);
      final pathToUpload = await _pickAndEditImage(messenger);
      if (pathToUpload == null || pathToUpload.isEmpty) return;

      if (!mounted) return;
      setState(() {
        _localAvatarPath = pathToUpload;
        _uploadingAvatar = true;
      });
      final uploader = UploadAvatar();
      final res = await uploader.call(email: email, filePath: pathToUpload);
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      if (res['success'] == true && res['avatarUrl'] is String) {
        setState(() {
          avatarUrl = res['avatarUrl'] as String;
          _localAvatarPath = '';
        });
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('avatar_url_${email.toLowerCase()}', avatarUrl);
          await prefs.setString('lastAvatarUrl', avatarUrl);
          await prefs.setBool('avatarIsCustom', true);
        } catch (_) {}
        messenger.showSnackBar(const SnackBar(content: Text('Profile photo updated')));
      } else {
        final msg = (res['message'] is String) ? res['message'] as String : 'Upload failed';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to change photo: ${e.toString()}')));
    }
  }

  Future<String?> _pickAndEditImage(ScaffoldMessengerState messenger) async {
    try {
      final source = await _selectImageSource();
      if (source == null) return null;
      // Check permissions for both Android and iOS
      if (source == ImageSource.gallery) {
        final ok = await _ensureGalleryPermission(messenger);
        if (!ok) return null;
      }
      if (source == ImageSource.camera) {
        var c = await Permission.camera.status;
        if (!c.isGranted) {
          c = await Permission.camera.request();
          if (!c.isGranted) {
            messenger.showSnackBar(const SnackBar(content: Text('Camera permission denied')));
            return null;
          }
        }
      }

      final picker = ImagePicker();
      XFile? picked;
      try {
        picked = await picker.pickImage(
          source: source,
          imageQuality: 70,
          maxWidth: 1280,
          maxHeight: 1280,
        );
      } catch (e) {
        messenger.showSnackBar(SnackBar(content: Text('Unable to open picker')));
        return null;
      }
      if (picked == null) {
        messenger.showSnackBar(const SnackBar(content: Text('No image selected')));
        return null;
      }

      final cropped = await ImageCropper().cropImage(
        sourcePath: picked.path,
        compressFormat: ImageCompressFormat.jpg,
        compressQuality: 80,
        maxWidth: 640,
        maxHeight: 640,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Edit Photo',
            toolbarColor: Colors.blue,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: false,
            hideBottomControls: false,
          ),
          IOSUiSettings(
            title: 'Edit Photo',
            aspectRatioLockEnabled: false,
          ),
        ],
      );

      return cropped?.path ?? picked.path;
    } catch (_) {
      messenger.showSnackBar(const SnackBar(content: Text('Image selection failed')));
      return null;
    }
  }

  Future<ImageSource?> _selectImageSource() async {
    return await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Gallery'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Camera'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<bool> _ensureGalleryPermission(ScaffoldMessengerState messenger) async {
    if (io.Platform.isAndroid) {
      // Check if already granted
      if (await Permission.photos.isGranted) return true;
      if (await Permission.storage.isGranted) return true;

      // Try requesting Photos permission (Android 13+)
      final p = await Permission.photos.request();
      if (p.isGranted) return true;

      // Try requesting Storage permission (Android <13)
      final s = await Permission.storage.request();
      if (s.isGranted) return true;

      messenger.showSnackBar(const SnackBar(content: Text('Gallery permission denied')));
      return false;
    } else {
      var s = await Permission.photos.status;
      if (s.isPermanentlyDenied) {
        messenger.showSnackBar(const SnackBar(content: Text('Enable Photos permission in settings')));
        await openAppSettings();
        return false;
      }
      if (!s.isGranted && !s.isLimited) {
        s = await Permission.photos.request();
        if (!s.isGranted && !s.isLimited) {
          messenger.showSnackBar(const SnackBar(content: Text('Photos permission denied')));
          return false;
        }
      }
      return true;
    }
  }

 

 

  void _openSecurity() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MfaSettingsScreen(email: email),
      ),
    );
  }

  void _openChangeEmailPage() async {
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (_) => ChangeEmailPage(currentEmail: email),
      ),
    );
    if (result is String && result.isNotEmpty) {
      setState(() {
        email = result;
      });
    }
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.logout, color: Colors.black87),
            const SizedBox(width: 8),
            const Text('Logout'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to logout?', style: TextStyle(fontSize: 15, height: 1.5)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade100),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, color: Colors.blue.shade700, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "You're about to sign out of this device. Your account and data stay safe—nothing will be deleted. You can sign back in anytime with your email and password, or with biometrics if enabled.",
                      style: TextStyle(fontSize: 13, color: Colors.blue.shade900, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () {
              GoogleAuthService.signOutAndReset();
              final nav = Navigator.of(context);
              () async {
                try {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.remove('loggedInEmail');
                  await prefs.setBool('disableAutoAuthenticatorOnce', true);
                } catch (_) {}
              }();
              Navigator.pop(context);
              () async {
                bool preFpEnabled = false;
                bool preFaceEnabled = false;
                bool preAuthenticatorEnabled = false;
                String preFpEmail = '';
                try {
                  final prefs = await SharedPreferences.getInstance();
                  String targetEmail = (prefs.getString('fingerprintEmail') ?? '').trim().toLowerCase();
                  if (targetEmail.isEmpty) {
                    targetEmail = (prefs.getString('lastLoginEmail') ?? '').trim().toLowerCase();
                  }
                  if (targetEmail.isEmpty) {
                    targetEmail = email;
                  }
                  final s = await MongoDBService.getMfaStatusDetail(email: targetEmail);
                  preFpEnabled = s['success'] == true && s['isFingerprintEnabled'] == true;
                  final enabledMfa = s['success'] == true && s['enabled'] == true;
                  final method = (s['method'] ?? '').toString().toLowerCase();
                  if (enabledMfa) {
                    if (method.contains('face')) preFaceEnabled = true;
                    if (method.contains('authenticator')) preAuthenticatorEnabled = true;
                  }
                  preFpEmail = targetEmail;
                } catch (_) {}
                if (!mounted) return;
                nav.pushAndRemoveUntil(
                  MaterialPageRoute(
                    builder: (_) => LoginScreen(
                      preFingerprintEnabled: preFpEnabled,
                      preFingerprintEmail: preFpEmail,
                      preFaceEnabled: preFaceEnabled,
                      preAuthenticatorEnabled: preAuthenticatorEnabled,
                    ),
                  ),
                  (route) => false,
                );
              }();
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }


  Future<void> _onAvatarTapped() async {
    final action = await _showAvatarOptions();
    if (action == 'view') {
      _showProfilePictureDialog();
    } else if (action == 'choose') {
      await _changeAvatar();
    }
  }

  Future<String?> _showAvatarOptions() async {
    return await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.visibility),
                title: const Text('See profile picture'),
                onTap: () => Navigator.pop(ctx, 'view'),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Choose profile picture'),
                onTap: () => Navigator.pop(ctx, 'choose'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showProfilePictureDialog() {
    final messenger = ScaffoldMessenger.of(context);
    ImageProvider? provider;
    if (_localAvatarPath.isNotEmpty) {
      provider = FileImage(io.File(_localAvatarPath));
    } else if (avatarUrl.isNotEmpty) {
      provider = NetworkImage(_resolveAvatarUrl(avatarUrl));
    }
    if (provider == null) {
      messenger.showSnackBar(const SnackBar(content: Text('No profile picture')));
      return;
    }
    String toastMsg = '';
    bool showToast = false;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          Future<void> showFloatingToast(String msg) async {
            setState(() {
              toastMsg = msg;
              showToast = true;
            });
            await Future.delayed(const Duration(seconds: 2));
            if (!mounted) return;
            setState(() => showToast = false);
          }
          return Dialog(
            insetPadding: EdgeInsets.zero,
            backgroundColor: Colors.transparent,
            child: PopScope(
              canPop: false,
              child: Stack(
                children: [
                  SizedBox.expand(
                    child: Container(
                      decoration: const BoxDecoration(color: Colors.black),
                      child: Center(
                        child: InteractiveViewer(
                          child: Image(image: provider!, fit: BoxFit.cover, filterQuality: FilterQuality.high),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 16,
                    left: 16,
                    child: SafeArea(
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        child: IconButton(
                          iconSize: 18,
                          splashRadius: 20,
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 16,
                    right: 16,
                    child: SafeArea(
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        child: IconButton(
                          iconSize: 18,
                          splashRadius: 20,
                          icon: const Icon(Icons.more_vert, color: Colors.white),
                          onPressed: () async {
                            final navigator = Navigator.of(context);
                            final action = await _showPhotoActions();
                            if (action == 'save') {
                              final ok = await _saveProfileImageToPhone(provider!);
                              await showFloatingToast(ok ? 'Photo saved to this device' : 'Save failed');
                            } else if (action == 'delete') {
                              if (!mounted) return;
                              final confirmed = await _confirmDeletePhoto();
                              if (confirmed) {
                                navigator.pop();
                                await _deleteProfilePhoto();
                              }
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 24,
                    child: IgnorePointer(
                      ignoring: true,
                      child: AnimatedSlide(
                        duration: const Duration(milliseconds: 180),
                        offset: showToast ? const Offset(0, 0) : const Offset(0, 0.2),
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 180),
                          opacity: showToast ? 1.0 : 0.0,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: toastMsg == 'Photo saved to this device'
                                    ? Colors.grey.shade200
                                    : Colors.black.withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 14, spreadRadius: 1),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    toastMsg.contains('saved') ? Icons.check_circle : Icons.info_outline,
                                    color: toastMsg.contains('saved') ? Colors.greenAccent : Colors.white,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    toastMsg,
                                    style: TextStyle(
                                      color: toastMsg == 'Photo saved to this device' ? Colors.black : Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<String?> _showPhotoActions() async {
    return await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.download),
                title: const Text('Save to phone'),
                onTap: () => Navigator.pop(ctx, 'save'),
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: const Text('Delete photo'),
                onTap: () => Navigator.pop(ctx, 'delete'),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<bool> _confirmDeletePhoto() async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete photo'),
            content: const Text('Are you sure you want to delete this photo?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ?? false;
  }

  Future<bool> _saveProfileImageToPhone(ImageProvider provider) async {
    try {
      List<int> bytes = [];
      String suggestedName = 'profile_${DateTime.now().millisecondsSinceEpoch}.jpg';
      if (provider is FileImage) {
        final f = provider.file;
        bytes = await f.readAsBytes();
        suggestedName = f.path.split(RegExp(r'[\\/]')).last;
      } else if (provider is NetworkImage) {
        final url = provider.url;
        final res = await http.get(Uri.parse(url));
        if (res.statusCode == 200) {
          bytes = res.bodyBytes;
        } else {
          throw Exception('Download failed (${res.statusCode})');
        }
      }
      if (bytes.isEmpty) throw Exception('No image data');
      if (io.Platform.isIOS) {
        var p = await Permission.photos.status;
        if (!p.isGranted && !p.isLimited) {
          p = await Permission.photos.request();
          if (!p.isGranted && !p.isLimited) throw Exception('Photos permission denied');
        }
      }
      bool ok = false;
      if (io.Platform.isAndroid) {
        const chan = MethodChannel('app.saveImage');
        ok = await chan.invokeMethod<bool>('saveImageToGallery', {
          'bytes': bytes,
          'name': suggestedName,
        }) ?? false;
      } else {
        final docs = await getApplicationDocumentsDirectory();
        final targetDir = io.Directory('${docs.path}/Capstone');
        if (!(await targetDir.exists())) await targetDir.create(recursive: true);
        final file = io.File('${targetDir.path}/$suggestedName');
        await file.writeAsBytes(bytes);
        ok = await file.exists();
      }
      return ok;
    } catch (_) {
      return false;
    }
  }

  Future<void> _deleteProfilePhoto() async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final res = await MongoDBService.deleteAvatar(email: email, token: widget.token);
      final ok = res['success'] == true;
      if (ok) {
        setState(() {
          _localAvatarPath = '';
          avatarUrl = '';
        });
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('avatar_url_${email.toLowerCase()}');
          await prefs.remove('lastAvatarUrl');
          await prefs.setBool('avatarIsCustom', false);
        } catch (_) {}
        messenger.showSnackBar(const SnackBar(content: Text('Photo deleted')));
      } else {
        final msg = (res['message'] is String) ? res['message'] as String : 'Delete failed';
        messenger.showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Delete failed: ${e.toString()}')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
              ),
              padding: const EdgeInsets.only(bottom: 30),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      InkWell(
                        onTap: _uploadingAvatar ? null : _onAvatarTapped,
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.white,
                          child: Builder(
                            builder: (_) {
                              if (_localAvatarPath.isNotEmpty) {
                                return ClipOval(
                                  child: Image.file(
                                    io.File(_localAvatarPath),
                                    fit: BoxFit.cover,
                                    filterQuality: FilterQuality.high,
                                    width: 100,
                                    height: 100,
                                  ),
                                );
                              } else if (avatarUrl.isNotEmpty) {
                                return ClipOval(
                                  child: Image.network(
                                    _resolveAvatarUrl(avatarUrl),
                                    fit: BoxFit.cover,
                                    filterQuality: FilterQuality.high,
                                    width: 100,
                                    height: 100,
                                  ),
                                );
                              }
                              return const Icon(Icons.person, size: 60, color: Colors.blue);
                            },
                          ),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: InkWell(
                          onTap: _uploadingAvatar ? null : _changeAvatar,
                          child: CircleAvatar(
                            radius: 16,
                            backgroundColor: Colors.blue,
                            child: _uploadingAvatar
                                ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                                : const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '$firstName $lastName',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    email,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _buildSectionTitle('Personal Information'),
            _buildInfoCard(),
            const SizedBox(height: 20),
            _buildSectionTitle('Account Settings'),
            _buildAccountSettingsSection(),
            const SizedBox(height: 12),
            _buildSectionTitle('Settings'),
            _buildSecuritySection(),
            const SizedBox(height: 12),
            _buildLogoutSection(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoRow(Icons.email, 'Email', email),
          _buildDivider(),
          _buildInfoRow(Icons.person, 'First Name', firstName),
          _buildDivider(),
          _buildInfoRow(Icons.person_outline, 'Last Name', lastName),
          _buildDivider(),
          _buildInfoRow(Icons.phone, 'Phone Number', phoneNumber.isNotEmpty ? phoneNumber : 'Phone number is currently empty.'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(height: 1, color: Colors.grey[200]);
  }

  Widget _buildAccountSettingsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.edit,
            title: 'Edit Profile',
            onTap: () async {
              final result = await Navigator.push<Map<String, dynamic>>(
                context,
                MaterialPageRoute(
                  builder: (_) => EditProfilePage(
                    email: email,
                    token: widget.token,
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: phoneNumber,
                    avatarUrl: avatarUrl,
                  ),
                ),
              );
              if (result is Map<String, dynamic>) {
                setState(() {
                  firstName = (result['firstName'] is String) ? result['firstName'] as String : firstName;
                  lastName = (result['lastName'] is String) ? result['lastName'] as String : lastName;
                  phoneNumber = (result['phoneNumber'] is String) ? result['phoneNumber'] as String : phoneNumber;
                  avatarUrl = (result['avatarUrl'] is String) ? result['avatarUrl'] as String : avatarUrl;
                  _localAvatarPath = (result['localAvatarPath'] is String) ? result['localAvatarPath'] as String : _localAvatarPath;
                });
              }
            },
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.alternate_email,
            title: 'Change Email',
            onTap: _openChangeEmailPage,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () async {
              final nav = Navigator.of(context);
              await nav.push<bool>(
                MaterialPageRoute(
                  builder: (_) => ChangePasswordPage(
                    email: email,
                    token: widget.token,
                  ),
                ),
              );
              // Success toast handled inside the verification flow; avoid duplicate toasts here.
            },
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.delete_outline,
            title: 'Delete Account',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => DeleteAccountNextPage(
                    email: email,
                    scheduledISO: null,
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: phoneNumber,
                    token: widget.token,
                    avatarUrl: avatarUrl,
                  ),
                ),
              );
            },
            isDestructive: true,
          ),
        ],
      ),
    );
  }


  Widget _buildSecuritySection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.security,
            title: 'Multi-Factor Authentication',
            onTap: _openSecurity,
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.logout,
            title: 'Logout',
            onTap: _logout,
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isDestructive ? Colors.red : Colors.blue,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isDestructive ? Colors.red : Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: Colors.grey[400],
      ),
      onTap: onTap,
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}

// Removed face unlock stubs

