
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { ShoppingCart, Package, BarChart2, RefreshCw, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, refreshData, isLoading, currentUserRole, logout, isOwner } = useApp();
  const [animateLogo, setAnimateLogo] = useState(false);
  
  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const isActive = (path: string) => location.pathname === path;

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
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/orders" className="flex items-center mr-6" onClick={triggerLogoAnimation}>
            <span 
              className={cn(
                "text-2xl font-bold text-chickey-primary transition-transform duration-500",
                animateLogo && "animate-scale-in"
              )}
            >
              Chickey
            </span>
            <span 
              className={cn(
                "text-2xl font-bold ml-1 text-chickey-dark transition-transform duration-500",
                animateLogo && "animate-scale-in"
              )}
            >
              Woks
            </span>
          </Link>
          
          <div className="hidden sm:flex items-center space-x-4">
            <Link 
              to="/orders" 
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive('/orders') 
                  ? "bg-chickey-accent text-chickey-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> 
              Order Management
            </Link>
            
            <Link 
              to="/inventory" 
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive('/inventory') 
                  ? "bg-chickey-accent text-chickey-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Package className="mr-2 h-4 w-4" />
              Inventory Management
            </Link>
            
            {isOwner && (
              <Link 
                to="/analytics" 
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/analytics') 
                    ? "bg-chickey-accent text-chickey-primary" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Owner Dashboard
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => refreshData()} 
            className={cn(
              "p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-all duration-200",
              isLoading && "animate-spin text-chickey-primary"
            )}
            disabled={isLoading}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {location.pathname === '/orders' && (
            <Link to="/orders" className="relative">
              <ShoppingCart className="h-6 w-6 text-chickey-primary" />
              {totalCartItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-chickey-secondary text-white">
                  {totalCartItems}
                </Badge>
              )}
            </Link>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <User className="h-4 w-4 mr-2" />
                {currentUserRole && currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
