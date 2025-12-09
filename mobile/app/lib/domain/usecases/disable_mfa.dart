import '../../data/services/mongodb_service.dart';

abstract class DisableMfa {
  Future<Map<String, dynamic>> call();
}

class DisableMfaImpl implements DisableMfa {
  final String email;
  DisableMfaImpl({required this.email});
  @override
  Future<Map<String, dynamic>> call() async {
    return MongoDBService.mfaDisable(email: email);
  }
}
