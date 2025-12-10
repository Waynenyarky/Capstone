import '../../data/services/mongodb_service.dart';

class MfaStatusDetail {
  final bool enabled;
  final bool disablePending;
  final DateTime? scheduledFor;
  MfaStatusDetail({required this.enabled, required this.disablePending, required this.scheduledFor});
}

abstract class GetMfaStatusDetail {
  Future<MfaStatusDetail> call();
}

class GetMfaStatusDetailImpl implements GetMfaStatusDetail {
  final String email;
  GetMfaStatusDetailImpl({required this.email});
  @override
  Future<MfaStatusDetail> call() async {
    final res = await MongoDBService.getMfaStatusDetail(email: email);
    if (res['success'] == true) {
      final enabled = res['enabled'] == true;
      final pending = res['disablePending'] == true;
      final s = res['scheduledFor'];
      final dt = s is String ? DateTime.parse(s) : null;
      return MfaStatusDetail(enabled: enabled, disablePending: pending, scheduledFor: dt);
    }
    return MfaStatusDetail(enabled: false, disablePending: false, scheduledFor: null);
  }
}

