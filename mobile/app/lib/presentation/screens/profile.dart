import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  bool _saving = false;

  bool _isValidName(String v) {
    final s = v.trim();
    if (s.length < 2 || s.length > 50) return false;
    return RegExp(r'^[A-Za-z][A-Za-z\-\s]*$').hasMatch(s);
  }

  bool _isValidPhone(String v) {
    return RegExp(r'^09\d{9}$').hasMatch(v);
  }

  bool _isValidEmail(String v) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim());
  }

  @override
  void initState() {
    super.initState();
    email = widget.email;
    firstName = widget.firstName;
    lastName = widget.lastName;
    phoneNumber = widget.phoneNumber;
    avatarUrl = widget.avatarUrl;
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
      if (!io.Platform.isAndroid) {
        if (source == ImageSource.gallery) {
          final ok = await _ensureGalleryPermission(messenger);
          if (!ok) return null;
        }
        if (source == ImageSource.camera) {
          var c = await Permission.camera.status;
          if (!c.isGranted) {
            c = await Permission.camera.request();
            if (!c.isGranted) return null;
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
      try {
        var s = await Permission.storage.status;
        if (!s.isGranted) {
          s = await Permission.storage.request();
          if (!s.isGranted) return false;
        }
      } catch (_) {}
      try {
        var p = await Permission.photos.status;
        if (!p.isGranted && !p.isLimited) {
          p = await Permission.photos.request();
        }
      } catch (_) {}
      return true;
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

  void _showEditProfileDialog() {
    final firstNameController = TextEditingController(text: firstName);
    final lastNameController = TextEditingController(text: lastName);
    final phoneController = TextEditingController(text: phoneNumber);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Profile'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: firstNameController,
                decoration: const InputDecoration(
                  labelText: 'First Name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: lastNameController,
                decoration: const InputDecoration(
                  labelText: 'Last Name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(11),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final f = firstNameController.text.trim();
              final l = lastNameController.text.trim();
              final p = phoneController.text.trim();
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              if (!_isValidName(f)) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('First Name must be 2-50 letters, spaces or hyphen')),
                );
                return;
              }
              if (!_isValidName(l)) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Last Name must be 2-50 letters, spaces or hyphen')),
                );
                return;
              }
              if (!_isValidPhone(p)) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Phone must be 11 digits starting with 09')),
                );
                return;
              }
              setState(() {
                _saving = true;
              });
              final result = await MongoDBService.updateProfile(
                email: email,
                token: widget.token,
                firstName: f,
                lastName: l,
                phoneNumber: p,
              );
              setState(() {
                _saving = false;
              });
              if (result['success'] == true) {
                final user = (result['user'] is Map<String, dynamic>) ? (result['user'] as Map<String, dynamic>) : <String, dynamic>{};
                final nextFirst = (user['firstName'] is String) ? user['firstName'] as String : firstName;
                final nextLast = (user['lastName'] is String) ? user['lastName'] as String : lastName;
                final nextPhone = (user['phoneNumber'] is String) ? user['phoneNumber'] as String : phoneNumber;
                setState(() {
                  firstName = nextFirst;
                  lastName = nextLast;
                  phoneNumber = nextPhone;
                });
                navigator.pop();
                messenger.showSnackBar(
                  SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Profile updated successfully')),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Update failed')),
                );
              }
            },
            child: _saving ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        bool obscureNew = true;
        bool obscureConfirm = true;
        return StatefulBuilder(
          builder: (context, setState) => AlertDialog(
            title: const Text('Change Password'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: currentPasswordController,
                  decoration: const InputDecoration(
                    labelText: 'Current Password',
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: newPasswordController,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    border: const OutlineInputBorder(),
                      suffixIcon: newPasswordController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                              onPressed: () {
                                setState(() {
                                  obscureNew = !obscureNew;
                                });
                              },
                            )
                          : null,
                    ),
                    obscureText: obscureNew,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: confirmPasswordController,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    border: const OutlineInputBorder(),
                      suffixIcon: confirmPasswordController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                              onPressed: () {
                                setState(() {
                                  obscureConfirm = !obscureConfirm;
                                });
                              },
                            )
                          : null,
                    ),
                    obscureText: obscureConfirm,
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final current = currentPasswordController.text;
                  final next = newPasswordController.text;
                  final confirm = confirmPasswordController.text;
                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  if (current.isEmpty || next.isEmpty || confirm.isEmpty) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('All fields are required')),
                    );
                    return;
                  }
                  if (next != confirm) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Passwords do not match')),
                    );
                    return;
                  }
                  final result = await MongoDBService.updatePassword(
                    email: email,
                    token: widget.token,
                    currentPassword: current,
                    newPassword: next,
                  );
                  if (result['success'] == true) {
                    navigator.pop();
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Password changed successfully')),
                    );
                  } else {
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Password update failed')),
                    );
                  }
                },
                child: const Text('Change'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showDeleteAccountDialog() {
    final passwordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Are you sure you want to delete your account? This action cannot be undone.',
              style: TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              decoration: const InputDecoration(
                labelText: 'Enter Password to Confirm',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
              ElevatedButton(
                onPressed: () async {
                  final pwd = passwordController.text;
                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  if (pwd.isEmpty) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Password is required')),
                    );
                    return;
                  }
                  final result = await MongoDBService.deleteAccount(
                    email: email,
                    token: widget.token,
                    password: pwd,
                  );
                  if (result['success'] == true) {
                    navigator.pop();
                    navigator.pushAndRemoveUntil(
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                      (route) => false,
                    );
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Account deleted')),
                    );
                  } else {
                    messenger.showSnackBar(
                      SnackBar(content: Text((result['message'] is String) ? result['message'] as String : 'Delete failed')),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                ),
                child: const Text('Delete'),
              ),
        ],
      ),
    );
  }

  void _openSecurity() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MfaSettingsScreen(email: email),
      ),
    );
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
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
      provider = NetworkImage('${MongoDBService.baseUrl}$avatarUrl');
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
                          child: Image(image: provider!, fit: BoxFit.contain),
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
                          backgroundImage: _localAvatarPath.isNotEmpty
                              ? FileImage(io.File(_localAvatarPath))
                              : (avatarUrl.isNotEmpty
                                  ? NetworkImage('${MongoDBService.baseUrl}$avatarUrl')
                                  : null),
                          child: (_localAvatarPath.isEmpty && avatarUrl.isEmpty)
                              ? const Icon(Icons.person, size: 60, color: Colors.blue)
                              : null,
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
          _buildInfoRow(Icons.phone, 'Phone Number', phoneNumber),
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
            onTap: _showEditProfileDialog,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.alternate_email,
            title: 'Change Email',
            onTap: _showChangeEmailDialog,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: _showChangePasswordDialog,
          ),
          _buildDivider(),
          _buildSettingsTile(
            icon: Icons.delete_outline,
            title: 'Delete Account',
            onTap: _showDeleteAccountDialog,
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  void _showChangeEmailDialog() {
    final currentPwdController = TextEditingController();
    final newEmailController = TextEditingController();
    bool obscure = true;
    bool loading = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Change Email'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: currentPwdController,
                  obscureText: obscure,
                  decoration: InputDecoration(
                    labelText: 'Current Password',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => obscure = !obscure),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: newEmailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'New Email',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: loading ? null : () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: loading
                  ? null
                  : () async {
                      final pwd = currentPwdController.text.trim();
                      final next = newEmailController.text.trim();
                      // defer obtaining ScaffoldMessenger until after async operations
                      if (pwd.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password is required')));
                        return;
                      }
                      if (!_isValidEmail(next)) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid email')));
                        return;
                      }
                      if (next.toLowerCase() == email.toLowerCase()) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('New email must be different')));
                        return;
                      }
                      setState(() => loading = true);
                      try {
                        final res = await MongoDBService.updateEmail(
                          email: email,
                          password: pwd,
                          newEmail: next,
                        );
                        if (res['success'] == true) {
                          final updated = (res['email'] is String) ? (res['email'] as String) : next;
                          setState(() {
                            email = updated;
                            loading = false;
                          });
                          if (!context.mounted) return;
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text((res['message'] is String) ? res['message'] as String : 'Email updated')),
                          );
                        } else {
                          setState(() => loading = false);
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text((res['message'] is String) ? res['message'] as String : 'Update failed')),
                          );
                        }
                      } catch (e) {
                        setState(() => loading = false);
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Connection error: ${e.toString()}')),
                        );
                      }
                    },
              child: loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Change'),
            ),
          ],
        ),
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
