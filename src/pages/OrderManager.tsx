
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import Cart from '@/components/Cart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OrderManager = () => {
  const { menuItems } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'main', name: 'Main Courses' },
    { id: 'side', name: 'Sides' },
    { id: 'drink', name: 'Drinks' },
    { id: 'dessert', name: 'Desserts' }
  ];
  
  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Order Management" />
      
      <main className="flex-grow container py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="col-span-2">
            <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Menu</h2>
                <TabsList>
                  {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {categories.map(category => (
                <TabsContent key={category.id} value={category.id} className="mt-0">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredItems.map(item => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                  {filteredItems.length === 0 && (
                    <div className="text-center p-12">
                      <p className="text-muted-foreground">No items in this category</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Cart</h2>
            <Cart />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderManager;
