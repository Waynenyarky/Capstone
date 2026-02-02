import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Service to monitor network connectivity for offline mode
class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._();
  static ConnectivityService get instance => _instance;

  ConnectivityService._();

  final _controller = StreamController<bool>.broadcast();
  Stream<bool> get isOnlineStream => _controller.stream;

  bool _lastOnline = true;

  Future<void> init() async {
    final result = await Connectivity().checkConnectivity();
    _lastOnline = _hasConnection(result);
    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      final online = _hasConnection(result);
      if (online != _lastOnline) {
        _lastOnline = online;
        _controller.add(online);
      }
    });
  }

  bool _hasConnection(ConnectivityResult r) {
    return r != ConnectivityResult.none;
  }

  Future<bool> get isOnline async {
    final result = await Connectivity().checkConnectivity();
    return _hasConnection(result);
  }

  void dispose() {
    _controller.close();
  }
}
