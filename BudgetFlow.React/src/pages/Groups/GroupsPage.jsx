import React, { useState } from 'react';
import { Users, Plus, UserPlus, Trash2, Crown, X, Shield, Edit2 } from 'lucide-react';
import { useGroup } from '../../contexts/GroupContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './Groups.css';

function CreateGroupModal({ onClose, onCreated }) {
  const { createGroup } = useGroup();
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createGroup(form.name, form.description);
      toast.success('Tạo nhóm thành công!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Tạo nhóm mới</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Tên nhóm</label>
            <input type="text" placeholder="Nhóm gia đình, Nhóm bạn bè..." value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Mô tả (tùy chọn)</label>
            <input type="text" placeholder="Mô tả ngắn về nhóm..." value={form.description}
              onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameGroupModal({ group, onClose, onSaved }) {
  const [form, setForm] = useState({ name: group.name, description: group.description || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await api.put(`/groups/${group.id}`, { name: form.name.trim(), description: form.description.trim() });
      toast.success('Đã cập nhật thông tin nhóm');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Đặt tên nhóm</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Tên nhóm</label>
            <input type="text" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Nhóm gia đình, Nhóm bạn bè..." required />
          </div>
          <div className="form-group">
            <label>Mô tả (tùy chọn)</label>
            <input type="text" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Mô tả ngắn về nhóm..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ groupId, onClose, onAdded }) {
  const { addMember } = useGroup();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMember(groupId, email);
      toast.success('Thêm thành viên thành công!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tìm thấy người dùng');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Thêm thành viên</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Email thành viên</label>
            <input type="email" placeholder="email@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <p style={{fontSize:'0.8rem',color:'var(--gray-400)'}}>Người dùng cần đã đăng ký tài khoản BudgetFlow</p>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const roleLabels = { 0: 'Thành viên', 1: 'Quản trị', 2: 'Chủ nhóm' };
const roleIcons = { 0: null, 1: Shield, 2: Crown };

export default function GroupsPage() {
  const { groups, activeGroup, selectGroup, removeMember, fetchGroups } = useGroup();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [showRename, setShowRename] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const displayGroup = selectedGroup || activeGroup;

  const handleRemoveMember = async (groupId, memberId) => {
    if (!window.confirm('Xóa thành viên này khỏi nhóm?')) return;
    try {
      await removeMember(groupId, memberId);
      toast.success('Đã xóa thành viên');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const isOwnerOrAdmin = (group) => {
    const member = group?.members?.find(m => m.userId === user?.id);
    return member?.role === 1 || member?.role === 2;
  };

  return (
    <div className="groups-page">
      <div className="page-header">
        <div>
          <h2>Quản lý nhóm</h2>
          <p className="page-subtitle">{groups.length} nhóm</p>
        </div>
        <button className="btn-add" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Tạo nhóm
        </button>
      </div>

      <div className="groups-layout">
        {/* Groups List */}
        <div className="groups-list-panel">
          <h3>Nhóm của tôi</h3>
          {groups.map(g => (
            <div key={g.id}
              className={`group-list-item ${displayGroup?.id === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGroup(g)}>
              <div className="group-list-avatar">{g.name[0]}</div>
              <div className="group-list-info">
                <div className="group-list-name">{g.name}</div>
                <div className="group-list-meta">{g.members?.length} thành viên</div>
              </div>
              {g.ownerId === user?.id && <Crown size={14} color="#F59E0B" />}
            </div>
          ))}
        </div>

        {/* Group Detail */}
        {displayGroup && (
          <div className="group-detail-panel">
            <div className="group-detail-header">
              <div className="group-detail-title">
                <div className="group-detail-avatar">{displayGroup.name[0]}</div>
                <div>
                  <h3>{displayGroup.name}</h3>
                  {displayGroup.description && <p className="group-desc">{displayGroup.description}</p>}
                </div>
              </div>
              {isOwnerOrAdmin(displayGroup) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-rename-group" onClick={() => setShowRename(displayGroup)}>
                    <Edit2 size={15} /> Đặt tên
                  </button>
                  <button className="btn-add-member" onClick={() => setShowAddMember(displayGroup.id)}>
                    <UserPlus size={16} /> Thêm thành viên
                  </button>
                </div>
              )}
            </div>

            <div className="members-list">
              <h4>Thành viên ({displayGroup.members?.length})</h4>
              {displayGroup.members?.map(m => {
                const RoleIcon = roleIcons[m.role];
                return (
                  <div key={m.userId} className="member-item">
                    <div className="member-avatar">{m.fullName?.[0]}</div>
                    <div className="member-info">
                      <div className="member-name">
                        {m.fullName}
                        {m.userId === user?.id && <span className="you-badge">Bạn</span>}
                      </div>
                      <div className="member-email">{m.email}</div>
                    </div>
                    <div className="member-role">
                      {RoleIcon && <RoleIcon size={14} color={m.role === 2 ? '#F59E0B' : '#4F46E5'} />}
                      <span className={`role-badge role-${m.role}`}>{roleLabels[m.role]}</span>
                    </div>
                    {isOwnerOrAdmin(displayGroup) && m.role !== 2 && m.userId !== user?.id && (
                      <button className="action-btn delete" onClick={() => handleRemoveMember(displayGroup.id, m.userId)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={fetchGroups} />}
      {showAddMember && <AddMemberModal groupId={showAddMember} onClose={() => setShowAddMember(null)} onAdded={fetchGroups} />}
      {showRename && (
        <RenameGroupModal
          group={showRename}
          onClose={() => setShowRename(null)}
          onSaved={() => { fetchGroups(); setSelectedGroup(null); }}
        />
      )}
    </div>
  );
}
