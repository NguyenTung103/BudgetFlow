import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/group_provider.dart';
import '../../theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final groups = context.watch<GroupProvider>().groups;
    final activeGroup = context.watch<GroupProvider>().activeGroup;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Tài khoản')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          // Avatar & info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.secondary]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(children: [
              Container(
                width: 70, height: 70,
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                child: Center(
                  child: Text(
                    user?.fullName[0].toUpperCase() ?? 'U',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(user?.fullName ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 4),
              Text(user?.email ?? '', style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.8))),
            ]),
          ),
          const SizedBox(height: 20),
          // Groups
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Nhóm của tôi', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              const SizedBox(height: 12),
              ...groups.map((g) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
                  child: Center(child: Text(g.name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.primary))),
                ),
                title: Text(g.name, style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                subtitle: Text('${g.members.length} thành viên', style: const TextStyle(color: AppTheme.textSecondary)),
                trailing: activeGroup?.id == g.id ? const Icon(Icons.check_circle, color: AppTheme.primary) : null,
                onTap: () => context.read<GroupProvider>().selectGroup(g),
              )),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () => _showCreateGroupDialog(context),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Tạo nhóm mới'),
                style: TextButton.styleFrom(foregroundColor: AppTheme.primary),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          // Settings
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
            child: Column(children: [
              _settingsTile(icon: Icons.notifications_outlined, iconColor: AppTheme.primary, label: 'Thông báo', onTap: () {}),
              const Divider(height: 1, indent: 56),
              _settingsTile(icon: Icons.lock_outline, iconColor: AppTheme.secondary, label: 'Đổi mật khẩu', onTap: () {}),
              const Divider(height: 1, indent: 56),
              _settingsTile(icon: Icons.shield_outlined, iconColor: AppTheme.success, label: 'Bảo mật', onTap: () {}),
              const Divider(height: 1, indent: 56),
              _settingsTile(icon: Icons.info_outline, iconColor: AppTheme.textSecondary, label: 'Phiên bản 1.0.0', onTap: null),
            ]),
          ),
          const SizedBox(height: 16),
          // Logout
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.read<AuthProvider>().logout(),
              icon: const Icon(Icons.logout, color: AppTheme.danger),
              label: const Text('Đăng xuất', style: TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: AppTheme.danger),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _settingsTile({required IconData icon, required Color iconColor, required String label, required VoidCallback? onTap}) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(9)),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
      trailing: onTap != null ? const Icon(Icons.chevron_right, color: AppTheme.textSecondary, size: 20) : null,
    );
  }

  void _showCreateGroupDialog(BuildContext context) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tạo nhóm mới'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'Tên nhóm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () async {
              if (ctrl.text.isNotEmpty) {
                await context.read<GroupProvider>().createGroup(ctrl.text.trim());
                Navigator.pop(ctx);
              }
            },
            child: const Text('Tạo'),
          ),
        ],
      ),
    );
  }
}
