import 'package:app/data/services/mongodb_service.dart';

class SignInWithGoogle {
  Future<Map<String, dynamic>> call({ required String idToken, String? email, String? providerId, bool? emailVerified, String? firstName, String? lastName }) async {
    return MongoDBService.loginWithGoogle(idToken: idToken, email: email, providerId: providerId, emailVerified: emailVerified, firstName: firstName, lastName: lastName);
  }
}
