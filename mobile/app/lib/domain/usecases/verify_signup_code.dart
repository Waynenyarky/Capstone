import 'package:app/data/services/mongodb_service.dart';

class VerifySignupCode {
  Future<Map<String, dynamic>> call({
    required String email,
    required String code,
  }) async {
    return MongoDBService.signupVerify(email: email, code: code);
  }
}
