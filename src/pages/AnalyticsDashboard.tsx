
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
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange, FilterPeriod, formatDate, formatDisplayDate, getMonthRange, getYearRange, isDateInRange } from '@/utils/dateUtils';

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

interface TopSellingItem {
  name: string;
  quantity: number;
}

const AnalyticsDashboard = () => {
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsage[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>(getMonthRange(new Date()));
  
  // Generate list of months for dropdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(i);
    return { 
      value: i, 
      label: format(date, 'MMMM')
    };
  });

  // Generate list of years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { value: year, label: year.toString() };
  });
  
  // Change filter period (month, year, all)
  const handlePeriodChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    
    if (period === 'month') {
      setCurrentDateRange(getMonthRange(selectedMonth));
    } else if (period === 'year') {
      const yearDate = new Date();
      yearDate.setFullYear(selectedYear);
      setCurrentDateRange(getYearRange(yearDate));
    } else {
      // 'all' period - set a very wide range
      setCurrentDateRange({
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31)
      });
    }
  };
  
  // Handle month change
  const handleMonthChange = (value: string) => {
    const month = parseInt(value, 10);
    const newDate = new Date();
    newDate.setMonth(month);
    setSelectedMonth(newDate);
    
    if (filterPeriod === 'month') {
      setCurrentDateRange(getMonthRange(newDate));
    }
  };
  
  // Handle year change
  const handleYearChange = (value: string) => {
    const year = parseInt(value, 10);
    setSelectedYear(year);
    
    if (filterPeriod === 'year') {
      const yearDate = new Date();
      yearDate.setFullYear(year);
      setCurrentDateRange(getYearRange(yearDate));
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [currentDateRange]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Format date range for Supabase queries
      const startDate = format(currentDateRange.start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      const endDate = format(currentDateRange.end, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      
      console.log("Fetching data for date range:", { startDate, endDate });
      
      // Fetch order data for the selected period
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      if (ordersError) {
        console.error("Orders fetch error:", ordersError);
        throw ordersError;
      }
      
      console.log("Orders fetched:", ordersData?.length || 0);
      
      // Fetch inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*');
        
      if (inventoryError) throw inventoryError;

      // Fetch order items data for the selected period with a join
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          name,
          quantity,
          price,
          order_id,
          orders!inner(timestamp)
        `)
        .gte('orders.timestamp', startDate)
        .lte('orders.timestamp', endDate);
        
      if (orderItemsError) {
        console.error("Order items fetch error:", orderItemsError);
        throw orderItemsError;
      }
      
      console.log("Order items fetched:", orderItemsData?.length || 0);
      
      // Process order stats by day
      const orderByDay = new Map<string, {orders: number, revenue: number}>();
      
      if (ordersData && ordersData.length > 0) {
        ordersData.forEach(order => {
          const date = formatDate(new Date(order.timestamp));
          const existing = orderByDay.get(date) || {orders: 0, revenue: 0};
          
          orderByDay.set(date, {
            orders: existing.orders + 1,
            revenue: existing.revenue + parseFloat(order.total.toString())
          });
        });
      }
      
      const orderStatsArray = Array.from(orderByDay.entries()).map(([date, stats]) => ({
        date,
        orders: stats.orders,
        revenue: stats.revenue
      }));
      
      console.log("Processed order stats:", orderStatsArray);
      
      // Process top selling items
      const itemSales = new Map<string, number>();
      
      if (orderItemsData && orderItemsData.length > 0) {
        orderItemsData.forEach(item => {
          const existing = itemSales.get(item.name) || 0;
          itemSales.set(item.name, existing + item.quantity);
        });
      }
      
      const topItems = Array.from(itemSales.entries())
        .map(([name, quantity]) => ({name, quantity}))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      console.log("Top selling items:", topItems);
      
      // Set the processed data
      setOrderStats(orderStatsArray);
      setTopSellingItems(topItems);
      
      // For inventory usage, we're estimating based on current levels vs estimated starting levels
      if (inventoryData) {
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
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please check console for details.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // For period display text
  const getPeriodDisplayText = () => {
    if (filterPeriod === 'month') {
      return format(selectedMonth, 'MMMM yyyy');
    } else if (filterPeriod === 'year') {
      return selectedYear.toString();
    }
    return 'All Time';
  };

  // Function to handle manual refresh of data
  const handleRefreshData = () => {
    fetchData();
    toast({
      title: "Refreshing data",
      description: "Dashboard data is being updated...",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <Header title="Owner Dashboard" />
      
      <main className="flex-grow container py-6 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
              size="sm"
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Refresh Data
            </Button>
            
            <Tabs 
              value={filterPeriod} 
              onValueChange={(value) => handlePeriodChange(value as FilterPeriod)}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="month" className="transition-all duration-200 data-[state=active]:animate-scale-in">Monthly</TabsTrigger>
                <TabsTrigger value="year" className="transition-all duration-200 data-[state=active]:animate-scale-in">Yearly</TabsTrigger>
                <TabsTrigger value="all" className="transition-all duration-200 data-[state=active]:animate-scale-in">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {filterPeriod === 'month' && (
              <Select value={selectedMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[150px] transition-all duration-200 hover:border-chickey-primary">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="animate-fade-in">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {(filterPeriod === 'month' || filterPeriod === 'year') && (
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px] transition-all duration-200 hover:border-chickey-primary">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="animate-fade-in">
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value.toString()}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-medium">Showing data for: {getPeriodDisplayText()}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="transition-transform duration-300 hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Orders</CardTitle>
              <CardDescription>Current period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-chickey-primary animate-fade-in">
                {loading ? '-' : orderStats.reduce((sum, day) => sum + day.orders, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="transition-transform duration-300 hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
              <CardDescription>Current period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-chickey-secondary animate-fade-in">
                {loading ? '-' : `₹${orderStats.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}`}
              </p>
            </CardContent>
          </Card>
          
          <Card className="transition-transform duration-300 hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Inventory Items</CardTitle>
              <CardDescription>Current count</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-chickey-dark animate-fade-in">
                {loading ? '-' : inventoryUsage.length}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="transition-all duration-200 data-[state=active]:animate-scale-in">Order Analysis</TabsTrigger>
            <TabsTrigger value="inventory" className="transition-all duration-200 data-[state=active]:animate-scale-in">Inventory Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1 lg:col-span-2 transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Daily Orders & Revenue</CardTitle>
                  <CardDescription>Performance for {getPeriodDisplayText()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>Loading chart data...</p>
                    </div>
                  ) : orderStats.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>No order data available for the selected period</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400} className="animate-fade-in">
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
                          animationDuration={300}
                        />
                        <Legend />
                        <Bar dataKey="orders" yAxisId="left" fill="#F97316" name="Orders" animationDuration={1500} />
                        <Bar dataKey="revenue" yAxisId="right" fill="#FBBF24" name="Revenue (₹)" animationDuration={1500} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                  <CardDescription>Most popular menu items</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-60 flex items-center justify-center">
                      <p>Loading data...</p>
                    </div>
                  ) : topSellingItems.length === 0 ? (
                    <div className="h-60 flex items-center justify-center">
                      <p>No sales data available for the selected period</p>
                    </div>
                  ) : (
                    <Table className="animate-fade-in">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead className="text-right">Quantity Sold</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topSellingItems.map(item => (
                          <TableRow key={item.name} className="transition-colors hover:bg-muted/50">
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              <Card className="transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Daily Orders</CardTitle>
                  <CardDescription>Detailed breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-60 flex items-center justify-center">
                      <p>Loading data...</p>
                    </div>
                  ) : orderStats.length === 0 ? (
                    <div className="h-60 flex items-center justify-center">
                      <p>No order data available for the selected period</p>
                    </div>
                  ) : (
                    <Table className="animate-fade-in">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderStats
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .slice(0, 10)
                          .map(day => (
                            <TableRow key={day.date} className="transition-colors hover:bg-muted/50">
                              <TableCell>{formatDisplayDate(day.date)}</TableCell>
                              <TableCell className="text-right">{day.orders}</TableCell>
                              <TableCell className="text-right">₹{day.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <Card className="transition-transform duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Inventory Usage Analysis</CardTitle>
                <CardDescription>Current period consumption</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-60 flex items-center justify-center">
                    <p>Loading data...</p>
                  </div>
                ) : (
                  <Table className="animate-fade-in">
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
                            <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
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
