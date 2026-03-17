import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/income.dart';
import '../../models/category.dart';
import '../../providers/group_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class IncomesScreen extends StatefulWidget {
  const IncomesScreen({super.key});

  @override
  State<IncomesScreen> createState() => _IncomesScreenState();
}

class _IncomesScreenState extends State<IncomesScreen> {
  final _api = ApiService();
  List<Income> _incomes = [];
  List<Category> _categories = [];
  bool _loading = true;
  final _fmt = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
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
    final now = DateTime.now();
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.dio.get('/incomes', queryParameters: {
          'groupId': group.id,
          'from': DateTime(now.year, now.month, 1).toIso8601String(),
          'to': DateTime(now.year, now.month + 1, 0, 23, 59, 59).toIso8601String(),
        }),
        _api.dio.get('/categories'),
      ]);
      setState(() {
        _incomes = (results[0].data as List).map((e) => Income.fromJson(e)).toList();
        _categories = (results[1].data as List).map((c) => Category.fromJson(c)).where((c) => c.type == 'income').toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _showAddDialog() {
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    int? selectedCategoryId;
    DateTime selectedDate = DateTime.now();

    showModalBottomSheet(
      context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Thêm thu nhập', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              TextField(controller: amountCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Số tiền (₫)', prefixIcon: Icon(Icons.attach_money))),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                decoration: const InputDecoration(labelText: 'Danh mục'),
                items: _categories.map((c) => DropdownMenuItem(value: c.id, child: Text('${c.icon} ${c.name}'))).toList(),
                onChanged: (v) => setModalState(() => selectedCategoryId = v),
              ),
              const SizedBox(height: 12),
              TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Mô tả', prefixIcon: Icon(Icons.notes))),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('Ngày: ${DateFormat('dd/MM/yyyy').format(selectedDate)}'),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(context: ctx, initialDate: selectedDate, firstDate: DateTime(2020), lastDate: DateTime(2030));
                  if (picked != null) setModalState(() => selectedDate = picked);
                },
              ),
              const SizedBox(height: 16),
              SizedBox(width: double.infinity, child: ElevatedButton(
                onPressed: () async {
                  if (amountCtrl.text.isEmpty || selectedCategoryId == null) return;
                  final group = context.read<GroupProvider>().activeGroup!;
                  await _api.dio.post('/incomes', data: {
                    'amount': double.parse(amountCtrl.text.replaceAll(',', '')),
                    'categoryId': selectedCategoryId,
                    'description': descCtrl.text,
                    'date': selectedDate.toIso8601String(),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Thu nhập')),
      floatingActionButton: FloatingActionButton(onPressed: _showAddDialog, backgroundColor: AppTheme.success, child: const Icon(Icons.add, color: Colors.white)),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: _incomes.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.payments_outlined, size: 72, color: AppTheme.textSecondary.withValues(alpha: 0.3)),
                      const SizedBox(height: 16),
                      const Text('Chưa có thu nhập nào', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                      const SizedBox(height: 8),
                      const Text('Nhấn + để thêm thu nhập mới', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    ]))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _incomes.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final e = _incomes[i];
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                          child: Row(children: [
                            Container(width: 42, height: 42, decoration: BoxDecoration(color: AppTheme.background, borderRadius: BorderRadius.circular(10)), child: Center(child: Text(e.categoryIcon, style: const TextStyle(fontSize: 20)))),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(e.description.isNotEmpty ? e.description : e.categoryName, style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                              Text('${e.userFullName} · ${DateFormat('dd/MM/yyyy').format(e.date)}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                            ])),
                            Text('+${_fmt.format(e.amount)}', style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.w700)),
                          ]),
                        );
                      },
                    ),
            ),
    );
  }
}
