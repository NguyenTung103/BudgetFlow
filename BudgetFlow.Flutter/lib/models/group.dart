class GroupMember {
  final int userId;
  final String fullName;
  final String email;
  final String role;

  GroupMember({required this.userId, required this.fullName, required this.email, required this.role});

  factory GroupMember.fromJson(Map<String, dynamic> json) => GroupMember(
    userId: json['userId'],
    fullName: json['fullName'] ?? '',
    email: json['email'] ?? '',
    role: json['role'] ?? 'Member',
  );
}

class Group {
  final int id;
  final String name;
  final List<GroupMember> members;

  Group({required this.id, required this.name, required this.members});

  factory Group.fromJson(Map<String, dynamic> json) => Group(
    id: json['id'],
    name: json['name'] ?? '',
    members: (json['members'] as List? ?? []).map((m) => GroupMember.fromJson(m)).toList(),
  );
}
