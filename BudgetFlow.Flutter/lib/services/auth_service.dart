import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final _api = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _api.dio.post('/auth/login', data: {'email': email, 'password': password});
    await _api.setTokens(res.data['accessToken'], res.data['refreshToken']);
    return res.data;
  }

  Future<Map<String, dynamic>> register(String fullName, String email, String password) async {
    final res = await _api.dio.post('/auth/register', data: {'fullName': fullName, 'email': email, 'password': password});
    await _api.setTokens(res.data['accessToken'], res.data['refreshToken']);
    return res.data;
  }

  Future<void> logout() async {
    try { await _api.dio.post('/auth/logout'); } catch (_) {}
    await _api.clearTokens();
  }

  Future<User?> getMe() async {
    try {
      final res = await _api.dio.get('/auth/me');
      return User.fromJson(res.data);
    } catch (_) {
      return null;
    }
  }
}
