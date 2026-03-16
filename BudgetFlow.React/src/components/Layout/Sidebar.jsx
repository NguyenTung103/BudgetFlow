import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import {
  LayoutDashboard, TrendingDown, TrendingUp, Target, BarChart3,
  Users, User, LogOut, Wallet, ChevronDown, X
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tổng quan', exact: true },
  { path: '/expenses', icon: TrendingDown, label: 'Chi tiêu' },
  { path: '/incomes', icon: TrendingUp, label: 'Thu nhập' },
  { path: '/budgets', icon: Target, label: 'Ngân sách' },
  { path: '/reports', icon: BarChart3, label: 'Báo cáo' },
  { path: '/groups', icon: Users, label: 'Nhóm' },
  { path: '/profile', icon: User, label: 'Tài khoản' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { groups, activeGroup, selectGroup } = useGroup();
  const navigate = useNavigate();
  const [groupOpen, setGroupOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Wallet size={24} color="#4F46E5" />
          <span>BudgetFlow</span>
        </div>
        <button className="sidebar-close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="group-selector-label">Nhóm đang xem</div>
      <div className="group-selector" onClick={() => setGroupOpen(!groupOpen)}>
        <div className="group-selector-active">
          <div className="group-avatar">{activeGroup?.name?.[0] || 'G'}</div>
          <div className="group-info">
            <span className="group-name">{activeGroup?.name || 'Chọn nhóm'}</span>
            <span className="group-members">{activeGroup?.members?.length || 0} thành viên</span>
          </div>
          <ChevronDown size={16} className={`group-chevron ${groupOpen ? 'open' : ''}`} />
        </div>
        {groupOpen && (
          <div className="group-dropdown">
            <div className="group-dropdown-hint">Chọn nhóm để xem dữ liệu</div>
            {groups.map(g => (
              <div key={g.id}
                className={`group-item ${activeGroup?.id === g.id ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); selectGroup(g); setGroupOpen(false); }}>
                <div className="group-avatar sm">{g.name[0]}</div>
                <div className="group-item-info">
                  <span>{g.name}</span>
                  <span className="group-item-members">{g.members?.length} thành viên</span>
                </div>
                {activeGroup?.id === g.id && <span className="group-item-check">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.fullName?.[0] || 'U'}</div>
          <div>
            <div className="user-name">{user?.fullName}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
