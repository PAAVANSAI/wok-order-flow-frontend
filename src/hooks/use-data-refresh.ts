
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export function useDataRefresh(initialRefresh = true) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    refreshTrigger,
    triggerRefresh,
    isLoading,
    setIsLoading
  };
}

export async function fetchOrderStats() {
  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
      
    if (ordersError) throw ordersError;
    
    // Get all order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*');
      
    if (itemsError) throw itemsError;
    
    // Calculate stats
    const totalOrders = orders ? orders.length : 0;
    const totalRevenue = orders 
      ? orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) 
      : 0;

    return { totalOrders, totalRevenue, orders, orderItems };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    toast({
      title: "Error loading data",
      description: "Failed to load order statistics. Please try again.",
      variant: "destructive"
    });
    return { totalOrders: 0, totalRevenue: 0, orders: [], orderItems: [] };
  }
}
