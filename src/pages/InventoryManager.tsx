
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';
import InventoryTable from '@/components/InventoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AddInventoryItemDialog from '@/components/AddInventoryItemDialog';
import { supabase } from '@/integrations/supabase/client';

const InventoryManager = () => {
  const { inventoryItems, totalOrders, refreshData, isLoading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStockItems: 0
  });

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'meat', name: 'Meat' },
    { id: 'bread', name: 'Bread' },
    { id: 'vegetable', name: 'Vegetables' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'condiment', name: 'Condiments' },
    { id: 'other', name: 'Other' }
  ];
  
  const refreshInventoryStats = async () => {
    try {
      // Get all inventory items
      const { data: allItems, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*');
        
      if (itemsError) throw itemsError;
      
      // Calculate low stock items
      const lowStock = allItems ? allItems.filter(item => item.quantity <= item.min_level).length : 0;
      
      setInventoryStats({
        totalItems: allItems ? allItems.length : 0,
        lowStockItems: lowStock
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };
  
  useEffect(() => {
    refreshInventoryStats();
    // Refresh inventory stats whenever the app data is refreshed
  }, [refreshData, isLoading]);
  
  const handleItemsAdded = () => {
    refreshInventoryStats();
    refreshData();
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Inventory Management" />
      
      <main className="flex-grow container py-6">
        <div className="flex flex-col gap-6">
          {/* Dashboard stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="transition-transform hover:scale-102 hover:shadow-md duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold animate-fade-in">{inventoryStats.totalItems}</p>
              </CardContent>
            </Card>
            
            <Card className="transition-transform hover:scale-102 hover:shadow-md duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500 animate-fade-in">{inventoryStats.lowStockItems}</p>
              </CardContent>
            </Card>
            
            <Card className="transition-transform hover:scale-102 hover:shadow-md duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Orders Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-chickey-primary animate-fade-in">{totalOrders}</p>
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
                    <TabsTrigger key={category.id} value={category.id} 
                      className="transition-all duration-200 data-[state=active]:animate-scale-in">
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            
            {/* Add Item Button */}
            <Button 
              className="ml-auto bg-chickey-primary hover:bg-chickey-primary/90 transition-all duration-200 
              hover:scale-105 active:scale-95"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
          
          {/* Inventory table */}
          <InventoryTable 
            category={activeCategory} 
            searchTerm={searchTerm} 
            onInventoryUpdated={() => {
              refreshInventoryStats();
              refreshData();
            }}
          />
          
          {/* Add Item Dialog */}
          <AddInventoryItemDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onItemsAdded={handleItemsAdded}
          />
        </div>
      </main>
    </div>
  );
};

export default InventoryManager;
