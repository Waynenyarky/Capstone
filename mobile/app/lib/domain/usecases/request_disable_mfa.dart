import '../../data/services/mongodb_service.dart';

abstract class RequestDisableMfa {
  Future<DateTime?> call();
}

class RequestDisableMfaImpl implements RequestDisableMfa {
  final String email;
  RequestDisableMfaImpl({required this.email});
  @override
  Future<DateTime?> call() async {
    final res = await MongoDBService.mfaDisableRequest(email: email);
    if (res['success'] == true) {
      final s = res['scheduledFor'];
      return s is String ? DateTime.parse(s) : null;
    }
    return null;
  }
}

