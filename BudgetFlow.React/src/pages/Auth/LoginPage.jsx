import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
      toast.error(err.response?.data?.message || 'Dang nhap that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Wallet size={36} color="#4F46E5" />
          <h1>BudgetFlow</h1>
          <p>Quan ly tai chinh thong minh</p>
        </div>

        <h2 className="auth-title">Dang nhap</h2>

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
            <label>Mat khau</label>
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
            {loading ? <span className="spinner" /> : 'Dang nhap'}
          </button>
        </form>

        <p className="auth-footer">
          Chua co tai khoan? <Link to="/register">Dang ky ngay</Link>
        </p>
      </div>

      <div className="auth-illustration">
        <div className="illustration-content">
          <h2>Quan ly tai chinh nhom</h2>
          <p>Theo doi thu chi, thiet lap ngan sach va dong bo du lieu theo thoi gian thuc voi nhom cua ban.</p>
          <div className="feature-list">
            <div className="feature-item">&#10003; Theo doi thu nhap &amp; chi tieu</div>
            <div className="feature-item">&#10003; Quan ly ngan sach theo danh muc</div>
            <div className="feature-item">&#10003; Dong bo thoi gian thuc</div>
            <div className="feature-item">&#10003; Bao cao truc quan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
