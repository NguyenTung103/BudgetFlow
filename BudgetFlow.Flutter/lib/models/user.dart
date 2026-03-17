class User {
  final int id;
  final String fullName;
  final String email;

  User({required this.id, required this.fullName, required this.email});

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'],
    fullName: json['fullName'] ?? '',
    email: json['email'] ?? '',
  );
}
