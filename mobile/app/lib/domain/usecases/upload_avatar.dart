import '../../data/services/mongodb_service.dart';

class UploadAvatar {
  Future<Map<String, dynamic>> call({
    required String email,
    String? imageBase64,
    String? filePath,
  }) async {
    if (filePath != null && filePath.isNotEmpty) {
      return MongoDBService.uploadAvatarFile(email: email, filePath: filePath);
    }
    if (imageBase64 != null && imageBase64.isNotEmpty) {
      return MongoDBService.uploadAvatar(email: email, imageBase64: imageBase64);
    }
    return {'success': false, 'message': 'No image provided'};
  }
}
