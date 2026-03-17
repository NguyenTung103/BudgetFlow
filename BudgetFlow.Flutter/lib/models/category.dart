class Category {
  final int id;
  final String name;
  final String icon;
  final String type; // 'expense' or 'income'

  Category({required this.id, required this.name, required this.icon, required this.type});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'],
    name: json['name'] ?? '',
    icon: json['icon'] ?? '',
    type: json['type'] ?? 'expense',
  );
}
