
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { ShoppingCart, Package, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NavBar = () => {
  const location = useLocation();
  const { cartItems } = useApp();
  
  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-6">
            <span className="text-2xl font-bold text-chickey-primary">Chickey</span>
            <span className="text-2xl font-bold ml-1 text-chickey-dark">Woks</span>
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
          </div>
        </div>
        
        {location.pathname === '/orders' && (
          <div className="flex items-center">
            <Link to="/orders" className="relative">
              <ShoppingCart className="h-6 w-6 text-chickey-primary" />
              {totalCartItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-chickey-secondary text-white">
                  {totalCartItems}
                </Badge>
              )}
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};

export default NavBar;
