class Budget {
  final int id;
  final double limitAmount;
  final double spentAmount;
  final double percentage;
  final int categoryId;
  final String categoryName;
  final String categoryIcon;
  final int month;
  final int year;
  final int groupId;

  Budget({
    required this.id,
    required this.limitAmount,
    required this.spentAmount,
    required this.percentage,
    required this.categoryId,
    required this.categoryName,
    required this.categoryIcon,
    required this.month,
    required this.year,
    required this.groupId,
  });

  factory Budget.fromJson(Map<String, dynamic> json) => Budget(
    id: json['id'],
    limitAmount: (json['limitAmount'] as num).toDouble(),
    spentAmount: (json['spentAmount'] as num).toDouble(),
    percentage: (json['percentage'] as num).toDouble(),
    categoryId: json['categoryId'] ?? 0,
    categoryName: json['categoryName'] ?? '',
    categoryIcon: json['categoryIcon'] ?? '',
    month: json['month'] ?? 1,
    year: json['year'] ?? DateTime.now().year,
    groupId: json['groupId'] ?? 0,
  );
}
