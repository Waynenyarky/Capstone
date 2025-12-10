import '../../data/services/mongodb_service.dart';

abstract class VerifyMfa {
  Future<bool> call({required String code});
}

class VerifyMfaImpl implements VerifyMfa {
  final String email;
  VerifyMfaImpl({required this.email});
  @override
  Future<bool> call({required String code}) async {
    final res = await MongoDBService.mfaVerify(email: email, code: code);
    return res['success'] == true;
  }
}
