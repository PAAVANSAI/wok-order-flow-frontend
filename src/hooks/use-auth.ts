
import { useState, useEffect } from 'react';

export type UserRole = 'staff' | 'owner' | null;

export function useAuth() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(null);
  
  useEffect(() => {
    // Check for saved role in localStorage on mount
    const savedRole = localStorage.getItem('chickey-user-role') as UserRole;
    if (savedRole) {
      setCurrentUserRole(savedRole);
    }
  }, []);
  
  const logout = () => {
    localStorage.removeItem('chickey-user-role');
    setCurrentUserRole(null);
  };
  
  return {
    currentUserRole,
    setCurrentUserRole,
    logout,
    isAuthenticated: !!currentUserRole,
    isOwner: currentUserRole === 'owner',
    isStaff: currentUserRole === 'staff'
  };
}
