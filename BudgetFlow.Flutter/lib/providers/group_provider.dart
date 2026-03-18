import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/group.dart';
import '../services/api_service.dart';

class GroupProvider extends ChangeNotifier {
  final _api = ApiService();
  List<Group> _groups = [];
  Group? _activeGroup;
  String? _error;

  List<Group> get groups => _groups;
  Group? get activeGroup => _activeGroup;
  String? get error => _error;

  Future<void> fetchGroups() async {
    _error = null;
    try {
      final res = await _api.dio.get('/groups');
      _groups = (res.data as List).map((g) => Group.fromJson(g)).toList();
      if (_groups.isEmpty) {
        await createGroup('Cá nhân');
        return;
      }
      if (_activeGroup == null || !_groups.any((g) => g.id == _activeGroup!.id)) {
        _activeGroup = _groups.first;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[GroupProvider] fetchGroups error: $e');
      if (e.toString().contains('SocketException') || e.toString().contains('Connection refused') || e.toString().contains('Failed host lookup')) {
        _error = 'Không thể kết nối server (${ApiConfig.baseUrl}).';
      } else {
        _error = 'Lỗi dữ liệu: $e';
      }
      notifyListeners();
    }
  }

  void selectGroup(Group group) {
    _activeGroup = group;
    notifyListeners();
  }

  Future<void> createGroup(String name) async {
    await _api.dio.post('/groups', data: {'name': name});
    await fetchGroups();
  }
}
