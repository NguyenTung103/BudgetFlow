import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../providers/group_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _summary;
  bool _loading = true;
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;
  final _fmt = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
  String? _lastGroupId;

  static const _colors = [Color(0xFF4F46E5), Color(0xFF10B981), Color(0xFFF59E0B), Color(0xFFEF4444), Color(0xFF8B5CF6), Color(0xFF06B6D4)];

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
      final from = DateTime(_year, _month, 1);
      final to = DateTime(_year, _month + 1, 0, 23, 59, 59);
      final res = await _api.dio.get('/reports/summary', queryParameters: {
        'groupId': group.id, 'from': from.toIso8601String(), 'to': to.toIso8601String(),
      });
      setState(() { _summary = res.data; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Báo cáo'),
        actions: [
          DropdownButton<int>(
            value: _month, underline: const SizedBox(),
            items: List.generate(12, (i) => DropdownMenuItem(value: i + 1, child: Text('T${i + 1}'))),
            onChanged: (v) { if (v != null) { setState(() => _month = v); _fetchData(); } },
          ),
          const SizedBox(width: 4),
          DropdownButton<int>(
            value: _year, underline: const SizedBox(),
            items: [2024, 2025, 2026].map((y) => DropdownMenuItem(value: y, child: Text('$y'))).toList(),
            onChanged: (v) { if (v != null) { setState(() => _year = v); _fetchData(); } },
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Summary cards
                  Row(children: [
                    _SummaryCard(title: 'Thu nhập', value: (_summary?['totalIncome'] ?? 0).toDouble(), color: AppTheme.success, fmt: _fmt),
                    const SizedBox(width: 10),
                    _SummaryCard(title: 'Chi tiêu', value: (_summary?['totalExpense'] ?? 0).toDouble(), color: AppTheme.danger, fmt: _fmt),
                    const SizedBox(width: 10),
                    _SummaryCard(title: 'Số dư', value: (_summary?['balance'] ?? 0).toDouble(), color: AppTheme.primary, fmt: _fmt),
                  ]),
                  const SizedBox(height: 20),
                  // Pie chart expense
                  if ((_summary?['expenseByCategory'] as List?)?.isNotEmpty == true) ...[
                    const Text('Chi tiêu theo danh mục', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    _buildPieChart(_summary!['expenseByCategory'] as List),
                    const SizedBox(height: 20),
                  ],
                  // Pie chart income
                  if ((_summary?['incomeByCategory'] as List?)?.isNotEmpty == true) ...[
                    const Text('Thu nhập theo danh mục', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    _buildPieChart(_summary!['incomeByCategory'] as List),
                  ],
                ]),
              ),
            ),
    );
  }

  Widget _buildPieChart(List data) {
    final items = data.take(6).toList();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Column(children: [
        SizedBox(
          height: 180,
          child: PieChart(PieChartData(
            sections: List.generate(items.length, (i) => PieChartSectionData(
              value: (items[i]['amount'] as num).toDouble(),
              color: _colors[i % _colors.length],
              title: '${(items[i]['percentage'] as num).toStringAsFixed(0)}%',
              titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
              radius: 60,
            )),
            sectionsSpace: 2, centerSpaceRadius: 35,
          )),
        ),
        const SizedBox(height: 12),
        ...List.generate(items.length, (i) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: _colors[i % _colors.length], shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Expanded(child: Text('${items[i]['categoryIcon'] ?? ''} ${items[i]['categoryName']}', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
            Text(_fmt.format((items[i]['amount'] as num).toDouble()), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
          ]),
        )),
      ]),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final double value;
  final Color color;
  final NumberFormat fmt;

  const _SummaryCard({required this.title, required this.value, required this.color, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border(top: BorderSide(color: color, width: 3))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          Text(fmt.format(value), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color), maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}
