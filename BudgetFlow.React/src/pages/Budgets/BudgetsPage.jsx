import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Target, AlertTriangle } from 'lucide-react';
import CustomSelect from '../../components/Common/CustomSelect';
import AmountInput from '../../components/Common/AmountInput';
import api from '../../api/axios';
import { useGroup } from '../../contexts/GroupContext';
import { useSignalR } from '../../contexts/SignalRContext';
import toast from 'react-hot-toast';
import './Budgets.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function BudgetModal({ budget, groupId, categories, month, year, onClose, onSaved }) {
  const [form, setForm] = useState({
    limitAmount: budget?.limitAmount || '',
    categoryId: budget?.categoryId || (categories[0]?.id || ''),
    groupId,
    month,
    year
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, limitAmount: parseFloat(String(form.limitAmount).replace(/\./g, '')) };
      if (budget) {
        await api.put(`/budgets/${budget.id}`, { limitAmount: payload.limitAmount });
        toast.success('Cập nhật ngân sách thành công');
      } else {
        await api.post('/budgets', payload);
        toast.success('Tạo ngân sách thành công');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{budget ? 'Sửa ngân sách' : 'Tạo ngân sách'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {!budget && (
            <div className="form-group">
              <label>Danh mục chi tiêu</label>
              <CustomSelect
                value={form.categoryId}
                onChange={val => setForm({...form, categoryId: val})}
                options={categories.map(c => ({ value: c.id, label: c.name, icon: c.icon, color: c.color }))}
                placeholder="Chọn danh mục..."
              />
            </div>
          )}
          <div className="form-group">
            <label>Hạn mức (VND)</label>
            <AmountInput value={form.limitAmount} onChange={val => setForm({...form, limitAmount: val})} required />
          </div>
          <div className="form-group">
            <label>Tháng/Năm</label>
            <div style={{display:'flex', gap:8}}>
              <CustomSelect
                value={form.month}
                onChange={val => setForm({...form, month: Number(val)})}
                options={Array.from({length:12},(_,i)=>({ value: i+1, label: `Tháng ${i+1}` }))}
              />
              <input type="number" value={form.year} min="2020" max="2030"
                onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                style={{width:90, padding:'9px 12px', border:'1.5px solid var(--gray-200)', borderRadius:8, fontSize:'0.875rem'}} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : (budget ? 'Cập nhật' : 'Tạo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const { activeGroup } = useGroup();
  const { on } = useSignalR();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchBudgets = useCallback(async () => {
    if (!activeGroup) return;
    setLoading(true);
    try {
      const { data } = await api.get('/budgets', { params: { groupId: activeGroup.id, month, year } });
      setBudgets(data);
    } catch {}
    finally { setLoading(false); }
  }, [activeGroup, month, year]);

  useEffect(() => {
    api.get('/categories', { params: { type: 'Expense' } }).then(r => setCategories(r.data));
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  useEffect(() => {
    const offs = [on('BudgetCreated', fetchBudgets), on('BudgetUpdated', fetchBudgets), on('BudgetDeleted', fetchBudgets)];
    return () => offs.forEach(f => f?.());
  }, [on, fetchBudgets]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa ngân sách này?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Đã xóa');
      fetchBudgets();
    } catch { toast.error('Xóa thất bại'); }
  };

  const totalLimit = budgets.reduce((s,b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s,b) => s + b.spentAmount, 0);

  return (
    <div className="budgets-page">
      <div className="page-header">
        <div>
          <h2>Ngân sách</h2>
          <p className="page-subtitle">Tháng {month}/{year} • {budgets.length} danh mục</p>
        </div>
        <button className="btn-add" onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={18} /> Tạo ngân sách
        </button>
      </div>

      {/* Month selector */}
      <div className="month-selector">
        <CustomSelect
          value={month}
          onChange={val => setMonth(Number(val))}
          options={Array.from({length:12},(_,i)=>({ value: i+1, label: `Tháng ${i+1}` }))}
          className="month-select"
        />
        <input type="number" value={year} min="2020" max="2030"
          onChange={e => setYear(parseInt(e.target.value))} className="date-input" style={{width:90}} />
      </div>

      {/* Summary bar */}
      {budgets.length > 0 && (
        <div className="budget-summary-bar">
          <div className="budget-summary-info">
            <span>Tổng chi tiêu: <strong style={{color:'#EF4444'}}>{fmt(totalSpent)}</strong></span>
            <span>Tổng hạn mức: <strong>{fmt(totalLimit)}</strong></span>
            <span>Còn lại: <strong style={{color: totalLimit-totalSpent >= 0 ? '#10B981':'#EF4444'}}>{fmt(totalLimit-totalSpent)}</strong></span>
          </div>
          <div className="progress-bar" style={{height:12}}>
            <div className={`progress-fill ${totalSpent/totalLimit*100 >= 100 ? 'over' : totalSpent/totalLimit*100 >= 80 ? 'warn' : ''}`}
              style={{ width: `${Math.min(totalSpent/totalLimit*100,100)}%` }} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : budgets.length === 0 ? (
        <div className="empty-state card" style={{padding:64}}>
          <Target size={48} color="#CBD5E1" />
          <h3 style={{color:'var(--gray-600)'}}>Chưa có ngân sách</h3>
          <p>Tạo ngân sách để kiểm soát chi tiêu của nhóm</p>
          <button className="btn-add" onClick={() => setShowModal(true)}><Plus size={16}/> Tạo ngân sách</button>
        </div>
      ) : (
        <div className="budgets-grid">
          {budgets.map(b => {
            const pct = Math.min(b.percentage, 100);
            const isOver = b.percentage >= 100;
            const isWarn = b.percentage >= 80 && !isOver;
            return (
              <div key={b.id} className={`budget-card ${isOver ? 'over' : isWarn ? 'warn' : ''}`}>
                <div className="budget-card-header">
                  <div className="budget-cat">
                    <span className="cat-icon-lg" style={{background: b.categoryColor + '20'}}>{b.categoryIcon}</span>
                    <div>
                      <div className="budget-cat-name">{b.categoryName}</div>
                      <div className="budget-period">Tháng {b.month}/{b.year}</div>
                    </div>
                  </div>
                  <div className="budget-card-actions">
                    {(isOver || isWarn) && <AlertTriangle size={16} color={isOver ? '#EF4444' : '#F59E0B'} />}
                    <button onClick={() => { setEditItem(b); setShowModal(true); }} className="action-btn edit"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(b.id)} className="action-btn delete"><Trash2 size={14}/></button>
                  </div>
                </div>

                <div className="budget-amounts">
                  <span className="spent-amount" style={{color: isOver ? '#EF4444' : isWarn ? '#F59E0B' : 'var(--gray-700)'}}>
                    {fmt(b.spentAmount)}
                  </span>
                  <span className="limit-amount">/ {fmt(b.limitAmount)}</span>
                </div>

                <div className="progress-bar" style={{height:10,marginTop:12}}>
                  <div className={`progress-fill ${isOver ? 'over' : isWarn ? 'warn' : ''}`}
                    style={{ width: `${pct}%` }} />
                </div>

                <div className="budget-footer">
                  <span className={`budget-pct-badge ${isOver ? 'over' : isWarn ? 'warn' : 'ok'}`}>
                    {b.percentage.toFixed(1)}%
                  </span>
                  <span className="remaining">
                    {b.limitAmount - b.spentAmount >= 0
                      ? `Còn: ${fmt(b.limitAmount - b.spentAmount)}`
                      : `Vượt: ${fmt(b.spentAmount - b.limitAmount)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          budget={editItem}
          groupId={activeGroup?.id}
          categories={categories}
          month={month}
          year={year}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={fetchBudgets}
        />
      )}
    </div>
  );
}
