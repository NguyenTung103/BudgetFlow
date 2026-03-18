import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const prevGroupIdsRef = useRef(null);

  useEffect(() => {
    if (user) { fetchGroups(); fetchInvitations(); }
    else { setGroups([]); setActiveGroup(null); setInvitations([]); prevGroupIdsRef.current = null; }
  }, [user]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data);

      // Thông báo khi được thêm vào nhóm mới
      if (prevGroupIdsRef.current !== null) {
        const newGroups = data.filter(g => !prevGroupIdsRef.current.includes(g.id));
        newGroups.forEach(g => {
          toast.success(`Bạn đã tham gia nhóm "${g.name}"!`, { duration: 6000 });
        });
      }
      prevGroupIdsRef.current = data.map(g => g.id);

      const savedGroupId = localStorage.getItem('activeGroupId');
      const saved = savedGroupId ? data.find(g => g.id === parseInt(savedGroupId)) : null;

      if (saved) {
        setActiveGroup(saved);
      } else {
        const sharedGroup = data.find(g => g.members?.length > 1);
        const defaultGroup = sharedGroup || data[0] || null;
        setActiveGroup(defaultGroup);
        if (defaultGroup) localStorage.setItem('activeGroupId', defaultGroup.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data } = await api.get('/invitations');
      setInvitations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectGroup = (group) => {
    setActiveGroup(group);
    localStorage.setItem('activeGroupId', group.id);
  };

  const createGroup = async (name, description) => {
    const { data } = await api.post('/groups', { name, description });
    setGroups(prev => [...prev, data]);
    return data;
  };

  const deleteGroup = async (groupId) => {
    await api.delete(`/groups/${groupId}`);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroup?.id === groupId) {
      const remaining = groups.filter(g => g.id !== groupId);
      const next = remaining[0] || null;
      setActiveGroup(next);
      if (next) localStorage.setItem('activeGroupId', next.id);
      else localStorage.removeItem('activeGroupId');
    }
  };

  const addMember = async (groupId, email) => {
    const { data } = await api.post(`/groups/${groupId}/members`, { email });
    return data;
  };

  const removeMember = async (groupId, memberId) => {
    await api.delete(`/groups/${groupId}/members/${memberId}`);
    await fetchGroups();
  };

  const acceptInvitation = async (invitationId) => {
    const { data } = await api.post(`/invitations/${invitationId}/accept`);
    setInvitations(prev => prev.filter(i => i.id !== invitationId));
    await fetchGroups();
    return data;
  };

  const declineInvitation = async (invitationId) => {
    const { data } = await api.post(`/invitations/${invitationId}/decline`);
    setInvitations(prev => prev.filter(i => i.id !== invitationId));
    return data;
  };

  return (
    <GroupContext.Provider value={{
      groups, activeGroup, loading, invitations,
      selectGroup, createGroup, deleteGroup, addMember, removeMember,
      fetchGroups, fetchInvitations, acceptInvitation, declineInvitation
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export const useGroup = () => useContext(GroupContext);
