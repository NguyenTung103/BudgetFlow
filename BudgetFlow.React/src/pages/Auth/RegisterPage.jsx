import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, User, Mail, Lock, Eye, EyeOff, TrendingUp, Shield, Users, BarChart3 } from 'lucide-react';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">

        {/* LEFT — Branding */}
        <div className="auth-branding">
          <div className="brand-logo">
            <div className="brand-logo-icon">
              <Wallet size={22} color="white" />
            </div>
            <span>BudgetFlow</span>
          </div>

          <div className="brand-body">
            <div className="brand-badge">
              <TrendingUp size={12} />
              Miễn phí hoàn toàn
            </div>
            <h2>Bắt đầu hành trình<br />tài chính của bạn</h2>
            <p>Tạo tài khoản miễn phí và bắt đầu quản lý tài chính nhóm một cách thông minh ngay hôm nay.</p>
            <div className="brand-features">
              {[
                { icon: <TrendingUp size={15} />, text: 'Theo dõi thu nhập & chi tiêu' },
                { icon: <BarChart3 size={15} />, text: 'Báo cáo & biểu đồ trực quan' },
                { icon: <Users size={15} />, text: 'Chia sẻ dữ liệu nhóm' },
                { icon: <Shield size={15} />, text: 'Bảo mật dữ liệu tuyệt đối' },
              ].map((f, i) => (
                <div className="brand-feature" key={i}>
                  <div className="brand-feature-icon">{f.icon}</div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          <div className="brand-stats">
            <div className="brand-stat">
              <div className="brand-stat-label">Người dùng</div>
              <div className="brand-stat-value">10,000+</div>
              <div className="brand-stat-trend">↑ Đang tăng</div>
            </div>
            <div className="brand-stat">
              <div className="brand-stat-label">Đánh giá</div>
              <div className="brand-stat-value">★ 4.9/5</div>
              <div className="brand-stat-trend">↑ Xuất sắc</div>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-logo">
              <div className="auth-card-logo-icon">
                <Wallet size={20} color="white" />
              </div>
              <span>BudgetFlow</span>
            </div>
            <h2>Tạo tài khoản mới</h2>
            <p>Đăng ký miễn phí và bắt đầu quản lý tài chính ngay</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Họ và tên</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input type="text" placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  required />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input type="email" placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input type={showPass ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required minLength={6} />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input type={showPass ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  required />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="auth-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
