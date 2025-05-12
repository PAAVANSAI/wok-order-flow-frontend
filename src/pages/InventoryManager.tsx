
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';
import InventoryTable from '@/components/InventoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InventoryManager = () => {
  const { inventoryItems, totalOrders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'meat', name: 'Meat' },
    { id: 'bread', name: 'Bread' },
    { id: 'vegetable', name: 'Vegetables' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'condiment', name: 'Condiments' },
    { id: 'other', name: 'Other' }
  ];
  
  const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minLevel);
  
  const filteredItems = inventoryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Inventory Management" />
      
      <main className="flex-grow container py-6">
        <div className="flex flex-col gap-6">
          {/* Dashboard stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{inventoryItems.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500">{lowStockItems.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Orders Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-chickey-primary">{totalOrders}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search inventory..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <TabsList>
                  {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
          
          {/* Inventory table */}
          <InventoryTable />
        </div>
      </main>
    </div>
  );
};

export default InventoryManager;
