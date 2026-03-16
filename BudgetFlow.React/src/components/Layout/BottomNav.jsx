import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingDown, TrendingUp, Target, BarChart3, Users } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tổng quan', exact: true },
  { path: '/expenses', icon: TrendingDown, label: 'Chi tiêu' },
  { path: '/incomes', icon: TrendingUp, label: 'Thu nhập' },
  { path: '/budgets', icon: Target, label: 'Ngân sách' },
  { path: '/reports', icon: BarChart3, label: 'Báo cáo' },
  { path: '/groups', icon: Users, label: 'Nhóm' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label, exact }) => (
        <NavLink
          key={path}
          to={path}
          end={exact}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
