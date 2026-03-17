import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/group_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _summary;
  bool _loading = true;
  final _fmt = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
  int? _lastGroupId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchData());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final groupId = context.read<GroupProvider>().activeGroup?.id;
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
    final from = DateTime(now.year, now.month, 1);
    final to = DateTime(now.year, now.month + 1, 0, 23, 59, 59);
    setState(() => _loading = true);
    try {
      final res = await _api.dio.get('/reports/summary', queryParameters: {
        'groupId': group.id,
        'from': from.toIso8601String(),
        'to': to.toIso8601String(),
      });
      setState(() { _summary = res.data; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final group = context.watch<GroupProvider>().activeGroup;
    final user = context.watch<AuthProvider>().user;
    final now = DateTime.now();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Xin chào, ${user?.fullName.split(' ').last ?? ''}!', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text('Tháng ${now.month}/${now.year}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w400)),
          ],
        ),
        actions: [
          if (group != null)
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(20)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.group_outlined, size: 14, color: AppTheme.primary),
                    const SizedBox(width: 4),
                    Text(group.name, style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                  ]),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textSecondary),
            tooltip: 'Làm mới',
            onPressed: _fetchData,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stat cards
                    Row(children: [
                      _StatCard(title: 'Thu nhập', value: (_summary?['totalIncome'] ?? 0).toDouble(), color: AppTheme.success, icon: Icons.trending_up, fmt: _fmt),
                      const SizedBox(width: 12),
                      _StatCard(title: 'Chi tiêu', value: (_summary?['totalExpense'] ?? 0).toDouble(), color: AppTheme.danger, icon: Icons.trending_down, fmt: _fmt),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _StatCard(title: 'Số dư', value: (_summary?['balance'] ?? 0).toDouble(), color: AppTheme.primary, icon: Icons.account_balance_wallet, fmt: _fmt),
                      const SizedBox(width: 12),
                      _StatCard(title: 'Tiết kiệm', value: ((_summary?['balance'] ?? 0) as num).toDouble().clamp(0, double.infinity), color: AppTheme.warning, icon: Icons.savings, fmt: _fmt),
                    ]),
                    const SizedBox(height: 20),
                    // Bar chart
                    if (_summary?['dailyTotals'] != null) ...[
                      const Text('Thu chi theo ngày', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                      const SizedBox(height: 12),
                      _DailyBarChart(dailyTotals: _summary!['dailyTotals'] as List),
                      const SizedBox(height: 20),
                    ],
                    // Pie chart
                    if ((_summary?['expenseByCategory'] as List?)?.isNotEmpty == true) ...[
                      const Text('Chi tiêu theo danh mục', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                      const SizedBox(height: 12),
                      _CategoryPieChart(categories: _summary!['expenseByCategory'] as List, fmt: _fmt),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final double value;
  final Color color;
  final IconData icon;
  final NumberFormat fmt;

  const _StatCard({required this.title, required this.value, required this.color, required this.icon, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: color, width: 4)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.textSecondary)),
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 16),
              ),
            ]),
            const SizedBox(height: 8),
            Text(fmt.format(value), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

class _DailyBarChart extends StatelessWidget {
  final List dailyTotals;

  const _DailyBarChart({required this.dailyTotals});

  @override
  Widget build(BuildContext context) {
    final data = dailyTotals.where((d) => (d['income'] as num) > 0 || (d['expense'] as num) > 0).toList();
    if (data.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: data.map((d) => (d['income'] as num).toDouble()).reduce((a, b) => a > b ? a : b) * 1.2,
          barGroups: List.generate(data.length > 15 ? 15 : data.length, (i) {
            final d = data[i];
            return BarChartGroupData(x: i, barRods: [
              BarChartRodData(toY: (d['income'] as num).toDouble(), color: AppTheme.success, width: 6, borderRadius: BorderRadius.circular(4)),
              BarChartRodData(toY: (d['expense'] as num).toDouble(), color: AppTheme.danger, width: 6, borderRadius: BorderRadius.circular(4)),
            ]);
          }),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 44, getTitlesWidget: (v, _) {
              if (v >= 1e6) return Text('${(v / 1e6).toStringAsFixed(0)}M', style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary));
              if (v >= 1e3) return Text('${(v / 1e3).toStringAsFixed(0)}K', style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary));
              return Text(v.toInt().toString(), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary));
            })),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) => const FlLine(color: Color(0xFFF1F5F9), strokeWidth: 1)),
          borderData: FlBorderData(show: false),
        ),
      ),
    );
  }
}

class _CategoryPieChart extends StatelessWidget {
  final List categories;
  final NumberFormat fmt;

  const _CategoryPieChart({required this.categories, required this.fmt});

  static const colors = [Color(0xFF4F46E5), Color(0xFF10B981), Color(0xFFF59E0B), Color(0xFFEF4444), Color(0xFF8B5CF6), Color(0xFF06B6D4)];

  @override
  Widget build(BuildContext context) {
    final data = categories.take(6).toList();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Column(
        children: [
          SizedBox(
            height: 180,
            child: PieChart(PieChartData(
              sections: List.generate(data.length, (i) {
                final c = data[i];
                return PieChartSectionData(
                  value: (c['amount'] as num).toDouble(),
                  color: colors[i % colors.length],
                  title: '${(c['percentage'] as num).toStringAsFixed(0)}%',
                  titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                  radius: 65,
                );
              }),
              sectionsSpace: 2,
              centerSpaceRadius: 35,
            )),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12, runSpacing: 8,
            children: List.generate(data.length, (i) {
              final c = data[i];
              return Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 10, height: 10, decoration: BoxDecoration(color: colors[i % colors.length], shape: BoxShape.circle)),
                const SizedBox(width: 6),
                Text('${c['categoryIcon'] ?? ''} ${c['categoryName']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ]);
            }),
          ),
        ],
      ),
    );
  }
}
