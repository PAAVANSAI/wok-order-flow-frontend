
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import Cart from '@/components/Cart';
import OrderHistory from '@/components/OrderHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddMenuItemDialog from '@/components/AddMenuItemDialog';
import EditMenuItemDialog from '@/components/EditMenuItemDialog';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { MenuItem } from '@/data/menuItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const OrderManager = () => {
  const { menuItems: contextMenuItems, setMenuItems, refreshData, isLoading } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('menu');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'main', name: 'Main Courses' },
    { id: 'side', name: 'Sides' },
    { id: 'drink', name: 'Drinks' },
    { id: 'dessert', name: 'Desserts' }
  ];
  
  // Fetch menu items from Supabase with improved error handling
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching menu items from Supabase...');
        
        // Fetch menu items
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('*');
          
        if (menuItemsError) {
          console.error('Error fetching menu items:', menuItemsError);
          throw menuItemsError;
        }
        
        console.log(`Retrieved ${menuItemsData?.length || 0} menu items`);
        
        // For each menu item, fetch its ingredients
        const menuItemsWithIngredients = await Promise.all(
          menuItemsData.map(async (item) => {
            try {
              const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('menu_item_ingredients')
                .select(`
                  quantity,
                  inventory_items (id, name)
                `)
                .eq('menu_item_id', item.id);
                
              if (ingredientsError) {
                console.error(`Error fetching ingredients for menu item ${item.id}:`, ingredientsError);
                throw ingredientsError;
              }
              
              // Transform ingredients data to match the expected format
              const ingredients = ingredientsData.map((ingredient) => ({
                id: ingredient.inventory_items.id,
                name: ingredient.inventory_items.name,
                quantity: parseFloat(ingredient.quantity.toString())
              }));
              
              return {
                ...item,
                price: parseFloat(item.price.toString()),
                ingredients,
                category: item.category
              } as MenuItem;
            } catch (err) {
              console.error(`Error processing menu item ${item.id}:`, err);
              // Return item without ingredients on error
              return {
                ...item,
                price: parseFloat(item.price.toString()),
                ingredients: [],
                category: item.category
              } as MenuItem;
            }
          })
        );
        
        setMenuItems(menuItemsWithIngredients);
        console.log('Menu items loaded successfully');
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu items. Using local data instead.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenuItems();
  }, [setMenuItems]);

  // Handle adding a new menu item
  const handleMenuItemAdded = (newMenuItem: MenuItem) => {
    setMenuItems([...contextMenuItems, newMenuItem]);
    toast({
      title: "Menu Item Added",
      description: `${newMenuItem.name} has been added to the menu`,
      variant: "default",
    });
  };

  // Handle updating a menu item
  const handleMenuItemUpdated = (updatedMenuItem: MenuItem) => {
    setMenuItems(
      contextMenuItems.map(item => 
        item.id === updatedMenuItem.id ? updatedMenuItem : item
      )
    );
    toast({
      title: "Menu Item Updated",
      description: `${updatedMenuItem.name} has been updated`,
      variant: "default",
    });
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "Latest data has been loaded successfully",
      });
    }, 1000);
  };
  
  // Filter items by category and search term
  const filteredItems = contextMenuItems
    .filter(item => activeCategory === 'all' || item.category === activeCategory)
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Order Management" />
      
      <main className="flex-grow container py-6 animate-fade-in">
        {/* Restaurant Name with Animation */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold animate-scale-in transition-all duration-500 hover:scale-105">
            <span className="text-chickey-primary">Chickey</span> <span className="text-chickey-dark">Woks</span>
          </h1>
          <p className="text-muted-foreground animate-fade-in">Order Management System</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="col-span-2">
            <Tabs defaultValue="menu" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="menu" className="transition-all duration-200 data-[state=active]:animate-scale-in">Menu</TabsTrigger>
                  <TabsTrigger value="history" className="transition-all duration-200 data-[state=active]:animate-scale-in">Order History</TabsTrigger>
                </TabsList>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="transition-all duration-200 hover:scale-110 active:scale-95"
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
              
              <TabsContent value="menu" className="animate-fade-in">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Search menu items..."
                        className="pl-8 transition-all duration-200 focus:border-chickey-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <AddMenuItemDialog onMenuItemAdded={handleMenuItemAdded} />
                  </div>
                  
                  <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Menu</h2>
                      <TabsList>
                        {categories.map(category => (
                          <TabsTrigger 
                            key={category.id} 
                            value={category.id}
                            className="transition-all duration-200 data-[state=active]:animate-scale-in"
                          >
                            {category.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    
                    {categories.map(category => (
                      <TabsContent key={category.id} value={category.id} className="mt-0">
                        {loading ? (
                          <div className="text-center p-12">
                            <p className="text-muted-foreground">Loading menu items...</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {filteredItems.map(item => (
                                <div 
                                  key={item.id} 
                                  className="relative transition-transform duration-300 hover:scale-102 hover:shadow-lg animate-fade-in"
                                >
                                  <MenuCard item={item} />
                                  <div className="absolute top-2 right-2">
                                    <EditMenuItemDialog 
                                      menuItem={item} 
                                      onMenuItemUpdated={handleMenuItemUpdated} 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            {filteredItems.length === 0 && (
                              <div className="text-center p-12">
                                <p className="text-muted-foreground">No items found</p>
                              </div>
                            )}
                          </>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-0 animate-fade-in">
                <OrderHistory />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="animate-fade-in">
            <Cart />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderManager;
