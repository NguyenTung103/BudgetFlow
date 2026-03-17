import 'package:flutter/foundation.dart';

class ApiConfig {
  static String get baseUrl {
    if (defaultTargetPlatform == TargetPlatform.android && !kIsWeb) {
      return 'http://10.0.2.2:8085/api';
    }
    return 'http://180.93.35.163:8085/api';
  }

  static String get hubUrl {
    if (defaultTargetPlatform == TargetPlatform.android && !kIsWeb) {
      return 'http://180.93.35.163:8085/hubs/sync';
    }
    return 'http://localhost:8085/hubs/sync';
  }
}
