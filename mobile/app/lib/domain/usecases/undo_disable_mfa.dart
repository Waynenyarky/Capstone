import '../../data/services/mongodb_service.dart';

abstract class UndoDisableMfa {
  Future<bool> call({required String code});
}

class UndoDisableMfaImpl implements UndoDisableMfa {
  final String email;
  UndoDisableMfaImpl({required this.email});
  @override
  Future<bool> call({required String code}) async {
    final res = await MongoDBService.mfaDisableUndo(email: email, code: code);
    return res['success'] == true && res['canceled'] == true;
  }
}

