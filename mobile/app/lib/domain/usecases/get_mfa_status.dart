import '../../data/services/mongodb_service.dart';

abstract class GetMfaStatus {
  Future<bool> call();
}

class GetMfaStatusImpl implements GetMfaStatus {
  final String email;
  GetMfaStatusImpl({required this.email});
  @override
  Future<bool> call() async {
    return MongoDBService.getMfaStatus(email: email);
  }
}
