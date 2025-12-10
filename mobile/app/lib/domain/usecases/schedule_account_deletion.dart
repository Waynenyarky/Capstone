import '../../data/services/mongodb_service.dart';

class ScheduleAccountDeletion {
  Future<Map<String, dynamic>> call({
    required String email,
    required String password,
  }) async {
    return MongoDBService.scheduleAccountDeletion(email: email, password: password);
  }
}
