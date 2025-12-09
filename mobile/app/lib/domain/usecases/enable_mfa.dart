import '../../data/services/mongodb_service.dart';

abstract class EnableMfa {
  Future<Map<String, dynamic>> call({required String method});
}

class EnableMfaImpl implements EnableMfa {
  final String email;
  EnableMfaImpl({required this.email});
  @override
  Future<Map<String, dynamic>> call({required String method}) async {
    return MongoDBService.mfaSetup(email: email, method: method);
  }
}
