import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../models/group.dart';
import '../services/api_service.dart';

class GroupProvider extends ChangeNotifier {
  final _api = ApiService();
  List<Group> _groups = [];
  Group? _activeGroup;

  List<Group> get groups => _groups;
  Group? get activeGroup => _activeGroup;

  Future<void> fetchGroups() async {
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
