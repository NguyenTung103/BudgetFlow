import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  late final Dio dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ))..interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await _storage.read(key: 'accessToken');
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
        debugPrint('[API] ${options.method} ${options.path} — token: ${token.substring(0, 20)}...');
      } else {
        debugPrint('[API] ${options.method} ${options.path} — NO TOKEN');
      }
      handler.next(options);
    },
    onError: (error, handler) {
      debugPrint('[API ERROR] ${error.requestOptions.method} ${error.requestOptions.path} → ${error.response?.statusCode} ${error.message}');
      handler.next(error);
    },
  ));

  Future<String?> getToken() => _storage.read(key: 'accessToken');
  Future<void> setTokens(String access, String refresh) async {
    await _storage.write(key: 'accessToken', value: access);
    await _storage.write(key: 'refreshToken', value: refresh);
  }
  Future<void> clearTokens() async {
    await _storage.deleteAll();
  }
}
