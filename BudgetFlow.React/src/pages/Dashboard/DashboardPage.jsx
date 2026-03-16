import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Target, Plus, ArrowRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../../api/axios';
import { useGroup } from '../../contexts/GroupContext';
import { useSignalR } from '../../contexts/SignalRContext';
import GroupBanner from '../../components/Common/GroupBanner';
import './Dashboard.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="stat-card" style={{ '--accent': color }}>
      <div className="stat-card-header">
        <span className="stat-label">{title}</span>
        <div className="stat-icon" style={{ background: color + '20', color }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-value">{fmt(value)}</div>
    </div>
  );
}

const COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#84CC16'];

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const { activeGroup } = useGroup();
  const { on } = useSignalR();
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const fetchData = useCallback(async () => {
    if (!activeGroup) return;
    setLoading(true);
    try {
      const [summaryRes, expensesRes, incomesRes, budgetsRes] = await Promise.all([
        api.get('/reports/summary', { params: {
          groupId: activeGroup.id,
          from: from.toISOString(),
          to: to.toISOString()
        }}),
        api.get('/expenses', { params: {
          groupId: activeGroup.id,
          from: from.toISOString(),
          to: to.toISOString()
        }}),
        api.get('/incomes', { params: {
          groupId: activeGroup.id,
          from: from.toISOString(),
          to: to.toISOString()
        }}),
        api.get('/budgets', { params: {
          groupId: activeGroup.id,
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }})
      ]);
      setSummary(summaryRes.data);
      setRecentExpenses(expensesRes.data.slice(0, 5));
      setRecentIncomes(incomesRes.data.slice(0, 5));
      setBudgets(budgetsRes.data.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const offs = [
      on('ExpenseCreated', fetchData),
      on('ExpenseUpdated', fetchData),
      on('ExpenseDeleted', fetchData),
      on('IncomeCreated', fetchData),
      on('IncomeUpdated', fetchData),
      on('IncomeDeleted', fetchData),
    ];
    return () => offs.forEach(f => f && f());
  }, [on, fetchData]);

  if (loading) return (
    <div className="page-loading"><div className="spinner-lg" /></div>
  );

  const dailyData = (summary?.dailyTotals || [])
    .filter((_, i) => i % 2 === 0)
    .map(d => ({
      date: format(new Date(d.date), 'dd/MM'),
      'Thu nhập': d.income,
      'Chi tiêu': d.expense,
    }));

  const pieData = (summary?.expenseByCategory || []).slice(0, 6).map(c => ({
    name: `${c.categoryIcon || ''} ${c.categoryName}`,
    value: c.amount,
  }));

  const recentAll = [
    ...recentExpenses.map(e => ({ ...e, txnType: 'expense' })),
    ...recentIncomes.map(i => ({ ...i, txnType: 'income' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="dashboard">
      <GroupBanner />
      <div className="page-header">
        <div>
          <h2>Tổng quan tháng {format(now, 'MM/yyyy')}</h2>
          <p className="page-subtitle">Nhóm: {activeGroup?.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/expenses" className="btn-outline"><Plus size={16} /> Chi tiêu</Link>
          <Link to="/incomes" className="btn-primary-sm"><Plus size={16} /> Thu nhập</Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Thu nhập" value={summary?.totalIncome || 0} icon={TrendingUp} color="#10B981" />
        <StatCard title="Chi tiêu" value={summary?.totalExpense || 0} icon={TrendingDown} color="#EF4444" />
        <StatCard title="Số dư" value={summary?.balance || 0} icon={Wallet} color="#4F46E5" />
        <StatCard
          title="Ngân sách đã dùng"
          value={budgets.reduce((a, b) => a + b.spentAmount, 0)}
          icon={Target}
          color="#F59E0B"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>Thu chi theo ngày</h3></div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <BarChart data={dailyData} margin={{ top: 5, right: 8, bottom: 5, left: isMobile ? -10 : 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: isMobile ? 9 : 11 }} interval={isMobile ? 2 : 0} />
              <YAxis
                width={isMobile ? 45 : 55}
                tick={{ fontSize: isMobile ? 9 : 11 }}
                tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${(v/1e3).toFixed(0)}K`}
              />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13 }} />
              <Bar dataKey="Thu nhập" fill="#10B981" radius={[4,4,0,0]} />
              <Bar dataKey="Chi tiêu" fill="#EF4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Chi tiêu theo danh mục</h3></div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx={isMobile ? "50%" : "40%"} cy="50%"
                  innerRadius={isMobile ? 40 : 55}
                  outerRadius={isMobile ? 65 : 85}
                  dataKey="value" nameKey="name"
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
                <Legend layout={isMobile ? "horizontal" : "vertical"} align={isMobile ? "center" : "right"} verticalAlign={isMobile ? "bottom" : "middle"} wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Chưa có dữ liệu</div>}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Ngân sách tháng này</h3>
            <Link to="/budgets" className="card-link">Xem tất cả <ArrowRight size={14} /></Link>
          </div>
          <div className="budget-list">
            {budgets.length === 0 ? (
              <div className="empty-state">
                <Target size={32} color="#94A3B8" />
                <p>Chưa có ngân sách</p>
                <Link to="/budgets"><button className="btn-sm">Tạo ngân sách</button></Link>
              </div>
            ) : budgets.map(b => (
              <div key={b.id} className="budget-item">
                <div className="budget-item-header">
                  <span>{b.categoryIcon} {b.categoryName}</span>
                  <span className={b.percentage >= 100 ? 'over' : b.percentage >= 80 ? 'warn' : ''}>
                    {fmt(b.spentAmount)} / {fmt(b.limitAmount)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${b.percentage >= 100 ? 'over' : b.percentage >= 80 ? 'warn' : ''}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
                <div className="budget-pct">{b.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Giao dịch gần đây</h3>
            <Link to="/expenses" className="card-link">Xem tất cả <ArrowRight size={14} /></Link>
          </div>
          <div className="transactions-list">
            {recentAll.length === 0 ? (
              <div className="empty-state">
                <Wallet size={32} color="#94A3B8" />
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : recentAll.map((t, i) => (
              <div key={i} className="transaction-item">
                <div className="txn-icon">{t.categoryIcon}</div>
                <div className="txn-info">
                  <div className="txn-desc">{t.description || t.categoryName}</div>
                  <div className="txn-meta">{t.userFullName} · {format(new Date(t.date), 'dd/MM/yyyy')}</div>
                </div>
                <div className={`txn-amount ${t.txnType}`}>
                  {t.txnType === 'expense' ? '-' : '+'}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
