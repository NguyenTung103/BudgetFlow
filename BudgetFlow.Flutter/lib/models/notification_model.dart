class NotificationModel {
  final int id;
  final String message;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
    id: json['id'],
    message: json['message'] ?? '',
    type: json['type'] ?? 'info',
    isRead: json['isRead'] ?? false,
    createdAt: DateTime.parse(json['createdAt']),
  );
}
