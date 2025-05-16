
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';

interface HistoryItem {
  id: string;
  inventory_item_id: string;
  previous_quantity: number;
  new_quantity: number;
  timestamp: string;
  inventory_item_name?: string;
  inventory_item_unit?: string;
}

interface DailySnapshot {
  id: string;
  name: string;
  unit: string;
  start_quantity: number;
  end_quantity: number;
  net_change: number;
}

interface MonthlySnapshot extends DailySnapshot {}

const InventoryHistory = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailySnapshots, setDailySnapshots] = useState<DailySnapshot[]>([]);
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const { inventoryItems } = useApp();
  
  // Generate past 12 months for selection
  const pastMonths = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });
  
  // Fetch history data
  useEffect(() => {
    const fetchHistoryData = async () => {
      setLoading(true);
      try {
        // For demo purpose, we'll generate some mock data
        // In a real implementation, this would be a call to supabase
        const mockHistory: HistoryItem[] = [];
        const today = new Date();
        
        // Generate 30 days of history for each inventory item
        inventoryItems.forEach(item => {
          for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            // Morning entry
            mockHistory.push({
              id: `morning-${item.id}-${i}`,
              inventory_item_id: item.id,
              previous_quantity: Math.floor(item.quantity * 0.8 + Math.random() * 20),
              new_quantity: item.quantity,
              timestamp: new Date(date.setHours(9, 0, 0)).toISOString(),
              inventory_item_name: item.name,
              inventory_item_unit: item.unit
            });
            
            // Evening entry
            mockHistory.push({
              id: `evening-${item.id}-${i}`,
              inventory_item_id: item.id,
              previous_quantity: item.quantity,
              new_quantity: Math.floor(item.quantity * 0.7 + Math.random() * 10),
              timestamp: new Date(date.setHours(17, 0, 0)).toISOString(),
              inventory_item_name: item.name,
              inventory_item_unit: item.unit
            });
          }
        });
        
        setHistoryItems(mockHistory);
        
        // Extract unique dates from history
        const dates = [...new Set(mockHistory.map(item => 
          format(new Date(item.timestamp), 'yyyy-MM-dd')
        ))].sort().reverse();
        
        setAvailableDates(dates);
        
      } catch (error) {
        console.error('Error fetching inventory history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoryData();
  }, [inventoryItems]);
  
  // Process daily snapshots when date changes
  useEffect(() => {
    if (!selectedDate || historyItems.length === 0) return;
    
    const dayStart = new Date(`${selectedDate}T00:00:00`);
    const dayEnd = new Date(`${selectedDate}T23:59:59`);
    
    // Get items for the selected day
    const dayItems = historyItems.filter(item => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= dayStart && timestamp <= dayEnd;
    });
    
    const processedItems = inventoryItems.map(invItem => {
      // Find the first and last entries for this item on the selected day
      const itemHistory = dayItems
        .filter(h => h.inventory_item_id === invItem.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const firstEntry = itemHistory[0];
      const lastEntry = itemHistory[itemHistory.length - 1];
      
      return {
        id: invItem.id,
        name: invItem.name,
        unit: invItem.unit,
        start_quantity: firstEntry ? firstEntry.previous_quantity : invItem.quantity,
        end_quantity: lastEntry ? lastEntry.new_quantity : invItem.quantity,
        net_change: (lastEntry ? lastEntry.new_quantity : invItem.quantity) - 
                    (firstEntry ? firstEntry.previous_quantity : invItem.quantity)
      };
    });
    
    setDailySnapshots(processedItems);
  }, [selectedDate, historyItems, inventoryItems]);
  
  // Process monthly snapshots when month changes
  useEffect(() => {
    if (!selectedMonth || historyItems.length === 0) return;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    
    // Get items for the selected month
    const monthItems = historyItems.filter(item => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= monthStart && timestamp <= monthEnd;
    });
    
    const processedItems = inventoryItems.map(invItem => {
      // Find the first and last entries for this item in the selected month
      const itemHistory = monthItems
        .filter(h => h.inventory_item_id === invItem.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const firstEntry = itemHistory[0];
      const lastEntry = itemHistory[itemHistory.length - 1];
      
      return {
        id: invItem.id,
        name: invItem.name,
        unit: invItem.unit,
        start_quantity: firstEntry ? firstEntry.previous_quantity : invItem.quantity,
        end_quantity: lastEntry ? lastEntry.new_quantity : invItem.quantity,
        net_change: (lastEntry ? lastEntry.new_quantity : invItem.quantity) - 
                    (firstEntry ? firstEntry.previous_quantity : invItem.quantity)
      };
    });
    
    setMonthlySnapshots(processedItems);
  }, [selectedMonth, historyItems, inventoryItems]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map(date => (
                      <SelectItem key={date} value={date}>
                        {format(new Date(date), 'dd MMM yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Start of Day</TableHead>
                  <TableHead>End of Day</TableHead>
                  <TableHead>Net Change</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading history data...
                    </TableCell>
                  </TableRow>
                ) : dailySnapshots.length > 0 ? (
                  dailySnapshots.map(snapshot => (
                    <TableRow key={snapshot.id}>
                      <TableCell className="font-medium">{snapshot.name}</TableCell>
                      <TableCell>{snapshot.start_quantity}</TableCell>
                      <TableCell>{snapshot.end_quantity}</TableCell>
                      <TableCell>
                        <Badge className={snapshot.net_change < 0 ? 'bg-red-500' : 'bg-green-500'}>
                          {snapshot.net_change > 0 ? '+' : ''}{snapshot.net_change}
                        </Badge>
                      </TableCell>
                      <TableCell>{snapshot.unit}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No history data available for this date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {pastMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Start of Month</TableHead>
                  <TableHead>End of Month</TableHead>
                  <TableHead>Net Change</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading history data...
                    </TableCell>
                  </TableRow>
                ) : monthlySnapshots.length > 0 ? (
                  monthlySnapshots.map(snapshot => (
                    <TableRow key={snapshot.id}>
                      <TableCell className="font-medium">{snapshot.name}</TableCell>
                      <TableCell>{snapshot.start_quantity}</TableCell>
                      <TableCell>{snapshot.end_quantity}</TableCell>
                      <TableCell>
                        <Badge className={snapshot.net_change < 0 ? 'bg-red-500' : 'bg-green-500'}>
                          {snapshot.net_change > 0 ? '+' : ''}{snapshot.net_change}
                        </Badge>
                      </TableCell>
                      <TableCell>{snapshot.unit}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No history data available for this month.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InventoryHistory;
