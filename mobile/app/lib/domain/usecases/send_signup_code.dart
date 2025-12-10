import 'package:app/data/services/mongodb_service.dart';

class SendSignupCode {
  Future<Map<String, dynamic>> call({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
    required bool termsAccepted,
  }) async {
    return MongoDBService.signupStart(
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      password: password,
      termsAccepted: termsAccepted,
    );
  }
}
