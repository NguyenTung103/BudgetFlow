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
  const prevGroupIdsRef = useRef(null);

  useEffect(() => {
    if (user) fetchGroups();
    else { setGroups([]); setActiveGroup(null); prevGroupIdsRef.current = null; }
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
          toast.success(`Bạn đã được thêm vào nhóm "${g.name}"! Chuyển nhóm trong sidebar để xem dữ liệu.`, { duration: 6000 });
        });
      }
      prevGroupIdsRef.current = data.map(g => g.id);

      const savedGroupId = localStorage.getItem('activeGroupId');
      const saved = savedGroupId ? data.find(g => g.id === parseInt(savedGroupId)) : null;

      if (saved) {
        setActiveGroup(saved);
      } else {
        // Ưu tiên nhóm có nhiều thành viên nhất (nhóm chia sẻ), bỏ qua nhóm cá nhân chỉ có 1 mình
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

  const selectGroup = (group) => {
    setActiveGroup(group);
    localStorage.setItem('activeGroupId', group.id);
  };

  const createGroup = async (name, description) => {
    const { data } = await api.post('/groups', { name, description });
    setGroups(prev => [...prev, data]);
    return data;
  };

  const addMember = async (groupId, email) => {
    const { data } = await api.post(`/groups/${groupId}/members`, { email });
    await fetchGroups();
    return data;
  };

  const removeMember = async (groupId, memberId) => {
    await api.delete(`/groups/${groupId}/members/${memberId}`);
    await fetchGroups();
  };

  return (
    <GroupContext.Provider value={{
      groups, activeGroup, loading,
      selectGroup, createGroup, addMember, removeMember, fetchGroups
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export const useGroup = () => useContext(GroupContext);
