
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/Auth/LoginForm';
import { useApp } from '@/context/AppContext';

const Login = () => {
  const { currentUserRole } = useApp();
  const navigate = useNavigate();
  
  // If user is already logged in, redirect to orders page
  useEffect(() => {
    if (currentUserRole) {
      navigate('/orders');
    }
  }, [currentUserRole, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-chickey-primary">Chickey</span> <span className="text-chickey-dark">Woks</span>
          </h1>
          <p className="text-gray-500">Restaurant Management System</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
