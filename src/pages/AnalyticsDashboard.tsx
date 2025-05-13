
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface InventoryUsage {
  id: string;
  name: string;
  initialQuantity: number;
  currentQuantity: number;
  usage: number;
  unit: string;
}

interface OrderStats {
  date: string;
  orders: number;
  revenue: number;
}

const AnalyticsDashboard = () => {
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsage[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<{name: string, quantity: number}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get the date range for the past month
        const today = new Date();
        const oneMonthAgo = subMonths(today, 1);
        
        // Fetch order data for the past month
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .gte('timestamp', oneMonthAgo.toISOString());
          
        if (ordersError) throw ordersError;
        
        // Fetch inventory data
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory_items')
          .select('*');
          
        if (inventoryError) throw inventoryError;

        // Fetch order items data for the past month
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('order_items')
          .select('*, orders!inner(*)')
          .gte('orders.timestamp', oneMonthAgo.toISOString());
          
        if (orderItemsError) throw orderItemsError;
        
        // Process order stats by day
        const orderByDay = new Map<string, {orders: number, revenue: number}>();
        
        ordersData.forEach(order => {
          const date = format(new Date(order.timestamp), 'yyyy-MM-dd');
          const existing = orderByDay.get(date) || {orders: 0, revenue: 0};
          
          orderByDay.set(date, {
            orders: existing.orders + 1,
            revenue: existing.revenue + parseFloat(order.total.toString())
          });
        });
        
        const orderStatsArray = Array.from(orderByDay.entries()).map(([date, stats]) => ({
          date,
          orders: stats.orders,
          revenue: stats.revenue
        }));
        
        // Process top selling items
        const itemSales = new Map<string, number>();
        
        orderItemsData.forEach(item => {
          const existing = itemSales.get(item.name) || 0;
          itemSales.set(item.name, existing + item.quantity);
        });
        
        const topItems = Array.from(itemSales.entries())
          .map(([name, quantity]) => ({name, quantity}))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        
        // Set the processed data
        setOrderStats(orderStatsArray);
        setTopSellingItems(topItems);
        
        // For inventory usage, we're estimating based on current levels vs estimated starting levels
        // In a real system, you would track historical inventory changes
        setInventoryUsage(
          inventoryData.map(item => ({
            id: item.id,
            name: item.name,
            initialQuantity: item.quantity + 20, // Placeholder - in a real system this would be from history
            currentQuantity: item.quantity,
            usage: 20, // Placeholder calculated usage
            unit: item.unit
          }))
        );
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Owner Dashboard" />
      
      <main className="flex-grow container py-6">
        <h1 className="text-2xl font-bold mb-6">Past Month Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Orders</CardTitle>
              <CardDescription>Past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-chickey-primary">
                {loading ? '-' : orderStats.reduce((sum, day) => sum + day.orders, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
              <CardDescription>Past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-chickey-secondary">
                {loading ? '-' : `₹${orderStats.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Inventory Items</CardTitle>
              <CardDescription>Current count</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-chickey-dark">
                {loading ? '-' : inventoryUsage.length}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Order Analysis</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Orders & Revenue</CardTitle>
                  <CardDescription>Past 30 days performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>Loading chart data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={orderStats.sort((a, b) => a.date.localeCompare(b.date))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
                        <YAxis yAxisId="left" orientation="left" stroke="#F97316" />
                        <YAxis yAxisId="right" orientation="right" stroke="#FBBF24" />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? `₹${value}` : value,
                            name === 'revenue' ? 'Revenue' : 'Orders'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="orders" yAxisId="left" fill="#F97316" name="Orders" />
                        <Bar dataKey="revenue" yAxisId="right" fill="#FBBF24" name="Revenue (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                  <CardDescription>Most popular menu items</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-60 flex items-center justify-center">
                      <p>Loading data...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead className="text-right">Quantity Sold</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topSellingItems.length > 0 ? (
                          topSellingItems.map(item => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center">No data available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daily Orders</CardTitle>
                  <CardDescription>Detailed breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-60 flex items-center justify-center">
                      <p>Loading data...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderStats.length > 0 ? (
                          orderStats
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 10)
                            .map(day => (
                              <TableRow key={day.date}>
                                <TableCell>{format(new Date(day.date), 'dd MMM yyyy')}</TableCell>
                                <TableCell className="text-right">{day.orders}</TableCell>
                                <TableCell className="text-right">₹{day.revenue.toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center">No data available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Usage Analysis</CardTitle>
                <CardDescription>Past 30 days consumption</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-60 flex items-center justify-center">
                    <p>Loading data...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Initial Quantity</TableHead>
                        <TableHead className="text-right">Current Quantity</TableHead>
                        <TableHead className="text-right">Usage</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryUsage.length > 0 ? (
                        inventoryUsage
                          .sort((a, b) => b.usage - a.usage)
                          .map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.initialQuantity}</TableCell>
                              <TableCell className="text-right">{item.currentQuantity}</TableCell>
                              <TableCell className="text-right">{item.usage}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
