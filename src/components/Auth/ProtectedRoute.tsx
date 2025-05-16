
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOwner?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOwner = false 
}) => {
  const { currentUserRole, isAuthenticated } = useApp();
  const location = useLocation();

  useEffect(() => {
    // Show permission denied toast if trying to access owner-only pages as staff
    if (requireOwner && currentUserRole === 'staff') {
      toast({
        title: "Access Denied",
        description: "You need owner permissions to access this page",
        variant: "destructive"
      });
    }
  }, [requireOwner, currentUserRole, location.pathname]);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requireOwner && currentUserRole !== 'owner') {
    // Redirect to orders page if staff tries to access owner-only pages
    return <Navigate to="/orders" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
