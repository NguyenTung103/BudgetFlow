import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, Mail, Lock, Eye, EyeOff, TrendingUp, Shield, Users, BarChart3 } from 'lucide-react';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
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
              Nền tảng tài chính #1
            </div>
            <h2>Kiểm soát tài chính<br />trong tầm tay bạn</h2>
            <p>Theo dõi thu chi, thiết lập ngân sách và đồng bộ dữ liệu theo thời gian thực với nhóm của bạn.</p>
            <div className="brand-features">
              {[
                { icon: <TrendingUp size={15} />, text: 'Theo dõi thu nhập & chi tiêu' },
                { icon: <BarChart3 size={15} />, text: 'Báo cáo & biểu đồ trực quan' },
                { icon: <Users size={15} />, text: 'Quản lý tài chính nhóm' },
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
              <div className="brand-stat-label">Thu nhập tháng này</div>
              <div className="brand-stat-value">12,500,000 ₫</div>
              <div className="brand-stat-trend">↑ 8.2%</div>
            </div>
            <div className="brand-stat">
              <div className="brand-stat-label">Tiết kiệm được</div>
              <div className="brand-stat-value">3,200,000 ₫</div>
              <div className="brand-stat-trend">↑ 5.1%</div>
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
            <h2>Chào mừng trở lại 👋</h2>
            <p>Đăng nhập để tiếp tục quản lý tài chính của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Đăng nhập'}
            </button>
          </form>

          <p className="auth-footer">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
