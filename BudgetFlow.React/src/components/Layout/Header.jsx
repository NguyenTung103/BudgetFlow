import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, CheckCheck, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import { useSignalR } from '../../contexts/SignalRContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './Header.css';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { activeGroup, groups, selectGroup } = useGroup();
  const { connected, on } = useSignalR();
  const navigate = useNavigate();
  const [groupOpen, setGroupOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const groupRef = useRef(null);
  const userRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (groupRef.current && !groupRef.current.contains(e.target)) setGroupOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const off = on('BudgetAlert', () => fetchNotifications());
    return off;
  }, [on]);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch {}
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}><Menu size={22} /></button>
        <div className="header-title">
          <h1>BudgetFlow</h1>
          <div className={`sync-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <span className="sync-dot"></span>
            <span>{connected ? 'Đang đồng bộ' : 'Mất kết nối'}</span>
          </div>
        </div>
        {groups.length > 1 && (
          <div className="header-group-switcher" ref={groupRef}>
            <button className="header-group-btn" onClick={() => setGroupOpen(!groupOpen)}>
              <div className="header-group-avatar">{activeGroup?.name?.[0] || 'G'}</div>
              <span className="header-group-name">{activeGroup?.name}</span>
              <ChevronDown size={14} className={groupOpen ? 'rotate-180' : ''} />
            </button>
            {groupOpen && (
              <div className="header-group-dropdown">
                <div className="header-group-hint">Chuyển nhóm để xem dữ liệu</div>
                {groups.map(g => (
                  <div key={g.id}
                    className={`header-group-item ${activeGroup?.id === g.id ? 'active' : ''}`}
                    onClick={() => { selectGroup(g); setGroupOpen(false); }}>
                    <div className="header-group-dot">{g.name[0]}</div>
                    <div>
                      <div>{g.name}</div>
                      <div className="header-group-sub">{g.members?.length} thành viên</div>
                    </div>
                    {activeGroup?.id === g.id && <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="notif-wrapper" ref={notifRef}>
          <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="mark-all-btn">
                    <CheckCheck size={14} /> Đọc tất cả
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Không có thông báo</div>
                ) : notifications.slice(0, 20).map(n => (
                  <div key={n.id} className={`notif-item notif-${n.type} ${!n.isRead ? 'unread' : ''}`}>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-wrapper" ref={userRef}>
          <button className="user-chip" onClick={() => setUserOpen(!userOpen)}>
            <div className="user-avatar-sm">{user?.fullName?.[0] || 'U'}</div>
            <span>{user?.fullName}</span>
            <ChevronDown size={13} className={`user-chevron ${userOpen ? 'open' : ''}`} />
          </button>

          {userOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-info">
                <div className="user-dropdown-avatar">{user?.fullName?.[0] || 'U'}</div>
                <div>
                  <div className="user-dropdown-name">{user?.fullName}</div>
                  <div className="user-dropdown-email">{user?.email}</div>
                </div>
              </div>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item" onClick={() => { navigate('/profile'); setUserOpen(false); }}>
                <User size={15} />
                Tài khoản của tôi
              </button>
              <button className="user-dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
