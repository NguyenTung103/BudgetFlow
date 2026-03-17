class Income {
  final int id;
  final double amount;
  final String description;
  final DateTime date;
  final int categoryId;
  final String categoryName;
  final String categoryIcon;
  final int groupId;
  final String userFullName;

  Income({
    required this.id,
    required this.amount,
    required this.description,
    required this.date,
    required this.categoryId,
    required this.categoryName,
    required this.categoryIcon,
    required this.groupId,
    required this.userFullName,
  });

  factory Income.fromJson(Map<String, dynamic> json) => Income(
    id: json['id'],
    amount: (json['amount'] as num).toDouble(),
    description: json['description'] ?? '',
    date: DateTime.parse(json['date']),
    categoryId: json['categoryId'] ?? 0,
    categoryName: json['categoryName'] ?? '',
    categoryIcon: json['categoryIcon'] ?? '',
    groupId: json['groupId'] ?? 0,
    userFullName: json['userFullName'] ?? '',
  );
}
