import React from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { useGroup } from '../../contexts/GroupContext';
import { useAuth } from '../../contexts/AuthContext';
import './GroupBanner.css';

export default function GroupBanner() {
  const { groups, activeGroup, selectGroup } = useGroup();
  const { user } = useAuth();

  if (!activeGroup || groups.length <= 1) return null;

  // Check if currently on a personal group (only 1 member = self)
  const isPersonalGroup = activeGroup.members?.length === 1;
  const sharedGroups = groups.filter(g => g.id !== activeGroup.id && g.members?.length > 1);

  if (!isPersonalGroup) {
    // Show info: which shared group, how many members
    return (
      <div className="group-banner shared">
        <Users size={15} />
        <span>
          Đang xem dữ liệu nhóm <strong>{activeGroup.name}</strong> · {activeGroup.members?.length} thành viên
        </span>
        {groups.length > 1 && (
          <div className="group-banner-switches">
            {groups.filter(g => g.id !== activeGroup.id).map(g => (
              <button key={g.id} className="group-switch-btn" onClick={() => selectGroup(g)}>
                {g.name} <ChevronRight size={12} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (sharedGroups.length > 0) {
    // Warn: you're on personal group, shared group available
    return (
      <div className="group-banner warning">
        <Users size={15} />
        <span>
          Bạn đang xem nhóm cá nhân. Để xem dữ liệu chia sẻ, hãy chuyển sang:
        </span>
        <div className="group-banner-switches">
          {sharedGroups.map(g => (
            <button key={g.id} className="group-switch-btn primary" onClick={() => selectGroup(g)}>
              {g.name} ({g.members?.length} người) <ChevronRight size={12} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
