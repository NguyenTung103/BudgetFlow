import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
      toast.error('Mat khau xac nhan khong khop');
      return;
    }
    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password);
      toast.success('Dang ky thanh cong!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dang ky that bai');
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
          <p>Tao tai khoan mien phi</p>
        </div>

        <h2 className="auth-title">Dang ky</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Ho va ten</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input type="text" placeholder="Nguyen Van A" value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input type="email" placeholder="email@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Mat khau</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} placeholder="Toi thieu 6 ky tu"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required minLength={6} />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Xac nhan mat khau</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} placeholder="Nhap lai mat khau"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                required />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Tao tai khoan'}
          </button>
        </form>

        <p className="auth-footer">
          Da co tai khoan? <Link to="/login">Dang nhap</Link>
        </p>
      </div>

      <div className="auth-illustration">
        <div className="illustration-content">
          <h2>Bat dau ngay hom nay</h2>
          <p>Dang ky mien phi va bat dau quan ly tai chinh nhom cua ban mot cach thong minh.</p>
          <div className="feature-list">
            <div className="feature-item">&#10003; Mien phi hoan toan</div>
            <div className="feature-item">&#10003; Chia se du lieu nhom</div>
            <div className="feature-item">&#10003; Thong bao vuot ngan sach</div>
            <div className="feature-item">&#10003; Bao mat cao</div>
          </div>
        </div>
      </div>
    </div>
  );
}
