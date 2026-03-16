import React, { useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Profile.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    setLoading(true);
    try {
      const payload = { fullName: form.fullName };
      if (form.currentPassword && form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await api.put('/auth/profile', payload);
      updateUser(data);
      toast.success('Cập nhật thành công!');
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>Tài khoản</h2>
        <p className="page-subtitle">Quản lý thông tin cá nhân</p>
      </div>

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">{user?.fullName?.[0] || 'U'}</div>
            <div>
              <h3>{user?.fullName}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="section-divider">Thông tin cơ bản</div>

            <div className="form-group">
              <label><User size={14} /> Họ và tên</label>
              <input type="text" value={form.fullName}
                onChange={e => setForm({...form, fullName: e.target.value})} />
            </div>

            <div className="form-group">
              <label><Mail size={14} /> Email</label>
              <input type="email" value={user?.email || ''} disabled className="input-disabled" />
            </div>

            <div className="section-divider">Đổi mật khẩu</div>

            <div className="form-group">
              <label><Lock size={14} /> Mật khẩu hiện tại</label>
              <input type="password" placeholder="Nhập mật khẩu hiện tại" value={form.currentPassword}
                onChange={e => setForm({...form, currentPassword: e.target.value})} />
            </div>

            <div className="form-group">
              <label><Lock size={14} /> Mật khẩu mới</label>
              <input type="password" placeholder="Tối thiểu 6 ký tự" value={form.newPassword}
                onChange={e => setForm({...form, newPassword: e.target.value})} />
            </div>

            <div className="form-group">
              <label><Lock size={14} /> Xác nhận mật khẩu mới</label>
              <input type="password" placeholder="Nhập lại mật khẩu mới" value={form.confirmPassword}
                onChange={e => setForm({...form, confirmPassword: e.target.value})} />
            </div>

            <button type="submit" className="btn-save-profile" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Save size={16} /> Lưu thay đổi</>}
            </button>
          </form>
        </div>

        <div className="profile-info-card">
          <h3>Thông tin tài khoản</h3>
          <div className="info-item">
            <span className="info-label">ID</span>
            <span className="info-value">#{user?.id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ngày tạo</span>
            <span className="info-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Trạng thái</span>
            <span className="info-value" style={{color:'#10B981',fontWeight:600}}>Đang hoạt động</span>
          </div>
        </div>
      </div>
    </div>
  );
}
