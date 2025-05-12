
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

interface HeaderProps {
  title: string;
  showHomeButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showHomeButton = true }) => {
  const navigate = useNavigate();
  
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {showHomeButton && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <Home className="h-5 w-5" />
            </Button>
          )}
          <h1 className="flex items-center text-xl font-bold text-chickey-dark">
            <span className="text-chickey-primary mr-2">Chickey</span> Woks | {title}
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
