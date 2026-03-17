import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final _authService = AuthService();
  final _apiService = ApiService();
  User? _user;
  bool _loading = true;

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;

  Future<void> init() async {
    final token = await _apiService.getToken();
    if (token != null) {
      _user = await _authService.getMe();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await _authService.login(email, password);
    _user = User.fromJson(data['user']);
    notifyListeners();
  }

  Future<void> register(String fullName, String email, String password) async {
    final data = await _authService.register(fullName, email, password);
    _user = User.fromJson(data['user']);
    notifyListeners();
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }
}
