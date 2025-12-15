import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/data/services/mongodb_service.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io' as io;
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/usecases/upload_avatar.dart';

class EditProfilePage extends StatefulWidget {
  final String email;
  final String token;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String avatarUrl;
  const EditProfilePage({
    super.key,
    required this.email,
    required this.token,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    this.avatarUrl = '',
  });
  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstController;
  late final TextEditingController _lastController;
  late final TextEditingController _phoneController;
  final FocusNode _firstFocus = FocusNode();
  final FocusNode _lastFocus = FocusNode();
  final FocusNode _phoneFocus = FocusNode();
  bool _touchedFirst = false;
  bool _touchedLast = false;
  bool _touchedPhone = false;
  bool _saving = false;
  String _localAvatarPath = '';
  String _avatarUrl = '';
  bool _uploadingAvatar = false;
  String _resolveAvatarUrl(String url) {
    final u = url.trim();
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
    return '${MongoDBService.baseUrl}$u';
  }

  @override
  void initState() {
    super.initState();
    _firstController = TextEditingController(text: widget.firstName);
    _lastController = TextEditingController(text: widget.lastName);
    _phoneController = TextEditingController(text: widget.phoneNumber);
    _avatarUrl = widget.avatarUrl;
    () async {
      try {
        if (_avatarUrl.isEmpty) {
          final prefs = await SharedPreferences.getInstance();
          final cached = (prefs.getString('lastAvatarUrl') ?? '').trim();
          if (cached.isNotEmpty) {
            if (mounted) {
              setState(() {
                _avatarUrl = cached;
              });
            }
          }
        }
      } catch (_) {}
    }();
  }

  @override
  void dispose() {
    _firstController.dispose();
    _lastController.dispose();
    _phoneController.dispose();
    _firstFocus.dispose();
    _lastFocus.dispose();
    _phoneFocus.dispose();
    super.dispose();
  }

  bool _isValidName(String v) {
    final s = v.trim();
    if (s.length < 2 || s.length > 50) return false;
    return RegExp(r'^[A-Za-z][A-Za-z\-\s]*$').hasMatch(s);
  }

  bool _isValidPhone(String v) {
    return RegExp(r'^09\d{9}$').hasMatch(v);
  }

  Future<bool> _ensureGalleryPermission() async {
    try {
      var s = await Permission.photos.status;
      if (!s.isGranted && !s.isLimited) {
        s = await Permission.photos.request();
        if (!s.isGranted && !s.isLimited) return false;
      }
      var st = await Permission.storage.status;
      if (!st.isGranted) {
        st = await Permission.storage.request();
      }
    } catch (_) {}
    return true;
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
                leading: const Icon(Icons.photo_library, color: Colors.black),
                title: const Text('Choose from Gallery'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Colors.black),
                title: const Text('Take a Photo'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
            ],
          ),
        );
      },
    );
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
                leading: const Icon(Icons.visibility, color: Colors.black),
                title: const Text('See profile picture'),
                onTap: () => Navigator.pop(ctx, 'view'),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Colors.black),
                title: const Text('Choose profile picture'),
                onTap: () => Navigator.pop(ctx, 'choose'),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _onAvatarTapped() async {
    final action = await _showAvatarOptions();
    if (!mounted) return;
    if (action == 'view') {
      final provider = _localAvatarPath.isNotEmpty
          ? FileImage(io.File(_localAvatarPath))
          : (_avatarUrl.isNotEmpty ? NetworkImage(_resolveAvatarUrl(_avatarUrl)) as ImageProvider : null);
      await showDialog<void>(
        context: context,
        barrierDismissible: true,
        builder: (ctx) {
          return Dialog(
            insetPadding: EdgeInsets.zero,
            backgroundColor: Colors.transparent,
            child: Stack(
              children: [
                SizedBox.expand(
                  child: Container(
                    color: Colors.black,
                    child: Center(
                      child: provider != null
                          ? InteractiveViewer(
                              child: Image(
                                image: provider,
                                fit: BoxFit.cover,
                                filterQuality: FilterQuality.high,
                              ),
                            )
                          : Icon(Icons.person, size: 64, color: Colors.grey.shade400),
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
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    } else if (action == 'choose') {
      await _changeAvatar();
    }
  }

  Future<String?> _pickAndEditImage() async {
    final source = await _selectImageSource();
    if (source == null) return null;
    if (source == ImageSource.gallery) {
      final ok = await _ensureGalleryPermission();
      if (!ok) return null;
    }
    final picker = ImagePicker();
    XFile? picked;
    try {
      picked = await picker.pickImage(source: source, imageQuality: 70, maxWidth: 1280, maxHeight: 1280);
    } catch (_) {
      return null;
    }
    if (picked == null) return null;
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
  }

  Future<void> _changeAvatar() async {
    if (_uploadingAvatar) return;
    final pathToUpload = await _pickAndEditImage();
    if (pathToUpload == null || pathToUpload.isEmpty) return;
    if (!mounted) return;
    setState(() {
      _localAvatarPath = pathToUpload;
      _uploadingAvatar = true;
    });
    final uploader = UploadAvatar();
    final res = await uploader.call(email: widget.email, filePath: pathToUpload);
    if (!mounted) return;
    setState(() => _uploadingAvatar = false);
    if (res['success'] == true && res['avatarUrl'] is String) {
      setState(() {
        _avatarUrl = res['avatarUrl'] as String;
        _localAvatarPath = '';
      });
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('lastAvatarUrl', _avatarUrl);
        await prefs.setBool('avatarIsCustom', true);
      } catch (_) {}
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Text('Profile photo updated'),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    } else {
      final msg = (res['message'] is String) ? res['message'] as String : 'Upload failed';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(msg)),
            ],
          ),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  InputDecoration _decoration(String label, String hint) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 15),
      labelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      errorMaxLines: 2,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.blue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.red, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
      filled: true,
      fillColor: Colors.grey.shade50,
    );
  }

  Future<void> _save() async {
    setState(() {
      _touchedFirst = true;
      _touchedLast = true;
      _touchedPhone = true;
    });
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);
    final res = await MongoDBService.updateProfile(
      email: widget.email,
      token: widget.token,
      firstName: _firstController.text.trim(),
      lastName: _lastController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
    );
    setState(() => _saving = false);
    if (res['success'] == true) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text((res['message'] is String) ? res['message'] as String : 'Profile updated successfully'),
            ),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ));
      final user = (res['user'] is Map<String, dynamic>) ? (res['user'] as Map<String, dynamic>) : <String, dynamic>{};
      if (_avatarUrl.isNotEmpty) {
        user['avatarUrl'] = _avatarUrl;
      }
      if (!mounted) return;
      Navigator.of(context).pop(user);
    } else {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text((res['message'] is String) ? res['message'] as String : 'Update failed')),
          ],
        ),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 360;
    final isMedium = size.width >= 360 && size.width < 600;
    final isLarge = size.width >= 600;
    
    final hPad = isSmall ? 16.0 : (isMedium ? 20.0 : 24.0);
    final avatarSize = isSmall ? 100.0 : (isMedium ? 120.0 : 140.0);
    
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_uploadingAvatar) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                  ),
                  SizedBox(width: 12),
                  Text('Please wait, updating photo...'),
                ],
              ),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          );
          return;
        }
        final payload = <String, dynamic>{};
        if (_avatarUrl.isNotEmpty) {
          payload['avatarUrl'] = _avatarUrl;
        }
        if (_localAvatarPath.isNotEmpty) {
          payload['localAvatarPath'] = _localAvatarPath;
        }
        Navigator.of(context).pop(payload);
      },
      child: Scaffold(
        backgroundColor: Colors.grey.shade50,
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.white,
          title: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: () {
              if (_uploadingAvatar) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                        ),
                        SizedBox(width: 12),
                        Text('Please wait, updating photo...'),
                      ],
                    ),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                );
                return;
              }
              final payload = <String, dynamic>{};
              if (_avatarUrl.isNotEmpty) {
                payload['avatarUrl'] = _avatarUrl;
              }
              if (_localAvatarPath.isNotEmpty) {
                payload['localAvatarPath'] = _localAvatarPath;
              }
              Navigator.of(context).pop(payload);
            },
          ),
        ),
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final maxWidth = isLarge ? 600.0 : double.infinity;
              
              return SingleChildScrollView(
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: Column(
                      children: [
                        // Profile Photo Section
                        Container(
                          width: double.infinity,
                          color: Colors.white,
                          padding: EdgeInsets.symmetric(horizontal: hPad, vertical: 24),
                          child: Column(
                            children: [
                              Stack(
                                children: [
                                  GestureDetector(
                                    onTap: _uploadingAvatar ? null : _onAvatarTapped,
                                    child: Container(
                                      width: avatarSize,
                                      height: avatarSize,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.grey.shade200, width: 3),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withValues(alpha: 0.1),
                                            blurRadius: 10,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: CircleAvatar(
                                        radius: avatarSize / 2,
                                        backgroundColor: Colors.grey.shade100,
                                        child: Builder(
                                          builder: (_) {
                                            if (_localAvatarPath.isNotEmpty) {
                                              return ClipOval(
                                                child: Image.file(
                                                  io.File(_localAvatarPath),
                                                  fit: BoxFit.cover,
                                                  filterQuality: FilterQuality.high,
                                                  width: avatarSize,
                                                  height: avatarSize,
                                                ),
                                              );
                                            } else if (_avatarUrl.isNotEmpty) {
                                              return ClipOval(
                                                child: Image.network(
                                                  _resolveAvatarUrl(_avatarUrl),
                                                  fit: BoxFit.cover,
                                                  filterQuality: FilterQuality.high,
                                                  width: avatarSize,
                                                  height: avatarSize,
                                                ),
                                              );
                                            }
                                            return Icon(Icons.person, size: avatarSize * 0.5, color: Colors.grey.shade400);
                                          },
                                        ),
                                      ),
                                  ),
                                  ),
                                  if (_uploadingAvatar)
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.black.withValues(alpha: 0.5),
                                        ),
                                        child: const Center(
                                          child: CircularProgressIndicator(
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                            strokeWidth: 3,
                                          ),
                                        ),
                                      ),
                                    ),
                                  Positioned(
                                    right: 0,
                                    bottom: 0,
                                    child: GestureDetector(
                                      onTap: _uploadingAvatar ? null : _changeAvatar,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.blue,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: Colors.white, width: 3),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.2),
                                              blurRadius: 8,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Icon(
                                          Icons.camera_alt,
                                          color: Colors.white,
                                          size: isSmall ? 16 : 20,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _uploadingAvatar ? 'Uploading...' : 'Change Profile Photo',
                                style: TextStyle(
                                  fontSize: isSmall ? 14 : 15,
                                  fontWeight: FontWeight.w500,
                                  color: _uploadingAvatar ? Colors.grey : Colors.blue,
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 8),
                        
                        // Form Section
                        Container(
                          color: Colors.white,
                          padding: EdgeInsets.all(hPad),
                          child: Form(
                            key: _formKey,
                            autovalidateMode: AutovalidateMode.onUserInteraction,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Personal Information',
                                  style: TextStyle(
                                    fontSize: isSmall ? 16 : 18,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Update your personal details here',
                                  style: TextStyle(
                                    fontSize: isSmall ? 13 : 14,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                
                                // First Name
                                TextFormField(
                                  controller: _firstController,
                                  focusNode: _firstFocus,
                                  decoration: _decoration('First Name', 'Enter your first name'),
                                  style: const TextStyle(fontSize: 15),
                                  onChanged: (_) => setState(() => _touchedFirst = true),
                                  validator: (v) {
                                    if (!_touchedFirst) return null;
                                    if (v == null || v.trim().isEmpty) return 'First name is required';
                                    if (!_isValidName(v)) return 'Must be 2-50 letters, spaces or hyphen';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                
                                // Last Name
                                TextFormField(
                                  controller: _lastController,
                                  focusNode: _lastFocus,
                                  decoration: _decoration('Last Name', 'Enter your last name'),
                                  style: const TextStyle(fontSize: 15),
                                  onChanged: (_) => setState(() => _touchedLast = true),
                                  validator: (v) {
                                    if (!_touchedLast) return null;
                                    if (v == null || v.trim().isEmpty) return 'Last name is required';
                                    if (!_isValidName(v)) return 'Must be 2-50 letters, spaces or hyphen';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                
                                // Phone Number
                                TextFormField(
                                  controller: _phoneController,
                                  focusNode: _phoneFocus,
                                  decoration: _decoration('Phone Number', '09XX XXX XXXX'),
                                  style: const TextStyle(fontSize: 15),
                                  keyboardType: TextInputType.phone,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(11),
                                  ],
                                  onChanged: (_) => setState(() => _touchedPhone = true),
                                  validator: (v) {
                                    if (!_touchedPhone) return null;
                                    final s = (v ?? '').trim();
                                    if (s.isEmpty) return 'Phone number is required';
                                    if (s.length != 11) return 'Must be 11 digits';
                                    if (!RegExp(r'^09').hasMatch(s)) return 'Must start with 09';
                                    if (!_isValidPhone(s)) return 'Invalid phone number';
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 8),
                        
                        // Info Box
                        Container(
                          color: Colors.white,
                          padding: EdgeInsets.all(hPad),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.blue.shade100),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Colors.blue.shade700,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Your information is private and secure. Only you can see and edit these details.',
                                    style: TextStyle(
                                      fontSize: isSmall ? 13 : 14,
                                      color: Colors.blue.shade900,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Save Button
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: hPad),
                          child: SizedBox(
                            width: double.infinity,
                            height: 50,
                            child: ElevatedButton(
                              onPressed: _saving ? null : _save,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                disabledBackgroundColor: Colors.grey.shade300,
                              ),
                              child: _saving
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : Text(
                                      'Save Changes',
                                      style: TextStyle(
                                        fontSize: isSmall ? 15 : 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
