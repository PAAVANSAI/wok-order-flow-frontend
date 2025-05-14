
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const { totalOrders, totalRevenue } = useApp();
  const [animateLogo, setAnimateLogo] = useState(false);
  
  // Logo animation on mount
  useEffect(() => {
    setAnimateLogo(true);
    const timer = setTimeout(() => setAnimateLogo(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-chickey-dark mb-3">
              Welcome to 
              <span 
                className={cn(
                  "text-chickey-primary ml-2 transition-transform duration-500",
                  animateLogo && "animate-scale-in"
                )}
              >
                Chickey Woks
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Choose your dashboard below to start taking orders or manage inventory
            </p>
          </header>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Link to="/orders" className="block h-full transition-transform hover:scale-105">
              <Card className="h-full flex flex-col shadow-lg border-chickey-primary border-t-4 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl text-chickey-primary">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Order Management
                  </CardTitle>
                  <CardDescription>Take customer orders and process them</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-700">
                    Access the menu, add items to orders, and process customer purchases. 
                    The system will automatically update inventory when orders are placed.
                  </p>
                </CardContent>
                <CardFooter className="bg-gray-50 rounded-b-lg">
                  <p className="text-sm text-gray-500">For restaurant staff</p>
                </CardFooter>
              </Card>
            </Link>
            
            <Link to="/inventory" className="block h-full transition-transform hover:scale-105">
              <Card className="h-full flex flex-col shadow-lg border-chickey-secondary border-t-4 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl text-chickey-secondary">
                    <Package className="mr-2 h-5 w-5" /> Inventory Management
                  </CardTitle>
                  <CardDescription>Monitor and update stock levels</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-700">
                    View current stock levels, get alerts for low inventory items, 
                    and easily update quantities as new deliveries arrive.
                  </p>
                </CardContent>
                <CardFooter className="bg-gray-50 rounded-b-lg">
                  <p className="text-sm text-gray-500">For restaurant owner</p>
                </CardFooter>
              </Card>
            </Link>
          </div>
          
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Card className="transition-transform hover:scale-102 hover:shadow-md duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Orders Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-chickey-primary animate-fade-in">{totalOrders}</p>
              </CardContent>
            </Card>
            <Card className="transition-transform hover:scale-102 hover:shadow-md duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-chickey-secondary animate-fade-in">₹{totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
