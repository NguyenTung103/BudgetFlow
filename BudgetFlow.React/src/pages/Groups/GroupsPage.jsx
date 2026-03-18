import React, { useState } from 'react';
import { Users, Plus, UserPlus, Trash2, Crown, X, Shield, Edit2, Bell, Check, XCircle, Mail } from 'lucide-react';
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

function AddMemberModal({ groupId, onClose, onSent }) {
  const { addMember } = useGroup();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await addMember(groupId, email);
      toast.success(result.message || 'Đã gửi lời mời!');
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tìm thấy người dùng');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Mời thành viên</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="invite-info-box">
            <Mail size={16} />
            <span>Người được mời sẽ nhận được lời mời và cần chấp thuận trước khi tham gia nhóm.</span>
          </div>
          <div className="form-group">
            <label>Email thành viên</label>
            <input type="email" placeholder="email@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <p style={{fontSize:'0.8rem',color:'var(--gray-400)'}}>Người dùng cần đã đăng ký tài khoản BudgetFlow</p>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Gửi lời mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteGroupModal({ group, onClose, onDeleted }) {
  const { deleteGroup } = useGroup();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteGroup(group.id);
      toast.success(`Đã xóa nhóm "${group.name}"`);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Xóa nhóm</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-form">
          <div className="delete-confirm-box">
            <Trash2 size={32} color="var(--danger)" />
            <p>Bạn có chắc muốn xóa nhóm <strong>"{group.name}"</strong>?</p>
            <p className="delete-warning">Hành động này không thể hoàn tác. Toàn bộ dữ liệu chi tiêu, thu nhập và ngân sách của nhóm sẽ bị xóa.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button className="btn-danger" onClick={handleDelete} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Xóa nhóm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const roleLabels = { 0: 'Thành viên', 1: 'Quản trị', 2: 'Chủ nhóm' };
const roleIcons = { 0: null, 1: Shield, 2: Crown };

function InvitationsPanel() {
  const { invitations, acceptInvitation, declineInvitation, fetchInvitations } = useGroup();
  const [loadingId, setLoadingId] = useState(null);

  if (invitations.length === 0) return null;

  const handleAccept = async (inv) => {
    setLoadingId(inv.id);
    try {
      const result = await acceptInvitation(inv.id);
      toast.success(result.message || `Đã tham gia nhóm "${inv.groupName}"!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoadingId(null); }
  };

  const handleDecline = async (inv) => {
    setLoadingId(inv.id);
    try {
      await declineInvitation(inv.id);
      toast.success('Đã từ chối lời mời');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoadingId(null); }
  };

  return (
    <div className="invitations-panel">
      <div className="invitations-header">
        <Bell size={16} />
        <h3>Lời mời tham gia nhóm</h3>
        <span className="inv-badge">{invitations.length}</span>
      </div>
      <div className="invitations-list">
        {invitations.map(inv => (
          <div key={inv.id} className="invitation-item">
            <div className="invitation-avatar">{inv.groupName[0]}</div>
            <div className="invitation-info">
              <div className="invitation-group">{inv.groupName}</div>
              <div className="invitation-from">Được mời bởi <strong>{inv.inviterName}</strong></div>
            </div>
            <div className="invitation-actions">
              <button
                className="inv-btn accept"
                onClick={() => handleAccept(inv)}
                disabled={loadingId === inv.id}
                title="Chấp thuận"
              >
                {loadingId === inv.id ? <span className="spinner spinner-sm" /> : <Check size={14} />}
              </button>
              <button
                className="inv-btn decline"
                onClick={() => handleDecline(inv)}
                disabled={loadingId === inv.id}
                title="Từ chối"
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const { groups, activeGroup, selectGroup, removeMember, fetchGroups, invitations } = useGroup();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [showRename, setShowRename] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
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

  const isOwner = (group) => group?.ownerId === user?.id;
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

      {/* Pending Invitations */}
      <InvitationsPanel />

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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {isOwnerOrAdmin(displayGroup) && (
                  <>
                    <button className="btn-rename-group" onClick={() => setShowRename(displayGroup)}>
                      <Edit2 size={15} /> Đặt tên
                    </button>
                    <button className="btn-add-member" onClick={() => setShowAddMember(displayGroup.id)}>
                      <UserPlus size={16} /> Mời thành viên
                    </button>
                  </>
                )}
                {isOwner(displayGroup) && (
                  <button className="btn-delete-group" onClick={() => setShowDelete(displayGroup)}>
                    <Trash2 size={15} /> Xóa nhóm
                  </button>
                )}
              </div>
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
      {showAddMember && <AddMemberModal groupId={showAddMember} onClose={() => setShowAddMember(null)} onSent={() => {}} />}
      {showRename && (
        <RenameGroupModal
          group={showRename}
          onClose={() => setShowRename(null)}
          onSaved={() => { fetchGroups(); setSelectedGroup(null); }}
        />
      )}
      {showDelete && (
        <DeleteGroupModal
          group={showDelete}
          onClose={() => setShowDelete(null)}
          onDeleted={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
