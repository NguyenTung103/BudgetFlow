import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Info } from 'lucide-react';
import api from '../../api/axios';
import { useGroup } from '../../contexts/GroupContext';
import CustomSelect from '../../components/Common/CustomSelect';
import './Reports.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#84CC16'];

/** Tổng hợp chi tiêu / thu nhập theo từng thành viên */
function MemberBreakdown({ expenses, incomes, members }) {
  if (!members || members.length === 0) return null;

  const rows = members.map(m => {
    const exp = expenses.filter(e => Number(e.userId) === Number(m.userId)).reduce((s, e) => s + e.amount, 0);
    const inc = incomes.filter(i => Number(i.userId) === Number(m.userId)).reduce((s, i) => s + i.amount, 0);
    return { ...m, expense: exp, income: inc, balance: inc - exp };
  });

  if (rows.length === 0) return null;

  const totalExp = rows.reduce((s, r) => s + r.expense, 0);

  const activeRows = rows.filter(r => r.expense > 0 || r.income > 0);
  const chartData = activeRows.map(r => ({
    name: r.fullName?.split(' ').pop() || r.fullName,
    'Chi tiêu': r.expense,
    'Thu nhập': r.income,
  }));

  return (
    <div className="report-card">
      <div className="member-breakdown-header">
        <Users size={18} color="#4F46E5" />
        <h3>Thống kê theo thành viên</h3>
      </div>

      <div className="member-stats-grid">
        {rows.map((r, i) => (
          <div key={r.userId} className={`member-stat-card${r.expense === 0 && r.income === 0 ? ' no-data' : ''}`}>
            <div className="member-stat-top">
              <div className="member-avatar-report" style={{ background: COLORS[i % COLORS.length] }}>
                {r.fullName?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="member-stat-name">{r.fullName}</div>
                <div className="member-stat-pct">
                  {r.expense === 0 && r.income === 0
                    ? 'Chưa có dữ liệu'
                    : `${totalExp > 0 ? ((r.expense / totalExp) * 100).toFixed(0) : 0}% chi tiêu nhóm`}
                </div>
              </div>
            </div>
            <div className="member-stat-amounts">
              <div className="member-stat-row">
                <span>Chi tiêu</span>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>{fmt(r.expense)}</span>
              </div>
              <div className="member-stat-row">
                <span>Thu nhập</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>{fmt(r.income)}</span>
              </div>
              <div className="member-stat-row member-stat-balance">
                <span>Số dư</span>
                <span style={{ color: r.balance >= 0 ? '#4F46E5' : '#F59E0B', fontWeight: 700 }}>
                  {fmt(r.balance)}
                </span>
              </div>
            </div>
            <div className="member-expense-bar">
              <div
                className="member-expense-fill"
                style={{
                  width: `${totalExp > 0 ? (r.expense / totalExp) * 100 : 0}%`,
                  background: COLORS[i % COLORS.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {activeRows.length > 1 && (
        <ResponsiveContainer width="100%" height={200} style={{ marginTop: 16 }}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${(v/1e3).toFixed(0)}K`} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Bar dataKey="Chi tiêu" fill="#EF4444" radius={[4,4,0,0]} />
            <Bar dataKey="Thu nhập" fill="#10B981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { activeGroup } = useGroup();
  const [period, setPeriod]   = useState('month');
  const [month, setMonth]     = useState(new Date().getMonth() + 1);
  const [year, setYear]       = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchReports = useCallback(async () => {
    if (!activeGroup) return;
    setLoading(true);
    try {
      let from, to;
      if (period === 'month') {
        from = startOfMonth(new Date(year, month - 1));
        to   = endOfMonth(new Date(year, month - 1));
        to.setHours(23, 59, 59, 999);
      } else if (period === 'week') {
        from = startOfWeek(new Date(), { weekStartsOn: 1 });
        to   = endOfWeek(new Date(), { weekStartsOn: 1 });
        to.setHours(23, 59, 59, 999);
      } else {
        from = new Date(year, 0, 1, 0, 0, 0, 0);
        to   = new Date(year, 11, 31, 23, 59, 59, 999);
      }

      const [summaryRes, monthlyRes, expensesRes, incomesRes] = await Promise.all([
        api.get('/reports/summary', {
          params: { groupId: activeGroup.id, from: from.toISOString(), to: to.toISOString() }
        }),
        api.get('/reports/monthly', {
          params: { groupId: activeGroup.id, month, year }
        }),
        // Lấy toàn bộ chi tiêu của nhóm (không lọc userId) để tính theo thành viên
        api.get('/expenses', {
          params: { groupId: activeGroup.id, from: from.toISOString(), to: to.toISOString() }
        }),
        api.get('/incomes', {
          params: { groupId: activeGroup.id, from: from.toISOString(), to: to.toISOString() }
        }),
      ]);

      setSummary(summaryRes.data);
      setMonthly(monthlyRes.data);
      setExpenses(expensesRes.data);
      setIncomes(incomesRes.data);
    } catch (err) {
      console.error('Lỗi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup, period, month, year]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const dailyChartData = summary?.dailyTotals?.map(d => ({
    date: format(new Date(d.date), 'dd/MM'),
    'Thu nhập': d.income,
    'Chi tiêu': d.expense,
  })) || [];

  const expensePieData = summary?.expenseByCategory?.slice(0, 7).map(c => ({
    name: `${c.categoryIcon || ''} ${c.categoryName}`,
    value: c.amount
  })) || [];

  const incomePieData = summary?.incomeByCategory?.slice(0, 7).map(c => ({
    name: `${c.categoryIcon || ''} ${c.categoryName}`,
    value: c.amount
  })) || [];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h2>Báo cáo tài chính</h2>
          <p className="page-subtitle">
            Nhóm: <strong style={{ color: 'var(--primary)' }}>{activeGroup?.name}</strong>
            {' · '}{activeGroup?.members?.length || 0} thành viên
          </p>
        </div>
        <div className="report-filters">
          <CustomSelect
            value={period}
            onChange={val => setPeriod(val)}
            options={[
              { value: 'week',  label: 'Tuần này' },
              { value: 'month', label: 'Theo tháng' },
              { value: 'year',  label: 'Theo năm' },
            ]}
            className="period-select"
          />
          {period !== 'week' && (
            <>
              {period === 'month' && (
                <CustomSelect
                  value={month}
                  onChange={val => setMonth(Number(val))}
                  options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))}
                  className="month-select"
                />
              )}
              <input
                type="number" value={year} min="2020" max="2030"
                onChange={e => setYear(parseInt(e.target.value))}
                className="date-input" style={{ width: 90 }}
              />
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : (
        <>
          {/* Thông báo nhóm */}
          {activeGroup?.members?.length > 1 && (
            <div className="group-info-banner">
              <Info size={15} />
              <span>
                Dữ liệu hiển thị cho nhóm <strong>{activeGroup.name}</strong>.
                Tất cả thành viên cần nhập chi tiêu vào cùng nhóm này để xem được dữ liệu của nhau.
              </span>
            </div>
          )}

          {/* Tóm tắt */}
          <div className="report-stats">
            <div className="report-stat income">
              <div className="report-stat-label">Thu nhập</div>
              <div className="report-stat-value">{fmt(summary?.totalIncome || 0)}</div>
            </div>
            <div className="report-stat expense">
              <div className="report-stat-label">Chi tiêu</div>
              <div className="report-stat-value">{fmt(summary?.totalExpense || 0)}</div>
            </div>
            <div className={`report-stat ${(summary?.balance || 0) >= 0 ? 'balance-pos' : 'balance-neg'}`}>
              <div className="report-stat-label">Số dư</div>
              <div className="report-stat-value">{fmt(summary?.balance || 0)}</div>
            </div>
            <div className="report-stat rate">
              <div className="report-stat-label">Tỉ lệ tiết kiệm</div>
              <div className="report-stat-value">
                {summary?.totalIncome > 0
                  ? `${((summary.balance / summary.totalIncome) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Biến động theo ngày */}
          <div className="report-card">
            <h3>Biến động thu chi theo ngày</h3>
            {dailyChartData.some(d => d['Thu nhập'] > 0 || d['Chi tiêu'] > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${(v/1e3).toFixed(0)}K`}
                  />
                  <Tooltip formatter={v => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="Thu nhập" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Chi tiêu" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Chưa có dữ liệu trong khoảng thời gian này</div>
            )}
          </div>

          {/* Thống kê theo thành viên */}
          <MemberBreakdown
            expenses={expenses}
            incomes={incomes}
            members={activeGroup?.members || []}
          />

          <div className="report-grid-2">
            {/* Chi tiêu theo danh mục */}
            <div className="report-card">
              <h3>Chi tiêu theo danh mục</h3>
              {expensePieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="40%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        dataKey="value"
                      >
                        {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="category-breakdown">
                    {summary?.expenseByCategory?.slice(0, 7).map((c, i) => (
                      <div key={i} className="breakdown-item">
                        <div className="breakdown-left">
                          <span className="breakdown-dot" style={{ background: COLORS[i % COLORS.length] }} />
                          <span>{c.categoryIcon} {c.categoryName}</span>
                        </div>
                        <div className="breakdown-right">
                          <span className="breakdown-amount">{fmt(c.amount)}</span>
                          <span className="breakdown-pct">{c.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="chart-empty">Chưa có dữ liệu chi tiêu</div>}
            </div>

            {/* Thu nhập theo danh mục */}
            <div className="report-card">
              <h3>Thu nhập theo danh mục</h3>
              {incomePieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="40%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        dataKey="value"
                      >
                        {incomePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="category-breakdown">
                    {summary?.incomeByCategory?.slice(0, 7).map((c, i) => (
                      <div key={i} className="breakdown-item">
                        <div className="breakdown-left">
                          <span className="breakdown-dot" style={{ background: COLORS[i % COLORS.length] }} />
                          <span>{c.categoryIcon} {c.categoryName}</span>
                        </div>
                        <div className="breakdown-right">
                          <span className="breakdown-amount">{fmt(c.amount)}</span>
                          <span className="breakdown-pct">{c.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="chart-empty">Chưa có dữ liệu thu nhập</div>}
            </div>
          </div>

          {/* Trạng thái ngân sách */}
          {monthly?.budgetStatuses?.length > 0 && (
            <div className="report-card">
              <h3>Trạng thái ngân sách tháng {month}/{year}</h3>
              <div className="budget-status-table">
                {monthly.budgetStatuses.map((b, i) => (
                  <div key={i} className={`budget-status-row ${b.isExceeded ? 'exceeded' : ''}`}>
                    <div className="bs-cat">{b.categoryIcon} {b.categoryName}</div>
                    <div className="bs-bar">
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${b.percentage >= 100 ? 'over' : b.percentage >= 80 ? 'warn' : ''}`}
                          style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="bs-amounts">
                      <span style={{ color: b.isExceeded ? '#EF4444' : 'var(--gray-700)' }}>{fmt(b.spentAmount)}</span>
                      <span style={{ color: 'var(--gray-400)' }}> / {fmt(b.limitAmount)}</span>
                    </div>
                    <div className={`bs-pct ${b.percentage >= 100 ? 'over' : b.percentage >= 80 ? 'warn' : 'ok'}`}>
                      {b.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
