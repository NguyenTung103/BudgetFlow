import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/budget.dart';
import '../../models/category.dart';
import '../../providers/group_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  final _api = ApiService();
  List<Budget> _budgets = [];
  List<Category> _categories = [];
  bool _loading = true;
  final _fmt = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
  final _now = DateTime.now();
  String? _lastGroupId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchData());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final groupId = context.read<GroupProvider>().activeGroup?.id.toString();
    if (groupId != null && groupId != _lastGroupId) {
      _lastGroupId = groupId;
      _fetchData();
    }
  }

  Future<void> _fetchData() async {
    final group = context.read<GroupProvider>().activeGroup;
    if (group == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.dio.get('/budgets', queryParameters: {'groupId': group.id, 'month': _now.month, 'year': _now.year}),
        _api.dio.get('/categories'),
      ]);
      setState(() {
        _budgets = (results[0].data as List).map((b) => Budget.fromJson(b)).toList();
        _categories = (results[1].data as List).map((c) => Category.fromJson(c)).where((c) => c.type == 'expense').toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _showAddDialog() {
    final limitCtrl = TextEditingController();
    int? selectedCategoryId;

    showModalBottomSheet(
      context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Tạo ngân sách', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              DropdownButtonFormField<int>(
                decoration: const InputDecoration(labelText: 'Danh mục'),
                items: _categories.map((c) => DropdownMenuItem(value: c.id, child: Text('${c.icon} ${c.name}'))).toList(),
                onChanged: (v) => setModalState(() => selectedCategoryId = v),
              ),
              const SizedBox(height: 12),
              TextField(controller: limitCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Hạn mức (₫)', prefixIcon: Icon(Icons.account_balance_wallet))),
              const SizedBox(height: 16),
              SizedBox(width: double.infinity, child: ElevatedButton(
                onPressed: () async {
                  if (limitCtrl.text.isEmpty || selectedCategoryId == null) return;
                  final group = context.read<GroupProvider>().activeGroup!;
                  await _api.dio.post('/budgets', data: {
                    'categoryId': selectedCategoryId,
                    'limitAmount': double.parse(limitCtrl.text.replaceAll(',', '')),
                    'month': _now.month,
                    'year': _now.year,
                    'groupId': group.id,
                  });
                  Navigator.pop(ctx);
                  _fetchData();
                },
                child: const Text('Lưu'),
              )),
            ]),
          ),
        ),
      ),
    );
  }

  Color _progressColor(double pct) {
    if (pct >= 100) return AppTheme.danger;
    if (pct >= 80) return AppTheme.warning;
    return AppTheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: Text('Ngân sách ${_now.month}/${_now.year}')),
      floatingActionButton: FloatingActionButton(onPressed: _showAddDialog, backgroundColor: AppTheme.warning, child: const Icon(Icons.add, color: Colors.white)),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: _budgets.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.savings_outlined, size: 72, color: AppTheme.textSecondary.withValues(alpha: 0.3)),
                      const SizedBox(height: 16),
                      const Text('Chưa có ngân sách nào', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                      const SizedBox(height: 8),
                      const Text('Nhấn + để tạo ngân sách mới', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    ]))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _budgets.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final b = _budgets[i];
                        final pct = b.percentage.clamp(0.0, 100.0);
                        final color = _progressColor(b.percentage);
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                              Row(mainAxisSize: MainAxisSize.min, children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(9)),
                                  child: Center(child: Text(b.categoryIcon, style: const TextStyle(fontSize: 18))),
                                ),
                                const SizedBox(width: 10),
                                Text(b.categoryName, style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                              ]),
                              Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(
                                  b.percentage >= 100 ? Icons.error_rounded : b.percentage >= 80 ? Icons.warning_rounded : Icons.check_circle_rounded,
                                  size: 16, color: color,
                                ),
                                const SizedBox(width: 4),
                                Text('${b.percentage.toStringAsFixed(1)}%', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
                              ]),
                            ]),
                            const SizedBox(height: 10),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(value: pct / 100, minHeight: 8, backgroundColor: const Color(0xFFF1F5F9), color: color),
                            ),
                            const SizedBox(height: 8),
                            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                              Text(_fmt.format(b.spentAmount), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
                              Text('/ ${_fmt.format(b.limitAmount)}', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                            ]),
                          ]),
                        );
                      },
                    ),
            ),
    );
  }
}
