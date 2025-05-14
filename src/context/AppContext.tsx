import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem } from '../data/menuItems';
import { InventoryItem } from '../data/inventoryItems';
import { menuItems as initialMenuItems } from '../data/menuItems';
import { inventoryItems as initialInventoryItems } from '../data/inventoryItems';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { fetchOrderStats, useDataRefresh } from '@/hooks/use-data-refresh';

// Define the Order type for tracking daily orders
interface Order {
  id: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  timestamp: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface AppContextType {
  // Menu state
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  
  // Cart state
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Inventory state
  inventoryItems: InventoryItem[];
  updateInventoryItem: (id: string, newQuantity: number) => void;
  
  // Order processing
  processOrder: () => boolean;
  
  // Stats
  totalOrders: number;
  totalRevenue: number;
  refreshData: () => void;
  isLoading: boolean;

  // Daily order tracking
  orders: Order[];
  getOrdersByDate: (date: Date) => Order[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const savedMenuItems = localStorage.getItem('chickey-menu');
    return savedMenuItems ? JSON.parse(savedMenuItems) : initialMenuItems;
  });
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const savedInventoryItems = localStorage.getItem('chickey-inventory');
    return savedInventoryItems ? JSON.parse(savedInventoryItems) : initialInventoryItems;
  });
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const { refreshTrigger, triggerRefresh, isLoading, setIsLoading } = useDataRefresh();

  // Initialize orders state
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { totalOrders, totalRevenue, orders: fetchedOrders, orderItems } = await fetchOrderStats();
        
        // Set the totals
        setTotalOrders(totalOrders);
        setTotalRevenue(totalRevenue);
        
        // Process orders to match our local format
        if (fetchedOrders && fetchedOrders.length > 0) {
          const processedOrders: Order[] = fetchedOrders.map(order => {
            // Find all items for this order
            const items = orderItems?.filter(item => item.order_id === order.id) || [];
            
            return {
              id: order.id,
              total: parseFloat(order.total.toString()),
              timestamp: new Date(order.timestamp).getTime(),
              items: items.map(item => ({
                id: item.menu_item_id || item.id,
                name: item.name,
                price: parseFloat(item.price.toString()),
                quantity: item.quantity
              }))
            };
          });
          
          setOrders(processedOrders);
        }
        
        console.log('Data loaded successfully from Supabase:', { totalOrders, totalRevenue });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [refreshTrigger]);
  
  // Refresh function
  const refreshData = () => {
    triggerRefresh();
  };
  
  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('chickey-menu', JSON.stringify(menuItems));
  }, [menuItems]);
  
  useEffect(() => {
    localStorage.setItem('chickey-inventory', JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCartItems(prevItems => {
      const exists = prevItems.find(cartItem => cartItem.id === item.id);
      if (exists) {
        return prevItems.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your order`,
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Reduce inventory based on order items and their ingredients
  const updateInventoryFromOrder = async (orderItems: CartItem[]) => {
    try {
      // For each ordered item
      for (const orderItem of orderItems) {
        // Find the menu item to get its ingredients
        const menuItem = menuItems.find(item => item.id === orderItem.id);
        
        if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
          // For each ingredient in the menu item
          for (const ingredient of menuItem.ingredients) {
            // Find the inventory item
            const inventoryItem = inventoryItems.find(item => item.id === ingredient.id);
            
            if (inventoryItem) {
              // Calculate how much to reduce based on order quantity
              const reduceAmount = ingredient.quantity * orderItem.quantity;
              const newQuantity = Math.max(0, inventoryItem.quantity - reduceAmount);
              
              // Update the inventory in Supabase
              const { error } = await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity })
                .eq('id', inventoryItem.id);
                
              if (error) {
                console.error(`Error updating inventory item ${inventoryItem.id}:`, error);
                throw error;
              }
              
              // Update local state
              setInventoryItems(prevItems => 
                prevItems.map(item => 
                  item.id === inventoryItem.id ? { ...item, quantity: newQuantity } : item
                )
              );
              
              console.log(`Reduced ${reduceAmount} ${inventoryItem.unit} of ${inventoryItem.name}`);
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating inventory from order:', error);
      toast({
        title: "Inventory Update Error",
        description: "There was an error updating the inventory. Please check stock levels manually.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Process an order - enhanced for reliable database storage
  const processOrder = (): boolean => {
    // Calculate order total
    const orderTotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity, 0
    );
    
    // Create a proper UUID for the order
    const orderId = uuidv4();
    
    // Create a new order record
    const newOrder: Order = {
      id: orderId,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: orderTotal,
      timestamp: Date.now()
    };
    
    // Insert order into Supabase with improved error handling and retries
    const addOrderToSupabase = async () => {
      try {
        // Insert order record with proper UUID
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            id: orderId, // Using proper UUID format
            total: orderTotal,
            timestamp: new Date(newOrder.timestamp).toISOString()
          })
          .select()
          .single();
          
        if (orderError) {
          console.error('Error inserting order:', orderError);
          throw orderError;
        }
        
        console.log('Order inserted successfully:', orderId);
        
        // Insert order items with transaction pattern
        const orderItems = cartItems.map(item => ({
          order_id: orderId, // Using proper UUID format
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) {
          console.error('Error inserting order items:', itemsError);
          throw itemsError;
        }
        
        console.log('Order items saved successfully for order:', orderId);
        
        // Update inventory based on order items
        await updateInventoryFromOrder(cartItems);
        
        // Show confirmation toast on successful save
        toast({
          title: "Order saved successfully",
          description: `Order ID: ${orderId.substring(0, 8)}... has been saved to the database`,
          variant: "default",
        });
        
        // Refresh data after successful order
        refreshData();
        
      } catch (error) {
        console.error('Error saving order to Supabase:', error);
        toast({
          title: "Warning",
          description: "Order processed locally, but there was an error saving to the database. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Update state
    setTotalOrders(prev => prev + 1);
    setTotalRevenue(prev => prev + orderTotal);
    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    // Save to Supabase
    addOrderToSupabase();
    
    // Clear cart after order processing
    clearCart();
    
    // Show order placement toast
    toast({
      title: "Order placed successfully",
      description: `Total: ₹${orderTotal.toFixed(2)}`,
    });
    
    return true;
  };

  // Update inventory item
  const updateInventoryItem = (id: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity cannot be negative",
        variant: "destructive"
      });
      return;
    }
    
    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
    
    // Update in Supabase
    const updateSupabase = async () => {
      try {
        const { error } = await supabase
          .from('inventory_items')
          .update({ quantity: newQuantity })
          .eq('id', id);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error updating inventory in Supabase:', error);
        toast({
          title: "Warning",
          description: "Inventory updated locally, but there was an error saving to the database.",
          variant: "destructive"
        });
      }
    };
    
    // Call non-blocking
    updateSupabase();
    
    toast({
      title: "Inventory updated",
      description: "The inventory has been updated successfully",
    });
  };

  // Get orders by date
  const getOrdersByDate = (date: Date): Order[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
  };

  const value = {
    menuItems,
    setMenuItems,
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    inventoryItems,
    updateInventoryItem,
    processOrder,
    totalOrders,
    totalRevenue,
    orders,
    getOrdersByDate,
    refreshData,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
