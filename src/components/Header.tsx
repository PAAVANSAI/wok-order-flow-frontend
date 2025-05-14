
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  showHomeButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showHomeButton = true }) => {
  const navigate = useNavigate();
  const { refreshData, isLoading } = useApp();
  const [animateLogo, setAnimateLogo] = useState(false);
  
  // Logo animation on mount
  useEffect(() => {
    setAnimateLogo(true);
    const timer = setTimeout(() => setAnimateLogo(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Function to trigger logo animation
  const triggerLogoAnimation = () => {
    setAnimateLogo(true);
    setTimeout(() => setAnimateLogo(false), 1000);
  };
  
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {showHomeButton && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:scale-105 active:scale-95">
              <Home className="h-5 w-5" />
            </Button>
          )}
          <h1 className="flex items-center text-xl font-bold text-chickey-dark">
            <span 
              className={cn(
                "text-chickey-primary mr-2 transition-transform duration-500",
                animateLogo && "animate-scale-in"
              )}
              onClick={triggerLogoAnimation}
            >
              Chickey
            </span>
            <span
              className={cn(
                "transition-transform duration-500",
                animateLogo && "animate-scale-in"
              )}
              onClick={triggerLogoAnimation}
            >
              Woks
            </span> | {title}
          </h1>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshData()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span>Refresh Data</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
