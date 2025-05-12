
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import Cart from '@/components/Cart';
import OrderHistory from '@/components/OrderHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddMenuItemDialog from '@/components/AddMenuItemDialog';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/data/menuItems';
import { toast } from '@/components/ui/use-toast';

const OrderManager = () => {
  const { menuItems: contextMenuItems } = useApp();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('menu');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'main', name: 'Main Courses' },
    { id: 'side', name: 'Sides' },
    { id: 'drink', name: 'Drinks' },
    { id: 'dessert', name: 'Desserts' }
  ];
  
  // Fetch menu items from Supabase
  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*');
      
      if (menuError) throw menuError;
      
      // Fetch ingredients for each menu item
      const menuItemsWithIngredients = await Promise.all(
        menuData.map(async (item) => {
          // Get ingredients for this menu item
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('menu_item_ingredients')
            .select(`
              quantity,
              inventory_item_id,
              inventory_items:inventory_item_id (id, name)
            `)
            .eq('menu_item_id', item.id);
          
          if (ingredientsError) throw ingredientsError;
          
          // Format ingredients
          const ingredients = ingredientsData.map(ing => ({
            id: ing.inventory_item_id,
            name: ing.inventory_items.name,
            quantity: ing.quantity
          }));
          
          return {
            ...item,
            ingredients,
            price: parseFloat(item.price)
          };
        })
      );
      
      setMenuItems(menuItemsWithIngredients);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch menu items. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMenuItems();
  }, []);
  
  // Filter by category and search term
  const filteredItems = menuItems
    .filter(item => activeCategory === 'all' || item.category === activeCategory)
    .filter(item => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    });
  
  const handleMenuItemAdded = () => {
    fetchMenuItems();
    toast({
      title: 'Success',
      description: 'New menu item has been added.',
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Order Management" />
      
      <main className="flex-grow container py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="col-span-2">
            <Tabs defaultValue="menu" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                  <TabsTrigger value="history">Order History</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="menu">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-bold">Menu</h2>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search menu..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-[200px]"
                      />
                    </div>
                    
                    <Button
                      onClick={() => setIsAddMenuItemOpen(true)}
                      className="bg-chickey-primary hover:bg-chickey-primary/90"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Menu Item
                    </Button>
                  </div>
                </div>
                
                <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="mb-4">
                    {categories.map(category => (
                      <TabsTrigger key={category.id} value={category.id}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {isLoading ? (
                    <div className="text-center p-12">
                      <p className="text-muted-foreground">Loading menu items...</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredItems.map(item => (
                        <MenuCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                  
                  {!isLoading && filteredItems.length === 0 && (
                    <div className="text-center p-12">
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? "No items match your search" 
                          : "No items in this category"}
                      </p>
                    </div>
                  )}
                </Tabs>
              </TabsContent>
              
              <TabsContent value="history" className="mt-0">
                <OrderHistory />
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Cart</h2>
            <Cart />
          </div>
        </div>
      </main>
      
      <AddMenuItemDialog
        open={isAddMenuItemOpen}
        onOpenChange={setIsAddMenuItemOpen}
        onItemAdded={handleMenuItemAdded}
      />
    </div>
  );
};

export default OrderManager;
