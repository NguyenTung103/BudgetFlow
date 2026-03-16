import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import { useGroup } from '../../contexts/GroupContext';
import { useSignalR } from '../../contexts/SignalRContext';
import CustomSelect from '../../components/Common/CustomSelect';
import AmountInput from '../../components/Common/AmountInput';
import GroupBanner from '../../components/Common/GroupBanner';
import toast from 'react-hot-toast';
import './Expenses.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function ExpenseModal({ expense, groupId, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount: expense?.amount || '',
    description: expense?.description || '',
    date: expense
      ? format(new Date(expense.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    categoryId: expense?.categoryId || (categories[0]?.id || ''),
    groupId,
  });
  const [loading, setLoading] = useState(false);

  const categoryOptions = categories.map(c => ({
    value: c.id,
    label: c.name,
    icon: c.icon,
    color: c.color,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(String(form.amount).replace(/\./g, '')),
        date: new Date(form.date).toISOString(),
      };
      if (expense) {
        await api.put(`/expenses/${expense.id}`, payload);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/expenses', payload);
        toast.success('Thêm chi tiêu thành công');
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
          <h3>{expense ? 'Sửa chi tiêu' : 'Thêm chi tiêu'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Số tiền (VND)</label>
            <AmountInput
              value={form.amount}
              onChange={val => setForm({ ...form, amount: val })}
              required
            />
          </div>
          <div className="form-group">
            <label>Danh mục</label>
            <CustomSelect
              value={form.categoryId}
              onChange={val => setForm({ ...form, categoryId: val })}
              options={categoryOptions}
              placeholder="Chọn danh mục..."
            />
          </div>
          <div className="form-group">
            <label>Ngày</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Mô tả (tùy chọn)</label>
            <input
              type="text"
              placeholder="Ghi chú..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : (expense ? 'Cập nhật' : 'Thêm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const { activeGroup } = useGroup();
  const { on } = useSignalR();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [dateFrom, setDateFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchExpenses = useCallback(async () => {
    if (!activeGroup) return;
    setLoading(true);
    try {
      const params = { groupId: activeGroup.id };
      if (dateFrom) params.from = new Date(dateFrom).toISOString();
      if (dateTo) params.to = new Date(dateTo + 'T23:59:59').toISOString();
      const { data } = await api.get('/expenses', { params });
      setExpenses(data);
    } catch {}
    finally { setLoading(false); }
  }, [activeGroup, dateFrom, dateTo]);

  useEffect(() => {
    api.get('/categories', { params: { type: 'Expense' } }).then(r => setCategories(r.data));
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  useEffect(() => {
    const offs = [
      on('ExpenseCreated', fetchExpenses),
      on('ExpenseUpdated', fetchExpenses),
      on('ExpenseDeleted', fetchExpenses),
    ];
    return () => offs.forEach(f => f && f());
  }, [on, fetchExpenses]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa chi tiêu này?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Đã xóa');
      fetchExpenses();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  // Tùy chọn lọc danh mục
  const catFilterOptions = [
    { value: '', label: 'Tất cả danh mục' },
    ...categories.map(c => ({ value: String(c.id), label: c.name, icon: c.icon, color: c.color })),
  ];

  const filtered = expenses.filter(e => {
    const matchSearch = !search ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
      e.userFullName?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || e.categoryId === parseInt(filterCat);
    return matchSearch && matchCat;
  });

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="expenses-page">
      <GroupBanner />
      <div className="page-header">
        <div>
          <h2>Chi tiêu</h2>
          <p className="page-subtitle">
            {filtered.length} giao dịch · Tổng:{' '}
            <strong style={{ color: '#EF4444' }}>{fmt(total)}</strong>
          </p>
        </div>
        <button className="btn-add" onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={18} /> Thêm chi tiêu
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            placeholder="Tìm kiếm theo mô tả, danh mục, người dùng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={15} className="filter-label-icon" />
          <CustomSelect
            value={filterCat}
            onChange={val => setFilterCat(val)}
            options={catFilterOptions}
            placeholder="Tất cả danh mục"
            className="filter-select-custom"
          />
        </div>
        <div className="date-range">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="date-input" />
          <span className="date-sep">→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="date-input" />
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : (
        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <p>Không có chi tiêu nào trong khoảng thời gian này</p>
              <button className="btn-sm" onClick={() => setShowModal(true)}>Thêm ngay</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th>Mô tả</th>
                  <th>Người dùng</th>
                  <th>Ngày</th>
                  <th>Số tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div className="cat-cell">
                        <span
                          className="cat-icon"
                          style={{ background: (e.categoryColor || '#94A3B8') + '25' }}
                        >
                          {e.categoryIcon}
                        </span>
                        {e.categoryName}
                      </div>
                    </td>
                    <td className="desc-cell">{e.description || <span style={{color:'var(--gray-300)'}}>—</span>}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-dot">{e.userFullName?.[0]?.toUpperCase()}</div>
                        {e.userFullName}
                      </div>
                    </td>
                    <td>{format(new Date(e.date), 'dd/MM/yyyy')}</td>
                    <td><span className="amount expense">{fmt(e.amount)}</span></td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => { setEditItem(e); setShowModal(true); }}
                          className="action-btn edit"
                          title="Sửa"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="action-btn delete"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <ExpenseModal
          expense={editItem}
          groupId={activeGroup?.id}
          categories={categories}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={fetchExpenses}
        />
      )}
    </div>
  );
}
