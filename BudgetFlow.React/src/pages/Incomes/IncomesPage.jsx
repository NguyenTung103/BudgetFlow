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
import '../Expenses/Expenses.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function IncomeModal({ income, groupId, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount: income?.amount || '',
    description: income?.description || '',
    date: income ? format(new Date(income.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    categoryId: income?.categoryId || (categories[0]?.id || ''),
    groupId
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(String(form.amount).replace(/\./g, '')), date: new Date(form.date).toISOString() };
      if (income) {
        await api.put(`/incomes/${income.id}`, payload);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/incomes', payload);
        toast.success('Thêm thu nhập thành công');
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
          <h3>{income ? 'Sửa thu nhập' : 'Thêm thu nhập'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Số tiền (VND)</label>
            <AmountInput value={form.amount} onChange={val => setForm({...form, amount: val})} required />
          </div>
          <div className="form-group">
            <label>Danh mục</label>
            <CustomSelect
              value={form.categoryId}
              onChange={val => setForm({...form, categoryId: val})}
              options={categories.map(c => ({ value: c.id, label: c.name, icon: c.icon, color: c.color }))}
              placeholder="Chọn danh mục..."
            />
          </div>
          <div className="form-group">
            <label>Ngày</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Mô tả (tùy chọn)</label>
            <input type="text" placeholder="Ghi chú..." value={form.description}
              onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : (income ? 'Cập nhật' : 'Thêm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IncomesPage() {
  const { activeGroup } = useGroup();
  const { on } = useSignalR();
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [dateFrom, setDateFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchIncomes = useCallback(async () => {
    if (!activeGroup) return;
    setLoading(true);
    try {
      const params = { groupId: activeGroup.id };
      if (dateFrom) params.from = new Date(dateFrom).toISOString();
      if (dateTo) params.to = new Date(dateTo + 'T23:59:59').toISOString();
      const { data } = await api.get('/incomes', { params });
      setIncomes(data);
    } catch {}
    finally { setLoading(false); }
  }, [activeGroup, dateFrom, dateTo]);

  useEffect(() => {
    api.get('/categories', { params: { type: 'Income' } }).then(r => setCategories(r.data));
  }, []);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  useEffect(() => {
    const offs = [on('IncomeCreated', fetchIncomes), on('IncomeUpdated', fetchIncomes), on('IncomeDeleted', fetchIncomes)];
    return () => offs.forEach(f => f?.());
  }, [on, fetchIncomes]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thu nhập này?')) return;
    try {
      await api.delete(`/incomes/${id}`);
      toast.success('Đã xóa');
      fetchIncomes();
    } catch { toast.error('Xóa thất bại'); }
  };

  const filtered = incomes.filter(i => {
    const matchSearch = !search || i.description?.toLowerCase().includes(search.toLowerCase()) || i.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || i.categoryId === parseInt(filterCat);
    return matchSearch && matchCat;
  });

  const total = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="expenses-page">
      <GroupBanner />
      <div className="page-header">
        <div>
          <h2>Thu nhập</h2>
          <p className="page-subtitle">Tổng: <strong style={{color:'#10B981'}}>{fmt(total)}</strong></p>
        </div>
        <button className="btn-add" style={{background:'#10B981'}} onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={18} /> Thêm thu nhập
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input placeholder="Tìm kiếm theo mô tả, danh mục, người dùng..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <Filter size={15} className="filter-label-icon" />
          <CustomSelect
            value={filterCat}
            onChange={val => setFilterCat(val)}
            options={[
              { value: '', label: 'Tất cả danh mục' },
              ...categories.map(c => ({ value: String(c.id), label: c.name, icon: c.icon, color: c.color }))
            ]}
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
            <div className="empty-state" style={{padding:48}}>
              <p>Không có thu nhập nào</p>
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
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td>
                      <div className="cat-cell">
                        <span className="cat-icon" style={{background: i.categoryColor + '20'}}>{i.categoryIcon}</span>
                        {i.categoryName}
                      </div>
                    </td>
                    <td className="desc-cell">{i.description || '-'}</td>
                    <td><div className="user-cell"><div className="user-dot" style={{background:'#10B981'}}>{i.userFullName?.[0]}</div>{i.userFullName}</div></td>
                    <td>{format(new Date(i.date), 'dd/MM/yyyy')}</td>
                    <td><span className="amount income">{fmt(i.amount)}</span></td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => { setEditItem(i); setShowModal(true); }} className="action-btn edit"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(i.id)} className="action-btn delete"><Trash2 size={15} /></button>
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
        <IncomeModal
          income={editItem}
          groupId={activeGroup?.id}
          categories={categories}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={fetchIncomes}
        />
      )}
    </div>
  );
}
